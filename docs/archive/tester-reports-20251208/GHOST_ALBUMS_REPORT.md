# Bug Report: Ghost Albums Regression (Expanded View)

**Date**: 2025-12-03
**Severity**: High
**Component**: `AlbumsView.js` / `AlbumsStore.js`
**Status**: ✅ **RESOLVED** (2025-12-06)

## Description
When switching between series while in **Expanded View** (List View), albums from the previously viewed series appeared in the current series. This "Ghost Album" effect was specific to the Expanded View mode.

## Reproduction Steps
1.  **Pre-condition**: Have at least two series created (e.g., "Series A" and "Series B").
2.  Open **Series A**.
3.  Switch to **Expanded View** (Click "View Expanded").
4.  Navigate back to **Home**.
5.  Open **Series B**.
6.  **Observation**: The view displayed albums from Series B **AND** albums/tracks from Series A.

## Evidence
**Initial Bug Report Screenshot**: `prod_expanded_switch_to_b_1764802058857.png`

## Technical Analysis & Root Cause

### Missing Guard in `updateAlbumsGrid`
The `render()` method in `AlbumsView.js` had logic to prevent ghost albums by checking `lastLoadedSeriesId`, but the `updateAlbumsGrid()` method, which was called by the store subscription, **lacked this check**.

If the `albumsStore` contained stale data after the view mounted, `updateAlbumsGrid` would blindly render it.

### Why Expanded View?
Expanded view generated more DOM elements (tracks), potentially making the race condition more observable.

## Resolution
**Fix Date**: 2025-12-06  
**Fixed By**: AI Developer  
**Verification**: Regression test executed in production - **PASS**

**Test Flow**:
1. Created Series A (Beatles, Led Zeppelin)
2. Created Series B (Nirvana, Pearl Jam)  
3. Viewed Series A in Expanded View
4. Switched to Series B
5. **Result**: ✅ Only Series B albums visible (no ghosts)

**Status**: Issue **RESOLVED** - No ghost albums detected in production after fix.

## Evidence of Fix
![Expanded View Test - No Ghosts](file:///Users/mpedroso/.gemini/antigravity/brain/7079f1cc-f610-478a-a72a-bb506cb58e18/prod_expanded_switch_to_b_1764802058857.png)

---

**Referenced in**: [SPRINT5_UAT_FINAL_REPORT.md](./SPRINT5_UAT_FINAL_REPORT.md) (Phase 3: Regression Testing)
