# Tasks - Sprint 19 Track B: Stores Refactoring
**Status**: 📋 PENDING REVIEW
**Agent**: Agent 2 (This Agent)
**Branch**: `feature/sprint-19-track-b-stores`
**Spec**: [spec.md](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/technical/specs/sprint19-frontend-modularization/spec.md)
**Plan**: [plan-track-b.md](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/technical/specs/sprint19-frontend-modularization/plan-track-b.md)

---

## Phase 1: PlaylistsService Extraction

### 1.1 Create `PlaylistsService.js`
- [x] Create `public/js/services/PlaylistsService.js` file <!-- id: 1 -->
- [x] Define class skeleton with constructor <!-- id: 2 -->
- [x] Implement `calculateStats(playlists)` method <!-- id: 3 -->
- [x] Implement `prepareForExport(playlist)` method <!-- id: 4 -->

### 1.2 Migrate Firestore Logic
- [x] Move `saveToFirestore()` logic to `PlaylistsService.saveBatch()` <!-- id: 5 -->
- [x] Move `loadFromFirestore()` logic to `PlaylistsService.loadBatch()` <!-- id: 6 -->
- [x] Implement `PlaylistsService.deleteBatch()` method <!-- id: 7 -->

### 1.3 Update `playlists.js` Store
- [x] Remove computation methods (keep thin setters) <!-- id: 8 -->
- [x] Import and delegate to `PlaylistsService` for CRUD <!-- id: 9 -->
- [x] Verify `getState()` still exposes required data <!-- id: 10 -->

### 1.4 Verify Phase 1
- [x] Run `npm run build` <!-- id: 11 -->
- [/] Verify `playlists.js` LOC < 250 (Currently 443, needs more extraction) <!-- id: 12 -->

---

## Phase 2: SeriesService Extraction

### 2.1 Create `SeriesService.js`
- [x] Create `public/js/services/SeriesService.js` file <!-- id: 13 -->
- [x] Define class skeleton with constructor <!-- id: 14 -->

### 2.2 Migrate CRUD Logic
- [x] Move `createSeries()` logic to `SeriesService.createSeries()` <!-- id: 15 -->
- [x] Move `updateSeries()` logic to `SeriesService.updateSeries()` <!-- id: 16 -->
- [x] Move `deleteSeries()` logic to `SeriesService.deleteSeries()` <!-- id: 17 -->

### 2.3 Migrate Album Management
- [x] Move `removeAlbumFromSeries()` to `SeriesService.removeAlbumFromSeries()` <!-- id: 18 -->
- [x] Implement `SeriesService.addAlbumToSeries()` if needed <!-- id: 19 -->

### 2.4 Orchestration (Enrichment)
- [x] Implement `SeriesService.enrichAllAlbums(seriesId, onProgress)` stub <!-- id: 20 -->
- [x] Wire to existing enrichment flow if applicable <!-- id: 21 -->

### 2.5 Update `albumSeries.js` Store
- [x] Remove CRUD methods (keep thin setters) <!-- id: 22 -->
- [x] Import and delegate to `SeriesService` for operations <!-- id: 23 -->
- [x] Verify `getState()` still exposes required data <!-- id: 24 -->

### 2.6 Verify Phase 2
- [x] Run `npm run build` <!-- id: 25 -->
- [/] Verify `albumSeries.js` LOC < 250 (Currently 401, needs more extraction) <!-- id: 26 -->

---

## Phase 3: Integration & Regression

### 3.1 Consumer Updates
- [x] Update any View/Controller that imported CRUD methods directly <!-- id: 27 -->
- [x] Verify BlendingMenuView still works <!-- id: 28 -->
- [x] Verify PlaylistsView still works <!-- id: 29 -->

### 3.2 Browser Regression
- [x] Manual Check: `[PLAYLIST_MGR]` checklist via Agent Browser <!-- id: 30 -->
- [x] Manual Check: `[BLEND]` checklist via Agent Browser <!-- id: 31 -->

### 3.3 Documentation Sync
- [ ] Run `/documentation_protocol` post-implementation checklist <!-- id: 32 -->
- [ ] Update `06_Frontend_Data_Store.md` if needed <!-- id: 33 -->
- [ ] Update `17_Frontend_Services.md` with new services <!-- id: 34 -->

---

## Completion Criteria
- [/] `playlists.js` LOC < 250 (443 - partial extraction done) <!-- id: 35 -->
- [/] `albumSeries.js` LOC < 250 (401 - partial extraction done) <!-- id: 36 -->
- [x] Build passes <!-- id: 37 -->
- [x] Browser regression passes <!-- id: 38 -->
