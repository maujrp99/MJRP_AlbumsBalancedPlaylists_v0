# Implementation Plan: Sprint 5 Complete Fix

**Date**: 2025-12-06T21:12  
**Version**: v2.0.4 → v2.0.5  
**Goal**: Unblock UAT by fixing all critical blockers and persistence gaps

---

## Problem Summary

Sprint 5 UAT is **BLOCKED** with multiple issues:

| # | Issue | Impact | Files |
|---|-------|--------|-------|
| 1 | TopNav/Routes Incorrect | Wrong menu items | TopNav.js, router.js |
| 2 | Firebase SDK Mismatch | Nothing saved to Firestore | series.js, albums.js |
| 3 | Ghost Albums (#22) | Albums from wrong series appear | albums.js, AlbumsView.js |
| 4 | Playlists Not Persisted | Lost on refresh | PlaylistsStore, PlaylistsView |
| 5 | Inventory Not Persisted | Lost on refresh | InventoryView.js |
| 6 | Duplicate Code | escapeHtml in 4 views | Multiple views |

---

## Proposed Changes

### Phase 1: TopNav & Routes Fix (P1)

#### [MODIFY] [TopNav.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/TopNav.js)

**Current Menu**: Home, Albums, Current Playlists, History, Inventory  
**Required Menu**: Home, Albums Series, Playlist Series, Inventory

```diff
// Lines 24-28 - Desktop Menu
- ${this.renderNavLink('/home', 'Home', currentPath)}
- ${this.renderNavLink('/albums', 'Albums', currentPath)}
- ${this.renderNavLink('/playlists', 'Current Playlists', currentPath)}
- ${this.renderNavLink('/saved-playlists', 'History', currentPath)}
- ${this.renderNavLink('/inventory', 'Inventory', currentPath)}
+ ${this.renderNavLink('/home', 'Home', currentPath)}
+ ${this.renderNavLink('/albums-series', 'Albums Series', currentPath)}
+ ${this.renderNavLink('/playlist-series', 'Playlist Series', currentPath)}
+ ${this.renderNavLink('/inventory', 'Inventory', currentPath)}

// Lines 51-55 - Mobile Menu (same changes)
```

#### [MODIFY] [router.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/router.js)

```javascript
'/albums-series': SeriesListView,    // Was '/series'
'/playlist-series': SavedPlaylistsView,  // Was '/saved-playlists'
```

### TopNav Route Mapping

| Menu Label | Route | View |
|------------|-------|------|
| Home | `/home` | HomeView |
| Albums Series | `/albums-series` | SeriesListView |
| Playlist Series | `/playlist-series` | SavedPlaylistsView |
| Inventory | `/inventory` | InventoryView |

---

### Phase 2: Firebase SDK Standardization (P0)

> [!IMPORTANT]
> The app uses modular SDK in `app.js` but some stores mix compat API.

#### [MODIFY] [series.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/stores/series.js)

**Issues**:
1. Lines 159-182: **DUPLICATE** `saveToFirestore()` with compat SDK
2. Lines 19, 22, 129, 167, 170: `db.collection()` compat API

```diff
// Line 1 - Expand imports
- import { serverTimestamp } from 'firebase/firestore'
+ import { serverTimestamp, collection, doc, addDoc, updateDoc, getDocs, query, orderBy, limit } from 'firebase/firestore'

// DELETE duplicate saveToFirestore (lines 159-182)

// Convert db.collection() to modular
- await db.collection('series').doc(id).update(data)
+ await updateDoc(doc(db, 'series', id), data)
```

#### [MODIFY] [albums.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/stores/albums.js)

```diff
+ import { collection, doc, addDoc, updateDoc, getDocs } from 'firebase/firestore'
// Convert all db.collection() calls to modular API
```

---

### Phase 3: Ghost Albums Fix (P0)

**Root Cause**: `reset()` clears `lastLoadedSeriesId`.

#### [MODIFY] [albums.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/stores/albums.js)

```diff
- reset() {
+ reset(preserveSeriesContext = false) {
+   const seriesId = preserveSeriesContext ? this.lastLoadedSeriesId : null
    this.albums = []
    this.lastLoadedSeriesId = seriesId
}
```

#### [MODIFY] [AlbumsView.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/AlbumsView.js)

```diff
- albumsStore.reset()
+ albumsStore.reset(true)
```

---

### Phase 4: Code Cleanup (P1)

Remove duplicate `escapeHtml()` from 4 files (BaseView already has it):

| File | Lines to Remove |
|------|-----------------|
| AlbumsView.js | 514-519, 1117-1122 |
| PlaylistsView.js | 509-514 |
| SeriesListView.js | 253-258 |
| SavedPlaylistsView.js | 154-159 |

---

### Phase 5: Playlists Persistence (P0)

#### [MODIFY] [playlists.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/stores/playlists.js)

Add `saveToLocalStorage()` and `loadFromLocalStorage()` methods.

#### [MODIFY] [PlaylistsView.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/PlaylistsView.js)

Add PlaylistRepository integration in `handleGenerate()`.

---

### Phase 6: Inventory & Series UI (P1)

#### [MODIFY] [InventoryView.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/InventoryView.js)

Integrate `InventoryRepository` for Firestore persistence.

#### [INVESTIGATE] [SeriesListView.js](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/SeriesListView.js)

Debug event listeners - check if `this.container` is null.

---

## Verification Plan

### Automated
```bash
npm test && npm run test:e2e
```

### Manual
1. TopNav shows 4 correct items
2. Create series → no Firebase errors
3. Switch series → no ghost albums
4. F5 refresh → playlists persist

---

## Success Criteria

- [ ] TopNav shows: Home, Albums Series, Playlist Series, Inventory
- [ ] No Firebase SDK errors
- [ ] Ghost Albums test passes
- [ ] Playlists persist after F5
- [ ] All unit tests pass
