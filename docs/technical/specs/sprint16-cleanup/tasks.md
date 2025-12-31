# Sprint 16 Task List: Cleanup & Critical Integrity

**Goal**: Eradicate legacy patterns (`Modals.js`) and consolidate components.
**Last Updated**: 2025-12-31
**Spec**: [spec.md](./spec.md)

## ~~Phase 1: Critical Integrity Recovery~~ ✅ RESOLVED IN SPRINT 15
> Moved to Sprint 15 Phase 6. See [phase6-hotfix-plan.md](../sprint15-arch12/phase6-hotfix-plan.md)

- [x] **Fix Export Logic**: Lazy authorize + browser locale storefront implemented.
- [x] **Fix Series Management**: Artist scan + filters in Edit modal (same as Home).

## Phase 2: Operation Modal-Swap (The "Modals.js" Killer)
*Goal: Replace ad-hoc `innerHTML` modals with proper components and Service.*

- [ ] **Create Safe Modals**:
    - [ ] `src/components/ui/modals/ConfirmModal.js`
    - [ ] `src/components/ui/modals/InputModal.js`
- [ ] **Create `DialogService.js`**:
    - [ ] Implement `confirm()` and `prompt()` using new modals.
- [ ] **Refactor Consumers**:
    - [ ] `SeriesView.js` -> Use `DialogService`
    - [ ] `PlaylistsView.js` -> Use `DialogService`
    - [ ] `SavedPlaylistsView.js` -> Use `DialogService` (move logic to Controller).
- [ ] **Delete Legacy**:
    - [ ] Delete `public/js/components/Modals.js` 🗑️

## Phase 3: Component Consolidation
*Goal: Reduce maintenance by removing redundant components.*

- [ ] **Deprecate Legacy Cards**:
    - [ ] Refactor `BatchGroupCard` usages to use `Card`/`TrackRow`.
    - [ ] Delete `PlaylistCard.js` (if exists/unused).
    - [ ] Delete `BatchGroupCard.js`.
- [ ] **Standardize**: Ensures all lists use `TrackRow` for items and `Card` for entities.

## Phase 4: Final Security Sweep
*Goal: Reach < 25 innerHTML sinks.*

- [ ] **Audit Sinks**:
    - [ ] Run `grep -r "innerHTML" public/js/`
    - [ ] Refactor remaining low-hanging fruit.
