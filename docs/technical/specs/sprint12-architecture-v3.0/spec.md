# Feature Specification: V3 Architecture Refactor & The Blending Menu

**Feature Branch**: `feature/v3-refactor`
**Created**: 2025-12-21
**Updated**: 2025-12-23
**Status**: 🟡 PARTIALLY IMPLEMENTED
**Vision**: [MJRP_Product_Vision.md](../../product-management/MJRP_Product_Vision.md)

> [!NOTE]
> **Implementation Status (2025-12-23)**:
> - ✅ **SeriesView V3**: Completed (575 LOC thin orchestrator with 8 focused components)
> - ✅ **SeriesController**: Implemented (313 LOC, 0 DOM refs)
> - ✅ **Blending Menu UI**: Completed (BlendingMenuView, BlendFlavorCard, BlendIngredientsPanel, BlendSeriesSelector)
> - ✅ **Algorithm Mixins**: Completed (DurationTrimmingMixin, PlaylistBalancingMixin, TrackEnrichmentMixin)
> - 🚧 **Algorithm Integration**: In Progress (updating existing algorithms to use mixins)
> - 🚧 **AlbumsView Refactor**: In Progress (applying V3 pattern)

---

## High-Level Goal
To transition the application from a "God-Class" View architecture to a **Component-Based Architecture**, enabling the implementation of "**The Blending Menu**" (Parametrized Playlist Generation) and ensuring long-term maintainability for the upcoming Mobile App wrapper (Sprint 12).

---

## User Stories & Scenarios

### US1: Developer Sanity (Priority: P0 - Enabler)
As a **Developer**, I want `AlbumsView.js` broken down into small, single-responsibility components so that I can fix bugs and add features without fear of regressions.

*   **Why**: `AlbumsView.js` is currently ~1,800 lines (God Class). It is fragile and blocks "Mobile-First" adaptation.
*   **Success Metrics**: `AlbumsView.js` reduced to < 400 lines. All logic moved to `AlbumsController` or sub-components.

### US2: The "Blending Menu" (Priority: P1)
As a **Curator**, I want to select a mixing style AND configure key parameters so that I can fine-tune the generated playlist to my exact mood.

*   **Entry Points**: I can apply a mix to any active **Series** (`AlbumSeries`, `ArtistSeries`, `GenreSeries`, or `TrackSeries`).
*   **Menu Items**:
    *   **Presets**: "MJRP Balanced" (Default), "Deep Cuts Only", "Hit Parade".
    *   **Parameters**: Target Duration (e.g., 45m, 1h), Strictness (Allow fewer/more deviations), Output Size (Tracks vs Time).
*   **Acceptance Scenarios**:
    *   **Given** I have an active `ArtistSeries` (e.g., Pink Floyd), **When** I click "Create Mix", **Then** the Blending Menu applies the algorithms to that specific series scope.
    *   **Given** I select "Deep Cuts", **When** I increase "Strictness", **Then** the engine filters out popular tracks more aggressively.
    *   **Given** I started via "Artist Spotlight" (Pink Floyd), **When** I click "Create Mix", **Then** the scope is locked to that Artist Context.

### US3: Responsive Dashboard (Priority: P1)
As a **User**, I want the UI to automatically adapt its layout (Grid vs List, Drag vs Touch) based on my device, so that I have an optimal experience on both Desktop and Mobile.

*   **Why**: Current `AlbumsView` uses hacky visibility toggles (`hidden md:block`) and duplicates HTML. We need true responsive components to support the **Sprint 12 (Current)** Capacitor App wrapper.
*   **Acceptance Scenarios**:
    *   **Given** I am on Desktop, **When** I view `AlbumsView`, **Then** I see a 4-column grid with hover actions.
    *   **Given** I am on Mobile, **When** I view `AlbumsView`, **Then** I see a 1-column list with swipe actions or touch-friendly menus.

### US4: Inventory & Playlist Modularization (Priority: P2)
As a **Developer**, I want `InventoryView` and `PlaylistsView` to be composed of the same shared components as `AlbumsView` (e.g., `AlbumCard`, `TrackList`) so that UI fixes apply everywhere instantly.

*   **Why**: Currently, `InventoryView` duplicates card rendering logic from `AlbumsView`. `PlaylistsView` mixes drag-and-drop logic with export logic.
*   **Success Metrics**:
    *   `InventoryView.js` uses strict component composition (no raw HTML strings).
    *   `PlaylistsView.js` delegates Drag & Drop to `PlaylistsDragBoard` component.

### US5: Modern Home Dashboard (Priority: P2)
As a **User**, I want a **Hero Carousel** on the Home Screen so that I can easily start an `AlbumSeries`, `ArtistSeries`, or `GenreSeries`.

*   **Why**: The current static hero only promotes the manual `AlbumSeries` flow. We need to expose the automated Series types visually.
*   **Acceptance Scenarios**:
    *   **Given** I am on Home, **Then** I see 3 slides: "Curate Album Series", "Start Artist Series", "Explore Genre Series".
    *   **Given** I click "Start Artist Series", **Then** I enter an artist name, and the system creates a dynamic `ArtistSeries` containing their discography.

---

## Functional Requirements

### FR1: Component Architecture (The "Lego" Blocks)
*   **FR-1.1**: The system MUST implement a lightweight Component base class (Standardized Interface) compatible with Vanilla JS.
    *   **Constraint**: Must implement `mount(container)`, `update(props)`, and `unmount()` lifecycles.
    *   **Future-Proofing**: This specific structure ensures that if we migrate to React or Vue later, we can simply wrap these classes or port the logic 1:1, as the state/lifecycle management will already be decoupled from the DOM.
*   **FR-1.2**: `AlbumsView`, `InventoryView`, `PlaylistsView`, and `HomeView` MUST be decomposed into independently testable components.
    *   **Albums**: `AlbumsGrid`, `AlbumsFilterBar`, `SeriesHeader`, `AlbumsLoadingState`.
    *   **Inventory**: `InventoryGrid` (reuses `AlbumsGrid`), `InventoryStats`.
    *   **Playlists**: `PlaylistsDragBoard`, `PlaylistExportToolbar`.
    *   **Home**: `HomeHero` (Quick Actions), `SeriesGrid` (Rich Cards).
*   **FR-1.3**: Components MUST NEVER access Stores directly. They MUST emit events or call a Controller/Service.

### FR2: The Blending Engine (Parametrization)
*   **Analysis of Current Code**: `curation.js` currently hardcodes bucket logic (P1, P2) and duplicates normalization logic found in `BalancedRankingStrategy.js`.
*   **FR-2.1**: The `CurationEngine` MUST be refactored to accept a `Configuration` object that overrides internal constants (e.g., bucket sizes, target duration) without breaking the existing "MJRP Balanced Cascade" logic.
*   **FR-2.2**: The system MUST define a standard `RankingContext` JSON schema that captures user inputs.

### FR3: AOTY Integration (Preparation)
*   **FR-3.1**: The architecture MUST support plugging in "AlbumOfTheYear.org" as a ranking source (via Interface) without changing the UI code.

---

## Success Criteria

1.  **Code Quality**: `AlbumsView.js` < 400 lines. `InventoryView` and `PlaylistsView` fully componentized.
2.  **No Regression**: All 18 existing Manual Test Cases (Grid, Sort, Drag, Save) pass.
3.  **Parametrization**: The "Blending Menu" successfully generates 3 distinct playlist variations using the new JSON schema.
4.  **Performance**: View switching time < 200ms (Desktop) and < 400ms (Mobile 4G).
