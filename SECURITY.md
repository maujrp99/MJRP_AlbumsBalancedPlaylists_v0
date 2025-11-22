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

Additional notes:

- The server now optionally validates album objects returned by the AI provider using `ajv` (if `ajv` is installed in `server/`). Validation failures are returned with HTTP `422` and a `validationErrors` array in the response. This helps detect malformed provider responses early.
- If you see repeated `422` responses during testing, check the proxy logs (server console or `/tmp/proxy.log`) for `Album validation failed` messages and inspect the raw provider response.

Running the proxy with AJV enabled:

```bash
cd server
npm install ajv
node index.js
```

Useful endpoints:

- `GET /_health` — quick health check, returns `{ ok: true }` when the proxy is running.
- `GET /api/list-models` — lists models (if using Google Generative Language endpoint and API key configured).
- `POST /api/generate` — submit `{ albumQuery }` and receive normalized `{ data: <album> }` when successful.
