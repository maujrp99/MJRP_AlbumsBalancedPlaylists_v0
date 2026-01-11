---
description: Protocol for auditing and maintaining test suite health
---

# Test Suite Audit Protocol

Use this protocol when:
- Starting a "Test Revamp" sprint.
- After major architectural refactors (to ensure tests align).
- Periodically to catch regression/deprecation drift.

## Phase 1: Context & Architecture Alignment
**Goal**: Ensure the test strategy matches the current system architecture (e.g., Modularization, Pure Stores).

1.  **Review System Architecture**:
    -   Read `docs/manual/01_System_Architecture.md`.
    -   Identify major recent changes (e.g., "Moved from Controller-heavy to Service-based", "Implemented SafeDOM").
2.  **Verify Test Layering**:
    -   Check if **Unit Tests** (`test/stores`, `test/services`) mock dependencies correctly.
    -   Check if **E2E Tests** (`test/e2e`) cover critical user flows without excessive implementation detail coupling.

## Phase 2: Gap Analysis
**Goal**: Identify code files that have no corresponding tests.

1.  **Source Inventory**:
    -   List all source files in `public/js` (excluding libs/vendors).
2.  **Test Inventory**:
    -   List all test files in `test/`.
3.  **Mapping**:
    -   Match Source -> Test (e.g., `PlaylistsStore.js` -> `playlists.test.js`).
    -   Generate a list of **Untested Components**.
4.  **Criticality Assessment**:
    -   Mark untested components as High/Medium/Low priority based on their usage in the app.

## Phase 3: Pattern & Deprecation Audit
**Goal**: Remove legacy patterns and ensure best practices.

1.  **Deprecation Scan**:
    -   Search for `page.waitForTimeout` (Puppeteer legacy). Replace with `sleep()` or `waitForSelector`.
    -   Search for `console.log` noise in tests (should be minimized or mocked).
2.  **Mocking Consistency**:
    -   Ensure consistent mocking library usage (e.g., `vi.mock` vs manual mocks).
3.  **Selector Health (E2E)**:
    -   Review `test/e2e/helpers.js`. Are selectors using stable attributes (ids, data-attributes) or brittle paths?

## Phase 4: Integrity Check
**Goal**: Verify that the suite actually runs and passes cleanly.

1.  **Run Full Suite**:
    -   `npm run test` (Unit).
    -   `npm run test:e2e` (E2E) - *Ensure local server is running or start it*.
2.  **Flakiness Detection**:
    -   Run the suite 3 times. Note any inconsistent failures.
3.  **Performance Check**:
    -   Identify tests that take >5s (Unit) or >30s (E2E). Mark for optimization.

## Phase 5: Reporting & Remediation
**Goal**: Document findings and plan fixes.

1.  **Generate Report**:
    -   Create `docs/reports/TEST_AUDIT_[YYYY-MM-DD].md`.
    -   Include: Coverage Summary, Flaky Tests List, Deprecation Count, Gap Analysis Table.
2.  **create Remediation Rules**:
    -   Update `docs/manual/testing_guidelines.md` if new patterns are established.
3.  **Task Creation**:
    -   Create tasks in `task.md` for fixing identified gaps.

---
**Copy-Paste Prompt for AI Agent**:
"Run the Test Suite Audit Protocol. Start by listing the architecture docs and current test files, then perform a gap analysis. Check for 'waitForTimeout' usage. Finally, generate a report."