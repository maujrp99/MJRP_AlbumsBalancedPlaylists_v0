# Refactor Plan: Consolidated Ranking Schema (Technical Debt)

## Context
The current implementation of the `Album` and `Track` models uses a **Flattened Model** where ranking data is stored directly on track objects (`rating`, `spotifyPopularity`, `acclaimRank`).

The detailed data schema (`docs/manual/32_Data_Schema_Reference.md`) describes a more robust `rankingConsolidated` object that centralizes `sources`, `weights`, and `provider` metadata. This schema is currently aspirational and not implemented.

## Problem
The flattened model leads to:
1.  **Data Overwrites**: Multiple data sources (BEA, Spotify, AI) fight for the single `rating` field.
2.  **Loss of Provenance**: We lose the ability to tell *where* a rating came from (Was it a user vote? A critic score? A Spotify popularity index?).
3.  **Complex Merging Logic**: Components like `SeriesService` and `AlbumCardRenderer` contain duplicated, fragile logic to "guess" the best rating to display.

## Proposed Solution
Implement the `rankingConsolidated` schema as the Single Source of Truth for track rankings.

### 1. Update Models
Refactor `Track.js` to include the `ranking` property:

```javascript
/* Track.js */
this.ranking = {
  finalScore: 0, // Weighted average
  currentRank: 1,
  sources: [
    { provider: 'best-ever-albums', score: 88, weight: 1.0, count: 341 },
    { provider: 'spotify', score: 72, weight: 0.5 },
    { provider: 'user', score: 90, weight: 2.0 }
  ]
}
```

### 2. Create `RankingService`
Move all "winning score" logic out of Renderers and into a dedicated service.
- `RankingService.calculateScore(track)`: Returns the final display score.
- `RankingService.mergeSources(track, newSourceData)`: Handles the logic of updating just one source without wiping others.

### 3. Update Renderers
Update `AlbumCardRenderer` and `TracksTable` to consume `track.ranking.finalScore` and `track.ranking.currentRank`. 
- Allows for tooltips showing the breakdown ("88 from BEA, 72 from Spotify").

### 4. Migration Strategy
1.  **Phase 1**: Add `ranking` object to generic `metadata` bag (Non-breaking).
2.  **Phase 2**: Update `EnrichmentService` to populate `metadata.ranking`.
3.  **Phase 3**: Switch UI to prefer `metadata.ranking` over `track.rating`.
4.  **Phase 4**: deprecate `track.rating` and `track.spotifyPopularity`.

## Estimated Effort
- **T-Shirt Size**: Large (L)
- **Risk**: High (Core Data Structure Change)
- **Impact**: High (Enables flexible scoring, personalized weighting, and cleaner debug views).
