# Changelog

## Unreleased

### Added
- Scraper-first ranking provenance: attempt deterministic per-track evidence from BestEverAlbums and prefer it when available.
- Merge logic: when scraper evidence is partial, the AI model is called to enrich missing tracks; scraper entries override model entries for matched tracks.
- Centralized URL verification: `server/lib/normalize.js` now validates and sanitizes `referenceUrl` values (BestEver URLs are trusted).
- Frontend: UI surfaces BestEver sources first and marks BestEver-sourced acclaim entries as verified; operator batch button `#updateAcclaimBtn` is present but hidden by default.
- Fixture-driven parser tests for BestEver scraper and lightweight unit tests added under `server/test/`.
- Observability: lightweight structured logging for scraper failures, URL nullification events, model enrichment failures and model truncation detection.

### Changed
- `fetchRankingForAlbum` now prefers scraper evidence and merges model evidence when needed.

### Notes
- See feature branch `feature/ranking-provenance-implementation` for implementation details and tests.
