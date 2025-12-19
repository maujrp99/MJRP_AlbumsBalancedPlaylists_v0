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
| [AlbumsView.js](file:///public/js/views/AlbumsView.js) | Series CRUD, Album grid | 52KB | ✅ Documented |
| [HomeView.js](file:///public/js/views/HomeView.js) | Dashboard, Series list | 31KB | ✅ Documented |
| [PlaylistsView.js](file:///public/js/views/PlaylistsView.js) | Generate playlists | 31KB | ✅ Documented |
| [SavedPlaylistsView.js](file:///public/js/views/SavedPlaylistsView.js) | View saved batches | 31KB | ❌ Pending |
| [InventoryView.js](file:///public/js/views/InventoryView.js) | Personal collection | 30KB | ❌ Pending |
| [EditPlaylistView.js](file:///public/js/views/EditPlaylistView.js) | Edit existing batch | 22KB | ❌ Pending |
| [ConsolidatedRankingView.js](file:///public/js/views/ConsolidatedRankingView.js) | Cross-album ranking | 11KB | ❌ Pending |
| [RankingView.js](file:///public/js/views/RankingView.js) | Single album ranking | 8KB | ✅ Documented |
| [SaveAllView.js](file:///public/js/views/SaveAllView.js) | Data migration | 6KB | ✅ Documented |
| [BaseView.js](file:///public/js/views/BaseView.js) | View base class | 3KB | ✅ Documented |

#### View Architecture Notes
- All views extend `BaseView` which provides lifecycle methods
- Views use Strategy Pattern for different rendering modes (see AlbumsView)
- Event delegation preferred over direct binding

---

### Stores (5 files)

| Store | Purpose | Status |
|-------|---------|--------|
| [playlists.js](file:///public/js/stores/playlists.js) | Playlist state, batch management | ✅ |
| [albumSeries.js](file:///public/js/stores/albumSeries.js) | Series CRUD, Firestore sync | ✅ |
| [albums.js](file:///public/js/stores/albums.js) | Album data keyed by series | ✅ |
| [inventory.js](file:///public/js/stores/inventory.js) | Personal collection | ❌ |
| [UserStore.js](file:///public/js/stores/UserStore.js) | Auth state | ❌ |

#### Store Pattern
- Observer pattern: `subscribe(callback)`, `notify()`
- Each store manages its own Firestore sync
- Albums keyed by `albumSeriesId` to prevent ghost albums

---

### Services (6 files)

| Service | Purpose | Status |
|---------|---------|--------|
| [MusicKitService.js](file:///public/js/services/MusicKitService.js) | Apple Music API integration | ⚠️ Partial |
| [SpotifyService.js](file:///public/js/services/SpotifyService.js) | Spotify API (search, tracks, export) | ✅ |
| [SpotifyAuthService.js](file:///public/js/services/SpotifyAuthService.js) | OAuth PKCE flow | ✅ |
| [AlbumLoader.js](file:///public/js/services/AlbumLoader.js) | Load local album data | ❌ |
| [OptimizedAlbumLoader.js](file:///public/js/services/OptimizedAlbumLoader.js) | Worker-based search | ❌ |
| [DataSyncService.js](file:///public/js/services/DataSyncService.js) | Firestore sync utilities | ❌ |

---

### Algorithms (7 files)

| Algorithm | Purpose | Status |
|-----------|---------|--------|
| [index.js](file:///public/js/algorithms/index.js) | Registry pattern | ⚠️ |
| [BaseAlgorithm.js](file:///public/js/algorithms/BaseAlgorithm.js) | Base class | ⚠️ |
| [MJRPBalancedCascadeAlgorithm.js](file:///public/js/algorithms/MJRPBalancedCascadeAlgorithm.js) | Main algorithm | ⚠️ |
| [MJRPBalancedCascadeV0Algorithm.js](file:///public/js/algorithms/MJRPBalancedCascadeV0Algorithm.js) | Legacy | ❌ |
| [SDraftBalancedAlgorithm.js](file:///public/js/algorithms/SDraftBalancedAlgorithm.js) | S-Draft variant | ❌ |
| [SDraftOriginalAlgorithm.js](file:///public/js/algorithms/SDraftOriginalAlgorithm.js) | S-Draft original | ❌ |
| [LegacyRoundRobinAlgorithm.js](file:///public/js/algorithms/LegacyRoundRobinAlgorithm.js) | Round-robin | ⚠️ |

#### Algorithm Strategy Pattern
```javascript
// Usage
import { getAlgorithmById } from './algorithms/index.js'
const algo = getAlgorithmById('mjrp-balanced-cascade')
const playlists = algo.generate(albums, options)
```

---

### Models (4 files)

| Model | Purpose | Status |
|-------|---------|--------|
| [Album.js](file:///public/js/models/Album.js) | Album entity with tracks | ❌ |
| [Track.js](file:///public/js/models/Track.js) | Track entity with ranking data | ❌ |
| [Playlist.js](file:///public/js/models/Playlist.js) | Playlist entity | ❌ |
| [Series.js](file:///public/js/models/Series.js) | Album series entity | ❌ |

---

### Repositories (5 files)

| Repository | Purpose | Status |
|------------|---------|--------|
| [BaseRepository.js](file:///public/js/repositories/BaseRepository.js) | CRUD base class | ❌ |
| [InventoryRepository.js](file:///public/js/repositories/InventoryRepository.js) | Inventory CRUD | ❌ |
| [SeriesRepository.js](file:///public/js/repositories/SeriesRepository.js) | Series CRUD | ❌ |
| [PlaylistRepository.js](file:///public/js/repositories/PlaylistRepository.js) | Playlist CRUD | ❌ |
| [AlbumRepository.js](file:///public/js/repositories/AlbumRepository.js) | Album CRUD | ❌ |

---

### Components - Ranking (3 files)

| Component | Purpose | Status |
|-----------|---------|--------|
| [TracksRankingComparison.js](file:///public/js/components/ranking/TracksRankingComparison.js) | Multi-source comparison container | ✅ |
| [TracksTable.js](file:///public/js/components/ranking/TracksTable.js) | Desktop sortable table | ✅ |
| [TracksTabs.js](file:///public/js/components/ranking/TracksTabs.js) | Mobile tabbed view | ✅ |

---

## Backend Components

### Routes (4 files)

| Route | Endpoints | Status |
|-------|-----------|--------|
| albums.js | `POST /generate`, `POST /enrich-album` | ⚠️ |
| playlists.js | `/playlists/*` | ❌ |
| musickit.js | `GET /token` | ⚠️ |
| debug.js | `/list-models`, `/raw-ranking` | ❌ |

---

### Libraries (10 files)

| Library | Purpose | Status |
|---------|---------|--------|
| fetchRanking.js | BestEverAlbums scraping orchestrator | ⚠️ |
| ranking.js | Consolidate and normalize rankings | ❌ |
| normalize.js | Data normalization utilities | ❌ |
| scrapers/besteveralbums.js | BEA HTML scraper | ⚠️ |
| aiClient.js | Google Gemini API client | ❌ |
| prompts.js | AI prompt templates | ❌ |
| schema.js | AJV validation schemas | ❌ |
| logger.js | Logging utilities | ❌ |
| validateSource.js | Source validation | ❌ |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully documented |
| ⚠️ | Partially documented |
| ❌ | Not documented (pending) |
