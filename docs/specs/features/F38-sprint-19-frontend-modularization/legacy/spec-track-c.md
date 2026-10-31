# Specification - Sprint 19 Track C: Service Layer Refinement

**Status**: ✅ IMPLEMENTED
**Created**: 2026-01-10
**Goal**: Further modularize the recently created Service Layer to prevent "God Services" and improve reusability.

---

## 1. Problem Statement (WHAT)
The current `PlaylistsService.js` (360 LOC) and `SeriesService.js` (273 LOC) mix multiple concerns:
- History (Undo/Redo)
- Persistence (LocalStorage)
- User Context (Auth/Migration)
- Domain Logic (Track Ops/CRUD)

This creates high cognitive load and makes individual behaviors harder to test or reuse in other parts of the app.

---

## 2. Proposed Changes (HOW)

### A. Infrastructure Extraction
- **[NEW] `public/js/services/infra/StorageService.js`**:
    - Centralized `localStorage` access.
    - Standardized error handling/logging.
    - Used by both Playlists and Series services.

### B. Feature Extraction
- **[NEW] `public/js/services/playlists/PlaylistHistoryService.js`**:
    - Manage `versions[]` and `currentVersionIndex`.
    - Handle `undo()` / `redo()` logic.
- **[NEW] `public/js/services/auth/UserSyncService.js`**:
    - Extract `handleUserChange` and `migrateSeries` logic from `SeriesService`.

### C. Refactor Orchestrators
- **[MODIFY] `PlaylistsService.js`**:
    - Delegate History to `PlaylistHistoryService`.
    - Delegate LocalStorage to `StorageService`.
- **[MODIFY] `SeriesService.js`**:
    - Delegate user changes to `UserSyncService`.
    - Delegate LocalStorage to `StorageService`.

---

## 3. Success Criteria
1. **PlaylistsService LOC**: < 200.
2. **SeriesService LOC**: < 150.
3. **Infrastructure Reuse**: LocalStorage logic is no longer duplicated.
4. **Build Status**: PASS.
5. **Regression**: `[BLEND]` and `[HISTORY]` checklists pass via Agent Browser.

---

## 4. Verification Plan
- **Manual Verification**: Perform "Blend It!", "Undo/Redo", and "Save to History" flows to ensure sub-service delegation works.
- **Console Audit**: Ensure no "Undefined" errors during service initialization.
