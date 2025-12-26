# ARCH-8: InventoryView V3 Refactor

**Date**: 2025-12-26  
**Status**: 📋 SPECIFICATION  
**Sprint**: 14  
**Impact**: High (Maintainability)

---

## 1. Problem Statement

### The Monolith Issue
`InventoryView.js` has grown to **742 LOC**, becoming a "God Class" that handles:
- UI Rendering (HTML generation)
- Business Logic (CRUD operations)
- State Management (Filtering, Sorting)
- Modal Coordination
- Drag and Drop

This violates the Single Responsibility Principle and makes the inventory feature fragile and hard to test.

### Goals
Apply the proven **V3 Architecture** (successfully used in `SeriesView` and `PlaylistsView`) to the Inventory system.

---

## 2. Proposed Architecture

### Components
1. **InventoryController**: Pure business logic, state management, interactions with `inventoryStore`.
2. **InventoryGridRenderer**: Handles HTML generation for the album grid.
3. **InventoryView**: Thin orchestrator, handles DOM events and lifecycle.

### Data Flow
```
User Action → View → Controller → Store → Repository → Firestore
                         ↓
                      View Update (via Renderer)
```

---

## 3. Requirements

### Functional Requirements
- **FR1**: Extract all logic to `InventoryController.js`.
- **FR2**: Extract HTML generation to `InventoryGridRenderer.js`.
- **FR3**: `InventoryView.js` must effectively be reduced to < 300 LOC.
- **FR4**: Preserve all existing functionality (CRUD, Filters, Sorting, Drag & Drop).

### Non-Functional Requirements
- **NFR1**: `InventoryController` must have **Zero DOM references**.
- **NFR2**: UI responsiveness must maintain or improve (no unnecessary re-renders).

---

## 4. Success Criteria

| ID | Criteria | Validation |
|----|----------|------------|
| **SC1** | `InventoryView.js` < 400 LOC | LOC count check |
| **SC2** | `InventoryController` DOM-free | Static analysis / code review |
| **SC3** | No regressions in features | Manual test of Add/Edit/Delete/Filter |

---

## 5. Risks

- **Drag & Drop**: Often fragile during refactors. Needs specific regression testing.
- **Modal connection**: Ensuring modals still wire up correctly to the new controller.

---

## Approval

- [ ] **USER APPROVAL REQUIRED** to proceed to Implementation Plan
