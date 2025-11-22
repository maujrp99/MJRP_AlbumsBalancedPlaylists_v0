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

Longer-term
-----------
- Add retry logic and rate-limiting in the proxy (to protect API keys and avoid hitting provider rate limits).
- Add observability: structured logs, metrics (e.g., latency histograms), and optional tracing.
- Add an e2e test job that spins up proxy + static server + mock provider to validate full flow in CI.

Open Questions
--------------
- Will we accept stricter validation (e.g., require `duration` on tracks) or keep a permissive schema to accommodate provider variability?
- Preferred CI provider (GitHub Actions assumed) and whether to run tests on every push.

Appendix: Mapping to Spec Kit SDD items
--------------------------------------
This document provides the core Spec Kit sections: purpose, scope, architecture, data contracts, security, testing and operational runbook. We can expand each section with diagrams, sequence diagrams and sample request/response fixtures as a next step.

---
End of SDD (draft)
