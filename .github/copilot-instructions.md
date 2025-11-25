<!-- Copilot instructions for MJRP_AlbumsBalancedPlaylists_v0 -->

# Purpose (30–50 lines)
This file gives AI coding agents the minimal, actionable knowledge to be productive in this repo: architecture, workflows, conventions, and where to modify behavior safely.

# Estilo de Resposta
## Abordagem Tática
Priorize respostas que abordem a tarefa em um formato de **passo-a-passo único** e **imediatamente acionável**. Forneça o código ou a explicação necessária apenas para o **próximo passo**.

## Planejamento Estratégico
Evite listar planos, roteiros de múltiplos passos ou visões gerais longas, a menos que o *prompt* contenha termos como: "Plano", "Roteiro", "Passos Completos", "Visão Geral", "Próxima Etapa" ou similar.

## Big picture
- Frontend: `public/` — a static SPA (HTML + `public/js/app.js`) that renders Albums, Rankings and Balanced Playlists.
- Backend: `server/` — Express proxy (`server/index.js`) that composes model calls (`lib/aiClient.js`) and deterministic scraper evidence (`lib/scrapers/besteveralbums.js`).
- Core flow: client requests `/api/generate` → server extracts album → `fetchRankingForAlbum` (scraper first, then model enrichment) → `consolidateRanking` (Borda + rating fallback) → map `finalPosition` to `tracks[].rank` → return `albumPayload`.

## Key files to inspect before changes
- `server/lib/ranking.js`: consolidation logic, `normalizeKey`, rawScore → finalPosition. Any ordering change lives here.
- `server/index.js`: orchestration, merge logic, mapping `rankingConsolidated` → `tracks[].rank`, endpoints `/api/generate` and `/api/debug/raw-ranking`.
- `server/lib/scrapers/besteveralbums.js`: canonical evidence source; includes `rating` extraction and `referenceUrl`.
- `public/js/app.js`: UI rendering, `collectRankingAcclaim` (dedupe key: `provider::albumId::trackTitle::position::referenceUrl`), `renderRankingSummaryList`, `renderRankingAcclaimList` and footer logs.

## Project-specific conventions
- Consolidation: Borda-like scoring stored as `rawScore` and normalized into `finalPosition` + `normalizedScore`.
- Ratings: if BestEver provides numeric `rating`, code may prefer rating-based ordering — keep unit tests updated when changing this rule.
- Normalization: `normalizeKey` must strip diacritics (NFD + remove \p{M}), remove non-alphanumerics, and lowercase. Keep server and inline normalizers consistent.
- Payload contracts (used by UI):
  - `albumPayload.rankingAcclaim` → [{provider, trackTitle, position, rating?, referenceUrl?}]
  - `albumPayload.rankingConsolidated` → [{trackTitle, rawScore, finalPosition, normalizedScore, supporting[], rating?}]
  - `albumPayload.tracks[]` → each track may receive `rank` from consolidated finalPosition

## Developer workflows (explicit)
- Start local dev (server + static): `./scripts/start-local.sh` / `./scripts/stop-local.sh`.
- Server tests: `cd server && npm test` (runs scraper + integration + curation tests).
- Debug raw model output: `POST /api/debug/raw-ranking` or `curl -X POST http://localhost:3000/api/generate -d '{"albumQuery":"Pink Floyd - The Wall"}' | jq .`
- Deploy: `./scripts/deploy-prod.sh` (CI/CD wrapper). Env vars: `AI_API_KEY`, `AI_ENDPOINT`, `AI_MODEL`, `FIREBASE_SERVICE_ACCOUNT`, `ALLOWED_ORIGIN`.

## Integration & pitfalls
- Scraper-first: `fetchRankingForAlbum` prefers BestEver evidence; if partial, it enriches with model outputs and merges by normalized title.
- Watch for model truncation: `model_truncation_detected` logging exists — long prompts may be truncated.
- Client dedupe: `collectRankingAcclaim` includes `albumId` and `trackTitle` to prevent collisions; keep that shape when changing server payloads.

## When you change ranking behavior
- Update `server/lib/ranking.js` (ordering logic) and `server/index.js` (mapping to `tracks[].rank`).
- Add/adjust unit tests in `server/test/` (fixtures under `server/test/fixtures`) and run `cd server && npm test`.

If anything here is unclear or you want this shortened/expanded, tell me which section to iterate.
