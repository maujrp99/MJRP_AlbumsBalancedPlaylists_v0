# DevOps Onboarding Guide - MJRP Albums Balanced Playlists v2.0

**Created**: 2025-11-30
**Role**: DevOps Engineer / SRE
**Goal**: Maintain build pipelines, manage secrets, and ensure stable deployments.

> **See Also**: [Product Vision](../MJRP_Album_Blender_Prod_Vision.md) for long-term architecture goals.

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
Refer to **[`docs/manual/00_Deployment_and_Setup.md`](../manual/00_Deployment_and_Setup.md)** for detailed start/stop instructions.

```bash
./scripts/start-local.sh
```
- **Access UI**: `http://localhost:5000/`
- **Access API**: `http://localhost:3000/`

---

## 📦 Build & Deploy

### 1. Build Frontend
```bash
npm run build
# Output: ../dist (relative to project root)
```

### 3. Deployment (Google Cloud Run)
Refer to **[`docs/manual/00_Deployment_and_Setup.md`](../manual/00_Deployment_and_Setup.md)** for the full pipeline.

---

## 🔐 Secrets Management
**CRITICAL**: We do not commit `.env` files.
- **Local**: Create `server/.env` with `AI_API_KEY=...`.
- **Production**: Secrets are managed via Google Secret Manager.
- **Rotation**: See `docs/manual/00_Deployment_and_Setup.md`.

---

## 🚨 Troubleshooting

### "Port 5000 already in use"
- Check for zombie processes: `lsof -i :5000`
- Kill them: `kill -9 <PID>`

### "AI_API_KEY not set"
- Ensure `server/.env` exists.

---

## 📂 Important Directories
- `docs/manual/`: Operational guides.
- `scripts/`: Helper shell scripts.

---

**System Status**: 🟢 Operational (v2.0.6)
