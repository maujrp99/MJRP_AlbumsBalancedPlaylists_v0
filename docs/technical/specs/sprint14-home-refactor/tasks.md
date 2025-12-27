# Tasks: HomeView V3 Restoration & Polish
**Feature**: ARCH-11 Phase 2
**Status**: PENDING
**Plan**: `plan.md`

## Phase 1: Critical Functional Restoration
- [ ] **Fix Staging Interaction (Event Delegation)** <!-- id: 1 -->
    - [ ] Remove `onclick` inline handler from `DiscographyRenderer.js`.
    - [ ] Add `data-action="toggle-staging"` and `data-id` to the add button.
    - [ ] Implement `handleGridClick(e)` in `HomeController.js` to catch delegated events.
    - [ ] Verify clicking "+" correctly calling `stagingController.addAlbum`.
- [ ] **Implement Filter Logic** <!-- id: 2 -->
    - [ ] Update `HomeView.js` to render "Filter Pills" using `getIcon` in the Right Panel Toolbar.
    - [ ] Update `SearchController.js` to include `filterState` (Albums=True, Singles=False, Live=False).
    - [ ] Implement `applyFilters()` in `SearchController` to filter `this.results` cache.
    - [ ] Bind filter clicks to `toggleFilter()` method.

## Phase 2: UX Core Improvements
- [ ] **Loading Feedback** <!-- id: 3 -->
    - [ ] Add `setLoading(state)` to `HomeView.js` (Spinner replacement + Grid opacity).
    - [ ] Integrate `setLoading()` into `SearchController.searchArtist()`.
    - [ ] Verify Spinner appears during API calls.
- [ ] **Staging Stack UI** <!-- id: 4 -->
    - [ ] Add "Remove" (X) button to `StagingAreaRenderer` items.
    - [ ] Verify removing an item updates the count.

## Phase 3: Design Parity (Gap Closure)
- [ ] **Album Badges** <!-- id: 5 -->
    - [ ] Update `DiscographyRenderer.js` to detect "Deluxe", "Remaster", "Live" keywords.
    - [ ] Render small badges (e.g., `text-[10px] bg-yellow-500/20 text-yellow-500`) on the card.
- [ ] **Drag & Drop Reordering** <!-- id: 6 -->
    - [ ] Research/Integrate simple native Drag & Drop for `#stagingStackContainer`.
    - [ ] Create `handleDragStart`, `handleDrop` in `StagingAreaController`.
- [ ] **Bulk Mode Validation** <!-- id: 7 -->
    - [ ] Update `HomeView.js` bulk input styles for validation readiness.
    - [ ] (Optional) Add simple line-by-line regex check visual feedback.

## Verification Checklist
- [ ] **Search**: "Pink Floyd" -> 50+ Results.
- [ ] **Filters**: Changing filters updates grid immediately without network activity.
- [ ] **Staging**: Click "+" -> Adds to Stack. Click "X" -> Removes from Stack.
- [ ] **Badges**: "Dark Side 50th" shows "Deluxe" or "Remaster" badge.
- [ ] **Loading**: Search triggers visual feedback.
