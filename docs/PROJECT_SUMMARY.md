# MJRP Albums Balanced Playlists — Project Summary

**Version**: v2.0.0-alpha.2 (Sprint 5.3 Complete) | **Next**: UAT & Production Release
**Last Updated**: 2025-11-29

---

## Executive Summary

**MJRP Playlist Generator** is a web application that generates balanced playlists from track-level acclaim data, combining deterministic evidence (BestEverAlbums scraper) with AI enrichment (Google Gemini).

### Current Status ✅
- **v2.0.0-alpha.2** (Sprint 5.3 Complete)
- **Inventory System**: Fully implemented (CRUD, UI, Store, Repo)
- **Architecture**: Refactored to modern SPA with Router and Views
- **Persistence**: Firestore-backed with 3-tier caching (Memory/IndexedDB)
- **Security**: Hardened configuration management
- **Tests**: 100% Unit Test Coverage (Repositories, Stores, Cache)

---

## Core Features

### 1. Track Ranking Consolidation
- **Scraper-first approach**: BestEverAlbums track ratings when available
- **AI enrichment**: Google Gemini fills gaps for partial/missing data
- **Borda count consolidation**: Normalizes rankings from multiple sources
- **Fuzzy matching**: Token-overlap heuristics handle title variants

### 2. Balanced Playlist Generation
- **P1/P2 selection**: Top 2 acclaimed tracks per album
- **DeepCuts playlists**: Remaining tracks distributed evenly
- **Duration targeting**: Configurable max duration per playlist
- **Manual override**: Drag-and-drop reordering with Sortable.js

### 3. Data Persistence
- **Firestore integration**: Albums and playlists saved to Firestore
- **BestEver evidence caching**: Reduces scraper calls
- **Debug metadata**: `rankingConsolidatedMeta` for observability

---

## Architecture

### Frontend (`public/`)
```
public/
├── hybrid-curator.html    # Main SPA
├── js/
│   ├── app.js            # App orchestrator (~800 lines)
│   ├── api.js            # Backend API client
│   ├── curation.js       # CurationEngine (stateless)
│   └── shared/
│       └── normalize.js  # Shared normalization (symlink)
├── css/
│   └── styles.css
└── config.js             # Firebase config
```

**Key Components**:
- `CurationEngine`: Stateless class for playlist generation
- `api.js`: Wraps `/api/generate` calls with error handling
- `app.js`: DOM manipulation, state management, Firestore integration

### Backend (`server/`)
```
server/
├── index.js                      # Express server
├── lib/
│   ├── fetchRanking.js          # Ranking orchestration
│   ├── ranking.js               # Borda consolidation
│   ├── aiClient.js              # Google Gemini integration
│   ├── prompts.js               # Prompt templates
│   ├── normalize.js             # Schema validation
│   └── scrapers/
│       └── besteveralbums.js    # BestEver scraper
├── test/                        # Unit tests
├── Dockerfile                   # Cloud Run container
└── package.json
```

**Key Modules**:
- `fetchRankingForAlbum`: Scraper → AI fallback pipeline
- `consolidateRanking`: Borda count + fuzzy matching
- `getBestEverRanking`: Album search → track ratings scraper

### Shared Module (`shared/`)
```
shared/
└── normalize.js    # ES Module used by both frontend/backend
```

**Purpose**: Unified key normalization
- NFD diacritic removal
- Non-alphanumeric replacement
- Token boundary preservation

---

## Deployment

### Production Environment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Firebase Hosting | `https://mjrp-playlist-generator.web.app` |
| Backend | Cloud Run (southamerica-east1) | `https://mjrp-proxy-540062660076.southamerica-east1.run.app` |
| Database | Firestore | `mjrp-playlist-generator` project |

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

## Local Development

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (`gcloud`)

### Backend Setup
```bash
cd server
npm ci

# Create .env
cat > .env << EOL
AI_API_KEY=your-gemini-api-key
PORT=3000
ALLOWED_ORIGIN=http://localhost:8000
NODE_ENV=development
EOL

npm start  # Starts on :3000
```

### Frontend Setup
```bash
# Serve static files
python3 -m http.server 8000 -d public

# Or use Firebase emulators
firebase serve --only hosting
```

Open `http://localhost:8000/hybrid-curator.html`

### Running Tests
```bash
# Backend unit tests
cd server && npm test

# Run specific test
npm test -- server/test/normalize.test.js
```

---

## v1.6.1 Recent Fixes (2025-11-26)

### Production Deployment Hotfix
**Problem**: Track ratings missing in production despite working locally

**Root Cause**:
1. `config/prompts.json` not copied to Cloud Run container
2. `shared/normalize.js` import path incorrect in container
3. Missing ESM configuration for shared module

**Solution**:
- Updated `scripts/deploy-backend.sh` to stage config/shared
- Modified `server/lib/prompts.js` to support multiple config paths
- Injected `{"type": "module"}` into shared module during deploy
- Added cache busting to frontend (`?v=1.6.0`)

**Verification**:
```bash
curl https://mjrp-proxy-540062660076.southamerica-east1.run.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery": "Rolling Stones - Let it Bleed"}'

# Result: ✅ Has Ratings: true (was false)
```

**Debug Instrumentation Added**:
- `/api/debug/files` - Inspect container filesystem
- `/api/debug/import` - Test module imports
- `/api/debug/raw-ranking` - Scraper evidence inspection
- `debugTrace` in `fetchRankingForAlbum` - Execution flow tracking

**Files Modified**:
- `scripts/deploy-backend.sh`
- `server/lib/prompts.js`
- `server/lib/fetchRanking.js`
- `server/index.js`
- `public/hybrid-curator.html`

See [CHANGELOG.md](../CHANGELOG.md#v161-hotfix-production-deployment-2025-11-26) for details.

---

## v2.0 Roadmap (Planning Phase)

### Vision
Transform from single-page tool into **multi-section SPA** with series management.

### Key Features (Planned)

#### 1. Navigation & Routing
- **HashRouter**: States for `#home`, `#albums`, `#ranking`, `#playlists`
- **Lazy loading**: Dynamic imports per view
- **Shared layout**: TopNav component across all views

#### 2. Series Management
- **Home screen**: Create/manage playlist series
- **Firestore schema**: `series` collection with `albumQueries`, `createdAt`, `notes`
- **Historical series**: Resume previous curation sessions

#### 3. Album Library
- **View saved albums**: List with filters (artist, year, BestEver status)
- **Quick actions**: Remove, reprocess ranking, open BestEver reference
- **Sync badges**: Visual indicators for Firestore sync status

#### 4. Enhanced Ranking View
- **Tabs**: Summary, Sources, Logs (telemetry)
- **Per-album controls**: Update ranking, view debug trace
- **Source attribution**: Deduplicated list of ranking providers

#### 5. Playlist Versioning
- **Snapshots**: Save playlist state to `series/{id}/history/{timestamp}`
- **Revert capability**: Rollback to previous versions
- **Status badges**: "Drag applied", "Synchronized"

### Technical Improvements

#### Architecture Changes
```
public/js/
├── stores/          # NEW: State management
│   ├── albums.js
│   ├── playlists.js
│   └── series.js
├── views/           # NEW: Route views
│   ├── home.js
│   ├── albums.js
│   ├── ranking.js
│   └── playlists.js
├── components/      # NEW: Reusable components
│   └── topNav.js
└── app.js          # Refactored: Router + orchestrator
```

#### Tooling Upgrades
- **Bundler**: Vite (development server + optimized builds)
- **Testing**: Vitest + jsdom for headless UI tests
- **Build**: ES modules with tree-shaking

### Migration Plan

**Sprint Overview** (est. 2.5 months):
1. **Sprint 1** (2 weeks): Foundation (Vite, stores, tests)
2. **Sprint 2** (1 week): Navigation (HashRouter, views)
3. **Sprint 3** (2 weeks): Series management (Home, Firestore)
4. **Sprint 4** (1.5 weeks): Albums & Ranking views
5. **Sprint 5** (1.5 weeks): Playlists versioning
6. **Sprint 6** (1 week): Migration script, E2E tests, deploy

**Firestore Migration**:
- Script: `migrate-to-v2.js` (Node CLI)
- Strategy: Create default series, move existing playlists
- Risk mitigation: Backup, staging testing, rollback plan

See [docs/V2.0_ANALYSIS.md](V2.0_ANALYSIS.md) for detailed analysis and risk assessment.

---

## API Reference

### Main Endpoint: `/api/generate`

**Request**:
```json
POST /api/generate
Content-Type: application/json

{
  "albumQuery": "Pink Floyd - The Wall"
}
```

**Response**:
```json
{
  "album": {
    "title": "The Wall",
    "artist": "Pink Floyd",
    "year": 1979,
    "tracks": [...]
  },
  "rankingConsolidated": [
    {
      "trackTitle": "Comfortably Numb",
      "rating": 97,
      "rawScore": 18,
      "supporting": [...],
      "finalPosition": 1,
      "normalizedScore": 1
    }
  ],
  "rankingSources": [...],
  "bestEverEvidence": {...},
  "tracksByAcclaim": [...],  // Sorted by rating desc
  "rankingConsolidatedMeta": {
    "divergence": {...},
    "debugInfo": {...}
  }
}
```

### Debug Endpoints (Production)

**⚠️ Note**: Should be protected/disabled in production

- `GET /api/debug/files?path=/usr/src/app` - List container files
- `GET /api/debug/import?input=text` - Test normalize import
- `POST /api/debug/raw-ranking` - Raw BestEver scraper output

---

## Testing

### Unit Tests (`server/test/`)
```bash
cd server && npm test
```

**Coverage**:
- `normalize.test.js`: Schema validation
- `ranking.test.js`: Borda consolidation, fuzzy matching
- `besteveralbums.test.js`: Scraper parsing

### Manual Testing Checklist
- [ ] Load album (via query)
- [ ] Verify ratings appear
- [ ] Generate playlists (P1, P2, DeepCuts)
- [ ] Drag-and-drop reordering
- [ ] Save to Firestore
- [ ] Load saved curation

---

## Known Issues & Limitations

### Current Limitations
1. **Single-session only**: No series management (v2.0 feature)
2. **Client-side state**: No persistence beyond Firestore snapshot
3. **No batch processing**: One album at a time
4. **Rate limiting**: BestEverAlbums scraper can fail under load

### Future Improvements
- [ ] Implement playlist series (v2.0)
- [ ] Add batch album processing
- [ ] Implement queue for scraper requests
- [ ] Add health check endpoint
- [ ] Disable/protect debug endpoints in prod
- [ ] Add E2E tests (Playwright/Cypress)

---

## Design Patterns

### Proxy Pattern
**Server hides API keys**: Client never sees `AI_API_KEY`

### Strategy Pattern
**Dynamic ranking sources**: Scraper → AI fallback

### Facade Pattern
**Simplified client API**: `/api/generate` abstracts complexity

### Adapter Pattern
**Standardized responses**: BestEver HTML → normalized JSON

---

## CI/CD

### GitHub Actions
**Workflow**: `.github/workflows/ci-firebase.yml`

**Triggers**:
- Push to `main` → Deploy production
- Pull requests → Deploy preview

**Steps**:
1. Install dependencies (root + server)
2. Run linter + tests
3. Build frontend
4. Deploy via `firebase-tools`

**Secrets Required**:
- `FIREBASE_PROJECT`
- `FIREBASE_TOKEN` (or `FIREBASE_SERVICE_ACCOUNT`)
- `AI_API_KEY` (for E2E tests)

---

## Environment Variables

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

---

## References

- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [SDD.md](SDD.md) - Software Design Document
- [mjrp-playlist-generator-2.0.md](mjrp-playlist-generator-2.0.md) - v2.0 original plan
- [V2.0_ANALYSIS.md](V2.0_ANALYSIS.md) - v2.0 technical analysis
- [Walkthrough (v1.6.1)](../../../.gemini/antigravity/brain/3db5a56b-d2c3-4ca0-b7b8-7cb6e0243381/walkthrough.md) - Deployment fix walkthrough

---

**Maintainer**: @maujrp99  
**License**: MIT (assumed)  
**Repository**: [MJRP_AlbumsBalancedPlaylists_v0](https://github.com/maujrp99/MJRP_AlbumsBalancedPlaylists_v0)

*Last updated: 2025-11-26 - Post v1.6.1 deployment fix*
 
