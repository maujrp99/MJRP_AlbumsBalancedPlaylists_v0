# Tasks: Sprint 18 - Backend Refactor (Track B)

**Feature**: Backend Route Thinning
**Outcome**: `albums.js` < 60 LOC. PASS Code Quality Check.

## 1. EnrichmentService Extraction
- [/] Create `server/lib/services/EnrichmentService.js` <!-- id: 1 -->
- [/] Move `getBestEverRanking` logic to Service <!-- id: 2 -->
- [/] Move `consolidateRanking` logic to Service <!-- id: 3 -->
- [/] Move `tracks` mapping logic to Service <!-- id: 4 -->

## 2. GenerationService Extraction
- [/] Create `server/lib/services/GenerationService.js` <!-- id: 5 -->
- [/] Move AI Provider call logic (`callProvider`) to Service <!-- id: 6 -->
- [/] Move `ajv` validation logic to Service <!-- id: 7 -->

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

## 5. Verification
- [x] **Code Quality Check**: Verify `albums.js` LOC < 60 <!-- id: 11 -->
- [x] **Manual Test**: Generate an album successfully <!-- id: 12 -->
- [x] **Code Quality Check**: Verify `SpotifyExportModal.js` LOC reduction (511 -> 405) <!-- id: 18 -->
- [ ] **Manual Test**: Export a playlist to Spotify <!-- id: 19 -->
