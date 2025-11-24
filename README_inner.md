# MJRP Albums Balanced Playlists

This repository contains the MJRP Albums Balanced Playlists project — a hybrid curator that consolidates per-track acclaim (BestEverAlbums + AI-enriched) and generates balanced playlists.

Key links
- Origin monorepo: `maujrp99/VibeCoding` (subdirectory `MyProjects/MJRP_AlbumsBalancedPlaylists_v0`)
- PR with latest provenance feature: https://github.com/maujrp99/VibeCoding/pull/2
- Release / Tag: `BEA-RankingAcclaim-Implemented`
- Live demo: https://mjrp-playlist-generator.web.app

Documentation
- `docs/LOCAL_RUN.md`: Local development & smoke-tests
- `docs/PRODUCTION_DEPLOY.md`: Production deploy checklist
- `docs/PROJECT_SUMMARY.md`: Project executive summary
- `docs/CHAT_SUMMARY.md`: Conversation & work summary
- `docs/DEPLOYMENT.md`: Deployment checklist (Cloud Run + Firebase Hosting)
- `docs/SDD.md`: Software Design Document (detailed)
- `docs/SECURITY.md`: Security notes and runbook

Quick start
1. Install `firebase-tools`: `npm install -g firebase-tools` or use `npx`.
2. From the project root (this folder), run `firebase deploy --only hosting --project mjrp-playlist-generator` (requires authentication).

Notes
- This repo was extracted from a monorepo. CI/workflows and secrets (FIREBASE_TOKEN, FIREBASE_PROJECT) are expected to be configured in GitHub Actions for automatic deploys.
# VibeCoding — Local Dev Notes & Architecture

Last updated: 2025-11-23

This repository contains a small static frontend (under `public/`) and a lightweight local proxy server (under `server/`) used to forward AI requests to a provider (Gemini / Google Generative Language) so API keys remain on the server and are not exposed to the browser.

This README documents the code layout, how the proxy works, how to run the project locally, and recommended security / git hygiene steps.

## Project layout

This README was updated to reflect recent refactors: the client API layer (`public/js/api.js`) was extracted, a server-side JSON Schema validator using `ajv` was added, and a client batch helper `fetchMultipleAlbumMetadata` is available for importing many albums with concurrency and retries.
  - `public/css/style.css` — styles extracted from the original inline CSS.

  - `server/index.js` — implements `/api/generate`, `/api/list-models` and `/_health`. The server reads `AI_API_KEY`, `AI_ENDPOINT` and `AI_MODEL` from environment variables.
  - `server/package.json` — server dependencies (`axios`, `cors`, `dotenv`, `express`).


## What the proxy does

  - If `AI_ENDPOINT` indicates Google Generative Language, the proxy builds a `generateContent` request calling an explicit model (defaults to `models/gemini-2.5-flash`) and attaches the API key as a query parameter.
  - The proxy attempts to normalize responses to return a single `data` object `{ data: <album> }` when the provider returns stringified JSON inside `candidates[0].content.parts[0].text` or when the provider returns an object with `tracks`.
  - On error, the proxy forwards provider error payloads with the appropriate HTTP status.

## Running locally (dev)

1. Install server deps:

```bash
cd server
npm install
cd ..
```

2. Create a local `.env` (this file must NOT be committed):

```text
AI_API_KEY=YOUR_REAL_KEY_HERE
AI_ENDPOINT=https://generativelanguage.googleapis.com/v1
AI_MODEL=models/gemini-2.5-flash
PORT=3000
```

3. Start the proxy:

```bash
cd server
node index.js
# or use nodemon in dev: npx nodemon index.js
```

4. Serve the `public/` directory (for example using a static server on port 8000):

```bash
# from repo root
python3 -m http.server 8000 -d public
```

 - Open `http://localhost:8000/hybrid-curator.html` and use the app; client calls `http://localhost:3000/api/generate` to request album metadata (unless overridden by `window.__api_base`).

## Security & git hygiene


### Recommended cleanup workflow (manual review + backup)

1. Create a backup branch:

```bash
git branch pre-secrets-cleanup-backup
```

2. Inspect commits for secrets (example search):

```bash
git rev-list --all | xargs -n1 git grep -n "AIza" --line-number --no-index || true
```

3. Remove files from history using `git filter-repo` (recommended):

```bash
pip3 install git-filter-repo
git filter-repo --invert-paths --paths .env --paths .env.example
```

4. Run `git gc` and verify secrets are gone. Do NOT force-push to any shared remote until you coordinate with collaborators.

If `git filter-repo` is not available, `git filter-branch` can be used, but it is slower and deprecated.

## Notes and troubleshooting


## Where to continue


If you'd like, I can perform the safe, non-destructive steps now (create backup branch, add & commit safe files). I will not rewrite history or push anything to remotes without explicit confirmation.

Recent engine changes (ranking provenance)
----------------------------------------
Since 2025-11-22 a focused update was applied to improve ranking traceability and provenance:

- Scraper-first evidence: the server now attempts to fetch deterministic per-track acclaim from `BestEverAlbums` (via `server/lib/scrapers/besteveralbums.js`) and will prefer that evidence when available.
- Anti-hallucination: model-provided `referenceUrl` values are validated server-side (`server/lib/validateSource.js`) and are nullified if unverifiable. BestEverAlbums URLs are accepted as trusted provenance.
- Pipeline change: `fetchRankingForAlbum` (in `server/index.js`) now uses the BestEverAlbums scraper as the primary source and falls back to the model only when scraper evidence is unavailable.
- Tests: lightweight tests were added under `server/test/` to exercise scraper parsing and the integrated ranking flow. Run them via `node server/test/run-tests.js` and `node server/test/unit-tests.js`.
- Exports & dev ergonomics: `fetchRankingForAlbum` is exported for test harnesses and the server module is safe to `require()` in tests (server starts only when run directly).

Additional implemented details (2025-11-23):

- Merge logic: when BestEverAlbums provides partial evidence (fewer tracks than the album), the server now calls the model as an enricher and deterministically merges results: scraper entries override model entries for matching tracks; the model fills uncovered tracks. Model sources are included but limited to keep provenance concise.
- Centralized URL verification: URL sanitization and verification were centralized in `server/lib/normalize.js` via a new async extractor so all normalization paths apply the same anti-hallucination rules (BestEver URLs are implicitly trusted).
- Frontend: `public/js/app.js` and `public/hybrid-curator.html` were updated to show BestEverAlbums first in the ranking panel and to display a small verified badge for BestEver-sourced acclaim entries. The batch operator button `#updateAcclaimBtn` remains in the DOM but is hidden by default for operator use.
- Observability: a lightweight structured logger (`server/lib/logger.js`) was added and instrumented to record scraper failures, model enrichment failures, URL nullifications, and model truncation signals (finishReason / MAX_TOKENS) to aid debugging and audits.

These updates were implemented and unit-tested locally. See `server/test/scraper-fixtures-test.js` for the fixture-driven BestEver parser test and `server/test/unit-tests.js` for normalization/curation smoke tests.

These changes were committed on a feature branch; see the commit history for details. Next recommended work: frontend UI updates to emphasize verified BestEverAlbums provenance, merging partial model + scraper evidence for coverage gaps, fixture-based parser tests, and adding CI to run tests on PRs.

UI fix (2025-11-23): The client renderer was updated to show per-album consolidated rankings only (removed the earlier global per-position matrix) and to order album tracks by rank (1 = most acclaimed). Server health was confirmed during testing on 2025-11-23.

Generated by developer tooling during a local refactor to extract client JS/CSS and add an AI request proxy. Keep secrets out of this repository.

Documentation
-------------
This project includes a draft Software Design Document: `SDD.md` in the repo root. The SDD follows a Spec Kit–style layout (purpose, scope, architecture, data contracts, security, testing guidance and an operational runbook). Review and iterate on `SDD.md` when planning larger refactors.

Developer workflow & commands
-----------------------------
Quick commands for local development, linting and running tests for the server proxy (see `server/`):

- Install deps:

```bash
cd server
npm install
```

- Run the proxy locally:

```bash
npm start
# or in dev
npm run dev
```

- Run the lightweight test runner (uses Node asserts):

```bash
npm test
# (runs a simple node-based test harness in `server/test/run-tests.js`)
```

- Lint / style (Standard + Prettier):

```bash
# Run JavaScript Standard style linter
npm run lint

# Attempt autofix (Standard)
npm run lint:fix

# Format codebase with Prettier
npm run format
```

Notes:
- The repository contains both ESLint/Prettier configuration (for editors and future CI) and `standard` for an opinionated JS style. The server source is formatted using Standard; tests use a small node runner to avoid Jest environment issues in the local environment. We can enable full Jest-based tests later if you prefer.

## Repository Layout & Recent Restoration (2025-11-24)

This project experienced a repository flatten/restore operation during maintenance on 2025-11-23/24. The text below summarizes what changed, what backups were created, and the current git state so you have a single source of truth inside this repository.

- **Top-level repo (`/Users/mpedroso/VibeCoding`)**: temporarily contained the active `.git` after a flatten attempt. That state was backed up and then restored so the project folder is the active repository again.
- **Project workspace (`MyProjects/MJRP_AlbumsBalancedPlaylists_v0`)**: restored from backup and is the active git repository root for this project. After restore the repo HEAD points to `refs/heads/prod-fixes` (branch `prod-fixes`) and remote `origin` is `git@github.com:maujrp99/MJRP_AlbumsBalancedPlaylists_v0.git`.

- **Backups and saved artifacts (created during remediation):**
  - `MyProjects/MJRP_AlbumsBalancedPlaylists_v0-backup-20251123T213436Z.tar.gz` — inner-repo full backup (created 2025-11-23T21:34:36Z)
  - `MyProjects/MJRP_AlbumsBalancedPlaylists_v0-git-backup-20251123T213950Z.tar.gz` — backup of the top-level `.git` (created 2025-11-23T21:39:50Z)
  - `MyProjects/MJRP_AlbumsBalancedPlaylists_v0-current-before-restore-20251124T133115Z.tar.gz` — snapshot of the workspace before restore (created 2025-11-24T13:31:15Z)
  - `MyProjects/MJRP_AlbumsBalancedPlaylists_v0-moved-20251124T133115Z` — the original workspace directory moved aside as a safe copy (moved 2025-11-24T13:31:15Z)

- **What was done (high level):**
  - Prepared safe rsync-based flatten script and executed a dry-run to preview changes.
  - Created multiple backups (inner repo tarball and `.git` tarball) before making changes.
  - During the attempted flatten the `.git` ended up at the parent (`/Users/mpedroso/VibeCoding/.git`). After review we restored the project from the inner backup and copied the correct `.git` state back into the project workspace.
  - Verified the restored workspace is a working git repository and reported the current branch and remote.

- **Current state (as of 2025-11-24):**
  - Workspace restored at: `MyProjects/MJRP_AlbumsBalancedPlaylists_v0`.
  - Active branch: `prod-fixes` (HEAD: `refs/heads/prod-fixes`).
  - Remote: `origin  git@github.com:maujrp99/MJRP_AlbumsBalancedPlaylists_v0.git`.
  - Safe backups and moved copies are available in `MyProjects/` (do not delete until you confirm you no longer need them).

- **Recommended next steps:**
  - Review the changes in `git status` and any unstaged/uncommitted differences.
  - If everything looks correct: commit local changes (if any), merge `prod-fixes` into `main` or continue using the existing PR (#4) to merge via GitHub and trigger CI/hosting deploy.
  - When you confirm the restored state is final, I can help clean up the moved backup folder(s) to free disk space.

If you want, I can also add a shorter `docs/REPO_LAYOUT.md` with this content.

