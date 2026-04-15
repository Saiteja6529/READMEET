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

  app.use(express.json());
  
  // session setup - secure: false for local development
  app.use(
    cookieSession({
      name: "session",
      keys: [process.env.SESSION_SECRET || "meeting-ai-secret"],
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
      sameSite: "lax",
    })
  );

  // --- MCP GITHUB SETUP ---
  
  const githubTransport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { 
      ...process.env, 
      // The ! tells TS we guarantee this variable exists
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN! 
    }
  });

  const mcpClient = new Client({
    name: "ai-assist-github-client",
    version: "1.0.0"
  }, {
    // capabilities must be empty or use valid sub-properties like 'experimental'
    capabilities: {} 
  });

  try {
    await mcpClient.connect(githubTransport);
    console.log("✅ GitHub MCP Server Connected");
  } catch (err) {
    console.error("❌ Failed to connect to GitHub MCP:", err);
  }

  // --- GOOGLE OAUTH SETUP ---

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL || "http://localhost:3000"}/auth/google/callback`
  );

  // Auth Routes
  app.get("/api/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
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

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);
      
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
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
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS',
                  user: ${JSON.stringify(req.session!.user)}
                }, '*');
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

  // Use this to let the AI call GitHub tools
  app.post("/api/github/proxy", async (req, res) => {
    const { toolName, arguments: toolArgs } = req.body;
    try {
      const result = await mcpClient.callTool({
        name: toolName,
        arguments: toolArgs
      });
      res.json(result);
    } catch (error) {
      console.error("MCP Tool Error:", error);
      const errorMessage = error instanceof Error ? error.message : "GitHub interaction failed";
      const errorDetails =
        typeof error === "object" && error !== null && "data" in error
          ? (error as { data?: unknown }).data
          : undefined;

      res.status(500).json({
        error: errorMessage,
        details: errorDetails ?? null,
      });
    }
  });

  // Use this to check which tools are available
  app.get("/api/github/tools", async (req, res) => {
    try {
      const tools = await mcpClient.listTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ error: "Could not list GitHub tools" });
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
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AI_ASSIST running at http://localhost:${PORT}`);
  });
}

startServer();
