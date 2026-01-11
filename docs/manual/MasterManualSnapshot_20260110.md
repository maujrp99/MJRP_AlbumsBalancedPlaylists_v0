# The Album Blender - Master Manual Snapshot (2026-01-10)

> **Snapshot Date**: January 10, 2026
> **Version**: 3.17.0 (Sprint 19 Track F Complete)
> **Status**: **Stable**
> **Focus**: Test Suite Revamp, V3 Home Workflow, Stores Refactoring.

---

## 📚 01. System Architecture (`01_System_Architecture.md`)

*Summary*: The Album Blender is a hybrid application with a Node.js/Express backend (proxying 3rd party APIs) and a Vanilla JS frontend using a specialized "Service-Worker-Store" architecture (Sprint 19).

### Key Patterns
1.  **Pure Stores**: Frontend state is managed by `PlaylistsStore.js` and `SeriesStore.js` (Pure State, no logic).
2.  **Services**: Logic is encapsulated in `PlaylistsService.js` and `SeriesService.js`.
3.  **Views**: UI components (`HomeView.js`, `SeriesView.js`) follow a strict Render/Mount lifecycle.
4.  **SafeDOM**: All DOM manipulation uses the `SafeDOM` utility to prevent XSS.

---

## 🧪 02. Test Strategy (`24_Test_Suite.md`)

*Summary*: The application ensures quality via a layered test suite (Revamped Jan 10, 2026).

### Layers
1.  **E2E (Puppeteer)**:
    -   Located in `test/e2e/`.
    -   **Smoke Test**: Verifies critical routes (`/albums`, `/blend`) and redirection logic.
    -   **Blending Wizard**: "Golden Path" test for the V3 Blending Workflow.
    -   **Helpers**: `createSeries` now automates the V3 "Bulk Mode -> Process -> Initialize" sequence.
2.  **Unit (Vitest)**:
    -   **Algorithms**: Tests for Generic Top N algorithms (`TopNPopular`, `TopNAcclaimed`) matching Sprint 17.5 architecture.
    -   **Components**: Tests for `BlendIngredientsPanel` (UI Logic).
    -   **Stores**: Logic-free tests ensuring state integrity.

### Status
-   **Healthy**: Infrastructure is robust.
-   **Known Issues**: E2E timeouts on local dev environments (dependent on machine resources). Logic is solid.

---

## 🎨 03. Frontend UI (`09_Frontend_Views.md`)

*Summary*: The UI is split into distinct "Views" managed by `Router.js`.

### Core Views
-   **Home View (V3)**: The entry point. Features a "Series Configuration" panel, "Discography Scan" (Visual/Bulk), and a Staging Area.
-   **Albums View**: Grid/List display of the selected series. Supports "Sticky Playlists".
-   **Blend View**: A Wizard-style interface for generating balanced playlists.
    -   *Ingredients*: Users select recipes (e.g., "Deep Cuts", "Top N").
    -   *Mixing*: Users adjust parameters.
-   **Inventory View**: Management of generated playlists.

---

## 📡 04. Data Layer (`06_Frontend_Data_Store.md`)

*Summary*: Data is managed via a text-file based backend (`json` files) and an in-memory frontend store.

### Stores
-   **PlaylistsStore**: Manages the list of generated playlists.
    -   *Pattern*: Pub/Sub. Immutable state updates.
-   **SeriesStore**: Manages the currently loaded Album Series.
-   **ConfigStore**: Manages user preferences (e.g., View Mode).

---

## 🤖 05. Core Logic (`18_Frontend_Logic_Core.md`)

*Summary*: The "Blending" engine.

### Algorithms
-   **MJRP Balanced Cascade**: The flagship algorithm. Balances ratings, popularity, and variety.
-   **Top N**: Generic algorithms for "Top 5 Popular" or "Top 5 Acclaimed".
-   **Registry**: `algorithms/index.js` acts as the central plugin system for adding new generators.

---

## 🔄 06. Protocols & Governance

### Active Protocols
-   **Audit**: `test_suite_audit_protocol.md` (New).
-   **Documentation**: `documentation_audit_protocol.md`.
-   **Regression**: `regression_protocol.md`.

### Changelog (Recent)
-   **Jan 10**: Revamped Test Suite (E2E helpers, Unit Test alignment).
-   **Jan 08**: Published Manual v3.0 (Ref Guide).
-   **Jan 08**: SafeDOM Migration Complete.

---

> This snapshot represents the state of the system as of January 10, 2026.
> Refer to `docs/manual/` for live, granular documents.
