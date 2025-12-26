# ARCH-7: Operation Safe Text Implementation Plan (COMPLETED)

**Spec**: [arch-7-security-hardening_spec.md](arch-7-security-hardening_spec.md)

## Goal
Eliminate `innerHTML` usage in Modals and consolidate `escapeHtml` to `utils/stringUtils.js`.

## Proposed Changes

### 1. New Utility Module
#### [NEW] `public/js/utils/stringUtils.js`
- Export `escapeHtml(str)`
- Export `safeHtml(str)` (optional, for later)

### 2. Refactor Modals
#### [MODIFY] `public/js/components/Modals.js`
- Import `escapeHtml` from `../utils/stringUtils.js`
- Remove local `escapeHtml` function
- **Pattern Change**: For dynamic content, use `textContent` where possible or strictly escaped strings.
  - `showDeleteSeriesModal`
  - `showEditSeriesModal`
  - `showDeleteAlbumModal`
  - `showDeletePlaylistModal`
  - `showDeleteBatchModal`
  - `showSavePlaylistsModal`

#### [MODIFY] `public/js/components/InventoryModals.js`
- Same pattern application.

#### [MODIFY] `public/js/components/series/SeriesModals.js`
- Same pattern application.

#### [MODIFY] Other Files (Cleanup)
- `public/js/components/ConfirmationModal.js`
- `public/js/components/EditAlbumModal.js`
- `public/js/components/ViewAlbumModal.js`
- `public/js/components/Toast.js`
- `public/js/views/renderers/AlbumsGridRenderer.js`
- `public/js/views/renderers/AlbumsScopedRenderer.js`
- Update all to import `escapeHtml` from utils.

### 3. Extended Audit (Added post-implementation)
- `public/js/views/BaseView.js` (Method removed)
- `public/js/views/HomeView.js`
- `public/js/views/SeriesView.js`
- `public/js/views/SavedPlaylistsView.js`
- `public/js/views/RankingView.js`
- `public/js/views/InventoryView.js`
- `public/js/views/ConsolidatedRankingView.js`
- `public/js/views/PlaylistsView.js`
- `public/js/views/BlendingMenuView.js`
- `public/js/components/playlists/PlaylistsGridRenderer.js`
- `public/js/components/playlists/PlaylistCard.js`
- `public/js/components/playlists/TrackItem.js`

## Verification Plan

### Manual Verification
1. **Delete Series Modal**:
   - Open modal. Check bold series name renders as text, not HTML tags.
   - Try to inject `<b>Bold</b>` in series name -> should show `<b>Bold</b>`.
2. **Edit Series Modal**:
   - Edit name, check input value hygiene.
3. **Inventory Modals**:
   - Verify specific inventory actions (Edit Price, etc).

### Automated Tests
- None currently for UI, relying on manual regression testing.
