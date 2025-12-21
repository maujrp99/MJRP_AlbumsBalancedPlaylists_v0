# Task Breakdown: V3 Architecture Refactor & Componentization

**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Branch**: `sprint12-architecture-v3.0`

## Scope & Coverage
This task list covers **Phase 3 (Execution)** of the V3 Reboot.
It addresses the following User Stories:
*   **US1 (P0)**: Developer Sanity (Refactor `AlbumsView` -> `SeriesView` & Components).
*   **US2 (P1)**: The Blending Menu (New Feature Implementation).
*   **US3 (P1)**: Responsive Dashboard (Grid/List & Mobile Actions).
*   **US4 (P2)**: Inventory & Playlist Modularization.
*   **US5 (P2)**: Modern Home Dashboard (Hero Carousel & Series Cards).

---

## 1. 🏗️ Infrastructure & Base (US1)
- [x] **Setup**: Verify Git Branch `sprint12-architecture-v3.0`.
- [x] **Base Component**: Create `public/js/components/base/Component.js` (The abstract class with `mount`, `update`, `unmount`).
- [x] **Store Integration**: Create `public/js/controllers/SeriesController.js` (Empty shell for logic migration).
- [x] **Entry Point**: Create `public/js/views/SeriesView.js` (Initially a copy of `AlbumsView.js` to start strangling).

## 2. 🧩 Component Extraction: "The Shopping List" (US1, US3, US4)
*Extracting UI/Logic from the Monolith into reusable blocks.*

### Core Series Components (US1, US3)
- [x] **Grid Renderer**: Create `components/series/SeriesGridRenderer.js` (Pure DOM generation).
- [x] **Entity Card**: Create `components/series/EntityCard.js` (HTML Generator + Ghost Logic).
- [x] **Filter Bar**: Create `components/series/SeriesFilterBar.js` (Search & Sort logic).
- [x] **Header**: Create `components/series/SeriesHeader.js` (Title, description, stats).
- [x] **Drag & Drop**: Create `components/series/SeriesDragDrop.js` (SortableJS Wrapper).

### Shared Utilities (US1)
- [x] **Loader**: Create `components/shared/SkeletonLoader.js`.
- [x] **Context Menu**: Create `components/shared/ContextMenu.js` (The "Three-dot" logic).

### Inventory & Playlists (US4)
- [x] **Inventory Grid**: Create `components/inventory/InventoryGrid.js` (Extends/Uses SeriesRenderer).
- [x] **Playlist Board**: Create `components/playlists/PlaylistsDragBoard.js` (Kanban logic).
- [x] **Export Toolbar**: Create `components/playlists/PlaylistExportToolbar.js`.

### Navigation & Home (US5)
- [ ] **Home Carousel**: Create `components/home/HomeCarousel.js` (The 3-Slide Hero).
- [ ] **Series Grid**: Create `components/home/SeriesGrid.js` (Visual Cards).
- [ ] **Breadcrumbs**: Create `components/navigation/Breadcrumbs.js` (Replacing simple back buttons).

## 3. 🧠 Logic Migration (US1)
*Moving the brain out of the View.*

- [ ] **Controller Logic**: Move `loadSeries`, `filter`, `sort` logic from `AlbumsView` to `SeriesController`.
- [ ] **Event Routing**: Move DOM event listeners to `SeriesController.bindEvents()`.
- [ ] **Orchestrator**: Update `SeriesView.js` to ONLY mount components and delegate events.

## 4. 🥤 New Features: The Blending Menu (US2)
- [ ] **Schema**: Implement `RankingContext` structure in `CurationEngine`.
- [ ] **UI**: Create `components/blending/BlendingMenuView.js` (The Overlay).
- [ ] **Inputs**: Implement "Strictness" and "Duration" sliders.
- [ ] **Integration**: Connect "Create Mix" button -> `BlendingMenuView` -> `CurationEngine`.

## 5. 🧹 Cleanup & Cutover
- [ ] **Deletion**: Delete old `AlbumsView.js` code (now replaced by `SeriesView.js`).
- [ ] **Renaming**: Ensure all references point to `SeriesView`.
- [ ] **Verification**: Run Manual Test Plan (Ghost Album, Drag & Drop, Mobile Menu).
