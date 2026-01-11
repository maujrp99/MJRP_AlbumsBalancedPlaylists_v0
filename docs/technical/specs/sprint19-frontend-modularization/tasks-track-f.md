# Tasks - Sprint 19 Track F: Test Suite Revamp

**Status**: 🚧 IN PROGRESS
**Agent**: Antigravity
**Branch**: `feature/sprint-19-tracks` (Continuing)

---

## Phase 1: Unit Test Implementation

### 1.1 Service Logic
- [ ] Create `test/services/StorageService.test.js` <!-- id: 1 -->
- [ ] Create `test/services/PlaylistHistoryService.test.js` <!-- id: 2 -->
- [ ] Create `test/services/UserSyncService.test.js` <!-- id: 3 -->

### 1.2 Component Logic
- [ ] Create `test/components/blend/BlendIngredientsPanel.test.js` <!-- id: 4 -->
- [ ] Create `test/views/helpers/SeriesComponentFactory.test.js` <!-- id: 5 -->

---

## Phase 2: E2E Revamp

### 2.1 Helpers & Setup
- [ ] Update `test/e2e/helpers.js` with new Blending/Component selectors <!-- id: 6 -->

### 2.2 Core Tests
- [ ] Rewrite `test/e2e/smoke.test.js` <!-- id: 7 -->
- [ ] Rewrite `test/e2e/ui-components.test.js` <!-- id: 8 -->
- [ ] Create `test/e2e/blending-wizard.test.js` <!-- id: 9 -->

---

## Phase 3: Verification
- [ ] Run full test suite (`npm run test && npm run test:e2e`) <!-- id: 10 -->
