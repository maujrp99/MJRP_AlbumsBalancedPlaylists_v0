# Sprint 15.5: Prod Polish & Blending Fixes

**Goal**: Polish the Production Candidate before Sprint 16 refactor.
**Priorities**: UI Precision, Blending Menu UX, Algorithm Parameterization.
**Status**: ✅ IMPLEMENTED (v3.15.5 - 2026-01-02)

## Phase 1: Cosmetic & UI Fixes (Quick Wins) ✅

- [x] **Badge Rename**:
    - [x] Rename "Acclaim" badge -> "BestEverAlbums" (everywhere).
    - [x] Update tooltips/labels if necessary.
- [x] **Blending Menu Thumbnails**:
    - [x] Fix broken cover art loading in the Blending Menu album list.
    - [x] Ensure fallback covers work if image fails.

## Phase 2: Blending Menu UX Refactor ✅

- [x] **Rename Flavor Algorithms**:
    - [x] "Crowd Favorites" -> "Top 3 Tracks by Spotify Popularity"
    - [x] "Critic's Choice" -> "Top 3 Acclaimed Tracks on BestEverAlbums"
    - [x] "Greatest Hits" -> "Top 5 Tracks by Spotify Popularity"
    - [x] "Deep Cuts" -> "Top 5 Acclaimed Tracks on BestEverAlbums"
    - [x] "MJRP Balanced Cascade" -> "MJRP Zé's Full Balanced Playlists"

- [x] **Reorder "Pick Ingredients" (New Order)**:
    - [x] **1st**: **Grouping Tracks** (New Param) - Defines the "Shape" of the result.
    - [x] **2nd**: **Output Mode** (Single Playlist vs Series)
    - [x] **3rd**: **Target Duration** (Conditional Visibility)

- [x] **Conditional Logic for Target Duration**:
    - [x] **HIDE** if Algorithm is "Fixed Count" (e.g., Top 3, Top 5).
    - [x] **SHOW** when "Multiple Playlists" output mode is selected.

- [x] **Flavor Grouping**:
    - [x] Group Spotify-based algorithms together
    - [x] Group BEA-based algorithms together

## Phase 3: Algorithm Parameterization (New "Grouping Tracks" Param) ✅

- [x] **Define Strategies**:
    1.  **By Album**: Preserves Album integrity. e.g. [Alb A: 1,2,3] -> [Alb B: 1,2,3].
    2.  **Global Rank (Interleaved)**: Best of everything mixed. e.g. [Alb A #1, Alb B #1, Alb A #2, Alb B #2...].
    3.  **Artist Cluster**: Best of Artist X, then Best of Artist Y. e.g. [Art X: 1s], [Art Y: 1s]...
    4.  **Shuffle**: Random mix.

- [x] **Implementation**:
    - [x] Update `TopNAlgorithm.generate()` to accept `groupingStrategy`.
    - [x] Implement `_applyGrouping()` method for sorting logic.
    - [x] Changed distribution from round-robin to sequential (preserves grouping).

## Phase 4: Critical Hotfixes (Prod Polish) ✅

- [x] **Badge Rename**: "Acclaim" -> "BestEverAlbums" (Card.js, SeriesToolbar.js, TracksTabs.js, TracksTable.js).
- [x] **Cover Art Fix**: `BlendSeriesSelector.js` thumbnail loading logic with fallbacks.

## Files Modified

| File | Changes |
|------|---------|
| `public/js/algorithms/Top3PopularAlgorithm.js` | Renamed metadata and getPlaylistTitle |
| `public/js/algorithms/Top3AcclaimedAlgorithm.js` | Renamed metadata and getPlaylistTitle |
| `public/js/algorithms/Top5PopularAlgorithm.js` | Renamed metadata and getPlaylistTitle |
| `public/js/algorithms/Top5AcclaimedAlgorithm.js` | Renamed metadata and getPlaylistTitle |
| `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js` | Renamed metadata |
| `public/js/algorithms/TopNAlgorithm.js` | Added `_applyGrouping()`, sequential distribution |
| `public/js/algorithms/index.js` | Reordered flavor registration |
| `public/js/components/blend/BlendIngredientsPanel.js` | Renamed label, duration visibility logic |
| `public/js/components/ui/Card.js` | "Acclaim" -> "BestEverAlbums" |
| `public/js/components/ranking/TracksTable.js` | "Acclaim" -> "BestEverAlbums" |
| `public/js/components/ranking/TracksTabs.js` | "Acclaim" -> "BestEverAlbums" |
| `public/js/components/series/SeriesToolbar.js` | "Acclaim" -> "BestEverAlbums" |
| `public/js/views/albums/AlbumsGridRenderer.js` | "Ranked by Acclaim" -> "Ranked by BestEverAlbums" |
