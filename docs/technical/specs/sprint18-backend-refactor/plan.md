# Implementation Plan - Sprint 18: Backend Refactor (Track B)

**Goal**: Decouple `albums.js` God Route AND Refactor `SpotifyExportModal.js`.
**Scope**: Server-side & Frontend.

**Branch**: `feature/sprint-18-recipes-and-refactor` (Shared)

## User Review Required
> [!NOTE]
> This refactor moves logic from `server/routes/albums.js` to `server/lib/services/`. It should be purely structural with no behavior change (Refactoring).

## Proposed Changes

### 1. New Service: EnrichmentService
#### [NEW] [EnrichmentService.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/lib/services/EnrichmentService.js)
- **Responsibility**: Handle BestEverAlbums scraping, caching (Firestore), and response mapping.
- **Methods**:
    - `enrichAlbum(albumData, options)`
    - `_scrapeBestEver(artist, title)` (Private)
    - `_mapEvidenceToTracks(evidence, tracklist)` (Private)

### 2. New Service: GenerationService
#### [NEW] [GenerationService.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/lib/services/GenerationService.js)
- **Responsibility**: Handle AI Prompt rendering, API calls, and JSON parsing/validation.
- **Methods**:
    - `generateAlbum(query, model, maxTokens)`
    - `_validateStructure(album)` (Private)

### 3. Route Slimming
#### [MODIFY] [server/routes/albums.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/routes/albums.js)
- Remove all inline logic.
- Import `EnrichmentService` and `GenerationService`.
- Replace 200+ LOC with simple Controller calls:
  ```javascript
  router.post('/enrich-album', async (req, res) => {
      const result = await EnrichmentService.enrichAlbum(req.body.albumData);
      res.json(result);
  });
  ```

## Track C: Frontend Refactor (Spotify Export)

### 4. New Service: SpotifyExportService
#### [NEW] [public/js/services/SpotifyExportService.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/services/SpotifyExportService.js)
- **Responsibility**: Handle Spotify API interaction state machine (Search -> Create -> Add).
- **Methods**:
    - `exportPlaylist(name, tracks, callbacks)`: Handles the entire workflow.
    - `_findTrack(artist, title)`
    - `_createPlaylist(userId, name)`
    - `_addTracks(playlistId, uris)`

### 5. Component Slimming
#### [MODIFY] [public/js/components/SpotifyExportModal.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/SpotifyExportModal.js)
- **Change**: Delegating logic to `SpotifyExportService`.
- **Outcome**: Focus purely on UI Rendering (Progress updates). LOC reduction > 50%.

## Verification Plan
1.  **Manual Test**: Check `docs/debug/DEBUG_LOG.md` for historical test cases.
2.  **API Test**:
    - Hit `POST /api/generate` with "Thriller Michael Jackson".
    - Hit `POST /api/enrich-album`.
    - Verify output matches V3.17.5 behavior.
