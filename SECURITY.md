Security notes

- Do NOT commit your AI API key to the repository. Use environment variables (see `.env.example`).
- This project includes a small server-side proxy (`/server`) to keep secrets off the client.
- Run the proxy locally and set `AI_API_KEY` in your environment before starting it.
- If deploying, set the env var in your hosting platform's secret manager (Vercel/Netlify/AWS/GCP etc.).

Quick start

1. Copy `.env.example` to `.env` and fill `AI_API_KEY` and optionally `AI_ENDPOINT`.
2. Install server deps:

```bash
cd server
npm install
```

3. Run the proxy:

```bash
cd server
npm start
```

4. In the browser app, ensure the static server is running on port 8000 and the proxy on port 3000.

Client changes

- The frontend `public/js/app.js` now calls `/api/generate` on the proxy rather than the AI provider directly.
- Keep API keys only on the server.
