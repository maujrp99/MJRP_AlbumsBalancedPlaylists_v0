# ARCH-6: SeriesView Loading Optimization Specification

**Status**: 📋 REVISED - Awaiting Review  
**Date**: 2025-12-26  
**Author**: AI Agent  
**Sprint**: 14  
**Revision**: v2 (Previous attempt reverted in `29875ef`)

---

## 1. Problem Statement

### User Experience Issues

The SeriesView has multiple UX inconsistencies that degrade user experience:

| # | Issue | User Impact | Severity |
|---|-------|-------------|----------|
| **P1** | Grid shows "No albums" during loading | User thinks library is empty | 🔴 HIGH |
| **P2** | Albums appear all at once at end | No sense of loading progress | 🔴 HIGH |
| **P3** | Filter dropdown triggers full remount | Slow, causes visual flash | 🟠 MED |
| **P4** | Navigate away/back reloads all data | Wasted time, data in memory | 🟠 MED |
| **P5** | Series dropdown empty on initial load | User can't see available series | 🟡 LOW |

### Scenario 1: Fresh Load (Cold Cache)

**Current Behavior**:
```
0s    View mounts, toolbar empty
0s    loadScope() → reset() → notifyView('albums', [])
      ├── Grid shows "No albums in library" ❌
0.1s  IndexedDB cache hits, albums add to store
      ├── onAlbumsChange() SKIPPED (isLoading=true) ❌
2s    67 albums loaded to store (not visible) ❌
2.5s  loadScope finishes → boom, all 67 render
```

**Expected Behavior**:
```
0s    View mounts, shows loading skeleton
0.1s  First 5 albums arrive → render them ✅
1s    30 albums visible, progress shows 45%
2.5s  All 67 albums rendered (smooth arrival)
```

### Scenario 2: Filter Change

**Trigger**: User selects different series from dropdown

**Current Behavior**:
1. `router.navigate()` causes full view remount
2. View resets, shows empty (flash)
3. `albumsStore.reset()` clears ALL cached albums
4. Full reload from API/IndexedDB

**Expected Behavior**:
1. **No page reload** - update in place
2. If series was previously loaded → **instant render from cache**
3. If series not cached → load with progress (no flash)
4. URL updates via `replaceState`

### Scenario 3: Navigate Away and Back

**Trigger**: User goes `/albums` → `/playlists` → `/albums`

**Current Behavior**:
1. SeriesView unmounts (store preserved)
2. SeriesView remounts
3. `loadScope()` calls `reset()` → clears store
4. Full reload

**Expected Behavior**:
1. SeriesView unmounts (store preserved)
2. SeriesView remounts
3. **Detect cached data exists** → render immediately
4. No network/IndexedDB requests

### Root Causes

1. **`onAlbumsChange()` ignores updates during loading** - prevents incremental render
2. **Router navigation for filter change** - causes full remount
3. **`albumsStore.reset(true)` clears all albums** - loses cached data
4. **No store-level cache check** before fetching

---

## 2. Proposed Solution

### Change 1: Enable Incremental Rendering

**Problem**: `onAlbumsChange()` skips updates when `isLoading=true`

**Solution A (Recommended)**: Notify view from callback explicitly

```javascript
// In loadAlbumsFromQueries callback:
if (result.status === 'success' && result.album) {
    this.hydrateAndAddAlbum(result.album);
    // NEW: Explicit incremental update
    this.notifyView('albums', albumsStore.getAlbums());
}
```

**Solution B**: Remove the loading check (simpler but may flood updates)

```javascript
onAlbumsChange() {
    // Always update - view throttles if needed
    this.notifyView('albums', albumsStore.getAlbums());
}
```

### Change 2: Filter Without Router Navigation

Replace `router.navigate()` with direct `controller.loadScope()` call.

```javascript
// BEFORE (causes full remount)
handleSeriesChange(value) {
    router.navigate(`/albums?seriesId=${value}`);
}

// AFTER (in-place update)
handleSeriesChange(value) {
    const seriesId = value === 'all' ? null : value;
    this.controller.loadScope(seriesId ? 'SINGLE' : 'ALL', seriesId);
    // Update URL without triggering navigation
    window.history.replaceState({}, '', 
        seriesId ? `/albums?seriesId=${seriesId}` : '/albums'
    );
}
```

### Change 3: Store-Level Cache Check

Skip reset and fetch if albums already exist for the target series.

```javascript
// SeriesController.loadScope() - ADD cache check
async loadScope(scopeType, seriesId = null, skipCache = false) {
    const storeContextId = scopeType === 'ALL' ? 'ALL_SERIES_VIEW' : seriesId;
    
    // CACHE CHECK - skip load if data exists
    if (!skipCache && albumsStore.hasAlbumsForSeries(storeContextId)) {
        console.log('[SeriesController] ✅ Using cached albums from store');
        albumsStore.setActiveAlbumSeriesId(storeContextId);
        albumSeriesStore.setActiveSeries(scopeType === 'ALL' ? null : seriesId);
        this.notifyView('header', this.getHeaderData());
        this.notifyView('albums', albumsStore.getAlbumsForSeries(storeContextId));
        return;
    }
    
    // No cache - proceed with normal loading
    // ... rest of loadScope
}
```

### Change 4: Preserve Store on Navigation

Don't clear `albumsByAlbumSeriesId` Map on reset - only clear current context.

```javascript
// albums.js reset() - MODIFY
reset(preserveAlbumSeriesContext = false) {
    const seriesId = preserveAlbumSeriesContext ? this.activeAlbumSeriesId : null;
    
    // ONLY clear if full reset requested
    if (!preserveAlbumSeriesContext) {
        this.albumsByAlbumSeriesId.clear();
    }
    // ... rest
}
```

### Change 5: Sync Toolbar State

When using cache, sync the toolbar dropdown to match the view.

```javascript
// Add to SeriesView
updateToolbar(data) {
    const seriesFilter = document.getElementById('seriesFilter');
    if (seriesFilter && seriesFilter.value !== (data.activeSeriesId || 'all')) {
        seriesFilter.value = data.activeSeriesId || 'all';
    }
}
```

### Change 6: CRUD Cache Invalidation

Invalidate store cache when series is edited/deleted.

```javascript
// After series CRUD operations
albumsStore.clearAlbumSeries(seriesId);
albumsStore.clearAlbumSeries('ALL_SERIES_VIEW');
```

---

## 3. Success Criteria

| # | Criteria | Validation Method |
|---|----------|-------------------|
| **SC1** | Albums render incrementally during load | Visual: albums appear as progress bar fills |
| **SC2** | Filter change: No flash | Less than 100ms if cached |
| **SC3** | Navigate back: Uses store cache | No API/IndexedDB fetch logs |
| **SC4** | Toolbar in sync with view | Dropdown always matches displayed series |
| **SC5** | Refresh button forces reload | `skipCache=true` path works |
| **SC6** | CRUD invalidates cache | After edit, next load fetches fresh |

---

## 4. Out of Scope

- Persisting albumsStore to IndexedDB (future)
- Memory optimization (LRU cache)
- Pagination / virtualization
- Background sync

---

## 5. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Ghost albums (stale data) | 🔴 HIGH | Keep series context validation + CRUD invalidation |
| Toolbar/View desync | 🟠 MED | Explicit toolbar sync on every state change |
| Memory bloat | 🟡 LOW | Defer to future (limit cached series) |

---

## 6. Files to Modify

| File | Change |
|------|--------|
| `controllers/SeriesController.js` | Add cache check, incremental render |
| `views/SeriesView.js` | handleSeriesChange, updateToolbar |
| `stores/albums.js` | reset() preserve Map |

---

## 7. Decisions

| Question | Decision |
|----------|----------|
| Incremental render - 1 or batched? | **1 por vez**, synced with progress bar callback |
| Cached filter - indicator or instant? | **Instant** (Opção A) - no artificial delay |
| Include CRUD invalidation? | **Yes** - prevents stale data |
| Unified flow pattern | **Controller is single source of loading logic** |

---

## Approval

- [x] **USER APPROVED** - 2025-12-26 11:57
