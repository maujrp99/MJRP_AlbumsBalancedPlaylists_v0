# Frontend Components Analysis (Features)

## Home & Search (`home/`, `album-picker/`)
**Status**: `[ACTIVE]`

-   **`album-picker/AlbumPickerController.js`** (F57; it took the place of `home/SearchController.js` and of `series/ArtistScanner.js`):
    -   **Role**: The one album picker - "search an artist, see the albums by type, pick some" - of the Home and of the series edit modal. Owner of the scan's state (F67) and of the type filters.
    -   **Logic**: Holds one scan state (`this.scan`, rules in `models/scanState.js`: idle, scanning, results, empty, failed) and one filter state (`this.filters`, rules in `models/albumPicker.js`), and draws every change through the view port it was given: `drawScan(scan)`, `drawFilters(filters, counts)`, `drawAlbums(albums)`. `searchArtist(query)` calls `albumSearchService.scanArtist` (one instance for the whole app, so the paid AI list of an artist is asked once) and sorts the albums newest first; `retry()` scans the same text; `toggleFilter(key)`; `pick(albumId)` hands the album to `onPick`. While a scan runs another ask does nothing; every answer carries the generation of its scan, so a late answer changes nothing; after `dispose()` nothing is drawn. No `alert()`.
    -   **The seam**: the two screens differ only in `onPick`. Home: `stagingController.addAlbum` (the album goes to the stack of the new series). Series edit: `SeriesEditModal.addAlbum` (the album joins the list of the series being edited).
    -   **Frames**: the Home (`controllers/HomeController.js` wires the delegated handlers of `#artistScanInput`, `#btnScanArtist`, `#btnScanRetry` and `#home-toolbar [data-filter]`; `views/HomeView.js` `renderScan` and `renderFilters` draw) and `album-picker/AlbumPickerPanel.js` (the picker as one block inside the edit modal: field, Scan button, status line, filter buttons, cards). Both use the same drawn parts: `album-picker/pickerParts.js` (Scan button, filter button with its count, panel message with "Try again") and `views/renderers/DiscographyRenderer.js` (the album card, `data-action="pick-album"`).

    ```mermaid
    flowchart LR
        Home[Home frame] --> Picker[AlbumPickerController]
        Edit[AlbumPickerPanel in Edit Series] --> Picker
        Picker --> Start[startScan: scanning]
        Start --> Service[albumSearchService.scanArtist]
        Service -->|albums, classified by models/albumType.js| Found[scanFound: results or empty]
        Service -->|deadline or failure| Failed[scanFailed: failed + Try again]
        Found -->|AI list arrives after| Again[scanReclassified]
        Found --> Draw[view port: drawScan, drawFilters, drawAlbums]
        Again --> Draw
        Failed --> Draw
        Picker -->|pick| OnPick[onPick: stage it / add it to the series]
    ```
-   **`home/StagingAreaController.js`**:
    -   **Role**: Manages the "Staging Stack" (drag-and-drop area).
    -   **Logic**: Uses `SortableJS` for reordering. Syncs state with the `StagingAreaRenderer`.
-   **`search/`**: the folder is gone. `DiscographyToolbar.js` and `VariantPickerModal.js`, which no module imported, were removed in F57.

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
    -   **Logic**: Shows only the inputs that change the result of the selected recipe (Top #, Grouping, Output Mode, Duration, Ranking Source; `ALGORITHM_RECIPES` mapping and `showsDuration`). "Discovery Mode" was removed in F62: no recipe read it.

## Inventory (`inventory/`)
**Status**: `[ACTIVE]`

-   **`inventory/InventoryGrid.js`**: *(removed in F65: `InventoryGrid.js`)*
    -   **Role**: A grid component for the User's Inventory.
    -   **Logic**: A wrapper around `SeriesGridRenderer`. Adds generic event delegation for Inventory actions (Click, Context Menu). Handles "Zero State" (Empty Inventory) display.
    -   **Usage today**: no module imports it. The inventory screen is `views/InventoryView.js` with `views/renderers/InventoryGridRenderer.js` and `controllers/InventoryController.js`.
    -   Deleting an album: `InventoryController.handleDelete` calls `inventoryService.removeAlbum` (`services/inventory/`, since F58; the store only holds state); a failure shows "Failed to delete album". The repository also forgets the "already in inventory" answer kept for that album, so it can be added again at once.

## Playlists & History (`playlists/`)
**Status**: `[ACTIVE]`

-   **`playlists/SavedSeriesGroup.js`**:
    -   **Role**: Container for a Series within the History view.
    -   **Logic**: Draws the entry it is given (`stores/savedPlaylists.js`): the Series Header with its actions and one `SavedPlaylistCard` per batch. When the playlists of the series could not be read it shows a notice with "Try again" (v5.0, F61); the trash button of the header is drawn only when there are playlists.
-   **`playlists/SavedPlaylistsController.js`** (rewritten in v5.0, F61):
    -   **Role**: What the Saved Playlists screen asks for and what it is told.
    -   **Logic**: Asks `SavedPlaylistsReader` (`open`, `reload`, `retrySeries`, `deleteBatch`, `deleteAllPlaylists`) and hands the view what `SavedPlaylistsStore` holds (`getList`, `findPlaylist`, `subscribe`). It reads nothing itself and imports no repository (`test/architecture/savedPlaylistsBoundaries.test.js`).
-   **`playlists/PlaylistDetailsModal.js`**:
    -   **Role**: Read-only view of a specific generated playlist.
    -   **Logic**: Uses `BaseModal` and `TrackRow` to render the list of tracks.
-   **`playlists/SavedPlaylistCard.js`**:
    -   **Role**: Represents a "Batch" of playlists.
    -   **Logic**: Displays a cascade of album art (`AlbumCascade`), the totals of the batch (`batchTotals`) and the batch actions (`SavedPlaylistActions`). One `SavedPlaylistRow` per playlist is drawn the first time the card is opened, not before; a row draws its tracks the first time it is opened (v5.0, F61).
