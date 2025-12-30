# Sprint 15 Task List: Structural Integrity

**Goal**: Execute ARCH-12 Componentization and Security Hardening.
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Core Foundation (`src/components/ui/`)
*Goal: Establish the new 'Source of Truth' for UI components.*

- [x] **Create Directory Structure**: `src/components/ui/`
- [x] **Create `Card.js`**
    - [x] Port `renderCompactAlbumCard` logic (Grid variant)
    - [x] Port `renderExpandedAlbumCard` logic (List variant)
    - [x] Implement `renderRankingBadge` logic internally
- [x] **Create `TrackRow.js`**
    - [x] Port `TrackItem.js` (Playlists) features (Drag handle, Badges)
    - [x] Implement `variant="ranking"` (Medals 🥇🥈🥉)
    - [x] Verify `draggable` prop logic
    - [x] **Functionality**
        - [x] Sorting (Oldest/Newest)
        - [x] Thumbnails (4-album grid)
        - [x] Delete Batch (with confirmation)
        - [x] Edit Batch (Navigate to Playlist Management)
            - [x] Fix Controller URL Params (`&edit=`)
            - [x] Implement "Batch Not Found" Error State (Replaces "Generation Settings" fallback)
            - [x] Harden Batch Matching Logic (`trim()`)
    - [x] **Verification**
        - [x] Browser Test: Load Data
        - [x] Browser Test: Interactive Elements. (Verified in SavedPlaylists)
- [x] **Create `BaseModal.js`**
    - [x] Standardize Backdrop, Close Button, Animation classes
- [x] **Verification**: Create a temporary test route `/test-components` to render all variants. (Verified in SavedPlaylists)

## Phase 2: Pilot Refactor (`SavedPlaylistsView`)
*Goal: Prove the new architecture on the most complex legacy view.*

- [x] **Create `SavedPlaylistsController.js`**
    - [x] Implement `loadData` (SeriesRepo, PlaylistRepo)
    - [x] Implement `handleEditSeries` (Store Context logic)
    - [x] Implement `handleDelete` flows
- [x] **Refactor `SavedPlaylistsView.js`**
    - [x] Replace `BatchGroupCard` with `Card` (or `BatchHeader` + `Card` variant)
    - [x] Replace manual track HTML with `TrackRow.render`
    - [x] Replace manual Modals with `BaseModal`
- [x] **Verification (Audit Parity)**:
    - [x] Check Sorting (Date/Order/Name)
    - [x] Check Thumbnails (Optimized Loader)
    - [x] Check Edit/Delete Actions (Modals work?)

## Phase 3: Holistic Migration (The Grind)
*Goal: Eradicate legacy patterns everywhere.*

- [ ] **Migrate Rankings**:
    - [ ] Refactor `RankingView.js` -> Use `TrackRow` (`variant="ranking"`)
    - [ ] Refactor `ConsolidatedRankingView.js` -> Use `TrackRow`
- [ ] **Migrate Inventory**:
    - [ ] Refactor `InventoryGridRenderer.js` -> Use `Card`
    - [ ] Verify selection/multi-select logic
- [ ] **Migrate Albums Grid**:
    - [ ] Refactor `AlbumsGridRenderer.js` -> Use `Card`
    - [ ] Deprecate `AlbumsGridRenderer` (if possible, or keep as simple wrapper)
- [ ] **Migrate Playlists**:
    - [ ] Refactor `PlaylistsDragDrop.js` -> Update selector to `.track-row`
    - [ ] Verify Drag & Drop still works

## Phase 4: Security Hardening (Zero Tolerance)
*Goal: 0 `innerHTML` sinks.*

- [ ] **Global Scan**: Run grep for `innerHTML`
- [ ] **Fix Batch 1**: Views (remaining legacy views)
- [ ] **Fix Batch 2**: Components (remaining legacy components)
- [ ] **Fix Batch 3**: Utilities/Helpers
- [ ] **Verification**: Manual Audit of all fixed files

## Phase 5: Cleanup & Documentation
- [ ] **Delete Legacy**:
    - [ ] `src/components/base/`
    - [ ] `src/components/shared/`
    - [ ] `src/components/common/`
    - [ ] `src/components/playlists/TrackItem.js` (replaced)
- [ ] **Update Documentation**:
    - [ ] `UI_STYLE_GUIDE.md` (Add new components)
    - [ ] `COMPONENT_REFERENCE.md`
