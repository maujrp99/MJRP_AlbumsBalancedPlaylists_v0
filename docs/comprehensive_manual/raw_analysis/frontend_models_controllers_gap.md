# Deep Dive: State Management & Core Integrations (Gap Fill)

This document fills the remaining gaps in the "Brain" and "Data" layers, specifically covering the primary Controller, Data Models, and the Album Store/Cache internals.

## 1. The Controller Layer

### Series Controller (`public/js/controllers/SeriesController.js`)
*   **Role**: The central coordinator for the "Albums" pages. It replaced the legacy `AlbumsStateController`.
*   **Responsibilities**:
    1.  **Orchestration**: Connects `apiClient` (fetching) with `albumsStore` (storage) and `SeriesView` (rendering).
    2.  **Scope Management**: Handles the difference between viewing **ALL Series** (the hub) vs a **Single Series** (the detail view).
    3.  **Ghost Prevention**:
        *   Implements `loadScope` logic to clear the store of irrelevant albums before loading new ones.
        *   Uses `_sourceSeriesId` context in queries to ensure fetched albums are strictly associated with the correct Series ID.
    4.  **Optimized Loading**:
        *   Checks `albumsStore.hasAlbumsForSeries()` to skip API calls if data is already in memory.
        *   Uses `AbortController` to cancel stale requests if the user navigates away quickly.

## 2. The Data Models (`public/js/models/`)

### Album Model (`Album.js`)
*   **Role**: The canonical representation of an Album.
*   **Key Distinction**: Supports **Dual-Tracklists**.
    *   `tracksOriginalOrder`: The disk order (1..N).
    *   `tracks` (or `tracksByAcclaim`): The sorted order based on ranking.
*   **Integrity**: `ensureRankingIntegrity()` ensures that if external ranking data is missing, the model falls back to using the Original Order as the "Ranking" to prevent crashes in the Algorithm layer.

### Album Identity (`AlbumIdentity.js`)
*   **Role**: Solves the "Fuzzy Match Problem".
*   **Problem**: User saves "Pink Floyd - Dark Side". API returns "Pink Floyd - The Dark Side of the Moon (2011 Remaster)". Are these the same?
*   **Solution**:
    *   Calculates a **Confidence Score** (0.0 - 1.0) using string similarity algorithms.
    *   Stores `originalQuery` (User Intent) vs `resolvedTitle` (API Reality).
    *   Used by the Cache to ensure we don't repeatedly re-fetch the wrong album.

### Playlist Model (`Playlist.js`)
*   **Role**: Lightweight DTO for generated playlists.
*   **Features**:
    *   `getDuration()`: Calculates total seconds.
    *   `getDurationMinutes()`: Returns float minutes.
    *   Ensures all children are hydrated `Track` instances.

## 3. Store & Cache Internals

### Albums Store (`public/js/stores/albums.js`)
*   **Role**: In-memory state management for Albums, synchronized with Firestore.
*   **Architecture**:
    *   **Series-Keyed Map**: `albumsByAlbumSeriesId` (Map<string, Album[]>). This is critical for cache preservation. It allows the user to browse Series A, go to Series B, and back to Series A without re-fetching.
    *   **Active Context**: `activeAlbumSeriesId` determines which array is currently being "watched" by the View.
    *   **Firestore Sync**: `saveToFirestore` performs a deep serialization to ensure ES6 Model classes are converted to plain JSON before upload.

### Album Cache (`public/js/cache/albumCache.js`)
*   **Status**: **Transitional (Hybrid)**.
*   **Role**: L2 Persistence (Offline capability).
*   **Migration Architecture**:
    *   **Primary**: `CacheManager` (IndexedDB).
    *   **Fallback**: `localStorage` (Legacy).
    *   **Logic**: On `get()`, it checks IndexedDB. If missing, it checks `localStorage`. If found in `localStorage`, it **migrates** the data to IndexedDB and deletes the legacy entry. This ensures a seamless transition for users moving to V3.
    *   **TTL**: 7 days.
