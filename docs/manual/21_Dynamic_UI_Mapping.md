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

### 1.1 Artist Search and the series being built (F79, the Home that explains itself)
*   **Logic Trace**:
    1.  **[UI]** User types in the one field `#artistScanInput` ("An artist, or paste a list of albums") and presses Enter or clicks «Search» (`#btnScanArtist`). There is no debounce. The hint under the field changes while the field has the focus and text (`HomeController.fieldFocused` -> `HomeView.drawHint`).
    2.  **[FN]** `HomeController.search(text)` -> `AlbumPickerController.searchArtist(query)` (the one album picker, F57; the Home is one of its two frames) -> the scan state goes to `scanning` (`models/scanState.js`) and the port `drawScan` -> `HomeController.drawScan` -> `HomeView.drawResults` / `drawStage` draw it at once: «Searching…» busy and disabled, «Looking for «text» in the catalog…», skeleton covers, the stage small, the equalizer moving (`components/home/HomeEqualizer.js`, state `live`). While a scan runs, another ask does nothing; an empty field gets the notice "Type an artist name first.". Then it calls `AlbumSearchService.scanArtist(query)`.
    3.  **[API]** Apple Music catalog through MusicKit (`musicKitService.getArtistAlbums`), in the browser, straight to Apple: the app's server sees nothing of it except `GET /api/musickit-token`, once per page load. The catalog step has a deadline of 15 s (`CATALOG_DEADLINE_MS`) and the start of MusicKit one of 10 s (`MUSICKIT_INIT_DEADLINE_MS`).
    4.  **[UI]** As soon as the catalog answers, `DiscographyRenderer` (`variant: 'stage'`) draws the cards, classified by the one classifier (`models/albumType.js`) without the AI list (or with the list remembered from an earlier scan of the same artist); the artist, the line «N studio albums · newest first» (`models/homeSeries.js` `typesLine`), the chips with their counts and «Add all N …» (`addAllLabel`) are drawn. No album: «No albums found for «text».» with «Paste a list». Deadline or failure: the reason, what still holds, and «Try again» (`#btnScanRetry`), which scans the same text; the equalizer goes flat.
    4b. **[API]** Only when some album is of an electronic genre (`wantsAiList`), `POST /api/ai/studio-albums` is asked after that first render (deadline of 60 s, `AI_LIST_DEADLINE_MS`); the line under the artist adds «· confirming album types…» meanwhile. When the list arrives the albums are classified again (in the list: "Studio"; not in it: "Other") and the grid and the counts are redrawn. A visitor (the guest login) never asks it (F70, `api/paidRoutes.js`).
    5.  **[UI]** User clicks a cover (`[data-action="pick-album"]`, a button).
    6.  **[FN]** `HomeController.clickCard(id)`: a cover already in the series is taken out (`StagingAreaController.removeAlbum`) with «Undo» for 8 s (`UNDO_MS`); otherwise `AlbumPickerController.pick(id)` -> `onPick` -> `StagingAreaController.addAlbum(album)`. After a series was created, a click starts another series first (`startAnother`).
    7.  **[UI]** `StagingAreaController` tells the change -> `HomeController.seriesChanged` (the suggested name follows the series, `models/homeSeries.js` `nameAfterChange`) -> `redraw`: `HomeView.markCards` (the ring and the place on each chosen cover) and `components/home/HomeDock.js` (the dock: numbered covers, name, «N albums from N artists · the order counts», «Edit order», «Create series»; on the phone the `.phone-action-bar` and the full sheet of the series).
    8.  **[UI]** «Edit order» opens the series panel above the dock (↑ ↓ ✕ per row, `HomeController.move` / `removeWithUndo`); «Add all» (`HomeController.addAll`) adds what the chips show, with «Added N albums. Undo».

### 1.2 The pasted list (F63, F79)
*   **Logic Trace**:
    1.  **[UI]** The same field takes a list: pasting several lines into `#artistScanInput` (`HomeController.pasteIntoField`), or «paste a list» (`[data-home-mode="paste"]`), turns it into `components/home/HomePasteList.js`: one input per album line.
    2.  **[FN]** Every input event checks every line (`models/homePaste.js` `checkPastedLines`, which reads each line with `parsePastedAlbumLine` of `models/albumQuery.js`: only the first " - " separates, so a hyphen in a name is kept; a list number or bullet in front, an en or em dash or a tab as the separator and a space missing on one side are accepted; a hyphen with no space on either side never separates). Each line says «ready» or what to fix; the foot says «N lines: N ready, N to fix…» and the button «Add N albums» (`pasteSummary`).
    3.  **[UI]** User clicks «Add N albums» (`#btnProcessBulk`). With no ready line the button is off.
    4.  **[FN]** `HomeController.addPastedList(text)` -> `readPastedList(text)` (`models/bulkPaste.js`) -> `stageBulkEntries` searches each good line (`albumSearchService.search(artist, title, { limit: 1 })`) and adds the first result (`toStagedAlbum` -> `StagingAreaController.addAlbum`). One line never stops the others. The button is busy («Adding…») meanwhile.
    5.  **[UI]** `pasteReport` (`models/homePaste.js`) says what the foot shows: «Added N albums. N lines were skipped and are still here to fix.»; each line to fix stays as an input with its reason, and the button becomes «Add this line» / «Add these N lines». No toast, no `alert`.

### 1.3 Create the series (F79)
*   **Logic Trace**:
    1.  **[UI]** The name is already there, suggested from the artists («Pink Floyd selection»), in `#seriesNameInput` in the dock (on the phone, `#homeChosenName` in the sheet); typing in it keeps it (`HomeController.setName`).
    2.  **[UI]** User clicks «Create series» (`#btnCreateSeries`, `#btnCreateSeriesPhone` or `#btnCreateSeriesSheet`).
    3.  **[FN]** `HomeController.createSeries()`:
        -   With no album the button is off; with no name nothing is created: the state `noname` draws «Give the series a name first.» and «Use «suggested name»», and the focus goes to the name.
        -   `creating`: «Creating…» busy, «Saving your series…» with the small equalizer moving.
        -   `writeSeries(name, albums)` builds the queries with `toAlbumQuery` (`models/albumQuery.js`), in the order of the series, and asks **[FN]** `SeriesService.createSeries({ name, albumQueries, status: 'pending' })`.
        -   `created`: the dock says «"name" is saved», «Blend it now» -> `router.navigate('/blend?seriesId={id}')`, «Open the series» -> `router.navigate('/albums/{id}')`, «Start another series» -> `startAnother()`. The Home stays.
        -   `failed`: the albums stay, the words say the series was not saved (the connection, only when the failure is of the network) and the button becomes «Try again».

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
    1b. **[UI]** Inside the modal, adding albums is the one album picker (`AlbumPickerPanel` -> `AlbumPickerController`, F57): the same trace as 1.1 steps 1 to 5 (same states, deadlines, filters, card and classification). The only difference is the last step: `onPick` -> `SeriesEditModal.addAlbum(album)` -> `toAlbumQuery(album)` joins the list of the series being edited ("Added: …", or "Album already in list"). Nothing is written yet.
    2.  **[UI]** "Save Changes" -> `SeriesEditModal.saveChanges()`: the button shows "Saving…", busy and disabled, until the write answers; a second click asks nothing (`models/seriesDraft.js`).
    2b. **[FN]** `SeriesService.updateSeries(id, ...)` saves the name and the album queries. When it fails the modal stays open with the name and the list as the person left them and says "The series could not be saved. Your changes are still here: you can try again.".
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
    1.  **[UI]** `BlendIngredientsPanel` renders only the inputs that change the result of the chosen recipe (F62): the balanced recipe shows Target Duration and Ranking Source; a Top N recipe shows Top #, Grouping Tracks and Playlist Structure, and Target Duration unless the structure is "Single". There is no "Discovery Mode" (no recipe read it).
    2.  **[FN]** `onConfigChange` updates `this.config`.
*   **Step 4: Generate**
    1.  **[UI]** User clicks "Blend It!".
    2.  **[FN]** `BlendingMenuView.handleGenerate()` -> `BlendingController.generateFromSeries(seriesId, config, { onProgress, signal })`.
    3.  **[FN]** `albumAsks.albumsOf({ series, sources, signal })` (F56, `services/albums/AlbumAsks.js`): the series joins the load in force in `AlbumLoadService`. What the albums screen loaded or the browser keeps is not asked again; what is missing goes through the same queue, ahead of what the albums screen still has to load. `sources` are the ones the recipe reads (`models/recipeSources.js`: popularity, acclaim, own ranking, or acclaim and popularity for the balanced ranking); the blend waits for those, each behind the 20 s deadline of a source.
    4.  **[UI]** While it waits: "Loading albums: i of n..." and then "Waiting for the ratings of i of n albums...".
    5.  **[FN]** The answer is typed (`models/albumAsk.js`): the albums that are ready, the ones that failed with the reason, the sources missing for some album. The blend goes on with the albums that are ready; it stops, with the reasons on screen, only when none is ready.
    6.  **[Service]** `PlaylistGenerationService.generate()` executes algorithm. Each recipe is held to what its name says by `test/algorithms/recipes.promise.test.js` (F62): Top N by popularity, by acclaim (an unrated track never above a rated one) or by the person's own ranking; the balanced recipe with every Deep Cuts playlist within the chosen duration. Each generated playlist carries the whole recipe in `_meta` (`generationMeta`).
    7.  **[STORE]** `playlistsStore.setPlaylists(results)`.
    8.  **[UI]** One warning toast per thing left out ("1 of 2 albums could not be loaded and was left out: ...", "Acclaim ratings are missing for 1 of 2 albums ..."). The line of a missing source also names the order the recipe used for those albums instead (F62, `models/recipeSources.js` `fallbacksForRecipe`): "... Their tracks were ordered in album order instead."
    9.  **[FN]** `router.navigate('/playlists?seriesId=...')`.
    10. **[FN]** Leaving the screen while it waits (`BlendingMenuView.destroy`) aborts the ask: the series leaves the load unless the albums screen shows it, and nothing is generated.

---

## 4. Playlist Manager (Single Session)
**File Context**: `views/PlaylistsView.js`, `controllers/PlaylistsController.js`

### 4.1 Playlist CRUD (In-Memory)
Every edit goes through `PlaylistsService._applyEdit` (F62): it builds a new set (the one on screen is not changed in place), records it as a step of the history and shows it. The clicks and the title field are heard in one place, `views/playlists/playlistEditActions.js`, attached once to the container of the screen.
*   **Delete Playlist**:
    1.  **[UI]** Click the trash button in the header of the Playlist Card (`[data-action="delete-playlist"]`).
    2.  **[FN]** `PlaylistsController.deletePlaylist(index)` -> `PlaylistsService.removePlaylist(index)` (a step of the history; counts as an unsaved change, v5.0, F60).
    3.  **[STORE]** `playlistsStore.setPlaylists(remaining, seriesId)`, `setDirty(true)`. Nothing is written before the save.
*   **Rename a playlist** (F62):
    1.  **[UI]** Type over the title of the card (`.playlist-name`, the only editable part: the position and the batch name are drawn beside it) and leave the field or press Enter; Escape gives up.
    2.  **[FN]** `PlaylistsController.renamePlaylist(index, title)` -> `PlaylistsService.renamePlaylist` sets `name` and `title` of that playlist. The title is saved with the batch and read back in edit mode.
    3.  **[UI]** While a title is being typed `PlaylistsView.update()` is deferred, so a redraw does not throw the typed text away.
*   **Remove Track**:
    1.  **[UI]** Click "X" on Track Row.
    2.  **[FN]** `PlaylistsController.deleteTrack(pIndex, tIndex)` -> `PlaylistsService.removeTrack`.
*   **Reorder**:
    1.  **[UI]** Drag & Drop tracks (handled by `PlaylistsDragHandler`).
    2.  **[FN]** `PlaylistsService.moveTrack(...)` -> a step of the history -> updates the store. A track dropped where it was records nothing.
*   **Undo / Redo** (F62):
    1.  **[UI]** "Undo" and "Redo" in "Actions & Export" (`[data-action="undo-edit"]`, `[data-action="redo-edit"]`), drawn disabled from `playlistsStore.canUndo` / `canRedo`. No keyboard shortcut.
    2.  **[FN]** `PlaylistsController.undo()` / `redo()` -> `PlaylistsService.undo()` / `redo()` -> `PlaylistHistoryService`.
    3.  **[FN]** The history is of the set the service last showed: it starts at the set as it came to the screen and starts again when another set comes (blend, generate again, a batch opened, a save). `isDirty` goes back to false when every change is undone.
*   **Edit mode (`/playlists/edit`)**:
    1.  **[FN]** `PlaylistsController.loadPlaylistsForEdit(batchName, seriesId)` puts the saved batch in `playlistsStore`.
    2.  **[FN]** `PlaylistsController.loadAlbumsForSeries(seriesId)` asks `albumAsks.albumsOf` for the albums of the series (F56): what is loaded or kept comes at once. A warning toast says which albums could not be loaded and how many. A second ask, which nobody waits for, keeps every source coming while the screen is open; `PlaylistsController.destroy` aborts both.
*   **Generate again with another recipe**:
    1.  **[UI]** "Regenerate Playlists" in the reconfigure panel -> `PlaylistsController.handleGenerate(config)`. The panel opens on the recipe the playlists on screen were generated with (`PlaylistsGridRenderer.generatedWith` reads their `_meta`) and keeps what the person changed in it through every redraw (`RegeneratePanel.pending`); after a generation `RegeneratePanel.reset()` makes it follow the playlists again (F62).
    2.  **[FN]** `BlendingController.regenerate(config, { signal })` asks `albumAsks.albumsOf` again with the sources of the new recipe, generates from the albums that are ready and returns the notices; the controller shows them as warning toasts. The question "No ratings detected... Continue?" no longer exists.

### 4.2 Export & Save
*   **Save Batch**:
    1.  **[UI]** Enter Name -> Click "Save to Series History".
    2.  **[FN]** `PlaylistsController.handleSave()` -> `PlaylistsService.saveCurrentBatch({ batchName })` (for the person signed in, known to the service since the second slice of F58) -> `PlaylistRepository.replaceBatch(playlists, replacedIds)` (v5.0, F60). One atomic write: in edit mode the playlists of the original batch name that are not in the new set are removed in the same write, so a failure leaves the saved batch as it was. The button is drawn disabled from `playlistsStore.isSaving` while the write is on its way.
*   **Leave with unsaved changes** (v5.0, F60):
    1.  **[UI]** A link or button of the app, the browser's back button, closing or reloading the tab.
    2.  **[FN]** `unsavedChangesGuard` (installed by `PlaylistsView.mount`) asks `PlaylistsService.hasUnsavedChanges()`; the router's `beforeNavigate` hook shows a confirm, `beforeunload` shows the browser's own.
*   **Reload with playlists not saved yet** (v5.0, F60):
    1.  **[FN]** `PlaylistsController.initialize()` (create mode, nothing in memory) -> `PlaylistsService.restoreDraft({ seriesId })` -> toast "Your unsaved playlists were restored" -> `loadAlbumsForSeries(seriesId)`.
*   **Spotify Export** (F62):
    1.  **[UI]** Click "Export to Spotify" -> `SpotifyExportModal`. The text under the export button follows the mode ("Merge All" / "Separate Playlists").
    2.  **[FN]** `SpotifyExportModal.handleExport()` (one at a time) -> `SpotifyExportService.exportPlaylists()`.
    3.  **[FN]** The service renews an expired access first (`SpotifyAuthService.getAccessToken`), matches each track (the Spotify address the track carries, else `SpotifyService.searchTrack`), then creates and fills one playlist (merge) or one per playlist (separate). `SpotifyService._fetch` renews the access once on a 401 and repeats the call; on a 429 with `Retry-After` up to 30 s it waits and repeats.
    4.  **[FN]** What this session already created is not created again (`services/export/exportLedger.js`); a playlist created without all its tracks gets the rest.
    5.  **[UI]** The modal ends on the report: "Created (n)" with a link "Open in Spotify" for each playlist, "Created without all their tracks", "Not created", "No track found", the reason it stopped, and "Connect to Spotify again" (the access could not be renewed) or "Try again".
*   **Apple Music Export** (F62):
    1.  **[UI]** Click "Export to Apple Music" -> `handleExportToAppleMusic({ btn })` (`views/playlists/PlaylistsExport.js`). A click while an export runs creates nothing and says so; the button shows the step.
    2.  **[FN]** `AppleMusicExportService.exportPlaylists()` authorizes, makes or finds the folder of the series, and creates one playlist per playlist ("i. Batch - Title"). A playlist Apple Music refuses is reported and the others are still tried.
    3.  **[FN]** A playlist created in this session is not created again: the id Apple Music gave is remembered in `exportLedger` (the library is not searched).
    4.  **[UI]** `appleExportMessages(report)` -> toasts of 12 s: what was created, what was not and why, tracks not found, a folder that could not be made.

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
**File Context**: `views/InventoryView.js`, `controllers/InventoryController.js`, `models/inventoryStatus.js`, `models/inventoryFilter.js`, `models/inventoryFromSeries.js`, `models/inventorySort.js`, `models/inventoryRatings.js`, `models/albumAverages.js`, `controllers/InventoryValues.js`, `models/inventoryValue.js`, `models/inventoryValueRun.js`, `models/buyLinks.js`, `services/inventory/InventoryValueService.js`, `views/renderers/InventoryCardValue.js`, `views/renderers/InventoryValueHeader.js`, `components/InventoryValueSection.js`

### 6.1 Logic & Calculations
*   **Status** (F71): an item is Owned, Not Owned or on the Wishlist. The stored field is `owned` (`true`, `null` or missing, `false`); `models/inventoryStatus.js` is the one place that reads and writes it (`statusOf`, `ownedValueOf`). The card, the filter, the counts, the album window and the toast of a change ask that module.
*   **Filtering**:
    1.  **[UI]** Search box, Format select, and the three status counts of the header, which are buttons (F75, REQ-02): pressing one shows only that status (`aria-pressed`), pressing it again shows all. There is no status select.
    2.  **[FN]** `handleFilterChange(type, value)` -> `applyFiltersAndSort()` -> `filterInventory(items, filters)` (`models/inventoryFilter.js`). The three filters apply together.
*   **Sorting** (F71, S-56):
    1.  **[UI]** Select `#inventorySort`: `Artist (A-Z)` (default), `Artist (Z-A)`, `Avg Rating (↓)`, `Avg Rating (↑)`, `Avg Pop (↓)`, `Avg Pop (↑)`, `Value (↓)`, `Value (↑)` (F75: by the estimated value in USD, read from `state.value.usdOf`), `Newest`, `Oldest`.
    2.  **[FN]** `handleSortChoice(value)` -> `sortingFor(value)` -> `applyFiltersAndSort()` -> `sortInventory(items, sorting)` (`models/inventorySort.js`). The averages and the date start with the highest/newest first; an item with no value comes last whatever the direction; ties fall back to artist and title. `Recently added` reads `addedToInventory` (or `createdAt`), a Firestore timestamp (`{ seconds }`) or a date.
*   **The card** (F75, REQ-01) is a surface (its own background, a faint edge, the cover reaching the edges) with the same five lines in every card (`views/renderers/InventoryCardValue.js` `cardValueBlock`): the label of the value by status, the origin and the value with `≈`, the two averages with their icons, the label of the actions, the actions. The price paid is no longer on the card. The list view keeps the one small line `Avg Rating: 78.4 · Avg Pop: 42.6%` (`InventoryGridRenderer.renderAverages`) and shows the value beside it (`rowValue`).
*   **Stats Calculation**:
    1.  **[FN]** `calculateStats()` runs on every update.
    2.  **[LOGIC]**
        -   `Total Count` ("N albums"): the items in the grid (the three filters).
        -   The two totals (F75, REQ-07): `totalsOf(items, valueFor, rates)` (`models/inventoryValue.js`), the estimated value of what is Owned and of what is not, each with how many items have a value; of the items that pass the search and the format. `purchasePrice` is no longer added up.
        -   `✓ n Owned`, `n Not Owned`, `♡ n Wishlist`: `statusCountsFor(items, filters)`, the items that pass the search and the format, by status. The status filter is left out, so choosing one status does not turn the other two into zero.
*   **Currency** (F75, REQ-08):
    1.  **[UI]** Four buttons in the totals strip (`#currencySelector`): USD, EUR, GBP, BRL.
    2.  **[FN]** `handleCurrencyChoice(code)` -> `InventoryValues.chooseCurrency` keeps the choice in `localStorage` (`inventoryCurrency`) and draws again; values are kept in USD and converted with the rates of the day (`convert`, `moneyOf`). With no rates the screen stays in USD and says so.
*   **The value of an item** (F75, S-57): `valueOfItem(item, { reading, now, source, progress })` (`models/inventoryValue.js`) answers what the person wrote (`item.value`), else the newest Discogs reading, whatever its age (kept in the item, `item.discogsReading`, in the database; or held by the browser cache for six hours), with the date it was read, else none with the reason. `InventoryValues.view(items, counted)` gives the screen the value of every item, the totals, the currency, the switch and the run.
*   **Update values** (F75, REQ-09):
    1.  **[UI]** Button `#updateValuesBtn` ("Update values"), only while the Discogs values are on; the notice `#valuesWaitingNotice` ("N albums are waiting for a value." / "Read them now") and, while it runs, `#valuesReadingNotice` with "Stop".
    2.  **[FN]** `InventoryController.handleUpdateValues()` -> `InventoryValues.updateAll()`: the items with no written value and no reading younger than six hours (`itemsToRead`; the six hours only guard against asking Discogs twice in a row); "Read them now" passes `{ onlyNeverRead: true }`. A reading only the browser holds is first kept in its item. Opening the screen never starts it.
    3.  **[SERVICE]** `inventoryValues.readMany(items, { signal, onProgress, onItem })`: one album at a time through `POST /api/album-value`; each reading goes to the browser cache for six hours and is kept in its item, with the edition, in parts of 25 (`InventoryService.setReadings`). "Wait" is waited; the token refused, no sign-in and the source turned off stop the run.
    4.  **[UI]** `InventoryView.showValues(state, itemId)` draws the button, the notice, the totals and that one card in place; the end is a toast with the counts (`valuesOutcome`).
*   **The album window** (F75): `components/InventoryValueSection.js` adds "Estimated value" (the three conditions and the mean, the edition with its link, "Read again", the field to write a value, "Use the Discogs value instead") and "Where to buy" (the three stores, `models/buyLinks.js`). The window asks the controller: `valueViewOf`, `handleWriteValue`, `handleForgetValue`, `handleReadValue`.
*   **The switch** (F75, REQ-10): `inventoryValues.sourceState()` asks `GET /api/value-sources` once when the screen opens. Off: no button, no notice, no Discogs value; `showDiscogsNotice(false)` hides the API sentence of the footer.
*   **The suggestion refused** (F75, 2026-11-20): Discogs gives price suggestions only to an account with seller settings. The server then answers the lowest price for sale (`kind: 'lowest_for_sale'`, `suggestions: 'seller_settings_missing'`); `readOutcomeOf` makes a reading with `basis: 'lowest_for_sale'`; `InventoryValueService` remembers the refusal for six hours (`sellerSettingsMissing()`) and asks with `prices: 'lowest'`; each new run tries the suggestion once. The card says "Discogs · 18 Nov" over "CD · lowest" (a suggestion says "CD · suggested"), the notice `#valuesSellerSettingsNotice` says what to do, the window shows "Lowest price for sale on Discogs".

### 6.2 Inventory CRUD
*   **Status Change**:
    1.  **[UI]** Change Dropdown (Not Owned / ✓ Owned / ♡ Wishlist).
    2.  **[FN]** `handleStatusChange(id, status)`.
    3.  **[SERVICE]** `inventoryService.updateAlbum(id, { owned: ownedValueOf(status) })` (since F58; it writes through the repository and then changes the store). The toast is "Moved to Collection", "Moved to Wishlist" or "Marked as Not Owned"; when the write fails, "Failed to update status" and the screen is drawn again from the store.
*   **Add the albums of my series** (F71):
    1.  **[UI]** Button `#addSeriesAlbumsBtn` ("Add the albums of my series") in the filters row.
    2.  **[FN]** `InventoryView.handleAddSeriesAlbums()` -> `InventoryController.handleAddSeriesAlbums({ confirm })`. The button is disabled and says what is being done (`showSeriesAdd`), without a full redraw.
    3.  **[SERVICE]** `readSeriesOfThePerson()` (`services/inventory/inventoryWiring.js`) reads the series from Firestore; `inventoryService.planSeriesAlbums(series)` reads the inventory and asks `planSeriesAlbums` (`models/inventoryFromSeries.js`) which albums go in. No album is loaded and nothing is asked of Apple Music: the item carries what the series query carries.
    4.  **[UI]** `dialogService.confirm`: "N albums from your S series will be added as Not Owned. M albums already in your inventory stay as they are." With nothing to add, a toast says so and nothing is written.
    5.  **[SERVICE]** `inventoryService.addAlbumsAsNotOwned(toAdd, { onProgress })` writes in parts of 100 through `InventoryRepository.addBatch` (one Firestore batch per part), then reads the inventory once.
    6.  **[UI]** "Added N albums as Not Owned." or, when a part fails, how many went in and how many did not (running the action again adds only the rest).
*   **Update ratings** (F71, S-56):
    1.  **[UI]** Button `#updateRatingsBtn` ("Update ratings") in the filters row, next to the one that adds the albums of the series. While one of the two runs, both are disabled and the one that runs says what it is doing (`showRatings`, `showSeriesAdd`).
    2.  **[FN]** `InventoryView.handleUpdateRatings()` -> `InventoryController.handleUpdateRatings({ confirm })`. With more than 30 albums `dialogService.confirm` asks "Read the ratings of N albums? This can take a few minutes." Leaving the screen (`InventoryView.destroy()` -> `controller.dispose()`) aborts the ask.
    3.  **[SERVICE]** `inventoryService.updateAverages({ signal, onProgress })` makes ONE ask to the album load, `albumAsks.albumsOf({ series: [{ id: 'inventory-ratings', albumQueries }], sources: ['acclaim', 'popularity'], signal, onProgress })`, one query per item (`queryOfItem` in `models/inventoryRatings.js`). The service never calls the network or the cache by itself. The button says "Reading ratings… 40 of 211".
    4.  **[LOGIC]** Each ready album goes back to its item with `findInInventory` (the one identity rule); `averagesOfAlbum(album)` (`models/albumAverages.js`) makes `{ rating, popularity, ratedTracks, popTracks }`; an average a source gave nothing for keeps the value the item had.
    5.  **[SERVICE]** The `averages` of the items are written in parts of 100 through `InventoryRepository.setAverages` -> `BaseRepository.updateMany` (one Firestore batch per part; it never creates). The button says "Saving ratings…"; the store is told once, at the end.
    6.  **[UI]** "Ratings updated for N of M albums." plus, only when true, how many were not found, how many had no ratings, that Spotify is not connected (popularity was not read for K albums), and that a source did not answer; when a part fails, how many were saved (running it again saves the rest).
*   **Delete**:
    1.  **[UI]** Click Delete Button -> Confirm.
    2.  **[FN]** `InventoryController.handleDelete(id)` calls `inventoryService.removeAlbum(id)` (since F58), which removes the item through `InventoryRepository.removeAlbum` and then from the store's list; the toast is "Album removed from inventory" or, on failure, "Failed to delete album".
