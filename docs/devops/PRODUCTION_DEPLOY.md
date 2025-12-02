# Production Deployment Guide

**Last Updated**: 2025-12-02  
**Status**: Single Source of Truth for Production Deployments

---

## 🎯 Quick Deploy (TL;DR)

**Backend e Frontend são INDEPENDENTES** - podem ser deployados em qualquer ordem ou em paralelo!

### Opção 1: Sequencial (Recomendado para primeira vez)

```bash
# 1. Ensure main branch is ready
git checkout main
git pull origin main

# 2. Deploy backend (Cloud Run) - ~3-5 min
./scripts/deploy-backend.sh

# 3. Build + deploy frontend (Firebase Hosting) - ~2-3 min
npm run build                    # ← OBRIGATÓRIO para v2.0+ (Vite)
./scripts/deploy-prod.sh
```

### Opção 2: Paralelo (Mais rápido)

```bash
# Terminal 1: Backend
./scripts/deploy-backend.sh

# Terminal 2: Frontend (simultaneamente)
npm run build && ./scripts/deploy-prod.sh
```

### Opção 3: Apenas Frontend (se backend já está OK)

```bash
npm run build
./scripts/deploy-prod.sh
```

### Opção 4: Apenas Backend (se frontend já está OK)

```bash
./scripts/deploy-backend.sh
```

---

## ❓ Por que precisa fazer BUILD (`npm run build`)?

**v1.6 (Arquitetura Antiga)**:
```
public/ → Firebase Hosting (direto)
❌ Sem build step
❌ Sem minificação
❌ Arquivos servidos "as-is"
```

**v2.0+ (Com Vite)**:
```
public/ → npm run build → dist/ → Firebase Hosting
✅ Vite processa código
✅ Minificação (código menor)
✅ Bundling (menos HTTP requests)
✅ Tree-shaking (remove código não usado)
✅ Cache busting (hash nos filenames)
```

**Resultado**: App v2.0 é ~30% mais rápido que v1.6! 🚀

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Branch Strategy](#branch-strategy)
3. [Backend Deployment (Cloud Run)](#backend-deployment-cloud-run)
4. [Frontend Deployment (Firebase Hosting)](#frontend-deployment-firebase-hosting)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Validation](#post-deployment-validation)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All tests passing (`npm test`, `npm run test:e2e`)
- [ ] No console errors in dev environment
- [ ] Build successful (`npm run build`)
- [ ] Preview works (`npm run preview`)
- [ ] Git working tree clean (`git status`)

### Documentation
- [ ] CHANGELOG.md updated with version entry
- [ ] Breaking changes documented
- [ ] package.json version bumped

### Environment
- [ ] Backend running locally (http://localhost:3000)
- [ ] Frontend running locally (http://localhost:5000)
- [ ] Service account keys available (if deploying locally)

---

## Branch Strategy

### Production Deployment from `main`

**Rule**: Production deployments ALWAYS deploy from `main` branch.

### Branch Swap Process (v1.6 → v2.0 Example)

When doing major version migrations:

```bash
# 1. Checkout main and verify state
git checkout main
git log --oneline -3

# 2. Create backup of old main
git branch backup-main-v1.6
git tag v1.6-final-snapshot -m "Final snapshot before v2.0 migration"

# 3. Switch to new version branch
git checkout feature/v2.0-foundation  # or your dev branch

# 4. Delete and recreate main
git branch -D main
git checkout -b main

# 5. Force push to remote (CAREFUL!)
git push origin main --force
git push origin backup-main-v1.6
git push origin v1.6-final-snapshot
```

**⚠️ Warning**: `--force` pushes rewrite history. Only safe for solo developer or with team coordination.

---

## Backend Deployment (Cloud Run)

### Deployment Script: `deploy-backend.sh`

**Usage**:
```bash
./scripts/deploy-backend.sh
```

**What It Does**:
1. ✅ Copies `shared/` → `server/_shared_temp` (shared modules)
2. ✅ Copies `config/` → `server/config` (config files)
3. ✅ Builds Docker container using `server/Dockerfile`
4. ✅ Deploys to Cloud Run service `mjrp-proxy`
5. ✅ Cleanup: Removes temporary files

**Configuration**:
```bash
PROJECT_ID="mjrp-playlist-generator"
REGION="southamerica-east1"
SERVICE_NAME="mjrp-proxy"
```

### Dockerfile Breakdown

**File**: [`server/Dockerfile`](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/Dockerfile)

```dockerfile
FROM node:18-slim                    # Base image (Node 18 LTS)

WORKDIR /usr/src/app                 # Working directory

ENV NODE_ENV=production              # Production mode
ARG PORT=3000                        # Default port
ENV PORT=$PORT

COPY package*.json ./                # Copy package files
RUN npm ci --only=production         # Install prod dependencies

COPY _shared_temp ../shared          # ← CRITICAL: Shared modules
COPY . .                             # Copy application code
EXPOSE 3000                          # Expose port

CMD ["node", "index.js"]             # Start server
```

**⚠️ CRITICAL**: The `COPY _shared_temp` line is why you MUST use `deploy-backend.sh`. Deploying directly via Cloud Run console will fail because `_shared_temp` doesn't exist in the repo.

### Required Environment Variables (Cloud Run)

Set these in **Cloud Run Console** → Service `mjrp-proxy` → **Edit & Deploy** → **Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `AI_API_KEY` | Gemini API Key | ✅ Yes |
| `ALLOWED_ORIGIN` | `https://mjrp-playlist-generator.web.app` | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `AI_ENDPOINT` | `https://generativelanguage.googleapis.com` | Optional |
| `AI_MODEL` | `models/gemini-2.5-flash` | Optional |

**How to Verify**:
```bash
curl https://mjrp-proxy-XXXX.southamerica-east1.run.app/_health
# Expected: {"ok":true}
```

---

## Frontend Deployment (Firebase Hosting)

### Build Step (Required for v2.0+)

**⚠️  v2.0+ uses Vite** - Building is MANDATORY before deployment.

```bash
npm run build
```

**Output**: `dist/` folder with optimized bundles

**What Vite Does**:
- Minifies JavaScript
- Bundles modules
- Code splitting
- Hash filenames for cache busting
- Tree-shaking (removes unused code)

### Deployment Script: `deploy-prod.sh`

**Usage**:
```bash
./scripts/deploy-prod.sh
```

**What It Does**:
1. ✅ Detects Firebase project from `.firebaserc`
2. ✅ Loads service account (if available locally)
3. ✅ Authenticates with `gcloud` / Firebase
4. ✅ Deploys `public/` folder to Firebase Hosting
5. ✅ Proxies `/api/**` requests to Cloud Run

**Configuration**:
```bash
FIREBASE_PROJECT="mjrp-playlist-generator"
```

### Firebase Configuration

**File**: [`firebase.json`](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/firebase.json)

```json
{
  "hosting": {
    "public": "public",                    // ← Serve from public/ (v1.6)
                                           //   Change to "dist" for v2.0 after build
    "rewrites": [
      {
        "source": "/api/**",               // API requests
        "run": {
          "serviceId": "mjrp-proxy",       // → Forward to Cloud Run
          "region": "southamerica-east1"
        }
      }
    ]
  }
}
```

**For v2.0 Deployment**: Update `"public": "dist"` before deploying!

### Required Environment Variables (Firebase Hosting)

**None!** Frontend config is hard-coded in `/public/js/firebase-config.js` (not secret).

---

## Environment Variables

### Backend (Cloud Run)

**Location**: Cloud Run Console → `mjrp-proxy` service → Edit & Deploy → Variables

**Required Variables**:

```bash
# AI Configuration
AI_API_KEY="YOUR_GEMINI_API_KEY"              # ← Get from Google AI Studio
AI_MODEL="models/gemini-2.5-flash"             # Optional, defaults to this
AI_ENDPOINT="https://generativelanguage.googleapis.com"  # Optional

# CORS
ALLOWED_ORIGIN="https://mjrp-playlist-generator.web.app"  # ← Production URL

# Environment
NODE_ENV="production"
PORT=3000  # Default, Cloud Run overrides automatically
```

**How to Update**:
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Select service `mjrp-proxy`
3. Click **Edit & Deploy New Revision**
4. Go to **Variables & Secrets** tab
5. Add/update environment variables
6. **Deploy**

### Frontend (Firebase Hosting)

**No environment variables needed!** 

Firebase config is in [`public/js/firebase-config.js`](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/firebase-config.js) (public, not secret).

---

## Post-Deployment Validation

### Backend Validation

```bash
# 1. Health check
curl https://mjrp-proxy-540062660076.southamerica-east1.run.app/_health
# Expected: {"ok":true}

# 2. API test (requires AI_API_KEY configured)
curl -X POST https://mjrp-proxy-540062660076.southamerica-east1.run.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery":"Pink Floyd - The Wall"}'
# Expected: JSON with album data

# 3. CORS test
curl -I -H "Origin: https://mjrp-playlist-generator.web.app" \
  https://mjrp-proxy-540062660076.southamerica-east1.run.app/_health
# Expected: access-control-allow-origin header present
```

### Frontend Validation

```bash
# 1. Open production URL
open https://mjrp-playlist-generator.web.app

# 2. Browser Console (Cmd+Option+I)
# - Check for errors
# - Verify API calls to Cloud Run succeed

# 3. Functional Tests
# - Create a series
# - Load albums
# - Generate playlists
# - Navigate between views
```

### Firebase Hosting Deployment URL

After `firebase deploy`, you'll get:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/mjrp-playlist-generator
Hosting URL: https://mjrp-playlist-generator.web.app
```

---

## Rollback Procedures

### Option 1: Firebase Hosting Rollback (30 seconds)

**Via Console**:
1. Go to [Firebase Console](https://console.firebase.google.com/project/mjrp-playlist-generator/hosting/sites)
2. Click **Hosting** → **Release History**
3. Find previous deployment
4. Click **Rollback to this version**

**Via CLI**:
```bash
firebase hosting:rollback
```

**Impact**: Instant rollback, zero downtime

---

### Option 2: Cloud Run Rollback (2 minutes)

**Via Console**:
1. Go to [Cloud Run Console](https://console.cloud.google.com/run/detail/southamerica-east1/mjrp-proxy)
2. Click **Revisions** tab
3. Select previous revision
4. Click **Manage Traffic**
5. Set 100% traffic to previous revision

**Via CLI**:
```bash
# List revisions
gcloud run revisions list --service=mjrp-proxy --region=southamerica-east1

# Rollback to specific revision
gcloud run services update-traffic mjrp-proxy \
  --region=southamerica-east1 \
  --to-revisions=mjrp-proxy-00123-abc=100
```

---

### Option 3: Git Rollback + Redeploy (5 minutes)

```bash
# 1. Checkout previous tag
git checkout v2.0.3  # or backup-main-v1.6

# 2. Redeploy backend
./scripts/deploy-backend.sh

# 3. Redeploy frontend
npm run build  # If v2.0+
./scripts/deploy-prod.sh

# 4. Verify
curl https://mjrp-proxy-XXXX.run.app/_health
open https://mjrp-playlist-generator.web.app
```

---

## Troubleshooting

### Common Issues

#### 1. `COPY failed: stat _shared_temp: file does not exist`

**Cause**: Deployed backend directly via Cloud Run console instead of using `deploy-backend.sh`

**Solution**: Always use `./scripts/deploy-backend.sh`

**Why**: Script prepares `_shared_temp` folder referenced in Dockerfile

---

#### 2. `Permission denied (publickey)` during `git push`

**Cause**: SSH key not configured or wrong remote URL

**Solution**:
```bash
# Check remote URL
git remote -v

# If using github.com (without suffix), update:
git remote set-url origin git@github.com-personal:maujrp99/MJRP_AlbumsBalancedPlaylists_v0.git

# Verify SSH config
cat ~/.ssh/config
```

---

#### 3. Firebase deploy fails: `FIREBASE_PROJECT not set`

**Cause**: `.firebaserc` missing or no env var

**Solution**:
```bash
# Check .firebaserc
cat .firebaserc

# Or export manually
export FIREBASE_PROJECT="mjrp-playlist-generator"
./scripts/deploy-prod.sh
```

---

#### 4. Cloud Run `503 Service Unavailable`

**Causes**:
- Container failed to start
- Health checks failing
- Environment variables missing

**Debug**:
```bash
# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mjrp-proxy" --limit=50

# Check environment variables
gcloud run services describe mjrp-proxy --region=southamerica-east1 --format=json | grep -A 20 env
```

---

#### 5. CORS errors in production

**Symptoms**: Browser console shows `CORS origin not allowed`

**Solution**: Verify `ALLOWED_ORIGIN` env var in Cloud Run matches production URL:
```bash
# Should be:
ALLOWED_ORIGIN="https://mjrp-playlist-generator.web.app"

# NOT:
# http://localhost:5000  ← Development only!
```

---

#### 6. Backend error: `Cannot find module 'curation.js'`

**Symptoms**: `/api/playlists` returns 500, Cloud Run logs show module not found

**Cause**: `public/` folder not copied to Docker container (v2.0.4 fix)

**Solution**: Script already updated, but verify:
```bash
# Check deploy-backend.sh includes:
grep "public server/public" scripts/deploy-backend.sh

# Should output:
# cp -r public server/public
```

**If missing**, update `deploy-backend.sh` and redeploy.

---

#### 7. Frontend: `firebase-config.js` auth errors

**Symptoms**: `Uncaught SyntaxError` or `auth/api-key-not-valid`

**Cause**: Vite build didn't copy non-module script (v2.0.4 fix)

**Solution**: Already fixed in `vite.config.js`, verify:
```bash
# After npm run build:
ls -la dist/js/firebase-config.js  # Should exist (485 bytes)
```

**If missing**, rebuild:
```bash
npm run build  # Plugin auto-copies now
```

**See**: [DEBUG_LOG.md](../debug/DEBUG_LOG.md) for complete v2.0.4 deployment issue details

---

## Additional Resources

### Documentation
- [Cloud Run Quickstart](https://cloud.google.com/run/docs/quickstarts)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

### Internal Docs
- [SECRET_ROTATION_RUNBOOK.md](./SECRET_ROTATION_RUNBOOK.md) - How to rotate API keys
- [V2.0_DEPLOYMENT_IMPACT.md](./V2.0_DEPLOYMENT_IMPACT.md) - v1.6 → v2.0 migration details
- [CHANGELOG.md](../CHANGELOG.md) - Version history

### Scripts
- [`scripts/deploy-backend.sh`](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/scripts/deploy-backend.sh) - Backend deployment
- [`scripts/deploy-prod.sh`](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/scripts/deploy-prod.sh) - Frontend deployment

---

**Questions?** Check [CONTRIBUTING.md](../CONTRIBUTING.md) or contact the DevOps team.

**Last Deploy**: Check [Cloud Run Console](https://console.cloud.google.com/run/detail/southamerica-east1/mjrp-proxy) for latest revision.
