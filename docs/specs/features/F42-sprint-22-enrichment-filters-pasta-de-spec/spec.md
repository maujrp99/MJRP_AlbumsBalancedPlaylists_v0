---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-03
sprint: SPR-22b
delivered_by: ["9c3d172", "be0443f"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F42: Sprint 22: Enrichment & Filters (pasta de spec)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 22: Enrichment & Filters (cabeçalho da spec) especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

**Épico:** EP-03.

## Functionalities
- Buscar, ordenar e filtrar por série e por lote na tela de playlists guardadas (FilterToolbar e SavedPlaylistsFilterService) — *evidência:* tasks.md Fases 2–3 [x]; commit be0443f
- (refactor) Utilitários de filtro compartilhados (FilterUtils) com testes — *evidência:* tasks.md Fase 2 [x]
- (refactor) SeriesView passa a usar o FilterToolbar sem regressão — *evidência:* tasks.md Fase 3 [x]; commit be0443f
- (refactor) BEAEnrichmentHelper tira do SeriesService e do cliente a leitura do BestEverAlbums — *evidência:* tasks.md Fase 1 [x]; BEAEnrichmentHelper.js

## Sources
- `legacy/sprint22-enrichment-filters--plan.md` (plan) ← `docs/technical/specs/sprint22-enrichment-filters/plan.md`
- `legacy/sprint22-enrichment-filters--spec.md` (spec) ← `docs/technical/specs/sprint22-enrichment-filters/spec.md`
- `legacy/sprint22-enrichment-filters--tasks.md` (tasks) ← `docs/technical/specs/sprint22-enrichment-filters/tasks.md`
