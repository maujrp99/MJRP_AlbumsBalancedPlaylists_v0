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
