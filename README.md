# READMEET - Smart AI Meeting Assistant

READMEET is a browser-based meeting recorder and analysis tool that captures audio, transcribes meetings, and extracts summaries, action items, keywords, and more.

## Run Locally

Prerequisites:
- Node.js 20+

1. Install dependencies:
   `npm install`
2. Create a `.env` file in the project root and add your keys:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key
   GITHUB_TOKEN=your_github_personal_access_token
   SESSION_SECRET=your_session_secret
   APP_URL=http://localhost:3000
   ```
3. Start the development server:
   `npm run dev`
4. Open your browser at `http://localhost:3000`

## Build

To create a production bundle:

`npm run build`

## Notes

- This app proxies Gemini requests through the Express backend.
- Use `VITE_GEMINI_API_KEY` in `.env` to avoid exposing the key in the browser bundle.
- The server requires a valid `SESSION_SECRET` in production.
