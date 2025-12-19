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
| AlbumsView.js | Series CRUD, Album grid | 52KB | ✅ |
| HomeView.js | Dashboard, Series list | 31KB | ✅ |
| PlaylistsView.js | Generate playlists | 31KB | ✅ |
| SavedPlaylistsView.js | View saved batches | 31KB | ✅ |
| InventoryView.js | Personal collection | 30KB | ✅ |
| EditPlaylistView.js | Edit existing batch | 22KB | ✅ |
| ConsolidatedRankingView.js | Cross-album ranking | 11KB | ✅ |
| RankingView.js | Single album ranking | 8KB | ✅ |
| SaveAllView.js | Data migration | 6KB | ✅ |
| BaseView.js | View base class | 3KB | ✅ |

#### View Architecture
- All views extend `BaseView` providing lifecycle: `mount()`, `render()`, `destroy()`
- Strategy Pattern used in AlbumsView for Compact/Expanded modes
- Event delegation preferred over direct binding

---

#### EditPlaylistView (22KB, 628 lines, 26 methods)
**Purpose**: Edit existing playlist batches loaded from Firestore

**Key Methods**:
| Method | Description |
|--------|-------------|
| `loadPlaylistsFromFirestore()` | Load batch by batchName + seriesId |
| `handleSave()` | Delete old batch + save new (by originalBatchName) |
| `handleGenerate()` | Regenerate playlists with selected algorithm |
| `setupDragAndDrop()` | Enable track reordering via SortableJS |
| `attachExportListeners()` | Apple Music + Spotify export buttons |

**Fixes Issues**: #54 (Edit Batch Not Overwriting), #55 (Ghost Playlists)

---

#### InventoryView (30KB, 819 lines, 26 methods)
**Purpose**: Manage physical album collection (CD, Vinyl, DVD, Blu-ray, Digital)

**Key Methods**:
| Method | Description |
|--------|-------------|
| `mount()` | Load from inventoryStore, subscribe to updates |
| `handleStatusChange(albumId, status)` | Update ownership status |
| `showEditAlbumModal(albumId)` | Open edit modal |
| `hydrateCovers()` | Lazy-load HD cover art |
| `filterAlbums(albums)` | Filter by format, search term |
| `getStatistics()` | Collection stats (count, value by format) |

**View Modes**: Grid (default), List
**Filters**: Format (CD, Vinyl, etc.), Search text

---

#### SavedPlaylistsView (31KB, 667 lines, 24 methods)
**Purpose**: View all saved playlist batches grouped by series

**Key Methods**:
| Method | Description |
|--------|-------------|
| `mount()` | Load all series + their playlists from Firestore |
| `renderSeriesGroup(group)` | Render series with its batches |
| `handleEditBatchPlaylists()` | Navigate to EditPlaylistView |
| `handleDeleteBatch(seriesId, batchName)` | Delete all playlists in batch |
| `openPlaylistModal(seriesId, playlistId)` | View single playlist details |

**Data Structure**: Groups playlists by `batchName` within each series

---

#### ConsolidatedRankingView (11KB, 274 lines, 13 methods)
**Purpose**: Cross-album ranking - compare tracks across all albums in series

**Key Methods**:
| Method | Description |
|--------|-------------|
| `getFilteredTracks()` | Get all tracks with optional album filter |
| `render()` | Render sortable table with all tracks |
| `attachEventListeners()` | Handle sort and filter changes |

**Sort Fields**: rank, rating, score, duration
**State**: `activeAlbumSeriesId`, `filterAlbumId`, `sortField`, `sortDirection`

---

### Stores (5 files)

| Store | Purpose | Status |
|-------|---------|--------|
| playlists.js | Playlist state, batch management | ✅ |
| albumSeries.js | Series CRUD, Firestore sync | ✅ |
| albums.js | Album data keyed by series | ✅ |
| inventory.js | Personal collection | ✅ |
| UserStore.js | Auth state | ✅ |

#### Store Pattern
```javascript
// Observer pattern
store.subscribe(callback) // Returns unsubscribe function
store.notify() // Calls all listeners with current state
store.getState() // Returns state snapshot
```

---

#### InventoryStore (333 lines, 17 methods)
**Purpose**: Manage personal album collection

**API**:
| Method | Description |
|--------|-------------|
| `loadAlbums()` | Load from Firestore via InventoryRepository |
| `addAlbum(album, format, options)` | Add album with format (CD, Vinyl, etc.) |
| `updateAlbum(albumId, updates)` | Update album properties |
| `updatePrice(albumId, price, currency)` | Optimistic price update |
| `removeAlbum(albumId)` | Remove from inventory |
| `isInInventory(albumId)` | Check if album exists |
| `getStatistics()` | Stats: count, total value by format |

**State**: `{ albums, loading, error }`

---

#### UserStore (106 lines, 11 methods)
**Purpose**: Authentication state management

**API**:
| Method | Description |
|--------|-------------|
| `loginWithGoogle()` | Firebase Google auth |
| `loginWithApple()` | Firebase Apple auth |
| `logout()` | Sign out |
| `handleAuthChange(user)` | Called by AuthService on state change |

**State**: `{ currentUser, isAuthenticated, loading, error }`

---

### Services (6 files)

| Service | Purpose | Status |
|---------|---------|--------|
| MusicKitService.js | Apple Music API integration | ⚠️ |
| SpotifyService.js | Spotify API (search, tracks, export) | ✅ |
| SpotifyAuthService.js | OAuth PKCE flow | ✅ |
| AlbumLoader.js | Load local album data | ⚠️ |
| OptimizedAlbumLoader.js | Worker-based fuzzy search | ⚠️ |
| DataSyncService.js | Firestore sync utilities | ⚠️ |

---

### Models (4 files)

| Model | Purpose | Status |
|-------|---------|--------|
| Album.js | Album entity with tracks | ✅ |
| Track.js | Track entity with ranking data | ✅ |
| Playlist.js | Playlist entity | ⚠️ |
| Series.js | Album series entity | ⚠️ |

---

#### Album Model (57 lines)
**Purpose**: Album domain model with track orderings

```javascript
class Album {
  constructor(data) {
    this.id = data.id
    this.title = data.title
    this.artist = data.artist
    this.year = data.year
    this.coverUrl = data.coverUrl
    
    // Two track orderings
    this.tracks = [] // Ranked by acclaim
    this.tracksOriginalOrder = [] // Original disc order
    
    // Spotify data
    this.spotifyId = data.spotifyId
    this.spotifyUrl = data.spotifyUrl
    this.spotifyPopularity = data.spotifyPopularity
  }
  
  getTracks(order = 'original') {
    return order === 'acclaim' ? this.tracks : this.tracksOriginalOrder
  }
}
```

---

#### Track Model (38 lines)
**Purpose**: Track domain model with context preservation

```javascript
class Track {
  constructor(data, albumContext = {}) {
    this.id = data.id || crypto.randomUUID()
    this.title = data.title
    this.artist = data.artist || albumContext.artist // Fallback
    this.album = data.album || albumContext.title   // Fallback
    this.duration = Number(data.duration) || 0
    
    // Ranking data
    this.rating = data.rating    // BEA rating (0-100)
    this.rank = data.rank        // Position in acclaim list (1..N)
    this.position = data.position // Original track number (1..N)
    
    // Spotify data
    this.spotifyPopularity = data.spotifyPopularity
    this.spotifyRank = data.spotifyRank
    this.spotifyUri = data.spotifyUri
  }
}
```

---

### Algorithms (7 files)

| Algorithm | Purpose | Status |
|-----------|---------|--------|
| index.js | Registry pattern | ✅ |
| BaseAlgorithm.js | Base class with common methods | ⚠️ |
| MJRPBalancedCascadeAlgorithm.js | Main balanced algorithm | ⚠️ |
| MJRPBalancedCascadeV0Algorithm.js | Legacy version | ⚠️ |
| SDraftBalancedAlgorithm.js | S-Draft balanced variant | ⚠️ |
| SDraftOriginalAlgorithm.js | S-Draft original | ⚠️ |
| LegacyRoundRobinAlgorithm.js | Simple round-robin | ⚠️ |

#### Algorithm Registry Usage
```javascript
import { getAlgorithmById, listAlgorithms } from './algorithms/index.js'

// List available algorithms
const algorithms = listAlgorithms()
// [{ id, name, description }, ...]

// Get and use
const algo = getAlgorithmById('mjrp-balanced-cascade')
const playlists = algo.generate(albums, { playlistDuration: 60 })
```

---

### Repositories (5 files)

| Repository | Purpose | Status |
|------------|---------|--------|
| BaseRepository.js | CRUD base class | ⚠️ |
| InventoryRepository.js | Inventory Firestore CRUD | ⚠️ |
| SeriesRepository.js | Series Firestore CRUD | ⚠️ |
| PlaylistRepository.js | Playlist Firestore CRUD | ⚠️ |
| AlbumRepository.js | Album Firestore CRUD | ⚠️ |

#### Repository Pattern
```javascript
// All repositories extend BaseRepository
repository.save(entity)    // Create or update
repository.getById(id)     // Read single
repository.getAll()        // Read all
repository.delete(id)      // Delete
```

---

### Components - Ranking (3 files)

| Component | Purpose | Status |
|-----------|---------|--------|
| TracksRankingComparison.js | Multi-source comparison | ✅ |
| TracksTable.js | Desktop sortable table | ✅ |
| TracksTabs.js | Mobile tabbed view | ✅ |

---

## Backend Components

### Routes (4 files)

| Route | Endpoints | Status |
|-------|-----------|--------|
| albums.js | `POST /generate`, `POST /enrich-album` | ⚠️ |
| playlists.js | `/playlists/*` | ⚠️ |
| musickit.js | `GET /token` | ⚠️ |
| debug.js | `/list-models`, `/raw-ranking` | ⚠️ |

---

### Libraries (10 files)

| Library | Purpose | Status |
|---------|---------|--------|
| fetchRanking.js | BestEverAlbums scraping orchestrator | ⚠️ |
| ranking.js | Consolidate and normalize rankings | ⚠️ |
| normalize.js | Data normalization utilities | ⚠️ |
| scrapers/besteveralbums.js | BEA HTML scraper | ⚠️ |
| aiClient.js | Google Gemini API client | ⚠️ |
| prompts.js | AI prompt templates | ⚠️ |
| schema.js | AJV validation schemas | ⚠️ |
| logger.js | Logging utilities | ⚠️ |
| validateSource.js | Source validation | ⚠️ |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully documented |
| ⚠️ | Partially documented |
| ❌ | Not documented |
