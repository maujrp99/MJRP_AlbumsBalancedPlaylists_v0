---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-05
sprint: SPR-23
delivered_by: ["c9cf80f", "29955b9"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F44: Sprint 23: Consolidated Ranking Refactor
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 23: Consolidated Ranking Refactor especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

**Épico:** EP-05.

## Functionalities
- O «Refetch» do enriquecimento fica guardado ao recarregar a página — *evidência:* tasks.md Fase 1 [x]; SeriesService.test.js; roadmap Sprint 23
- (refactor) Esquema único com a cadeia de evidências por faixa (BEA, Spotify, IA) — *evidência:* tasks.md Fase 2 [x]; fetchRanking.js; TrackTransformer
- (refactor) BalancedRankingStrategy passa a ler a cadeia de evidências — *evidência:* tasks.md Fase 3 [x]
- Dica (tooltip) na nota da faixa mostra de onde ela vem: «BestEverAlbums: 90 (400 votes) | Spotify: 75» — *evidência:* tasks.md Fase 3 [x]; roadmap «Evidence UI»

## Sources
- `legacy/sprint23-ranking-refactor--plan.md` (plan) ← `docs/technical/specs/archive/sprint23-ranking-refactor/plan.md`
- `legacy/sprint23-ranking-refactor--spec.md` (spec) ← `docs/technical/specs/archive/sprint23-ranking-refactor/spec.md`
- `legacy/sprint23-ranking-refactor--tasks.md` (tasks) ← `docs/technical/specs/archive/sprint23-ranking-refactor/tasks.md`
- `legacy/refactor_ranking_schema.md` (other) ← `docs/technical/specs/future/refactor_ranking_schema.md` em `29955b9`
