---
status: Accepted
lane: standard
solution_type: feature
imports: []
sprint: SPR-9+10
planned_for: "[[ROADMAP#^REL-28]]"
delivered_by: ["43e6eab", "4351463"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F24: Sprint 10: Codebase Refactoring
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 9+10: Ranking Enrichment & Codebase Refactoring especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-28 (Versão do produto v2.9.0).

## Functionalities
- (refactor) Remover o app.legacy.js (47 KB de código morto) — *evidência:* tasks.md T004–T007 [x]
- (refactor) Extrair AlbumsGridRenderer (315 linhas) e AlbumsFilters (125) da AlbumsView de 1.820 linhas — *evidência:* tasks.md T011, T013 [x]
- (refactor) Modularizar as rotas do servidor: index.js de 535 para 151 linhas (routes/albums.js, playlists.js, debug.js) — *evidência:* CHANGELOG arquivado v2.9.0 «Server routes integrated»; roadmap Sprint 9+10
- (refactor) Delegar a exportação para o Apple Music a um módulo (PlaylistsView de 886 para 783 linhas) — *evidência:* commit 4351463

## Sources
- `legacy/BUG_SPEC_REVIEW.md` (spec) ← `docs/archive/2025-12/sprint9-10-combined/BUG_SPEC_REVIEW.md` em `43e6eab`
- `legacy/SPRINT_9_10_PENDING.md` (other) ← `docs/archive/2025-12/sprint9-10-combined/SPRINT_9_10_PENDING.md` em `43e6eab`
- `legacy/agent_b_tasks.md` (tasks) ← `docs/archive/2025-12/sprint9-10-combined/agent_b_tasks.md` em `43e6eab`
- `legacy/implementation_plan.md` (plan) ← `docs/archive/2025-12/sprint9-10-combined/implementation_plan.md` em `43e6eab`
- `legacy/musicboard_scraper_onboarding.md` (other) ← `docs/archive/2025-12/sprint9-10-combined/musicboard_scraper_onboarding.md` em `43e6eab`
- `legacy/sprint9-10-combined--plan.md` (plan) ← `docs/archive/2025-12/sprint9-10-combined/plan.md` em `43e6eab`
- `legacy/rankings_architecture.md` (other) ← `docs/archive/2025-12/sprint9-10-combined/rankings_architecture.md` em `43e6eab`
- `legacy/sprint9-10-combined--spec.md` (spec) ← `docs/archive/2025-12/sprint9-10-combined/spec.md` em `43e6eab`
- `legacy/sprint9-specs.md` (spec) ← `docs/archive/2025-12/sprint9-10-combined/sprint9-specs.md` em `43e6eab`
- `legacy/sprint9-10-combined--tasks.md` (tasks) ← `docs/archive/2025-12/sprint9-10-combined/tasks.md` em `43e6eab`
