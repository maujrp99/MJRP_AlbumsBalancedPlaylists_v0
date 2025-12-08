# DevOps Onboarding Guide - MJRP Albums Balanced Playlists v2.0

**Created**: 2025-11-30
**Role**: DevOps Engineer / SRE
**Goal**: Maintain build pipelines, manage secrets, and ensure stable deployments.

---

## 🏗️ Architecture Overview
- **Frontend**: Static SPA (Vite + Vanilla JS).
- **Backend**: Node.js Proxy (Express).
- **Database**: Firestore (Client-side access) + IndexedDB (Local Cache).
- **Hosting**: Google Cloud Run (Containerized).

### 🔑 Key Configuration
- **Frontend Port**: `5000` (Configured in `vite.config.js`).
- **Backend Port**: `3000` (Proxy).
- **Environment**: `.env` file in `server/` directory (NOT root).

---

## 🚀 Local Development (The "Happy Path")

### 1. Start Everything
We use a unified script to start the Backend Proxy and Frontend Dev Server.
```bash
./scripts/start-local.sh
```
- **Access UI**: `http://localhost:5000/`
- **Access API**: `http://localhost:3000/`
- **Logs**: Tail `.local_logs/server.log`

### 2. Stop Everything
```bash
./scripts/stop-local.sh
```

---

## 📦 Build & Deploy

### 1. Build Frontend
```bash
npm run build
# Output: ../dist (relative to project root)
```

### 2. Docker Build (Production)
The `Dockerfile` is in the root. It builds the frontend and serves it via the Node.js backend.
```bash
docker build -t mjrp-v2 .
docker run -p 8080:8080 --env-file server/.env mjrp-v2
```

### 3. Deployment (Google Cloud Run)
Refer to `docs/devops/PRODUCTION_DEPLOY.md` for the full pipeline.
```bash
# Quick deploy (requires gcloud auth)
gcloud run deploy mjrp-v2 --source .
```

---

## 🔐 Secrets Management
**CRITICAL**: We do not commit `.env` files.
- **Local**: Create `server/.env` with `AI_API_KEY=...`.
- **Production**: Secrets are managed via Google Secret Manager and injected as env vars in Cloud Run.
- **Rotation**: See `docs/devops/SECRET_ROTATION_RUNBOOK.md`.

---

## 🚨 Troubleshooting

### "Port 5000 already in use"
- Check for zombie processes: `lsof -i :5000`
- Kill them: `kill -9 <PID>`

### "AI_API_KEY not set"
- Ensure `server/.env` exists.
- Ensure you are running the server from the root or `server/` correctly (the script handles this).

### "CORS Errors"
- The proxy is configured to allow `localhost:5000`.
- Check `server/index.js` cors configuration if you change ports.

---

## 📂 Important Directories
- `docs/devops/`: Runbooks and guides.
- `scripts/`: Helper shell scripts.
- `.github/workflows/`: CI/CD pipelines (if applicable).

---

**System Status**: 🟢 Operational (v2.0.6)
