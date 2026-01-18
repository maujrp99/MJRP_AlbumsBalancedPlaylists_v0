# Deep Dive: Frontend Views, Renderers & UI Utilities (Batch 9)

This document covers the **View Layer internals**, specifically the specialized renderers, strategies, and utility views that power the main application interface.

## 1. Renderer Pattern
To keep the main View classes (like `AlbumsView` and `InventoryView`) maintainable, rendering logic has been extracted into pure function modules or static classes.

### Albums Grid Renderer (`public/js/views/albums/AlbumsGridRenderer.js`)
*   **Role**: Handles the HTML generation for album cards in the main browsing view.
*   **Key Exported Functions**:
    *   `renderCompactAlbumCard(album)`: Generates the standard grid card (Mode 1).
    *   `renderExpandedAlbumCard(album)`: Generates the detailed row (Mode 3) with ranking comparison.
    *   `renderVisualHeader(album)`: Reusable component for the album cover and action bar (Refetch Button + Year).
    *   `renderRankingBadge(album)`: Logic for displaying badges. **New (Sprint 22)**: Uses a "Split Row" layout:
        *   **Top**: BestEverAlbums (Orange)
        *   **Bottom**: Spotify (Green) | User Rank (Blue)
    *   `renderLoadingProgress(progress)`: Centralized visual for the loading spinner and progress bar.

### Inventory Grid Renderer (`public/js/views/renderers/InventoryGridRenderer.js`)
*   **Role**: Specialized renderer for the User Inventory.
*   **Key Distinction**: Unlike the global browser, it injects an **Inventory Status Dropdown** (Owned / Wishlist / Not Owned) directly into the card overlay.
*   **Format Badges**: Has specific logic to display `Vinyl`, `CD`, or `Digital` badges based on the `format` field.

### Discography Renderer (`public/js/views/renderers/DiscographyRenderer.js`)
*   **Role**: Used by the `DiscographyToolbar` to show "Missing Albums" in the staging area.
*   **Key Features**:
    *   **Visual Flair**: Adds subtle gradients and "Edition" badges (Deluxe, Remaster, Live) derived from title keywords.
    *   **Interactivity**: Cards are clickable for "Toggle Staging" (Action: `add-to-inventory` vs `remove-album`).

### Scoped Renderer (`public/js/views/albums/AlbumsScopedRenderer.js`)
*   **Role**: Manages the "All Series" vs "Single Series" grouping logic.
*   **Logic**:
    *   Group albums by their `Series` context.
    *   Identify "Orphan" albums that don't match any known series.
    *   Render distinct sections with headers for each series.

## 2. View Strategies

### View Mode Strategy (`public/js/views/strategies/ViewModeStrategy.js`)
*   **Pattern**: **Strategy Pattern**.
*   **Problem**: Switching between "Grid View" and "List View" created complex `if/else` logic in the main controller.
*   **Solution**:
    *   `ViewModeStrategy` (Abstract Base) defines the interface (`render`, `getButtonLabel`, `getButtonIcon`).
    *   `CompactViewStrategy`: Implements the Grid layout.
    *   `ExpandedViewStrategy`: Implements the Detailed List layout.
    *   **Factory**: `createViewModeStrategy(modeKey, view)` instantiates the correct class.

## 3. Specialized Views

### Save All / Migration View (`public/js/views/SaveAllView.js`)
*   **Role**: A dedicated utility view for migrating data from `localStorage` (Legacy) to `Firestore` (V3).
*   **Logic**:
    *   Checks `MigrationUtility.hasLocalStorageData()`.
    *   Provides a UI to trigger the migration.
    *   Visualizes progress with a real-time progress bar.

### Playlists Export (`public/js/views/playlists/PlaylistsExport.js`)
*   **Role**: Handles the "Export" button actions.
*   **Capabilities**:
    *   **JSON Export**: Dumps the playlist structure to a downloadable JSON file.
    *   **Apple Music Export**: Connects to `MusicKitService`, searches for tracks in the Apple Catalog, and creates playlists in the user's library.
    *   **Spotify Export**: Connects to `SpotifyService`, resolves URIs, and pushes playlists to Spotify.
*   **Matching Logic**: Uses a "Fast Path" (Existing ID) vs "Slow Path" (Search API) fallback mechanism.

### Configurable Placeholders (`public/js/views/ComingSoonView.js`)
*   **Role**: A generic placeholder for routes like `/artists` or `/genres` that are not yet implemented.
*   **Features**: Dynamically adjusts title/icon based on the route (e.g., shows "Artist Series" icon for `/artists`).

## 4. UI Utilities

### Albums Filters (`public/js/views/albums/AlbumsFilters.js`)
*   **Role**: Pure logic for filtering album arrays.
*   **Filters Supported**:
    *   `Search`: Fuzzy matching on Title/Artist.
    *   `Year`: Decade-based buckets (1960s, 1970s...).
    *   `Source`: Filter by Data Provider (BestEverAlbums, Spotify, AI, Pending).
    *   `Expansion Safety`: Explicitly excludes "Expansion" (Staging) albums from main views unless specifically searched.

### Playlists Drag & Drop (`public/js/views/playlists/PlaylistsDragDrop.js`)
*   **Library**: `SortableJS`.
*   **Logic**: Configures the drag-and-drop zones for playlist creation.
*   **Haptics**: Triggers `navigator.vibrate` on mobile drag start/end for tactile feedback.
*   **Store Integration**: Dispatches `playlistsStore.reorderTrack` or `moveTrack` actions on drop.
