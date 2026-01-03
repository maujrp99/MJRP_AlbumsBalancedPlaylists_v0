---
description: "Tasks for Sprint 17: Frontend Specialization & Modularization"
---

# Tasks: Sprint 17 - Architectural Modularization

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)
**Status**: Draft

## Phase 1: Data Normalization (Backend) 🏗️
**Goal**: Ensure API returns "clean" data, removing the need for frontend patching.
**Dependencies**: None.

- [ ] **T17-101** `server/lib/normalize.js`: Implement "Thriller" bug fix (handle Query vs Array objects) on backend.
- [ ] **T17-102** `server/lib/normalize.js`: Ensure all fields (`spotifyId`, `bestEverScore`, `series`, `artist`, `title`) are consistently populated (or null).
- [ ] **T17-103** `public/js/client.js`: Remove `fixAlbumData()` and any ad-hoc data patching logic.
- [ ] **T17-104** Verification: Fetch known problematic album (e.g., Thriller) and verify structure via Network tab.

---

## Phase 2: SeriesView Refactor (The "Thin View") 🎨
**Goal**: Reduce `SeriesView.js` to < 200 LOC by extracting Logic and State.
**Dependencies**: Phase 1 (Data is stable).

- [ ] **T17-201** Create `public/js/services/SeriesFilterService.js`. Implement pure functions `filterAlbums`, `getUniqueArtists`.
- [ ] **T17-202** Create `public/js/controllers/SeriesController.js`. Move state (`currentFilter`, `searchQuery`) and orchestration logic here.
- [ ] **T17-203** `public/js/views/SeriesView.js`: Refactor to accept `controller` instance. Remove filtering logic. Keep only DOM mounting and Event binding.
- [ ] **T17-204** `public/js/router.js`: Update router to instantiate Controller instead of View directly (or have Controller manage the View).
- [ ] **T17-205** Verification: Test Filter Bars (Artist, Year, Source) and Search.

---

## Phase 3: MusicKitService Split 🎵
**Goal**: Decompose God Service (692 LOC) into domain services.
**Dependencies**: None (Parallelizable).

- [ ] **T17-301** Create directory `public/js/services/musickit/`.
- [ ] **T17-302** Create `MusicKitAuth.js`: Move `authorize`, `unauthorize` logic here.
- [ ] **T17-303** Create `MusicKitCatalog.js`: Move `search`, `getAlbum` logic here.
- [ ] **T17-304** Create `MusicKitLibrary.js`: Move `exportPlaylist`, `getPlaylists` logic here.
- [ ] **T17-305** `public/js/services/MusicKitService.js`: Refactor to Facade Pattern importing the above modules.
- [ ] **T17-306** Verification: Test "Search" (Catalog) and "Export" (Library).

---

## Phase 4: Curation Engine & Top N Parameter 🎛️
**Goal**: Parametrize Top N algorithm and implement Strategy Pattern.
**Dependencies**: Phase 1.

### 4.1 UI Updates
- [ ] **T17-401** `BlendFlavorCard.js`: Add generic "Top N" flavor card info. Remove specific "Top 3"/"Top 5" entries.
- [ ] **T17-402** `BlendIngredientsPanel.js`: Add conditional logic to render **Slider/Input (1-10)** when `top-n` flavor is selected.
- [ ] **T17-403** `BlendIngredientsPanel.js`: Update `getConfig()` to pass `algorithmParams: { n: value }`.

### 4.2 Logic Updates
- [ ] **T17-404** `PlaylistGenerationService.js`: Ensure `algorithmParams` are passed to `algorithm.generate()`.
- [ ] **T17-405** `TopNAlgorithm.js`: Verify usage of `opts.algorithmParams.n` (or `trackCount`) overrides default.
- [ ] **T17-406** `CurationEngine.js`: Refactor `curate()` method to use Strategy Pattern (delegate to Algorithm classes cleanly).
- [ ] **T17-407** Cleanup: Delete `Top3Popular.js`, `Top5Acclaimed.js`, etc.

### 4.3 Verification
- [ ] **T17-408** Test Generation with N=1 (Singles).
- [ ] **T17-409** Test Generation with N=10 (Full Album mode).

---

## Phase 5: Documentation & Polish 📝
- [ ] **T17-501** Run Code Quality Assessment v11.0 to verify new LOC counts.
- [ ] **T17-502** Update `component_reference.md` with new Controller/Service structure.
