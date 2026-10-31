# Specification - Sprint 19 Track E: SeriesView Final Refinement

**Status**: 📋 PENDING REVIEW
**Created**: 2026-01-10
**Goal**: Finalize the modularization of `SeriesView.js` to achieve strictly < 200 LOC by extracting orchestration logic into specialized helpers (Factory, Updater, Manager).

---

## 1. Problem Statement (WHAT)
`SeriesView.js` (currently 315 LOC) is still too large. It acts as a "Fat Orchestrator", handling:
1.  **Component Mounting**: Manually picking selectors and instantiating 4+ components.
2.  **DOM Updates**: Manually updating headers, loaders, and empty states.
3.  **Event Wiring**: acting as a middleman for every event from Toolbar/Grid to Controller.

To meet the <200 LOC target, we must externalize these responsibilities.

## 2. Proposed Changes (HOW)

### A. Extract `SeriesComponentFactory.js` (Construction)
A centralized factory to handle `new Component(...)` logic.
*   **Purpose**: Unify component instantiation.
*   **Pattern**: `createHeader(props)`, `createToolbar(props)`, `createGrid(props)`.
*   **Benefit**: Removes configuration noise from the View.
*   *Note*: This effectively renames/refines the `SeriesViewMounter` concept to be more pure.

### B. Extract `SeriesViewUpdater.js` (State Reflection)
A helper class to handle all DOM updates.
*   **Purpose**: "View receives State -> Updater reflects State in DOM".
*   **Methods**:
    *   `updateHeader(state)`
    *   `updateLoading(isLoading)`
    *   `updateDifference(diff)`
*   **Benefit**: Removes all `this.components.header.update(...)` logic from the main view.

### C. Refine `SeriesModalsManager.js`
Ensure it is self-contained. The View should just call `this.modals.mount()` and forget about it.

### D. Eliminate Event Proxies (Direct Binding)
Remove methods like `handleSearch`, `handleFilter`.
*   **Strategy**: Pass `this.controller.handleSearch` directly to the Factory/Component props.

---

## 3. Success Criteria
1.  **`SeriesView.js` LOC**: < 200 (Strict limit).
2.  **Architecture**: The View becomes a pure connector:
    *   `mount()`: Calls `Factory`.
    *   `update()`: Calls `Updater`.
    *   `destroy()`: Calls `Factory/Updater` cleanup.
3.  **No Logic**: Zero `if/else` logic in the main view.
4.  **Regression**: `[SERIES]` checklist passes.

## 4. Risks & Mitigations
*   **Context Loss (`this`)**: Direct passing of controller methods might lose context.
    *   *Mitigation*: Use `.bind(this.controller)` in the View before passing to Factory.
*   **Prop Drilling**: Passing many props to Factory.
    *   *Mitigation*: Group props into a single `config` object where appropriate.
