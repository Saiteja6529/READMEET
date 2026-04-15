# GitHub Agentic Workspace - Implementation Guide

## 🎯 Overview

The **GitHub Agentic Workspace** is a conversational AI-powered feature that allows users to create or update GitHub repository README files through an intelligent interview process. The AI assistant guides users through gathering project information and generates professional, well-structured README content.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **UI Library**: Tailwind CSS 4, Lucide-React icons, Motion (Framer Motion)
- **AI**: Google Gemini 1.5 Flash Latest (`@google/generative-ai`)
- **Backend**: Node.js with Express
- **GitHub Integration**: MCP (Model Context Protocol) Server

### Core Components

#### 1. **GitHubModel.ts** - AI Service Layer
Location: `src/services/GitHubModel.ts`

**Key Features:**
- Initializes Gemini AI with function calling capabilities
- Defines two tools using `SchemaType` enum:
  - `get_file_contents`: Reads existing README.md
  - `create_or_update_file`: Creates/updates README on GitHub
- Manages chat sessions with conversation history
- Handles tool execution callbacks
- Provides error handling and fallback messages

**Critical Implementation Details:**
```typescript
// Tool definitions use SchemaType to avoid JSON schema errors
{
  name: "get_file_contents",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      owner: { type: SchemaType.STRING },
      repo: { type: SchemaType.STRING },
      path: { type: SchemaType.STRING }
    },
    required: ["owner", "repo", "path"]
  }
}
```

**System Instruction:**
The AI is instructed to:
- **CREATE mode**: Interview the user first, NO tools initially
- **UPDATE mode**: Immediately use `get_file_contents` to read existing README
- Only call `create_or_update_file` when user confirms satisfaction
- Be friendly, professional, and thorough

#### 2. **useGitHubChat.ts** - State Management Hook
Location: `src/hooks/useGitHubChat.ts`

**Workflow States:**
```typescript
type WorkflowStep = 'IDLE' | 'CHATTING' | 'PREVIEW' | 'SUCCESS';
```

**State Flow:**
1. **IDLE**: User enters repo details and selects CREATE or UPDATE
2. **CHATTING**: Conversational interview with AI
3. **PREVIEW**: Shows generated README for user approval
4. **SUCCESS**: Confirmation after successful GitHub publish

**Key Functions:**
- `startWorkflow(mode)`: Initializes chat session based on CREATE/UPDATE mode
- `sendMessage(message)`: Sends user messages to AI
- `handleBackgroundTool()`: Executes `get_file_contents` transparently
- `confirmPublish()`: Publishes README to GitHub via backend proxy
- `backToChat()`: Returns to chat from preview for modifications
- `reset()`: Resets entire workflow

**Message History:**
```typescript
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

#### 3. **GitHubManager.tsx** - UI Component
Location: `src/components/GitHubManager.tsx`

**UI Sections:**
1. **Header**: Title and Cancel button
2. **Repository Input**: Owner and repo name fields
3. **Mode Selection**: CREATE or UPDATE buttons
4. **Chat Interface**: Message history with auto-scroll
5. **Preview Screen**: Shows generated README with commit message
6. **Success Screen**: Confirmation with auto-reset

**UX Features:**
- Auto-scroll to latest message
- Loading indicators ("AI is thinking...")
- Error display with helpful messages
- Keyboard shortcuts (Enter to send)
- Smooth animations with Motion
- Dark mode support

## 🔄 Workflow Details

### CREATE Mode Flow

```
1. User clicks "Create README"
   ↓
2. AI introduces itself and asks:
   - What is the purpose of this project?
   - What are the main features?
   - What technologies are used?
   - Installation/usage instructions?
   ↓
3. User provides information through chat
   ↓
4. AI continues asking follow-up questions
   ↓
5. When user says "looks good" or "I'm satisfied"
   ↓
6. AI calls create_or_update_file tool
   ↓
7. UI shows PREVIEW screen with generated README
   ↓
8. User clicks "I'm Satisfied - Publish to GitHub"
   ↓
9. Backend executes GitHub MCP tool
   ↓
10. SUCCESS screen shown, auto-reset after 3s
```

### UPDATE Mode Flow

```
1. User clicks "Update README"
   ↓
2. AI immediately calls get_file_contents tool
   ↓
3. Backend fetches current README.md
   ↓
4. AI summarizes existing content and asks:
   "What would you like to update?"
   ↓
5. User describes desired changes
   ↓
6. AI continues conversation until satisfied
   ↓
7. [Same as CREATE mode steps 6-10]
```

## 🛠️ Backend Integration

### GitHub MCP Proxy Endpoint
Location: `server.ts`

```typescript
app.post("/api/github/proxy", async (req, res) => {
  const { toolName, arguments: toolArgs } = req.body;
  const result = await mcpClient.callTool({
    name: toolName,
    arguments: toolArgs
  });
  res.json(result);
});
```

**Available Tools:**
- `get_file_contents`: Reads file from GitHub
- `create_or_update_file`: Creates or updates file on GitHub
- Requires `GITHUB_TOKEN` environment variable

## 🎨 UI/UX Design Principles

### Visual Hierarchy
- **Blue**: AI assistant messages and thinking states
- **Green**: Success states and preview/publish actions
- **Red**: Errors and cancel actions
- **Slate**: User messages and neutral UI elements

### Animations
- Smooth fade-in for messages
- Scale animations for state transitions
- Spring physics for success checkmark
- Auto-scroll for chat continuity

### Accessibility
- Clear loading states
- Disabled states for inputs during processing
- Confirmation dialogs for destructive actions
- Keyboard navigation support

## 📝 Environment Variables

Required in `.env`:
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_personal_access_token
```

## 🚀 Usage Example

### Creating a New README

1. Enter repository details:
   - Owner: `octocat`
   - Repo: `hello-world`

2. Click "Create README"

3. AI asks: "Hello! I'm your README Expert. What is the purpose of your project?"

4. User responds: "It's a simple web app for task management"

5. AI asks: "Great! What are the main features?"

6. User responds: "Add tasks, mark complete, filter by status"

7. AI asks: "What technologies are you using?"

8. User responds: "React, TypeScript, Tailwind CSS"

9. AI generates README and shows preview

10. User clicks "I'm Satisfied - Publish to GitHub"

11. README is published! ✅

## 🔧 Customization

### Modifying AI Behavior
Edit the `systemInstruction` in `GitHubModel.ts`:
```typescript
systemInstruction: `You are a professional README Expert...`
```

### Adding More Tools
Add new function declarations to the `tools` array:
```typescript
{
  name: "your_tool_name",
  description: "What it does",
  parameters: {
    type: SchemaType.OBJECT,
    properties: { /* ... */ }
  }
}
```

### Styling
- Global styles: `src/index.css`
- Component styles: Tailwind classes in `GitHubManager.tsx`
- Dark mode: Uses Tailwind's `dark:` variant

## 🐛 Troubleshooting

### Common Issues

**1. "API key error"**
- Check `VITE_GEMINI_API_KEY` in `.env`
- Ensure API key is valid and has quota

**2. "GitHub publish failed"**
- Verify `GITHUB_TOKEN` has write permissions
- Check repository exists and you have access
- Ensure MCP server is running

**3. TypeScript errors**
- Run `npm run lint` to check for errors
- Ensure all dependencies are installed
- Check import paths are correct

**4. AI not using tools correctly**
- Review system instruction in `GitHubModel.ts`
- Check tool definitions use `SchemaType` enum
- Verify callback functions in `useGitHubChat.ts`

## 📊 Testing Checklist

- [ ] CREATE mode: AI interviews before using tools
- [ ] UPDATE mode: AI reads existing README first
- [ ] Preview shows correct content and commit message
- [ ] "Modify More" button returns to chat
- [ ] Publish successfully writes to GitHub
- [ ] Success screen shows and auto-resets
- [ ] Cancel button works at any stage
- [ ] Error messages display correctly
- [ ] Dark mode works properly
- [ ] Mobile responsive layout

## 🎓 Key Learnings

### Why SchemaType Enum?
Using `SchemaType.OBJECT` and `SchemaType.STRING` instead of plain strings prevents JSON schema validation errors in the Gemini API.

### Why Separate Tool Handling?
- `get_file_contents`: Executed in background, result fed back to AI
- `create_or_update_file`: Triggers preview, requires user confirmation

This separation ensures users always review before publishing.

### Why Message History?
Maintaining a `messages` array allows:
- Displaying full conversation
- Better UX with scrollable chat
- Debugging conversation flow
- Future feature: Export chat history

## 🔮 Future Enhancements

1. **Multi-file Support**: Edit multiple files in one session
2. **Template Library**: Pre-built README templates
3. **Markdown Preview**: Live rendering of generated README
4. **Version History**: Compare with previous versions
5. **Collaboration**: Share draft with team before publishing
6. **Export Options**: Download README without publishing
7. **Custom Sections**: Let users define custom README sections
8. **AI Suggestions**: Proactive improvement suggestions

## 📚 References

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Motion (Framer Motion)](https://motion.dev/)

---

**Built with ❤️ using AI-powered development**
