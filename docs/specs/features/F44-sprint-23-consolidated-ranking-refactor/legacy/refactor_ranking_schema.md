# Refactor Plan: Consolidated Ranking Schema (Technical Debt)

## Context
The current implementation suffers from a "Flattened Model" where:
1.  **Backend (`fetchRanking.js`)**: Eagerly consolidates data using `mergeRankingEvidence`, picking winners and discarding source provenance.
2.  **Frontend Normalization (`TrackTransformer`)**: Flattens raw server data into single `rating` and `spotifyPopularity` fields on the `Track` model.
3.  **Frontend Logic (`RankingStrategy`)**: `BalancedRankingStrategy` makes decisions based on these flattened fields, losing the nuance of the original sources.

The documentation (`docs/manual/18_Frontend_Logic_Core.md`) confirms that we *already* have a robust **Strategy Pattern** and a **TrackTransformer**. We should evolve these rather than inventing new services.

## Problem
1.  **Data Loss**: Provenance is discarded during the `TrackTransformer` phase.
2.  **Rigid Scoring**: The backend hardcodes the "winning" logic.
3.  **Opaque UI**: The UI cannot explain *why* a track is ranked #1 because the evidence is gone.

## Proposed Solution
Implement the `rankingConsolidated` schema as the Single Source of Truth, preserving the full evidence chain from Backend to Frontend.

### 1. Backend Refactor (`fetchRanking.js`)
Stop returning a flattened list. Return the `rankingConsolidated` object structure defined in `32_Data_Schema_Reference.md`.
- Expose the internal `evidence` array (BEA votes, Spotify popularity, etc.) instead of just the final merged score.

### 2. Frontend Transformer Refactor (`TrackTransformer.js`)
Update `TrackTransformer` to:
- **Preserve Evidence**: Map the raw backend `evidence` array to `track.ranking.evidence`.
- **Backward Compatibility**: Continue to populate `track.rating` and `track.spotifyPopularity` (calculated from evidence) until the UI is fully migrated.

### 3. Strategy Refactor (`BalancedRankingStrategy.js`)
Update the strategies to consume `track.ranking`:
- Logic: `track.ranking.evidence.find(e => e.source === 'BestEverAlbums').score`
- This allows for more complex tie-breaking (e.g., "If BEA votes < 10, prefer Spotify").

### 4. UI Refactor (`TracksTable.js` & `AlbumCardRenderer`)
- Use `track.ranking.evidence` to render detailed tooltips ("90 from BEA, 75 from Spotify").
- Remove the "Smart Container" merging logic in `AlbumCardRenderer` since the `Track` object will now be self-contained.

## Migration Strategy
1.  **Phase 1 (Backend)**: Update `fetchRanking.js` to return `rankingConsolidated` alongside legacy data.
2.  **Phase 2 (Frontend Logic)**: Update `TrackTransformer` to populate `track.ranking`.
3.  **Phase 3 (Frontend Strategies)**: Update `BalancedRankingStrategy` to use `track.ranking`.
4.  **Phase 4 (UI)**: Update `TracksTable` to visualize the rich data.
5.  **Phase 5 (Cleanup)**: Remove legacy flattened fields and backend eager merging.

## Alignment with Architecture
This plan respects:
- **Waterfall Strategy** (Backend Logic)
- **TrackTransformer** (Frontend Normalization)
- **Strategy Pattern** (Frontend Sorting)

It simply upgrades the *data payload* passing through this existing pipeline.
