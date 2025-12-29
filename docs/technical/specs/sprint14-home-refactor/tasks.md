# Tasks: HomeView V3 Restoration & Polish
**Feature**: ARCH-11 Phase 2
**Status**: ✅ COMPLETED
**Last Updated**: 2025-12-28
**Plan**: `plan.md`

## Phase 1: Critical Functional Restoration ✅
- [x] **Fix Staging Interaction (Event Delegation)**
    - [x] Remove `onclick` inline handler from `DiscographyRenderer.js`.
    - [x] Add `data-action="toggle-staging"` and `data-id` to the card (entire card clickable).
    - [x] Implement `handleGridClick(e)` in `HomeController.js` with direct event registration.
    - [x] Verify clicking album adds to staging correctly.
- [x] **Implement Filter Logic**
    - [x] Update `HomeView.js` to render "Filter Pills" in Right Panel Toolbar.
    - [x] Update `SearchController.js` filterState: `{ albums, singles, live, compilations }`.
    - [x] Implement `applyFilters()` with fallback type detection (title keywords).
    - [x] Bind filter clicks to `toggleFilter()` method.

## Phase 2: UX Core Improvements ✅
- [x] **Loading Feedback**
    - [x] Add `setLoading(state)` to `HomeView.js`.
    - [x] Integrate into `SearchController.searchArtist()`.
- [x] **Staging Stack UI**
    - [x] Add always-visible "Remove" (X) button to `StagingAreaRenderer` items.
    - [x] Use `getIcon('X')` for reliable rendering.
    - [x] Larger touch target for mobile (p-2, w-5 h-5).

## Phase 3: Design Parity (Gap Closure) ✅
- [x] **Album Badges**
    - [x] Detect "Deluxe", "Remaster", "Live", "Single", "Compilation" keywords.
    - [x] Render badges on album cards.
- [x] **Drag & Drop Reordering**
    - [x] Integrated SortableJS for `#stagingStackContainer`.
- [x] **Bulk Mode Validation**
    - [x] Visual feedback (green/orange border) on bulk input.

## Phase 4: UX Polish (Added mid-sprint) ✅
- [x] **Label Restoration**
    - [x] "01 // Series Configuration" with sublabel "Your Albums Series Name"
    - [x] "02a // Artist Filter" (replaced "INPUT METHOD")
    - [x] "03 // Selected Albums" (replaced "STAGING STACK")
- [x] **Visible Scan Button**
    - [x] Prominent orange "Scan" button next to search input.
- [x] **Mobile Responsiveness**
    - [x] Fixed vertical stacking of panels.
    - [x] Horizontal scroll filters with `scrollbar-hide`.
    - [x] Breadcrumbs hidden on small screens.
- [x] **Initialize Load Sequence**
    - [x] Full implementation with `albumSeriesStore.createSeries()`.
    - [x] Navigation to `/albums/:seriesId` after creation.
    - [x] Toast feedback for success/error.

## Phase 5: Bug Fixes (Cross-module) ✅
- [x] **AlbumSearchService Data Mapping**
    - [x] Fixed `_processDiscography()` to expose `isSingle`, `isCompilation`, `isLive`, `releaseDate`.
- [x] **AlbumsScopedRenderer Compatibility**
    - [x] Fixed `q.toLowerCase` error by handling object-format albumQueries.

## Verification Checklist ✅
- [x] **Search**: "Led Zeppelin" → Results appear.
- [x] **Filters**: Toggles update grid immediately (client-side).
- [x] **Staging**: Click album → Adds to Stack. Click "X" → Removes.
- [x] **Badges**: Albums show "Deluxe", "Remaster", "Live" badges.
- [x] **Loading**: Search shows loading state.
- [x] **Initialize Load**: Creates series and navigates to albums view.
- [x] **Mobile**: Panels stack, filters scroll horizontally.
