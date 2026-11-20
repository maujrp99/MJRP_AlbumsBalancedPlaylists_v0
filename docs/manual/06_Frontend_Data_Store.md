# Frontend Data Layer Analysis

> **Deep Dive Enrichment**: This document details the Store-Service architecture, focusing on State Management patterns, Sync logic, and External Integrations.

## 1. Store Architecture
**Status**: `[ACTIVE]`
**Pattern**: Singleton Observables (Flux-like)

### 1.1 `stores/albumLoad.js` (AlbumLoadStore) - v4.0
**Purpose**: the one owner of which albums each series has and of the load state of each album. Pure state; only `AlbumLoadService` writes to it. Details in [08_Frontend_Models.md](08_Frontend_Models.md).

### 1.1a `stores/ownRankings.js` (OwnRankingsStore) - v4.0
**Purpose**: the albums the person has ranked (which, not how): the list, the person it belongs to and its state (`idle`, `loading`, `ready`, `failed`). Pure state; only `OwnRankingService` writes to it. `getIndex()` is derived and answers "is this album query ranked?" for the 'My Ranking' filter.

### 1.1c `stores/savedPlaylists.js` (SavedPlaylistsStore) - v5.0 (F61)
The state of the saved playlists list: the status of the list (`idle`, `loading`, `ready`, `failed`), the order of the series and one entry per series, `{ seriesId, series, status, playlists, batches, thumbnails, error, refreshing }`, with `status` one of `loading`, `ready`, `empty`, `failed`. Pure state: `begin`, `setSeries`, `setListFailed`, `patchEntry`, getters and `subscribe`; several changes in the same tick give one notice. An entry is replaced, never mutated, so the screen knows a series changed by comparing objects. Only `SavedPlaylistsReader` writes here; `begin` with another user id empties the list.

### 1.1b `stores/albums.js` (AlbumsStore)
**Purpose**: the shelf of loaded albums the other screens read.
*   Since v4.0 it is filled by projection from `AlbumLoadStore` (`setAlbumsBySeries`).
*   `ALL_SERIES_VIEW` holds the albums of every series on screen; each series id holds its own.
*   Since F56 (on the branch `fix/f56-screens-load-through-the-service`, not yet published) the projection is its only writer of albums: `addAlbumToSeries`, `addAlbum`, `removeAlbum`, `clearAlbumSeries` and `removeAlbumsBySeriesIdFromContext` were removed, with the "surgical injection" of Sprint 21.5. Editing or deleting a series changes the series, and the load reconciles. It also holds the series another screen asked for (the blend, the playlist edit), under the series id.
*   It is a pure state container (v4.0, F48): it imports no Firestore. The write of "Refetch Metadata" into the shared `albums` collection moved to `repositories/SharedAlbumRepository.js`; `saveToFirestore`, `loadFromFirestore` and `updateAlbum(db, album)` no longer exist.

### 1.2 Pure State Containers (Sprint 19)
**Status**: `[REFACTORED]`
**Pattern**: Pure State (Setters/Getters only)

The following stores were refactored to remove all business logic, delegating it to specialized Services. They now only hold reactive state and expose thin setters.

*   **`stores/playlists.js`**: Holds generated playlists, edit mode context, and undo history.
*   **`stores/albumSeries.js`**: Holds the list of series, active series index, and database context.

---

## 2. Service Layer
The Service Layer orchestrates complex operations and state transitions, isolating business logic from the pure state containers.

### 2.1 `services/PlaylistsService.js` [NEW]
**Purpose**: Orchestrates playlist lifecycle, history, and persistence.
*   **History Management**: Manages undo/redo stacks.
*   **Persistence**: keeps the browser draft of the playlists not saved yet (`saveToLocalStorage`, `watchStore`, `restoreDraft`) and saves through `PlaylistRepository`; it does not import Firestore (v5.0, F60).
*   **The save rule** (`saveCurrentBatch`, v5.0, F60): one save at a time; the series is the one of the playlists on screen (`playlistsStore.seriesId`); an edited batch is replaced by one atomic write; the screen changes only after the write is confirmed. `resolveBatchName` and `hasUnsavedChanges` answer the screen.
*   **Track Ops**: Business logic for moving/removing/reordering tracks, and `removePlaylist` for a whole playlist.

### 2.2 `services/SeriesService.js` [NEW]
**Purpose**: Manages Music Series lifecycle and album mapping.
*   **CRUD**: Create, Update, and Delete logic for series.
*   **Context Management**: Syncs user context and database instances to the store.
*   **Persistence**: Handles `localStorage` for quick-start data.

### 2.3 `services/SpotifyService.js`
**Status**: `[ACTIVE]`
**Type**: API Gateway / Adapter
**Dependencies**: `SpotifyAuthService` (Tokens)

**Purpose**: Handles all interactions with Spotify Web API, including complex search heuristics and data normalization.

#### A. Album Search (`searchAlbum`)
*   **Goal**: find the Spotify album that IS the album asked for, or none.
*   **Logic Trace** (F55, slice 1):
    1.  **Cleaning** of the search text only: removes common suffixes like `(Remastered)`, `(Deluxe Edition)`, `(Anniversary)`.
    2.  **Search 1**: `q=artist:Pink Floyd album:<clean title>` (5 results).
    3.  **Search 2**: the title as written, when cleaning changed it.
    4.  **Search 3**: `artist:Pink Floyd` (20 results).
    5.  **Acceptance**: the searches only list candidates. After each one, the one identity rule (`shared/albumIdentity.js`, through `models/askedAlbum.js`) picks the album asked for among them: the title must match on its own, the artist must match, the plain album comes before an edition. When a search lists no such album and exactly one album is accepted by a rule of the second tier (the title asked for before a subtitle, without what the candidate has in parentheses, and the others of `SECOND_TIER_RULES`), that one is taken (F55 slice 2, F68). The title without edition notes sent to the search is the rule's own (`titleWithoutEditionNotes`). No candidate passes all three searches: `null`.
*   **What it no longer does**: take the first result when nothing matched, accept a title that contains the other, or score by Levenshtein distance. Those three let another album of the same artist stand in for the album asked for (UAT-184).

#### B. Popularity of an album (`albumPopularity`) - v5.0 (F69)
*   **Goal**: the Spotify id, address, average popularity and per-track popularity of an album.
*   **Logic Trace**:
    1.  **Find**: calls `searchAlbum()`. `null` means only "Spotify answered and has no such album": a search that could not be made is thrown, the last (artist-only) search included.
    2.  **Details**: the album's tracks (simplified objects), then `/tracks?ids=...` for the full objects (needed for `popularity`), 50 ids per request.
    3.  **Aggregate**: the average popularity (0-100).
    4.  **Answer**: `{ found: true, data }`, or `{ found: false, reason }` with `not_found` (no album of Spotify is the album asked for) or `no_tracks` (the album lists no track). It never answers on a failure: `SpotifyReconnectError`, `SpotifyRateLimitError` or the error of the network or of the API goes up as it came.
*   **Who calls it**: one caller, the popularity source of the album load (`services/albums/adapters/spotifyPopularitySource.js`), behind `PopularityEnricher`. No screen and no other service asks Spotify for the popularity of an album (`test/architecture/spotifyPopularityOnePath.test.js`).

*   **Architecture Diagram (one path)**:
```mermaid
sequenceDiagram
    participant Load as AlbumLoadService (source queue)
    participant Enricher as PopularityEnricher
    participant Source as SpotifyPopularitySource
    participant Stored as SpotifyEnrichmentStore
    participant API as SpotifyService
    participant External as SpotifyAPI

    Load->>Enricher: enrich(album)
    Enricher->>Source: read(album)
    Source->>Stored: get(artist, title)
    alt stored
        Stored-->>Source: data
    else no Spotify session
        Source-->>Enricher: not_connected (nobody asked)
    else connected
        Source->>API: albumPopularity(artist, title)
        API->>External: GET /search, /albums/{id}, /tracks
        External-->>API: answer, or a failure (thrown)
        API-->>Source: found / not found
        Source->>Stored: save(data) when found
    end
    Source-->>Enricher: found | not_found | not_connected (or throws)
    Enricher-->>Load: done | empty + reason | not-connected (or throws: failed, or hold)
```

### 2.2 Other Services
*   **`AuthService.js`**:
    *   Wraps Firebase Auth.
    *   Exposes `waitForAuth()` Promise for safe bootstrapping.
*   **`SpotifyAuthService.js`**:
    *   Handles OAuth 2.0 PKCE flow.
    *   Manages Token Refresh logic automatically.

---

## 3. Models (`models/`)
**Status**: `[ACTIVE]`
**Type**: Domain Entities

-   **`Album.js`**: Core entity. Aggregates tracks, manages `original` vs `acclaim` order.
-   **`askedAlbum.js`**: The app's side of the one identity rule (`shared/albumIdentity.js`): reads a stored query into what was asked, and an Apple Music, Spotify or local-dataset album into a candidate, each as `{ artist, title, year }`. Since slice 2 it also reads an album the app keeps (`keptAlbum`), says which query of a series asked for an album (`indexOfQueryFor`, `alreadyAskedFor`) and gives the one-line notice of an album accepted by the second tier (`identityNotice`). It replaced `AlbumIdentity.js` (a confidence score), removed in F55.
