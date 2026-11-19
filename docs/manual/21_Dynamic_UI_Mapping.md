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
    1.  **[UI]** User types in `#artistScanInput` (visual mode) and presses Enter or clicks the Scan button (`#btnScanArtist`). There is no debounce.
    2.  **[FN]** `SearchController.searchArtist(query)` -> the scan state goes to `scanning` (`models/scanState.js`) and `HomeView.renderScan` draws it at once: the button busy and disabled ("Scanning…"), the status line, the wait in the panel. While a scan runs, another ask does nothing; an empty field gets the notice "Type an artist name first.". Then it calls `AlbumSearchService.scanArtist(query)`.
    3.  **[API]** Apple Music catalog through MusicKit (`musicKitService.getArtistAlbums`), in the browser, straight to Apple: the app's server sees nothing of it except `GET /api/musickit-token`, once per page load. The catalog step has a deadline of 15 s (`CATALOG_DEADLINE_MS`) and the start of MusicKit one of 10 s (`MUSICKIT_INIT_DEADLINE_MS`).
    4.  **[UI]** As soon as the catalog answers, `DiscographyRenderer` draws the albums, classified without the AI list, and the filter counts are updated. No album: the panel says "No albums found for «text».". Deadline or failure: the panel says so, with the button "Try again" (`#btnScanRetry`), which scans the same text.
    4b. **[API]** Only when some album needs it (electronic genres), `POST /api/ai/studio-albums` is asked after that first render (deadline of 60 s, `AI_LIST_DEADLINE_MS`); the status line shows "confirming album types…" meanwhile. When the list arrives the albums are classified again and the grid and the counts are redrawn; when it does not, the albums shown stay.
    5.  **[UI]** User clicks Album Card (`[data-action="toggle-staging"]`).
    6.  **[FN]** `HomeController.handleGridClick` -> `StagingAreaController.addAlbum(album)`.
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
        -   Builds the queries with `toAlbumQuery` (`models/albumQuery.js`).
        -   **[FN]** `SeriesService.createSeries({ name, albumQueries, status: 'pending' })`.
    4.  **[FN]** `router.navigate('/albums/{seriesId}')`.

---

## 2. Albums Series Management
**File Context**: `views/SeriesView.js`, `controllers/SeriesController.js`

### 2.1 View Toggle & Filtering
*   **Logic Trace**:
    1.  **[UI]** User clicks List/Grid Toggle.
    2.  **[FN]** `FilterToolbar` `onToggleView` -> `SeriesController.handleViewModeChange(mode)` (`compact` / `expanded`, kept in `localStorage` as `albumsViewMode`).
    3.  **[UI]** Expansion loads `TracksRankingComparison` components for each card.

### 2.2 CRUD Operations
*   **Edit Name**:
    1.  **[UI]** Click Pencil Icon -> `SeriesModals.openEdit(id)` -> `SeriesEditModal`.
    2.  **[FN]** `SeriesService.updateSeries(id, ...)`.
*   **Delete Series**:
    1.  **[UI]** Click Trash Icon -> `SeriesModals.openDelete(id)`.
    2.  **[FN]** `SeriesService.countSavedPlaylists(id)` -> the confirmation says how many saved playlists and batches go with the series (v5.0, F60).
    3.  **[FN]** `SeriesService.deleteSeries(id)` -> `SeriesRepository.deleteWithPlaylists(id)` (series and playlists in one write) -> Redirects to `/albums`.

---

## 3. Blending Menu (Playlist Generation)
**File Context**: `views/BlendingMenuView.js`, `controllers/BlendingController.js`

### 3.1 Wizard Flow (The Restaurant)
*   **Step 1: Blend (Series)**
    1.  **[UI]** `BlendSeriesSelector` renders cards.
    2.  **[FN]** Select Series -> `selectedSeries` set -> Unlock Step 2.
*   **Step 2: Recipe (Algorithm)**
    1.  **[UI]** `BlendRecipeCard` renders options (Balanced Cascade, Top N Popular, Top N Acclaimed, Top N by own ranking).
    2.  **[FN]** Select Recipe -> `selectedRecipe` set (e.g., `mjrp-balanced-cascade`).
*   **Step 3: Ingredients (Config)**
    1.  **[UI]** `BlendIngredientsPanel` renders inputs (Duration, Mode).
    2.  **[FN]** `onConfigChange` updates `this.config`.
*   **Step 4: Generate**
    1.  **[UI]** User clicks "Blend It!".
    2.  **[FN]** `BlendingMenuView.handleGenerate()` -> `BlendingController.generateFromSeries(seriesId, config)`.
    3.  **[FN]** `BlendingController.loadAlbumsFromSeries(series)` loads the albums one query at a time with `apiClient.fetchAlbum` (its own loop, not `AlbumLoadService`).
    4.  **[Service]** `PlaylistGenerationService.generate()` executes algorithm.
    5.  **[STORE]** `playlistsStore.setPlaylists(results)`.
    6.  **[FN]** `router.navigate('/playlists?seriesId=...')`.

---

## 4. Playlist Manager (Single Session)
**File Context**: `views/PlaylistsView.js`, `controllers/PlaylistsController.js`

### 4.1 Playlist CRUD (In-Memory)
*   **Delete Playlist**:
    1.  **[UI]** Click "X" on Playlist Card (`[data-action="delete-playlist"]`).
    2.  **[FN]** `PlaylistsController.deletePlaylist(index)` -> `PlaylistsService.removePlaylist(index)` (history snapshot; counts as an unsaved change, v5.0, F60).
    3.  **[STORE]** `playlistsStore.setPlaylists(remaining, seriesId)`, `setDirty(true)`.
*   **Remove Track**:
    1.  **[UI]** Click "X" on Track Row.
    2.  **[FN]** `PlaylistsController.deleteTrack(pIndex, tIndex)` -> `PlaylistsService.removeTrack`.
*   **Reorder**:
    1.  **[UI]** Drag & Drop tracks (handled by `PlaylistsDragHandler`).
    2.  **[FN]** `PlaylistsService.moveTrack(...)` -> history snapshot -> updates the store.
*   **Edit mode (`/playlists/edit`)**:
    1.  **[FN]** `PlaylistsController.loadPlaylistsForEdit(batchName, seriesId)` puts the saved batch in `playlistsStore`.
    2.  **[FN]** `PlaylistsController.loadAlbumsForSeries(seriesId)` loads the albums with `apiClient.fetchMultipleAlbums` (its own loop, not `AlbumLoadService`).

### 4.2 Export & Save
*   **Save Batch**:
    1.  **[UI]** Enter Name -> Click "Save to Series History".
    2.  **[FN]** `PlaylistsController.handleSave()` -> `PlaylistsService.saveCurrentBatch({ userId, batchName })` -> `PlaylistRepository.replaceBatch(playlists, replacedIds)` (v5.0, F60). One atomic write: in edit mode the playlists of the original batch name that are not in the new set are removed in the same write, so a failure leaves the saved batch as it was. The button is drawn disabled from `playlistsStore.isSaving` while the write is on its way.
*   **Leave with unsaved changes** (v5.0, F60):
    1.  **[UI]** A link or button of the app, the browser's back button, closing or reloading the tab.
    2.  **[FN]** `unsavedChangesGuard` (installed by `PlaylistsView.mount`) asks `PlaylistsService.hasUnsavedChanges()`; the router's `beforeNavigate` hook shows a confirm, `beforeunload` shows the browser's own.
*   **Reload with playlists not saved yet** (v5.0, F60):
    1.  **[FN]** `PlaylistsController.initialize()` (create mode, nothing in memory) -> `PlaylistsService.restoreDraft({ seriesId })` -> toast "Your unsaved playlists were restored" -> `loadAlbumsForSeries(seriesId)`.
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
    2.  **[FN]** `Controller.editBatch()` -> `PlaylistsService.setEditMode(batchName, seriesId, savedAt)` -> Navigates to `/playlists/edit?seriesId=...&edit=...`.
*   **Delete Batch**:
    1.  **[UI]** Click Trash Icon -> Confirm Modal.
    2.  **[FN]** `Controller.deleteBatch(seriesId, batchName)` -> deletes the playlists of that batch through `PlaylistRepository`.

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
    2.  **[FN]** `InventoryController.handleDelete(id)` calls `inventoryStore.removeAlbum(id)`, which removes the item through `InventoryRepository.removeAlbum` and from the store's own list; the toast is "Album removed from inventory" or, on failure, "Failed to delete album".
