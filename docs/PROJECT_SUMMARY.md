# MJRP Albums Balanced Playlists — Project Summary

**Version**: v2.9.0 (Production)  
**Last Updated**: 2025-12-19

---

## Executive Summary

The MJRP Playlist Generator, "The Album Blender," is a visionary platform aiming to be the definitive tool for music curation, empowering enthusiasts to transcend algorithmic bubbles by focusing on objectively balanced album-based playlists. It achieves this by integrating global acclaim ratings (from sources like BestEverAlbums and Musicboard) with AI enrichment (Google Gemini) to ensure musical inspiration meets data precision. Its future state is a multi-device, cloud-synced ecosystem providing a seamless experience and native integration with major streaming services, Apple Music and Spotify in the future.

### Current Status ✅ Production Stable
- **v2.9.0** (Sprint 11: Spotify Integration - Phase 3 in progress)
- Frontend: `https://mjrp-playlist-generator.web.app`
- Backend API: Cloud Run (`mjrp-proxy`)
- Core features operational

> [!NOTE]
> **Recent Updates (Sprint 10)**:
> - 🟢 **Codebase Refactoring**: 9 modular files created (~1,125 lines)
> - 🟢 **AlbumsView.js**: 1,837 → 1,524 lines (-17%)
> - 🟢 **PlaylistsView.js**: 891 → 756 lines (-15%)
> - 🟢 **Deleted**: `app.legacy.js` (47KB savings)
> - 🟢 **New Modules**: `views/albums/`, `views/playlists/`, `server/routes/`

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
│   ├── app.js             # App orchestrator
│   ├── api/client.js      # Backend API client
│   ├── views/             # View components
│   │   ├── AlbumsView.js  # (1,524 lines, modularized)
│   │   ├── PlaylistsView.js # (756 lines, modularized)
│   │   ├── albums/        # Sprint 10: Extracted modules
│   │   │   ├── AlbumsGridRenderer.js
│   │   │   ├── AlbumsFilters.js
│   │   │   └── index.js
│   │   └── playlists/     # Sprint 10: Extracted modules
│   │       ├── PlaylistsExport.js
│   │       ├── PlaylistsDragDrop.js
│   │       └── index.js
│   └── shared/
│       └── normalize.js   # Shared normalization
├── css/
│   └── styles.css
└── config.js              # Firebase config
```

**Key Components**:
- `CurationEngine`: Stateless class for playlist generation
- `AlbumsGridRenderer`: Modular rendering for album grids
- `AlbumsFilters`: Modular filtering logic
- `PlaylistsExport`: Export to JSON/Apple Music
- `PlaylistsDragDrop`: SortableJS drag-and-drop configuration

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

See [CHANGELOG.md](CHANGELOG.md#v161-hotfix-production-deployment-2025-11-26) for details.

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

### Technical Decisions (v2.0)

#### Why Vite over Rollup?
**Decision**: Use Vite as bundler for v2.0

**Reasoning**:
- ✅ **Hot Module Replacement (HMR)**: Native dev server with instant updates
- ✅ **Build Speed**: Uses esbuild (10-100x faster than traditional bundlers)
- ✅ **Minimal Configuration**: Works out-of-the-box for most use cases
- ✅ **Firebase Hosting Compatible**: Serves static builds seamlessly
- ✅ **Tree Shaking**: Excellent bundle optimization

**Alternative Considered**: Rollup
- ❌ Requires manual dev server configuration
- 🟡 Slower build times
- 🟡 Higher learning curve

**Result**: Vite adopted in Sprint 1

#### Risk Analysis

**Critical Risks Identified**:

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Firestore Migration Data Loss** | 🟡 Medium | 🔴 High | Backup + staging + rollback plan |
| **Performance with Many Albums** | 🟡 Medium | 🟡 Medium | Client-side filtering → server queries |
| **BestEverAlbums Rate Limiting** | 🟢 Low | 🟡 Medium | Queue + retry logic + caching |
| **Breaking Changes v1.6 → v2.0** | 🟡 Medium | 🔴 High | Migration guide + v1.6 support period |

**All risks documented in Sprint planning with specific mitigations.**

### Firestore Migration Strategy

**Approach**: Lazy migration (on-demand)
- Users on first v2.0 login: localStorage → Firestore migration
- Backup created before migration
- Rollback capability if migration fails
- Migration script: `migrate-to-v2.js` (Node CLI)

See [ROADMAP.md](ROADMAP.md) for complete sprint breakdown (Sprints 1-9).

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

### Recent Achievements
- **Persistence Layer Complete**: Implemented robust Firestore integration for Series and Playlists using `artifacts/mjrp-albums/users/{uid}/curator` namespace to comply with security rules.
- **UI Enhancements**: 
    - Redesigned `SavedPlaylistsView` (Your Playlists Series) with modern cards, badges, and "Edit" flow.
    - Updated `SeriesView` and `PlaylistsView` for better UX.
- **Critical Bug Fixes**: Resolved "Ghost Albums" (Sprint 5.1) and Permission Denied errors (Sprint 5.4).(v2.0)
### Future Improvements
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

### Current Documentation
- **[ROADMAP.md](ROADMAP.md)** - Product roadmap (Sprints 1-9)
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture decisions
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development workflow

### Archived Planning Documents
*Historical v2.0 planning docs (archived 2025-12-02)*:
- `docs/archive/archive-backup.tar.gz` contains:
  - `mjrp-playlist-generator-2.0.md` - Original v2.0 vision (7-phase plan)
  - `V2.0_ANALYSIS.md` - Technical analysis (712 lines, risk assessment)

**Note**: Archived docs consolidated into ROADMAP.md and this summary.

---

**Maintainer**: @maujrp99  
**License**: MIT (assumed)  
**Repository**: [MJRP_AlbumsBalancedPlaylists_v0](https://github.com/maujrp99/MJRP_AlbumsBalancedPlaylists_v0)

*Last updated: 2025-11-26 - Post v1.6.1 deployment fix*
 
