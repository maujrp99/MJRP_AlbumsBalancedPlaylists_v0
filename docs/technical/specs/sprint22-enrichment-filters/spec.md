# Specification: Sprint 22 - Enrichment & Filters

## 1. Context & Goal
The goal of this sprint is to improve code modularity and logic reuse by:
1.  **Filter Logic Reuse**: Enabling `SavedPlaylistsView` to use the same sophisticated filtering/sorting patterns as `SeriesView`, adapting the logic for Series/Playlist entities.
2.  **BEA Enrichment Encapsulation**: Extracting the BestEverAlbums enrichment logic from `SeriesService` into a dedicated Helper/Store pattern, mirroring the Spotify architecture.

---

## 2. Requirement 1: Filter Logic Reuse (`SavedPlaylistsView`) [IMPLEMENTED]
...
## 3. Requirement 2: BEA Enrichment Encapsulation [IMPLEMENTED]

### 2.1 Problem Analysis
### 2.2 Solution Options

#### Option A: "Pattern Reuse" (Discarded)
Create a specialized `PlaylistSeriesFilterService` that mirrors the API of `SeriesFilterService` but implements logic for Series entities.
*   **Pros**: Cleanest code, typed correctly, no "if/else" spaghetti in a shared service.
*   **Cons**: Duplication of the "boilerplate" (scaffolding functions).
*   **Decision**: Rejected in favor of Option B to enforce DRY and consistent filtering logic across the app.

#### Option B: "Generic Filter Engine" (Selected)
Refactor `SeriesFilterService` into a `GenericFilterEngine` that preserves 100% of existing `SeriesView` functionality while enabling reuse for `SavedPlaylistsView`.
*   **Core Principle**: ZERO REGRESSION for `SeriesView`.
*   **Strategy**: Extract common filtering logic (text search, date parsing, property access) into `FilterUtils.js`. Create adapters/configurations for `Album` vs `Series` entities.
*   **Implementation**: `FilterFactory` or `FilterEngine` that takes a `config` object (e.g., fields to search, date fields to sort).

### 2.3 Proposed Design (Generic Engine Implementation)
1.  **Extract Core Logic**: Move generic utils (debounce, string normalization, sort comparators) to `FilterUtils.js`.
2.  **Generic Config**:
    *   `AlbumFilterConfig`: Maps `artist` -> `album.artist`, `year` -> `album.year`.
    *   `SeriesFilterConfig`: Maps `name` -> `series.name`, `date` -> `series.createdAt`.
3.  **UI Reuse**: Refactor `SeriesToolbar` to be `FilterToolbar` component.
    *   **Input**: `options` (Source, Year, etc.), `onFilterChange` callback.
    *   **State**: Controlled by the parent View/Controller (Soft Navigation - Critical preventing Issue #159).

---

## 3. Requirement 2: BEA Enrichment Encapsulation

### 3.1 Problem Analysis
*   **Current State**: `SeriesService.js` contains inline logic to:
    1.  Call `apiClient.BEAenrichAlbum`.
    2.  Handle errors.
    3.  Map the raw JSON response to `Album` model fields (`acclaim`, `bestEverUrl`, `rating`).
*   **Tech Debt**: This violates SRP. `SeriesService` should coordinate, not parse API specs.

### 3.2 Solution: `BEAEnrichmentHelper`
Mirror the successful `SpotifyEnrichmentHelper` pattern to centralize all BEA interactions.

#### Architecture
1.  **`BEAEnrichmentHelper.js`**:
    *   **Method**: `enrichAlbum(album, options)`
    *   **Logic**:
        *   Checks if album already has valid BEA data.
        *   Calls `apiClient.BEAenrichAlbum` (or moves that logic here entirely).
        *   **Crucial**: Handles the response parsing (`trackRatings` / `rankingConsolidated` -> `ratingsMap`) which is currently duplicated in `apiClient.js`. 
        *   **Backend Alignment**: Analysis of `server/lib/fetchRanking.js` confirms the backend returns `{ entries: [{ trackTitle, rating, position }] }`. The helper must map this `entries` array (0-100 scale) to the `tracks` array in the model.
        *   Mutates the `Album` object to apply ratings and `bestEverUrl`.

2.  **Refactor `SeriesService`**:
    *   **Target**: The `refetchAlbumMetadata` method (lines 318-431).
    *   **Change**: Delegate the specific enrichment calls (Spotify vs BEA) to their respective Helpers.
    *   **Result**: `SeriesService` becomes a pure orchestrator of the "Refetch" action, not knowing *how* to parse BestEverAlbums HTML/JSON.

3.  **Refactor `APIClient` (Cleanup)**:
    *   **Target**: `fetchAlbum` (lines 84-99).
    *   **Change**: Instead of inline raw text parsing for ratings, delegate to `BEAEnrichmentHelper` or a shared `AcclaimTransformer`.
    *   **Goal**: `APIClient` should focus on fetching data, not business logic of merging ratings.

### 3.3 Comparison & Logic Location

| Feature | `SpotifyEnrichmentHelper` | Proposed `BEAEnrichmentHelper` |
| :--- | :--- | :--- |
| **Source** | `SpotifyService` | `apiClient` / `/api/enrich-album` |
| **Caching** | `SpotifyEnrichmentStore` (IDB) | **Album Model** (Firestore persistence) |
| **Mapping** | `TrackTransformer` | **Internal** (Extracting logic from `apiClient:92-99`) |
| **Rating Parse**| N/A | **Critical**: Maps `trackRatings` array to `ratingsMap` for O(1) lookup. |

---


---

## 4. Regression Prevention (Lessons from Debug Log)
Based on `docs/debug/DEBUG_LOG.md`:
*   **Issue #159 (Flash/Hard Nav)**: The Filter implementation MUST use "Soft Navigation" (Controller state update -> View re-render) and NOT `router.navigate`.
*   **Issue #150 (Sort Sync)**: The View must explicitly listen to sort updates. Reactive state or explicit `update()` calls must carry the *sorted* list.
*   **Issue #95 (Empty Dropdowns)**: Filter Options must be initialized synchronously or handle loading states gracefully to prevent empty dropdowns on first load.
*   **Issue #126 (Property Mismatch)**: `FilterUtils` must robustly handle missing properties (safe access) to avoid crashes when data is incomplete (e.g., `artist` vs `artistName`).

## 5. Success Criteria
1.  **SavedPlaylistsView**:
    *   **Filter Toolbar**: Functional search bar and sort dropdown.
    *   **Sort Options**:
        *   "Recently Added/Updated" (Default)
        *   "Name (A-Z)"
        *   "Name (Z-A)"
    *   **Search**: By Series Name (Exact & Fuzzy).
2.  **SeriesView (Regression Check)**:
    *   **Functionality Preserved**: Artist, Year, Source filters continue to work exactly as is.
    *   **Sorting**: All existing sort options remain.
3.  **BEA Encryption**:
    *   `SeriesService` refetch logic delegated to Helper.
    *   Rankings correctly parsed and applied.

