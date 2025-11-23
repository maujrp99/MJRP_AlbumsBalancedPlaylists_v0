# Local run instructions

Quick steps to start the proxy server and the static UI locally (zsh / macOS).

Prerequisites
- Node.js and `npm` installed
- Python 3 installed (for quick static server) or `npx serve` if preferred
- If you want the AI endpoint to work, create a `.env` inside `server/` with `AI_API_KEY=...` (or set equivalent env vars)

Start both services (one command)
```bash
# from repo root
./scripts/start-local.sh
```

What the script does
- runs `npm ci` in `server/`
- starts `npm start` in `server/` and saves logs to `.local_logs/server.log`
- starts a Python `http.server` serving `public/` on port `8000` and logs to `.local_logs/public.log`
- records PIDs in `.local_pids` so you can stop them later

Stop services
```bash
./scripts/stop-local.sh
```

Useful one-liners
- Health check
```bash
curl -sS http://localhost:3000/_health | jq
```
- Smoke POST to `/api/generate`
```bash
curl -sS -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery":"Radiohead - OK Computer"}' | jq
```
- Tail server logs
```bash
tail -f .local_logs/server.log
```

Troubleshooting
- If you see 503 from `/api/generate`, ensure `AI_API_KEY` is set in `server/.env` or environment.
- If the UI can't reach the proxy due to CORS, check `server/index.js` for `cors()` configuration allowing `http://localhost:8000`.
- If `npm ci` fails due to node version mismatch, use `nvm` to switch to a compatible Node version (workflow uses Node 18.x).

Notes
- These scripts only start local processes — they do not modify source files or deploy anything.
- You can replace the Python static server with any static server you prefer.
