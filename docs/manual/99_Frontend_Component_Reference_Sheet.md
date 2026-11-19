# Component Reference

**Updated**: 2026-11-19 (file lists, sizes and method names checked against the code)
**Purpose**: Inventory and API reference for all system components

> For data flows and sequence diagrams, see [01_System_Architecture.md](01_System_Architecture.md) and [21_Dynamic_UI_Mapping.md](21_Dynamic_UI_Mapping.md)
> For bug tracking, see [DEBUG_LOG.md](../debug/DEBUG_LOG.md)

---

## Table of Contents

1. [Frontend Components](#frontend-components)
   - [Views](#views-11-files)
   - [Controllers](#controllers-5-files)
   - [Stores](#stores-8-files)
   - [Services](#services)
   - [Algorithms](#algorithms)
   - [Models](#models-13-files)
   - [Repositories](#repositories-8-files)
   - [Ranking Components](#components---ranking-4-files)
2. [Backend Components](#backend-components)
   - [Routes](#routes-5-files)
   - [Libraries](#libraries)

---

## Frontend Components

### Views (11 files)

| View | Purpose | Size | Status |
|------|---------|------|--------|
| [SeriesView.js](file:///public/js/views/SeriesView.js) | Albums screen (`/albums`, `/albums/:seriesId`): series and album grid | 215 lines | ✅ |
| [HomeView.js](file:///public/js/views/HomeView.js) | Artist scan, bulk paste, staging area, new series | 271 lines | ✅ |
| [BlendingMenuView.js](file:///public/js/views/BlendingMenuView.js) | Blend wizard (`/blend`) | 449 lines | ✅ |
| [PlaylistsView.js](file:///public/js/views/PlaylistsView.js) | Generated playlists; also the edit mode (`/playlists/edit`) | 342 lines | ✅ |
| [SavedPlaylistsView.js](file:///public/js/views/SavedPlaylistsView.js) | View saved batches | 339 lines | ✅ |
| [InventoryView.js](file:///public/js/views/InventoryView.js) | Personal collection | 270 lines | ✅ |
| [ConsolidatedRankingView.js](file:///public/js/views/ConsolidatedRankingView.js) | Cross-album ranking | 319 lines | ✅ |
| [RankingView.js](file:///public/js/views/RankingView.js) | Single album ranking | 217 lines | ✅ |
| [SaveAllView.js](file:///public/js/views/SaveAllView.js) | Data migration | 183 lines | ✅ SafeDOM (Node) |
| [ComingSoonView.js](file:///public/js/views/ComingSoonView.js) | Placeholder for `/artists`, `/genres`, `/tracks` | 66 lines | ✅ |
| [BaseView.js](file:///public/js/views/BaseView.js) | View base class | 144 lines | ✅ |

`AlbumsView.js` and `EditPlaylistView.js` no longer exist: the albums screen is `SeriesView` and the edit of a saved batch is `PlaylistsView` in edit mode.

#### View Architecture
- All views extend `BaseView` providing lifecycle: `mount()`, `render()`, `destroy()`
- The view logic lives in the controllers (`public/js/controllers/`); the views draw and forward events
- Event delegation preferred over direct binding

---

#### InventoryView (270 lines)
**Purpose**: Manage physical album collection (CD, Vinyl, Digital...)

**Key Methods**:
- `mount()`: Subscribes to `inventoryStore` and initializes `InventoryController`, which loads the albums
- `render(input)`, `renderFilters(state)`: Drawn with `views/renderers/InventoryGridRenderer.js`
- `attachEventListeners()`: Delegates the actions to the controller (`handleStatusChange`, `handleCurrencyChange`, ...)
- `handleEditWithModal(albumId)`, `handleViewWithModal(albumId)`: Open the modals
- `handleDeleteWithModal(albumId)`: Confirms and calls `InventoryController.handleDelete`. **Known defect**: that method calls `inventoryStore.deleteAlbum`, which does not exist (the store has `removeAlbum`), so the delete does not work today.

#### SavedPlaylistsView (339 lines)
**Purpose**: View all saved playlist batches grouped by series

**Key Methods**:
- `renderSeriesGroup(group)`: Render series with its batches
- `handleDeleteBatch(seriesId, batchName)`: Delete all playlists in batch
- `handleDeleteAll(...)`: Delete all playlists of a series
- Editing a batch goes through `SavedPlaylistsController.editBatch`, which navigates to `/playlists/edit` (`PlaylistsView`)

#### ConsolidatedRankingView (319 lines)
**Purpose**: Cross-album ranking - compare tracks across all albums in series

**Key Methods**:
- `getFilteredTracks()`: Get all tracks with optional album filter
- `renderContent()`, `renderTable(tracks)`: Render sortable table with all tracks
- `handleSort(field)`: Handle sort changes

---

### Controllers (5 files)

| Controller | Purpose | Status |
|---|---|---|
| [SeriesController.js](file:///public/js/controllers/SeriesController.js) | Albums screen: says what the screen wants; the load belongs to `AlbumLoadService` | ✅ |
| [HomeController.js](file:///public/js/controllers/HomeController.js) | Home: scan, staging, bulk paste, new series | ✅ |
| [BlendingController.js](file:///public/js/controllers/BlendingController.js) | Blend: loads the albums of the series (own loop, `apiClient.fetchAlbum`) and generates | ✅ |
| [PlaylistsController.js](file:///public/js/controllers/PlaylistsController.js) | Playlist Generation, Editing, Saving | ✅ |
| [InventoryController.js](file:///public/js/controllers/InventoryController.js) | Inventory Management | ✅ |

---

### Stores (8 files)

| Store | Purpose | Status |
|-------|---------|--------|
| [playlists.js](file:///public/js/stores/playlists.js) | Playlist state (pure state; the operations are in `PlaylistsService`) | ✅ |
| [albumSeries.js](file:///public/js/stores/albumSeries.js) | Series state | ✅ |
| [albums.js](file:///public/js/stores/albums.js) | Album data keyed by series | ✅ |
| [albumLoad.js](file:///public/js/stores/albumLoad.js) | State of the album load (see `06_Frontend_Data_Store.md`) | ✅ |
| [ownRankings.js](file:///public/js/stores/ownRankings.js) | The person's own rankings | ✅ |
| [SpotifyEnrichmentStore.js](file:///public/js/stores/SpotifyEnrichmentStore.js) | Spotify enrichment data | ✅ |
| [inventory.js](file:///public/js/stores/inventory.js) | Personal collection | ✅ |
| [UserStore.js](file:///public/js/stores/UserStore.js) | Auth state | ✅ |

#### InventoryStore (332 lines)
**Purpose**: Manage personal album collection
**State**: `{ albums, loading, error }`

**API**:
- `loadAlbums()`: Load from Firestore via InventoryRepository
- `addAlbum(album, format, options)`: Add album with format (CD, Vinyl, etc.)
- `updateAlbum(albumId, updates)`: Update album properties
- `updatePrice(albumId, price, currency)`: Optimistic price update
- `removeAlbum(albumId)`: Remove from inventory (there is no `deleteAlbum`)
- `getStatistics()`: Stats: count, total value by format

#### UserStore (105 lines)
**Purpose**: Authentication state management
**State**: `{ currentUser, isAuthenticated, loading, error }`

**API**:
- `loginWithGoogle()`: Firebase Google auth
- `loginWithApple()`: Firebase Apple auth
- `logout()`: Sign out
- `handleAuthChange(user)`: Called by AuthService on state change

#### PlaylistsStore (161 lines)
**Purpose**: Holds the generated playlists and the editing state. It is pure state: setters, getters and `subscribe`.
**State**: `{ playlists, seriesId, config, mode, editContext, batchName, isDirty, isSynchronized, loading, canUndo, canRedo }`

**API**:
- `setPlaylists(playlists, seriesId)`: Initialize state
- `setMode`, `setEditContext`, `setBatchName`, `setDefaultBatchName`, `setDirty`, `setUndoState`, ...: setters
- `getPlaylists()`, `getSeriesId()`, `getEditContext()`, `isEditingExistingBatch()`, `getState()`: getters

The operations live in `services/PlaylistsService.js` (`getPlaylistsService(db, cacheManager)`):
- `setEditMode(batchName, seriesId, savedAt)` / `setCreateMode()`: Enable editing of an existing batch
- `moveTrack(fromPlaylist, toPlaylist, trackIndex, newIndex)`, `reorderTrack(...)`: Drag and drop support
- `removeTrack(playlistIndex, trackIndex)`: Delete track logic
- `undo()` / `redo()`: Version history (`services/playlists/PlaylistHistoryService.js`)
- `saveBatch(userId, seriesId, playlists)`, `loadBatch(...)`, `deleteBatch(...)`: Persistence

#### PlaylistsController (395 lines, 8 methods)
**Purpose**: Business logic for PlaylistsView (Generation, Editing, Persistence)

**Key Methods**:
- `initialize(params)`: Route handler (detects Create vs Edit mode)
- `handleGenerate(config)`: Orchestrates blending algorithm
- `deleteTrack(playlistIndex, trackIndex)`: Proxies delete to `PlaylistsService.removeTrack`
- `handleSave(batchName)`: Saves the batch; in edit mode deletes the playlists of the original batch name first
- `loadPlaylistsForEdit(batchName, seriesId)`: Hydrates store from backend
- `loadAlbumsForSeries(seriesId)`: In edit mode, loads the albums of the series with `apiClient.fetchMultipleAlbums` (its own loop, not `AlbumLoadService`)

---

### Services

The table lists the main services; the album loading services (`services/albums/`) and the others are described in `17_Frontend_Services.md`.

| Service | Purpose | Status |
|---------|---------|--------|
| [MusicKitService.js](file:///public/js/services/MusicKitService.js) | **Facade**: Apple Music API | ✅ Sprint 17 |
| [MusicKitAuth.js](file:///public/js/services/musickit/MusicKitAuth.js) | **Module**: Auth & Tokens | ✅ Sprint 17 |
| [MusicKitCatalog.js](file:///public/js/services/musickit/MusicKitCatalog.js) | **Module**: Search & Metadata | ✅ Sprint 17 |
| [MusicKitLibrary.js](file:///public/js/services/musickit/MusicKitLibrary.js) | **Module**: Library & Playlists | ✅ Sprint 17 |
| [SeriesFilterService.js](file:///public/js/services/SeriesFilterService.js) | Pure func filtering logic | ✅ Sprint 17 |
| [PlaylistGenerationService.js](file:///public/js/services/PlaylistGenerationService.js) | **Strategy**: Curation Pipeline | ✅ Sprint 17 |
| [SpotifyService.js](file:///public/js/services/SpotifyService.js) | Spotify API (search, tracks, export) | ✅ |
| [SpotifyAuthService.js](file:///public/js/services/SpotifyAuthService.js) | OAuth PKCE flow | ✅ |
| [AlbumLoader.js](file:///public/js/services/AlbumLoader.js) | Load local album data | ✅ |
| [OptimizedAlbumLoader.js](file:///public/js/services/OptimizedAlbumLoader.js) | Worker-based fuzzy search | ✅ |
| [DataSyncService.js](file:///public/js/services/DataSyncService.js) | Guest-to-account migration of inventory and series | ✅ |
| [PlaylistsService.js](file:///public/js/services/PlaylistsService.js) | Playlist operations, undo/redo, batch persistence | ✅ |
| [PlaylistPersistenceService.js](file:///public/js/services/PlaylistPersistenceService.js) | Facade over `PlaylistRepository` / `SeriesRepository` | ✅ |
| [SeriesService.js](file:///public/js/services/SeriesService.js) | Series CRUD, refetch of album metadata | ✅ |
| [SpotifyExportService.js](file:///public/js/services/SpotifyExportService.js) | Export of playlists to Spotify | ✅ |
| [albums/AlbumLoadService.js](file:///public/js/services/albums/AlbumLoadService.js) | The one owner of the album load of the albums screen | ✅ |
| [ranking/OwnRankingService.js](file:///public/js/services/ranking/OwnRankingService.js) | Saving of the person's own ranking | ✅ |

---

### Algorithms

| Algorithm | Purpose | Status |
|-----------|---------|--------|
| [index.js](file:///public/js/algorithms/index.js) | Registry & Factory | ✅ |
| [BaseAlgorithm.js](file:///public/js/algorithms/BaseAlgorithm.js) | Abstract Strategy Base | ✅ |
| [MJRPBalancedCascadeAlgorithm.js](file:///public/js/algorithms/MJRPBalancedCascadeAlgorithm.js) | **Recommended** Hybrid | ✅ Registered (`mjrp-balanced-cascade`) |
| [TopNAlgorithm.js](file:///public/js/algorithms/TopNAlgorithm.js) | Base of the Top N recipes | ✅ |
| [TopNPopularAlgorithm.js](file:///public/js/algorithms/TopNPopularAlgorithm.js) | Top N by Spotify popularity | ✅ Registered (`top-n-popular`) |
| [TopNAcclaimedAlgorithm.js](file:///public/js/algorithms/TopNAcclaimedAlgorithm.js) | Top N by BestEverAlbums | ✅ Registered (`top-n-acclaimed`) |
| [TopNUserAlgorithm.js](file:///public/js/algorithms/TopNUserAlgorithm.js) | Top N by the person's own ranking | ✅ Registered (`top-n-user`) |
| [MJRPBalancedCascadeV0Algorithm.js](file:///public/js/algorithms/MJRPBalancedCascadeV0Algorithm.js) | Legacy Hybrid | Not registered |
| [SDraftBalancedAlgorithm.js](file:///public/js/algorithms/SDraftBalancedAlgorithm.js) | S-Draft Variant | Not registered |
| [SDraftOriginalAlgorithm.js](file:///public/js/algorithms/SDraftOriginalAlgorithm.js) | Original S-Draft | Not registered |
| [LegacyRoundRobinAlgorithm.js](file:///public/js/algorithms/LegacyRoundRobinAlgorithm.js) | Simple Round Robin | Not registered |
| `Top3*Algorithm.js`, `Top5*Algorithm.js` | Fixed-N predecessors of the Top N recipes | Not registered |

#### Strategy Pattern
All algorithms extend `BaseAlgorithm` and implement `generate(albums, opts)`.
Usage: `createAlgorithm('id').generate(...)` (or `getAlgorithm('id')` for the class); only the registered ids are returned.

**MJRPBalancedCascadeAlgorithm (Recommended)**:
- **Phase 1: Greatest Hits**: Top ranked tracks (rank #1, #2)
- **Phase 2: Deep Cuts**: Remaining tracks distributed by album balance
- **Phase 3: Cleanup**: Handling of orphans and duration limits (>48m)

---

### Models (13 files)

| Model | Purpose | Status |
|-------|---------|--------|
| [Album.js](file:///public/js/models/Album.js) | Album entity with tracks | ✅ |
| [Track.js](file:///public/js/models/Track.js) | Track entity with ranking data | ✅ |
| [Playlist.js](file:///public/js/models/Playlist.js) | Playlist entity | ✅ |
| [Series.js](file:///public/js/models/Series.js) | Album series entity | ✅ |
| `AlbumIdentity.js`, `albumFacts.js`, `albumLoadState.js`, `albumQuery.js`, `cloneAlbum.js`, `ownRanking.js`, `paging.js`, `seriesFilter.js`, `text.js` | Pure rules of the album loading, paging, filters and own ranking; see `08_Frontend_Models.md` | ✅ |

**Album Model**:
- `getTracks(order)`: Returns `tracks` (acclaim order) or `tracksOriginalOrder` (disc order)
- Properties: `id`, `title`, `artist`, `year`, `coverUrl`, `spotifyId`, `spotifyPopularity`

**Track Model**:
- Properties: `acclaimRank` (alias `rank`), `rating`, `position`, `duration`, `spotifyUri`, `spotifyPopularity`
- `rankingInfo`: Traceability info added by the algorithms (`BaseAlgorithm.annotateTrack`)

---

### Repositories (8 files)

| Repository | Purpose | Status |
|------------|---------|--------|
| [BaseRepository.js](file:///public/js/repositories/BaseRepository.js) | Abstract CRUD | ✅ |
| [InventoryRepository.js](file:///public/js/repositories/InventoryRepository.js) | Inventory Collection | ✅ |
| [SeriesRepository.js](file:///public/js/repositories/SeriesRepository.js) | Series Collection | ✅ |
| [PlaylistRepository.js](file:///public/js/repositories/PlaylistRepository.js) | Playlist Subcollection | ✅ |
| [AlbumRepository.js](file:///public/js/repositories/AlbumRepository.js) | Album Subcollection | ✅ |
| [SharedAlbumRepository.js](file:///public/js/repositories/SharedAlbumRepository.js) | Root collection `albums`: one document per album, shared by every account; written only by "Refetch Metadata" | ✅ |
| [UserRankingRepository.js](file:///public/js/repositories/UserRankingRepository.js) | The person's own rankings | ✅ |
| [SpotifyEnrichmentRepository.js](file:///public/js/repositories/SpotifyEnrichmentRepository.js) | Spotify enrichment data | ✅ |

#### BaseRepository
- `findById(id)`, `findAll(filters)`, `create(data)`, `update(id, data)`, `delete(id)`
- Handles: caching keys, timestamps, and firestore references

#### InventoryRepository
- `addAlbum(album, format, options)`: Prevents duplicates
- `search(query)`: Search artist/title
- `getStatistics()`: Aggregated value and count by format

#### SeriesRepository
- `findWithAlbums(seriesId)`: Eager loads albums subcollection
- `createFromInventory(albumIds, seriesName)`: Factory method
- `rename(...)`, `getCount()`, `saveAlbumFacts(...)`

---

### Components - Ranking (4 files)

| Component | Purpose | Status |
|-----------|---------|--------|
| [TracksRankingComparison.js](file:///public/js/components/ranking/TracksRankingComparison.js) | Multi-source comparison | ✅ |
| [TracksTable.js](file:///public/js/components/ranking/TracksTable.js) | Desktop sortable table | ✅ SafeDOM |
| [TracksTabs.js](file:///public/js/components/ranking/TracksTabs.js) | Mobile tabbed view | ✅ SafeDOM |
| [UserRankModal.js](file:///public/js/components/ranking/UserRankModal.js) | Drag-and-drop modal of the person's own ranking; opens in the order of the saved ranking, reports through `onSubmit`, and the saving is done by `SeriesController.saveRanking` via `OwnRankingService` | ✅ |

---

---

### Universal UI Components (SafeDOM) (4 files)
**Status**: ✅ Phase 4 Refined

| Component | Purpose | Status |
|-----------|---------|--------|
| [SafeDOM.js](file:///public/js/utils/SafeDOM.js) | DOM Construction Utility | ✅ New |
| [BaseModal.js](file:///public/js/components/ui/BaseModal.js) | Standard Modal Shell | ✅ SafeDOM |
| [Card.js](file:///public/js/components/ui/Card.js) | Universal Entity Card | ✅ SafeDOM |
| [TrackRow.js](file:///public/js/components/ui/TrackRow.js) | Universal Track Row | ✅ SafeDOM |

#### SafeDOM Utility
**Purpose**: Securely create DOM elements without `innerHTML` sinks.
**Key API**:
- `create(tag, props, children)`: Factory method
- `div(props, children)`, `span(props, children)`, etc.
- `header()`, `aside()`, `section()`, etc. (Semantic Tags)
- `fromHTML(html)`, `text(str)`, `fragment(children)`, `clear(el)`, `replaceChildren(el, ...)`
- `renderHTML()` is not a SafeDOM method: it is a static method of the UI components (`Card`, `TrackRow`, `BaseModal`) for legacy string support

#### Component Updates (Sprint 15)
- All UI components now return **DOM Nodes** via `render()`.
- Added `renderHTML()` static method for backwards compatibility.
- `BaseModal` includes `mount()` and `unmount()` helpers.

---

## Backend Components

### Routes (5 files)

All mounted under `/api` (`ai.js` under `/api/ai`). See `03_Backend_API_Layer.md`.

| Route | Endpoints | Status |
|-------|-----------|--------|
| [albums.js](file:///server/routes/albums.js) | `POST /generate`, `POST /enrich-album` | ✅ |
| [playlists.js](file:///server/routes/playlists.js) | `POST /playlists` | ✅ |
| [musickit.js](file:///server/routes/musickit.js) | `GET /musickit-token` (Apple Music JWT), `GET /musickit-status` | ✅ |
| [ai.js](file:///server/routes/ai.js) | `POST /ai/studio-albums` | ✅ |
| [debug.js](file:///server/routes/debug.js) | `GET /list-models`, `POST /debug/raw-ranking`, `GET /debug/files`, `GET /debug/import` | ✅ |

### Libraries

| Library | Purpose | Status |
|---------|---------|--------|
| [fetchRanking.js](file:///server/lib/fetchRanking.js) | Ranking orchestrator (BestEverAlbums, Spotify popularity, AI) | ✅ |
| [ranking.js](file:///server/lib/ranking.js) | Consolidate and normalize rankings | ✅ |
| [normalize.js](file:///server/lib/normalize.js) | Data normalization utilities | ✅ |
| [scrapers/besteveralbums.js](file:///server/lib/scrapers/besteveralbums.js) | Cheerio-based HTML scraper | ✅ |
| [aiClient.js](file:///server/lib/aiClient.js) | Google Gemini API client | ✅ |
| [prompts.js](file:///server/lib/prompts.js) | AI prompt templates | ✅ |
| [schema.js](file:///server/lib/schema.js) | AJV validation schemas | ✅ |
| [logger.js](file:///server/lib/logger.js) | Logging utilities | ✅ |
| [validateSource.js](file:///server/lib/validateSource.js) | Source validation helper | ✅ |
| [services/EnrichmentService.js](file:///server/lib/services/EnrichmentService.js) | Logic of `POST /api/enrich-album` | ✅ |
| [services/GenerationService.js](file:///server/lib/services/GenerationService.js) | Logic of `POST /api/generate` | ✅ |
| [services/spotifyPopularity.js](file:///server/lib/services/spotifyPopularity.js) | Spotify track popularity (client credentials) | ✅ |
| [../services/MusicKitTokenService.js](file:///server/services/MusicKitTokenService.js) | Apple MusicKit developer token (`server/services/`) | ✅ |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully documented |
| ⚠️ | Partially documented |
| ❌ | Not documented |
