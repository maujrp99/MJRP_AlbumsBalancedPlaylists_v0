---
status: Accepted
lane: standard
solution_type: feature
imports: []
sprint: SPR-19
delivered_by: ["a2f789e", "ace3988", "e047bbc"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F38: Sprint 19: Frontend Modularization
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 19: Frontend Modularization especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

## Functionalities
- (refactor) Track A: SeriesProgressBar e SeriesEmptyState extraídos da SeriesView — *evidência:* tasks-track-a [x]
- (refactor) Track B: stores puros e PlaylistsService/SeriesService para a lógica — *evidência:* tasks-track-b [x]; commits ace3988, e047bbc
- (refactor) Track C: serviços divididos (histórico, persistência, contexto do usuário) — *evidência:* spec-track-c ✅ IMPLEMENTED; PlaylistHistoryService.js, UserSyncService.js
- (refactor) Track D: PlaylistDetailsModal e SavedSeriesGroup extraídos da SavedPlaylistsView — *evidência:* tasks-track-d [x]
- (refactor) Track E: SeriesComponentFactory e SeriesViewUpdater (SeriesView final) — *evidência:* tasks-track-e [x]
- (refactor) Track F: testes de serviços e componentes (StorageService, PlaylistHistoryService, UserSyncService, SeriesComponentFactory) — *evidência:* arquivos de teste no código; tasks-track-f desmarcado

## Sources
- `legacy/plan-track-a.md` (plan) ← `docs/technical/specs/archive/sprint19-frontend-modularization/plan-track-a.md`
- `legacy/plan-track-b.md` (plan) ← `docs/technical/specs/archive/sprint19-frontend-modularization/plan-track-b.md`
- `legacy/plan-track-c.md` (plan) ← `docs/technical/specs/archive/sprint19-frontend-modularization/plan-track-c.md`
- `legacy/plan-track-d.md` (plan) ← `docs/technical/specs/archive/sprint19-frontend-modularization/plan-track-d.md`
- `legacy/plan-track-e.md` (plan) ← `docs/technical/specs/archive/sprint19-frontend-modularization/plan-track-e.md`
- `legacy/plan-track-f.md` (plan) ← `docs/technical/specs/archive/sprint19-frontend-modularization/plan-track-f.md`
- `legacy/refactoring_recommendations.md` (other) ← `docs/technical/specs/archive/sprint19-frontend-modularization/refactoring_recommendations.md`
- `legacy/spec-track-c.md` (spec) ← `docs/technical/specs/archive/sprint19-frontend-modularization/spec-track-c.md`
- `legacy/spec-track-d.md` (spec) ← `docs/technical/specs/archive/sprint19-frontend-modularization/spec-track-d.md`
- `legacy/spec-track-e.md` (spec) ← `docs/technical/specs/archive/sprint19-frontend-modularization/spec-track-e.md`
- `legacy/sprint19-frontend-modularization--spec.md` (spec) ← `docs/technical/specs/archive/sprint19-frontend-modularization/spec.md`
- `legacy/tasks-track-a.md` (tasks) ← `docs/technical/specs/archive/sprint19-frontend-modularization/tasks-track-a.md`
- `legacy/tasks-track-b.md` (tasks) ← `docs/technical/specs/archive/sprint19-frontend-modularization/tasks-track-b.md`
- `legacy/tasks-track-d.md` (tasks) ← `docs/technical/specs/archive/sprint19-frontend-modularization/tasks-track-d.md`
- `legacy/tasks-track-e.md` (tasks) ← `docs/technical/specs/archive/sprint19-frontend-modularization/tasks-track-e.md`
- `legacy/tasks-track-f.md` (tasks) ← `docs/technical/specs/archive/sprint19-frontend-modularization/tasks-track-f.md`
- `legacy/track-d-handover.md` (other) ← `docs/technical/specs/archive/sprint19-frontend-modularization/track-d-handover.md`
