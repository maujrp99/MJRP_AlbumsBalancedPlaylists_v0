# Plan: Sprint 22.5 - Fuzzy Enrichment Matching

## Phase 1: Core Utilities
- Create `public/js/utils/NormalizationUtils.js`.
- Functions: `normalizeString(str)`, `removeThe(str)`, `getCoreTitle(str)`.
- Unit tests/Validation of normalization logic.

## Phase 2: BestEverAlbums (BEA) Improvements
- Update `BEAEnrichmentHelper.js` to use `NormalizationUtils`.
- Implement `findBestMatch(query, list)` using fuzzy logic.
- Verify that albums with "(Deluxe)" or extra whitespace now get their BEA ratings.

## Phase 3: Spotify Enrichment Improvements
- Update `SpotifyEnrichmentService.js`.
- Modify search query construction to be more resilient.
- Add validation step to compare Search results with original metadata to prevent wrong matches.

## Phase 4: Final Verification
- Run enrichment on a series known to have matching issues.
- Confirm higher success rate of "AI Enriched" and "Acclaim" data.
