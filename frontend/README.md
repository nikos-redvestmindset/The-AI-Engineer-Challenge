### Matrix Terminal UI (Next.js)

Welcome to the green room. This is a Matrix-themed terminal UI where you can chat with the LLM, complete with a unicorn prompt (🦄).

#### Features
- Matrix color scheme with crisp contrast
- Streaming responses from the FastAPI backend
- Unicorn prompt for user input (🦄)
- Password-style API key input with optional “remember” toggle
- Works locally and on Vercel

#### Prereqs
- Node 18+ (or 20+ recommended)
- Backend running from the repo root: `uv run uvicorn api.app:app --reload`

#### Local Dev
1. From repo root, start backend:
   ```bash
   uv run uvicorn api.app:app --reload
   ```
2. In another terminal, start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000`.

The Next.js dev server proxies `/api/*` to `http://localhost:8000/api/*` automatically in development.

#### Environment
No env vars are required for the frontend. The backend now uses `OPENAI_API_KEY` from the server environment; the UI does not accept or store API keys.

#### Deploy on Vercel
The repo root `vercel.json` is configured to:
- Route `/api/*` to the FastAPI app at `api/app.py`
- Serve the Next.js app from `frontend/`

From the repo root:
```bash
vercel
```

#### Notes
- The system message and model are editable in the UI.
- If you want to hardcode the model or the system prompt, update `app/page.tsx`.

Happy hacking. May your frames be green and your tokens stream smooth.