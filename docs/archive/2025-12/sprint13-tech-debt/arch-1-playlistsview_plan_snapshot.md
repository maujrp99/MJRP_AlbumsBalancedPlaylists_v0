# Plan: ARCH-1 PlaylistsView Refactor (SDD)

## 1. Goal
Refactor the monolithic `PlaylistsView.js` (God Class) into a modular, maintainable architecture following the V3 "Thin Orchestrator" pattern.

## 2. Architecture Strategy
We will split `PlaylistsView` into four distinct responsibilities:

1.  **Orchestrator (`PlaylistsView.js`)**:
    - Initializes components.
    - Subscribes to Stores.
    - Routes DOM events to Controller.
    - Passes State to Renderer.

2.  **Controller (`PlaylistsController.js`)**:
    - Handles **Business Logic**.
    - Interacts with `PlaylistsStore`, `AlbumsStore`, `AlbumSeriesStore`.
    - Manages API calls (Export, Save).
    - **Pure JavaScript** (no DOM manipulation).

3.  **Renderer (`PlaylistsGridRenderer.js`)**:
    - Handles **HTML Generation** (Pure functions or Stateless class).
    - Returns HTML strings for Grid, Controls, Settings.
    - **No State**, only Props.

4.  **Interaction (`PlaylistsDragHandler.js`)**:
    - Manages **Complex UI Interactions**.
    - Wraps `SortableJS` logic.
    - Emits events back to Controller/Store.

### Diagram
```mermaid
graph TD
    View[PlaylistsView (Orchestrator)] --> Controller[PlaylistsController]
    View --> Renderer[PlaylistsGridRenderer]
    View --> Drag[PlaylistsDragHandler]
    
    Controller --Updates--> Store[PlaylistsStore]
    Store --Emits Change--> View
    
    Drag --User Action--> Store
    Drag --User Action--> Controller
```

## 3. Component Strategy

### 3.1 PlaylistsController (`controllers/PlaylistsController.js`)
**Role**: mediator between View and Data.
**Methods to Transfer**:
- `generatePlaylists(config)` -> calls `PlaylistGenerationService`.
- `saveToHistory(batchName)` -> calls `Repo`.
- `exportToSpotify/Apple/JSON`.
- `undo()`, `redo()`.
- `loadInitialData()` -> manages `mount` data fetching.

### 3.2 PlaylistsDragHandler (`components/playlists/PlaylistsDragHandler.js`)
**Role**: Encapsulate SortableJS complexity.
**API**:
- `constructor(container, callbacks)`
- `setup(gridElement)`
- `destroy()`
- **Callbacks**: `onReorder(playlistId, newIndex)`, `onMoveTrack(from, to, trackIdx, newIdx)`.

### 3.3 PlaylistsGridRenderer (`components/playlists/PlaylistsGridRenderer.js`)
**Role**: HTML Templates.
**Methods**:
- `renderGenerationsControls(playlists, activeSeries)`
- `renderSettings(algorithms, rankingStrategies)`
- `renderEmptyState()`
- `renderActionsPanel()`

### 3.4 PlaylistsView (`views/PlaylistsView.js`)
**Role**: Glue code.
**Structure**:
```javascript
class PlaylistsView extends BaseView {
  mount() {
    this.controller = new PlaylistsController();
    this.renderer = new PlaylistsGridRenderer();
    this.dragHandler = new PlaylistsDragHandler();
    
    this.subscribeStores();
  }
  
  update() {
    const state = store.getState();
    this.container.innerHTML = this.renderer.render(state);
    this.dragHandler.setup(this.container); // Re-init drag if needed
    this.attachListeners();
  }
}
```

## 4. UI/UX Consolidation (Critical)
**Addressing User Feedback**: "Edit view should be the same as the playlist creation view".

Currently, `EditPlaylistView.js` is a separate, outdated implementation using inline HTML rendering, while `PlaylistsView.js` uses the modern `PlaylistGrid` component.

**Strategy**:
We will **deprecate** `EditPlaylistView.js` and handle the "Edit" route within the new `PlaylistsView.js` architecture.
The `PlaylistsController` will determine the mode (`CREATE` vs `EDIT`) based on URL parameters.

| Feature | Creation View (New) | Edit View (Old) | **Consolidated View (Goal)** |
| :--- | :--- | :--- | :--- |
| **Grid Rendering** | `PlaylistGrid.js` (Component) | Inline HTML (Legacy) | **`PlaylistGrid.js`** (Unified) |
| **Batch Naming** | Modal on Save | Top Input Field | **Top Input Field** (Visible in Edit Mode, Optional in Create) |
| **Algorithms UI** | Dropdown Selector (Legacy) | `RegeneratePanel` (Advanced) | **`RegeneratePanel`** (Unified) |
| **Reconfigure Access** | Hidden until Saved | Always Available | **Always Available** (Created & Edit) |
| **Save Action** | "Save to History" | "Save Changes" | **Context-Aware Button** |
| **Delete Playlist** | Via Grid (Drag/Drop) | Explicit Button | **Explicit Button** (In Edit Mode) |

### Changes Required:
1.  **Router**: Point `/playlists/edit` to `PlaylistsView`.
2.  **Renderer**: Add `renderBatchNameInput()` (conditionally rendered).
3.  **Controller**:
    *   `initialize()`: Detect Edit Mode -> Load Data.
    *   `save()`: If Edit Mode -> Update Batch; Else -> Create Batch.
    *   `deletePlaylist(index)`: Handle removal from store.
    *   **UX Fix**: Allow `RegeneratePanel` to operate on in-memory playlists (Create Mode) without requiring a saved series ID.

## 5. Verification Plan
- [ ] **Creation Flow**
    - Generate Playlists (Balanced/Spotify/BEA).
    - **Verify Reconfigure Panel is visible/active immediately.**
    - Drag & Drop tracks.
    - Save (New Batch).
- [ ] **Edit Flow** (The fix for UI discrepancy)
    - Open existing batch.
    - **Verify UI matches Creation View**.
    - Rename Batch via Input.
    - **Delete Individual Playlist**.
    - Save (Overwrite).
- [ ] **Regression**
    - Verify "Generate" button works.
    - Verify Export to JSON/Spotify.
