# Specification: Sprint 23 - Consolidated Ranking Refactor [APPROVED]

## 1. Goal
Move the application from a "Black Box" ranking system to a "Transparent Evidence" system. This involves refactoring the data flow to preserve the provenance of ranking data (votes, popularity) from backend to frontend, enabling richer UI interactions and resolving data persistence gaps.

## 2. Requirements

### Requirement 1: Persistence of Enrichment Data (Immediate Issue)
- **Problem**: When a user clicks "Refetch Enrichment", the new data (ratings, popularity) appears in the UI but is lost on page reload.
- **Requirement**: Any data fetched via the "Refetch" action MUST be persisted to the database immediately.
- **Success Criteria**:
    - A user clicks "Refetch" on an album.
    - The user reloads the page.
    - The new ratings are still visible without needing another fetch.

### Requirement 2: Single Source of Truth (Consolidated Schema)
- **Problem**: The current system "flattens" rich data (e.g., specific vote counts from BestEverAlbums) into a simple number (`rating: 88`), discarding the source context.
- **Requirement**: The `Track` model must store the full "Evidence Chain" (`rankingConsolidated`), including the source name, original score, and weight for every data point.
- **Success Criteria**:
    - The `Track` object contains an `evidence` array (e.g., `[{ source: 'BEA', score: 90 }, { source: 'Spotify', score: 75 }]`).

### Requirement 3: Transparent UI (Evidence Tooltips)
- **Problem**: Users cannot tell *why* a track is ranked #1 (e.g., "Is it popular on Spotify or critically acclaimed?").
- **Requirement**: The UI must verify the provenance of the ranking.
- **Success Criteria**:
    - Hovering over a track rating displays a tooltip showing the breakdown: "BestEverAlbums: 90 (400 votes) | Spotify: 75 (Popularity)".

## 3. Why? (Context)
- **Technical Debt**: The current "Eager Flattening" on the server side was a shortcut that prevents advanced sorting features (e.g., "Sort by Vote Count").
- **Data Integrity**: The persistence bug causes user frustration and data inconsistency.
- **UX**: Users expect transparency in algorithm decisions.

## 4. Architecture Impact
- **Backend**: Update `fetchRanking.js` to expose raw evidence.
- **Frontend Model**: Update `Track.js` to store `ranking.evidence`.
- **Frontend Logic**: Update `BalancedRankingStrategy.js` to consume evidence.
- **Persistence**: Update `SeriesService.js` to ensure writes after fetch.

## 5. Risks
- **Backward Compatibility**: Existing UI relies on flat `rating` fields. The Refactor must maintain these fields during the transition period to prevent breaking the grid.
