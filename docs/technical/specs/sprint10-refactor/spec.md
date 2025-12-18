# Feature Specification: Sprint 10 - Codebase Refactoring

**Feature Branch**: `sprint10-refactor`  
**Created**: 2025-12-18  
**Status**: Draft  
**Input**: Code Quality Assessment from `docs/refactor/CODE_QUALITY_ASSESSMENT.md`

---

## User Scenarios & Testing

### User Story 1 - Developer Navigates AlbumsView (Priority: P1)

A developer needs to understand and modify the Albums view behavior. Currently, the 1,820-line monolithic file makes it extremely difficult to locate specific functionality, leading to longer development time and higher bug risk.

**Why this priority**: AlbumsView.js is the largest file (72KB) and most frequently modified. Every sprint touches this file, creating merge conflicts and regression risks. Modularizing it will accelerate all future development.

**Independent Test**: After refactoring, a developer should be able to find the grid rendering logic in under 30 seconds by navigating to `views/albums/AlbumsGridRenderer.js`.

**Acceptance Scenarios**:

1. **Given** a developer looking for filter logic, **When** they search for "filterAlbums", **Then** they find it isolated in `AlbumsFilters.js` with clear single responsibility.
2. **Given** AlbumsView.js after refactor, **When** measuring lines of code, **Then** the main file has < 600 lines.
3. **Given** the Albums page in browser, **When** user interacts with all features (filter, search, view toggle, series modal), **Then** all functionality works identical to before refactor.

---

### User Story 2 - Faster Server Endpoint Discovery (Priority: P2)

A developer needs to find or add an API endpoint. Currently, 535 lines in `server/index.js` with 7 endpoints mixed together makes navigation slow and error-prone.

**Why this priority**: Backend changes are less frequent than frontend but critical for API stability. Route separation improves testability and deployment confidence.

**Independent Test**: After refactoring, each route file (`routes/albums.js`, `routes/playlists.js`, `routes/debug.js`) can be tested independently.

**Acceptance Scenarios**:

1. **Given** server/index.js after refactor, **When** measuring lines of code, **Then** the main file has < 150 lines.
2. **Given** a request to `/api/generate`, **When** server handles it, **Then** response is identical to before refactor.
3. **Given** a request to `/api/enrich-album`, **When** server handles it, **Then** response includes `bestEverInfo.albumId` correctly.

---

### User Story 3 - Clean PlaylistsView for Export Features (Priority: P3)

A developer needs to modify Apple Music export. Currently, export logic is intertwined with drag-and-drop and generation logic in a 891-line file.

**Why this priority**: Export is a critical user-facing feature. Isolating it reduces regression risk when modifying drag-and-drop or generation.

**Independent Test**: After refactoring, `PlaylistsExport.js` can be unit tested for Apple Music export without loading the entire PlaylistsView.

**Acceptance Scenarios**:

1. **Given** PlaylistsView.js after refactor, **When** measuring lines of code, **Then** the main file has < 500 lines.
2. **Given** user exports playlist to Apple Music, **When** export completes, **Then** behavior is identical to before refactor.

---

### User Story 4 - Remove Dead Legacy Code (Priority: P1)

The codebase contains `app.legacy.js` (47KB), a dead monolith that is never imported but adds confusion and bloat.

**Why this priority**: Zero-risk deletion that immediately improves codebase cleanliness and reduces confusion for new developers.

**Independent Test**: After deletion, run `npm run build` and all tests - everything should pass with no references to deleted file.

**Acceptance Scenarios**:

1. **Given** `app.legacy.js` deleted, **When** running `npm run build`, **Then** build succeeds with no errors.
2. **Given** `app.legacy.js` deleted, **When** running `npm run test`, **Then** all tests pass.
3. **Given** `app.legacy.js` deleted, **When** loading app in browser, **Then** all features work normally.

---

## Edge Cases

- What happens if a module import path is incorrect after refactoring?
  - Build will fail immediately, verifiable via `npm run build`
- How does system handle circular dependencies if they're introduced?
  - Vite bundler will warn/error during build
- What if a refactored module has missing exports?
  - Runtime error will occur on first usage, detectable via manual testing

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST maintain all existing functionality after refactoring
- **FR-002**: System MUST maintain < 1 second page load time after refactoring
- **FR-003**: Build process MUST complete successfully with `npm run build`
- **FR-004**: All existing tests MUST pass after refactoring
- **FR-005**: No new dependencies MUST be added for refactoring

### Key Entities

- **AlbumsView**: Main view orchestrator (post-refactor: delegation only)
- **AlbumsGridRenderer**: Rendering logic for grid/list modes
- **AlbumsFilters**: Filter state and logic
- **SeriesModals**: Modal handling for series CRUD
- **AlbumsDataLoader**: Album fetching and caching orchestration

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: AlbumsView.js < 600 lines (from 1,820)
- **SC-002**: server/index.js < 150 lines (from 535)
- **SC-003**: PlaylistsView.js < 500 lines (from 891)
- **SC-004**: app.legacy.js deleted (47KB savings)
- **SC-005**: All 39 existing tests pass after refactor
- **SC-006**: No visual or functional regression in UI
- **SC-007**: Build time unchanged (+/- 5%)
