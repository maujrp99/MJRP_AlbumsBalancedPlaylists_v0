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

### Frontend (`.env` na raiz, lido pelo Vite na hora do build)
```bash
VITE_SPOTIFY_CLIENT_ID=...         # Client ID do app no painel do Spotify (valor público)
```
Sem essa variável a conexão com o Spotify quebra, no ambiente local e no build que vai para produção.

### Endereço local: um só
O app roda em **`http://127.0.0.1:5010`** e só nele (`vite.config.js`: porta fixa, `strictPort`).
O navegador guarda login, tokens e cache por origem, e o Spotify só aceita o IP de loopback como
retorno local; por isso `localhost` e `127.0.0.1` não se misturam. Uma página aberta em
`http://localhost:5010` é mandada pelo próprio app para `127.0.0.1` (`public/js/utils/localAddress.js`).

Cadastros que valem para esse endereço:

| Onde | O quê |
|---|---|
| Painel do Spotify, Redirect URIs | `http://127.0.0.1:5010/callback` |
| Firebase Authentication, Authorized domains | `127.0.0.1` |

### Frontend (`public/config.js`)
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "mjrp-playlist-generator.firebaseapp.com",
  projectId: "mjrp-playlist-generator",
  // ...
};
```
