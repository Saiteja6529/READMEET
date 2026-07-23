/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import type { Request } from "express";

// MCP SDK Imports
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

dotenv.config();

console.log("--- AI_ASSIST Server Initializing ---");
console.log("Checking GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "LOADED" : "MISSING");
console.log("Checking GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? "LOADED" : "MISSING");
console.log("--------------------------------------");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const JSON_BODY_LIMIT = "100mb";

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ limit: JSON_BODY_LIMIT, extended: true }));

  app.use(((err, _req, res, next) => {
    if (err?.type === "entity.too.large" || err?.status === 413) {
      return res.status(413).json({
        error: {
          message: "The request entity is too large. Keep audio uploads under 50 MB or split recordings into smaller chunks.",
          code: 413,
          status: "Payload Too Large",
        },
      });
    }
    next(err);
  }) as express.ErrorRequestHandler);

  const sessionSecret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && !sessionSecret) {
    console.error("❌ CRITICAL ERROR: SESSION_SECRET env variable is required in production!");
    process.exit(1);
  }
  
  // session setup - secure in production, lax sameSite
  app.use(
    cookieSession({
      name: "session",
      keys: [sessionSecret || "meeting-ai-secret"],
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
  );

  // --- AUTHENTICATION MIDDLEWARE ---
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: "Unauthorized. Please log in first." });
    }
    next();
  };

  // --- MCP GITHUB SETUP ---
  const githubTransport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { 
      ...process.env, 
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || "" 
    }
  });

  const mcpClient = new Client({
    name: "ai-assist-github-client",
    version: "1.0.0"
  }, {
    capabilities: {} 
  });

  let mcpConnected = false;
  try {
    await mcpClient.connect(githubTransport);
    console.log("✅ GitHub MCP Server Connected");
    mcpConnected = true;
  } catch (err) {
    console.error("❌ Failed to connect to GitHub MCP:", err);
    mcpConnected = false;
  }

  // Helper to create OAuth Client on demand
  const createOAuthClient = () => {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL || "http://localhost:3000"}/auth/google/callback`
    );
  };

  // Auth Routes
  app.get("/api/auth/google/url", (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      // Return demo mode if ID is not setup
      return res.json({ url: null, isDemo: true });
    }
    const client = createOAuthClient();
    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      prompt: "consent",
    });
    res.json({ url });
  });

  app.post("/api/auth/login-demo", (req, res) => {
    const mockUser = {
      id: "demo-user-123",
      email: "demo.user@example.com",
      name: "Demo User",
      picture: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
    };
    if (req.session) {
      req.session.tokens = { access_token: "mock-access-token" };
      req.session.user = mockUser;
    }
    res.json({ success: true, user: mockUser });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const client = createOAuthClient();
      const { tokens } = await client.getToken(code as string);
      client.setCredentials(tokens);
      
      const oauth2 = google.oauth2({ version: "v2", auth: client });
      const { data: userInfo } = await oauth2.userinfo.get();

      if (req.session) {
        req.session.tokens = tokens;
        req.session.user = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        };
      }
      
      const appUrl = process.env.APP_URL || (req.protocol + '://' + req.get('host'));
      const safeUserInfo = encodeURIComponent(JSON.stringify(req.session!.user));
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS',
                  user: JSON.parse(decodeURIComponent("${safeUserInfo}"))
                }, "${appUrl}");
                window.close();
              } else {
                window.location.href = '/dashboard';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // --- GITHUB MCP PROXY ENDPOINTS ---

  const ALLOWED_MCP_TOOLS = ["get_file_contents", "create_or_update_file"];

  app.post("/api/github/proxy", requireAuth, async (req, res) => {
    if (!mcpConnected) {
      return res.status(503).json({ error: "GitHub MCP server is currently unavailable" });
    }

    const { toolName, arguments: toolArgs } = req.body;
    
    if (!toolName || typeof toolName !== "string") {
      return res.status(400).json({ error: "toolName is required and must be a string." });
    }

    if (!ALLOWED_MCP_TOOLS.includes(toolName)) {
      return res.status(403).json({ error: `Tool '${toolName}' is not allowed or whitelisted.` });
    }

    if (!toolArgs || typeof toolArgs !== "object") {
      return res.status(400).json({ error: "arguments must be an object." });
    }

    // Input Validation
    const { owner, repo, path: filePath, branch } = toolArgs;
    if (typeof owner !== "string" || !owner.trim()) {
      return res.status(400).json({ error: "arguments.owner must be a non-empty string." });
    }
    if (typeof repo !== "string" || !repo.trim()) {
      return res.status(400).json({ error: "arguments.repo must be a non-empty string." });
    }
    if (typeof filePath !== "string" || !filePath.trim()) {
      return res.status(400).json({ error: "arguments.path must be a non-empty string." });
    }
    if (branch !== undefined && (typeof branch !== "string" || !branch.trim())) {
      return res.status(400).json({ error: "arguments.branch must be a non-empty string." });
    }

    if (toolName === "create_or_update_file") {
      const { content, message } = toolArgs;
      if (typeof content !== "string") {
        return res.status(400).json({ error: "arguments.content must be a string for file updates." });
      }
      if (typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "arguments.message must be a non-empty string." });
      }
    }

    try {
      const result = await mcpClient.callTool({
        name: toolName,
        arguments: toolArgs
      });
      res.json(result);
    } catch (error) {
      console.error("MCP Tool Error:", error);
      const errorMessage = error instanceof Error ? error.message : "GitHub interaction failed";
      res.status(500).json({
        error: errorMessage,
      });
    }
  });

  app.get("/api/github/tools", requireAuth, async (req, res) => {
    if (!mcpConnected) {
      return res.status(503).json({ error: "GitHub MCP server is currently unavailable" });
    }
    try {
      const tools = await mcpClient.listTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ error: "Could not list GitHub tools" });
    }
  });

  // --- RAW GEMINI API PROXY ENDPOINT ---

  const HOP_BY_HOP_HEADERS = new Set([
    "connection",
    "content-encoding",
    "content-length",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "proxy-authenticate",
    "proxy-authorization",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ]);

  const buildProxyBody = (req: Request) => {
    if (req.method === "GET" || req.method === "HEAD") return undefined;

    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("application/json") && req.body !== undefined) {
      return JSON.stringify(req.body);
    }

    if (contentType.includes("application/x-www-form-urlencoded") && req.body !== undefined) {
      return new URLSearchParams(req.body as Record<string, string>).toString();
    }

    if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
      return req.body;
    }

    return req;
  };

  app.all("/api/gemini-proxy/*", requireAuth, async (req, res) => {
    try {
      const targetPath = req.params[0] || "";
      const queryParams = new URLSearchParams(req.query as any);
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || String(req.query.key || "");
      if (!geminiApiKey) {
        return res.status(500).json({
          error: {
            message: "Gemini API key is not configured on the server.",
            code: 500,
            status: "Configuration Error",
          },
        });
      }

      queryParams.set("key", geminiApiKey);

      const targetUrl = `https://generativelanguage.googleapis.com/${targetPath}?${queryParams.toString()}`;

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        const lowerKey = key.toLowerCase();
        if (!HOP_BY_HOP_HEADERS.has(lowerKey) && typeof value === 'string') {
          headers[key] = value;
        }
      }

      const body = buildProxyBody(req);
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
        duplex: body && typeof body !== "string" ? "half" : undefined,
      } as RequestInit & { duplex?: "half" });

      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      if (response.status === 204 || !response.body) {
        res.end();
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      console.error("Gemini raw proxy error:", error);
      res.status(500).json({
        error: {
          message: "Gemini proxy failed while forwarding the request.",
          code: 500,
          status: "Proxy Error",
        },
      });
    }
  });

  // --- GENERAL API ROUTES ---

  app.get("/api/auth/status", (req, res) => {
    res.json({ 
      connected: !!req.session?.tokens,
      user: req.session?.user || null
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: 24679 }, // avoid conflict with port 24678
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AI_ASSIST running at http://localhost:${PORT}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Run this command to free it, then restart:\n`);
      console.error(`   npx kill-port ${PORT}\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

startServer();
