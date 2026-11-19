# Frontend Components Analysis (Features)

## Home & Search (`home/`, `search/`)
**Status**: `[ACTIVE]`

-   **`home/SearchController.js`**:
    -   **Role**: Orchestrates the Artist Search flow.
    -   **Logic**: Calls `AlbumSearchService.getArtistDiscography` (the instance held by `HomeController`), sorts results by date, and handles filtering (Albums/EPs/Singles/Live/Compilations/Uncategorized). Maintains `filterState`. The search runs on Enter or on the scan button; there is no debounce.

    ```mermaid
    flowchart LR
        Input[Enter / Scan button] --> Service[AlbumSearchService]
        Service -->|Raw Results| Sort[Sort By Date Desc]
        Sort --> Filter{Apply Filters}
        Filter -->|EP/Single/Album| Final[Render Grid]
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
