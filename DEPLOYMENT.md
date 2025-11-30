# Production Deployment Guide
**Last Updated:** 2025-11-29  
**Architecture Version:** Sprint 5 (Firestore + Dual Track)  
**Status:** ✅ Active

---

## 📋 Table of Contents

1. [Critical: Dual-Track Entry Point Strategy](#critical-dual-track-entry-point-strategy)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Validation](#post-deployment-validation)
6. [Rollback Procedures](#rollback-procedures)
7. [CI/CD Configuration](#cicd-configuration)
8. [Troubleshooting](#troubleshooting)

---

## ⚠️ CRITICAL: Dual-Track Entry Point Strategy

### Current Production Architecture

**Production Entry Point:** `public/hybrid-curator.html` (v1.6 - Stable)
- Theme: Blue/Purple gradient
- Storage: localStorage only
- Architecture: Single-page standalone
- Status: **STABLE - DO NOT MODIFY**

**Development Entry Point:** `public/index-v2.html` (v2.0 - Active Development)
- Theme: Flame/Amber gradient
- Storage: Firestore + IndexedDB
- Architecture: Router + Views (SPA)
- Status: **ACTIVE DEVELOPMENT - NOT IN PROD**

### Entry Point Verification

**Before ANY deployment, verify:**

```bash
# 1. Check vite.config.js build target
grep -A 3 "rollupOptions" vite.config.js
# Expected: input: { main: path.resolve(__dirname, 'public/hybrid-curator.html') }

# 2. Check Firebase Hosting root
grep "public" firebase.json
# Expected: "public": "public"

# 3. Verify index.html redirect (fallback)
head -10 public/index.html
# Expected: meta refresh to /home (which vite rewrites in dev)
```

**⚠️ DO NOT change build entry point to index-v2.html without migration plan**

---

## 📦 Prerequisites

### Required Tools

```bash
# Verify installed versions
node --version          # >= 18.x
npm --version           # >= 9.x
firebase --version      # >= 13.x
gcloud --version        # Latest

# Check authentication
firebase projects:list
gcloud auth list
```

### Required Secrets

#### GitHub Actions Secrets
- `FIREBASE_PROJECT` - Firebase project ID (e.g., `mjrp-playlist-generator`)
- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON (preferred over token)
- `FIREBASE_TOKEN` - Legacy token (deprecated, use service account)

#### Google Cloud Secret Manager
- `AI_API_KEY` - Gemini API key (referenced by Cloud Run)

**Note:** API keys should NEVER be in GitHub secrets. Use Google Cloud Secret Manager.

### IAM Permissions

Cloud Run service account needs:
- `roles/secretmanager.secretAccessor` - To read AI_API_KEY from Secret Manager
- `roles/run.invoker` - For invocations (automatically granted)

---

## ✅ Pre-Deployment Checklist

### 1. Dependency Lock Check

```bash
# Frontend dependencies
cd /path/to/project
npm ci  # Use lockfile exactly
npm audit --production

# Backend dependencies
cd server
npm ci
npm audit --production

# Check for outdated critical packages
npm outdated firebase axios vite
```

### 2. Architecture Validation (Sprint 5)

#### Firestore Configuration
```bash
# Verify firebase-config.js exists
test -f public/js/firebase-config.js && echo "✅ Config found" || echo "❌ MISSING"

# Check firestore initialization
grep "getFirestore" public/js/app.js
```

#### Repository Pattern Files
- [ ] `public/js/repositories/BaseRepository.js`
- [ ] `public/js/repositories/SeriesRepository.js`
- [ ] `public/js/repositories/InventoryRepository.js`
- [ ] `public/js/repositories/PlaylistRepository.js`

#### Store Files
- [ ] `public/js/stores/series.js` (SeriesStore with Firestore)
- [ ] `public/js/stores/inventory.js` (InventoryStore with Firestore)
- [ ] `public/js/stores/playlists.js` (PlaylistsStore)

#### Views
- [ ] `public/js/views/HomeView.js` (Migration banner)
- [ ] `public/js/views/InventoryView.js` (NEW - physical collection)
- [ ] `public/js/views/AlbumsView.js` (Updated filters)
- [ ] `public/js/views/PlaylistsView.js` (Drag-drop)

#### Router Configuration
```bash
# Verify all routes registered
grep "router.register" public/js/app.js
# Expected: /home, /albums, /playlists, /inventory, /ranking/:id, /consolidated-ranking
```

### 3. Build Validation

```bash
# Clean build
rm -rf dist/
npm run build

# Verify build output
ls -lh dist/

# Check build size (should be < 5MB total)
du -sh dist/

# Verify critical files in dist/
test -f dist/hybrid-curator.html && echo "✅ Prod entry point found" || echo "❌ MISSING PROD ENTRY"
test -f dist/index-v2.html && echo "ℹ️ Dev entry point present" || echo "⚠️ Dev entry missing (OK for prod)"
```

### 4. Unit Tests

```bash
# Backend tests
cd server
npm test

# Expected: All tests pass
# If failures: DO NOT DEPLOY
```

### 5. Local Smoke Tests

```bash
# Start local servers
npm run dev &        # Vite on :5000
node server/index.js &  # Backend on :3000

# Test dev environment
curl http://localhost:5000/
curl http://localhost:5000/home
curl http://localhost:3000/_health

# Test API proxy
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery":"Pink Floyd - The Wall"}'

# Kill background processes
jobs -p | xargs kill
```

---

## 🚀 Deployment Steps

### Step 1: Cloud Run (Backend API)

#### Build & Push Container

```bash
# Set project
export GOOGLE_CLOUD_PROJECT="mjrp-playlist-generator"
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Build and push
cd server
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/mjrp-proxy:latest .
```

#### Deploy Cloud Run

```bash
gcloud run deploy mjrp-proxy \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/mjrp-proxy:latest \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --update-secrets=AI_API_KEY=AI_API_KEY:latest \
  --set-env-vars="AI_MODEL=models/gemini-2.5-flash,AI_ENDPOINT=https://generativelanguage.googleapis.com/v1,ALLOWED_ORIGIN=https://mjrp-playlist-generator.web.app,NODE_ENV=production"
```

#### Verify Cloud Run

```bash
# Get service URL
CLOUD_RUN_URL=$(gcloud run services describe mjrp-proxy --region southamerica-east1 --format='value(status.url)')

# Health check
curl -i $CLOUD_RUN_URL/_health
# Expected: HTTP/1.1 200 OK {"ok":true}

# API test
curl -i $CLOUD_RUN_URL/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery":"test"}'
# Expected: HTTP/1.1 200 or 4xx (not 5xx)
```

### Step 2: Firebase Hosting (Frontend)

#### Pre-deployment Verification

```bash
# Verify firebase.json API rewrite
cat firebase.json | grep -A 5 "rewrites"
# Expected:
# "rewrites": [{
#   "source": "/api/**",
#   "run": { "serviceId": "mjrp-proxy", "region": "southamerica-east1" }
# }]

# Verify build uses correct entry point
cat vite.config.js | grep -A 5 "input"
# Expected: main: path.resolve(__dirname, 'public/hybrid-curator.html')
```

#### Deploy Hosting

```bash
# Deploy (production)
firebase deploy --only hosting --project mjrp-playlist-generator

# Expected output:
# ✔  Deploy complete!
# Hosting URL: https://mjrp-playlist-generator.web.app
```

---

## ✅ Post-Deployment Validation

### Frontend Tests

```bash
PROD_URL="https://mjrp-playlist-generator.web.app"

# 1. Homepage loads
curl -I $PROD_URL
# Expected: HTTP/2 200

# 2. Entry point verification
curl -s $PROD_URL/hybrid-curator.html | head -20
# Expected: Should see v1.6 HTML structure

# 3. API proxy works
curl -X POST $PROD_URL/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery":"The Beatles - Abbey Road"}' | jq '.data.title'
# Expected: "Abbey Road"

# 4. CORS headers present
curl -I $PROD_URL/api/_health
# Expected: access-control-allow-origin: https://mjrp-playlist-generator.web.app
```

### Browser Manual Tests

1. Open `https://mjrp-playlist-generator.web.app`
2. Verify **hybrid-curator.html** loads (v1.6 UI - blue/purple theme)
3. Click "Carregar Dados" → Should open modal
4. Enter test album → Should fetch from API
5. Generate playlists → Should work
6. Check browser console for errors (none critical)

### Firestore Access (Sprint 5 - Dev Only)

1. Open browser DevTools → Application → IndexedDB
2. Verify `firebaseLocalStorageDb` exists
3. Navigate to `/home` in dev (index-v2.html)
4. Create test series → Check Firestore console
5. Verify data appears in `users/{uid}/series`

---

## 🔄 Rollback Procedures

### Cloud Run Rollback

```bash
# List revisions
gcloud run revisions list --service mjrp-proxy --region southamerica-east1

# Rollback to previous revision
gcloud run services update-traffic mjrp-proxy \
  --to-revisions=mjrp-proxy-00042-abc=100 \
  --region southamerica-east1
```

### Firebase Hosting Rollback

```bash
# List releases
firebase hosting:channel:list --project mjrp-playlist-generator

# Rollback (no native command, redeploy from previous commit)
git checkout <previous-commit-hash>
npm run build
firebase deploy --only hosting --project mjrp-playlist-generator
```

---

## 🤖 CI/CD Configuration

### GitHub Actions Workflow

The repository includes `.github/workflows/ci-firebase.yml` which:
- Runs tests and builds on PRs
- Deploys preview channels for PRs
- Deploys production on pushes to `main`, `v0.2`, or tags matching `v*`

### Required GitHub Secrets

```yaml
FIREBASE_PROJECT: mjrp-playlist-generator
FIREBASE_SERVICE_ACCOUNT: <service-account-json>
```

### Workflow Triggers

- **PR opened/updated** → Run tests + lint + deploy preview
- **Merge to main** → Deploy production
- **Tag push (v*)** → Deploy production release

### CI Checklist

- [ ] Use GitHub OIDC or service account (avoid long-lived tokens)
- [ ] Protect `main` branch with required reviews
- [ ] Run `npm ci` and tests before deploy
- [ ] Build with `npm run build`
- [ ] Deploy with `firebase deploy --only hosting`

---

## 🔐 Security

### Secret Management

**AI API Key:**
```bash
# Create secret (if not present)
gcloud secrets create AI_API_KEY --replication-policy=automatic

# Add new version
echo "YOUR_NEW_API_KEY" | gcloud secrets versions add AI_API_KEY --data-file=-

# Grant access to Cloud Run service account
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member="serviceAccount:$(gcloud run services describe mjrp-proxy --region=southamerica-east1 --format='value(spec.template.spec.serviceAccountName)')@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### CORS Configuration

Server should set `Access-Control-Allow-Origin` to Firebase Hosting origin in production:

```javascript
// server/index.js
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://mjrp-playlist-generator.web.app'
```

### Secret Rotation

If API key is compromised:
1. Add new secret version in Secret Manager
2. Redeploy Cloud Run (picks up `latest` version)
3. Revoke old key at provider
4. Remove old secret versions

---

## 🐛 Troubleshooting

### "API 503 Service Unavailable"

**Cause:** Cloud Run service not running or AI_API_KEY missing

**Fix:**
```bash
# Check service status
gcloud run services describe mjrp-proxy --region southamerica-east1

# Verify secret exists
gcloud secrets versions list AI_API_KEY

# Check service account permissions
gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/secretmanager.secretAccessor"
```

### "Firestore permission denied" (v2.0 dev)

**Cause:** Firebase Auth not initialized or Security Rules too restrictive

**Fix:**
1. Verify Firebase Auth is initialized in `public/js/app.js`
2. Check Firestore Security Rules allow authenticated users
3. Verify `signInAnonymously` completes before Firestore calls

### "Build fails with module errors"

**Cause:** Stale dependencies or cache

**Fix:**
```bash
# Clear node_modules
rm -rf node_modules && npm ci

# Clear Vite cache
rm -rf .vite

# Verify all imports use correct paths (ES modules)
```

### "CORS errors in browser"

**Cause:** CORS headers not set correctly

**Fix:**
```bash
# Verify ALLOWED_ORIGIN env var in Cloud Run
gcloud run services describe mjrp-proxy --region southamerica-east1 --format='value(spec.template.spec.containers[0].env)'

# Test CORS from browser origin
curl -H "Origin: https://mjrp-playlist-generator.web.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  $CLOUD_RUN_URL/api/generate -v 2>&1 | grep "access-control"
```

---

## 📊 Monitoring

### Cloud Run Metrics

```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mjrp-proxy" --limit 50 --format json

# Monitor errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 20
```

### Firebase Hosting Metrics

- Check [Firebase Console](https://console.firebase.google.com) → Hosting → Usage
- Verify bandwidth/requests are within quota

---

## 📝 Deployment Log Template

```markdown
## Deployment: YYYY-MM-DD HH:MM

**Deployed By:** [Your Name]
**Ticket/Issue:** #XXX
**Branch:** main / release/vX.Y.Z

### Pre-deployment Checks
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Entry point verified (hybrid-curator.html)
- [ ] Dependencies audited
- [ ] Secrets verified

### Deployment
- [ ] Cloud Run deployed (revision: ________)
- [ ] Firebase Hosting deployed (release: ________)
- [ ] API health check: ✅/❌
- [ ] Frontend smoke test: ✅/❌

### Post-deployment
- [ ] No errors in logs (30 min monitoring)
- [ ] User traffic migrated successfully
- [ ] Performance metrics normal

### Rollback Plan
If issues detected within 1 hour:
1. Run Cloud Run rollback to revision: ________
2. Redeploy Firebase from commit: ________
3. Notify stakeholders in #incidents

**Status:** ✅ Success / ⚠️ Issues / ❌ Rolled Back
```

---

## 🎯 Version-Specific Notes

### v1.6 (Current Production)
- Entry: `hybrid-curator.html`
- Uses: `public/js/app.js` (standalone)
- Theme: Blue/Purple gradient
- Storage: localStorage only
- Status: **STABLE - DO NOT MODIFY**

### v2.0 (Development)
- Entry: `index-v2.html`
- Uses: Router + Views architecture
- Theme: Flame/Amber gradient
- Storage: Firestore + IndexedDB
- Status: **ACTIVE DEVELOPMENT - NOT IN PROD**

**Migration Path (Future):**
1. Complete v2.0 feature parity with v1.6
2. Run parallel beta on `/v2/` subdomain
3. Gradual user migration (10% → 50% → 100%)
4. Swap entry points in `vite.config.js`
5. Archive `hybrid-curator.html`

---

**Next Review:** Before Sprint 6 deployment  
**Owner:** DevOps / Release Manager  
**Related Docs:** 
- `docs/devops/SECRET_ROTATION_RUNBOOK.md` (Secret rotation procedures)
- `docs/devops/SECURITY.md` (Security policies)
- `docs/devops/LOCAL_RUN.md` (Local development)
