# Frontend Views Analysis

> **Deep Dive Enrichment**: This document details the View Layer architecture, specifically the MVC patterns, Renderers, and Helper strategies used to build the UI.

## 1. Core Architecture
**Status**: `[ACTIVE]`

*   **`BaseView.js`**:
    *   **Role**: Abstract Base Class.
    *   **Key Behavior**:
        *   `mount()`: Called after DOM insertion.
        *   `destroy()`: Called before removal. Auto-cleans up event listeners registered via `this.on()`.
        *   `$delegate`: Utility for efficient event delegation (e.g., clicking items in a large grid).

---

## 2. Main Views (Deep Dive)

### 2.1 Inventory System: `views/InventoryView.js`
**Status**: `[ACTIVE]`
**Pattern**: MVC (View + Controller + Store)
**Dependencies**: `InventoryController`, `inventoryStore`, `InventoryGridRenderer`

*   **Purpose**: Manages the user's collection, providing filtering, searching, and CRUD status updates.

*   **Logic Trace**:
    1.  **Mounting**:
        *   Subscribes to `inventoryStore` updates -> triggers `render(state)`.
        *   Calls `controller.initialize()` to fetch initial data.
    2.  **Rendering (`render`)**:
        *   Calculates Header Stats (Total Value in USD/BRL, Owned Count).
        *   Renders Filters (Search, Format, Ownership).
        *   Delegates Grid rendering to `InventoryGridRenderer` (Pure HTML String generation for performance).
    3.  **Event Handling**:
        *   Uses **Event Delegation** on `#inventory-grid-container`.
        *   Intercepts clicks on `.view-album-btn`, `.edit-album-btn`, `.delete-album-btn`.
        *   Routes logic to `controller.handleDelete`, `controller.handleUpdate`, etc.

*   **Architecture Diagram**:
```mermaid
flowchart Trip
    Store[InventoryStore] -- Notify --> View[InventoryView]
    View -- Render --> DOM
    DOM -- Click Event --> View
    View -- Delegate --> Controller[InventoryController]
    Controller -- CRUD --> API
    API -- Success --> Store
```

### 2.2 Playlist Generator: `views/PlaylistsView.js`
**Status**: `[ACTIVE]`
**Pattern**: Complex Interactive/Stateful View
**Dependencies**: `PlaylistsController`, `playlistsStore`, `PlaylistsGridRenderer`

*   **Purpose**: The "Workbench" for creating, viewing, and editing playlists. Handles both "New Batch" and "Edit Batch" modes.

*   **Logic Trace**:
    1.  **Initialization**:
        *   Checks `playlistsStore.isEditingExistingBatch()` to determine mode.
        *   `Mount`: Sets up `PlaylistsDragHandler` for drag-and-drop song reordering.
    2.  **Generation Flow**:
        *   User selects `Algorithm` (e.g., Balanced Cascade) and `RankingStrategy`.
        *   Click `Generate` -> `controller.handleGenerate()`.
        *   **Overlay**: Shows "Generating..." spinner during async work.
    3.  **Edit Mode**:
        *   If editing, header shows "Edit Playlist Batch" and locks series selection.
        *   "Regenerate Panel" allows tweaking settings for the *current* batch without losing context.
    4.  **Export**:
        *   Provides integrations for Spotify (OAuth), JSON, and Apple Music.

*   **Visual Logic**:
```mermaid
sequenceDiagram
    participant User
    participant View
    participant Controller
    participant Algo as CurationEngine

    User->>View: Click Generate
    View->>Controller: handleGenerate(config)
    Controller->>View: showSpinner()
    Controller->>Algo: curateAlbums(albums)
    Algo-->>Controller: Playlists[]
    Controller->>Store: setPlaylists()
    Store-->>View: update()
    View->>DOM: Render Grid & Graphs
```

### 2.3 Series Browser: `views/SeriesView.js` (V3)
**Status**: `[ACTIVE]`
**Pattern**: "Thin View" / Orchestrator
**LOC**: ~350 (Refactored Sprint 19)

*   **purpose**: Browse albums grouped by Series.
*   **Refactor Note**: This view delegates logic to specialized components and helpers to maintain a thin orchestrator role.
*   **Sub-Components**:
    *   `SeriesHeader`: Page title and "Blend Your Albums" action button.
        *   **Responsive**: Uses `flex-col md:flex-row` to stack on mobile.
        *   **Blend Button**: Direct link to `/blend`. Checks for album count on click (Toast feedback), no longer strictly disabled.
    *   `FilterToolbar` [NEW]: Generic, state-driven toolbar handling Filters (Artist, Year, Source), Search, and Sort.
        *   **Filters read the series, not what is loaded** (v4.0): series, artist, year, source and search run over the album queries of every series (`models/seriesFilter.js`), so they answer the same on any page. The artist list comes from the series too.
        *   **The search field is drawn once** (v4.0): the other controls are redrawn only when what they show changes. Before, the whole toolbar was redrawn on each key and the field lost the cursor.
        *   **'My Ranking' reads every series** (v4.0): the list of ranked albums is read once and matched to the album queries by name; before, the filter only saw loaded albums.
        *   **Reusability**: Replaces the legacy `SeriesToolbar`, now shared with `SavedPlaylistsView`.
        *   **Sorting**: Supports "**Name (A-Z)**", "**Name (Z-A)**", "**# of Albums (↑)**", "**# of Albums (↓)**", "**Newest**", and "**Oldest**". Sorting logic is handled by `SeriesController.js`.
        *   **Labels**: Uses standardized labels like "**All Albums Series**" and "**All Playlist Series**" for consistency across views (Sprint 22).
    *   ~~`SeriesToolbar`~~: Removed (Sprint 22) - Replaced by `FilterToolbar`.
    *   ~~`SeriesProgressBar`~~: Removed (Sprint 21.5) - Skeletons provide visual feedback.
    *   `SeriesEmptyState`: Renders when the account has no series.
    *   `SeriesGridRenderer`: Responsible for the main content layout (Grid/List). It draws each series by its load state: a grey block while it is loading, the albums when they are found, and the notice "N albums did not load · Try again" when some failed. A series whose albums all failed stays on screen with the notice. In the grid of all the series it draws the first 12 albums of each series and the button "Load N more albums" (`ui/LoadMoreButton.js`); a series listed in `props.expandedSeriesIds` is drawn whole, with no button. The list layout and a single series have no cut.
    *   **Series opened whole** (v5.0, F49): the click on "Load N more albums" reaches `SeriesEventHandler` (`load-more-series`), which tells the view (`showAllAlbums`). The view keeps the choice in one `SeriesExpansion` (`models/seriesExpansion.js`), created with the view, and hands its list to the grid on every redraw; nothing is loaded again, since the load already asks for every album of the series on screen. The choice outlives redraws, pages and filters, is emptied when the scope changes, and goes away with the view.
    *   `Pager` (v4.0): how many series are shown out of how many, the series per page (10 to 100), and the two ways to move on: numbered pages, or a list that grows at its end. With a source filter on, it also says how many albums were never checked against the sources ("N albums have not been checked against the sources yet…"); with one series on screen it shows only that notice.
    *   **Ranking an album**: the card opens `UserRankModal`; the modal reports the save to the view (`onSaveRanking`), the controller saves and asks the load to read that album's ranking again. The view never touches the ranking repository, and the album on screen is replaced, not changed.
*   **Leaving the screen**: `destroy()` tells the controller to let go of the view (`detachView`). The album load goes on in `AlbumLoadService`; coming back shows the progress made.
*   **Helpers**:
    *   `SeriesViewUpdater` [NEW]: Handles DOM updates (Header, Grid, Toolbar) based on Controller state.
    *   `SeriesComponentFactory` [NEW]: Abstract Factory for instantiating Header, Toolbar, and Grid components with correct props.
    *   `SeriesModalsManager` [NEW]: Encapsulates logic for opening Edit/Delete modals and handling "Soft Reloads".

### 2.4 Playlists History: `views/SavedPlaylistsView.js`
**Status**: `[ACTIVE]`
**Pattern**: Component-Driven View
**LOC**: ~325 (Refactored Sprint 19; the read moved out in v5.0, F61)

*   **Purpose**: Display saved playlists grouped by Series and Batches.
*   **Drawn once** (v4.0): `update()` draws the page the first time; after that it only updates the toolbar (`toolbar.update(toolbarProps())`) and brings the list up to date (`refreshContent`). Before, the whole page was rebuilt on every key and on every cover that arrived, which replaced the search field and took the cursor away (UAT-179).
*   **Waits for no read** (v5.0, F61): `mount()` subscribes to `SavedPlaylistsStore` (through the controller) and asks for the list; it does not wait. Each change of the store calls `update()`, and `refreshContent` keeps the node of every series group that did not change (`syncGroups`, `groupNodeOf`), so a group on screen does not move or close while the others arrive. A line above the list says what is being read; a failed series and a failed list each have a notice with "Try again". `destroy()` stops listening, so a late change draws nothing.
*   **Key Behavior**:
    1.  **Iterative Rendering**: Delegates rendering of complex data structures (Series -> Batches -> Playlists) to components.
    2.  **Lazy Drawing** (v5.0, F61): the playlists of a batch and the tracks of a playlist are built the first time the person opens them, not when the list is drawn.
*   **Sub-Components**:
    *   `SavedSeriesGroup` [NEW]: Standalone component for rendering a Series header and its batch container.
    *   `PlaylistDetailsModal` [NEW]: Reusable modal logic for viewing playlist track details.
    *   `SavedPlaylistCard`: Renders a full batch with cascade thumbnails and batch-level actions.
    *   `SavedPlaylistRow`: Renders individual playlists with track lists.
    *   `SavedPlaylistActions`: Centralizes action buttons for series, batches, and rows.


---

## 3. Strategies & Renderers

### Blending Wizard State Machine
```mermaid
stateDiagram-v2
    [*] --> SELECTION: User Enters
    
    state SELECTION {
        [*] --> SERIES: Select Entity
        SERIES --> VALIDATING: Check Cache
        VALIDATING --> READY: Thumbnails Loaded
    }
    
    SELECTION --> RECIPE: Next Step
    
    state RECIPE {
        [*] --> BROWSING
        BROWSING --> SELECTED: Algorithm Picked
    }
    
    RECIPE --> INGREDIENTS: Next Step
    
    state INGREDIENTS {
        [*] --> CONFIGURING
        CONFIGURING --> GENERATING: Click "Blend It!"
    }
    
    GENERATING --> [*]: Redirect to Playlists
```

### 3.1 `strategies/ViewModeStrategy.js`

> **F65 (2026-11-19):** `ViewModeStrategy.js` was removed from the repository (nothing reached it from an entry point, or its screen was retired). Where this section describes the code of that file, it describes history; the code is in the git history.
**Purpose**: Toggles between specific rendering layouts (Compact Card vs Expanded Row) based on user preference, persisting to LocalStorage.

### 3.2 `views/renderers/InventoryGridRenderer.js`
**Purpose**: Pure function that takes `state` and returns HTML strings.
**Why**: Performance. Generating thousands of DOM nodes individually is slower than `innerHTML` for large grids.
**Features**:
*   `formatPrice(value, currency)`: Handles currency conversion display.
*   `renderCard(album)`: Generates the main card HTML with Status badges.
