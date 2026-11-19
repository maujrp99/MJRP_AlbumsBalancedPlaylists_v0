# Deep Dive: State Management & Core Integrations (Gap Fill)

This document fills the remaining gaps in the "Brain" and "Data" layers, specifically covering the primary Controller, Data Models, and the Album Store/Cache internals.

## 1. The Controller Layer

### Series Controller (`public/js/controllers/SeriesController.js`)
*   **Role**: translates what the Albums screen wants into requests. It replaced the legacy `AlbumsStateController`.
*   **What it does**:
    1.  **Scope**: ALL series (the hub) or a SINGLE series.
    2.  **Page view** (`getPageView`): sorts the series, filters them with `models/seriesFilter.js`, and cuts the result to the current page with `models/paging.js`. The filter runs over every series, then the page is cut; never the other way round.
    3.  **Load request** (`requestLoad`): hands the series of the page to `AlbumLoadService.load`. It can be called again at any time; the service keeps what it has.
    4.  **Paging state**: `page`, `pageSize` (10 to 100) and `pagingMode` (`pages` or `scroll`), the last two kept in `localStorage`.
    5.  **Subscriptions**: `init` runs on every visit, so it first ends the subscriptions of the previous visit. When the screen closes, `SeriesView.destroy` calls `detachView`, which ends them at once: the controller lives for the whole session and must not draw into a screen that is gone. The load itself goes on in the service.
    6.  **Own ranking**: `saveRanking(album, rankings)` is what the ranking modal reports to. It saves through `OwnRankingService` and then asks `AlbumLoadService.refreshSource(album.id, 'userRanking')`, so only that source of that album is read again. The 'My Ranking' filter (`getOwnRankedKeys`) answers for every series: the list of ranked albums is read once (`OwnRankingService.ensureLoaded`, when the filter is chosen) and matched to the album queries by `models/ownRanking.js`.
    7.  **Albums not checked yet**: with a source filter on (`pending`, `acclaim`, `popularity`), `getPageView` counts the queries with no `facts` in the scope on screen (`paging.unchecked`); the pager shows the notice.
    8.  **Names shown plain**: `getScreenSeries` undoes HTML entities left in a stored series name (UAT-180).
*   **What it no longer does** (since v4.0): it has no load loop, no `AbortController`, no "is loading" flag of its own, and it does not write albums to Firestore. Loading belongs to `AlbumLoadService`.

### Album load sequence (v4.0)
```mermaid
sequenceDiagram
    participant View as SeriesView
    participant Ctrl as SeriesController
    participant Svc as AlbumLoadService
    participant Q as TaskQueue
    participant Ports as Catalog / Enrichers / Cache
    participant Store as AlbumLoadStore

    View->>Ctrl: loadScope(ALL | SINGLE)
    Ctrl->>Ctrl: getPageView() - filter all series, cut the page
    Ctrl->>Svc: load({ scopeKey, series of the page })
    Svc->>Store: one entry per album asked for (pending)
    Store-->>View: grey block for each series that is loading
    Svc->>Q: find each album (3 at a time)
    Q->>Ports: cache.get, else catalog.find
    Ports-->>Svc: album
    Svc->>Store: found (only the current generation writes)
    Store-->>View: the album is on screen
    Svc->>Q: enrich: own ranking, popularity, then ratings (4 at a time)
    Ports-->>Svc: done | empty | failure, per source
    Svc->>Store: a NEW album replaces the published one
```

### Where the load lives (v4.0)
| File | Responsibility |
| :--- | :--- |
| `services/albums/AlbumLoadService.js` | The one owner of the load: generations, reconciliation, find then enrich, retry. Imports no network, Firestore or screen. |
| `services/albums/albumLoading.js` | Puts the service together with its real sources, and projects the load store into `stores/albums.js`. |
| `services/albums/adapters/CatalogAdapter.js` | Apple Music (by the chosen edition id, else by name), with the server `/api/generate` only when Apple has no such album. Retries Apple with growing waits. |
| `services/albums/adapters/enrichers.js` | Ratings, popularity and the person's own ranking; each returns a new album. |
| `services/albums/adapters/AlbumCacheAdapter.js` | One record per album query: the base album and one status per source. |
| `utils/TaskQueue.js` | Concurrency limit, priority, deadline per task, cancellation. Knows nothing about albums. |
| `stores/albumLoad.js` | The one owner of "album asked for -> album and its load state". Pure state. |

## 2. The Data Models (`public/js/models/`)

### Pure rules of the albums screen (v4.0)
No DOM, no store, no service: each imports only other models (checked by `test/architecture/`).

| File | What it decides |
|---|---|
| `albumQuery.js` | The one reader and the one writer of an album query. `parseAlbumQuery` reads "Artist - Title" or `{ artist, title }` and undoes HTML entities left in stored text; `plainAlbumQuery` is what a catalog is asked with; `toAlbumQuery(album)` is the shape a series stores for an album the person picked (Home, edit series), always plain text. |
| `text.js` | `decodeEntities`: undoes the common HTML entities of a stored text (`&amp;`, `&lt;`, `&#39;`, numeric ones), also when escaped more than once. Rule: text is stored and compared plain; escaping belongs to drawing an HTML template, never to the data and never to a text node. |
| `albumLoadState.js` | The states of an album and of a series, and `queryKey`: the same query gives the same key, whether stored with `&amp;` or with `&`. |
| `seriesFilter.js` | The filters over the album queries of every series; `countUnchecked` and `readsFacts` say how many queries a source filter cannot answer for yet. |
| `ownRanking.js` | Which queries the person has ranked. A ranking is stored under the id of the album that was loaded, a series stores what was asked: they are matched by name written the same way on both sides (case, accents, punctuation, "&" and "and", HTML entities and the edition note do not count), and by id when the ranking has no names. A loaded album that carries a ranking is matched exactly. |
| `paging.js`, `albumFacts.js` | Pages of series (10 to 100); the facts a series keeps about each album. |

### Album Model (`Album.js`)
*   **Role**: The canonical representation of an Album.
*   **Key Distinction**: Supports **Dual-Tracklists**.
    *   `tracksOriginalOrder`: The disk order (1..N).
    *   `tracks` (or `tracksByAcclaim`): The sorted order based on ranking.
*   **User Ranking (Sprint 20)**: Implements `setUserRankings(rankings)` to inject personal track order across both tracklists simultaneously, ensuring UI consistency.
*   **Integrity**: `ensureRankingIntegrity()` ensures that if external ranking data is missing, the model falls back to using the Original Order as the "Ranking" to prevent crashes in the Algorithm layer.

### Album Identity (`AlbumIdentity.js`)
*   **Role**: Solves the "Fuzzy Match Problem".
*   **Problem**: User saves "Pink Floyd - Dark Side". API returns "Pink Floyd - The Dark Side of the Moon (2011 Remaster)". Are these the same?
*   **Solution**:
    *   Calculates a **Confidence Score** (0.0 - 1.0) using string similarity algorithms.
    *   Stores `originalQuery` (User Intent) vs `resolvedTitle` (API Reality).
    *   Used by `CatalogAdapter` to check that what Apple Music found by name is the album asked for. The cache does not use it: the cache key is the album query.

### Playlist Model (`Playlist.js`)
*   **Role**: Lightweight DTO for generated playlists.
*   **Features**:
    *   `getDuration()`: Calculates total seconds.
    *   `getDurationMinutes()`: Returns float minutes.
    *   Ensures all children are hydrated `Track` instances.

## 3. Store & Cache Internals

### Album Load Store (`public/js/stores/albumLoad.js`) - v4.0
*   **Role**: the one owner of which albums a series has and where each one is in the load.
*   **Shape**: per series, one entry per album query: `{ key, seriesId, query, status, album, error, enrichment }`.
    *   `status`: `pending`, `finding`, `found`, `failed` (with `error.reason`: `not-found`, `timeout` or `network`), `cancelled`.
    *   `enrichment`: one status per source (`acclaim`, `popularity`, `userRanking`): `pending`, `loading`, `done`, `empty`, `failed`. "The source has nothing" (`empty`) is never the same as "the source failed".
*   **Series state is derived, never stored** (`models/albumLoadState.js`, `deriveSeriesState`): `loading`, `complete`, `failed` (nothing loading and at least one album failed) or `empty`.
*   **Notices are grouped**: several changes in the same tick give one notice. `subscribe` returns the function that ends the subscription.

### Albums Store (`public/js/stores/albums.js`)
*   **Role**: the shelf the other screens read (`getAlbums`, `getAlbumsForSeries`). Since v4.0 it is a projection of the load store, written through `setAlbumsBySeries` by `services/albums/albumLoading.js`.
*   **Still true**: `albumsByAlbumSeriesId` keeps the albums per series, and `ALL_SERIES_VIEW` holds the albums of every series on screen.
*   **Known debt**: the store still holds Firestore code (`saveToFirestore`, `loadFromFirestore`) that the album load no longer calls; only "Refetch Metadata" still writes through it (issue UAT-14).

### Album Load Cache (`public/js/services/albums/adapters/AlbumCacheAdapter.js`) - v4.0
*   **Storage**: `CacheManager` (memory + IndexedDB `mjrp-cache`), keys `albumload:v1:<album query>`, 7 days.
*   **Record**: `{ album, enrichment: { <source>: { status, at } } }`. The base album is saved as soon as it is found; each source adds its own status later.
*   **Rules**: an `empty` answer is trusted for 1 hour only; a failure is never saved; the person's own ranking is never saved with the album; every read gives a new `Album`.

### Legacy Album Cache (`public/js/cache/albumCache.js`)
*   **Status**: still used by `apiClient.fetchAlbum`, which the Blending Menu and the playlist edit mode call. The Albums screen no longer uses it.
*   **Keys**: `album:<artist - title>` in IndexedDB, plus a 7-day window that still reads old `localStorage` entries. An entry found in `localStorage` is copied to IndexedDB; it is **not** deleted from `localStorage`.
*   **TTL**: 7 days.
