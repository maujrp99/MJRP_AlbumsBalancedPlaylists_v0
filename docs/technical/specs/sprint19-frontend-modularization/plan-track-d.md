# Additional Modularization Analysis (Track D Implementation Plan)

## 1. SeriesView.js Analysis
**Current State**: ~425 LOC
**Goal**: < 200 LOC

### Observation
The `SeriesView` is still heavy because it manually instantiates and mounts every single sub-component. It acts as a "Component Factory" rather than just a view shell.

### Proposals
1.  **Extract `SeriesViewMounter.js`**: Reference the Pattern used in `InventoryView` where a helper handles the nitty-gritty of DOM query selector + Instantiation.
2.  **Extract `SeriesComponentFactory.js`**: A centralized place to unify the `new SubComponent({...props})` logic. This cleans up the massive `mountToolbar`, `mountGrid`, `mountHeader` methods which are just prop-drilling configurations.
3.  **Extract `SeriesModalsManager.js`**: The SeriesModals handling (lines 266-311) takes up ~45 lines just to delegate events. This could be its own controller/manager class.

### Impact
- `SeriesView.js` would effectively become:
  ```javascript
  mount() {
     this.components = SeriesComponentFactory.createAll(this.container, this.controller);
  }
  ```

---

## 2. SavedPlaylistsView.js Analysis
**Current State**: ~320 LOC
**Goal**: < 200 LOC

### Observation
This file still contains significant **Render Logic** for UI structures that haven't been componentized yet.

### Proposals
1.  **Extract `SavedSeriesGroup.js`**: Lines 106-153 render a Series Group container. This is a distinct UI component with its own "Add", "Back", "Delete" buttons and state.
2.  **Extract `PlaylistDetailsModal.js`**: Lines 255-316 (~60 LOC) are pure UI rendering for a modal. This violates Separation of Concerns. This should be a standalone component `public/js/components/playlists/PlaylistDetailsModal.js`.
3.  **Use `SavedPlaylistsViewMounter`**: Similar to above, move the high-level orchestration out.

---

## 3. Recommendation (Sprint 19 Track D)

### Priority 1: `PlaylistDetailsModal` (SavedPlaylistsView)
- **Why**: It's a huge chunk of inline DOM logic that is hidden inside the view. It should be reusable or at least isolated.
- **Gain**: ~60 LOC reduction.

### Priority 2: `SavedSeriesGroup` (SavedPlaylistsView)
- **Why**: The "Group Header" with buttons is complex enough to be its own component.
- **Gain**: ~50 LOC reduction.

### Priority 3: `SeriesModalsManager` (SeriesView)
- **Why**: Event definitions for modals are verbose.
- **Gain**: ~45 LOC reduction.

### Verification Plan
1.  **Refactor**: Apply changes 1-by-1.
2.  **Verify**: Run `[SERIES]` and `[HISTORY]` regression tests after each extraction.
