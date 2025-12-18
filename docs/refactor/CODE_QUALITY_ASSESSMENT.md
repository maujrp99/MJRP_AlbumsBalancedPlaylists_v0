# Code Quality Assessment

**Created**: 2025-12-18
**Objective**: Map all files needing modularization, architecture improvements, and clean code compliance.

---

## 📊 Rating Scale

| Score | Label | Description |
|-------|-------|-------------|
| 🔴 1-2 | Critical | Urgent refactor needed. High complexity, >500 lines, many responsibilities |
| 🟠 3-4 | High | Needs attention. 300-500 lines, some violations, hard to maintain |
| 🟡 5-6 | Medium | Acceptable with tech debt. 150-300 lines, minor issues |
| 🟢 7-8 | Good | Clean code, single responsibility, well-documented |
| 🔵 9-10 | Excellent | Exemplary. Modular, tested, follows all patterns |

---

## 🏆 Priority Matrix (Top 10 Files Needing Refactor)

| Rank | File | Lines | Size | Score | Primary Issue |
|------|------|-------|------|-------|---------------|
| 1 | `AlbumsView.js` | 1,820 | 72KB | 🔴 **2** | God class, 31 methods, 6+ responsibilities |
| 2 | `app.legacy.js` | ~1,200 | 47KB | 🔴 **1** | Dead code, legacy monolith |
| 3 | `PlaylistsView.js` | 891 | 35KB | 🟠 **3** | Mixed concerns, drag/drop + export + save |
| 4 | `SavedPlaylistsView.js` | ~800 | 32KB | 🟠 **3** | Series history + batch editing together |
| 5 | `HomeView.js` | ~800 | 31KB | 🟠 **4** | Search + staging + add flow combined |
| 6 | `InventoryView.js` | ~780 | 30KB | 🟠 **4** | CRUD + display + modals combined |
| 7 | `MusicKitService.js` | ~650 | 26KB | 🟡 **5** | Apple Music SDK wrapper, 25+ methods |
| 8 | `server/index.js` | 535 | 24KB | 🟠 **3** | 7 endpoints in one file, no router |
| 9 | `curation.js` | ~550 | 23KB | 🟡 **5** | Algorithm logic, could split by algorithm |
| 10 | `fetchRanking.js` | ~450 | 19KB | 🟡 **5** | Ranking orchestration, complex fallbacks |

---

## 📁 Frontend Analysis (`public/js/`)

### Views (9 files)

| File | Lines | Methods | Score | Patterns | Issues |
|------|-------|---------|-------|----------|--------|
| `AlbumsView.js` | 1,820 | 31 | 🔴 **2** | BaseView, Strategy (partial) | God class: render/filter/load/modal/series all mixed |
| `PlaylistsView.js` | 891 | 29 | 🟠 **3** | BaseView, SortableJS | Drag logic embedded, export/save coupled |
| `SavedPlaylistsView.js` | ~800 | ~25 | 🟠 **3** | BaseView | History + Firestore access + batch edit |
| `HomeView.js` | ~800 | ~20 | 🟠 **4** | BaseView, Autocomplete | Search + staging area + album add |
| `InventoryView.js` | ~780 | ~22 | 🟠 **4** | BaseView, Modals | CRUD operations inline |
| `ConsolidatedRankingView.js` | ~280 | ~10 | 🟢 **7** | BaseView | Single purpose, clean |
| `RankingView.js` | ~220 | ~8 | 🟢 **7** | BaseView | Single purpose, clean |
| `SaveAllView.js` | ~160 | ~6 | 🟢 **8** | BaseView | Simple, focused |
| `BaseView.js` | 90 | 6 | 🔵 **9** | None | Good abstraction |

### Stores (5 files)

| File | Lines | Score | Patterns | Issues |
|------|-------|-------|----------|--------|
| `playlists.js` | ~350 | 🟡 **5** | Observer, State Machine | Batch context logic complex |
| `albumSeries.js` | ~310 | 🟡 **6** | Observer | Guest migration + Firebase mixed |
| `inventory.js` | ~260 | 🟡 **6** | Observer | Firestore coupling |
| `albums.js` | ~220 | 🟢 **7** | Observer | Clean state management |
| `UserStore.js` | ~60 | 🔵 **9** | Observer | Minimal, focused |

### Services (4 files)

| File | Lines | Score | Patterns | Issues |
|------|-------|-------|----------|--------|
| `MusicKitService.js` | ~650 | 🟡 **5** | Service, Facade | 25+ methods, handles too much |
| `AlbumLoader.js` | ~140 | 🟢 **7** | Service | Clean async loading |
| `OptimizedAlbumLoader.js` | ~100 | 🟢 **8** | Worker delegation | Well-modularized |
| `DataSyncService.js` | ~70 | 🔵 **9** | Event-based | Clean, minimal |

### Components (12 files)

| File | Lines | Score | Patterns | Issues |
|------|-------|-------|----------|--------|
| `InventoryModals.js` | ~430 | 🟡 **5** | Modal factory | Multiple modals in one |
| `Icons.js` | ~400 | 🟡 **6** | Icon factory | Large icon collection, acceptable |
| `Modals.js` | ~360 | 🟡 **5** | Modal factory | Multiple modals in one |
| `TopNav.js` | ~320 | 🟡 **6** | Component | Auth + nav combined |
| `ViewAlbumModal.js` | ~210 | 🟢 **7** | Modal component | Single purpose |
| `ConfirmationModal.js` | ~180 | 🟢 **7** | Modal component | Reusable |
| `Autocomplete.js` | ~135 | 🟢 **8** | Component | Clean, single purpose |
| `LoginModal.js` | ~125 | 🟢 **8** | Modal component | Auth focused |
| `EditAlbumModal.js` | ~115 | 🟢 **8** | Modal component | Single purpose |
| `Toast.js` | ~120 | 🔵 **9** | Singleton | Clean notification system |
| `Footer.js` | ~60 | 🔵 **9** | Pure component | Simple |
| `Breadcrumb.js` | ~48 | 🔵 **9** | Pure component | Simple |

### Algorithms (7 files)

| File | Lines | Score | Patterns | Issues |
|------|-------|-------|----------|--------|
| `LegacyRoundRobinAlgorithm.js` | ~560 | 🟡 **5** | Strategy | Complex, could simplify |
| `SDraftBalancedAlgorithm.js` | ~500 | 🟡 **6** | Strategy | S-Draft implementation |
| `MJRPBalancedCascadeAlgorithm.js` | ~390 | 🟡 **6** | Strategy | Cascade logic |
| `MJRPBalancedCascadeV0Algorithm.js` | ~310 | 🟢 **7** | Strategy | Earlier version |
| `SDraftOriginalAlgorithm.js` | ~280 | 🟢 **7** | Strategy | Base S-Draft |
| `BaseAlgorithm.js` | ~165 | 🔵 **9** | Abstract base | Clean interface |
| `index.js` | ~75 | 🔵 **9** | Factory | Clean exports |

### Other Frontend

| File | Lines | Score | Patterns | Issues |
|------|-------|-------|----------|--------|
| `curation.js` | ~550 | 🟡 **5** | Orchestrator | Complex algorithm invocation |
| `router.js` | ~165 | 🟢 **7** | SPA Router | Clear navigation |
| `app.js` | ~110 | 🟢 **8** | Entry point | Clean initialization |
| `app.legacy.js` | ~1,200 | 🔴 **1** | Monolith | ⚠️ **DELETE CANDIDATE** |
| `api/client.js` | ~490 | 🟡 **6** | API Client | Caching + fetch mixed |

---

## 📁 Backend Analysis (`server/`)

### Core Server

| File | Lines | Score | Patterns | Issues |
|------|-------|-------|----------|--------|
| `index.js` | 535 | 🟠 **3** | Express monolith | 7 endpoints, no routing layer |
| `routes/musickit.js` | ~50 | 🟢 **8** | Route module | Only MusicKit routes |

### Server Lib

| File | Lines | Score | Patterns | Issues |
|------|-------|-------|----------|--------|
| `fetchRanking.js` | ~450 | 🟡 **5** | Orchestrator | BestEver + Spotify + AI fallback |
| `scrapers/besteveralbums.js` | ~580 | 🟠 **4** | Scraper | 10+ functions, complex parsing |
| `normalize.js` | ~225 | 🟡 **6** | Utility | String normalization |
| `ranking.js` | ~220 | 🟢 **7** | Business logic | Borda count, consolidation |
| `aiClient.js` | ~40 | 🔵 **9** | HTTP client | Clean wrapper |
| `prompts.js` | ~25 | 🔵 **9** | Config | Prompt templates |
| `logger.js` | ~15 | 🔵 **9** | Logging | Minimal |
| `schema.js` | ~15 | 🔵 **9** | Validation | AJV loader |
| `services/spotifyPopularity.js` | ~140 | 🟢 **7** | Service | Clean Spotify API |

---

## 🎯 Recommendations by Priority

### 🔴 P0 - Immediate (Week 1)

1. **Delete `app.legacy.js`** - Dead code, 47KB savings
2. **Modularize `AlbumsView.js`** - Extract:
   - `AlbumsGridRenderer.js` - Grid/List rendering
   - `AlbumsFilters.js` - Filter logic
   - `SeriesModals.js` - Modal handlers
   - `AlbumsLoader.js` - Data loading orchestration

### 🟠 P1 - Short Term (Week 2-3)

3. **Route Extraction `server/index.js`** - Create:
   - `routes/albums.js` - `/api/generate`, `/api/enrich-album`
   - `routes/playlists.js` - `/api/playlists`
   - `routes/debug.js` - Debug endpoints

4. **Split `PlaylistsView.js`** - Extract:
   - `PlaylistsDragDrop.js` - SortableJS logic
   - `PlaylistsExport.js` - Apple Music export

### 🟡 P2 - Medium Term (Week 4+)

5. **Refactor `MusicKitService.js`** - Split into:
   - `MusicKitAuth.js` - Token/init
   - `MusicKitSearch.js` - Search operations
   - `MusicKitPlaylist.js` - Playlist creation

6. **Consolidate Modals** - Create modal registry pattern

---

## 📈 Progress Tracking

| Phase | Target Score | Current Avg | Files Fixed |
|-------|--------------|-------------|-------------|
| P0 | 5.0 | 3.2 | 0/2 |
| P1 | 6.0 | 4.5 | 0/4 |
| P2 | 7.0 | 5.5 | 0/6 |

**Overall Codebase Score**: 🟡 **5.2/10**

---

## 📎 Related Documents

- [Implementation Plan](file:///C:/Users/Mauricio%20Pedroso/.gemini/antigravity/brain/143c16bd-1fa9-4271-aac1-d273d531dbbb/implementation_plan.md)
- [Architecture](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/ARCHITECTURE.md)
- [Constitution](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/CONSTITUTION.md)
