# Sprint 16: Cleanup & Critical Integrity

**Status**: Planning
**Last Updated**: 2025-12-31
**Owner**: Agent 1 (Handover), Agent 2 (Execution)
**Goal**: Finalize the removal of legacy DOM manipulation patterns (`Modals.js`) and consolidate components.

## Context
Sprint 15 achieved major milestones in "SafeDOM" migration. The critical data loss bug in Apple Music Export was **resolved in Sprint 15 Phase 6** with lazy authorize + browser locale storefront.

> [!NOTE]
> **Sprint 15 Phase 6 Resolved**:
> - ✅ Lazy authorize (no popup on init)
> - ✅ Browser locale storefront for searches
> - ✅ `authorizeAndValidate()` for persist-time validation
> - ✅ Edit Modal refactored to use artist scan + filters (same as Home)
> - ✅ Deprecated `Autocomplete.js` and `MusicKitSearchAdapter.js` in SeriesModals

## Objectives

### 1. ~~Critical Integrity (The "Apple Fix")~~ ✅ RESOLVED IN SPRINT 15
> Moved to Sprint 15 Phase 6. Lazy authorize + browser locale implemented.

### 2. Legacy Eradication (The "Modals Fix")
- [ ] **Operation Modal-Swap**:
    - [ ] Create `src/components/ui/modals/ConfirmModal.js` (SafeDOM).
    - [ ] Create `src/components/ui/modals/InputModal.js` (SafeDOM).
    - [ ] Delete `Modals.js` entirely (~30 sinks).
- [ ] **Controller-First Refactor**:
    - [ ] Move remaining logic from `SavedPlaylistsView` to Controller.
    - [ ] Create `DialogService.js`: Views call `Dialog.confirm(...)`, not `new Modal()`.

### 3. Component Consolidation
- [ ] **Deprecate Legacy Cards**:
    - [ ] Deprecate `PlaylistCard` (replace with `Card`).
    - [ ] Deprecate `BatchGroupCard` (replace with `Card` or `TrackRow` list).
- [ ] **Standardize Lists**: Force all lists to use `TrackRow` or `Card`.

### 4. Architecture Hardening
- [ ] **Consolidate Stores**: Ensure `albumSeriesStore` and `albumsStore` have clear responsibilities.
- [ ] **Code Quality**: Run audit. Target: < 25 `innerHTML` sinks.

## Scope Exclusions
- No new features (e.g., new Ranking Strategies) until stability is restored.
- No UI redesigns.

## Success Metrics
- ~~**0 Data Loss** on Export.~~ ✅ Resolved in Sprint 15
- ~~**0 Crashes** on Album Remove.~~ ✅ Resolved in Sprint 15
- **`Modals.js` Deleted**.
- **`innerHTML` sinks < 25**.
