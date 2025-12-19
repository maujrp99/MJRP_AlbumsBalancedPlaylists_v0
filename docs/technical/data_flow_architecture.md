# Album Data Flow Architecture

**Updated**: 2025-12-16

## Overview
This document maps the **Data Flow Diagram (DFD)** and **Sequence Diagrams** for album data through the application's views and store.

> **Note (v2.7.1)**: `AlbumSeriesListView` has been deprecated. Series management (Edit/Delete) is now consolidated into `AlbumsView`.

> **Note (v2.8.0)**: Playlist generation now uses the **Algorithm Strategy Pattern**. See [ALGORITHM_MENU.md](specs/ALGORITHM_MENU.md).

---

## System Components

```mermaid
graph LR
    User[User Actions]
    HomeView[HomeView]
    AlbumsView[AlbumsView - Series CRUD]
    PlaylistsView[PlaylistsView]
    RankingView[RankingView]
    SaveAllView[SaveAllView - Data Migration]
    
    AlbumSeriesStore[(AlbumSeriesStore)]
    AlbumsStore[(AlbumsStore)]
    PlaylistsStore[(PlaylistsStore)]
    AlgorithmRegistry[Algorithm Registry]
    
    API[API Client]
    Firestore[(Firestore DB)]
    
    User --> HomeView
    User --> AlbumsView
    User --> PlaylistsView
    User --> RankingView
    User --> SaveAllView
    
    HomeView --> AlbumSeriesStore
    AlbumsView --> AlbumSeriesStore
    AlbumsView --> AlbumsStore
    AlbumsView --> API
    
    PlaylistsView --> AlbumsStore
    PlaylistsView --> PlaylistsStore
    PlaylistsView --> AlgorithmRegistry
    RankingView --> AlbumsStore
    SaveAllView --> Firestore
    
    API --> AlbumsStore
    AlbumSeriesStore --> Firestore
```

---

## Scenario 1: Load Series (Normal Flow)

```mermaid
sequenceDiagram
    participant User
    participant HomeView
    participant AlbumSeriesStore
    participant AlbumsView
    participant API
    participant AlbumsStore
    
    User->>HomeView: Create/Resume Series
    HomeView->>AlbumSeriesStore: setActiveSeries(id)
    HomeView->>AlbumsView: navigate('/albums?seriesId=X')
    
    AlbumsView->>AlbumSeriesStore: getActiveSeries()
    AlbumSeriesStore-->>AlbumsView: {id, name, albumQueries}
    
    AlbumsView->>AlbumsView: loadAlbumsFromQueries()
    AlbumsView->>AlbumsStore: reset() ⚠️ CLEARS OLD DATA
    
    loop For each query
        AlbumsView->>API: fetchAlbum(query)
        API-->>AlbumsView: albumData
        AlbumsView->>AlbumsStore: addAlbum(albumData)
    end
    
    AlbumsStore-->>AlbumsView: notify subscribers
    AlbumsView->>AlbumsView: render albums
```

**Key Points:**
- ⚠️ `reset()` called ONLY in `loadAlbumsFromQueries()` before loading new series
- Data persists in store after loading
- All subsequent navigations use cached data

---

## Scenario 2: Navigate to Playlists & Generate

```mermaid
sequenceDiagram
    participant User
    participant AlbumsView
    participant Router
    participant PlaylistsView
    participant AlbumsStore
    participant AlgorithmRegistry
    participant PlaylistsStore
    
    User->>AlbumsView: Click "Generate Playlists"
    AlbumsView->>Router: navigate('/playlists')
    Router->>AlbumsView: destroy()
    
    Note over AlbumsView,AlbumsStore: ✅ NO reset() - Store persists!
    
    Router->>PlaylistsView: mount()
    PlaylistsView->>AlbumsStore: getAlbums()
    AlbumsStore-->>PlaylistsView: [albums] ✅ Data available
    
    PlaylistsView->>PlaylistsView: render algorithm selector
    
    User->>PlaylistsView: Select algorithm & Click "Generate"
    PlaylistsView->>AlgorithmRegistry: createAlgorithm(selectedId)
    AlgorithmRegistry-->>PlaylistsView: algorithm instance
    PlaylistsView->>PlaylistsView: algorithm.generate(albums)
    PlaylistsView->>PlaylistsStore: setPlaylists(playlists)
    PlaylistsStore-->>PlaylistsView: [playlists]
    PlaylistsView->>PlaylistsView: render playlists
```

---

## Scenario 3: Navigate to Album Ranking

```mermaid
sequenceDiagram
    participant User
    participant AlbumsView
    participant Router
    participant RankingView
    participant AlbumsStore
    
    User->>AlbumsView: Click album card
    AlbumsView->>Router: navigate('/ranking/album-id')
    Router->>AlbumsView: destroy()
    
    Note over AlbumsView,AlbumsStore: ✅ NO reset() - Store persists!
    
    Router->>RankingView: mount()
    RankingView->>RankingView: render(params)
    RankingView->>AlbumsStore: getAlbums()
    AlbumsStore-->>RankingView: [albums] ✅ Data available
    
    RankingView->>RankingView: findAlbum(albumId)
    Note over RankingView: Album found in store!
    
    RankingView->>RankingView: render ranking view
```

---

## Scenario 4: Hard Refresh (Edge Case)

```mermaid
sequenceDiagram
    participant Browser
    participant AlbumsView
    participant AlbumSeriesStore
    participant Firestore
    participant API
    participant AlbumsStore
    
    Browser->>AlbumsView: F5 on '/albums?seriesId=X'
    Note over AlbumsStore: ⚠️ Store is EMPTY (in-memory)
    
    AlbumsView->>AlbumsView: mount(params)
    AlbumsView->>AlbumSeriesStore: getActiveSeries()
    AlbumSeriesStore-->>AlbumsView: null ⚠️ (also empty)
    
    AlbumsView->>AlbumsView: Check for seriesId in URL
    AlbumsView->>Firestore: loadFromFirestore()
    Firestore-->>AlbumSeriesStore: [series data]
    
    AlbumsView->>AlbumSeriesStore: setActiveSeries(urlSeriesId)
    AlbumSeriesStore-->>AlbumsView: {id, name, albumQueries}
    
    AlbumsView->>AlbumsView: loadAlbumsFromQueries()
    AlbumsView->>AlbumsStore: reset() ⚠️ (already empty)
    
    loop For each query
        AlbumsView->>API: fetchAlbum(query)
        API-->>AlbumsView: albumData
        AlbumsView->>AlbumsStore: addAlbum(albumData)
    end
    
    AlbumsView->>AlbumsView: render albums
```

---

## Store State Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Empty: App Start
    Empty --> Loading: loadAlbumsFromQueries()
    Loading --> Loaded: API calls complete
    
    Loaded --> Loading: Load Different Series
    Loaded --> Loaded: Navigate between Views ✅
    Loaded --> Empty: Hard Refresh (F5)
    
    note right of Loading
        reset() called here
        before fetching new data
    end note
    
    note right of Loaded
        Data persists during:
        - AlbumsView → PlaylistsView
        - AlbumsView → RankingView
        - PlaylistsView ↔ RankingView
    end note
```

---

## Data Flow Summary

### ✅ Store Resets (Clear Data)
1. **Loading New Series**: `loadAlbumsFromQueries()` calls `reset()` before fetching
2. **Hard Refresh**: Browser clears memory, store starts empty

### ✅ Store Persists (Keep Data)
1. **View Navigation**: AlbumsView → PlaylistsView → RankingView
2. **Back/Forward**: Browser history navigation
3. **View Lifecycle**: destroy() does NOT reset

### Current Implementation

| Event | Behavior |
|-------|----------|
| AlbumsView.constructor() | ✅ No reset() |
| AlbumsView.destroy() | ✅ No reset() |
| loadAlbumsFromQueries() | ✅ reset() before fetch |
| Navigate to Playlists | ✅ Store has data |
| Navigate to Ranking | ✅ Store has data |
| Hard Refresh | ✅ Fallback to Firestore |

---

## Architecture Benefits

```
AlbumsView loads data ONCE
  → Store persists while series active
    → PlaylistsView reads store
    → RankingView reads store
      → ✅ No duplication
      → ✅ No race conditions
      → ✅ No ghost albums
```

---

## Playlist Data Model

### Firestore Schema

```
Firestore Path:
users/{userId}/albumSeries/{seriesId}/playlists/{playlistId}
```

### Playlist Document Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Firestore document ID (auto-generated) |
| `batchName` | string | Grupo de playlists (ex: "Greatest Hits") |
| `name` | string | Nome individual da playlist (ex: "DC1", "DC2") |
| `tracks` | array | Lista de tracks com title, artist, duration, rating |
| `order` | number | Ordem da playlist no batch (0, 1, 2...) |
| `createdAt` | timestamp | Data de criação |
| `savedAt` | timestamp | Data da última atualização |

### Conceito: Batch vs Playlist

```
Batch "Greatest Hits" (batchName)
├── Playlist id="abc", name="DC1", order=0
├── Playlist id="def", name="DC2", order=1
└── Playlist id="ghi", name="DC3", order=2
```

Um **batch** é um grupo de playlists com o mesmo `batchName`. 
Cada **playlist** tem seu próprio `id` no Firestore.

### Problema: Regenerate Muda IDs

Quando o usuário regenera playlists, o algoritmo cria **novos objetos** com **novos IDs**:

```
Antes:                        Após Regenerate:
id="abc" batchName="V1"  →   id="xyz" batchName="V1" (ID NOVO!)
```

### Solução: Save por batchName (Delete + Save)

Na EditPlaylistView, o Save deve:
1. **Deletar** todos documentos onde `batchName === currentBatchName`
2. **Salvar** as novas playlists com o mesmo `batchName`

```javascript
// Pseudo-código
async function saveEditedBatch(batchName, newPlaylists) {
  // 1. Deletar batch antigo
  const oldPlaylists = await repo.findByBatchName(batchName)
  for (const p of oldPlaylists) {
    await repo.delete(p.id)
  }
  
  // 2. Salvar novas playlists
  for (const p of newPlaylists) {
    p.batchName = batchName // garantir mesmo batchName
    await repo.save(p)
  }
}
```

### Diferença: CREATE vs EDIT Mode

| Aspecto | CREATE Mode | EDIT Mode |
|---------|-------------|-----------|
| **Entrada** | `/playlists` | `/playlists?edit=batchName` |
| **Carregar** | Store vazio | Firestore (fresh) |
| **Regenerate** | IDs novos | IDs novos, mas batchName mantido |
| **Save** | Cria batch NOVO | Deleta antigo + Salva novo |

### Suporte a Renomear Batch

Para permitir que o usuário renomeie o batch (ex: "Greatest Hits" → "Best of 2024"):

```javascript
// EditPlaylistView
class EditPlaylistView {
  mount(params) {
    this.originalBatchName = params.edit  // Guardar nome original da URL
    this.currentBatchName = params.edit   // Nome atual (pode mudar)
  }
  
  async save() {
    // 1. Deletar pelo nome ORIGINAL (não o atual)
    await deleteByBatchName(this.originalBatchName)
    
    // 2. Salvar com o novo nome
    for (const p of playlists) {
      p.batchName = this.currentBatchName  // Novo nome se mudou
      await repo.save(p)
    }
  }
}
```

Isso permite:
- ✅ Editar sem mudar nome
- ✅ Editar E renomear batch
- ✅ Regenerar e salvar

---

## Sprint 11: Spotify Integration Flow

**Added**: 2025-12-19

### Spotify OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant SpotifyAuthService
    participant Spotify

    User->>App: Click "Connect Spotify"
    App->>SpotifyAuthService: initiateAuth()
    SpotifyAuthService->>SpotifyAuthService: Generate PKCE codes
    SpotifyAuthService->>Spotify: Redirect to /authorize
    Spotify->>User: Login prompt
    User->>Spotify: Authenticate
    Spotify->>App: Redirect with ?code=XXX
    App->>SpotifyAuthService: handleCallback(code)
    SpotifyAuthService->>Spotify: Exchange code for tokens
    Spotify-->>SpotifyAuthService: access_token, refresh_token
    SpotifyAuthService->>localStorage: Store tokens
```

### Spotify Auto-Enrichment Flow (New in Sprint 11)

```mermaid
sequenceDiagram
    participant AlbumsView
    participant APIClient
    participant MusicKitService
    participant BestEverAPI
    participant SpotifyService
    participant AlbumsStore
    participant Cache

    AlbumsView->>APIClient: fetchAlbum("Artist - Album")
    APIClient->>Cache: Check localStorage
    
    alt Cache Miss
        APIClient->>MusicKitService: searchAlbums()
        MusicKitService-->>APIClient: Apple Music album data
        
        APIClient->>BestEverAPI: POST /enrich-album
        BestEverAPI-->>APIClient: track ratings
        
        APIClient->>APIClient: Create Album instance
        
        alt Spotify Connected
            APIClient->>SpotifyService: enrichAlbumData(artist, title)
            SpotifyService->>SpotifyService: searchAlbum() + getTracksWithPopularity()
            SpotifyService-->>APIClient: {spotifyId, trackPopularityMap}
            APIClient->>APIClient: Apply popularity to tracks (fuzzy match)
        end
        
        APIClient->>Cache: store in localStorage
    end
    
    APIClient-->>AlbumsView: Album with tracks
    AlbumsView->>AlbumsStore: addAlbum(album)
```

### Spotify Export Flow

```mermaid
sequenceDiagram
    participant User
    participant PlaylistsView
    participant SpotifyExportModal
    participant SpotifyService
    participant Spotify

    User->>PlaylistsView: Click "Export to Spotify"
    PlaylistsView->>SpotifyExportModal: show(playlists)
    SpotifyExportModal->>SpotifyExportModal: State: IDLE
    
    User->>SpotifyExportModal: Enter name + Click Export
    SpotifyExportModal->>SpotifyExportModal: State: MATCHING
    
    loop For each track
        SpotifyExportModal->>SpotifyService: searchTrack(name, artist)
        SpotifyService-->>SpotifyExportModal: {uri} or null
    end
    
    SpotifyExportModal->>SpotifyExportModal: State: CREATING
    SpotifyExportModal->>SpotifyService: createPlaylist(name)
    SpotifyService-->>SpotifyExportModal: {playlistId, url}
    
    SpotifyExportModal->>SpotifyExportModal: State: ADDING
    SpotifyExportModal->>SpotifyService: addTracksToPlaylist(id, uris)
    
    SpotifyExportModal->>SpotifyExportModal: State: SUCCESS
    SpotifyExportModal-->>User: Show success + Spotify link
```

---

## View Mode Toggle Flow (BUG INVESTIGATION)

**Issue**: Tracks from wrong album showing after toggle

```mermaid
sequenceDiagram
    participant User
    participant AlbumsView
    participant AlbumsStore
    participant GridRenderer
    participant TracksRankingComparison

    User->>AlbumsView: Click "View Expanded" toggle
    AlbumsView->>AlbumsView: viewModeKey = 'expanded'
    AlbumsView->>AlbumsView: viewStrategy = new ExpandedStrategy()
    
    Note over AlbumsView: CRITICAL: Full re-render!
    AlbumsView->>AlbumsView: this.render({})
    AlbumsView->>AlbumsView: this.container.innerHTML = html
    
    Note over AlbumsView: Re-bind events...
    AlbumsView->>AlbumsView: setupEventListeners()
    
    AlbumsView->>AlbumsView: updateAlbumsGrid(currentAlbums)
    AlbumsView->>AlbumsStore: getAlbums()
    AlbumsStore-->>AlbumsView: [albums]
    
    AlbumsView->>GridRenderer: render(albums)
    GridRenderer-->>AlbumsView: HTML with .ranking-comparison-container
    
    AlbumsView->>AlbumsView: container.innerHTML = html
    
    loop For each .ranking-comparison-container
        AlbumsView->>AlbumsView: el.dataset.albumId
        AlbumsView->>AlbumsView: albums.find(a => a.id === albumId)
        
        Note over AlbumsView: ⚠️ BUG: Is album reference correct?
        
        AlbumsView->>TracksRankingComparison: new({album}).mount(el)
        TracksRankingComparison->>TracksRankingComparison: album.getTracks('original')
        
        Note over TracksRankingComparison: ⚠️ BUG: Tracks might be from wrong album!
    end
```

### Potential Bug Causes

| Cause | Likelihood | Evidence |
|-------|------------|----------|
| Album ID mismatch | Medium | Tracks from different album shown |
| Shared reference mutation | High | Same tracks array shared between albums |
| Cache returning wrong album | High | Problem reappears after cache clear |
| Store state pollution | Medium | Multiple series data mixing |

---

## Cache Strategy (3-Level)

```mermaid
graph TD
    Request[fetchAlbum Request]
    
    L1[L1: Memory Cache<br/>Map in APIClient]
    L2[L2: localStorage<br/>album_cache_XXX]
    L3[L3: External APIs<br/>Apple Music + BestEver + Spotify]
    
    Request --> L1
    L1 -->|HIT| Return[Return Album]
    L1 -->|MISS| L2
    L2 -->|HIT| PromoteL1[Promote to L1]
    PromoteL1 --> Return
    L2 -->|MISS| L3
    L3 --> SaveL2[Save to L2]
    SaveL2 --> SaveL1[Save to L1]
    SaveL1 --> Return
    
    style L1 fill:#4ade80,stroke:#166534
    style L2 fill:#60a5fa,stroke:#1d4ed8
    style L3 fill:#f97316,stroke:#c2410c
```

### Cache Key Generation

```javascript
// albumCache.js
getStorageKey(query) {
    return `album_cache_${this.normalizeQuery(query)}`
}

normalizeQuery(query) {
    return query.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')
}
```

**⚠️ Potential Issue**: Similar queries might generate same key!
- "The Beatles - Rubber Soul" → `the_beatles_-_rubber_soul`
- "Beatles - Rubber Soul" → `beatles_-_rubber_soul` (different)

---

## TracksRankingComparison Component Data Flow

```mermaid
graph TD
    Album[Album Instance]
    TRC[TracksRankingComparison]
    Normalize[normalizeTracks]
    State[Component State]
    Table[TracksTable]
    
    Album -->|passed as prop| TRC
    TRC -->|constructor| Normalize
    Normalize -->|album.getTracks 'original'| TracksOriginal[tracksOriginalOrder]
    TracksOriginal -->|map with defaults| State
    
    State -->|getSortedTracks| SortedTracks[Sorted Tracks]
    SortedTracks --> Table
    Table -->|render| DOM[DOM]
    
    subgraph "Data Source Problem"
        TracksOriginal
        Note["⚠️ If album.tracksOriginalOrder<br/>points to wrong data,<br/>wrong tracks are shown"]
    end
```

### Debug Checklist

- [ ] Album.id matches container data-album-id?
- [ ] album.tracksOriginalOrder has correct tracks?
- [ ] Track.album field matches Album.title?
- [ ] Cache is storing correct album → tracks mapping?

---

## Known Issues (Sprint 11)

| ID | Issue | Root Cause | Status |
|----|-------|------------|--------|
| BUG-1 | Wrong tracks in ranking table | TBD - investigating | 🔍 INVESTIGATING |
| BUG-2 | Table disappears on view toggle | Missing updateAlbumsGrid call | ✅ FIXED |
| BUG-3 | Spotify not enriching (0 tracks matched) | Title mismatch | ✅ FIXED |
| BUG-4 | Led Zeppelin not found on Spotify | Fuzzy search needed | ✅ FIXED |


