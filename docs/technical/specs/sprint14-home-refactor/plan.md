# Plan: HomeView V3 Restoration & UX Polish

**Feature**: HomeView V3 Refactor (ARCH-11) - Phase 2: Functional Parity & UX
**Status**: DRAFT
**Related Spec**: `arch-11-home-v3-spec.md`

## 1. Goal
Restore core functionalities (Filters, Staging) lost during the V3 refactor and improve the UX for Search and Staging interactions. The goal is parity with the previous version but with the new V3 architecture and "Nano/Flame" aesthetic.

## 2. Architecture & Logic Flows

### 2.1 Search & Filter Pipeline
We will implement a "Pipeline" approach in `SearchController` to handle filtering without re-fetching data.

```mermaid
graph TD
    User[User Input] -->|Type + Enter| Search[SearchController.searchArtist()]
    Search -->|API Call| API[AlbumSearchService]
    API -->|Raw Results| Cache[this.results Cache]
    
    FilterUI[Filter Toggles] -->|Click| Apply[applyFilters()]
    Cache --> Apply
    
    Apply -->|Filter: Album/Single/Live| Filtered[Filtered List]
    Filtered -->|Sort: Newest| Sorted[Sorted List]
    Sorted -->|Render| Renderer[DiscographyRenderer]
```

### 2.2 Staging Interaction (Event Delegation)
To fix the fragile `onclick="window.controller..."` pattern, we will use Event Delegation on the Grid Container.

```mermaid
graph TD
    User -->|Click Add Button| Grid[#discographyGrid]
    Grid -->|Event Bubble| HomeView[HomeView Delegate]
    HomeView -->|Handle| HomeController.handleGridClick()
    
    HomeController -->|Get Album ID| Dataset[data-id]
    HomeController -->|Lookup| Cache[SearchController.results]
    
    HomeController -->|Add/Remove| StagingCtrl[StagingAreaController]
    StagingCtrl -->|Update State| State[selectedAlbums]
    StagingCtrl -->|Render| StagingRenderer
```

## 3. UI/UX Strategy & Mockups

### 3.1 Left Panel: Filter Controls & Staging
We will add a "Smart Filter" section below the Search Input in the Left Panel (or Top Toolbar depending on space). *Decision: Place in Top Toolbar of Right Panel for better context.*

**Right Panel Top Toolbar:**
```
[ Breadcrumbs ]                                      [ Filters ]
Home > Pink Floyd                    [x] Albums  [ ] Singles  [ ] Live
                                     (Pill Buttons: Active=Orange, Inactive=Gray)
```

**Loading State (UX):**
- **Search Button**: Replaced by `<div class="spinner"></div>` during `isScanning`.
- **Grid Overlay**: A subtle `bg-black/50` overlay on the grid while fetching.

### 3.2 Staging Stack
- **Visual**: Vertical list in the Left Panel.
- **Interaction**:
    - **Add**: Button turns Green checkmark or partial opacity.
    - **Remove**: "X" button on the Staging Item.

## 4. Implementation Steps

### Step 1: Fix Staging Interaction (Critical)
- **Refactor `DiscographyRenderer`**:
    - Remove `onclick` attribute.
    - Add `data-action="toggle-staging"` and `data-id="${album.id}"`.
    - Update visual state based on whether album is already in Staging.
- **Update `HomeController`**:
    - Add delegate listener for `click` on `#discographyGrid`.
    - Implement `handleGridClick` to orchestrate `StagingAreaController`.

### Step 2: Implement Filters
- **Update `HomeView.js`**:
    - Add HTML for Filter Pills (Albums, Singles, EPs, Live) in the Right Panel Toolbar.
- **Update `SearchController.js`**:
    - Add `filterState = { albums: true, singles: false, ... }`.
    - Add `applyFilters()` logic.
    - Bind Filter Buttons to `toggleFilter()`.

### Step 3: UX Polish (Loading & Feedback)
- **Update `HomeView.js`**:
    - Add `setLoading(bool)` method to toggle UI states.
- **Update `SearchController.js`**:
    - Call `setLoading(true)` before search, `false` after.

### Step 4: Closing the Design Gaps (Parity & Polish)
- **Buttons & Badges**:
    - Add "Deluxe", "Remaster", "Live" badges to Album Cards (`DiscographyRenderer`).
- **Drag & Drop**:
    - Implement basic Drag & Drop for Staging Area reordering (`SortableJS` or native).
- **Bulk Mode**:
    - Add basic validation visual feedback (Green/Red border on valid lines).

## 5. Validation
- **Manual Test**: Search "Pink Floyd", toggle "Live", verify Live albums appear/disappear.
- **Manual Test**: Add 5 albums to staging, verify count.
- **Manual Test**: Verify Loading Spinner appears during search.
- **Manual Test**: Verify Badges on specific albums (e.g. "Dark Side of the Moon 50th").
