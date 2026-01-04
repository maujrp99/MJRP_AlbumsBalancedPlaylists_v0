# Sprint 16 Implementation Plan: Modal Modernization

**Feature**: Legacy Modal Eradication & DialogService Implementation
**Status**: Planning
**Author**: Antigravity (AI Agent)

---

## 📅 Goal Description
The objective is to eliminate the legacy `Modals.js` file (17KB, 6 innerHTML sinks) and modernize the application's modal architecture. We will introduce a centralized `DialogService` built on top of the existing safe `BaseModal` and `SafeDOM`, and refactor `Toast.js` to remove its innerHTML usage.

## 🏗️ Architecture

### 1. DialogService (`public/js/services/DialogService.js`)
A singleton service that abstracts the creation and management of standard user interactions.
- **Methods**:
  - `confirm(options)`: Shows a confirmation dialog (returns Promise).
  - `prompt(options)`: Shows a single-input dialog (returns Promise with value).
  - `alert(options)`: Shows an alert dialog (returns Promise).
  - `custom(component, props)`: Renders a custom SafeDOM component within a BaseModal.

### 2. Standard Modal Components (`public/js/components/ui/modals/`)
Reusable, stateless components constructed with SafeDOM.
- **`ConfirmModal.js`**: Renders title, message, and Confirm/Cancel buttons.
- **`InputModal.js`**: Renders title, input field (with validation support), and Save/Cancel buttons.

### 3. Toast Modernization (`public/js/components/Toast.js`)
- Refactor the existing module to construct DOM elements using `SafeDOM` instead of template strings.
- Maintain exact API compatibility (`showToast`, `toast.success`, etc.).

## 🔄 Migration Strategy (The "Modal-Swap" Operation)

### Phase 1: Infrastructure
1.  Create `ConfirmModal` and `InputModal`.
2.  Implement `DialogService` logic manually (no library deps).

### Phase 2: Refactor Consumers (Replacing `Modals.js`)
We will replace calls in `Modals.js` with `DialogService` equivalents in the consuming files.

| Legacy Method | Replacement Pattern | Notes |
| :--- | :--- | :--- |
| `showDeleteAlbumModal` | `DialogService.confirm({...})` | Simple "Are you sure?" |
| `showDeletePlaylistModal` | `DialogService.confirm({...})` | Includes track count in message |
| `showDeleteBatchModal` | `DialogService.confirm({...})` | Simple confirmation |
| `showEditSeriesModal` | `DialogService.prompt({...})` | Needs validation logic mapped to prompt |
| `showSavePlaylistsModal` | `DialogService.prompt({...})` | Needs default value support |

### Phase 3: Toast Hardening
- Rewrite `Toast.js` using `SafeDOM`.

## 🎨 UI/UX Strategy
- **Visuals**: Maintain the current "glass-morphism" aesthetic defined in `BaseModal`.
- **Interaction**:
  - **Promise-based API**: `await Dialog.confirm(...)` is cleaner than callback passing.
  - **Keyboard**: Ensure `Escape` to close and `Enter` to confirm work (already in BaseModal, verify for new components).
  - **Focus**: Auto-focus input in `InputModal`.

## 🧪 Verification Plan

### Automated Tests
- None (limited test infrastructure for UI). We rely on manual verification.

### Manual Verification Checklist
1.  **Toast Test**:
    - Trigger `toast.success()` and `toast.error()`.
    - Verify icon rendering and animation.
    - Verify close button works.
2.  **Delete Flow (ConfirmModal)**:
    - Try to delete an Album (Inventory).
    - Try to delete a Playlist.
    - Verify "Cancel" closes without action.
    - Verify "Confirm" executes action.
3.  **Edit Flow (InputModal)**:
    - Edit a Series Name.
    - Verify validation (empty name should disable save or show error).
    - Verify "Save" updates the name.
4.  **Save Flow**:
    - Generate Playlists -> Click "Save to Library".
    - Verify Prompt shows default name.
    - Change name -> Save.

## 📝 Task List
1.  [ ] Create `public/js/components/ui/modals/ConfirmModal.js`
2.  [ ] Create `public/js/components/ui/modals/InputModal.js`
3.  [ ] Create `public/js/services/DialogService.js`
4.  [ ] Refactor `Toast.js` to SafeDOM
5.  [ ] Refactor `SeriesView.js` (Delete/Edit Series calls)
6.  [ ] Refactor `SavedPlaylistsController.js` (Delete/Edit Playlist calls)
7.  [ ] Refactor `InventoryController.js` (Delete Album calls)
8.  [ ] Refactor `PlaylistsExport.js` (Save Batch call)
9.  [ ] Delete `Modals.js`

## 🏷️ Feature: Batch Naming Consistency (Architecture Update)

### Goal
Establish a robust system for naming Playlist Batches across Creation, Regeneration, Editing, and Saving, preventing "Ghost Playlists" and ensuring UX consistency.

### Core Concepts
1.  **Creation Mode (Wizard)**: Uses `defaultBatchName` (Format: "TheAlbumBlender Playlist [YYYY-MM-DD HH:mm]") to allow "One-Click Save".
2.  **Edit Mode**: Preserves `originalBatchName`. Input defaults to this name.
3.  **Renaming**: System tracks `originalBatchName` vs `currentBatchName`. On Save, if they differ, the original batch is overwritten (deleted then re-saved) to prevent duplication.

### Data Flow Architecture
-   **Store (`playlistsStore.js`)**: Single Source of Truth.
    -   `defaultBatchName`: Set by Controllers on generation.
    -   `editContext`: Stores `{ originalBatchName, currentBatchName }`.
    -   `persistence`: Saves these states to `localStorage` to survive page refreshes.
-   **Controllers**:
    -   `BlendingController`: Centralizes default name generation.
    -   `PlaylistsController`: Handles "Save" logic (detecting Rename/Overwrite scenarios).

### Missing Gaps Addressing
-   **Export**: Now falls back to `defaultBatchName` if no custom name is entered.
-   **Persistence**: Store now saves `defaultBatchName` and `editContext` to `localStorage`.
