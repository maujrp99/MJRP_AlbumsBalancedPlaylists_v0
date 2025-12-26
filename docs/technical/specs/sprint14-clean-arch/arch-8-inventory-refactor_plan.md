# ARCH-8: InventoryView V3 Refactor Implementation Plan

**Spec**: [arch-8-inventory-refactor_spec.md](arch-8-inventory-refactor_spec.md)

## Goal
Decouple `InventoryView.js` into Controller + Renderer pattern.

## Proposed Changes

### 1. Create Controller
#### [NEW] `public/js/controllers/InventoryController.js`
- **Responsibilities**:
  - Load albums from `inventoryStore`
  - Handle filtering logic (`filterAlbums`)
  - Handle sorting logic (if any)
  - Handle CRUD delegation (`updatePrice`, `updateStatus`, `deleteAlbum`)
  - Manage selection state (`selectedAlbums` Set)
  - **Dependencies**: `inventoryStore`, `albumLoader`

### 2. Create Renderer
#### [NEW] `public/js/views/renderers/InventoryGridRenderer.js`
- **Responsibilities**:
  - `render(state)`: Main entry
  - `renderGrid(albums)`
  - `renderList(albums)`
  - `renderAlbumCard(album)`
  - `renderAlbumRow(album)`
  - `renderFormatBadge(format)`
  - `renderEmptyState()`
  - Helpers: `formatCurrency`, `getAlbumCoverUrl`
- **Dependencies**: `getIcon`, `escapeHtml`

### 3. Refactor View
#### [MODIFY] `public/js/views/InventoryView.js`
- **Changes**:
  - Instantiate `this.controller` and `this.renderer`
  - `mount()`: Delegate data loading to controller
  - `render()`: Call `renderer.render(controller.state)`
  - `attachEventListeners()`: bind events to controller methods
  - Remove all DOM generation methods
  - Remove direct store access (go through controller)

## Verification Plan

### Manual Verification
1. **Load Inventory**: Verify grid/list view renders correctly.
2. **Filtering**: SEARCH for an album, filter by FORMAT (Vinyl), filter by OWNERSHIP.
3. **Selection**: Click checkboxes, verify "Create Series" button appears.
4. **Context Actions**:
   - Changed "Owned" status dropdrown.
   - Edit Price (inline).
   - Delete Album.
5. **Drag & Drop**: (If applicable, though Inventory doesn't seem to have D&D yet per analysis, checking code...)
   - *Correction*: Code analysis shows no SortableJS in InventoryView. Just simple grid.

### Automated Tests
- No existing unit tests for views.
- Will rely on manual verification "Smoke Test".
