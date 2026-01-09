# Deep Dive: Data Infrastructure & State Management

This document analyzes the Data Layer, linking the transient frontend state (STORES) with the persistent backend (REPOSITORIES) via an optimized caching layer (CACHE).

## 1. Architecture Overview
The application handles data using a **"Three-Tiered Persistence Strategy"**:
1.  **Store (UI State)**: Reactive singletons holding the working state (Playlists, Config).
2.  **Cache (Optimization)**: Dual-layer (Memory + IndexedDB) interception to minimize reads.
3.  **Repository (Source of Truth)**: Abstracted Firestore access.

---

## 2. Repositories (Data Access Object Pattern)

### BaseRepository (`public/js/repositories/BaseRepository.js`)
*   **Role**: Abstract parent class for all data entities.
*   **Integration**: Tightly coupled with `CacheManager`.
    *   **Read**: Checks Cache -> Throws to Firestore -> Writes to Cache.
    *   **Write**: Writes to Firestore -> Invalidates Cache (Optimistic Concurrency).
*   **Tech**: Uses Firebase Modular SDK (`getDoc`, `query`, `orderBy`).

### SeriesRepository (`public/js/repositories/SeriesRepository.js`)
*   **Path**: `artifacts/{appId}/users/{userId}/curator/data/series`
*   **Features**:
    *   Subcollection Loading: Fetches `albums` subcollection manually in `findWithAlbums`.
    *   Cascade Awareness: Designed to support cascade deletes (though logic is often distributed).

---

## 3. Caching (Dual-Layer Strategy)

### CacheManager (`public/js/cache/CacheManager.js`)
*   **Role**: The coordinator preventing excessive read bills.
*   **Layers**:
    *   **L1 (Memory)**: Instant access, cleared on refresh.
    *   **L2 (IndexedDB)**: Persistent access, survives refresh.
*   **Promotion Logic**: `Get L2` -> `Found?` -> `Promote to L1`.
*   **Resilience**: If L2 (IDB) fails or is blocked, it silently falls back to pure L1 mode.

---

## 4. Stores (State Management)

### PlaylistsStore (`public/js/stores/playlists.js`)
*   **Role**: Manages the core Playlist "Workspace".
*   **Key Features**:
    *   **Modes**: Explicit `CREATING` vs `EDITING` modes to handle "Edit Batch" logic.
    *   **Undo/Redo**: Implements a Memento Pattern with `versions` array (Snapshotting state on every mutation like drag/drop).
    *   **Dual-Sync**:
        *   `saveToLocalStorage()`: Auto-saves on every change (Session recovery).
        *   `saveToFirestore()`: Explicit user action (Permanent save).
*   **Batching**: Uses `writeBatch` for atomic saves of multiple playlists.

### Other Stores
*   **UserStore**: Manages Auth state and User Profile.
*   **InventoryStore**: Manages the "Pool" of available albums.

---

## 5. Models (Domain Entities)
*   **`Album.js`**: Enriched entity with `tracks`, `rankingSources`, and `stats`.
*   **`Track.js`**: The atomic unit, carrying the `rankingInfo` provenance chain.
*   **`Series.js`**: Container for albums.
