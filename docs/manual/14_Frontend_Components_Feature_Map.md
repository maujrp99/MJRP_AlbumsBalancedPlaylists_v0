# Frontend Components Analysis (Features)

## Home & Search (`home/`, `search/`)
**Status**: `[ACTIVE]`

-   **`home/SearchController.js`**:
    -   **Role**: Owner of the Home scan's state (F67).
    -   **Logic**: Holds one state (`this.scan`, rules in `models/scanState.js`: idle, scanning, results, empty, failed) and changes it only through `_setScan`, which asks `HomeView.renderScan` to draw. Calls `AlbumSearchService.scanArtist` (the instance held by `HomeController`), sorts the albums by date and applies the type filters (Albums/EPs/Singles/Live/Compilations/Uncategorized, kept in `filterState`). The scan runs on Enter, on the Scan button or on "Try again"; there is no debounce, and while a scan runs another ask does nothing. Every answer carries the generation of its scan: a late answer of an older scan changes nothing. The handlers are delegated from `#app` and read `#artistScanInput` at the time of the event. No `alert()`: no results and failure are messages in the panel.

    ```mermaid
    flowchart LR
        Input[Enter / Scan / Try again] --> Start[startScan: scanning]
        Start --> Service[AlbumSearchService.scanArtist]
        Service -->|albums, first classification| Found[scanFound: results or empty]
        Service -->|deadline or failure| Failed[scanFailed: failed + Try again]
        Found -->|AI list arrives after| Again[scanReclassified]
        Found --> Draw[HomeView.renderScan + filters]
        Again --> Draw
        Failed --> Draw
    ```
-   **`home/StagingAreaController.js`**:
    -   **Role**: Manages the "Staging Stack" (drag-and-drop area).
    -   **Logic**: Uses `SortableJS` for reordering. Syncs state with the `StagingAreaRenderer`.
-   **`search/DiscographyToolbar.js`**:
    -   **Role**: UI for filtering search results.
    -   **Logic**: Toggles between types (Album, EP, Single, etc.) and Editions (Standard, Deluxe). Updates button styles dynamically.
    -   **Usage today**: no module imports it; the filter buttons of Home are handled by `home/SearchController.js`.
-   **`search/VariantPickerModal.js`**:
    -   **Role**: A specialized modal for resolving "Album Groups" (e.g., when search returns multiple versions of "Thriller").
    -   **Pattern**: Functional Component (exports `showVariantPickerModal` function) rather than a Class.
    -   **Usage today**: no module imports it.

## Blend Wizard (`blend/`)
**Status**: `[ACTIVE]`
**Overview**: These components form the 3-step "Blend" playlist generation wizard.

-   **`blend/BlendSeriesSelector.js` (Step 1)**:
    -   **Role**: Allows user to select an Entity type and a series. Only "Albums" is available; Artists, Genres and Tracks are listed but disabled.
    -   **Logic**: Loads series from `albumSeriesStore`, handles cache-based thumbnail preloading (`preloadAllThumbnails`, through `OptimizedAlbumLoader`), and renders a grid of series cards (`.blend-series-card`, markup inside this file).
-   **`blend/BlendRecipeCard.js` (Step 2)**:
    -   **Role**: Displays available generation algorithms ("Recipes").
    -   **Logic**: Renders cards with metadata (icons, colors, badges) derived from `getAllAlgorithms()`. Highlights "Recommended" algorithms.
-   **`blend/BlendIngredientsPanel.js` (Step 3)**:
    -   **Role**: Configuration panel for the selected algorithm.
    -   **Logic**: Dynamically shows/hides inputs (Duration, Output Mode, Ranking Source, Discovery Mode) based on the selected algorithm's capabilities (`ALGORITHM_RECIPES` mapping).

## Inventory (`inventory/`)
**Status**: `[ACTIVE]`

-   **`inventory/InventoryGrid.js`**:
    -   **Role**: A grid component for the User's Inventory.
    -   **Logic**: A wrapper around `SeriesGridRenderer`. Adds generic event delegation for Inventory actions (Click, Context Menu). Handles "Zero State" (Empty Inventory) display.
    -   **Usage today**: no module imports it. The inventory screen is `views/InventoryView.js` with `views/renderers/InventoryGridRenderer.js` and `controllers/InventoryController.js`.
    -   Deleting an album: `InventoryController.handleDelete` calls `inventoryStore.removeAlbum`; a failure shows "Failed to delete album". The repository also forgets the "already in inventory" answer kept for that album, so it can be added again at once.

## Playlists & History (`playlists/`)
**Status**: `[ACTIVE]`

-   **`playlists/SavedSeriesGroup.js`**:
    -   **Role**: Container for a Series within the History view.
    -   **Logic**: Renders the Series Header (with collapse toggle) and holds the `SavedPlaylistCard` grid.
-   **`playlists/PlaylistDetailsModal.js`**:
    -   **Role**: Read-only view of a specific generated playlist.
    -   **Logic**: Uses `BaseModal` and `TrackRow` to render the list of tracks.
-   **`playlists/SavedPlaylistCard.js`**:
    -   **Role**: Represents a "Batch" of playlists.
    -   **Logic**: Displays a cascade of album art (`AlbumCascade`) and, when expanded, one `SavedPlaylistRow` per playlist plus the batch actions (`SavedPlaylistActions`).
