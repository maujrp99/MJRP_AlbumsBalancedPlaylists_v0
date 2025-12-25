# Specification: DEBT-2 IndexedDB Persistence

## 1. Problem Description
Currently, `BaseRepository` uses an in-memory `Map` for caching (`CacheManager`).
- **Data Loss**: Refreshing the page clears the cache, forcing re-fetches from Firestore (Latency + Cost).
- **Offline**: App is unusable offline (except for what loaded in current session).

## 2. Goal
Upgrade `CacheManager` or `BaseRepository` to persist the L2 Cache to **IndexedDB**.

## 3. Scope
- **Target**: `public/js/cache/CacheManager.js`
- **Technology**: `idb` (Library) or raw IndexedDB API.
- **Data**: All entities managed by `BaseRepository` (Series, Albums, Playlists).

## 4. Success Criteria
1.  **Persistence**: Data survives page reload.
2.  **Speed**: App load time on second visit is near-instant (no network requests for cached data).
3.  **Transparency**: The rest of the app doesn't know it's loading from IDB vs Memory. `repository.findAll()` just works faster.

## 5. Constraints
- **Versioning**: Schema versioning is handled by `firestore.rules` (sort of), but we need to handle local data staleness.
    - *Strategy*: Simple TTL (Time To Live) is already in `CacheManager`. We just persist it.

## 6. User Review Required
- **Library**: Can we add a tiny dependency like `idb-keyval` (super lightweight) or `idb`, or strictly vanilla JS? (Recommendation: `idb` wrapper for sanity).
