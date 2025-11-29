# Debug Log

**Last Updated**: 2025-11-29 17:38  
**Workflow**: See `.agent/workflows/debug_issue.md`

---

## Current Debugging Session

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

## Previous Debugging Sessions

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
Tracks not properly sorted by acclaim ranking in production

#### Root Cause
Ranking logic using incorrect field mapping between API response and normalized data

#### Resolution
Updated `normalizeAlbumData()` to correctly map:
- `track.acclaimRank` → `track.rank`
- `track.acclaimScore` → `track.normalizedScore`

**Full Details**: [HOTFIX_RANKING_ACCLAIM.md](../../docs/archive/hotfixes/HOTFIX_RANKING_ACCLAIM.md)

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
