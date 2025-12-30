# Component Reference

**Updated**: 2025-12-19
**Purpose**: Inventory and API reference for all system components

> For data flows and sequence diagrams, see [data_flow_architecture.md](data_flow_architecture.md)
> For bug tracking, see [DEBUG_LOG.md](../debug/DEBUG_LOG.md)

---

## Table of Contents

1. [Frontend Components](#frontend-components)
   - [Views](#views-10-files)
   - [Stores](#stores-5-files)
   - [Services](#services-6-files)
   - [Algorithms](#algorithms-7-files)
   - [Models](#models-4-files)
   - [Repositories](#repositories-5-files)
   - [Ranking Components](#components---ranking-3-files)
2. [Backend Components](#backend-components)
   - [Routes](#routes-4-files)
   - [Libraries](#libraries-10-files)

---

## Frontend Components

### Views (10 files)

| View | Purpose | Size | Status |
|------|---------|------|--------|
| [AlbumsView.js](file:///public/js/views/AlbumsView.js) | Series CRUD, Album grid | 52KB | ✅ |
| [HomeView.js](file:///public/js/views/HomeView.js) | Dashboard, Series list | 31KB | ✅ |
| [PlaylistsView.js](file:///public/js/views/PlaylistsView.js) | Generate playlists | 31KB | ✅ |
| [SavedPlaylistsView.js](file:///public/js/views/SavedPlaylistsView.js) | View saved batches | 31KB | ✅ |
| [InventoryView.js](file:///public/js/views/InventoryView.js) | Personal collection | 30KB | ✅ |
| [EditPlaylistView.js](file:///public/js/views/EditPlaylistView.js) | Edit existing batch | 22KB | ✅ |
| [ConsolidatedRankingView.js](file:///public/js/views/ConsolidatedRankingView.js) | Cross-album ranking | 11KB | ✅ |
| [RankingView.js](file:///public/js/views/RankingView.js) | Single album ranking | 8KB | ✅ |
| [SaveAllView.js](file:///public/js/views/SaveAllView.js) | Data migration | 6KB | ✅ |
| [BaseView.js](file:///public/js/views/BaseView.js) | View base class | 3KB | ✅ |

#### View Architecture
- All views extend `BaseView` providing lifecycle: `mount()`, `render()`, `destroy()`
- Strategy Pattern used in AlbumsView for Compact/Expanded modes
- Event delegation preferred over direct binding

---

#### EditPlaylistView (22KB, 628 lines, 26 methods)
**Purpose**: Edit existing playlist batches loaded from Firestore
**Fixes Issues**: #54 (Edit Batch Not Overwriting), #55 (Ghost Playlists)

**Key Methods**:
- `loadPlaylistsFromFirestore()`: Load batch by batchName + seriesId
- `handleSave()`: Delete old batch + save new (Atomic-like update)
- `handleGenerate()`: Regenerate playlists with selected algorithm
- `setupDragAndDrop()`: Enable track reordering via SortableJS
- `attachExportListeners()`: Apple Music + Spotify export buttons

#### InventoryView (30KB, 819 lines, 26 methods)
**Purpose**: Manage physical album collection (CD, Vinyl, DVD, Blu-ray, Digital)

**Key Methods**:
- `mount()`: Load from inventoryStore, subscribe to updates
- `handleStatusChange(albumId, status)`: Update ownership status
- `showEditAlbumModal(albumId)`: Open edit modal
- `hydrateCovers()`: Lazy-load HD cover art
- `filterAlbums(albums)`: Filter by format, search term
- `getStatistics()`: Collection stats (count, value by format)

#### SavedPlaylistsView (31KB, 667 lines, 24 methods)
**Purpose**: View all saved playlist batches grouped by series

**Key Methods**:
- `renderSeriesGroup(group)`: Render series with its batches
- `handleEditBatchPlaylists()`: Navigate to EditPlaylistView
- `handleDeleteBatch(seriesId, batchName)`: Delete all playlists in batch

#### ConsolidatedRankingView (11KB, 274 lines, 13 methods)
**Purpose**: Cross-album ranking - compare tracks across all albums in series

**Key Methods**:
- `getFilteredTracks()`: Get all tracks with optional album filter
- `render()`: Render sortable table with all tracks
- `attachEventListeners()`: Handle sort and filter changes (rank, rating, score, duration)

---

### Stores (5 files)

| Store | Purpose | Status |
|-------|---------|--------|
| [playlists.js](file:///public/js/stores/playlists.js) | Playlist state, batch management | ✅ |
| [albumSeries.js](file:///public/js/stores/albumSeries.js) | Series CRUD, Firestore sync | ✅ |
| [albums.js](file:///public/js/stores/albums.js) | Album data keyed by series | ✅ |
| [inventory.js](file:///public/js/stores/inventory.js) | Personal collection | ✅ |
| [UserStore.js](file:///public/js/stores/UserStore.js) | Auth state | ✅ |

#### InventoryStore (333 lines, 17 methods)
**Purpose**: Manage personal album collection
**State**: `{ albums, loading, error }`

**API**:
- `loadAlbums()`: Load from Firestore via InventoryRepository
- `addAlbum(album, format, options)`: Add album with format (CD, Vinyl, etc.)
- `updateAlbum(albumId, updates)`: Update album properties
- `updatePrice(albumId, price, currency)`: Optimistic price update
- `removeAlbum(albumId)`: Remove from inventory
- `getStatistics()`: Stats: count, total value by format

#### UserStore (106 lines, 11 methods)
**Purpose**: Authentication state management
**State**: `{ currentUser, isAuthenticated, loading, error }`

**API**:
- `loginWithGoogle()`: Firebase Google auth
- `loginWithApple()`: Firebase Apple auth
- `logout()`: Sign out
- `handleAuthChange(user)`: Called by AuthService on state change

---

### Services (6 files)

| Service | Purpose | Status |
|---------|---------|--------|
| [MusicKitService.js](file:///public/js/services/MusicKitService.js) | Apple Music API integration | ✅ |
| [SpotifyService.js](file:///public/js/services/SpotifyService.js) | Spotify API (search, tracks, export) | ✅ |
| [SpotifyAuthService.js](file:///public/js/services/SpotifyAuthService.js) | OAuth PKCE flow | ✅ |
| [AlbumLoader.js](file:///public/js/services/AlbumLoader.js) | Load local album data | ✅ |
| [OptimizedAlbumLoader.js](file:///public/js/services/OptimizedAlbumLoader.js) | Worker-based fuzzy search | ✅ |
| [DataSyncService.js](file:///public/js/services/DataSyncService.js) | Firestore sync utilities | ✅ |

---

### Algorithms (7 files)

| Algorithm | Purpose | Status |
|-----------|---------|--------|
| [index.js](file:///public/js/algorithms/index.js) | Registry & Factory | ✅ |
| [BaseAlgorithm.js](file:///public/js/algorithms/BaseAlgorithm.js) | Abstract Strategy Base | ✅ |
| [MJRPBalancedCascadeAlgorithm.js](file:///public/js/algorithms/MJRPBalancedCascadeAlgorithm.js) | **Recommended** Hybrid | ✅ |
| [MJRPBalancedCascadeV0Algorithm.js](file:///public/js/algorithms/MJRPBalancedCascadeV0Algorithm.js) | Legacy Hybrid | ✅ |
| [SDraftBalancedAlgorithm.js](file:///public/js/algorithms/SDraftBalancedAlgorithm.js) | S-Draft Variant | ✅ |
| [SDraftOriginalAlgorithm.js](file:///public/js/algorithms/SDraftOriginalAlgorithm.js) | Original S-Draft | ✅ |
| [LegacyRoundRobinAlgorithm.js](file:///public/js/algorithms/LegacyRoundRobinAlgorithm.js) | Simple Round Robin | ✅ |

#### Strategy Pattern
All algorithms extend `BaseAlgorithm` and implement `generate(albums, opts)`.
Usage: `getAlgorithmById('id').generate(...)`

**MJRPBalancedCascadeAlgorithm (Recommended)**:
- **Phase 1: Greatest Hits**: Top ranked tracks (rank #1, #2)
- **Phase 2: Deep Cuts**: Remaining tracks distributed by album balance
- **Phase 3: Cleanup**: Handling of orphans and duration limits (>48m)

---

### Models (4 files)

| Model | Purpose | Status |
|-------|---------|--------|
| [Album.js](file:///public/js/models/Album.js) | Album entity with tracks | ✅ |
| [Track.js](file:///public/js/models/Track.js) | Track entity with ranking data | ✅ |
| [Playlist.js](file:///public/js/models/Playlist.js) | Playlist entity | ✅ |
| [Series.js](file:///public/js/models/Series.js) | Album series entity | ✅ |

**Album Model**:
- `getTracks(order)`: Returns `tracks` (acclaim order) or `tracksOriginalOrder` (disc order)
- Properties: `id`, `title`, `artist`, `year`, `coverUrl`, `spotifyId`, `spotifyPopularity`

**Track Model**:
- Properties: `rank`, `rating`, `position`, `duration`, `spotifyUri`, `spotifyPopularity`
- `annotated`: Traceability info for ranking algorithm

---

### Repositories (5 files)

| Repository | Purpose | Status |
|------------|---------|--------|
| [BaseRepository.js](file:///public/js/repositories/BaseRepository.js) | Abstract CRUD | ✅ |
| [InventoryRepository.js](file:///public/js/repositories/InventoryRepository.js) | Inventory Collection | ✅ |
| [SeriesRepository.js](file:///public/js/repositories/SeriesRepository.js) | Series Collection | ✅ |
| [PlaylistRepository.js](file:///public/js/repositories/PlaylistRepository.js) | Playlist Subcollection | ✅ |
| [AlbumRepository.js](file:///public/js/repositories/AlbumRepository.js) | Album Subcollection | ✅ |

#### BaseRepository
- `findById(id)`, `findAll(filters)`, `create(data)`, `update(id, data)`, `delete(id)`
- Handles: caching keys, timestamps, and firestore references

#### InventoryRepository
- `addAlbum(album, format, options)`: Prevents duplicates
- `search(query)`: Search artist/title
- `getStatistics()`: Aggregated value and count by format

#### SeriesRepository
- `findWithAlbums(seriesId)`: Eager loads albums subcollection
- `createFromInventory(albumIds)`: Factory method

---

### Components - Ranking (3 files)

| Component | Purpose | Status |
|-----------|---------|--------|
| [TracksRankingComparison.js](file:///public/js/components/ranking/TracksRankingComparison.js) | Multi-source comparison | ✅ |
| [TracksTable.js](file:///public/js/components/ranking/TracksTable.js) | Desktop sortable table | ✅ |
| [TracksTabs.js](file:///public/js/components/ranking/TracksTabs.js) | Mobile tabbed view | ✅ |

---

---

### Universal UI Components (SafeDOM) (4 files)
**Status**: ✅ Phase 3 Complete

| Component | Purpose | Status |
|-----------|---------|--------|
| [SafeDOM.js](file:///public/js/utils/SafeDOM.js) | DOM Construction Utility | ✅ New |
| [BaseModal.js](file:///public/js/components/ui/BaseModal.js) | Standard Modal Shell | ✅ SafeDOM |
| [Card.js](file:///public/js/components/ui/Card.js) | Universal Entity Card | ✅ SafeDOM |
| [TrackRow.js](file:///public/js/components/ui/TrackRow.js) | Universal Track Row | ✅ SafeDOM |

#### SafeDOM Utility (168 lines, 15 methods)
**Purpose**: Securely create DOM elements without `innerHTML` sinks.
**Key API**:
- `create(tag, props, children)`: Factory method
- `div(props, children)`, `span(props, children)`, etc.
- `renderHTML(componentProps)`: Adapter pattern for legacy string support

#### Component Updates (Sprint 15)
- All UI components now return **DOM Nodes** via `render()`.
- Added `renderHTML()` static method for backwards compatibility.
- `BaseModal` includes `mount()` and `unmount()` helpers.

---

## Backend Components

### Routes (4 files)

| Route | Endpoints | Status |
|-------|-----------|--------|
| [albums.js](file:///server/routes/albums.js) | `POST /generate`, `POST /enrich-album` | ✅ |
| [playlists.js](file:///server/routes/playlists.js) | `/playlists/*` | ✅ |
| [musickit.js](file:///server/routes/musickit.js) | `GET /token` (Apple Music JWT) | ✅ |
| [debug.js](file:///server/routes/debug.js) | `/list-models`, `/raw-ranking` | ✅ |

### Libraries (10 files)

| Library | Purpose | Status |
|---------|---------|--------|
| [fetchRanking.js](file:///server/lib/fetchRanking.js) | BestEverAlbums scraping orchestrator | ✅ |
| [ranking.js](file:///server/lib/ranking.js) | Consolidate and normalize rankings | ✅ |
| [normalize.js](file:///server/lib/normalize.js) | Data normalization utilities | ✅ |
| [scrapers/besteveralbums.js](file:///server/lib/scrapers/besteveralbums.js) | Cheerio-based HTML scraper | ✅ |
| [aiClient.js](file:///server/lib/aiClient.js) | Google Gemini API client | ✅ |
| [prompts.js](file:///server/lib/prompts.js) | AI prompt templates | ✅ |
| [schema.js](file:///server/lib/schema.js) | AJV validation schemas | ✅ |
| [logger.js](file:///server/lib/logger.js) | Logging utilities | ✅ |
| [validateSource.js](file:///server/lib/validateSource.js) | Source validation helper | ✅ |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully documented |
| ⚠️ | Partially documented |
| ❌ | Not documented |
