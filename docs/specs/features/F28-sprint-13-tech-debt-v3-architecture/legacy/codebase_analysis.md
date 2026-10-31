# Complete Codebase Analysis - 2025-12-25

## Project Structure Overview

### Frontend (`public/js/`)
```
├── algorithms/         # Playlist generation algorithms (16 files)
├── api/                # API client (client.js)
├── cache/              # Cache management (4 files)
├── components/         # UI components (46 files)
├── controllers/        # Business logic (2 files)
│   ├── PlaylistsController.js  # Playlist operations
│   └── SeriesController.js     # Album loading orchestration
├── models/             # Domain models (4 files)
├── ranking/            # Ranking strategies (5 files)
├── repositories/       # Firestore access (5 files)
├── services/           # Domain services (10 files)
├── stores/             # In-memory state (6 files)
├── transformers/       # Data transformation (2 files)
├── views/              # View orchestrators (13+ files)
└── workers/            # Web Workers (1 file)
```

### Backend (`server/`)
```
├── routes/             # API endpoints
│   ├── albums.js       # /api/generate, /api/enrich-album
│   ├── playlists.js    # Playlist CRUD
│   └── musickit.js     # Apple Music auth
├── lib/                # Core logic
│   ├── fetchRanking.js # BestEver scraper integration
│   ├── normalize.js    # Track normalization
│   └── ranking.js      # Ranking consolidation
└── services/           # External integrations
```

---

## Data Flow Architecture

### Album Loading Pipeline (API)
```
User Input (Query)
    ↓
apiClient.fetchAlbum(query)    [Frontend: api/client.js]
    ↓
POST /api/generate              [Backend: routes/albums.js]
    ↓
┌─────────────────────────────────────┐
│  1. AI (Gemini) call for tracklist  │
│  2. BestEver Scraper for rankings   │
│  3. Ranking consolidation           │
│  4. Track normalization             │
└─────────────────────────────────────┘
    ↓
Response: { album, tracks, tracksByAcclaim, rankingConsolidated }
    ↓
apiClient.normalizeAlbumData()
    ↓
Album Model Instance (with tracks + rankings)
    ↓
albumsStore.addAlbumToSeries()
```

### Playlist Generation Flow
```
User clicks "Generate"
    ↓
PlaylistsController.handleGenerate()
    ↓
PlaylistGenerationService.generate(albums, config)
    ↓
Algorithm.generate(albums, { rankingStrategy })
    ↓
TrackTransformer.toCanonical(track)
    ↓
playlistsStore.setPlaylists(playlists)
```

### Playlist Persistence Flow
```
User clicks "Save"
    ↓
PlaylistsController.handleSave()
    ↓
PlaylistPersistenceService.save(seriesId, playlists, batchName)
    ↓
PlaylistRepository.save() → Firestore
```

---

## Key Services & Their Roles

| Service | Purpose | Location |
|---------|---------|----------|
| `apiClient` | Backend API calls with caching | `api/client.js` |
| `AlbumLoader` | Load album metadata from CSV/JSON | `services/AlbumLoader.js` |
| `OptimizedAlbumLoader` | Web Worker fuzzy search (30k+ albums) | `services/OptimizedAlbumLoader.js` |
| `PlaylistGenerationService` | Algorithm execution + track transform | `services/PlaylistGenerationService.js` |
| `PlaylistPersistenceService` | Firestore CRUD for playlists | `services/PlaylistPersistenceService.js` |
| `AuthService` | Firebase Auth management | `services/AuthService.js` |
| `SpotifyEnrichmentService` | Spotify popularity data | `services/SpotifyEnrichmentService.js` |

---

## Controllers vs Views

### V3 Architecture Pattern:
```
View (Orchestrator)
  ├── render()      → HTML generation
  ├── mount()       → Initialize controller, subscribe stores
  ├── update()      → Re-render on store change
  └── Events        → Delegate to Controller

Controller (Brain)
  ├── loadInitialData()
  ├── handleGenerate()
  ├── handleSave()
  ├── loadAlbumsForSeries()
  └── No DOM manipulation

Store (State)
  ├── setPlaylists()
  ├── getPlaylists()
  └── notify() → View.update()
```

---

## Critical Findings for Current Bug

### Album Loading Pattern (Correct):
1. `SeriesController.loadScope()` → `loadAlbumsFromQueries()` → `apiClient.fetchMultipleAlbums()`
2. Albums with full track data come from **Backend API** (not Firestore)
3. `AlbumRepository` stores minimal album metadata (for persistence only)
4. Full album data with tracks is transient (in `albumsStore` during session)

### Why `OptimizedAlbumLoader` is NOT for album loading:
- It's a **search/autocomplete** service
- Uses Web Worker for performance
- Returns lightweight album metadata (no tracks!)
- Used for: HomeView search bar, Series dropdown autocomplete

### Correct Implementation Pattern:
```javascript
// PlaylistsController.loadAlbumsForSeries (CORRECT)
async loadAlbumsForSeries(seriesId) {
    // 1. Get albumQueries from series
    const activeSeries = albumSeriesStore.getActiveSeries()
    
    // 2. Load via API (with track data)
    const { results } = await apiClient.fetchMultipleAlbums(
        activeSeries.albumQueries,
        (current, total, result) => {
            if (result.album) {
                albumsStore.addAlbumToSeries(seriesId, result.album)
            }
        }
    )
}
```

---

## Analysis Timestamp
- **Generated**: 2025-12-25T21:29:00-03:00
- **Purpose**: Pre-implementation architectural understanding
- **Status**: Ready for verification
