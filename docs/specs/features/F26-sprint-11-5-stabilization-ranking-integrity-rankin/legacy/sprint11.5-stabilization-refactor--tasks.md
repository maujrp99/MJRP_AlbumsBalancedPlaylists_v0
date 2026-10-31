# Tasks: Sprint 11.5 - Stabilization & Refactor

## Phase 1: Critical Debugging (Bug #71) 🔍

- [ ] Add `console.group` logging to `updateAlbumsGrid` in `AlbumsView.js`.
- [ ] Log `album.id` and `album.title` for every track list being rendered.
- [ ] Inspect the `tracks` array for shared references using `Object.is()`.
- [ ] Verify if `TracksRankingComparison` is being re-cached incorrectly.
- [ ] Implement fix for ID mismatch.

## Phase 2: State Isolation (Refactor) 🏗️

- [ ] Create `AlbumsStateController` class.
- [ ] Extract Filter initialization and handling.
- [ ] Extract Album sorting and searching logic.
- [ ] Bridge Controller to `AlbumsView` via `state.on('change', ...)`
- [ ] Verify that View Toggle (#74) no longer resets local UI state.

## Phase 3: Persistence & Documentation ✅

- [ ] Audit `AlbumRepository.save()` to ensure `bestEverAlbumId` is not dropped.
- [ ] Fix PENDING badge UI logic in `renderAlbumCard`.
- [ ] Implement non-blocking loading spinner (Issue #70).
- [ ] Document missing 4 Views in `data_flow_architecture.md`.
- [ ] Document missing 3 Services in `data_flow_architecture.md`.

## Phase 4: Final Verification 🧪

- [ ] Test Spotify Export with 50+ tracks.
- [ ] Verify mobile toggle responsiveness.
- [ ] Cross-browser verification (Chrome/Safari).
