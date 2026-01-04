# Specification: ARCH-2 Standardize Stores

## 1. Problem Description
`SpotifyEnrichmentStore.js` implements its own caching and Firestore logic, deviating from the established `BaseRepository` pattern used by `AlbumSeriesStore` and others.
This inconsistency makes the codebase harder to learn and introduces bugs (like the custom `spotify_enrichment` path issue we just fixed).

## 2. Goal
Refactor `SpotifyEnrichmentStore` to use a dedicated `SpotifyEnrichmentRepository` that extends `BaseRepository`.

## 3. Scope
- **New Repository**: `public/js/repositories/SpotifyEnrichmentRepository.js`
- **Refactor**: `public/js/stores/SpotifyEnrichmentStore.js`
- **Inheritance**: Ensure `BaseRepository` features (cache invalidation, standardized CRUD) are leveraged.

## 4. Success Criteria
1.  **Pattern Compliance**: Store delegates data access to Repository.
2.  **Code Deletion**: Custom Firestore fetching code removed from Store.
3.  **Functionality**: Enrichment continues to work with no regression.

## 5. User Review Required
- **Global vs Scoped**: `BaseRepository` usually handles user scoping. `SpotifyEnrichment` is Global.
    - *Decision*: We may need to tweak `BaseRepository` to support `global` (user-agnostic) collections elegantly, or override the path generation in the new Repository.
