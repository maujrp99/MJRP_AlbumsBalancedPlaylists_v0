# Specification: ARCH-1 Decompose PlaylistsView (God Class) ✅ IMPLEMENTED

## 1. Problem Description
`PlaylistsView.js` has grown to over 960 lines of code. It violates the Single Responsibility Principle by handling:
- UI Rendering (`PlaylistsGridRenderer`)
- State Management (interacting with Stores)
- Drag and Drop Logic (`PlaylistsDragHandler`)
- Event Handling
- Modal Logic

This makes the file difficult to read, test, and maintain.

## 2. Goal
Refactor `PlaylistsView.js` into smaller, focused modules (Components/Controllers) to reduce its size to < 300 LOC and improve maintainability.

## 3. Scope
- **Target**: `public/js/views/PlaylistsView.js`
- **Output**:
    - `PlaylistsView.js` (Orchestrator only)
    - `public/js/components/playlists/PlaylistsDragHandler.js` (Logic extraction)
    - `public/js/components/playlists/PlaylistsGridRenderer.js` (DOM rendering)
    - `public/js/controllers/PlaylistsController.js` (Mediator - if aligning with V3 architecture)

## 4. Success Criteria
1.  **Code Size**: `PlaylistsView.js` is under 400 lines (soft limit).
2.  **Modularity**: Logic for Drag-and-Drop is isolated and reusable/testable.
3.  **No Regression**: All playlist functionalities (Create, Edit, Delete, DnD, Reorder) work exactly as before.

## 5. Constraints
- Must maintain compatibility with `PlaylistsStore`.
- Must use existing CSS classes (no visual changes).

## 6. User Review Required
- **Architecture**: Do you agree with introducing `PlaylistsController` now (DEBT-3) as part of this refactor, or should we keep it View-centric for now? (Recommendation: Do Controller now to solve DEBT-3 simultaneously).
