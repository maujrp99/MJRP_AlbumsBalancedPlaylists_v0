# Sprint 16 Task List: Cleanup & Critical Integrity

**Goal**: Eradicate legacy patterns (`Modals.js`) and consolidate components.
**Last Updated**: 2025-12-31
**Spec**: [spec.md](./spec.md)

## ~~Phase 1: Critical Integrity Recovery~~ ✅ RESOLVED IN SPRINT 15
> Moved to Sprint 15 Phase 6. See [phase6-hotfix-plan.md](../sprint15-arch12/phase6-hotfix-plan.md)

- [x] **Fix Export Logic**: Lazy authorize + browser locale storefront implemented.
- [x] **Fix Series Management**: Artist scan + filters in Edit modal (same as Home).

## Phase 2: Operation Modal-Swap (The "Modals.js" Killer)
*Goal: Replace ad-hoc `innerHTML` modals with proper components and Service.*

- [x] **Create Safe Modals**:
    - [x] `src/components/ui/modals/ConfirmModal.js`
    - [x] `src/components/ui/modals/InputModal.js`
- [x] **Create `DialogService.js`**:
    - [x] Implement `confirm()` and `prompt()` using new modals.
- [x] **Refactor Consumers**:
    - [x] `SeriesView.js` -> Use `DialogService`
    - [x] `PlaylistsView.js` -> Use `DialogService`
    - [x] `SavedPlaylistsView.js` -> Use `DialogService` (move logic to Controller).
- [x] **Delete Legacy**:
    - [x] Delete `public/js/components/Modals.js` 🗑️

## Phase 3: Component Consolidation
*Goal: Reduce maintenance by removing redundant components.*

- [x] **Deprecate Legacy Cards**:
    - [x] Refactor `BatchGroupCard` usages to use `Card`/`TrackRow`.
    - [x] Delete `PlaylistCard.js` (if exists/unused).
    - [x] Delete `BatchGroupCard.js`.
- [x] **Standardize**: Ensures all lists use `TrackRow` for items and `Card` for entities.

## Phase 4: Final Security Sweep
*Goal: Reach < 25 innerHTML sinks.*

- [ ] **Audit Sinks**:
    - [x] Run `grep -r "innerHTML" public/js/` (Initial count > 40)
    - [x] Refactor `SeriesView.js` (Shell + Router support)
    - [x] Refactor `SavedPlaylistsView.js`
    - [x] Refactor `EditAlbumModal.js` & `BaseModal.js`
    - [x] Delete `ConfirmationModal.js` (Legacy)
    - [x] Refactor `PlaylistsView.js` & Renderers (`StagingAreaRenderer`, `DiscographyRenderer`)
    - [x] Refactor `HomeView.js`
    - [x] Refactor `RankingView.js` & `InventoryView.js`
    - [x] Refactor `BlendingMenuView.js`, `ConsolidatedRankingView.js`, `SaveAllView.js`
    - [x] Refactor remaining low-hanging fruit.

## Phase 5: Batch Naming Consistency (New)
*Goal: Fix UX issues with Playlist Naming (Ghost playlists, empty inputs).*

- [x] **Refactor `PlaylistsStore.js`**:
    - [x] Implement `defaultBatchName` state.
    - [x] Add `editContext` to track `originalBatchName`.
    - [x] Update `saveToLocalStorage` to persist these fields (fix Refresh bug).
- [x] **Refactor `BlendingController.js`**:
    - [x] Create `_generateDefaultBatchName` helper (Format: "TheAlbumBlender Playlist...").
    - [x] Call this helper in `generateFromSeries` (Wizard) and `regenerate`.
- [x] **Refactor `PlaylistsController.js`**:
    - [x] Update `handleSave` to use `editContext.originalBatchName` for overwrite target.
    - [x] Remove redundant default name logic (delegate to BlendingController).
- [x] **Refactor Export Logic**:
    - [x] Update `PlaylistsGridRenderer` / Export Utils to fallback to `defaultBatchName`.

## Bug Fixes & Regressions
- [x] Fix Edit Mode Batch Name Revert (#102)
- [x] Fix Series View Album Deletion (#103) - *Verified: Fixed via Context-Aware Loading*
