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

## Fixes: Fuzzy matching & divergence metadata (2025-11-25)

### Fixed
- Addressed missing BestEver `rating` values for some albums (notably "The Wall") caused by strict title-matching heuristics that left BestEver evidence in unmatched buckets.

### Changes
- Relaxed matching heuristics in `server/lib/ranking.js`: added tokenization, token-overlap ratio, and substring containment checks to better match scraper evidence to album track titles.
- Lowered token-overlap acceptance threshold and added containment short-circuit so variants like "Another Brick In The Wall (Pt. 2)" correctly map to album tracks.
- Recorded unmatched mentions under `rankingConsolidatedMeta.unmatchedMentions` and tracks without evidence under `rankingConsolidatedMeta.tracksWithoutSupport` for audit and divergence analysis.
- Exported `normalizeKey` from `server/lib/ranking.js` and reused it in `server/index.js` to ensure consistent normalization when mapping `finalPosition` back to `tracks[].rank`.

### Tests
- Added unit/integration verification and ran `npm test` in `server/` — all tests passed locally.

### Notes & Next Steps
- Confirm and run additional integration checks for production albums (e.g., "The Wall", "Electric Ladyland").
- After your approval I will: commit remaining changes (branch `feature/server-acclaim-order`), create a git tag (proposed `v0.3.1-bea-fuzzy-match`), open a PR against `main`, and push the tag/branch to the remote for CI and deploy.


## UI-Cleanup-Playlist-Layout (2025-11-24)

### Changed
- Albums view: track listing now shows original track order numbering (1..N) instead of showing the consolidated `rank` value next to each track. This preserves the original album sequencing when browsing source albums.
- Playlists UI: moved the playlist section title `Balanced Playlists` to sit immediately below the `Ranking de Aclamação` block (and above the generated playlists), styled to match the `Ranking de Aclamação` header.

### Removed / Moved
- Removed the prominent "Ranking Traceability" panel from the main UI. Traceability and verification messages are now recorded in a compact, collapsible footer log to reduce UI clutter.
- The per-playlist integrity verification badge was removed from the main summary card and its results are now written to the footer log.

### Added
- Footer: a small, collapsible log panel and `Last Update` timestamp were added to the bottom of the page. The log collects runtime verification messages, ranking-refresh events and operator progress updates.

### Notes
- These changes focus on UI clarity: preserve album ordering, reduce visual noise, and keep traceability information available via a small, easily-accessible log.
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
