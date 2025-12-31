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

## Phase 3: SafeRender Foundation (Security First)
*Goal: Eliminate `innerHTML` usage in core components before migration.*

- [x] **Create `SafeDOM` Utility**:
    - [x] Create `public/js/utils/SafeDOM.js`
    - [x] Implement `create(tag, props, children)`
    - [x] Implement `clear(element)`
- [x] **Upgrade Core Components**:
    - [x] Refactor `Card.js` -> Use `SafeDOM`
    - [x] Refactor `TrackRow.js` -> Use `SafeDOM`
    - [x] Refactor `BaseModal.js` -> Use `SafeDOM`
- [x] **Verification**:
    - [x] Test `SavedPlaylistsView` (Pilot) with new Safe components.
    - [x] Inspect DOM to ensure no regression in structure.
    - [x] Fix `BatchGroupCard.js` to use `renderHTML()`.

## Phase 4: Holistic Migration (The Safe Grind)
*Goal: Eradicate legacy patterns everywhere using Safe Components.*

- [x] **Migrate Rankings**:
    - [x] Refactor `RankingView.js` -> Use `TrackRow` (Safe)
    - [x] Refactor `ConsolidatedRankingView.js` -> Use `TrackRow` (Safe)
- [x] **Migrate Inventory**:
    - [x] Refactor `InventoryGridRenderer.js` -> Use `Card` (Safe)
    - [x] Verify selection/multi-select logic
- [x] **Migrate Albums Grid**:
    - [x] Refactor `AlbumsGridRenderer.js` -> Use `Card` (Safe)
    - [x] Deprecate `AlbumsGridRenderer` (if possible, or keep as simple wrapper)
- [ ] **Migrate Playlists**:
    - [ ] Refactor `PlaylistsDragDrop.js` -> Update selector to `.track-row`
    - [ ] Verify Drag & Drop still works

## Phase 5: Cleanup & Final Hardening
*Goal: Complete 0 `innerHTML` policy.*

- [x] **Global Scan**: Run grep for `innerHTML` (Goal: 0 matches)
- [x] **Fix Residual Sinks**:
    - [x] Utilities/Helpers
    - [x] One-off views (`BlendingMenuView`, `HomeView`)
- [x] **Delete Legacy**:
    - [x] `src/components/base/`
    - [x] `src/components/shared/`
    - [x] `src/components/common/`
- [ ] **Documentation**:
    - [x] Update `COMPONENT_REFERENCE.md`

## Phase 6: Critical Export Integrity (Hotfix) ✅
*Goal: Ensure matched IDs are preserved during export + Unify search logic.*

- [x] **Storefront Strategy**:
    - [x] Add `getBrowserStorefront()` to `MusicKitService`
    - [x] Remove eager `authorize()` from `init()` (lazy authorize)
    - [x] Add `authorizeAndValidate()` for persist-time check
- [x] **Edit Modal Search Refactor**:
    - [x] Replace Autocomplete with artist scan + filters
    - [x] Use `getArtistDiscography` (same as Home)
    - [x] Add filter buttons (Albums/Singles/Live/Compilations)
- [x] **Deprecations**:
    - [x] Mark `Autocomplete.js` as deprecated (still used elsewhere, not deleted)
    - [x] Mark `MusicKitSearchAdapter.js` as deprecated (no longer used by SeriesModals)
- [x] **Verification**:
    - [x] Test search with browser locale (no authorize popup on init)
    - [x] Test artist scan finds "Pink Floyd", "trex" correctly
    - [x] Test adding albums to series

See: [Phase 6 Hotfix Plan](./phase6-hotfix-plan.md)
