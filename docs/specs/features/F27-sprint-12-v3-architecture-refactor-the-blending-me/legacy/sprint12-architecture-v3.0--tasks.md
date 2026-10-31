# Task Breakdown: V3 Architecture Refactor & Componentization

**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Branch**: `sprint12-architecture-v3.0`
**Updated**: 2025-12-23

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

## 3. 🧠 Logic Migration (US1) ✅
*Moving the brain out of the View.*

- [x] **Controller Logic**: Move `loadSeries`, `filter`, `sort` logic from `SeriesView` to `SeriesController`.
- [x] **Event Routing**: Move DOM event listeners to `SeriesController.bindEvents()`.
- [x] **Modals Extraction**: Extract Edit/Delete Series modals to `components/series/SeriesModals.js`.
- [x] **Orchestrator**: Update `SeriesView.js` to ONLY mount components and delegate events (**389 LOC achieved**, target <400).

## 3.5 🧭 Navigation Revision (US3)
*Prepare TopNav for responsive dashboard and series context.*

- [ ] **TopNav Refactor**: Update `TopNav.js` to use `hidden md:flex` for responsive behavior.
- [ ] **Mobile Menu**: Add hamburger menu state for mobile view.
- [ ] **Series Context**: Display active series name in TopNav when in series scope.
- [ ] **Create Mix CTA**: Add prominent "Create Mix" button in header (Desktop) / FAB (Mobile).

## 4. 🥤 New Features: The Blending Menu (US2) ✅
> **Detailed Tasks**: [blending-menu/tasks.md](./blending-menu/tasks.md)

- [x] **Schema**: Implement algorithm flavors and ingredient matrix.
- [x] **UI**: Create `BlendingMenuView.js`, `BlendFlavorCard.js`, `BlendSeriesSelector.js`, `BlendIngredientsPanel.js`.
- [x] **Inputs**: Implement Duration, Ranking Type, Discovery Mode selectors.
- [x] **Conditional Ingredients**: Show/hide parameters based on selected algorithm.
- [x] **Integration**: Connect "Blend It!" CTA → algorithm.generate() → Playlists.
- [x] **Background Enrichment**: SpotifyEnrichmentStore + SpotifyEnrichmentService.

## 5. 🧹 Cleanup & Cutover (Partial)
- [x] **Router Update**: `/albums` uses `SeriesView`, `/blend` uses `BlendingMenuView`.
- [x] **Import Cleanup**: All imports point to new components.
- [ ] **Legacy Rename**: Rename `AlbumsView.js` to `AlbumsView_legacy.js` (deferred).
- [ ] **Verification**: Run full Manual Test Plan.
- [ ] **Decision Point**: Delete `AlbumsView_legacy.js` after verification.

---

## 6. 🗂️ Modal Architecture Analysis (BACKLOG)

> [!NOTE]
> **Added:** 2025-12-22  
> **Priority:** Medium  
> **Status:** Pending Analysis

### Problem Statement
Multiple JS modals exist across the codebase with inconsistent patterns:
- `EditAlbumModal.js`
- `ViewAlbumModal.js`
- `SeriesModals.js`
- `LoginModal.js`
- Various inline modals in views

### Required Analysis
- [ ] **Inventory**: Identify all modal implementations across the codebase
- [ ] **Pattern Assessment**: Evaluate current patterns (class-based, inline HTML, etc.)
- [ ] **Design Pattern**: Propose a unified modal system (e.g., ModalManager, BaseModal class)
- [ ] **Spec Creation**: Create SDD spec for modal refactoring
- [ ] **Implementation Plan**: Define migration path for existing modals

### Potential Benefits
- Consistent open/close behavior
- Unified styling and accessibility
- Reduced code duplication
- Easier to create new modals

