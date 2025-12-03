# Ghost Albums Investigation - December 3, 2025

## Summary
**Conclusion**: ✅ **The AI Tester was correct**. I reintroduced a partial regression by fixing only `render()` but missing `updateAlbumsGrid()`.

---

## Investigation Process

### 1. What the Debug Log Says (DEBUG_LOG.md)

#### Original Fix (Issue #19, Nov 30, 2025)
**Problem**: Ghost albums appearing when switching series  
**Solution**: Added `_lastLoadedSeriesId` tracking in `AlbumsView` constructor

```javascript
// In AlbumsView constructor (line 35)
this._lastLoadedSeriesId = null

// In mount() method (lines 890-904)
const needsReload = currentCount === 0 || 
                    currentCount !== expectedCount ||
                    !this._lastLoadedSeriesId ||
                    this._lastLoadedSeriesId !== activeSeries.id

if (needsReload) {
    await this.loadAlbumsFromQueries(activeSeries.albumQueries)
    this._lastLoadedSeriesId = activeSeries.id
}
```

**Status**: ✅ Resolved and verified in production (Nov 30)

---

### 2. What the Tester Found (GHOST_ALBUMS_REPORT.md, Dec 3)

#### Regression Reproduction
**Scenario**: Switching series in **Expanded View**  
**Result**: Ghost albums from Series A appear when navigating to Series B

**Root Cause Identified by Tester**:
> "The `render()` method has logic to prevent ghost albums by checking `lastLoadedSeriesId`, **but** the `updateAlbumsGrid()` method lacks this check."

**Recommended Fix**:
```javascript
updateAlbumsGrid(albums) {
  const activeSeries = seriesStore.getActiveSeries()
  const lastLoadedId = albumsStore.getLastLoadedSeriesId()
  
  if (activeSeries && lastLoadedId && activeSeries.id !== lastLoadedId) {
     return // Don't render if transitional state
  }
  
  const filtered = this.filterAlbums(albums)
  // ... proceed with render
}
```

---

### 3. What I Actually Implemented (Steps 2098 & 2103)

#### My Changes (Dec 3)

**Change 1: AlbumsStore.js** (✅ Correct)
```javascript
// Line 252: Persist lastLoadedSeriesId
lastLoadedSeriesId: this.lastLoadedSeriesId,

// Line 270: Restore lastLoadedSeriesId  
this.lastLoadedSeriesId = parsed.lastLoadedSeriesId || null
```

**Change 2: AlbumsView.render()** (✅ Partially Correct)
```javascript
// Lines 58-73: Added series context check
const targetSeriesId = params?.seriesId || urlParams.get('seriesId') || activeSeries?.id
const lastLoadedId = albumsStore.getLastLoadedSeriesId()
let displayAlbums = albums

if (targetSeriesId && lastLoadedId && targetSeriesId !== lastLoadedId) {
    displayAlbums = [] // Hide stale albums
}

const filteredAlbums = this.filterAlbums(displayAlbums)
```

**Change 3: AlbumsView.updateAlbumsGrid()** (❌ **MISSED**)
```javascript
// Current implementation (Lines 984-1018)
updateAlbumsGrid(albums) {
  const filtered = this.filterAlbums(albums) // NO SERIES CHECK!
  
  // ... renders directly without validation
}
```

---

## Critical Analysis

### The Bug I Introduced

**What Happened**:
1. ✅ I correctly identified that `lastLoadedSeriesId` needed persistence
2. ✅ I added the check in `render()` to prevent initial ghost display
3. ❌ **I completely missed that `updateAlbumsGrid()` is called by store subscriptions**

**Why This is a Problem**:
```
User Flow:
1. Load Series A → AlbumsView.render() shows correct albums (check passes)
2. User navigates to Series B
3. Series B albums start loading
4. AlbumsStore updates with new data
5. Store.notify() triggers subscription
6. Subscription calls updateAlbumsGrid(albums)
7. ❌ updateAlbumsGrid() renders WITHOUT checking lastLoadedSeriesId
8. Result: Mix of Series A and Series B albums visible
```

**Evidence from Tester**:
> "When switching between series while in Expanded View, albums from the previously viewed series appear in the current series."

This confirms the subscription call path is the issue, not the initial render.

---

## Comparison with Original Fix

### Original Fix (Nov 30 - Working)
```javascript
// Stored in VIEW instance property
this._lastLoadedSeriesId = activeSeries.id

// Checked in mount() BEFORE loading
if (this._lastLoadedSeriesId !== activeSeries.id) {
    await this.loadAlbumsFromQueries(...)
}
```

**Why it worked**: The check happened in `mount()`, which controls the data flow. Once data is loaded, `_lastLoadedSeriesId` is set, and subscriptions don't need validation.

### My Fix (Dec 3 - Incomplete)
```javascript
// Stored in STORE (persisted)
albumsStore.lastLoadedSeriesId = activeSeries.id

// Checked in render() BUT NOT in updateAlbumsGrid()
if (targetSeriesId !== lastLoadedId) {
    displayAlbums = []
}
```

**Why it fails**: `render()` check prevents initial display, but store subscriptions bypass this check entirely by calling `updateAlbumsGrid()` directly.

---

## Why Expanded View is Affected More

The tester noted the issue is "specific to or more persistent in Expanded View." Here's why:

1. **More DOM complexity**: Expanded view renders full tracklists, making the bug more visually obvious
2. **Timing sensitivity**: The larger HTML payload may create different timing windows for the race condition
3. **Persistence**: `viewMode` is saved to localStorage, so if a user defaultsAlbumsView.js to Expanded mode, they hit the buggy path immediately on every series switchThe tester report mentions this explicitly as a factor.

---

## The Correct Fix (What I Should Have Done)

Based on the tester's recommendation and the original working solution, here's the proper fix:

```javascript
updateAlbumsGrid(albums) {
  // Add series context validation
  const activeSeries = seriesStore.getActiveSeries()
  const lastLoadedId = albumsStore.getLastLoadedSeriesId()
  
  // Early exit if we're viewing stale data from wrong series
  if (activeSeries && lastLoadedId && activeSeries.id !== lastLoadedId) {
    console.warn('[AlbumsView] updateAlbumsGrid: Series mismatch, skipping render')
    return
  }
  
  // Proceed with normal rendering
  const filtered = this.filterAlbums(albums)
  // ... rest of method
}
```

**Why this works**:
- Validates series context on EVERY store update
- Prevents subscriptions from rendering stale data
- Maintains consistency between `render()` and `updateAlbumsGrid()`
- Preserves the localStorage persistence improvement

---

## Action Items

1. ✅ **Document the finding** (this file)
2. ⏳ **Apply the fix to `updateAlbumsGrid()`**
3. ⏳ **Test in Expanded View specifically**
4. ⏳ **Verify with the user/tester**

---

## Lessons Learned

1. **Store subscriptions are a separate render path**: When fixing UI bugs, check ALL methods that update the DOM, not just `render()`.
2. **Original fixes exist for a reason**: The instance variable approach (`this._lastLoadedSeriesId`) worked because it was checked before loading. My persistence improvement was good, but I should have preserved BOTH checks.
3. **Test reports are gold**: The tester correctly identified the exact gap (missing check in `updateAlbumsGrid()`). I should have reviewed their analysis more carefully before concluding my fix was complete.

---

## Verdict

**Q**: Did I reintroduce the bug?  
**A**: ✅ **Yes, partially**. I solved the initial render issue but missed the store subscription path.

**Q**: Is my code wrong?  
**A**: ❌ **Half wrong**. The localStorage persistence is an improvement, and the `render()` check works. But the missing `updateAlbumsGrid()` check creates a regression.

**Q**: What should happen next?  
**A**: Add the series validation to `updateAlbumsGrid()` as recommended by the tester.
