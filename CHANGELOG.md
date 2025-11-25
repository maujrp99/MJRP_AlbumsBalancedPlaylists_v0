# Changelog

All notable changes to this project are documented in this file. This changelog aims to be chronological and unambiguous: each release or hotfix has a concise summary, root cause (when relevant), the corrective action taken, and verification notes.

Format:
- Release / Hotfix header: date and short id
- Sections: Summary, Root cause (if relevant), Fix applied, Verification, Notes / Next steps

---

## Release: BEA-RankingAcclaim-Implemented (2025-11-23)

Summary
- Added scraper-first ranking provenance using BestEverAlbums when available.
- Server exposes per-track `bestEverEvidence`, `bestEverAlbumId` and per-track `rating` in the album payload returned by `/api/generate`.
- Merge logic: when scraper evidence is partial, model outputs are used to enrich missing tracks; scraper entries take precedence for matched tracks.
- Frontend: consolidated ranking UI updated to prefer server-side `rankingConsolidated` and surface BestEver sources first.

Verification
- Unit and integration tests added under `server/test/`. Local `npm test` passed during development.

---

## Hotfix: BestEver suggest fast-accept & fuzzy matching (2025-11-25)

Summary
- Problem: the BestEver `suggest.php` sometimes returned candidate results pointing to non-canonical pages (tributes, live versions). In some album queries (notably *Pink Floyd — The Wall*) the scraper selected such a page and thus returned incomplete evidence (missing per-track ratings), causing `rankingConsolidated` to be incorrect or sparse.

Root cause
- Scraper selection relied on suggest/title token matches without reliably verifying the artist or page content. Additionally, consolidation used strict normalization which failed to match many BestEver track title variants (punctuation, part labels), leaving valid mentions unmatched.

Fixes applied
- Scraper (`server/lib/scrapers/besteveralbums.js`):
  - Added a safe "fast-accept" path when `suggest.php` returns a title matching the pattern "<Album> by <Artist>" and the suggest title lacks bad keywords (e.g., `tribute`, `live`, `cover`, `deluxe`, `reissue`). The choice is logged via `bestever_fast_accept` for auditability.
  - Added page-content verification fallback: when suggest is ambiguous, the scraper fetches candidate pages and verifies album title/artist in the DOM before accepting the id.

- Consolidation (`server/lib/ranking.js` and `server/index.js`):
  - Hardened `normalizeKey` to strip diacritics (NFD + remove \p{M}), collapse non-alphanumerics, and preserve token boundaries.
  - Introduced tokenization and token-overlap heuristics and containment checks to match BestEver evidence to album tracks (reduced misses for variants such as "Another Brick In The Wall Pt. 2").
  - Fixed mapping bug and ensured `finalPosition` from consolidated results is mapped deterministically back into `tracks[].rank` (server exports `tracksByAcclaim` sorted by rank for UI convenience).

- Frontend (`public/js/app.js`):
  - Updated collection and rendering logic to prefer server `tracksByAcclaim` for deterministic numbering while preserving ordering by `rating` (descending) when ratings are available. If ratings are absent, fallback to `rank` ordering.
  - Strengthened dedupe keys in `collectRankingAcclaim` to avoid discarding valid mentions.

Verification
- Local testing: reproduced problematic case for *The Wall* and confirmed scraper now selects canonical id (`a=204`) and returns per-track ratings; `rankingConsolidated` length matched track count and `tracks[].rank` was populated.
- Tests: server unit tests passed locally (`cd server && npm test`).

Notes / Next steps
- Consider adding an environment flag `BESTEVER_STRICT_VERIFY=true|false` to control fast-accept vs strict verification in high-throughput runs.
- Persist `rankingConsolidatedMeta` to Firestore for long-term auditability (currently returned inline in the payload).

---

## Patch: UI ordering / rating restoration (2025-11-25)

Summary
- Symptom: After the first UI hotfix that made the client use `tracksByAcclaim` for numbering, the visual ordering by `rating` was lost in some production views.
- Action: Updated `public/js/app.js` to enrich `tracksByAcclaim` with ratings (from `rankingConsolidated`, `bestEverEvidence`, or `rankingAcclaim`) and order the displayed list by `rating` when ratings exist, while continuing to show the deterministic `rank` number beside each track.

Verification
- Commit `ce78f9b` recorded the change; frontend was deployed to Firebase Hosting (`https://mjrp-playlist-generator.web.app`) using `./scripts/deploy-prod.sh` and verified with sample album payloads.

---

## Unreleased / Pending

- Persist `rankingConsolidatedMeta` to Firestore for long-term divergence auditing.
- Add optional env flag `BESTEVER_STRICT_VERIFY` to toggle scraper fast-accept behavior for batch vs strict runs.
- Add additional automated post-deploy smoke tests that call `/api/generate` for a set of known albums and assert `tracksByAcclaim` presence and congruence with BestEver evidence.

---

If anything here looks ambiguous or you want a more formal release note for a GitHub Release body, tell me which section to expand and I will prepare it.
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

### 2025-11-25 — BestEverAlbums suggest fast-accept & audit

- Problem: the BestEverAlbums `suggest.php` endpoint sometimes returns entries that point to non-canonical pages (tributes, live versions). Previously, our scraper occasionally selected those pages (e.g. `a=32729`) which did not include per-track ratings and produced incomplete/incorrect `rankingAcclaim`.
- Fix applied: implement a "fast-accept" path in the BestEver scraper: when `suggest.php` returns a title that explicitly contains the pattern "<Album> by <Artist>" and the suggest title does NOT include known bad keywords (examples: `tribute`, `live`, `cover`, `deluxe`, `reissue`), we now accept the corresponding suggest URL immediately and extract its chart data. This reduces extra page fetches and matches the canonical id in normal cases (e.g. returned `a=204` for "The Wall"). The code logs `bestever_fast_accept` with the chosen id for auditability.
- Behavior: the scraper still falls back to verification and HTML-search heuristics when the suggest entries are ambiguous or contain bad keywords. This balances correctness and performance.
- Note / future improvement: it is recommended to make the strict verification configurable via an environment flag such as `BESTEVER_STRICT_VERIFY=true|false` (default `true`). When `false`, the scraper would use the fast-accept path unconditionally for matched suggest entries (faster, fewer requests). Keep the default as strict in production to avoid regressions; add the flag if/when you require lower latency in batch runs.

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

### Root cause discovered (2025-11-25)
- While investigating why `rating` values were missing for *The Wall*, we discovered the scraper was resolving the BestEver album link to the wrong chart page: it returned `https://www.besteveralbums.com/thechart.php?a=32729#tracks` ("More Bricks: The String Quartet Tribute To Pink Floyd's The Wall") instead of the canonical studio album page `https://www.besteveralbums.com/thechart.php?a=204#tracks` ("The Wall" by Pink Floyd). The mistake came from permissive search/suggest heuristics that favored token matches without verifying the artist on the matched page.

### Fix to be implemented
- Update `server/lib/scrapers/besteveralbums.js` to verify candidate chart/album pages by inspecting the page content (page title / headers) and confirming the artist/album match before accepting a candidate id/url. Prefer candidates where both album title and artist match with a reasonable token overlap. Fall back to previous behavior only if no verified candidate is found.

### Impact
- This prevents the scraper from picking tribute or unrelated albums with similar titles and restores correct `rating` extraction for canonical album pages (example: *The Wall*). This will also reduce false unmatched mappings in consolidation and improve `rankingConsolidated` accuracy.


### 2025-11-25 — UI: rating ordering restored (frontend hotfix & deploy)

- Symptom: after an initial UI hotfix, production showed correct acclaim numbering but lost the visual ordering by `rating` when ratings were available.
- Fix: updated `public/js/app.js` to prefer server `tracksByAcclaim` for deterministic numbering, but preserve ordering by `rating` (descending) when a rating exists for one or more tracks. The code enriches `tracksByAcclaim` with ratings from `rankingConsolidated`, `bestEverEvidence` or `rankingAcclaim` before sorting for display.
- Commit: `ce78f9b` — `UI: prefer tracksByAcclaim for numbering; preserve rating ordering when available`.
- Deploy: frontend published to `https://mjrp-playlist-generator.web.app` via `./scripts/deploy-prod.sh` (2025-11-25).
- Verification: ensure `/api/generate` payload contains `tracksByAcclaim` with `rank` and, when present, `rating` values; the UI now shows the deterministic rank while ordering by rating when available.

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
