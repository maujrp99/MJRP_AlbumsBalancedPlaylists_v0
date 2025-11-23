# Changelog

## BEA-RankingAcclaim-Implemented (2025-11-23)

### Added
- Scraper-first ranking provenance: deterministic per-track evidence from BestEverAlbums is preferred when available.
- Server: `bestEverEvidence`, `bestEverAlbumId` and per-track `rating` are returned in album payloads and exposed via `/api/generate` and debug endpoints.
- Merge logic: when scraper evidence is partial, the AI model enriches missing tracks; scraper entries override model entries for matched tracks.
- Frontend: consolidated ranking UI updated to prefer server-side `rankingConsolidated`, remove redundant global positions table, and surface BestEver ratings and canonical BestEver URL when present.
- Tests: fixture-driven parser tests for BestEver scraper and unit tests for normalization/consolidation added under `server/test/`.

### Fixed
- Removed confusing global "positions" block that interleaved albums; per-album consolidated rankings render correctly and tracks are ordered by final rank.

### Operational
- Server restarted and health endpoint returned OK during development. Debug endpoints validated BestEver evidence for sample albums.

### Changed
- `fetchRankingForAlbum` now prefers scraper evidence and merges model evidence where necessary; model-provided URLs are verified and nullified if unverifiable.

### Notes
- PR: https://github.com/maujrp99/VibeCoding/pull/2
- Commit: af59825
- Tag/Release: `BEA-RankingAcclaim-Implemented`

## Unreleased

### Added
- Scraper-first ranking provenance: attempt deterministic per-track evidence from BestEverAlbums and prefer it when available.
- Merge logic: when scraper evidence is partial, the AI model is called to enrich missing tracks; scraper entries override model entries for matched tracks.
- Centralized URL verification: `server/lib/normalize.js` now validates and sanitizes `referenceUrl` values (BestEver URLs are trusted).
- Frontend: UI surfaces BestEver sources first and marks BestEver-sourced acclaim entries as verified; operator batch button `#updateAcclaimBtn` is present but hidden by default.
- Fixture-driven parser tests for BestEver scraper and lightweight unit tests added under `server/test/`.
- Observability: lightweight structured logging for scraper failures, URL nullification events, model enrichment failures and model truncation detection.

### Fixed
- UI: removed redundant global "positions" block in the ranking panel and corrected renderer to display a single per-album consolidated ranking ordered by track rank (1 = most acclaimed).

### Operational
- Server was restarted during development and the health endpoint responded OK on 2025-11-23.

### Changed
- `fetchRankingForAlbum` now prefers scraper evidence and merges model evidence when needed.

### Notes
- See feature branch `feature/ranking-provenance-implementation` for implementation details and tests.
# Changelog

## Unreleased

### Added
- Scraper-first ranking provenance: attempt deterministic per-track evidence from BestEverAlbums and prefer it when available.
- Merge logic: when scraper evidence is partial, the AI model is called to enrich missing tracks; scraper entries override model entries for matched tracks.
- Centralized URL verification: `server/lib/normalize.js` now validates and sanitizes `referenceUrl` values (BestEver URLs are trusted).
- Frontend: UI surfaces BestEver sources first and marks BestEver-sourced acclaim entries as verified; operator batch button `#updateAcclaimBtn` is present but hidden by default.
- Fixture-driven parser tests for BestEver scraper and lightweight unit tests added under `server/test/`.
- Observability: lightweight structured logging for scraper failures, URL nullification events, model enrichment failures and model truncation detection.

### Fixed (2025-11-23)
- UI: removed redundant global "positions" block in the ranking panel and corrected renderer to display a single per-album consolidated ranking ordered by track rank (1 = most acclaimed).

### Operational
- Server was restarted during development and the health endpoint responded OK on 2025-11-23.

### Changed
- `fetchRankingForAlbum` now prefers scraper evidence and merges model evidence when needed.

### Notes
- See feature branch `feature/ranking-provenance-implementation` for implementation details and tests.
