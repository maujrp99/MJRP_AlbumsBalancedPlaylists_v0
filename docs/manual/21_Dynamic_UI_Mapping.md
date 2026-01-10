# Dynamic UI & Logic Mapping (Deep Dive)
**Status**: Active - v3.0 (Comprehensive)
**Last Updated**: 2026-01-10
**Objective**: Comprehensive mapping of UI Actions -> Code Functions -> Data Flow.

## Legend
- **[UI]**: User Interface Element.
- **[FN]**: Function/Method Call.
- **[API]**: Backend Endpoint.
- **[STORE]**: State Update.

---

## 1. Authentication & Entry (Home)
**File Context**: `views/HomeView.js`, `controllers/HomeController.js`

### 1.1 Artist Search & Staging
*   **Logic Trace**:
    1.  **[UI]** User types in `#artistScanInput` (visual mode).
    2.  **[FN]** `SearchController` debounces input -> calls `AlbumSearchService.search(query)`.
    3.  **[API]** `GET /api/search/album?q=...` (Hybrid Search).
    4.  **[UI]** `DiscographyRenderer` updates grid with search results.
    5.  **[UI]** User clicks Album Card (`[data-action="toggle-staging"]`).
    6.  **[FN]** `HomeController.handleGridClick` -> `StagingController.addAlbum(album)`.
    7.  **[UI]** `StagingAreaRenderer` adds item to the visual stack.

### 1.2 Bulk Processing
*   **Logic Trace**:
    1.  **[UI]** User pastes "Artist - Album" list in `#bulkPasteInput`.
    2.  **[FN]** `HomeController.validateBulkInput` gives visual feedback (Border color).
    3.  **[UI]** User clicks "Process List" (`#btnProcessBulk`).
    4.  **[FN]** `HomeController.handleBulkProcess()` loops through lines -> `albumSearchService.search`.

### 1.3 Initialize Series (The Big Bang)
*   **Logic Trace**:
    1.  **[UI]** User names series in `#seriesNameInput`.
    2.  **[UI]** User clicks "Initialize Load Sequence" (`#btnInitializeLoad`).
    3.  **[FN]** `HomeController.handleInitializeLoad()`:
        -   Validates > 0 albums.
        -   **[STORE]** `albumSeriesStore.createSeries(name, queries)`.
    4.  **[FN]** `router.navigate('/albums?seriesId=...')`.

---

## 2. Albums Series Management
**File Context**: `views/SeriesView.js`, `controllers/SeriesController.js`

### 2.1 View Toggle & Filtering
*   **Logic Trace**:
    1.  **[UI]** User clicks List/Grid Toggle.
    2.  **[FN]** `SeriesView.handleToggleView()` toggles `viewMode` -> `refreshGrid()`.
    3.  **[UI]** Expansion loads `TracksRankingComparison` components for each card.

### 2.2 CRUD Operations
*   **Edit Name**:
    1.  **[UI]** Click Pencil Icon -> `SeriesModals.openEdit(id)`.
    2.  **[FN]** `albumSeriesStore.updateSeries(id, { name })`.
*   **Delete Series**:
    1.  **[UI]** Click Trash Icon -> `SeriesModals.openDelete(id)`.
    2.  **[FN]** `albumSeriesStore.deleteSeries(id)` -> Redirects to `/albums`.

---

## 3. Blending Menu (Playlist Generation)
**File Context**: `views/BlendingMenuView.js`, `controllers/BlendingController.js`

### 3.1 Wizard Flow (The Restaurant)
*   **Step 1: Blend (Series)**
    1.  **[UI]** `BlendSeriesSelector` renders cards.
    2.  **[FN]** Select Series -> `selectedSeries` set -> Unlock Step 2.
*   **Step 2: Recipe (Algorithm)**
    1.  **[UI]** `BlendRecipeCard` renders options (Balanced/Spotify/BEA).
    2.  **[FN]** Select Recipe -> `selectedRecipe` set (e.g., `mjrp-balanced-cascade`).
*   **Step 3: Ingredients (Config)**
    1.  **[UI]** `BlendIngredientsPanel` renders inputs (Duration, Mode).
    2.  **[FN]** `onConfigChange` updates `this.config`.
*   **Step 4: Generate**
    1.  **[UI]** User clicks "Blend It!".
    2.  **[FN]** `BlendingMenuView.handleGenerate()` -> `BlendingController.generateFromSeries(seriesId, config)`.
    3.  **[Service]** `PlaylistGenerationService.generate()` executes algorithm.
    4.  **[STORE]** `playlistsStore.setPlaylists(results)`.
    5.  **[FN]** `router.navigate('/playlists?seriesId=...')`.

---

## 4. Playlist Manager (Single Session)
**File Context**: `views/PlaylistsView.js`, `controllers/PlaylistsController.js`

### 4.1 Playlist CRUD (In-Memory)
*   **Delete Playlist**:
    1.  **[UI]** Click "X" on Playlist Card (`[data-action="delete-playlist"]`).
    2.  **[FN]** `PlaylistsController.deletePlaylist(index)`.
    3.  **[STORE]** `playlistsStore.removePlaylist(index)`.
*   **Remove Track**:
    1.  **[UI]** Click "X" on Track Row.
    2.  **[FN]** `PlaylistsController.deleteTrack(pIndex, tIndex)`.
*   **Reorder**:
    1.  **[UI]** Drag & Drop tracks (handled by `PlaylistsDragHandler`).
    2.  **[STORE]** Validates move -> Updates Array.

### 4.2 Export & Save
*   **Save Batch**:
    1.  **[UI]** Enter Name -> Click "Save to History".
    2.  **[STORE]** `playlistsStore.saveBatch()` -> `PlaylistRepository.create()`.
*   **Spotify Export**:
    1.  **[UI]** Click "Export to Spotify".
    2.  **[FN]** `SpotifyExportModal.handleExport()` -> `SpotifyExportService.exportPlaylists()`.
    3.  **[FN]** Service orchestrates `SpotifyService` calls (Search -> Create -> Add).
    4.  **[UI]** Modal updates progress based on Service callbacks.

---

## 5. Playlist Series Management (History)
**File Context**: `views/SavedPlaylistsView.js`, `components/playlists/SavedPlaylistsController.js`

### 5.1 Batch CRUD
*   **Rendering**:
    1.  **[FN]** `loadData()` fetches from `PlaylistRepository`.
    2.  **[FN]** Groups by Series -> Groups by Batch Name.
*   **Edit Batch**:
    1.  **[UI]** Click "Edit Batch" button.
    2.  **[FN]** `Controller.editBatch()` -> Repopulates `playlistsStore` -> Navigates to `/playlists`.
*   **Delete Batch**:
    1.  **[UI]** Click Trash Icon -> Confirm Modal.
    2.  **[API]** `PlaylistRepository.deleteBatch(seriesId, batchName)`.

---

## 6. Inventory Logic
**File Context**: `views/InventoryView.js`, `controllers/InventoryController.js`

### 6.1 Logic & Calculations
*   **Stats Calculation**:
    1.  **[FN]** `calculateStats()` runs on every update.
    2.  **[LOGIC]**
        -   `Total Count`: All items.
        -   `Owned Value`: Sum of `purchasePrice` WHERE `owned === true`.
        -   `Wishlist`: WHERE `owned === false`.
        -   `Unknown`: Nulls ignored.
*   **Currency Toggle**:
    1.  **[UI]** Click Currency Button (USD/BRL).
    2.  **[FN]** `handleCurrencyChange` -> Toggles `viewCurrency` -> Re-runs `formatPrice`.

### 6.2 Inventory CRUD
*   **Status Change**:
    1.  **[UI]** Change Dropdown (Owned/Wishlist).
    2.  **[FN]** `handleStatusChange(id, status)`.
    3.  **[STORE]** `inventoryStore.updateAlbum(id, { owned: bool })`.
*   **Delete**:
    1.  **[UI]** Click Delete Button -> Confirm.
    2.  **[STORE]** `inventoryStore.deleteAlbum(id)`.
