# Sprint 21.5 Bug Fixing - Task List

## SDD Phase 3: Tasks

**Sprint**: 21.5 Bug Fixing  
**Status**: DRAFT - Awaiting Review  
**Date**: 2026-01-15

---

## Issue #154: Album Deletion Match Error

- [ ] **154.1** Fix `HomeController.js`: Change `album: value` to `title: album.title`
- [ ] **154.2** Fix `SeriesService.js`: Add fallback `query.title || query.album`
- [ ] **154.3** Verify: Delete album from series → No error message

---

## Issue #156 & #158: Cache Invalidation

- [ ] **156.1** Add `this.cache.clearAlbumSeries('ALL_SERIES_VIEW')` to `createSeries()`
- [ ] **156.2** Add cache clear to `updateSeries()`
- [ ] **156.3** Add cache clear to `removeAlbumFromSeries()`
- [ ] **158.1** Add `this.cache.invalidate('ALL_SERIES_VIEW')` to `deleteSeries()`
- [ ] **156.4** Verify: Create series → Appears without refresh
- [ ] **158.2** Verify: Delete series → Other series intact

---

## Issue #155: Series Deletion Freeze

- [ ] **155.1** Fix `SeriesModalsManager.js`: Force navigation after delete
- [ ] **155.2** Verify: Delete series → App remains responsive

---

## Issue #153: Series Edit Double Toast

- [ ] **153.1** Add null check in `SeriesModalsManager.handleSeriesUpdated()`
- [ ] **153.2** Add defensive check in `SeriesViewUpdater.updateHeaderPayload()`
- [ ] **153.3** Verify: Edit series → Single success toast

---

## Issue #152: Ghost Skeletons

- [ ] **152.1** Modify `SeriesController.js`: Add `isLoading` to notifyView
- [ ] **152.2** Modify `SeriesView.js`: Pass `isLoading` to updater
- [ ] **152.3** Modify `SeriesViewUpdater.js`: Pass `isLoading` to grid
- [ ] **152.4** Modify `SeriesGridRenderer._renderVirtualScopedGrid()`:
  - [ ] If `empty && isLoading` → Render skeleton
  - [ ] If `empty && !isLoading` → Skip (filtered)
- [ ] **152.5** Verify: Load All Series → Skeletons appear
- [ ] **152.6** Verify: Apply filter → Empty series hidden

---

## Issue #152B: Progress Bar Cleanup

- [ ] **152B.1** DELETE `SeriesProgressBar.js`
- [ ] **152B.2** Remove progress bar from `SeriesView.js`
- [ ] **152B.3** Remove `inlineProgress` from `SeriesViewUpdater.js`
- [ ] **152B.4** Remove progress bar from `SeriesComponentFactory.js`
- [ ] **152B.5** Remove `notifyView('progress', ...)` from `SeriesController.js`
- [ ] **152B.6** Update `docs/manual/09_Frontend_Views.md`
- [ ] **152B.7** Update `docs/manual/00_Dir_File_Structure_Map.md`
- [ ] **152B.8** Verify: No progress bar in Series views

---

## Final Verification

- [ ] **V.1** Run `npm run test` - All tests pass
- [ ] **V.2** Run `npm run build` - Build succeeds
- [ ] **V.3** Browser test: Full regression on Series view
- [ ] **V.4** Update `DEBUG_LOG.md` with resolutions

---

## Approval

- [ ] User Review
- [ ] Approved to proceed to EXECUTION phase

---

**Gate**: Cannot start implementation until this task list is APPROVED.
