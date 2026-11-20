# Deep Dive: Frontend Views, Renderers & UI Utilities (Batch 9)

This document covers the **View Layer internals**, specifically the specialized renderers, strategies, and utility views that power the main application interface.

## 1. Renderer Pattern
To keep the main View classes (like `SeriesView` and `InventoryView`) maintainable, rendering logic has been extracted into pure function modules or static classes.

### Albums Grid Renderer (`public/js/views/albums/AlbumsGridRenderer.js`)
*   **Role**: Handles the HTML generation for album cards in the main browsing view. Imported by `components/series/SeriesGridRenderer.js`. The card markup itself lives in `components/ui/AlbumCardRenderer.js`; this module delegates to it.
*   **Key Exported Functions**:
    *   `renderCompactAlbumCard(album)`: Generates the standard grid card (Mode 1) via `AlbumCardRenderer.renderCompact`.
    *   `renderExpandedAlbumCard(album, idx)`: Generates the detailed row (Mode 3) with ranking comparison via `AlbumCardRenderer.renderExpanded`.
    *   `renderAlbumsGrid`, `renderExpandedList`, `wrapInGrid`, `renderEmptyState`, `renderNoMatchState`: list wrappers and empty states.
    *   `renderLoadingProgress(progress)`: Centralized visual for the loading spinner and progress bar.
*   **Not in this file**:
    *   `AlbumCardRenderer.renderVisualHeader(album)`: Reusable component for the album cover and action bar.
    *   `AlbumCardRenderer.renderBadges(album)` (F55, slice 2): what goes in the badges row of the grid card and of the list card: the ranking badge and, for an album accepted by the second tier of the identity rule (the catalog only has the album under another title: with a subtitle, with more in parentheses, by the name in parentheses, with the artist's name in front, or in another spelling), the one line of `identityNotice` (`models/askedAlbum.js`), which says by which rule (F68).
    *   `Card.renderRankingBadge(album)` (`components/ui/Card.js`): Logic for displaying badges. Uses a "Split Row" layout:
        *   **Top**: BestEverAlbums
        *   **Bottom**: Spotify (Green) | User Rank (Blue)

### Inventory Grid Renderer (`public/js/views/renderers/InventoryGridRenderer.js`)
*   **Role**: Specialized renderer for the User Inventory.
*   **Key Distinction**: Unlike the global browser, it injects an **Inventory Status Dropdown** (Owned / Wishlist / Not Owned) directly into the card overlay.
*   **Format Badges**: Has specific logic to display `Vinyl`, `CD`, or `Digital` badges based on the `format` field. An item with no format (one added by "Add the albums of my series", F71) shows no badge, and an item with no price shows no price.
*   **Status**: the selected status and the three options come from `models/inventoryStatus.js` (`statusOf`, `STATUS_SELECT_OPTIONS`); the renderer only holds the colours.

### Discography Renderer (`public/js/views/renderers/DiscographyRenderer.js`)
*   **Role**: The album card of the one album picker (F57): used by `HomeController` in Home and by `AlbumPickerPanel` in the series edit modal to render the artist's discography.
*   **Key Features**:
    *   **Visual Flair**: Adds subtle gradients and badges: "Deluxe" and "Remaster" derived from title keywords; "Live", "Single", "EP" and "Comp" from `album.type` (the rule is `badgesOf` in `models/albumPicker.js`).
    *   **Interactivity**: Cards are clickable to pick the album (`data-action="pick-album"`); the frame of the screen hears the click and asks `AlbumPickerController.pick`.

### Scoped Renderer (`public/js/views/albums/AlbumsScopedRenderer.js`)
*   **Role**: Manages the "All Series" vs "Single Series" grouping logic.
*   **Logic**:
    *   Group albums by their `Series` context.
    *   Identify "Orphan" albums that don't match any known series.
    *   Render distinct sections with headers for each series.

## 2. View Strategies

### View Mode Strategy (`public/js/views/strategies/ViewModeStrategy.js`)

> **F65 (2026-11-19):** `ViewModeStrategy.js` was removed from the repository (nothing reached it from an entry point, or its screen was retired). Where this section describes the code of that file, it describes history; the code is in the git history.
*   **Pattern**: **Strategy Pattern**.
*   **Usage today**: no module imports this file; `SeriesView` does not use it.
*   **Problem**: Switching between "Grid View" and "List View" created complex `if/else` logic in the main controller.
*   **Solution**:
    *   `ViewModeStrategy` (Abstract Base) defines the interface (`render`, `getButtonLabel`, `getButtonIcon`).
    *   `CompactViewStrategy`: Implements the Grid layout.
    *   `ExpandedViewStrategy`: Implements the Detailed List layout.
    *   **Factory**: `createViewModeStrategy(modeKey, view)` instantiates the correct class.

## 3. Specialized Views

### Save All / Migration View (`public/js/views/SaveAllView.js`)

> **F65 (2026-11-19):** `SaveAllView.js` was removed from the repository (nothing reached it from an entry point, or its screen was retired). Where this section describes the code of that file, it describes history; the code is in the git history.
*   **Role**: A dedicated utility view for migrating data from `localStorage` (Legacy) to `Firestore` (V3).
*   **Logic**:
    *   Receives the `MigrationUtility` and `getUserId` from the route (`app.js`, `/save-all`): since F58 (UAT-14) the view imports no Firebase (it used to load a second SDK, 11.6.1, from the `gstatic` CDN).
    *   Checks `MigrationUtility.hasLocalStorageData()`.
    *   Provides a UI to trigger the migration.
    *   Visualizes progress with a real-time progress bar.

### Playlists Export (`public/js/views/playlists/PlaylistsExport.js`)
*   **Role**: Handles the "Export" button actions.
*   **Capabilities**:
    *   **JSON Export** (`handleExportJson`): Dumps the playlist structure to a downloadable JSON file.
    *   **Apple Music Export** (`handleExportToAppleMusic`): the screen side of the export (F62). One export at a time; shows the step on the button; hands the work to `services/AppleMusicExportService.js` and says its report in toasts (`appleExportMessages`): what was created, what Apple Music refused and why, tracks not found. A playlist created in this session is not created again (`services/export/exportLedger.js`).
    *   **Spotify Export**: not here. The Spotify button of `PlaylistsView` opens `components/SpotifyExportModal.js`, which uses `SpotifyExportService`; the unused `handleExportToSpotify` was removed in F62.
*   **Matching Logic**: "Fast Path" (the id the track carries) vs "Slow Path" (search), in `AppleMusicExportService._catalogIdsOf` and `SpotifyExportService._uriOf`.

### Configurable Placeholders (`public/js/views/ComingSoonView.js`)
*   **Role**: A generic placeholder for the routes `/artists`, `/genres` and `/tracks`, which are not yet implemented.
*   **Features**: Dynamically adjusts title/icon based on the route (e.g., shows "Artist Series" icon for `/artists`).

## 4. UI Utilities

### Albums Filters (`public/js/views/albums/AlbumsFilters.js`)

> **F65 (2026-11-19):** `AlbumsFilters.js` was removed from the repository (nothing reached it from an entry point, or its screen was retired). Where this section describes the code of that file, it describes history; the code is in the git history.
*   **Role**: Pure logic for filtering album arrays.
*   **Usage today**: only re-exported by `views/albums/index.js`, which no module imports. The filters of the albums screen are in `services/SeriesFilterService.js` and `models/seriesFilter.js`. *(removed in F65: `AlbumsFilters.js`, `views/albums/index.js`, `SeriesFilterService.js`; the filters of the albums screen are pure rules in `models/seriesFilter.js`)*
*   **Filters Supported**:
    *   `Search`: Case-insensitive substring match on Title/Artist.
    *   `Artist`: Exact artist name.
    *   `Year`: Decade-based buckets (1960s, 1970s...).
    *   `Source`: Filter by Data Provider (`acclaim`, `popularity`, `ai`, `pending`).
    *   `Expansion Safety`: Explicitly excludes "Expansion" (Staging) albums from main views unless specifically searched.

### Playlists Drag & Drop (`public/js/views/playlists/PlaylistsDragDrop.js`)

> **F65 (2026-11-19):** `PlaylistsDragDrop.js` was removed from the repository (nothing reached it from an entry point, or its screen was retired). Where this section describes the code of that file, it describes history; the code is in the git history.
*   **Library**: `SortableJS`.
*   **Logic**: Configures the drag-and-drop zones for playlist creation (`setupDragAndDrop(view)`).
*   **Usage today**: `PlaylistsView` uses `components/playlists/PlaylistsDragHandler.js` instead; nothing calls `setupDragAndDrop`.
*   **Haptics**: Triggers `navigator.vibrate` on mobile drag start/end for tactile feedback.
*   **Store Integration**: Calls `reorderTrack` or `moveTrack` of the playlists service (`getPlaylistsService`) on drop.
