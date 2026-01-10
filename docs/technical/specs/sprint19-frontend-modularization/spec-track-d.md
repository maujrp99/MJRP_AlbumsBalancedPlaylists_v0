# Specification - Sprint 19 Track D: View Modularization Refinement

**Status**: ✅ IMPLEMENTED
**Created**: 2026-01-10
**Goal**: Finalize the modularization of `SeriesView` and `SavedPlaylistsView` to achieve true "Thin View" architecture and meet strict LOC targets.

---

## 1. Problem Statement (WHAT)
While Sprint 19 Track A reduced the size of the main views, `SeriesView.js` (~356 LOC) and `SavedPlaylistsView.js` (~274 LOC) are still above the <200 LOC target. They still contain significant chunks of component orchestration and manual DOM handling that burdens the view layer.

Specifically:
- **`SeriesView`** manually instantiates and mounts 5+ sub-components, acting as a noisy "Factory".
- **`SavedPlaylistsView`** contains embedded inline logic for `Series Groups` and `Playlist Details Modals`, which triggers "God Method" warnings.

---

## 2. Proposed Changes (HOW)

### A. SeriesView Refinement
- **Extract `SeriesViewMounter`**: A helper class responsible for the nitty-gritty of selecting DOM nodes and instantiating components.
- **Extract `SeriesModalsManager`**: A class to encapsulate the event handling/wiring for Edit/Delete modals.

### B. SavedPlaylistsView Refinement
- **Extract `SavedSeriesGroup.js`**: Componentize the rendering of a series header and its batch container.
- **Extract `PlaylistDetailsModal.js`**: Move the modal construction logic (SafeDOM) into a standalone reusable component.

---

## 3. Success Criteria
1. **`SeriesView.js` LOC**: < 200.
2. **`SavedPlaylistsView.js` LOC**: < 200.
3. **No Inline DOM Logic**: Views should only coordinate high-level data flow.
4. **Build Status**: PASS.
5. **Regression**: `[SERIES]` and `[HISTORY]` checklists pass via Agent Browser.

---

## 4. Risks & Mitigations
- **Event Wiring**: Moving modal logic out might break event delegation.
  - *Mitigation*: Ensure `SeriesModalsManager` accepts callbacks and has clear interface.
- **Styling**: Extracting components might affect CSS selectors if not careful.
  - *Mitigation*: Maintain existing class names and structure.
