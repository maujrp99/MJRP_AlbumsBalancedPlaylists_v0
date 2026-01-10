# Tasks - Sprint 19 Track A: Views Refactoring

**Feature**: Frontend View Modularization
**Outcome**: `SeriesView.js` < 200 LOC, `SavedPlaylistsView.js` < 200 LOC

## 1. SeriesView Componentization

### Analysis (Pre-existing)
- `SeriesView.js` is currently 504 LOC.
- Already delegates to: `SeriesHeader`, `SeriesToolbar`, `SeriesGridRenderer`, `SeriesEventHandler`, `SeriesModals`.
- Heavy methods: `refreshGrid` (47 LOC), `updateEmptyState` (23 LOC), `mount` (47 LOC).

### Tasks
- [ ] Extract `SeriesProgressBar.js` component <!-- id: 1 -->
- [ ] Extract `SeriesEmptyState.js` component <!-- id: 2 -->
- [ ] Refactor `SeriesView.mount()` to delegate to sub-components <!-- id: 3 -->
- [ ] Refactor `SeriesView.refreshGrid()` to reduce inline logic <!-- id: 4 -->
- [ ] Verify LOC < 200 <!-- id: 5 -->

---

## 2. SavedPlaylistsView Componentization

### Analysis (Pre-existing)
- `SavedPlaylistsView.js` is currently 482 LOC.
- Contains heavy inline rendering: `renderSeriesGroup` (47 LOC), `renderPlaylistBatch` (100 LOC), `renderPlaylistRow` (74 LOC).
- Uses `SafeDOM` throughout.

### Tasks
- [ ] Create `SavedPlaylistCard.js` from `renderPlaylistBatch` <!-- id: 6 -->
- [ ] Create `SavedPlaylistActions.js` for batch action buttons <!-- id: 7 -->
- [ ] Create `SavedPlaylistRow.js` from `renderPlaylistRow` <!-- id: 8 -->
- [ ] Update `SavedPlaylistsView.js` to use new components <!-- id: 9 -->
- [ ] Verify LOC < 200 <!-- id: 10 -->

---

## 3. Verification

- [ ] **Build**: `npm run build` passes <!-- id: 11 -->
- [ ] **Browser Regression**: `[SERIES]` checklist via Agent Browser <!-- id: 12 -->
- [ ] **Browser Regression**: `[HISTORY]` checklist via Agent Browser <!-- id: 13 -->
