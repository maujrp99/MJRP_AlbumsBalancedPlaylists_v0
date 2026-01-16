# Sprint 21 Regression Audit Report

**Date**: 2026-01-15  
**Scope**: Skeleton UX Implementation (Issue #152)  
**Status**: 🟡 PARTIALLY FIXED (Bug B resolved, Bug A open)

---

## Summary

During the implementation of Issue #152 (Ghost Skeletons & Progress Bar), patches were applied that introduced two regressions in the Series View functionality.

---

## Patches Applied

| File | Change | Risk Level |
|------|--------|------------|
| `SeriesController.js` | Removed empty-album suppression, added skeleton trigger | LOW |
| `SeriesViewUpdater.js` | Added `isLoading` parameter | LOW |
| `SeriesView.js` | Passed `isLoading` to updater | LOW |
| `SeriesGridRenderer.js` | **Removed album-count filter, added skeleton rendering** | **HIGH** |
| `animations.css` | Added `.animate-pulse` rule | NONE |

---

## Bugs Introduced

### Bug A: New Series Albums Not Loading
- **Symptom**: New series "test aaa" showed "0 albums" despite having albums defined.
- **Root Cause**: The removal of suppression logic in `SeriesController.js` combined with renderer changes caused albums to not be matched to their series correctly during the render cycle.

### Bug B: Series Filter Ignoring Selection
- **Symptom**: Selecting a specific series (e.g., "test aaa") in the dropdown still shows all series (Tiesto, Black Crowes, etc.).
- **Root Cause**: The patch removed `if (group.albums.length === 0) return;` from `SeriesGridRenderer._renderVirtualScopedGrid`. This line was **accidentally masking** an architectural flaw: the `seriesList` passed to the renderer was never filtered by the selected scope. All series were always in the list, but empty ones were simply skipped. The skeleton patch exposed this.

---

## Architectural Flaw Identified

The `SeriesGridRenderer` receives the FULL unfiltered series list. The filtering only happens at the ALBUM level (which albums to show), not at the SERIES level (which series headers to render).

**Flow Before Patch**:
```
seriesList = ALL_SERIES → groupAlbumsBySeries → group.albums.length === 0 → SKIP
```

**Flow After Patch**:
```
seriesList = ALL_SERIES → groupAlbumsBySeries → group.albums.length === 0 → RENDER SKELETON
```

The skeleton intention is correct, but it exposed that the wrong series are being rendered.

---

## Fix Required

Filter `seriesList` in `SeriesViewUpdater.updateGrid()` BEFORE passing to the grid:

```javascript
let filteredSeriesList = seriesList;
if (currentScope !== 'ALL') {
    filteredSeriesList = seriesList.filter(s => s.id === currentScope);
}
```

This ensures that when a specific series is selected, ONLY that series is passed to the renderer.

---

## Lessons Learned

1. **Defensive Code Can Mask Bugs**: The original `return` statement was defensive but hid the fact that filtering wasn't implemented correctly upstream.
2. **Test with Edge Cases**: Creating new series and filtering should have been tested before marking skeleton fix as complete.
3. **Regression Checklists**: Follow `docs/manual/regression_checklist.md` for `[SERIES]` tag.
