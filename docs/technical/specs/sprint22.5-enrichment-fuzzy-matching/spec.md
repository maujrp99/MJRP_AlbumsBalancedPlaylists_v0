# Specification: Sprint 22.5 - Fuzzy Enrichment Matching

## 1. Goal
Improve the success rate of album enrichment from external sources (Spotify, BestEverAlbums) by implementing fuzzy matching and normalization logic for artist and album names.

## 2. Requirements

### Requirement 1: String Normalization
- Create a utility to normalize titles:
    - Remove common suffixes like "(Remastered)", "(Deluxe Edition)", "(2022 Mix)".
    - Remove "The" from the start of artist names for matching purposes.
    - Convert to lowercase and remove non-alphanumeric characters for "slug" comparison.

### Requirement 2: Fuzzy Matching in BEA Enrichment
- **Current Issue**: `BEAEnrichmentHelper.js` relies on exact string concatenation (`Artist - Album`) to find ratings in the scraped BEA lists.
- **Improvement**: If an exact match fails, use a fuzzy matching algorithm (e.g., Levenshtein distance or simple word overlap) to find the best candidate in the BEA list.

### Requirement 3: Improved Spotify Matching
- **Current Issue**: `SpotifyEnrichmentService.js` often fails if the title differs slightly from the Spotify catalog.
- **Improvement**: Implement a multi-stage search strategy:
    1. Exact search (`artist:A album:B`).
    2. Normalized search (Searching for the core title).
    3. Re-validate results from search using fuzzy score before applying popularity.

## 3. Architecture
- **Helper**: `NormalizationUtils.js` - Central place for all string cleaning logic.
- **Service Update**: Update `BEAEnrichmentHelper.js` and `SpotifyEnrichmentService.js` to use these utilities.
