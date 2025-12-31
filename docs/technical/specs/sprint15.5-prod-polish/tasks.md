# Sprint 15.5: Prod Polish & Blending Fixes

**Goal**: Polish the Production Candidate before Sprint 16 refactor.
**Priorities**: UI Precision, Blending Menu UX, Algorithm Parameterization.
**Status**: 🚀 PLANNED

## Phase 1: Cosmetic & UI Fixes (Quick Wins)

- [ ] **Badge Rename**:
    - [ ] Rename "Acclaim" badge -> "BestEverAlbums" (everywhere).
    - [ ] Update tooltips/labels if necessary.
- [ ] **Blending Menu Thumbnails**:
    - [ ] Fix broken cover art loading in the Blending Menu album list.
    - [ ] Ensure fallback covers work if image fails.

## Phase 2: Blending Menu UX Refactor

- [ ] **Rename Flavor Algorithms**:
    - [ ] "Crowd Favorites" -> "Top 3 Songs by Spotify Popularity"
    - [ ] "Critic's Choice" -> "Top 3 Acclaimed songs on BestEverAlbums"
    - [ ] "Greatest Hits" -> "Top 5 Songs by Spotify Popularity"
    - [ ] "Deep Cuts" -> "Top 5 Acclaimed songs on BestEverAlbums"

- [ ] **Reorder "Pick Ingredients" (New Order)**:**
    - [ ] **1st**: **Grouping Strategy** (New Param) - Defines the "Shape" of the result.
    - [ ] **2nd**: **Output Mode** (Single Playlist vs Series)
    - [ ] **3rd**: **Target Duration** (Conditional Visibility)

- [ ] **Conditional Logic for Target Duration**:
    - [ ] **HIDE** if Algorithm is "Fixed Count" (e.g., Top 3, Top 5). Reason: The user wants specific tracks regardless of time; duration is a byproduct.
    - [ ] **SHOW** only if Algorithm is "Time/Capacity Based" (e.g., Balanced Cascade, which fills space).

## Phase 3: Algorithm Parameterization (New "Grouping Strategy" Param)

- [ ] **Define Strategies**:
    1.  **By Album**: Preserves Album integrity. e.g. [Alb A: 1,2,3] -> [Alb B: 1,2,3].
    2.  **Global Rank (Interleaved)**: Best of everything mixed. e.g. [Alb A #1, Alb B #1, Alb A #2, Alb B #2...].
    3.  **Artist Rank (Cluster)**: Best of Artist X, then Best of Artist Y. e.g. [Art X #1s], [Art Y #1s]...
    4.  **Shuffle**: Random mix.

- [ ] **Implementation**:
    - [ ] Update `PlaylistGenerator.generate()` signature to accept `groupingStrategy`.
    - [ ] Implement sorting logic (likely a post-process step after track selection).

## Impact Analysis (Algorithmic Changes)

> **Risk**: Modifying the generator pipeline (`PlaylistGenerator` -> `Algorithm`) affects the core product output.

1.  **Data Flow**:
    - `BlendingMenu.js` (UI) -> needs to capture `groupingStrategy`.
    - `PlaylistsView.js` (Controller) -> passes new param to `generatePlaylists`.
    - `PlaylistGenerator.js` (Service) -> needs to apply the strategy.
        - *Decision*: Should the Algorithm class handle sorting, or should the Generator handle it post-algorithm?
        - *Recommendation*: Generator handles it as a **Post-Processing Step** ("Mixing Stage"). The Algorithm selects *which* tracks; the Generator decides *how they sit*.

2.  **Backward Compatibility**:
    - Existing saved playlists might not have this metadata. Default to 'By Album' (current behavior) to prevent breakage.

3.  **Performance**:
    - Sorting is cheap (`O(N log N)`). No performance concern for < 1000 tracks.

## Phase 4: Critical Hotfixes (Prod Polish)
- [ ] **Badge Rename**: "Acclaim" -> "BestEverAlbums" (Icons.js, CSS, Tooltips).
- [ ] **Cover Art Fix**: `BlendingMenu.js` thumbnail loading logic check.
