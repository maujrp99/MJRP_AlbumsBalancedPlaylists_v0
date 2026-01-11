---
description: Specification Defined Development (SDD) Protocol
---

# Specification Defined Development (SDD) Protocol

**Purpose**: To ensure alignment, reduce rework, and guarantee that what is built matches the user's vision.

## The Flow

### 1. Specification Phase (`spec.md`)
**Goal**: Define WHAT, WHY, and Success Criteria. No implementation details.
1. Agent creates/updates `docs/technical/specs/<feature>/spec.md`.
2. Agent requests User Review.
3. User validates or requests changes.
4. **Gate**: Cannot proceed to Plan until Spec is APPROVED.

### 2. Planning Phase (`plan.md`)
**Goal**: Define HOW (Architecture, UI/UX, Component Strategy).
1. Agent creates/updates `docs/technical/specs/<feature>/plan.md`.
2. Agent includes logic flows and **UI Mockups** (Critical for frontend).
3. Agent requests User Review.
4. User validates strategy and visuals.
5. **Gate**: Cannot proceed to Task List until Plan is APPROVED.

### 3. Tasking Phase (`tasks.md`)
**Goal**: Define WHEN and Order of Operations.
1. Agent creates/updates `docs/technical/specs/<feature>/tasks.md`.
2. Checklist items must be granular reflecting exactly what was added to the plan.md and verifiable.
3. Add tasks for using our test suites (npm run test and/or npm run test:e2e) after the implementation and run the build (npm run dev).
4. Agent requests User Review.
5. **Gate**: Start Execution only after Tasks are APPROVED.

## Rules
- **One Stage at a Time**: Do not create all 3 docs at once.
- **Visuals First**: For UI changes, visuals (or ASCII mocks) must be in the Plan or Spec depending on complexity.
- **Workflow Interruption**: If User changes requirements in Plan phase, go back to Spec.