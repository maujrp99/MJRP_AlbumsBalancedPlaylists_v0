# Album Data Flow Architecture

## Overview
This document maps the **Data Flow Diagram (DFD)** and **Sequence Diagrams** for album data through the application's views and store.

---

## System Components

```mermaid
graph LR
    User[User Actions]
    HomeView[HomeView]
    AlbumsView[AlbumsView]
    PlaylistsView[PlaylistsView]
    RankingView[RankingView]
    
    SeriesStore[(SeriesStore)]
    AlbumsStore[(AlbumsStore)]
    PlaylistsStore[(PlaylistsStore)]
    
    API[API Client]
    Firestore[(Firestore DB)]
    
    User --> HomeView
    User --> AlbumsView
    User --> PlaylistsView
    User --> RankingView
    
    HomeView --> SeriesStore
    AlbumsView --> SeriesStore
    AlbumsView --> AlbumsStore
    AlbumsView --> API
    
    PlaylistsView --> AlbumsStore
    PlaylistsView --> PlaylistsStore
    RankingView --> AlbumsStore
    
    API --> AlbumsStore
    SeriesStore --> Firestore
```

---

## Scenario 1: Load Series (Normal Flow)

```mermaid
sequenceDiagram
    participant User
    participant HomeView
    participant SeriesStore
    participant AlbumsView
    participant API
    participant AlbumsStore
    
    User->>HomeView: Create/Resume Series
    HomeView->>SeriesStore: setActiveSeries(id)
    HomeView->>AlbumsView: navigate('/albums?seriesId=X')
    
    AlbumsView->>SeriesStore: getActiveSeries()
    SeriesStore-->>AlbumsView: {id, name, albumQueries}
    
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

## Scenario 2: Navigate to Playlists (Proposed Fix)

```mermaid
sequenceDiagram
    participant User
    participant AlbumsView
    participant Router
    participant PlaylistsView
    participant AlbumsStore
    participant PlaylistsStore
    
    User->>AlbumsView: Click "Generate Playlists"
    AlbumsView->>Router: navigate('/playlists')
    Router->>AlbumsView: destroy()
    
    Note over AlbumsView,AlbumsStore: ✅ NO reset() - Store persists!
    
    Router->>PlaylistsView: mount()
    PlaylistsView->>AlbumsStore: getAlbums()
    AlbumsStore-->>PlaylistsView: [albums] ✅ Data available
    
    PlaylistsView->>PlaylistsView: render generate section
    
    User->>PlaylistsView: Click "Generate"
    PlaylistsView->>PlaylistsStore: generatePlaylists(albums)
    PlaylistsStore-->>PlaylistsView: [playlists]
    PlaylistsView->>PlaylistsView: render playlists
```

**Key Points:**
- ✅ AlbumsView.destroy() does NOT call reset()
- ✅ Store data persists across navigation
- ✅ PlaylistsView directly accesses store data
- ❌ NO recovery logic needed

---

## Scenario 3: Navigate to Album Ranking (Proposed Fix)

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

**Key Points:**
- ✅ AlbumsView.destroy() does NOT call reset()
- ✅ Store data persists across navigation
- ✅ RankingView finds album in store
- ❌ NO recovery logic needed

---

## Scenario 4: Hard Refresh (Edge Case)

```mermaid
sequenceDiagram
    participant Browser
    participant AlbumsView
    participant SeriesStore
    participant Firestore
    participant API
    participant AlbumsStore
    
    Browser->>AlbumsView: F5 on '/albums?seriesId=X'
    Note over AlbumsStore: ⚠️ Store is EMPTY (in-memory)
    
    AlbumsView->>AlbumsView: mount(params)
    AlbumsView->>SeriesStore: getActiveSeries()
    SeriesStore-->>AlbumsView: null ⚠️ (also empty)
    
    AlbumsView->>AlbumsView: Check for seriesId in URL
    AlbumsView->>Firestore: loadFromFirestore()
    Firestore-->>SeriesStore: [series data]
    
    AlbumsView->>SeriesStore: setActiveSeries(urlSeriesId)
    SeriesStore-->>AlbumsView: {id, name, albumQueries}
    
    AlbumsView->>AlbumsView: loadAlbumsFromQueries()
    AlbumsView->>AlbumsStore: reset() ⚠️ (already empty)
    
    loop For each query
        AlbumsView->>API: fetchAlbum(query)
        API-->>AlbumsView: albumData
        AlbumsView->>AlbumsStore: addAlbum(albumData)
    end
    
    AlbumsView->>AlbumsView: render albums
```

**Key Points:**
- ⚠️ Hard refresh = new browser session = empty store
- ✅ AlbumsView has fallback: load from Firestore
- ✅ This is ONLY for hard refresh, not navigation
- ❌ PlaylistsView/RankingView do NOT need this (user navigates from Albums)

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
3. **View Lifecycle**: constructor/destroy do NOT reset

### Current vs Proposed

| Event | Current Behavior | Proposed Behavior |
|-------|------------------|-------------------|
| AlbumsView.constructor() | ❌ reset() | ✅ No reset() |
| AlbumsView.destroy() | ❌ reset() | ✅ No reset() |
| loadAlbumsFromQueries() | ✅ reset() | ✅ reset() (keep!) |
| Navigate to Playlists | ❌ Empty store → recovery | ✅ Store has data |
| Navigate to Ranking | ❌ Empty store → recovery | ✅ Store has data |
| Hard Refresh | ✅ Fallback to Firestore | ✅ Same (keep!) |

---

## Architecture Benefits

### Before (Band-Aid Approach)
```
AlbumsView loads data
  → destroy() resets store
    → PlaylistsView needs recovery
    → RankingView needs recovery
      → Code duplication
      → Race conditions
      → Ghost albums
```

### After (Proposed)
```
AlbumsView loads data ONCE
  → Store persists while series active
    → PlaylistsView reads store
    → RankingView reads store
      → ✅ No duplication
      → ✅ No race conditions
      → ✅ No ghost albums
```
