# Plan - Sprint 19 Track F: Test Suite Revamp

## Goal
Revamp the application test suite to align with the Sprint 19 Modular Architecture. This involves implementing missing unit tests for new services/components and modernizing the End-to-End (E2E) tests to cover critical user flows like the Blending Wizard.

## Strategy
1.  **Unit Layer**: Focus on "Logic Heavy" components that were extracted during modularization (`SeriesComponentFactory`, `BlendIngredientsPanel`) and critical data services (`PlaylistHistoryService`, `UserSyncService`, `StorageService`).
2.  **E2E Layer**: Move from "Smoke Checks" to "User Journey" verification. Implement a "Golden Path" test for the Playlist Generation flow.
3.  **Modernization**: Update existing E2E tests (`smoke.test.js`, `ui-components.test.js`) to use stable selectors independent of volatile styles.

## Proposed Changes

### 1. New Unit Tests
#### Services
*   `test/services/PlaylistHistoryService.test.js`: Test Undo/Redo stack logic.
*   `test/services/UserSyncService.test.js`: Test migration logic.
*   `test/services/StorageService.test.js`: Test localStorage wrapping.

#### Components & Helpers
*   `test/components/blend/BlendIngredientsPanel.test.js`: Test configuration object generation vs. Algorithm capabilities.
*   `test/views/helpers/SeriesComponentFactory.test.js`: Test component instantiation logic.

### 2. E2E Test Modernization
#### `test/e2e/smoke.test.js` (Revamp)
*   **Scope**: Verify App Launch -> Navigation to all 4 core views (Home, Albums, Playlists, Inventory).
*   **Change**: Add checks for specific "Active View" markers.

#### `test/e2e/ui-components.test.js` (Revamp)
*   **Scope**: Verify visibility and basic interaction of key UI components.
*   **Add**:
    *   `BlendSeriesSelector` (Grid render).
    *   `BlendRecipeCard` (Recipe selection).
    *   `BlendIngredientsPanel` (Input toggle).
*   **Remove**: Outdated modal tests if components no longer exist (or update them).

#### `test/e2e/blending-wizard.test.js` (New)
*   **Scope**: Golden Path.
*   **Steps**:
    1.  Go to `/blend` -> Select Series.
    2.  Select Recipe.
    3.  Set Options.
    4.  Click Generate.
    5.  Verify Redirection to `/playlists`.
    6.  Verify Playlist creation.

## Verification Plan
*   Run `npm run test` (Vitest) -> Expect 100% pass on new units.
*   Run `npm run test:e2e` (Puppeteer) -> Expect all suites to pass.
