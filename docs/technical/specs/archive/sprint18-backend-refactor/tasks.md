# Tasks - Sprint 18: Quality & Refactor (Holistic)

**Feature**: Backend Route Thinning
**Outcome**: `albums.js` < 60 LOC. PASS Code Quality Check.

## 1. EnrichmentService Extraction
- [x] Create `server/lib/services/EnrichmentService.js` <!-- id: 1 -->
- [x] Move `getBestEverRanking` logic to Service <!-- id: 2 -->
- [x] Move `consolidateRanking` logic to Service <!-- id: 3 -->
- [x] Move `tracks` mapping logic to Service <!-- id: 4 -->

## 2. GenerationService Extraction
- [/] Create `server/lib/services/GenerationService.js` <!-- id: 5 -->
- [/] Move AI Provider call logic (`callProvider`) to Service <!-- id: 6 -->
- [x] Move `ajv` validation logic to Service <!-- id: 7 -->

## 3. Route Refactor
- [x] Refactor `server/routes/albums.js`: Import new Services <!-- id: 8 -->
- [x] Refactor `server/routes/albums.js`: Replace `/enrich-album` logic <!-- id: 9 -->
- [x] Refactor `server/routes/albums.js`: Replace `/generate` logic <!-- id: 10 -->

## 4. Frontend Refactor (Spotify Export)
- [x] Create `public/js/services/SpotifyExportService.js` <!-- id: 13 -->
- [x] Move `searchSpotify` logic to Service <!-- id: 14 -->
- [x] Move `createPlaylist` logic to Service <!-- id: 15 -->
- [x] Move `addTracks` logic to Service <!-- id: 16 -->
- [x] Refactor `SpotifyExportModal.js` to use Service <!-- id: 17 -->

## 5. Frontend God Files (Renderers)
- [x] Refactor `SeriesGridRenderer.js`: Extract Card logic <!-- id: 20 -->
- [x] Refactor `TopNav.js`: Extract Auth logic <!-- id: 21 -->

## 6. Verification
- [x] **Code Quality Check**: Verify `albums.js` LOC < 60 <!-- id: 11 -->
- [x] **Manual Test**: Generate an album successfully <!-- id: 12 -->
- [x] **Code Quality Check**: Verify `SpotifyExportModal.js` LOC reduction (511 -> 405) <!-- id: 18 -->
- [ ] **Manual Test**: Export a playlist to Spotify <!-- id: 19 -->
