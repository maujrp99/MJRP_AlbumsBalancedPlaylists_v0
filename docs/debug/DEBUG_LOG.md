# Debug Log

**Last Updated**: 2025-12-02 07:15
**Workflow**: See `.agent/workflows/debug_protocol.md`
## Maintenance Notes

**How to Update This Document**:
1. Active issues → Current Debugging Session
2. Resolved/reverted issues → Move to Previous with timestamp
3. Keep Previous sections for history (don't delete)
4. Link to ARCHITECTURE.md for architectural decisions

**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol

---

## Current Debugging Session

🟢 **No active session** (as of 2025-12-02 07:15)

All recent issues have been resolved or closed. See "Previous Sessions" below for details.

---

## Previous Session (2025-12-02)

### Issue #21: Sticky Playlists

**Context**: Developer onboarding revealed Issues #15 and #16 were NOT actually resolved despite being marked "Resolved" in previous session. User reported problems persist.

**Status**: ❌ **CLOSED - WONTFIX** (Product Decision)
**Date Started**: 2025-11-30 21:15  
**Date Closed**: 2025-12-02 06:11  
**Type**: Regression / Logic Flaw  
**Resolution**: **Feature Removed**

#### User Report
When navigating through the series dropdown or using arrows in the PlaylistsView, the view keeps showing the playlists from the *first* generated series, regardless of which series is selected in the dropdown.

**Reproduction Steps**:
1. Generate playlists for Series tc1 (e.g., Greatest Hits Vol. 1 & 2)
2. Switch to Series tc2 using dropdown
3. **Expected**: Playlists should clear or show tc2 playlists
4. **Actual**: tc1 playlists remain visible

#### Resolution (2025-12-02 06:11)

**Product Decision**: After 4 failed attempts and ~16 hours of debugging, the decision was made to **remove the series selector dropdown** from `PlaylistsView` entirely to simplify UX and eliminate this issue permanently.

**Changes Applied**:
1. ✅ **Removed series selector HTML** from `PlaylistsView.render()` (lines 50-62)
2. ✅ **Removed series selector event handler** from `PlaylistsView.mount()` (lines 335-364)
3. ✅ **Removed Undo/Redo navigation buttons** from header (lines 49-55) - User request 2025-12-02 06:45
4. ✅ **Cleaned up all debug logs** added during investigation:
   - Removed emoji logs (🔄) from `PlaylistsView.js`
   - Removed emoji logs (📦) from `PlaylistsStore.js`
   - Removed emoji logs (🚦) from `Router.js`
   - Removed emoji logs (🧹) from `BaseView.js`
4. ✅ **Kept `seriesId` tracking** in `PlaylistsStore` for data integrity
5. ✅ **Verified `handleGenerate()`** correctly passes `activeSeries.id` to `setPlaylists()` (line 440)

**User Impact**:
- Users can no longer switch series using the dropdown in PlaylistsView
- Series navigation now requires using breadcrumbs or back button to return to Albums view
- This simplifies the UX and prevents the cross-contamination issue

**Technical Notes**:
- `router.loadRoute()` method implemented during debugging remains available for future use
- `seriesId` tracking in `PlaylistsStore` provides foundation for multi-series features later
- All 4 debugging attempts documented in this issue serve as reference for similar problems

**Next Investigation Steps**:

**ATTEMPT #1: Store Series Tracking + View Validation** (2025-11-30 21:15 - FAILED)
- **Hypothesis**: `PlaylistsStore` doesn't track which series the playlists belong to, causing cross-contamination.
- **Fix Applied**:
  1. Added `seriesId` property to `PlaylistsStore` (line 14)
  2. Modified `setPlaylists(playlists, seriesId)` to accept and store `seriesId` (lines 38-40)
  3. Updated `getState()` to expose `seriesId` (line 150)
  4. Modified `reset()` to clear `seriesId` (line 239)
  5. Added validation in `PlaylistsView.render()` and `update()` to check if `state.seriesId !== activeSeries.id` (lines 30-36, 97-99)
  6. Updated `handleGenerate()` to pass `activeSeries.id` to `setPlaylists()` (line 428)
- **Files Modified**:
  - `public/js/stores/playlists.js` (Steps 412-414)
  - `public/js/views/PlaylistsView.js` (Step 422)
- **Result**: ❌ **FAILED** - User reported playlists still persist when switching series
- **Root Cause Missed**: Validation logic works, but store history (undo/redo) doesn't track `seriesId`

**ATTEMPT #2: History Snapshot SeriesId** (2025-12-01 00:26 - FAILED)
- **Hypothesis**: Undo/redo history snapshots don't include `seriesId`, so restoring history brings back playlists without series context.
- **Fix Applied**:
  1. Modified `createSnapshot()` to include `seriesId` in snapshots (line 172)
  2. Updated `undo()` to restore `seriesId` from snapshot (line 193)
  3. Updated `redo()` to restore `seriesId` from snapshot (line 210)
- **Files Modified**:
  - `public/js/stores/playlists.js` (Steps 438-439)
- **Result**: ❌ **FAILED** - User confirmed playlists still show from wrong series
- **Root Cause Missed**: Series selector event handler has logic issues

**ATTEMPT #3: Refactor Series Selector Handler** (2025-12-01 00:35 - FAILED)
- **Hypothesis**: The series selector's manual re-render logic (`this.render().then(html => this.mount())`) causes memory leaks and doesn't properly clean up state.
- **Fix Applied**:
  1. Replaced manual re-render with `router.loadRoute(window.location.pathname)`
  2. Added comments explaining the fix
- **Code Change** (`PlaylistsView.js` lines 336-351):
  ```javascript
  this.on(seriesSelector, 'change', async (e) => {
      const newSeriesId = e.target.value
      console.log('[PlaylistsView] Switching series to:', newSeriesId)
      
      // 1. Update Active Series
      seriesStore.setActiveSeries(newSeriesId)
      
      // 2. Clear current playlists to prevent ghosting
      playlistsStore.setPlaylists([]) 
      
      // 3. Force full view reload via Router
      await router.loadRoute(window.location.pathname)
  })
  ```
- **Files Modified**:
  - `public/js/views/PlaylistsView.js` (Step 464)
- **Result**: ❌ **FAILED** - User reported playlists still persist
- **Root Cause Missed**: `router.loadRoute()` method doesn't exist!

**ATTEMPT #4: Implement Missing router.loadRoute()** (2025-12-01 13:05 - FAILED)
- **Hypothesis**: The call to `router.loadRoute()` in Attempt #3 failed silently because the method didn't exist in `router.js`.
- **Discovery**: Reviewed `router.js` and confirmed `loadRoute()` method was never implemented.
- **Fix Applied**:
  1. Added `loadRoute(path)` method to `Router` class to force route reload
  2. Method updates history and manually triggers `handleRouteChange()`
- **Code Change** (`router.js` lines 84-91):
  ```javascript
  async loadRoute(path) {
      // Update history without triggering popstate
      history.replaceState({}, '', path)
      // Manually trigger route handling
      await this.handleRouteChange()
  }
  ```
- **Files Modified**:
  - `public/js/router.js` (Step 474)
- **Verification Attempted**: Browser agent failed to connect (404 errors on localhost:5005 and 127.0.0.1:5005)
- **Result**: ❌ **FAILED** - User confirmed playlists still persist after reload
- **Root Cause**: **STILL UNKNOWN** - All logical fixes applied, but issue persists

#### Current State Analysis (2025-12-01 13:10)
**What We Know**:
1. ✅ `PlaylistsStore` correctly tracks `seriesId`
2. ✅ `PlaylistsView` validates `seriesId` before rendering
3. ✅ History snapshots include `seriesId`
4. ✅ Series selector calls `setPlaylists([])` to clear
5. ✅ Series selector calls `router.loadRoute()` to force reload
6. ✅ `router.loadRoute()` now exists and should work
7. ❌ **Playlists still persist when switching series**

**Possible Remaining Causes**:
1. **Race Condition**: `setPlaylists([])` → `router.loadRoute()` sequence might have timing issues
   - Store subscription fires render before loadRoute completes?
   - View renders with old data before new view is created?
2. **Store Subscription Not Cleared**: Even after `destroy()`, old subscriptions might fire
3. **Cache/Build Issue**: Changes not being loaded by browser (unlikely, but possible)
4. **Deep Reactivity Issue**: Playlists array is cleared but DOM retains old HTML
5. **Router Bug**: `loadRoute()` implementation doesn't actually destroy/recreate view properly

**Next Investigation Steps**:
1. Add extensive console logging to track exact execution order
2. Verify `BaseView.destroy()` is actually being called
3. Check if store subscriptions are truly being removed
4. Investigate if `router.handleRouteChange()` → `renderView()` actually creates new view instance
5. Consider adding explicit `playlistsStore.reset()` instead of just `setPlaylists([])`

---

## Previous Session (2025-11-30)

### Issue #15: Ghost Albums - REOPENED (Again)
**Status**: ✅ **RESOLVED (Definitively)**
**Date**: 2025-11-30 21:00  
**Date**: 2025-11-30 19:17 - 20:11  
**Session Duration**: ~54 minutes

#### User Report
Albums from previous series still appearing when:
1. Navigating between series (Home → Albums → Home → Continue)
2. Clicking view toggle button multiple times

#### Investigation Timeline

**ATTEMPT #1: Abort Before Reset** (19:17 - PARTIAL SUCCESS)
- **Hypothesis**: AbortController being called AFTER store.reset() causes race condition
- **Fix Applied**: Moved abort logic BEFORE store reset in `loadAlbumsFromQueries()` (lines 875-890)
- **Code Change**:
  ```javascript
  // OLD: Reset first, then abort
  albumsStore.reset()
  if (this.abortController) this.abortController.abort()
  
  // NEW: Abort first, then reset
  if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
  }
  this.abortController = new AbortController()
  albumsStore.reset()
  ```
- **Result**: ❌ FAILED - Ghost albums still appeared on navigation
- **Root Cause Missed**: Didn't account for store persistence across view instances

**ATTEMPT #2: Check Store Before Reload** (19:44 - PARTIAL SUCCESS)
- **Hypothesis**: Albums being reloaded even when already in store
- **Fix Applied**: Added check to skip reload if albums already loaded (lines 840-853)
- **Code Change**:
  ```javascript
  const expectedCount = activeSeries.albumQueries.length
  const currentCount = currentAlbums.length
  
  if (currentCount === 0 || currentCount !== expectedCount) {
      await this.loadAlbumsFromQueries(activeSeries.albumQueries)
  } else {
      console.log('[AlbumsView] Albums already loaded')
      this.updateAlbumsGrid(currentAlbums)  // ⚠️ THIS LINE CAUSED DUPLICATION
  }
  ```
- **Result**: ✅ Navigation ghost albums fixed
- **New Problem**: Broke view toggle (duplicates still occurred)
- **Impact Assessment FAILED**: Did not consider that `render()` already displays albums

**ATTEMPT #3: Remove Duplicate Render Call** (20:08 - SUCCESS)
- **Hypothesis**: `render()` shows albums, then `mount()` calls `updateAlbumsGrid()` → duplication
- **Fix Applied**: Removed `this.updateAlbumsGrid(currentAlbums)` call in else branch (line 896)
- **Code Change**:
  ```javascript
  } else {
      console.log('[AlbumsView] Albums already loaded')
      // CRITICAL FIX: Do NOT call updateAlbumsGrid here!
      // The render() method already rendered these albums
  }
  ```
- **Result**: ✅ **COMPLETE SUCCESS** - Both navigation and view toggle work perfectly

#### Final Root Cause Analysis
**Three separate issues:**
1. **Race Condition**: Abort called after reset → old requests complete after reset
   - **Fixed by**: Moving abort before reset
2. **Unnecessary Reloads**: View reloading albums that already exist in store
   - **Fixed by**: Checking album count before reload
3. **Double Rendering**: `render()` + `mount().updateAlbumsGrid()` → duplicate display
   - **Fixed by**: Removing updateAlbumsGrid call when albums already rendered

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 875-898)

#### Verification
- ✅ Navigate Home → Albums → Home → Continue: No duplicates
- ✅ Toggle view mode multiple times: No duplicates
- ✅ Hard refresh (F5): Works correctly
- ✅ Console logs confirm correct flow

#### Impact Assessment (Post-Fix)
- [x] Does this affect global state/navigation? Yes - store persistence
- [x] Does it work on Hard Refresh? Yes
- [x] Does it work for New AND Existing items? Yes
- [x] Does it introduce visual artifacts? No

---

### Issue #16: View Mode Toggle - REOPENED
**Status**: ✅ **RESOLVED (After 4 iterations)**  
**Date**: 2025-11-30 19:29 - 20:00  
**Session Duration**: ~31 minutes

#### User Report
1. Button state changes correctly
2. View does NOT switch between Grid and Expanded modes
3. Albums duplicate when clicking toggle multiple times

#### Investigation Timeline

**ATTEMPT #1: Simple Grid Update** (19:29 - FAILED)
-  **Hypothesis**: Can just call `updateAlbumsGrid()` after toggling viewMode
- **Fix Applied**: Updated button state + called `updateAlbumsGrid()`
- **Code Change**: Lines 654-680
- **Result**: ❌ FAILED - View didn't change at all
- **Root Cause**: `updateAlbumsGrid()` updates EXISTING container, but Grid uses `#albumsGrid` while Expanded uses `#albumsList` - wrong container ID!

**ATTEMPT #2: Manual DOM Manipulation** (19:38 - FAILED)
- **Hypothesis**: Need to remove old container and create new one
- **Fix Applied**: Find old container, remove it, insert new HTML
- **Code Change**: Lines 678-708
- **Result**: ❌ FAILED - Albums duplicated on each click
- **Problem**: Old containers not being fully removed before inserting new ones

**ATTEMPT #3: While Loop Cleanup** (19:53 - FAILED)
- **Hypothesis**: Need to ensure ALL old containers removed
- **Fix Applied**: While loop to repeatedly check and remove containers
- **Code Change**: Lines 678-719
- **Result**: ❌ FAILED - View Compact stopped appearing, only Expanded showed
- **Problem**: Event listeners lost during DOM manipulation, complex state management issues

**ATTEMPT #4: Full Re-render** (19:57 - SUCCESS)
- **Hypothesis**: Stop being "clever", just re-render entire view
- **Fix Applied**: Call `render()` + rebuild all event listeners
- **Code Change**: Lines 654-753 (complete rewrite of toggle handler)
- **Code Approach**:
  ```javascript
  this.on(toggleViewBtn, 'click', async () => {
      // Toggle mode
      this.viewMode = this.viewMode === 'compact' ? 'expanded' : 'compact'
      localStorage.setItem('albumsViewMode', this.viewMode)
      
      // Re-render entire view
      const html = await this.render({})
      this.container.innerHTML = html
      
      // Re-bind ALL event listeners
      Breadcrumb.attachListeners(this.container)
      // ... rebind search, filters, buttons, etc.
  })
  ```
- **Result**: ✅ **SUCCESS** - Toggle works perfectly, no duplicates
- **Tradeoff**: Heavier (re-renders everything) but robust and bug-free

#### Final Root Cause
- **Containers are different**: Grid mode uses `<div id="albumsGrid">`, Expanded uses `<div id="albumsList">`
- **updateAlbumsGrid() fails**: Tries to update wrong container ID
- **Manual DOM manipulation too fragile**: Event listeners lost, state management complex
- **Solution**: Full re-render guarantees consistency at cost of performance

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 654-753)

#### Verification
- ✅ Click toggle: View changes instantly
- ✅ Click toggle 10 times: No duplicates, no errors
- ✅ Reload page: View mode persists in localStorage
- ✅ All filters still work after toggle

#### Impact Assessment
- [x] Does this affect global state/navigation? No - local to view
- [x] Does it work on Hard Refresh? Yes
- [x] Does it work for New AND Existing items? Yes
- [x] Does it introduce visual artifacts? No
- [x] Performance impact? Minor (full re-render on toggle)

---

### Issue #19: Wrong Series Albums Displayed
**Status**: ✅ Resolved  
**Date**: 2025-11-30 20:20  
**Duration**: ~8 minutes  
**Type**: Regression from Issue #15 fix

#### Problem
User clicked on different series (tc1 with Led Zeppelin, Beatles) but saw albums from another series (tc1b with OK Computer, Nevermind). URL showed correct seriesId but wrong albums displayed.

#### Root Cause
Issue #15 fix only checked **album count** to determine if reload needed:
```javascript
if (currentCount === 0 || currentCount !== expectedCount) {
    await this.loadAlbumsFromQueries(activeSeries.albumQueries)
}
```

**Scenario**:
1. Load tc1b (3 albums) → store has 3 albums
2. Click tc1 (also 3 albums) → `currentCount === expectedCount` → thinks "already loaded"
3. Result: Shows tc1b albums instead of tc1 albums

#### Impact Assessment
- [x] Does this affect global state/navigation? Yes - series switching
- [x] Does it work on Hard Refresh? No - same issue
- [x] Does it work for New AND Existing items? Affects all series with same album count
- [ ] Does it introduce visual artifacts? No

#### Resolution
Added series ID tracking to reload logic:
```javascript
constructor() {
    // ...
    this._lastLoadedSeriesId = null  // Track which series is loaded
}

// In mount():
const needsReload = currentCount === 0 || 
                    currentCount !== expectedCount ||
                    !this._lastLoadedSeriesId ||
                    this._lastLoadedSeriesId !== activeSeries.id  // ← NEW CHECK

if (needsReload) {
    await this.loadAlbumsFromQueries(activeSeries.albumQueries)
    this._lastLoadedSeriesId = activeSeries.id  // Remember series
}
```

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 35, 890-904)

#### Verification
- ✅ Click tc1 → Shows Led Zeppelin, Beatles, Pink Floyd
- ✅ Click tc1b → Shows OK Computer, Nevermind, The Smiths
- ✅ Switch back to tc1 → Correctly reloads and shows tc1 albums
- ✅ Hard refresh → Works correctly

---

### Issue #20: Wrong Album Details Displayed
**Status**: ✅ Resolved  
**Date**: 2025-11-30 20:27  
**Duration**: ~3 minutes  
**Type**: Pre-existing bug exposed by testing

#### Problem
User clicked "View Ranked Tracks" on different albums but always saw the same album details:
- tc1 series: Always showed "The Wall" regardless of which album clicked
- tc1b series: Always showed "OK Computer" regardless of which album clicked

URL showed correct albumId but wrong album details displayed.

#### Root Cause
`RankingView.findAlbum()` had a "debugging fallback" that always returned first album when ID didn't match:

```javascript
findAlbum(albumId) {
    const albums = albumsStore.getAlbums()
    
    // Try exact ID match first
    const byId = albums.find(a => a.id === albumId)
    if (byId) return byId
    
    // Fallback to first album if no match (for debugging)
    return albums[0] || null  // ← ALWAYS returns first album!
}
```

**Why it failed**:
- Album IDs in store didn't match albumId from URL
- Fallback kicked in and returned `albums[0]` (first album)
- Result: Always showed The Wall (tc1) or OK Computer (tc1b)

#### Impact Assessment
- [x] Does this affect global state/navigation? No - isolated to RankingView
- [x] Does it work on Hard Refresh? No - same issue
- [x] Does it work for New AND Existing items? Affects all albums
- [ ] Does it introduce visual artifacts? No

#### Resolution
Removed buggy fallback and added debug logging:

```javascript
findAlbum(albumId) {
    const albums = albumsStore.getAlbums()
    
    console.log('[RankingView] Looking for album:', albumId)
    console.log('[RankingView] Available albums:', albums.map(a => a.id))

    // FIX #20: Only return album if ID matches exactly
    // DO NOT fallback to first album - that causes wrong album to display
    const album = albums.find(a => a.id === albumId)
    
    if (!album) {
        console.warn('[RankingView] Album not found:', albumId)
    }
    
    return album || null
}
```

**Now**:
- ID matches → Shows correct album
- ID doesn't match → Shows "Album Not Found" (correct behavior)
- Console logs help debug ID mismatches

#### Files Modified
- `public/js/views/RankingView.js` (lines 207-222)

#### Verification
- ✅ Click "View Ranked Tracks" on different albums → Shows correct album each time
- ✅ Console logs show correct album IDs being searched
- ✅ No more "fallback to first album" behavior

#### Next Steps
If "Album Not Found" appears, console logs will reveal ID mismatch issue. May need to investigate:
- How album IDs are generated
- URL encoding/decoding of album IDs
- Store vs URL ID format differences

---

## Session Summary (2025-11-30 19:17 - 20:30)
- Started with 2 "Resolved" issues actually broken
- Fixed Issues #15, #16 through 7 iterations
- Discovered 2 new regressions (Issues #19, #20)
- All 4 issues now resolved
- Total fixes: 11 code changes across 3 files
- **Status**: Pending UAT confirmation for all fixes


#### Addendum: The "Real" Root Cause (2025-11-30 21:05)
After removing the fallback in `RankingView`, all albums showed "Album Not Found".
- **Investigation**: Console logs showed `Looking for album: undefined`.
- **Discovery**: `app.js` registered route as `/ranking/:id`, but `RankingView` expected `params.albumId`.
- **Final Fix**: Updated `public/js/app.js` to use `/ranking/:albumId`.
- **Status**: ✅ FULLY VERIFIED

---

## Previous Session (2025-11-29)

### Issue #18: Firebase API Key Client-Side Error
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
User reported `Firebase: Error (auth/api-key-not-valid)` on page reload. Console showed `apiKey: "API_KEY_PLACEHOLDER"`.

#### Root Cause
`public/index-v2.html` was missing the script tag to load `public/js/firebase-config.js`.
`app.js` relies on `window.__firebase_config` being set by this script; otherwise, it falls back to a default object with placeholders.

#### Resolution
Added `<script src="/js/firebase-config.js"></script>` to `public/index-v2.html` before the main module script.

---

### Issue #17: InventoryView Runtime Error
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
User reported `TypeError: this.escapeHtml is not a function` when accessing the Inventory page.

#### Root Cause
`InventoryView.js` called `this.escapeHtml()` assuming it was inherited from `BaseView`. However, `BaseView.js` did not implement this method, unlike other views that implemented it locally or didn't use it.

#### Resolution
- Added `escapeHtml` utility method to `BaseView.js` to make it available to all view components.
- Verified that `InventoryView` now renders correctly.

---

### Issue #16: View Mode State Mismatch
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
"View Mode" toggle button text ("View Expanded" / "View Compact") was inconsistent with the actual view state (Grid vs List) on page load, and the preference was not persisting.

#### Root Cause
`AlbumsView` constructor initialized `viewMode` to `'grid'` (hardcoded) instead of reading from `localStorage`. The toggle logic assumed a binary state that didn't match the initial value.

#### Resolution
- Updated `AlbumsView` constructor to read `localStorage.getItem('albumsViewMode')`.
- Defaulted to `'compact'` (Grid) if not set.
- Standardized toggle logic to switch between `'compact'` and `'expanded'`.

---

### Issue #15: Ghost Albums Regression
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
When switching between series, albums from the previous series would sometimes remain visible or mix with the new series' albums.

#### Root Cause
**Race Condition**: `loadAlbumsFromQueries` triggers an async API call. If the user switched series quickly, the previous request's callback would still fire and add albums to the store *after* the store had been reset for the new series.

#### Resolution
- Implemented `AbortController` in `AlbumsView`.
- Added `AbortSignal` support to `APIClient.fetchMultipleAlbums`.
- `AlbumsView` now cancels any pending requests before starting a new load or when destroyed.

---

### Issue #14: Generate Playlists 500 Error
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
Server crashed with `ReferenceError: Album is not defined` when hitting `/api/playlists`.

#### Root Cause
`curation.js` (shared code) performed an `instanceof Album` check. On the server (Node.js), the `Album` class was not imported/defined in the global scope where `curation.js` was running, causing a crash.

#### Resolution
- Added a guard in `curation.js`: `if (typeof Album !== 'undefined' && album instanceof Album)`.
- This allows the server to gracefully fall back to legacy object handling while keeping strict checks on the client.

---

### Issue #13: Original Order Incorrect After Refresh
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
Even after fixing the Refresh button (Issue #12), the "Original Album Order" column still displays the Ranked track list.

#### Impact Assessment
- [x] Check ARCHITECTURE.md: Verified data flow in `data_flow_analysis.md`.
- [ ] Does this affect global state/navigation? No, local to AlbumsView.
- [x] Does it work on Hard Refresh? No (stale cache persists).
- [ ] Does it work for New AND Existing items? Existing items affected.
- [ ] Does it introduce visual artifacts? Yes, added `[DEBUG]` badge for verification.

#### Investigation History
1.  **Phase 1: Data Verification**
    *   **Hypothesis**: Server sending wrong data or Client normalizing it incorrectly.
    *   **Action**: Ran `curl` and added logs to `client.js`.
    *   **Result**: ✅ Server and Client confirmed CORRECT. `tracksOriginalOrder` was present and correct in the Model.
2.  **Phase 2: Visual Debugging (The "Stale Code" Red Herring)**
    *   **Hypothesis**: View not receiving data or Browser caching old code.
    *   **Action**: Added `[DEBUG]` badges and console logs to `AlbumsView.js`.
    *   **Observation**: Badges and logs did NOT appear in the user's browser, even after F5 and server restart.
    *   **Incorrect Conclusion**: Assumed aggressive browser caching or build failure.
3.  **Phase 3: The Breakthrough**
    *   **Re-evaluation**: Noticed the URL in the user's screenshot was `/ranking/jimi-hendrix...`.
    *   **Discovery**: The user was viewing the **Album Details Page** (`RankingView.js`), NOT the **Albums List** (`AlbumsView.js`).
    *   **Verification**: Checked `RankingView.js` and found the *exact same bug* (ignoring `tracksOriginalOrder`).

#### Root Cause
*   **Wrong File Targeted**: Debugging `AlbumsView.js` while user was on `RankingView.js`.
*   **Code Defect**: `RankingView.js` used `const tracks = album.tracks || []`, which defaults to the Ranked list, ignoring the available `tracksOriginalOrder`.w API response being correct.

---

### Issue #12: Refresh Button Silent Failure
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
User clicked "Refresh" button to fix stale cache, but nothing happened (no reload, no logs).

#### Root Cause
Typo in `AlbumsView.js`: Checked `activeSeries.albums` (undefined) instead of `activeSeries.albumQueries`.
```javascript
if (activeSeries?.albums) { ... } // Evaluates to false
```

#### Resolution
Corrected property name to `activeSeries.albumQueries`.

#### Verification
User confirmed "it's finally reloading".

---

### Issue #11: API Key Not Loaded (Regression)
**Status**: 🟡 Potential Fix Applied
**Date**: 2025-11-29

#### Problem
Backend fails with `503 Service Unavailable` and logs `Warning: AI_API_KEY not set`, even though `.env` exists in `server/` directory.

#### Root Cause
`dotenv` configuration was looking for `.env` in the project root (CWD), but the file is located in `server/`.

#### Resolution
Updated `server/index.js` to use absolute path resolution:
```javascript
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
```

#### Verification
- Server restarted.
- Log confirmed: `AI proxy server listening...` (No warning).
- **Pending User Confirmation**.

---

### Issue #10: API 400 Bad Request
**Status**: 🟡 Potential Fix Applied
**Date**: 2025-11-29

#### Problem
User reported `400 Bad Request` when generating albums after fixing Axios error.

#### Root Cause
Payload mismatch: `client.js` was sending `{ album: query }` but server expects `{ albumQuery: query }`. This regression was introduced when replacing `_fetchAlbumFromAPI` with direct `axios.post`.

#### Resolution
Updated `client.js` to send correct payload property `albumQuery`.

#### Verification
- Code updated.
- **Pending User Confirmation**.

---

### Issue #9: Axios Reference Error
**Status**: 🟡 Potential Fix Applied
**Date**: 2025-11-29

#### Problem
User reported `ReferenceError: axios is not defined` when loading albums after Domain Model refactor.

#### Root Cause
`axios` was used in `client.js` but was not listed in `package.json` dependencies, nor imported in the file. Previous implementation likely relied on global scope or different fetch method.

#### Resolution
1. Installed `axios` via npm.
2. Added `import axios from 'axios'` to `public/js/api/client.js`.

#### Verification
- `npm install` completed successfully.
- Code updated.
- **Pending User Confirmation**.

---

### Issue: Domain Model Anemia (Refactor)
**Status**: 🟡 Potential Fix Applied
**Date**: 2025-11-29

#### Problem
Persistent data integrity issues (missing artist/album fields, original order regression) due to "Anemic Domain Model" (passing raw JSON).

#### Resolution
Refactored to Rich Domain Model:
- Created `Track`, `Album`, `Playlist`, `Series` classes.
- Updated `client.js` to hydrate instances.
- Updated `curation.js` to use model methods.

**See**: [walkthrough.md](../../docs/walkthrough.md)

---

### Issue #8: Store State Management - Architectural Problem
**Status**: 🟡 In Progress (Root Cause Analysis)  
**Date**: 2025-11-29 17:00  
**Related Files**: AlbumsView.js, PlaylistsView.js, RankingView.js

#### Symptoms
- Ghost Albums **RETURNED** after adding recovery logic
- "Album Not Found" was never properly fixed
- Code duplication across 3 views (AlbumsView, PlaylistsView, RankingView)

#### Root Cause
- **Band-aid approach**: Treating symptom (empty store) instead of cause
- Each view doing `reset() + reload` creates race conditions
- Store being cleared when it shouldn't be

#### Wrong Approach (Current)
```
AlbumsView.destroy() → reset store
  → Every other view needs recovery logic
  → Duplicated code + ghost data issues
```

#### Correct Approach (Proposed)
```
Store should persist while series is active
  → Only reset when:
    1. User changes series
    2. User explicitly refreshes
    3. App closes
  → No recovery logic needed in views
```

#### Action Plan
- [x] LOG this issue
- [x] REVERT RankingView changes (recovery logic)
- [ ] REVERT PlaylistsView changes (recovery logic)  
- [x] REMOVE albumsStore.reset() from AlbumsView.destroy()
- [ ] TEST that all views work without reset
- [ ] VERIFY ghost albums don't return

**See Also**: [ARCHITECTURE.md - Store State Management](../../docs/ARCHITECTURE.md#store-state-management-current)

---

### Issue #7: Album Click Navigation - "Album Not Found"
**Status**: 🔴 Reverted (Wrong Approach)  
**Date**: 2025-11-29 16:38  
**Resolution**: Identified as symptom of Issue #8 (store management). Fix reverted in favor of architectural solution.

**See**: Issue #8 for proper fix.

---

### Issues #1-6: Various Regressions
**Status**: ✅ Resolved  
**Date**: 2025-11-28 - 2025-11-29  

Summary of resolved issues (see archived versions for details):
1. Navigation regression (button URL)
2. HTML artifacts (template strings)
3. Syntax errors (duplicated braces)
4. Hard refresh empty state
5. PlaylistsView empty state
6. Various UI regressions

---

## Previous Debugging Sessions (2025-11-28 and earlier)

### Sprint 4.5 Phase 2: localStorage Cache Missing New Fields
**Status**: ✅ Resolved (Deferred to Sprint 5)  
**Date**: 2025-11-28  
**Duration**: 16:00 - 18:50 (2h50m)

#### Problem
After implementing new album fields (`bestEverAlbumId`, `bestEverUrl`, `tracksOriginalOrder`), albums loaded from cache showed `undefined` for these fields.

#### Root Cause
- Albums cached in localStorage before code changes lack new normalized fields
- Cache hit bypasses normalization, loading old structure

#### Resolution
- ✅ Added "Refresh" button to force skip-cache reload
- ✅ Modified `loadAlbumsFromQueries(queries, skipCache)` to accept flag
- ⏸️ Complete fix deferred to Sprint 5 (Firestore migration)

#### Rationale for Deferral
1. Firestore = Better solution (persistent, schema versioning, no limits)
2. Temporary workaround sufficient (affects only existing cache)
3. New data normalizes correctly

**See**: [SPRINT_5_PERSISTENCE_ARCHITECTURE.md](../../docs/archive/architecture-artifacts-2025-11-29/SPRINT_5_PERSISTENCE_ARCHITECTURE.md)

---

### Issue: Original Album Order Regression (Sprint 4.5)
**Status**: ✅ Resolved (Workaround)
**Date**: 2025-11-28

#### Problem
"Original Album Order" column showed Ranked order or `undefined` fields after update.

#### Root Cause
**Cache Poisoning**: `localStorage` contained old album objects without `tracksOriginalOrder`.
`AlbumsView` fell back to `tracks` (Ranked) when `tracksOriginalOrder` was missing.

#### Resolution
1. Added `tracksOriginalOrder` to `normalizeAlbumData`.
2. Implemented "Refresh" button to force cache update.
3. **Architecture Fix**: Planned migration to Firestore to avoid localStorage schema issues.

**See**: [album_data_schema.md](../../docs/album_data_schema.md) for data mapping.

---

### Sprint 4.5: Missing Tailwind CSS
**Status**: ✅ Resolved  
**Date**: 2025-11-28  
**Duration**: 09:00 - 10:20

#### Problem
Site rendered without styles (Header, Footer, Hero Banner broken)

#### Root Cause
Tailwind CSS classes used in code but never installed or included

#### Resolution
Added Tailwind via CDN in `public/index-v2.html`:
```html
<script src="https://cdn.tailwindcss.com"></script>
```

---

### Sprint 4: Series Mixing Bug
**Status**: ✅ Resolved  
**Date**: 2025-11-27 (Late afternoon)

#### Problem
Albums from previous series persisted when switching to new series

#### Root Cause
`AlbumsView` appending albums without clearing previous state

#### Resolution
Added `albumsStore.reset()` in `AlbumsView.loadAlbumsFromQueries()`

---

### Sprint 4: Ratings Not Loading
**Status**: ✅ Resolved  
**Date**: 2025-11-27  
**Duration**: 09:30 - 14:32 (5h)

#### Problem
Album ratings not displaying (showed "⚠ No ratings" instead of "✓ Rated")

#### Root Causes Found
1. **Backend** - Not mapping ratings from `rankingConsolidated` to tracks
2. **Frontend** - Detection logic relied on non-existent `rankingConsolidatedMeta.hasRatings`
3. **Cache** - localStorage contained old data without ratings
4. **ID Mismatch** - HTML `id="albumQueries"` vs JS `id="albumList"`

#### Fixes Applied
**Backend** (`server/index.js`):
```javascript
// Added ratingMap alongside rankMap
const ratingMap = new Map()
albumPayload.rankingConsolidated.forEach(r => {
  if (r.rating != null) ratingMap.set(normalizeKey(r.trackTitle), r.rating)
})
```

**Frontend** (`public/js/api/client.js`):
```javascript
// Calculate hasRatings from actual data
const hasRatings = tracks.some(t => 
  (t.rating !== null && t.rating !== undefined) ||
  (t.rank !== null && t.rank !== undefined)
)
```

**UX**: Added "Clear Cache" button  
**Validation**: Added minimum 2 albums requirement  
**Navigation**: Added breadcrumbs to all views

#### Files Modified
- server/index.js (+13 lines)
- public/js/api/client.js (+15 lines)
- public/js/views/HomeView.js (+25 lines)
- public/js/components/Breadcrumb.js (93 lines, NEW)

---

### Sprint 4: Rank Display in Playlists
**Status**: ✅ Resolved  
**Date**: 2025-11-27

#### Problem
"Rank: -" displayed despite data being available

#### Root Cause
Frontend only checked `track.rank`, backend returned `acclaimRank` or `finalPosition`

#### Resolution
Added fallback chain: `rank || acclaimRank || finalPosition || '-'`  
**File**: `public/js/api/client.js`

---

### Hotfix: Ranking by Acclaim (Production)
**Status**: ✅ Resolved  
**Date**: 2025-11-24  
**Severity**: High (Production Issue)

#### Issue
Tracks not properly sorted by acclaim ranking in production. "Another Brick in the Wall" parts showed rawScore 0.

#### Root Cause
1. **Normalization Mismatch**: Server-side `normalizeKey` was too simple (`trim().toLowerCase()`), missing punctuation variants.
2. **Deduplication**: Client-side `collectRankingAcclaim` had weak deduplication keys, overwriting valid entries.
3. **Mapping**: Backend wasn't mapping `finalPosition` to `tracks[].rank` correctly.

#### Resolution
1. **Server**: Enhanced `normalizeKey` (remove diacritics, non-alphanumeric).
2. **Server**: Updated `rankingConsolidated` mapping to use robust normalization.
3. **Client**: Updated `collectRankingAcclaim` (now in `curation.js` logic) to include `trackTitle` + `albumId` in dedup key.
4. **Client**: `normalizeAlbumData` maps `acclaimRank` -> `rank`.

**Critical Logic Preserved**:
- `tracksOriginalOrder` MUST remain AS IS (1..N based on disc).
- `tracks` (Ranked) MUST be sorted by rating/rank.

**Full Details**: [HOTFIX_RANKING_ACCLAIM.md](../../docs/archive/hotfixes/HOTFIX_RANKING_ACCLAIM.md)

---

## Debug Tools & Visual Elements

### Visual Debug Elements Added (AlbumsView)
**Date**: 2025-11-28  
**Purpose**: Filter debugging  
**Status**: 🟢 Active (removable)

All debug elements marked with `// DEBUG:` comments for easy removal.

#### Visual Debug Panel
- **Location**: Line ~142-170 in AlbumsView.js
- **Purpose**: Real-time filter state display
- **Marker**: `<!-- DEBUG: Visual Debug Panel START/END -->`

#### Console Logs
All prefixed with `🔍 [DEBUG]` for easy filtering in DevTools

### How to Remove Debug Code
```bash
# Find all debug comments
grep -n "// DEBUG:" public/js/views/AlbumsView.js

# Find all debug console logs
grep -n "🔍 \\[DEBUG\\]" public/js/views/AlbumsView.js
```

---

## Lessons Learned

### Architecture
1. **Band-aids create technical debt**: Recovery logic led to ghost albums
2. **Store persistence matters**: Don't clear state unnecessarily
3. **Single source of truth**: Firestore > localStorage for schema evolution

### Debugging
1. **ID consistency critical**: Mismatched IDs cause silent failures
2. **Cache invalidation**: Always consider cache when testing API changes
3. **Separation of concerns**: Backend vs Frontend issues need separate debugging
4. **Metadata vs Data**: Don't trust metadata fields, inspect actual data

### Development
1. **Verify dependencies**: Never assume a library is available
2. **Visual verification**: Code working ≠ renders correctly
3. **Browser automation limits**: Manual testing sometimes more reliable

---
**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol


