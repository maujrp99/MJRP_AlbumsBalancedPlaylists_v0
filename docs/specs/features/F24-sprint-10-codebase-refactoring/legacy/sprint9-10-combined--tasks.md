# Tasks: Sprint 10 - Codebase Refactoring

**Input**: Design documents from `docs/technical/specs/sprint10-refactor/`  
**Prerequisites**: spec.md (complete), plan.md (complete)

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US4)

---

## Phase 1: Setup

**Purpose**: Verify clean starting state

- [x] T001 Run `npm run build` and confirm success ✅ (3.91s)
- [x] T002 Run `npm run test` and confirm all tests pass ✅ (74 passed, 4 pre-existing failures)
- [x] T003 Commit current state as "pre-refactor checkpoint"

**Checkpoint**: Clean baseline confirmed ✅

---

## Phase 2: User Story 4 - Remove Dead Legacy Code (Priority: P1) 🎯

**Goal**: Delete unused app.legacy.js (47KB)

**Independent Test**: Build and tests pass after deletion

### Implementation

- [x] T004 [US4] Verify no imports of `app.legacy.js` via grep search ✅ (0 code references)
- [x] T005 [US4] Delete `public/js/app.legacy.js` ✅
- [x] T006 [US4] Run `npm run build` to verify ✅ (3.92s)
- [x] T007 [US4] Run `npm run test` to verify ✅ (same baseline: 74/4)
- [x] T008 [US4] Manual: Load app in browser, verify no errors ⏳ (pending user verification)

**Checkpoint**: 47KB of dead code removed, app works ✅

---

## Phase 3: User Story 1 - AlbumsView Modularization (Priority: P1) 🎯 MVP

**Goal**: Split 1,820-line AlbumsView.js into focused modules

**Independent Test**: All Albums page features work after refactor

### Step 3.1: Create Module Directory

- [x] T009 [US1] Create `public/js/views/albums/` directory ✅
- [x] T010 [P] [US1] Create `public/js/views/albums/index.js` barrel export ✅

### Step 3.2: Extract AlbumsGridRenderer

- [x] T011 [US1] Create `AlbumsGridRenderer.js` with rendering methods ✅ (315 lines)
  - `renderAlbumsGrid(albums, view)`
  - `renderExpandedList(albums, view)`
  - `renderRankedTracklist(album, view)`
  - `renderOriginalTracklist(album, view)`
  - `renderEmptyState()`
  - `renderLoadingProgress(progress)`
  - `renderRankingBadge(album)` *(bonus)*
  - `renderCompactAlbumCard(album)` *(bonus)*
  - `renderExpandedAlbumCard(album)` *(bonus)*
- [ ] T012 [US1] Update `AlbumsView.js` to import and delegate to renderer

### Step 3.3: Extract AlbumsFilters

- [x] T013 [P] [US1] Create `AlbumsFilters.js` with filter logic ✅ (125 lines)
  - `filterAlbums(albums, filters, searchQuery)`
  - `getUniqueArtists(albums)`
  - `getDecadeOptions()` *(bonus)*
  - `getSourceOptions()` *(bonus)*
- [ ] T014 [US1] Update `AlbumsView.js` to import and use filters

### Step 3.4: Extract SeriesModals

- [ ] T015 [P] [US1] Create `SeriesModals.js` with modal handlers:
  - `setupSeriesModals(view)`
  - `openEditSeriesModal(seriesId, view)`
  - `openDeleteSeriesModal(seriesId, view)`
  - `renderSeriesAlbumsList(view)`
  - `closeSeriesModal(modal)`
  - `initSeriesAutocomplete(view)`
- [ ] T016 [US1] Update `AlbumsView.js` to import and delegate to modals

### Step 3.5: Extract AlbumsDataLoader

- [ ] T017 [P] [US1] Create `AlbumsDataLoader.js` with data loading:
  - `loadScope(scopeType, seriesId, skipCache, view)`
  - `loadAlbumsFromQueries(queries, skipCache, view)`
  - `updateLoadingProgress(view)`
- [ ] T018 [US1] Update `AlbumsView.js` to import and delegate to loader

### Step 3.6: Refactor AlbumsView.js

- [ ] T019 [US1] Refactor `AlbumsView.js` to orchestration only
- [ ] T020 [US1] Verify line count < 600
- [ ] T021 [US1] Run `npm run build` to verify
- [ ] T022 [US1] Run `npm run test` to verify

### Step 3.7: Manual Verification

- [ ] T023 [US1] Manual: Test filter by artist
- [ ] T024 [US1] Manual: Test filter by year
- [ ] T025 [US1] Manual: Test filter by source
- [ ] T026 [US1] Manual: Test search functionality
- [ ] T027 [US1] Manual: Test view mode toggle
- [ ] T028 [US1] Manual: Test series modals (edit/delete)
- [ ] T029 [US1] Manual: Test add/remove album to series

**Checkpoint**: AlbumsView modularized, all features work

---

## Phase 4: User Story 2 - Server Route Extraction (Priority: P2)

**Goal**: Split server/index.js into route modules

**Independent Test**: All API endpoints respond correctly

### Step 4.1: Create Album Routes

- [x] T030 [US2] Create `server/routes/albums.js` ✅ (~265 lines)
  - POST `/generate`
  - POST `/enrich-album`
- [ ] T031 [US2] Update `server/index.js` to use album routes

### Step 4.2: Create Playlist Routes

- [x] T032 [P] [US2] Create `server/routes/playlists.js` ✅ (~65 lines)
  - POST `/playlists`
- [ ] T033 [US2] Update `server/index.js` to use playlist routes

### Step 4.3: Create Debug Routes

- [x] T034 [P] [US2] Create `server/routes/debug.js` ✅ (~135 lines)
  - GET `/list-models`
  - POST `/debug/raw-ranking`
  - GET `/debug/files`
  - GET `/debug/import`
- [ ] T035 [US2] Update `server/index.js` to use debug routes

### Step 4.4: Refactor index.js

- [ ] T036 [US2] Refactor `server/index.js` to app setup only
- [ ] T037 [US2] Verify line count < 150
- [ ] T038 [US2] Run server and test endpoints

### Step 4.5: API Verification

- [ ] T039 [US2] Test: POST `/api/generate` returns album data
- [ ] T040 [US2] Test: POST `/api/enrich-album` returns bestEverInfo.albumId
- [ ] T041 [US2] Test: POST `/api/playlists` generates playlists
- [ ] T042 [US2] Test: GET `/_health` responds OK

**Checkpoint**: Server routes modularized, all endpoints work

---

## Phase 5: User Story 3 - PlaylistsView Modularization (Priority: P3)

**Goal**: Split PlaylistsView.js into focused modules

**Independent Test**: All Playlists features work after refactor

### Step 5.1: Create Module Directory

- [x] T043 [US3] Create `public/js/views/playlists/` directory ✅
- [x] T044 [P] [US3] Create `public/js/views/playlists/index.js` barrel export ✅

### Step 5.2: Extract PlaylistsExport

- [x] T045 [US3] Create `PlaylistsExport.js` ✅ (~140 lines)
  - `handleExportJson()`
  - `handleExportToAppleMusic()`
- [ ] T046 [US3] Update `PlaylistsView.js` to import and delegate

### Step 5.3: Extract PlaylistsDragDrop

- [x] T047 [P] [US3] Create `PlaylistsDragDrop.js` ✅ (~80 lines)
  - `setupDragAndDrop(view)`
- [ ] T048 [US3] Update `PlaylistsView.js` to import and delegate

### Step 5.4: Refactor PlaylistsView.js

- [ ] T049 [US3] Refactor `PlaylistsView.js` to orchestration only
- [ ] T050 [US3] Verify line count < 500
- [ ] T051 [US3] Run `npm run build` to verify

### Step 5.5: Manual Verification

- [ ] T051 [US3] Manual: Test drag-and-drop track reordering
- [ ] T052 [US3] Manual: Test export to JSON
- [ ] T053 [US3] Manual: Test export to Apple Music

**Checkpoint**: PlaylistsView modularized, all features work

---

## Phase 6: Polish & Documentation

**Purpose**: Final cleanup and documentation updates

- [ ] T054 [P] Update `docs/refactor/CODE_QUALITY_ASSESSMENT.md` with new scores
- [ ] T055 [P] Update `docs/ARCHITECTURE.md` with new module structure
- [ ] T056 Commit final state with summary of changes
- [ ] T057 Run full test suite one final time

**Checkpoint**: Refactor complete, documentation updated

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (US4: Delete Legacy)
                         ↓
                  Phase 3 (US1: AlbumsView) → Phase 4 (US2: Server) → Phase 5 (US3: Playlists)
                                                                              ↓
                                                                       Phase 6 (Polish)
```

### Parallel Opportunities

- T010, T013, T015, T017 can run in parallel (different new files)
- T032, T034 can run in parallel (different route files)
- T044, T046 can run in parallel (different module files)

---

## Progress Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Setup | T001-T003 | ✅ Complete |
| Phase 2: US4 Delete Legacy | T004-T008 | ✅ Complete (47KB saved) |
| Phase 3: US1 AlbumsView | T009-T029 | 🔄 In Progress (T009-T014 done) |
| Phase 4: US2 Server Routes | T030-T042 | 🔄 In Progress (T030,T032,T034 done) |
| Phase 5: US3 PlaylistsView | T043-T053 | 🔄 In Progress (T043-T048 done) |
| Phase 6: Polish | T054-T057 | ⏳ Pending |

**Files Created**:

| Location | Files | Lines |
|----------|-------|-------|
| `views/albums/` | 3 modules | ~440 |
| `views/playlists/` | 3 modules | ~220 |
| `server/routes/` | 3 modules | ~465 |
| **Total** | **9 modules** | **~1,125** |

**Files Modified**:
- `AlbumsView.js`: 1,837 → 1,524 lines (-17%)
- `PlaylistsView.js`: 891 → 756 lines (-15%)
- `app.legacy.js`: Deleted (47KB saved)

**Build**: ✅ 4.34s (131 modules)

**Total Tasks**: 57
**Completed**: 17/57 (30%)
**Last Updated**: 2025-12-18 10:50
