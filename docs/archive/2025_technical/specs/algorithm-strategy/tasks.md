# Tasks: Algorithm Strategy Pattern

**Input**: Design documents from `docs/technical/specs/algorithm-strategy/`
**Prerequisites**: spec.md, plan.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and base classes

- [ ] T001 Create `public/js/algorithms/` directory
- [ ] T002 [P] Create `BaseAlgorithm.js` with interface (id, name, badge, description, generate())
- [ ] T003 [P] Create `index.js` registry with getAlgorithm(), getAllAlgorithms()

**Checkpoint**: Foundation ready

---

## Phase 2: User Story 1 - Select Algorithm (Priority: P1) 🎯 MVP

**Goal**: User can select and use any algorithm

### Implementation

- [ ] T004 [US1] Extract current curate() logic to `LegacyRoundRobinAlgorithm.js` extending BaseAlgorithm
- [ ] T005 [US1] Register LegacyRoundRobinAlgorithm in index.js (id: 'legacy-roundrobin')
- [ ] T006 [US1] Create `SDraftOriginalAlgorithm.js` with Serpentine logic from ALGORITHM_MENU.md
- [ ] T007 [US1] Register SDraftOriginalAlgorithm in index.js (id: 's-draft-original')
- [ ] T008 [US1] Create `SDraftBalancedAlgorithm.js` with revised rules from ALGORITHM_MENU.md
- [ ] T009 [US1] Register SDraftBalancedAlgorithm in index.js (id: 's-draft-balanced')

**Checkpoint**: 3 algorithms available via registry

---

## Phase 3: User Story 2 - Default Algorithm (Priority: P1)

**Goal**: Recommended algorithm pre-selected

- [ ] T010 [US2] Add `isRecommended: true` to SDraftBalancedAlgorithm metadata
- [ ] T011 [US2] Add getRecommendedAlgorithm() to registry

**Checkpoint**: Registry knows which algorithm is recommended

---

## Phase 4: User Story 3 - UI Selector (Priority: P2)

**Goal**: Users see algorithm options with descriptions

- [ ] T012 [US3] Modify PlaylistsView: Remove #playlistCount, #minDuration, #maxDuration inputs
- [ ] T013 [US3] Add renderAlgorithmSelector() method to PlaylistsView
- [ ] T014 [US3] Render radio group with algorithm name, badge, description from registry
- [ ] T015 [US3] Wire selector change to store selected algorithmId
- [ ] T016 [US3] Modify handleGenerate() to get selected algorithm from registry
- [ ] T017 [US3] Pass albums to algorithm.generate() instead of CurationEngine

**Checkpoint**: UI complete, all algorithms selectable

---

## Phase 5: User Story 4 - Legacy Algorithm (Priority: P1)

**Goal**: Legacy algorithm available as tested baseline

- [ ] T018 [US4] Verify LegacyRoundRobinAlgorithm output matches current behavior exactly
- [ ] T019 [US4] Ensure playlist output structure unchanged (same UI, drag&drop works)

**Checkpoint**: Legacy algorithm functional, output identical to today

---

## Phase 6: Polish & Documentation

**Purpose**: Cleanup and documentation

- [ ] T020 [P] Update `curation.js` to deprecate direct CurationEngine usage
- [ ] T021 [P] Update ARCHITECTURE.md with new algorithm structure
- [ ] T022 [P] Update CHANGELOG.md with Sprint 8 changes
- [ ] T023 Verify build passes (`npm run build`)
- [ ] T024 Manual testing of all 3 algorithms

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (US1 - Core Algorithms)
    │
    ├──▶ Phase 3 (US2 - Default) [can overlap]
    │
    ▼
Phase 4 (US3 - UI Selector)
    │
    ▼
Phase 5 (US4 - Backward Compat)
    │
    ▼
Phase 6 (Polish)
```

### Parallel Opportunities

- T002, T003: Different files, no dependencies
- T006, T007, T008: Different algorithm files
- T020, T021, T022: Independent documentation

---

## MVP Strategy

1. Complete Phase 1 + Phase 2 → Registry with 3 algorithms
2. Complete Phase 3 → Default algorithm works
3. Complete Phase 4 → UI selector functional
4. **STOP and VALIDATE**: Test all 3 algorithms manually
5. Complete Phase 5 + 6 → Polish
