# Dynamic UI & Logic Mapping (Deep Dive)
**Status**: Restarted (v2)
**Objective**: comprehensive mapping of UI Actions -> Code Functions -> Data Flow.

## Legend
- **[UI]**: User Interface Element.
- **[FN]**: Function/Method Call.
- **[API]**: Backend Endpoint.
- **[STORE]**: State Update.

---

## 1. Authentication & Entry (Home)
**File Context**: `views/HomeView.js`, `services/AuthService.js`, `components/TopNav.js`

### 1.1 Social Login Flow
*   **Logic Trace**:
    1.  **[UI]** User clicks "Connect Spotify" button (`#spotifyLoginBtn`).
    2.  **[FN]** `TopNav.attachListeners` -> `document.getElementById('spotifyLoginBtn').addEventListener`.
    3.  **[FN]** `SpotifyConnectButton` initialized (if present) or direct handler. *Correction*: Code shows `SpotifyConnectButton` handles if present, but `TopNav` also has logic.
    4.  **[FN]** `SpotifyAuthService.login()` called.
    5.  **[FN]** `getRedirectUri()` determines host (`http://localhost:3000/api/spotify/callback` observed).
    6.  **[API]** Browser redirects to `accounts.spotify.com/authorize`.
*   **Diagram**:
    ```mermaid
    sequenceDiagram
        participant User
        participant UI as TopNav/ConnectBtn
        participant Service as SpotifyAuthService
        participant Spotify as Spotify Accounts
        User->>UI: Click Connect
        UI->>Service: login()
        Service->>Service: Generate Code Verifier/State
        Service->>Service: Store in LocalStorage
        Service->>Spotify: Redirect (Client ID + Scopes + Redirect URI)
        Spotify-->>User: Auth Page (Observed)
    ```
*   **Verification**: `[SUCCESS]` (Redirect observable, params correct).

## 2. Inventory Management
**File Context**: `views/InventoryView.js`, `controllers/InventoryController.js`, `stores/inventory.js`

### 2.1 Filtering & Logic
*   **Logic Trace**:
    1.  **[UI]** User types "Abbey" in `#inventorySearch`.
    2.  **[FN]** `InventoryController.handleFilterChange('search', 'Abbey')` called.
    3.  **[FN]** `InventoryController.applyFiltersAndSort()` executes.
    4.  **[STORE]** `filteredAlbums` state updated.
    5.  **[FN]** `InventoryView.render()` re-paints grid.
*   **Diagram**:
    ```mermaid
    flowchart LR
        UI["Input(Search)"] -->|Event| Ctrl["Controller.handleFilterChange"]
        Ctrl -->|Update State| Logic["applyFiltersAndSort()"]
        Logic -->|New State| View["View.render()"]
    ```
*   **Verification**: `[SUCCESS]` (Filtered to 1 item).

### 2.2 Status Update
*   **Logic Trace**:
    1.  **[UI]** User selects "Wishlist" from dropdown.
    2.  **[FN]** `InventoryView` delegates `change` event.
    3.  **[FN]** `InventoryController.handleStatusChange(id, 'wishlist')`.
    4.  **[API/STORE]** `inventoryStore.updateAlbum(id, { owned: false })`.
    5.  **[UI]** Toast "Moved to Wishlist".
*   **Verification**: `[SUCCESS]` (Toast appeared, count updated).

## 3. Series & Albums
**File Context**: `views/SeriesView.js`, `controllers/SeriesController.js`, `stores/albumSeriesStore.js`

### 3.1 Series Navigation & Scope
*   **Logic Trace**:
    1.  **[UI]** User selects "Zeppelin Test" from Toolbar Dropdown.
    2.  **[FN]** `SeriesToolbar` fires `onSeriesChange`.
    3.  **[FN]** `SeriesController.handleSeriesChange('TZ0...')`.
    4.  **[FN]** `SeriesController.loadScope('SINGLE', 'TZ0...')`.
    5.  **[STORE]** `albumSeriesStore.setActiveSeries('TZ0...')`.
    6.  **[FN]** `SeriesController.notifyView('header', data)` & `notifyView('albums', list)`.
    7.  **[UI]** `SeriesView.updateAlbums()` re-renders grid.
*   **Diagram**:
    ```mermaid
    sequenceDiagram
        participant UI as Toolbar
        participant Ctrl as SeriesController
        participant Store as AlbumSeriesStore
        participant View as SeriesView
        UI->>Ctrl: handleSeriesChange(id)
        Ctrl->>Ctrl: loadScope(SINGLE, id)
        Ctrl->>Store: setActiveSeries(id)
        Store-->>Ctrl: Updated Series Data
        Ctrl->>View: updateHeader(data)
        Ctrl->>View: updateAlbums(list)
    ```
*   **Verification**: `[SUCCESS]` (URL updated to `?seriesId=...`, Grid filtered).

### 3.2 View Mode Toggle
*   **Logic Trace**:
    1.  **[UI]** User clicks "List/Grid" toggle.
    2.  **[FN]** `SeriesToolbar` fires `onToggleView`.
    3.  **[FN]** `SeriesView.handleToggleView()` (Delegated to View to toggle state/localStorage).
    4.  **[FN]** `SeriesView.refreshGrid()` -> mounts `TracksRankingComparison` (if expanded).
*   **Verification**: `[SUCCESS]` (Switched to Expanded view with rankings).

## 4. Playlist Generation (Blend)
**File Context**: `views/BlendingMenuView.js`, `controllers/BlendingController.js`, `services/PlaylistGenerationService.js`

### 4.1 Wizard State & Generation
*   **Logic Trace**:
    1.  **[UI]** User selects Series ("Zeppelin Test") -> `BlendingMenuView` updates state (`step1Complete`).
    2.  **[UI]** User selects Flavor ("Balanced") -> `BlendingMenuView` updates state (`step2Complete`).
    3.  **[UI]** User clicks "Blend It!".
    4.  **[FN]** `BlendingMenuView.handleGenerate()` calls `BlendingController.generateFromSeries(id, config)`.
    5.  **[FN]** `BlendingController` loads albums -> calls `PlaylistGenerationService.generate()`.
    6.  **[STORE]** `playlistsStore.setPlaylists()` updated with results.
    7.  **[FN]** `router.navigate('/playlists?seriesId=...')`.
*   **Diagram**:
    ```mermaid
    sequenceDiagram
        participant UI as BlendingView
        participant Ctrl as BlendingController
        participant Service as GenerationService
        participant Store as PlaylistsStore
        UI->>Ctrl: generateFromSeries(seriesId, config)
        Ctrl->>Ctrl: loadAlbumsFromSeries()
        Ctrl->>Service: generate(albums, config)
        Service-->>Ctrl: Result (Playlists)
        Ctrl->>Store: setPlaylists(result)
        Ctrl->>UI: router.navigate('/playlists')
    ```
*   **Verification**: `[SUCCESS]` (Generated 60min playlist "Zeppelin Test Vol. 1", redirected).

## 5. Playlist Management (Saved)
**File Context**: `views/SavedPlaylistsView.js`, `components/playlists/SavedPlaylistsController.js`

### 5.1 Rendering & Expansion
*   **Logic Trace**:
    1.  **[FN]** `SavedPlaylistsView.mount()` -> `Controller.loadData()`.
    2.  **[FN]** `Controller` fetches Series & Playlists from Repositories.
    3.  **[FN]** `Controller.processBatches()` groups by batch name.
    4.  **[UI]** `View.render()` creates DOM.
    5.  **[UI]** User clicks Batch Header -> CSS Toggle (`hidden` class removal).
*   **Diagram**:
    ```mermaid
    sequenceDiagram
        participant View
        participant Ctrl as SavedPlaylistsController
        participant Repo as PlaylistRepository
        View->>Ctrl: loadData()
        Ctrl->>Repo: findAll()
        Repo-->>Ctrl: List of Playlists
        Ctrl->>Ctrl: Group into Batches
        Ctrl-->>View: Render Data
    ```
*   **Verification**: `[SUCCESS]` (Rendered batches, toggled expansion).

### 5.2 Delete Batch
*   **Logic Trace**:
    1.  **[UI]** User clicks Trash Icon.
    2.  **[FN]** `View.handleDeleteBatch()`.
    3.  **[UI]** `DialogService.confirm()` shows Modal.
    4.  **[FN]** User confirms -> `Controller.deleteBatch()`.
    5.  **[API]** `PlaylistRepository.delete()` calls for each playlist.
    6.  **[UI]** Toast "Deleted batch".
*   **Verification**: `[SUCCESS]` (Batch removed from UI).

## 6. Data Migration
**File Context**: `views/SaveAllView.js`, `migration/MigrationUtility.js`

### 6.1 Initialization (CRASH)
*   **Logic Trace**:
    1.  **[UI]** User navigates to `/save-all`.
    2.  **[FN]** `SaveAllView.constructor()` executes.
    3.  **[CRASH]** Calls `getFirestore()` from CDN import.
    4.  **[ERROR]** `FirebaseError: No Firebase App '[DEFAULT]' has been created`.
*   **Root Cause**: `SaveAllView.js` imports Firebase SDK directly via CDN and tries to get the default app instance, bypassing the central `app.js` initialization. It should import `db` and `auth` from `../app.js`.
*   **Verification**: `[FAILED]` (Page crashes on load).

---

## Phase 5: Deep Dive Conclusion
All core flows (Home, Inventory, Series, Blending, Saved Playlists) have been mapped and verified as **SUCCESS**, with detailed logic traces and sequence diagrams available above.

**Critical Issue Found:**
*   **Data Migration (`/save-all`)** is broken due to an architecture violation (direct CDN import vs App Context injection).

**Next Steps (Phase 6):**
1.  Consolidate this mapping into the official `dynamic_ui_interactions.md` (or similar) in `docs/`.
2.  **Prioritize Fix**: Repair `SaveAllView.js` to use `app.js` dependencies.
