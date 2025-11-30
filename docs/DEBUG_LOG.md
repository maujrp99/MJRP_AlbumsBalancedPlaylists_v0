# Debug Log

**Last Updated**: 2025-11-29 20:45
**Workflow**: See `.agent/workflows/debug_issue.md`

---

## Current Debugging Session (2025-11-29)

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

## Maintenance Notes

**How to Update This Document**:
1. Active issues → Current Debugging Session
2. Resolved/reverted issues → Move to Previous with timestamp
3. Keep Previous sections for history (don't delete)
4. Link to ARCHITECTURE.md for architectural decisions

**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol
