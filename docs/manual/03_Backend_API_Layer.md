# Server Routes Analysis

## 1. AI Routes: `server/routes/ai.js`
**Status**: `[ACTIVE]`
**Type**: Express Router
**Mount Path**: `/api/ai`

### Endpoints
-   `POST /studio-albums`:
    -   **Input**: `{ artistName }`
    -   **Logic**: Uses Google Gemini to generate a strict JSON list of "original studio albums" for the artist, excluding compilations, EPs, singles, DJ mixes, live and remix albums.
    -   **Response**: `{ albums: [...] }`; on error it still answers 200 with `{ albums: [], error }`.
    -   **Features**: Includes robust JSON parsing fallback (regex extraction) to handle AI formatting errors.

---

## 2. Album Routes: `server/routes/albums.js`
**Status**: `[ACTIVE]`
**Type**: Express Router / Factory
**Mount Path**: `/api`

### Architecture
Uses a **Factory Pattern** (`initAlbumRoutes`) to inject dependencies (`callProvider`, `scrapers`, etc.) instead of requiring them directly. This facilitates testing and decoupling. `initAlbumRoutes(deps)` instantiates `EnrichmentService` and `GenerationService` (`server/lib/services/`) with those dependencies; the route handlers are thin and delegate to them.

```mermaid
classDiagram
    class App {
        +init()
    }
    class RouteFactory {
        +initAlbumRoutes(dependencies)
    }
    class Dependencies {
        +callProvider
        +getBestEverRanking
        +fetchRankingForAlbum
        +validateAlbum
    }
    class EnrichmentService {
        +enrichAlbum(albumData)
    }
    class GenerationService {
        +generateAlbum(reqBody, serverConfig)
    }

    App ..> Dependencies : Creates
    App ..> RouteFactory : Calls
    RouteFactory ..> EnrichmentService : Instantiates with Deps
    RouteFactory ..> GenerationService : Instantiates with Deps
    EnrichmentService o-- Dependencies : Uses
    GenerationService o-- Dependencies : Uses
```

### Endpoints
-   `POST /enrich-album`:
    -   **Input**: `{ albumData: { title, artist, tracks } }`
    -   **Logic**: Scrapes BestEverAlbums for the album to get community ratings/rankings. Maps these ratings to the provided tracklist using fuzzy string normalization.
    -   **Response**: `{ data: { bestEverInfo, trackRatings, trackEvidence } }`
-   `POST /generate`:
    -   **Input**: `{ albumQuery, model, maxTokens, rawStage }` (`rawStage: 'ranking'` returns the raw ranking response)
    -   **Logic**:
        1.  Calls AI to search/generate album metadata.
        2.  Validates response against `album.schema.json`.
        3.  Fetches external rankings (BestEverAlbums, Spotify popularity, AI) via `fetchRankingForAlbum`.
        4.  Consolidates AI + External data to rank tracks (`consolidateRanking`).
        5.  Sorts tracks by acclaim (`tracksByAcclaim`).
    -   **Response**: `{ data: albumPayload }` (422 with `validationErrors` when the album fails the schema).
-   Both endpoints answer 503 when `AI_API_KEY` is not set.

---

## 3. Debug Routes: `server/routes/debug.js`
**Status**: `[ACTIVE]` (Development/Diagnostics)
**Type**: Express Router / Factory
**Mount Path**: `/api`

### Endpoints
> **Off unless turned on by name.** These four routes are mounted only when the server starts with `ENABLE_DEBUG_ROUTES=true` (`server/lib/debugGate.js`). Without it they answer 404, in production and locally. `NODE_ENV` does not turn them on. The `rawStage` option of `POST /generate` follows the same switch.

-   `GET /list-models`: Proxies call to Google Gemini API to list available models.
-   `POST /debug/raw-ranking`: Returns the raw AI and Scraper responses without normalization, for debugging pipeline issues.
-   `GET /debug/files`: Lists one directory of the server file system (the server folder, or the one given in the `path` query parameter) to verify container structure in Cloud Run. There is no allow-list; like the other debug routes it only answers when `AI_API_KEY` is set.
-   `GET /debug/import`: Tests dynamic import of ES modules (specifically `shared/normalize.js`).

---

## 4. MusicKit Routes: `server/routes/musickit.js`
**Status**: `[ACTIVE]`
**Type**: Express Router
**Mount Path**: `/api`

### Endpoints
-   `GET /musickit-token`:
    -   **Logic**: Calls `MusicKitTokenService` to get/generate a signed JWT for Apple Music. Answers 503 with the `missing` list when the service is not configured.
    -   **Caching**: Returns cached token if valid.
    -   **Response**: `{ token, expiresAt, expiresIn, cached }`
-   `GET /musickit-status`:
    -   **Logic**: Checks if all required Env Vars (Team ID, Key ID, Private Key) are present. Returns `{ configured, missing }`.

---

## 5. Playlist Routes: `server/routes/playlists.js`
**Status**: `[ACTIVE]`
**Type**: Express Router
**Mount Path**: `/api`

### Dependencies
-   **Dynamic Import**: Imports `../../shared/curation.js` at runtime.

### Endpoints
-   `POST /playlists`:
    -   **Input**: `{ albums: [], options: { minDuration, maxDuration, targetDuration } }` (minutes; default target 45 min)
    -   **Logic**: Converts duration targets to seconds and delegates to `curateAlbums` (shared logic) to generate balanced playlists.
    -   **Response**: `{ playlists: [...], summary, sources }`

### Playlist Logic Flow
```mermaid
sequenceDiagram
    participant Client
    participant Route as PlaylistRoute
    participant Curation as Shared/Curation
    
    Client->>Route: POST /playlists { albums, options }
    Route->>Route: Import shared/curation.js
    Route->>Route: Calculate Target Seconds
    
    Route->>Curation: curateAlbums(albums, options)
    Curation->>Curation: Bucket Tracks (P1, P2, DeepCuts)
    Curation->>Curation: Distribute & Balance (Swap Heuristic)
    Curation-->>Route: Generated Playlists (Internal Objects)
    
    Route->>Route: Format for API Response
    Route-->>Client: JSON { playlists, summary }
```

### Errors of a route
`server/lib/asyncRoute.js`: `asyncRoute(handler)` hands a rejected async handler to Express, and `errorResponder` (the last middleware in `server/index.js`) answers 500 `{ error: 'Internal server error' }`, or the 4xx of a request the server could not read, with no detail of the error. The detail goes to the log. `POST /generate` is wrapped by it.

### Who may call what (F59)
Wired in `server/index.js` before the routers, from `server/lib/auth/guards.js`:

| Routes | Who | Limit per person |
| :--- | :--- | :--- |
| `POST /api/generate`, `POST /api/ai/*` (paid AI) | a signed-in person with an account; a guest (anonymous login) gets 403 | 60 calls per hour (`PAID_CALLS_PER_HOUR`) |
| `POST /api/enrich-album`, `POST /api/playlists` | any signed-in person, guests included | 900 calls per hour (`COSTLY_CALLS_PER_HOUR`) |
| `GET /api/musickit-token`, `GET /api/musickit-status`, `GET /_health` | anyone | none |

The login is the Firebase ID token in `Authorization: Bearer <token>`. `server/lib/auth/verifyIdToken.js` checks it without the Admin SDK: signature against Google's keys for Firebase logins (fetched by `guards.js`, kept while Google says they are valid), project, issuer, expiry and subject. `requireUser.js` answers 401 (no login or one that does not check), 403 (guest on a paid route) or 503 (the keys could not be fetched: nobody goes through); `rateLimit.js` answers 429 with `Retry-After`. The count lives in the memory of each server instance. Switches: `REQUIRE_SIGN_IN=false` turns the door off (local experiments only), `PAID_ROUTES_ALLOW_ANONYMOUS=true` lets guests use the paid routes, `FIREBASE_PROJECT_ID` names the project. With no switch set the routes are closed to who is not signed in.
