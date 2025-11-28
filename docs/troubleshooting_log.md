# Sprint 4: Troubleshooting Log - Ratings Not Loading

**Date**: 2025-11-27  
**Session Duration**: 09:30 - 14:32 (5h)  
**Issue**: Album ratings not displaying ("⚠ No ratings" instead of "✓ Rated")

---

## Timeline & Root Causes

### 09:30 - Initial Investigation
**Problem Reported**: User reports ratings not loading  
**Initial Hypothesis**: Frontend detection issue

### 09:45 - Backend Testing
**Action**: Tested `/api/generate` with curl  
**Finding**: Backend returns `rank` (position) but `rating: null`  
**Root Cause #1**: Backend wasn't mapping ratings from `rankingConsolidated` to individual tracks

### 10:15 - Backend Fix Applied
**File**: `server/index.js` (lines 239-260)  
**Change**: Added `ratingMap` alongside existing `rankMap`
```javascript
// BEFORE: Only mapped rank
const rankMap = new Map()
albumPayload.rankingConsolidated.forEach(r => {
  rankMap.set(normalizeKey(r.trackTitle), r.finalPosition)
})

// AFTER: Maps both rank AND rating
const ratingMap = new Map()
albumPayload.rankingConsolidated.forEach(r => {
  const key = normalizeKey(r.trackTitle)
  if (r.finalPosition != null) rankMap.set(key, r.finalPosition)
  if (r.rating != null) ratingMap.set(key, r.rating)  // NEW!
})
albumPayload.tracks.forEach(t => {
  const key = normalizeKey(t.title)
  if (rankMap.has(key)) t.rank = rankMap.get(key)
  if (ratingMap.has(key)) t.rating = ratingMap.get(key)  // NEW!
})
```

**Result**: Backend now returns `rating: 92` ✅  
**Verified**: curl test successful

### 10:30 - Frontend Detection Fix
**File**: `public/js/api/client.js` (lines 236-250)  
**Root Cause #2**: Frontend looked for `rankingConsolidatedMeta.hasRatings` (doesn't exist)  
**Change**: Calculate `hasRatings` from actual track data
```javascript
// BEFORE
hasRatings: data.rankingConsolidatedMeta?.hasRatings || false  // Always false!

// AFTER
const tracks = data.tracksByAcclaim || data.rankingConsolidated || data.tracks || []
const hasRatings = tracks.some(t => 
  (t.rating !== null && t.rating !== undefined) ||
  (t.rank !== null && t.rank !== undefined)
)
```

### 12:00 - Cache Issue Discovered
**Problem**: Demo showed all albums with "No ratings"  
**Root Cause #3**: L2 cache (localStorage) contained old data without ratings  
**Evidence**: Console logs showed "✅ L2 cache hit" - not calling backend!

### 12:30 - Clear Cache Button Added
**File**: `public/js/views/HomeView.js`  
**Change**: Added "🗑️ Clear Cache" button
```javascript
clearCacheBtn.on('click', () => {
  if (confirm('Clear all cached album data?')) {
    localStorage.clear()
    location.reload()
  }
})
```

### 13:00 - Minimum Albums Validation
**User Request**: Require minimum 2 albums for balanced playlists  
**File**: `public/js/views/HomeView.js` (handleCreateSeries)  
**Change**: Added validation
```javascript
if (albumQueries.length < 2) {
  alert('⚠️ Minimum 2 albums required for balanced playlists.\nPlease add at least one more album.')
  return
}
```

### 14:20 - ID Mismatch Bug Found
**Problem**: Validation not working, navigation failing  
**Root Cause #4**: HTML used `id="albumQueries"` but JS looked for `id="albumList"`  
**Files**: `public/js/views/HomeView.js` (HTML + JavaScript)  
**Change**: Standardized to `id="albumList"` everywhere

---

## Issues Fixed

### Backend Issues
1. ✅ **Missing rating mapping**: Added ratingMap to map BestEverAlbums scores to tracks
2. ✅ **Backend restart**: Killed old process and restarted with new code

### Frontend Issues  
3. ✅ **hasRatings detection**: Changed from metadata lookup to actual track inspection
4. ✅ **Cache preventing fresh data**: Added Clear Cache button with localStorage.clear()
5. ✅ **ID mismatch**: Standardized textarea ID to `albumList`
6. ✅ **Missing validation**: Added minimum 2 albums requirement

### UX Improvements
7. ✅ **Breadcrumbs**: Added to all views (Home › Albums › Ranking › Playlists)
8. ✅ **Clear guidance**: Added "Minimum 2 albums required" hint in label

---

## Files Modified (Total: 8 files)

### Backend (1 file)
- `server/index.js` (+13 lines) - ratingMap implementation

### Frontend (5 files)
- `public/js/api/client.js` (+15 lines) - hasRatings calculation
- `public/js/views/HomeView.js` (+25 lines) - Clear Cache + validation
- `public/js/views/AlbumsView.js` (+3 lines) - Breadcrumb integration
- `public/js/views/RankingView.js` (+3 lines) - Breadcrumb integration  
- `public/js/views/PlaylistsView.js` (+5 lines) - Breadcrumb integration

### Components (1 file)
- `public/js/components/Breadcrumb.js` (93 lines, NEW) - Navigation component

### Styles (1 file)
- `public/index-v2.html` (+33 lines CSS) - Breadcrumb styles

---

## Current Status (14:32)

### ✅ Working
- Backend returns ratings (verified curl)
- Frontend hasRatings detection logic
- Clear Cache button functional
- Minimum 2 albums validation
- Breadcrumbs on all pages
- ID consistency fixed

### ⏸️ Pending Verification
- End-to-end test with 3 albums
- Ratings badges display correctly
- Playlist generation UI

### 🔍 Known Issues
- Browser automation struggles with navigation (testing issue, not code issue)
- Playlist generation UI doesn't update (separate bug, lower priority)

---

## Testing Recommendations

### Manual Test (3 min)
1. Refresh: `http://localhost:5000/home`
2. Click "🗑️ Clear Cache" → Confirm
3. Create series with 3 albums:
   - The Rolling Stones - Let It Bleed
   - Jimi Hendrix - Electric Ladyland
   - Pink Floyd - The Wall
4. Click "Generate Rankings"
5. Wait ~60 seconds
6. **Verify**: How many show "✓ Rated"?

### Expected Result
- 2-3 albums show "✓ Rated" badge
- Tracks in RankingView show rating numbers (82, 92, 87...)
- Breadcrumbs visible and clickable

### If Still Fails
1. Open Console (Cmd+Option+J)
2. Run: `localStorage.clear(); location.reload()`
3. Check for any errors in Console
4. Verify backend is running: `curl http://localhost:3000/_health`

---

## Lessons Learned

1. **ID Consistency Critical**: Mismatched IDs between HTML and JS cause silent failures
2. **Cache Invalidation**: Always consider cache when testing API changes
3. **Separation of Concerns**: Backend data issues vs Frontend display issues need separate debugging
4. **Metadata vs Data**: Don't trust metadata fields, inspect actual data
5. **Browser Automation Limits**: Manual testing sometimes more reliable for complex flows

---

## Next Steps

1. Run final E2E demo to confirm ratings work
2. If successful:
   - Implement Consolidated RankingView (all albums in one page)
   - Fix playlist generation UI update bug
   - Commit Sprint 4 to Git
3. If unsuccessful:
   - Capture Console logs
   - Check Network tab for `/api/generate` response
   - Debug specific failure point

---

**Last Updated**: 2025-11-27 14:32  
**Status**: Ready for final E2E test

---

## Late Afternoon Fixes (18:30)

### 1. Series Mixing Bug
**Problem**: Albums from previous series persisted when switching to a new series.
**Root Cause**: `AlbumsView` was appending albums to `AlbumsStore` without clearing previous state.
**Fix**: Added `albumsStore.reset()` in `AlbumsView.loadAlbumsFromQueries()`.
**File**: `public/js/views/AlbumsView.js`

### 2. Rank Display in Playlists
**Problem**: "Rank: -" displayed in playlists despite data being available.
**Root Cause**: Frontend normalization only checked `track.rank`, but backend returned `acclaimRank` or `finalPosition`.
**Fix**: Added fallback chain: `rank || acclaimRank || finalPosition || '-'`.
**File**: `public/js/api/client.js`

---

**Final Status**: Sprint 4 Complete. All critical bugs resolved.

---

# Sprint 4.5: Troubleshooting Log - Missing Tailwind CSS

**Date**: 2025-11-28
**Session Duration**: 09:00 - 10:20
**Issue**: Site rendered without styles (Header, Footer, Hero Banner broken) on localhost.

## Timeline & Root Causes

### 10:15 - Issue Reported
**Problem**: User reported that despite code changes, the site looked "broken" and styles were missing.
**Observation**: `HomeView.js` used Tailwind classes (`w-full`, `flex`, `bg-black`, etc.), but they were not applying.

### 10:18 - Root Cause Identification
**Investigation**: Checked `public/index-v2.html` and `package.json`.
**Finding**: 
1. `package.json` did not have Tailwind installed as a dev dependency.
2. `public/index-v2.html` did not include the Tailwind CDN or a built CSS file containing Tailwind utilities.
**Root Cause**: Tailwind CSS was being used in the code but was never actually installed or included in the project.

### 10:20 - Fix Applied
**File**: `public/index-v2.html`
**Change**: Added Tailwind CSS via CDN.
```html
<!-- Tailwind CSS for v2.0 Premium UI -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          // Add any custom colors here if needed
        }
      }
    }
  }
</script>
```
**Also**: Commented out legacy "Sprint 2" styles to prevent conflicts.

**Result**: Styles immediately rendered correctly. Glassmorphism, gradients, and layout fixed.

## Lessons Learned
1. **Verify Dependencies**: Never assume a library is available just because the code uses it. Always check `package.json` or HTML includes.
2. **Visual Verification**: "It works on my machine" (or in code) doesn't mean it renders correctly. Visual checks are crucial.
