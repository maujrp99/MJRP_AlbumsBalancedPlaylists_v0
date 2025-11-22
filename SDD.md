# Software Design Document (SDD)

Status: Draft

Last updated: 2025-11-22

Authors: Project maintainers

Purpose
-------
This document captures the design, architecture, interfaces, and operational considerations for the "VibeCoding / MJRP Albums Balanced Playlists" project. It is intended to follow the spirit of a Spec Kit SDD: clear goals, architecture diagrams (where applicable), component responsibilities, data contracts, security requirements and testing guidance.

Scope
-----
- Frontend: single-page static app served from `public/` (main entry: `public/hybrid-curator.html`).
- Backend: small Express proxy in `server/index.js` that mediates calls to an AI provider (Gemini / Google Generative Language) and provides normalization + validation.
- Persistence: Firestore usage from the client (no server-side DB in this repository).

Goals
-----
- Keep API keys off the browser by routing AI requests through a server-side proxy.
- Provide a predictable normalized schema for album metadata returned by AI.
- Make the codebase maintainable and testable: modular server, small focused frontend modules, documented schemas and contracts, CI, and docs.

Non-goals
---------
- Full production-grade deployment automation (this SDD scopes local dev and simple hosting patterns).
- Replacing Firebase with a different backend (out of scope unless requested).

High-level Architecture
-----------------------
- Public static site (browser) — calls server proxy for AI-based album metadata; uses Firebase for user data and persistence.
- Server proxy — receives `{ albumQuery }`, forwards to provider, normalizes results and validates against a JSON schema (AJV).

Component Responsibilities
--------------------------
- public/
  - `hybrid-curator.html` — primary UI and orchestration code (draggables, curation algorithms).
  - `js/api.js` — client API layer (single fetch + `fetchMultipleAlbumMetadata` batch helper).
  - `js/app.js` — app glue, UI rendering and Firebase interactions.

- server/
  - `index.js` — Express application exposing: `GET /_health`, `GET /api/list-models`, `POST /api/generate`.
  - Validation: optional `ajv` schema validator is used to ensure album objects match the expected contract.

Data Contracts (Album Schema)
-----------------------------
The system expects album objects shaped like:

```json
{
  "id": "string",
  "title": "string",
  "artist": "string",
  "year": 1976,
  "cover": "string (URL)",
  "tracks": [
    { "id":"string", "rank":1, "title":"string", "duration": 234 }
  ]
}
```

The server validates that `title`, `artist` and `tracks` exist and that `tracks` is an array of objects each with `id`, `rank` and `title` (and optional `duration` integer). Validation uses `ajv` when installed.

Public API Endpoints
--------------------
- `GET /_health` — returns `{ ok: true }`.
- `GET /api/list-models` — forwards to provider list models endpoint (for Google GL endpoints uses `?key=` parameter).
- `POST /api/generate` — accepts `{ albumQuery, model?, maxTokens? }` and returns either normalized `{ data: <album> }` (200) or an error payload.

Security
--------
- Secrets (AI API key) must live in a local `.env` (or secret store when deployed). `.env` is in `.gitignore`.
- Server must never leak the API key to the client. The proxy attaches keys server-side.
- Server-side validation prevents malformed data from reaching the client; validation errors are returned as HTTP 422.

Operational Runbook
-------------------
- Start proxy:
  - `cd server && npm install && node index.js`
- Serve static UI:
  - `python3 -m http.server 8000 -d public` (or `npx http-server -p 8000 public`).
- Healthcheck: `curl http://localhost:3000/_health` → `{ ok: true }`.

Testing Strategy
----------------
- Unit tests for server normalization & schema validation (Node tests exercising `index.js` functions extracted into testable modules).
- Integration tests: run a mock AI provider (or record fixtures) and verify `POST /api/generate` returns valid album objects and correct error codes when provider output is malformed.
- Frontend: small unit tests for `public/js/api.js` functions (mock `fetch`), and end-to-end smoke tests driving the UI in a headless browser.

Roadmap / Next Steps (short-term)
---------------------------------
1. Extract server logic into small modules (`server/lib/normalize.js`, `server/lib/aiClient.js`, `server/lib/schema.js`) so unit tests can import them.
2. Add unit tests (Jest or AVA) for normalization and schema validation; add a CI workflow to run tests on PRs.
3. Add linting (ESLint) and a formatting step (Prettier), plus package.json scripts: `npm test`, `npm lint`, `npm start`.
4. Integrate `fetchMultipleAlbumMetadata` into the UI import flow and add progress UI.
5. Add `ajv-formats` for stricter url/date validation and consider requiring `cover` to be a valid URL.
6. Implement P1/P2 playlist rules: ensure P1 contains all `rank === 1` tracks and P2 contains all `rank === 2` tracks; if either playlist's total duration is under 45 minutes, fill it by selecting additional tracks using the "worst-ranked first" strategy (highest numeric `rank` values). Never remove or swap existing `rank === 1` tracks out of P1 or `rank === 2` tracks out of P2 when filling.

Testing & Style decisions
-------------------------
As part of the Priority 1 refactor we introduced the following developer tooling and choices:

- Modularization: server logic was extracted into `server/lib/*` modules to simplify unit testing and maintenance.
- Schema testing: `server/schema/album.schema.json` is the canonical schema; `server/lib/schema.js` loads that schema and compiles an AJV validator (optional: requires `ajv` installed).
- Tests: a lightweight node-based test runner `server/test/run-tests.js` is included and wired to `npm test`. This avoids environment constraints encountered when running Jest in this workspace. The file `server/test/*.test.js` contains Jest-style tests (kept for future migration) while the node-runner validates core functionality now.
- Style: the project uses JavaScript Standard Style (`standard`) for server source files and Prettier for formatting. `server/package.json` contains `lint`, `lint:fix` and `format` scripts. Tests were left using simple node assertions for reliability; they can be migrated to full Jest later.

CI recommendation
-----------------
Add a GitHub Actions workflow that runs:

- `npm ci` in `server/`
- `npm run lint` (Standard) in `server/`
- `npm test` (node-runner) in `server/`

When Jest is enabled, replace the node-runner step with `npm test` (Jest) and include `jest --reporters=default` in CI logs.

Longer-term
-----------
- Add retry logic and rate-limiting in the proxy (to protect API keys and avoid hitting provider rate limits).
- Add observability: structured logs, metrics (e.g., latency histograms), and optional tracing.
- Add an e2e test job that spins up proxy + static server + mock provider to validate full flow in CI.

Open Questions
--------------
- Will we accept stricter validation (e.g., require `duration` on tracks) or keep a permissive schema to accommodate provider variability?
- Preferred CI provider (GitHub Actions assumed) and whether to run tests on every push.

Ranking Source & Traceability (secondary priority)
-------------------------------------------------
We plan to add a ranking-source feature that records the provenance of ranking decisions used to place tracks and albums into playlists (examples: specific websites, magazines, critics, blogs, or internal heuristics). This is considered a secondary priority feature and will be implemented after algorithm correctness and testing are stable.

Design notes (high level):
- The system will annotate placed tracks with a `rankingInfo` array that includes labelled reasons (e.g., `P1 Hit`, `DeepCut - serpentine`, `Swap: duration-balance`) and optional numeric scores and timestamps.
- A per-album `rankingSummary` object will be stored alongside playlists to explain which tracks from the album were used and why.
- The full source list (external sources such as sites/magazines) will be recorded when available and surfaced in UI on demand; this will require a secure handling policy for any third-party attributions.

Implementation notes (detailed):
- **Ranking data contracts**
  - Each track that participates in a playlist will carry a `rankingInfo` array with zero or more entries shaped like `{ reason: string, source: string, score?: number, timestamp?: string, metadata?: Record<string, unknown> }`. `reason` describes the placement action, `source` cites the origin (algorithm, critic, site name etc.), and `timestamp` anchors the decision for auditability.
  - The playlists Firestore document will expand to contain `{ data: Playlist[], rankingSummary: Record<string, RankingSummary>, rankingSources: RankingSource[] }`. `RankingSummary` captures the album id/title/artist, the selected tracks (with rank, playlist id, and `rankingInfo` references), and an aggregated list of unique sources that affected that album. `RankingSource` records any third-party or internal provenance (e.g., `{ name: 'Rolling Stone', type: 'external', reference: 'https://...', secure: true }`).
  - Each album object may optionally include `rankingSources` as part of the fetched metadata so curators can pass real-world attributions into the curation run. Those sources flow into the aggregated ranking source list and respect the policy that external attributions are treated as untrusted data (read-only, sanitized, and only surfaced in the UI after consent).

- **Algorithm instrumentation**
  - `runHybridCuration()` now emits ranking metadata alongside the playlists. Rank 1/2 picks are annotated with `P1 Hit`/`P2 Hit` reasons, fills use `fill:worse-ranked`, and `runFase4SwapBalancing()` appends swap-specific entries when conservative swaps move tracks between playlists.
  - A helper smile collects track summaries into `rankingSummary` after playlist generation, deduplicating by album id and storing a `lastUpdated` timestamp. `rankingSources` is derived from the union of every `source` value seen in `rankingInfo` plus the optional album-level sources.
  - Default scoring metadata is applied even when third-party data is absent (e.g., `score: 1.0` for hits, `score: 0.4` for fills) so the UI can show normalized metrics without requiring a backend change.

- **Frontend persistence/UI**
  - The Firestore `playlists` document now stores the ranking metadata so it can be rendered in the UI and also replayed during export/save operations. Playback of `rankingSummary` ensures future audit tooling can explain why a specific track was selected.
  - A dedicated ranking panel surfaces the `rankingSources` (name, type, secure flag) and the `rankingSummary` per album. The panel is conditionally rendered when playlists exist and provides a secondary `details` disclosure for each album's track-level reasoning.
  - All user-submitted ranking sources are sanitized and treated as read-only in the UI; third-party attribution is collapsed behind a consent prompt or masked label when the source is marked `secure: true`.

- **Testing & validation**
  - Unit tests will verify `curateAlbums()` continues to respect the `rank === 1/2` constraints, confirms fills follow the worst-ranked-first ordering, and asserts `rankingSummary` contains every playlist track with a `rankingInfo` entry.
  - Integration tests will assert the Firestore persistence layer writes `rankingSummary` and `rankingSources` and that the front-end renders the ranking panel without regressing existing playlist visuals.

Decision: P1/P2 Fill Strategy
-----------------------------
Following the latest design decision (Option 2), when P1 or P2 durations are below the 45-minute target the system will fill the playlist by selecting additional tracks using a "worst-ranked first" policy — i.e., prefer tracks with the highest numeric `rank` values (for example, rank 10 before rank 3). This choice prioritizes balance and diversity in the resulting playlist while preserving the positional guarantees for top-ranked tracks.

Constraints and rules enforced by the algorithm:
- P1 must always include every track that has `rank === 1` from the album; P2 must always include every track that has `rank === 2`.
- When filling to reach the target duration, the algorithm may append additional tracks, but it must not remove or swap out any `rank === 1` tracks from P1 or any `rank === 2` tracks from P2.
- The filling selection order is descending by `rank` (highest numeric rank first). Ties may be broken by secondary heuristics (longer duration first, then deterministic tie-breaker such as track id).

Rationale:
- Choosing the worst-ranked-first fill policy (Option 2) aims to increase variety and avoid over-emphasizing mid-ranked tracks when boosting playlist duration. It also simplifies provenance: filled tracks are explicitly annotated as "fill:worse-ranked" in `rankingInfo` so UI and audits can explain their selection.

Implementation notes:
- `runHybridCuration()` and `runFase4SwapBalancing()` will be updated to respect these constraints and to annotate filled tracks with `rankingInfo: [{ reason: 'fill:worse-ranked', source: 'algorithm' }]`.
- Unit tests will be added to assert that P1/P2 always retain their `rank === 1/2` members and that fills obey the worst-ranked-first order and duration target behavior.

This behavior is documented here and will be added to implementation tasks in the `feature/ranking-source` branch.

Appendix: Mapping to Spec Kit SDD items
--------------------------------------
This document provides the core Spec Kit sections: purpose, scope, architecture, data contracts, security, testing and operational runbook. We can expand each section with diagrams, sequence diagrams and sample request/response fixtures as a next step.

---
End of SDD (draft)
