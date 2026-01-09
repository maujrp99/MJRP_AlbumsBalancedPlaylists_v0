# Feature Specification: Sprint 17 - Architectural Modularization (Frontend Specialization)

**Feature Branch**: `feature/sprint17-modularization`
**Created**: 2026-01-03
**Status**: Implemented
**Released**: 2026-01-04
**Input**: Roadmap Sprint 17 Goals, Code Quality Assessment v10.1

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SeriesView Performance & Maintainability (Priority: P1)

As a Developer, I want `SeriesView` to be a "Thin View" (< 200 LOC) that only handles rendering, so that I can add new filtering/sorting logic without risking regression in the UI rendering code.

**Why this priority**: `SeriesView.js` has reached 500+ LOC ("God Class"). It mixes UI rendering, Event Handling, and complex Filtering logic, making it fragile and hard to test. This is the highest technical debt in the UI layer.

**Independent Test**:
- Navigate to `/albums`.
- Verify all filters (Series, Artist, Year, Source) work exactly as before.
- Verify "View Album" and "Edit Series" actions work exactly as before.
- **Code Metric**: `SeriesView.js` must be under 250 LOC.

**Acceptance Scenarios**:
1. **Given** the Albums View is loaded, **When** I switch Series or apply an Artist filter, **Then** the grid updates instantly and correctly (Testing `SeriesFilterService`).
2. **Given** I am browsing albums, **When** I click "Refresh" or "Toggle View", **Then** the UI interaction is handled by the Controller, not the View directly.

---

### User Story 2 - Resilient MusicKit Integration (Priority: P2)

As a Developer, I want `MusicKitService` split into distinctive Auth, Catalog, and Library services, so that authentication logic doesn't crash the search catalog feature and vice-versa.

**Why this priority**: `MusicKitService.js` is the largest single file in the project (692 LOC). It handles Auth (Token exchange), Catalog Search (Region-specific), and User Library (Playlists). A bug in Auth currently paralyzes Search.

**Independent Test**:
- Users can Search for albums (CatalogService) effectively.
- Users can Export playlists (LibraryService) effectively.
- **Code Metric**: `MusicKitService.js` (Orchestrator) under 150 LOC.

**Acceptance Scenarios**:
1. **Given** I am not logged in to Apple Music, **When** I search for an album, **Then** it works using the public token (CatalogService).
2. **Given** I am logged in, **When** I export a playlist, **Then** it uses my user token (LibraryService/AuthService).

---

### User Story 3 - Curation Engine Extensibility & Top N Parametrization (Priority: P3)

As a Curator, I want the `CurationEngine` to use a clear Strategy Pattern for algorithms AND support variable Top N selection (1-10), so that the code is clean and I have more control over playlist density.

**Why this priority**: 
1. `curation.js` (518 LOC) contains implicit state machines (Technical Debt).
2. We currently rely on hardcoded subclasses like `Top3Algorithm` (Feature Limitation). Refactoring fixes both.

**UI/UX Impact (Holistic Analysis)**:
- **BlendingIngredientsPanel.js**:
    - MUST detect if the selected flavor is "parametrized" (e.g., `TopNAlgorithm`).
    - MUST conditionally render a new "Algorithm Parameters" section (e.g., Slider 1-10 for `nValue`).
    - MUST normalize this parameter in `getConfig()` (passed as `algorithmParams: { n: value }`).
- **Flavor Cards**: Replace static "Top 3" / "Top 5" cards with a single "Top N" card in the flavor selection step.

**Independent Test**:
- Generate playlists using "Balanced Cascade" (verifies Strategy Pattern).
- Generate playlists using "Top N" with N=1 (Singles) and N=7 (Deep Cuts) (verifies Parametrization).
- **Code Metric**: `CurationEngine.js` under 200 LOC.

**Acceptance Scenarios**:
1. **Given** I select "Top 5 Popular", **When** I generate, **Then** the `TopNAlgorithm` strategy is executed cleanly.
2. **Given** the Blending Menu, **When** I select "Top N", **Then** I see a number input/slider (1-10).
3. **Given** I select N=4, **When** I generate, **Then** the playlist contains exactly the top 4 ranked tracks from each album.

---

### User Story 4 - Data Hygiene (Backend Normalization) (Priority: P4)

As a Developer, I want the Backend to return "Clean" normalized album objects, so that the Frontend doesn't need 500 lines of code to patch missing fields (e.g., "Thriller" bug, missing artwork).

**Why this priority**: The "Thick Client" report identified "Data Patching" as a major source of frontend bloat.

**Independent Test**:
- Fetch an album via API.
- Verify the JSON response *already* contains `spotifyId`, `bestEverScore` (if available), and correct `artist/title` without client-side fixes.

**Acceptance Scenarios**:
1. **Given** I fetch a known problematic album (e.g., with special characters), **When** the API responds, **Then** the data is structured correctly according to the V3 Schema.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `SeriesView` MUST delegate all non-rendering logic to `SeriesController` and `SeriesFilterService`.
- **FR-002**: `MusicKitService` MUST be refactored into `services/musickit/` directory with `Auth.js`, `Catalog.js`, `Library.js`.
- **FR-003**: `CurationEngine` MUST separate "Ranking Source" logic (fetching scores) from "Balancing Logic" (filling playlists).
- **FR-004**: Backend `normalize.js` MUST handle object structure validation previously done in `client.js`.

### Key Entities

- **SeriesFilterService**: New stateless service for filtering/sorting arrays of Albums.
- **RankingSourceRegistry**: Registry for 'BEA', 'Spotify', 'LastFM' score providers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `SeriesView.js` size reduced by >50% (Target: < 250 LOC).
- **SC-002**: `MusicKitService.js` size reduced by >70% (Target: < 200 LOC).
- **SC-003**: `curation.js` size reduced by >60% (Target: < 200 LOC).
- **SC-004**: No regression in E2E tests for Series browsing or Playlist Generation.
