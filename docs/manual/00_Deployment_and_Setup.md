# Deployment & Setup Guide

**Source**: Extracted from `PROJECT_SUMMARY.md` (v2.12.0)
**Last Updated**: 2026-01-08

---

## 1. Deployment Architecture

| Component | Platform | URL |
|-----------|----------|-----|
| **Frontend** | Firebase Hosting | `https://mjrp-playlist-generator.web.app` |
| **Backend** | Cloud Run (southamerica-east1) | `https://mjrp-proxy-540062660076.southamerica-east1.run.app` |
| **Database** | Firestore | `mjrp-playlist-generator` project |

### Deployment Scripts

```bash
# Frontend
./scripts/deploy-prod.sh    # Deploys to Firebase Hosting

# Backend
./scripts/deploy-backend.sh # Builds + deploys to Cloud Run
```

**Backend Deployment Flow**:
1. Copy `shared/` → `server/_shared_temp/` (with ESM config)
2. Copy `config/` → `server/config/`
3. Build Docker image from `server/Dockerfile`
4. Deploy to Cloud Run with `gcloud run deploy`
5. Cleanup temporary directories

---

## 2. CI/CD Pipeline

**Workflow**: `.github/workflows/ci-firebase.yml`

**Triggers**:
- Push to `main` → Deploy production
- Pull requests → Deploy preview

**Steps**:
1. Install dependencies (root + server)
2. Run linter + tests
3. Build frontend
4. Deploy via `firebase-tools`

**Secrets Required** (GitHub Actions):
- `FIREBASE_PROJECT`
- `FIREBASE_TOKEN` (or `FIREBASE_SERVICE_ACCOUNT`)
- `AI_API_KEY` (for E2E tests)

---

## 3. Environment Configuration

### Backend (`server/.env`)
```bash
AI_API_KEY=your-gemini-api-key    # Required
AI_ENDPOINT=...                    # Optional (defaults to Gemini)
AI_MODEL=...                       # Optional (defaults to gemini-1.5-flash)
PORT=3000                          # Optional
ALLOWED_ORIGIN=http://localhost:8000  # CORS
NODE_ENV=development|production
```

### Frontend (`public/config.js`)
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "mjrp-playlist-generator.firebaseapp.com",
  projectId: "mjrp-playlist-generator",
  // ...
};
```
