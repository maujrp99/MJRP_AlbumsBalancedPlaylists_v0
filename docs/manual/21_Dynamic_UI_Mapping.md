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
    1.  **[UI]** User pastes "Artist - Album" list in `#bulkPasteInput`, one album per line.
    2.  **[FN]** `HomeController.validateBulkInput` -> `bulkInputState(text)` (`models/bulkPaste.js`) -> `HomeView.setBulkInputState`: green border when every line is an album, orange when some line is not, neutral when the box is empty.
    3.  **[UI]** User clicks "Process List" (`#btnProcessBulk`). An empty box gets the notice "Please paste some "Artist - Album" lines first." and nothing else happens.
    4.  **[FN]** `HomeController.handleBulkProcess()` -> `readPastedList(text)` (`models/bulkPaste.js`), which reads each line with `parsePastedAlbumLine` (`models/albumQuery.js`, the one parser of "Artist - Album"): only the first " - " separates, so a hyphen in a name is kept ("Jay-Z - The Blueprint", "Artist - Album - Deluxe"); a list number or bullet in front, an en or em dash or a tab as the separator and a space missing on one side of the hyphen are accepted; a hyphen with no space on either side never separates ("Jay-Z-The Blueprint" is refused, not guessed).
    5.  **[FN]** `stageBulkEntries` searches each good line (`albumSearchService.search(artist, title, { limit: 1 })`) and selects the first result (`toStagedAlbum` -> `StagingAreaController.addAlbum`). One line never stops the others: a line that cannot be read, that the catalog does not have, whose search failed or whose album is already selected is skipped with its reason. The button is busy and disabled meanwhile (`HomeView.setBulkBusy`).
    6.  **[UI]** `bulkOutcome` says what the screen shows: a toast ("Added N albums.", with "N lines were skipped: see the list under the box." when some were), the skipped lines listed under the box in `#bulkPasteReport` ("Line N: «text» — why"), and the box left with the lines that can be fixed. No `alert`.

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
*   **Edit Name and Albums**:
    1.  **[UI]** Click Pencil Icon -> `SeriesModals.openEdit(id)` -> `SeriesEditModal`.
    2.  **[FN]** `SeriesService.updateSeries(id, ...)` saves the name and the album queries.
    3.  **[FN]** `SeriesModalsManager.handleSeriesUpdated()` -> `SeriesController.requestLoad(false)` -> `albumLoadService.load(...)` reconciles (F56): an album added is found and enriched through the queue, an album removed leaves, another edition of the same title is found again in the catalog, and every other album and every other series stays as it is. Nothing is injected into the screen by hand.
*   **Remove one album**:
    1.  **[FN]** `SeriesEventHandler` -> `SeriesService.removeAlbumFromSeries(seriesId, album)`; the series changed, the load reconciles and the album leaves the screen.
*   **Refetch one album**:
    1.  **[UI]** "Refetch" on the album card -> `SeriesController.handleRefetchMetadata(album)`.
    2.  **[FN]** `albumLoadService.reloadAlbum(album.id)` (F56): the album is found again in the catalog, not in what is kept, and every source is asked again, through the queue. The card shows as loading; a failure is the failure of that album, with "Try again".
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
    2.  **[FN]** `BlendingMenuView.handleGenerate()` -> `BlendingController.generateFromSeries(seriesId, config, { onProgress, signal })`.
    3.  **[FN]** `albumAsks.albumsOf({ series, sources, signal })` (F56, `services/albums/AlbumAsks.js`): the series joins the load in force in `AlbumLoadService`. What the albums screen loaded or the browser keeps is not asked again; what is missing goes through the same queue, ahead of what the albums screen still has to load. `sources` are the ones the recipe reads (`models/recipeSources.js`: popularity, acclaim, own ranking, or acclaim and popularity for the balanced ranking); the blend waits for those, each behind the 20 s deadline of a source.
    4.  **[UI]** While it waits: "Loading albums: i of n..." and then "Waiting for the ratings of i of n albums...".
    5.  **[FN]** The answer is typed (`models/albumAsk.js`): the albums that are ready, the ones that failed with the reason, the sources missing for some album. The blend goes on with the albums that are ready; it stops, with the reasons on screen, only when none is ready.
    6.  **[Service]** `PlaylistGenerationService.generate()` executes algorithm.
    7.  **[STORE]** `playlistsStore.setPlaylists(results)`.
    8.  **[UI]** One warning toast per thing left out ("1 of 2 albums could not be loaded and was left out: ...", "Acclaim ratings are missing for 1 of 2 albums ...").
    9.  **[FN]** `router.navigate('/playlists?seriesId=...')`.
    10. **[FN]** Leaving the screen while it waits (`BlendingMenuView.destroy`) aborts the ask: the series leaves the load unless the albums screen shows it, and nothing is generated.

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
    2.  **[FN]** `PlaylistsController.loadAlbumsForSeries(seriesId)` asks `albumAsks.albumsOf` for the albums of the series (F56): what is loaded or kept comes at once. A warning toast says which albums could not be loaded and how many. A second ask, which nobody waits for, keeps every source coming while the screen is open; `PlaylistsController.destroy` aborts both.
*   **Generate again with another recipe**:
    1.  **[UI]** "Regenerate Playlists" in the reconfigure panel -> `PlaylistsController.handleGenerate(config)`.
    2.  **[FN]** `BlendingController.regenerate(config, { signal })` asks `albumAsks.albumsOf` again with the sources of the new recipe, generates from the albums that are ready and returns the notices; the controller shows them as warning toasts. The question "No ratings detected... Continue?" no longer exists.

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
**File Context**: `views/SavedPlaylistsView.js`, `components/playlists/SavedPlaylistsController.js`, `services/playlists/SavedPlaylistsReader.js`, `stores/savedPlaylists.js` (v5.0, F61)

### 5.1 Batch CRUD
*   **Rendering** (v5.0, F61: the screen waits for no read):
    1.  **[UI]** The router calls `render()`: the page, the toolbar and the line "Reading your series..." are on screen at once.
    2.  **[FN]** `mount()` subscribes to `SavedPlaylistsStore` and calls `Controller.open()` -> `SavedPlaylistsReader.load()`.
    3.  **[FN]** The reader reads the series once (`SeriesRepository.findAll`), publishes one entry per series as `loading`, most recently updated first, then reads the playlists of each series (`PlaylistRepository.findAll`), up to 8 at a time, 15 s each.
    4.  **[FN]** Each answer replaces the entry of its series: `ready` (playlists grouped into batches by `groupIntoBatches`), `empty` or `failed`.
    5.  **[UI]** On each change of the store, `refreshContent()` draws only the series group that changed; the line above the list says "Reading playlists: 12 of 47 series" and goes away when every series answered.
    6.  **[UI]** A failed series shows a notice and "Try again" -> `Controller.retrySeries(seriesId)` -> one read. A failed list shows "Your series could not be read." and "Try again" -> `Controller.reload()`.
    7.  **[UI]** Coming back in the same session: what was read is drawn at once and read again behind ("Updating...").
*   **Edit Batch**:
    1.  **[UI]** Click "Edit Batch" button.
    2.  **[FN]** `Controller.editBatch()` -> `PlaylistsService.setEditMode(batchName, seriesId, savedAt)` -> Navigates to `/playlists/edit?seriesId=...&edit=...`.
*   **Delete Batch**:
    1.  **[UI]** Click Trash Icon -> Confirm Modal.
    2.  **[FN]** `Controller.deleteBatch(seriesId, batchName)` -> `SavedPlaylistsReader.removeBatch`: one read of that series, one atomic delete (`PlaylistRepository.deleteMany`), and only that series changes on the list. Nothing else is read again (v5.0, F61).
*   **Delete All Playlists of a Series**:
    1.  **[UI]** Click the Trash Icon of the series header -> Confirm Modal.
    2.  **[FN]** `Controller.deleteAllPlaylists(seriesId, seriesName)` -> `SavedPlaylistsReader.removeAll`: one read, one atomic delete; the series leaves this list and stays in the app.
*   **Refresh**:
    1.  **[UI]** Click "Refresh" -> `Controller.reload()` -> `SavedPlaylistsReader.load({ fresh: true })`: a new read of everything; the answers of the read it replaces are dropped.

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
