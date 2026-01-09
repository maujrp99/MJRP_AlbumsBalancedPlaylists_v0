# Deep Dive: Feature Components

This document provides a comprehensive analysis of the feature-specific UI components located in `public/js/components/`.

## 1. Blend Components (`components/blend/`)

The Blend system is the core "Wizard" for creating playlists. It uses a stepwise approach (Series -> Flavor -> Ingredients).

| Component | Responsibility | Dependencies | State Management |
| :--- | :--- | :--- | :--- |
| **`BlendSeriesSelector.js`** | Step 1: Selection of entity type (Albums/Artists) and specific Series to blend. Features a sophisticated cascade thumbnail display. | `AlbumCascade`, `OptimizedAlbumLoader`, `AlbumSeriesStore` | Manages `selectedEntity` and `selectedSeries`. Implements `preloadAllThumbnails()` for non-blocking UI updates. |
| **`BlendFlavorCard.js`** | Step 2: Algorithm selection. Renders visual cards for strategies like 'Balanced Cascade', 'Round Robin', etc. | `Icons`, `AlgorithmRegistry` | Pure rendering of provided algorithms. Handles selection events. |
| **`BlendIngredientsPanel.js`** | Step 3: Configuration. Dynamic form that shows/hides fields (Duration, Output Mode, Ranking Source) based on the selected Flavor's capabilities. | `Icons` | Complex configuration object `{ duration, outputMode, groupingStrategy, rankingType, discoveryMode }`. Normalizes config for service layer via `getConfig()`. |

### Key Patterns
*   **Wizard State**: Each component handles a specific stage of the `BlendingMenuView`.
*   **Dynamic Configuration**: `BlendIngredientsPanel` uses a static `ALGORITHM_INGREDIENTS` map to toggle UI controls based on the selected algorithm, ensuring users only see relevant options.
*   **Thumbnail Caching**: `BlendSeriesSelector` implements an aggressive preload strategy (`preloadAllThumbnails`) to fetch album art for series visualization without blocking the UI.

---

## 2. Playlists Components (`components/playlists/`)

These components handle the visualization, management, and export of generated playlists.

| Component | Responsibility | Dependencies | key Features |
| :--- | :--- | :--- | :--- |
| **`PlaylistGrid.js`** | High-level container for rendering a grid of `PlaylistCard`s. | `TrackRow`, `Icons` | Responsive grid layout (1/2/3 cols). Handles "Batch Name" formatting logic (e.g., "1. Batch Name - Playlist Title"). |
| **`PlaylistsGridRenderer.js`** | Stateless rendering logic for the entire Playlists View. Decouples structure from state. | `PlaylistGrid`, `RegeneratePanel` | Renders Empty States, Initial Settings Form, Export Toolbar, and the main Grid. Pure functional rendering. |
| **`RegeneratePanel.js`** | Collapsible panel allowing users to "Re-roll" specific playlists or the entire batch with new settings. | `BlendFlavorCard`, `BlendIngredientsPanel` | reuses the Blend wizard components in a condensed, collapsible inline inspector pane. |
| **`PlaylistExportToolbar.js`** | Floating/Fixed toolbar for high-level actions (Save, Export to Spotify/Apple). | `Component` | Visual status indicator ("Ready to Export") and action buttons. |
| **`SavedPlaylistsController.js`** | Business logic for the "Saved Playlists" view (History). | `SeriesRepository`, `PlaylistRepository` | Groups playlists by "Batch", handles lazy loading of series thumbnails, and manages Delete/Edit workflows. |
| **`TrackItem.js`** | Visual row for a single track. | `Icons` | **Smart Badging**: Left badge = Primary Ranking (used for sort), Right badge = Secondary. Supports drag handles. |
| **`PlaylistsDragBoard.js`** | Kanban-style board for dragging tracks *between* playlists. | `SortableJS` | Renders playlists as columns. Warning: Contains some legacy logic (might be superseded by Grid view). |
| **`PlaylistsDragHandler.js`** | Headless logic controller for Drag & Drop operations. | `SortableJS`, `PlaylistsStore` | Manages `Sortable` instances, auto-scroll, and commits changes to `PlaylistsStore`. |

### Key Patterns
*   **Renderer Pattern**: `PlaylistsGridRenderer` separates markup generation from the View's life-cycle, making the large `PlaylistsView.js` more manageable.
*   **Component Reuse**: `RegeneratePanel` directly imports `BlendFlavorCard` and `BlendIngredientsPanel`, ensuring that the "Reconfigure" UI matches the "Create" UI exactly.
*   **Dual Ranking Visualization**: `TrackItem.js` dynamically swaps the position of "Spotify" and "Acclaim" badges based on which metric was used to generate the playlist.

---

## 3. Inventory Components (`components/inventory/`)

Components for managing the user's collection of albums.

| Component | Responsibility | Dependencies | Notes |
| :--- | :--- | :--- | :--- |
| **`InventoryGrid.js`** | Main container for the Inventory View. | `SeriesGridRenderer` | Effectively a wrapper around `SeriesGridRenderer`, adapting it for Inventory data. Handles event delegation for item clicks. |

> **Note**: Several inventory-specific components (`InventoryItemCard`, `InventoryStats`) appear to have been deprecated or merged into generic components like `Card` and `SeriesStats` to reduce duplication.

---

## 4. Series Components (`components/series/`)

Components for managing Album Series (the core organizational unit).

| Component | Responsibility | Dependencies | State Management |
| :--- | :--- | :--- | :--- |
| **`SeriesGridRenderer.js`** | Universal renderer for Album lists/grids. | `AlbumsGridRenderer`, `AlbumsScopedRenderer` | **Hybrid Pattern**: Delegates to legacy production renderers (`AlbumsGridRenderer`) while providing a modern Class-based Component API. Supports both `GRID` and `LIST` layouts. |
| **`SeriesHeader.js`** | Standardized page header. | `Breadcrumb`, `Icons` | Renders Title, Breadcrumbs, and the primary "Blend" action button (if albums exist). |
| **`SeriesToolbar.js`** | Control bar with Search, Filters (Artist/Year/Source), and View Toggles. | `AlbumSeriesStore` | Complex composite component. Binds multiple filter inputs to callback props. |
| **`SeriesFilterBar.js`** | Simplified version of the toolbar (potentially specialized or legacy). | - | Basic search and sort inputs. |
| **`SeriesEditModal.js`** | Modal for editing a Series (Name, adding/removing albums). | `ArtistScanner`, `BaseModal` | **Heavy Component**. Contains substantial logic for managing a local list of "Album Queries" before saving. Integrates `ArtistScanner`. |
| **`SeriesEventHandler.js`** | Headless behavior controller. | `DialogService`, `AlbumsStore` | Implements the **Command Pattern** via Event Delegation. Intercepts clicks on `[data-action]` elements (Edit, Delete, Remove Album) and triggers store actions/modals. |
| **`ArtistScanner.js`** | Apple Music search integration within the Edit Modal. | `MusicKitService`, `AlbumSearchService` | Allows searching for albums and adding them to the Series definition. Implements type filtering (Album vs Single vs Live). |
| **`SeriesDragDrop.js`** | SortableJS wrapper for Series grids. | `SortableJS` | Enables reordering of albums within a series. |

### Key Patterns
*   **Event Delegation**: `SeriesEventHandler` allows unrelated components (like a grid card rendered by a functional renderer) to trigger complex actions (deletions, modals) without passing callbacks down the entire tree.
*   **Service Integration**: `ArtistScanner` directly communicates with `MusicKitService` and `AlbumSearchService` to provide real-time Apple Music data during series editing.
*   **Legacy Wrapping**: `SeriesGridRenderer` is a "Bridge" component. It wraps the older, functional renderers (`renderAlbumsGrid`) to make them usable within the newer class-based Component architecture.

## Missing / Deprecated Components
The following components were in the original plan but found to be missing or superseded:
*   `InventoryItemCard.js` / `SeriesCard.js` -> Replaced by generic `Card.js` or functional renderers.
*   `series/AlbumCard.js` -> Replaced by `Card.js` (Universal Card).
*   `series/SeriesStats.js` -> Likely integrated into `SeriesHeader` or Dashboard.
