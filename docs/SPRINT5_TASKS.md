# Sprint 5 Complete Fix - Task List

**Status**: Planning → Awaiting Approval  
**Created**: 2025-12-06T21:12

---

## Phase 1: TopNav & Routes Fix (P1)

- [ ] **1.1** Modify TopNav.js: Update desktop menu to 4 items (Home, Albums Series, Playlist Series, Inventory)
- [ ] **1.2** Modify TopNav.js: Update mobile menu to match desktop
- [ ] **1.3** Update router.js: Add `/albums-series` → SeriesListView
- [ ] **1.4** Update router.js: Add `/playlist-series` → SavedPlaylistsView
- [ ] **1.5** Remove old routes (`/series`, `/saved-playlists`, `/playlists`)

---

## Phase 2: Firebase SDK Standardization (P0)

- [ ] **2.1** Update `series.js` imports to include modular Firestore functions
- [ ] **2.2** Delete duplicate `saveToFirestore()` (lines 159-182) from series.js
- [ ] **2.3** Convert `db.collection()` to modular API in series.js
- [ ] **2.4** Add Firestore modular imports to albums.js
- [ ] **2.5** Convert `db.collection()` to modular API in albums.js
- [ ] **2.6** Verify: No "firebase is not defined" errors

---

## Phase 3: Ghost Albums Fix (P0)

- [ ] **3.1** Modify `reset()` in albums.js to accept `preserveSeriesContext` flag
- [ ] **3.2** Update `loadAlbumsFromQueries()` in AlbumsView.js to call `reset(true)`
- [ ] **3.3** Run `npm run test:e2e -- --grep "ghost"` - verify fix

---

## Phase 4: Code Cleanup (P1)

- [ ] **4.1** Remove `escapeHtml()` from AlbumsView.js (lines 514-519)
- [ ] **4.2** Remove `escapeHtml()` from AlbumsView.js (lines 1117-1122)
- [ ] **4.3** Remove `escapeHtml()` from PlaylistsView.js (lines 509-514)
- [ ] **4.4** Remove `escapeHtml()` from SeriesListView.js (lines 253-258)
- [ ] **4.5** Remove `escapeHtml()` from SavedPlaylistsView.js (lines 154-159)

---

## Phase 5: Playlists Persistence (P0)

- [ ] **5.1** Add `saveToLocalStorage()` method to PlaylistsStore
- [ ] **5.2** Add `loadFromLocalStorage()` method to PlaylistsStore
- [ ] **5.3** Modify constructor to call `loadFromLocalStorage()`
- [ ] **5.4** Modify `setPlaylists()` to call `saveToLocalStorage()`
- [ ] **5.5** Add PlaylistRepository integration to PlaylistsView.handleGenerate()

---

## Phase 6: Inventory & Series UI (P1)

- [ ] **6.1** Add InventoryRepository import to InventoryView.js
- [ ] **6.2** Integrate Firestore save in showEditAlbumModal callback
- [ ] **6.3** Integrate Firestore delete in showDeleteAlbumModal callback
- [ ] **6.4** Debug SeriesListView.js event listeners (check `this.container`)
- [ ] **6.5** Manual test: Series buttons (Edit/Delete/Open)

---

## Verification

- [ ] Run `npm test` (34 unit tests)
- [ ] Run `npm run build` - no errors
- [ ] Run `npm run test:e2e`
- [ ] Manual: TopNav shows 4 correct menu items
- [ ] Manual: Create series (no firebase errors)
- [ ] Manual: Switch series (no ghost albums)
- [ ] Manual: F5 refresh playlists (persist)
- [ ] Manual: Series buttons respond

---

## Post-Implementation

- [ ] Update `CHANGELOG.md` with v2.0.5 fixes
- [ ] Update `DEBUG_LOG.md` with Issue #22 resolution
- [ ] Deploy to staging
- [ ] Re-run Sprint 5 UAT
- [ ] Deploy to production
