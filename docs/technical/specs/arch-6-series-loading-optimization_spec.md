# ARCH-6: SeriesView Loading Optimization Specification
**Status**: 📋 DRAFT - Awaiting Review  
**Date**: 2025-12-26  
**Author**: AI Agent  
**Sprint**: 14

---

## 1. Problem Statement

### Scenario 1: Filter Change Causes Full Reload
When user changes the series filter dropdown:
1. `handleSeriesChange()` calls `router.navigate()`
2. Router unmounts and remounts the entire `SeriesView`
3. `mount()` calls `controller.loadScope()`
4. `loadScope()` calls `albumsStore.reset()` - **clears ALL albums**
5. View shows empty state briefly (flash)
6. Albums are re-fetched from cache and displayed

**User Experience**: Visible flash, unnecessary loading indicator, slow response.

### Scenario 2: Navigation Away and Back
When user navigates to another view (e.g., `/playlists`) and returns to `/albums`:
1. Router unmounts `SeriesView` (no state preserved)
2. Router mounts fresh `SeriesView`
3. Same reload flow as Scenario 1

**User Experience**: Albums that were already loaded must be fetched again.

### Root Causes
1. **Router navigation for filter change** instead of in-place update
2. **`albumsStore.reset(true)` clears all albums** on every loadScope
3. **No store-level cache check** before fetching (only API-level cache exists)
4. **View state not preserved** on navigation

---

## 2. Proposed Solution

### Change 1: Filter Without Router Navigation
Replace `router.navigate()` with direct `controller.loadScope()` call for filter changes.

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
    const url = seriesId ? `/albums?seriesId=${seriesId}` : '/albums';
    window.history.replaceState({}, '', url);
}
```

### Change 2: Store-Level Cache Check
Skip reset and fetch if albums already exist for the target series.

```javascript
// SeriesController.loadScope() - BEFORE
albumsStore.reset(true);
this.notifyView('albums', []); // Flash
await this.loadAlbumsFromQueries(queries);

// SeriesController.loadScope() - AFTER
if (albumsStore.hasAlbumsForSeries(storeContextId)) {
    console.log('[SeriesController] Using cached albums from store');
    this.notifyView('albums', albumsStore.getAlbumsForSeries(storeContextId));
    this.notifyView('loading', false);
    return; // Skip fetch
}
// Only reset if we need to load
albumsStore.setActiveAlbumSeriesId(storeContextId);
await this.loadAlbumsFromQueries(queries);
```

### Change 3: Preserve Store on Navigation
Don't clear `albumsByAlbumSeriesId` Map on reset - only clear current context.

### Change 4: CRUD Cache Invalidation
Invalidate store cache when series is edited/deleted to prevent stale data.

```javascript
// After series CRUD operations
albumsStore.clearAlbumSeries(seriesId);
```

---

## 3. Success Criteria

| # | Criteria | Validation Method |
|---|----------|-------------------|
| 1 | Filter change: No flash/empty state | Visual inspection |
| 2 | Filter change: No loading indicator if cached | Console log shows "Using cached albums" |
| 3 | Navigation back: Uses store cache | No API fetch logs when returning |
| 4 | URL updates correctly on filter | Browser address bar shows correct URL |
| 5 | Refresh still works | F5 forces fresh load from URL |

---

## 4. Out of Scope

- Persisting albumsStore to IndexedDB (future enhancement)
- Preloading albums for all series on app start
- Infinite scroll / pagination changes

---

## 5. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stale data after series edit | 🟠 MED | Invalidate store cache on CRUD operations |
| URL out of sync with view | 🟡 LOW | Use replaceState to update URL on filter |
| Memory bloat (too many series cached) | 🟡 LOW | Limit Map to last 5 series |

---

## 6. Files to Modify

| File | Change |
|------|--------|
| `views/SeriesView.js` | `handleSeriesChange()` - call loadScope directly |
| `controllers/SeriesController.js` | `loadScope()` - check store cache before fetch |
| `stores/albums.js` | `reset()` - preserve `albumsByAlbumSeriesId` Map |

---

## 7. Decisions (Reviewed 2025-12-26)

| Question | Decision |
|----------|----------|
| Include CRUD invalidation now? | **Yes** - Prevents stale data bugs |
| Unified flow pattern | **Controller is single source of loading logic** |
| Two entry points (filter, mount) | **Both call loadScope()** - consistency ensured |

---

## Approval

- [x] **USER APPROVED** - 2025-12-26 10:39
