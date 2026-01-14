# Tasks: Sprint 21 - Mobile UX & Layout Refresh

## Phase 1: Core Layout (Home View)
- [ ] **HomeView.css Update**: Add `@media (max-width: 768px)` block to `public/css/views/home.css`. <!-- id: 1.1 -->
- [ ] **Responsive Flex Order**: Inside the media query, target the `.tech-panel` (Scan) and `.staging-area` containers. <!-- id: 1.2 -->
    - *Action*: Set `order: -1` to the Scan container.
    - *Verification*: `npm run dev` -> Resize window < 768px -> Verify "Discography Scan" appears above "Staging Area".

## Phase 2: Series View Performance (Lazy Loading Architecture)
### 2.1. Utilities (VirtualScrollObserver)
- [ ] **Create Utility File**: Create empty file `public/js/utils/VirtualScrollObserver.js`. <!-- id: 2.1.a -->
- [ ] **Implement Constructor**: Add `constructor(options)` handling `rootMargin` and `threshold`. <!-- id: 2.1.b -->
- [ ] **Implement `observe`**: Add `observe(element, callback)` method to wrap `IntersectionObserver`. <!-- id: 2.1.c -->
- [ ] **Implement `disconnect`**: Add cleanup method to stop observing. <!-- id: 2.1.d -->
    - *Verification*: Create a temporary HTML test file, import the class, log "Visible!" when a div enters viewport.

### 2.2. Skeleton Components
- [ ] **Create SeriesSkeleton.js**: Create `public/js/components/ui/skeletons/SeriesSkeleton.js`. <!-- id: 2.2.a -->
- [ ] **Implement `render()`**: Return HTML string with pulsing gray blocks matching `SeriesHeader` layout. <!-- id: 2.2.b -->
- [ ] **Create AlbumSkeleton.js**: Create `public/js/components/ui/skeletons/AlbumSkeleton.js`. <!-- id: 2.2.c -->
    - *Specs*: Matches `AlbumCard` dimensions (aspect-square + text lines).
- [ ] **Add CSS Animation**: Ensure `public/css/animations.css` has `@keyframes pulse` class. <!-- id: 2.2.d -->
    - *Verification*: Render `SeriesSkeleton.render()` in console and verify visual style (Incandescent Blue pulse).

### 2.3. Renderer Refactoring (Virtualization)
- [ ] **Import Dependencies**: Import `VirtualScrollObserver` and `SeriesSkeleton` in `SeriesGridRenderer.js`. <!-- id: 2.3.a -->
- [ ] **Update Constructor**: Initialize `this.observer = new VirtualScrollObserver()` in `SeriesGridRenderer`. <!-- id: 2.3.b -->
- [ ] **Implement `renderSkeletonGroups`**: Add method that loops `count` times and appends `SeriesSkeleton.render()`. <!-- id: 2.3.c -->
- [ ] **Add Sentinel Logic**: In the render loop, attach `data-series-index` to the container div. <!-- id: 2.3.d -->
- [ ] **Implement Observer Callback**: In `render()`, attach the observer to the "Series 3" container (the trigger point). <!-- id: 2.3.e -->
    - *Verification*: Check "Network" tab to ensure images for Series 4+ are NOT requested on initial load.

### 2.4. Load More Logic (Level 2)
- [ ] **Create LoadMoreButton.js**: Implement `public/js/components/ui/LoadMoreButton.js` (Class extending Component). <!-- id: 2.4.a -->
- [ ] **Modify `AlbumsScopedRenderer.js`**: Update `renderScopedGrid` function. <!-- id: 2.4.b -->
- [ ] **Apply Cap Logic**: Add check `if (albums.length > 12)`. Slice array to `0..12`. <!-- id: 2.4.c -->
- [ ] **Render Button**: Append `LoadMoreButton` HTML if cap is hit. <!-- id: 2.4.d -->
- [ ] **Bind Click Event**: Add event listener to un-hide the remaining albums (using `hidden` class toggle or re-render). <!-- id: 2.4.e -->
    - *Verification*: Find a large series (e.g., Beatles) -> Verify only 12 albums show -> Click "Load More" -> Verify rest appear.

## Phase 3: Mobile Interactions
### 3.1. Responsive Tracks Table
- [ ] **Create Mobile Template**: Internal method `_renderMobileRow(track)` in `TracksTable.js`. <!-- id: 3.1.a -->
- [ ] **Update Main Render**: In `render()`, check standard responsive logic (or render BOTH and hide via CSS). <!-- id: 3.1.b -->
    - *Decision*: Render both structures and use `md:hidden` / `md:block` classes for purely CSS-based switching (Performance).
- [ ] **Apply Tailwind Classes**: Add `grid grid-cols-[auto_1fr] gap-2` to the mobile container. <!-- id: 3.1.c -->
    - *Verification*: Mobile viewport -> Verify no horizontal scrollbar on track list.

### 3.2. Fullscreen Modal
- [ ] **Update CSS**: Add `.fullscreen-modal` rules to `public/css/components/modals.css`. <!-- id: 3.2.a -->
    - *Specs*: `position: fixed`, `top: 0`, `left: 0`, `width: 100vw`, `height: 100vh`.
- [ ] **Detect Mobile**: Add getter `isMobile` to `UserRankModal.js` (checks `window.innerWidth`). <!-- id: 3.2.b -->
- [ ] **Apply Class**: conditionally add `fullscreen-modal` to the dialog container in `render()`. <!-- id: 3.2.c -->
    - *Verification*: Open "Rank It" on mobile -> Ensure it covers full screen -> Verify drag-and-drop works with thumb.

## Phase 4: Final Verification
- [ ] **Regression Check**: Run full `npm run test` suite to ensure no breakage in `SeriesController`. <!-- id: 4.1 -->
- [ ] **Browser Testing**: Verify behavior on Safari (iOS Simulator) if possible, or Chrome Device Mode. <!-- id: 4.2 -->
