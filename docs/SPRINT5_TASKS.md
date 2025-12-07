# Sprint 5 Complete Fix - Task List

**Status**: In Progress  
**Updated**: 2025-12-06T21:28

---

## Phase 1: TopNav, Routes & Nomenclature Refactor (P1)

### 1A: TopNav Menu (5 items)
- [x] **1.1** TopNav desktop menu: Home, Albums, Album Series, Playlist Series, Inventory
- [x] **1.2** TopNav mobile menu: same 5 items
- [x] **1.3** Albums link uses active series (`/albums?seriesId=X`)
- [x] **1.4** Rename "Recent Series" → "Recent Albums Series" in HomeView

### 1B: Nomenclature Refactor
- [x] **1.5** Rename `SeriesListView.js` → `AlbumSeriesListView.js`
- [x] **1.6** Rename class `SeriesListView` → `AlbumSeriesListView`
- [x] **1.7** Rename `series.js` store → `albumSeries.js`
- [x] **1.8** Rename export `seriesStore` → `albumSeriesStore`
- [x] **1.9** Update all imports across codebase (6 files)
- [x] **1.10** Update all references (~35 occurrences)
- [x] **1.11** Update route `/album-series` → AlbumSeriesListView
- [x] **1.12** Build verified ✅

---

## Phase 2: Firebase SDK Standardization (P0)

- [x] **2.1** Update `series.js` → modular Firestore imports
- [x] **2.2** Delete duplicate `saveToFirestore()` from series.js
- [x] **2.3** Convert `loadFromFirestore()` to modular API
- [x] **2.4** Convert `saveToFirestore()` to modular API
- [ ] **2.5** Add Firestore modular imports to albums.js
- [ ] **2.6** Convert albums.js to modular API
- [ ] **2.7** Verify: No "firebase is not defined" errors

---

## Phase 3: Ghost Albums Fix (P0)

- [ ] **3.1** Modify `reset()` in albums.js: add `preserveSeriesContext` flag
- [ ] **3.2** Update AlbumsView.js to call `reset(true)`
- [ ] **3.3** Test: switch series, no ghost albums

---

## Phase 4: Code Cleanup (P1)

- [ ] **4.1** Remove duplicate `escapeHtml()` from AlbumsView.js
- [ ] **4.2** Remove duplicate `escapeHtml()` from PlaylistsView.js
- [ ] **4.3** Remove duplicate `escapeHtml()` from SeriesListView.js
- [ ] **4.4** Remove duplicate `escapeHtml()` from SavedPlaylistsView.js

---

## Phase 5: Playlists Persistence (P0)

- [ ] **5.1** Add `saveToLocalStorage()` to PlaylistsStore
- [ ] **5.2** Add `loadFromLocalStorage()` to PlaylistsStore
- [ ] **5.3** Call on constructor and setPlaylists
- [ ] **5.4** Integrate PlaylistRepository in PlaylistsView

---

## Phase 6: Inventory & Series UI (P1)

- [ ] **6.1** Add InventoryRepository to InventoryView.js
- [ ] **6.2** Firestore save in edit callback
- [ ] **6.3** Firestore delete in delete callback
- [ ] **6.4** Debug AlbumSeriesListView buttons

---

## Verification

- [ ] TopNav: 5 menu items working
- [ ] No Firebase SDK errors
- [ ] No ghost albums
- [ ] Playlists persist on F5
- [ ] Build succeeds
