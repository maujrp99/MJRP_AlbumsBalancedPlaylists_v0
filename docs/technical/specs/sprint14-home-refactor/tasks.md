# Tasks: HomeView V3 Restoration & Polish
**Feature**: ARCH-11 Phase 2
**Status**: PENDING
**Plan**: `plan.md`

## Phase 1: Critical Functional Restoration
- [x] **Fix Staging Interaction (Event Delegation)** <!-- id: 1 -->
    - [x] Remove `onclick` inline handler from `DiscographyRenderer.js`.
    - [x] Add `data-action="toggle-staging"` and `data-id` to the add button.
    - [x] Implement `handleGridClick(e)` in `HomeController.js` to catch delegated events.
    - [x] Verify clicking "+" correctly calling `stagingController.addAlbum`.
- [x] **Implement Filter Logic** <!-- id: 2 -->
    - [x] Update `HomeView.js` to render "Filter Pills" using `getIcon` in the Right Panel Toolbar.
    - [x] Update `SearchController.js` to include `filterState` (Albums=True, Singles=False, Live=False).
    - [x] Implement `applyFilters()` in `SearchController` to filter `this.results` cache.
    - [x] Bind filter clicks to `toggleFilter()` method.

## Phase 2: UX Core Improvements
- [x] **Loading Feedback** <!-- id: 3 -->
    - [x] Add `setLoading(state)` to `HomeView.js` (Spinner replacement + Grid opacity).
    - [x] Integrate `setLoading()` into `SearchController.searchArtist()`.
    - [x] Verify Spinner appears during API calls.
- [x] **Staging Stack UI** <!-- id: 4 -->
    - [x] Add "Remove" (X) button to `StagingAreaRenderer` items.
    - [x] Verify removing an item updates the count.

## Phase 3: Design Parity (Gap Closure)
- [x] **Album Badges** <!-- id: 5 -->
    - [x] Update `DiscographyRenderer.js` to detect "Deluxe", "Remaster", "Live" keywords.
    - [x] Render small badges (e.g., `text-[10px] bg-yellow-500/20 text-yellow-500`) on the card.
- [x] **Drag & Drop Reordering** <!-- id: 6 -->
    - [x] Research/Integrate simple native Drag & Drop for `#stagingStackContainer`.
    - [x] Create `handleDragStart`, `handleDrop` in `StagingAreaController`.
- [x] **Bulk Mode Validation** <!-- id: 7 -->
    - [x] Update `HomeView.js` bulk input styles for validation readiness.
    - [x] (Optional) Add simple line-by-line regex check visual feedback.

## Verification Checklist
- [ ] **Search**: "Pink Floyd" -> 50+ Results.
- [ ] **Filters**: Changing filters updates grid immediately without network activity.
- [ ] **Staging**: Click "+" -> Adds to Stack. Click "X" -> Removes from Stack.
- [ ] **Badges**: "Dark Side 50th" shows "Deluxe" or "Remaster" badge.
- [ ] **Loading**: Search triggers visual feedback.
