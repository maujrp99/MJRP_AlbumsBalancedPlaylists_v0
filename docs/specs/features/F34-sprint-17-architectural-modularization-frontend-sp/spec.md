---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-02
sprint: SPR-17
planned_for: "[[ROADMAP#^REL-36]]"
delivered_by: ["2cba532"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F34: Sprint 17: Architectural Modularization (Frontend Specialization)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 17: Architectural Modularization especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-36 (Versão do produto v3.17.0).

**Épico:** EP-02.

## Functionalities
- (refactor) Normalização de dados no servidor (normalize.js, bug «Thriller») e fim do fixAlbumData no cliente — *evidência:* tasks.md T17-101…104 [x]
- (refactor) SeriesView fina com SeriesController e SeriesFilterService — *evidência:* tasks.md T17-201…205 [x]
- (refactor) MusicKitService dividido em Auth, Catalog e Library com fachada — *evidência:* tasks.md T17-301…306 [x]
- Receita genérica «Top N» com controle de 1 a 10 faixas por álbum — *evidência:* tasks.md T17-401…405, 408, 409 [x]
- (refactor) CurationEngine como Strategy que delega às classes de algoritmo — *evidência:* tasks.md T17-406 [x]

## Sources
- `legacy/sprint17-modularization--plan.md` (plan) ← `docs/archive/2025_technical/specs/sprint17-modularization/plan.md` em `2cba532`
- `legacy/sprint17-modularization--spec.md` (spec) ← `docs/archive/2025_technical/specs/sprint17-modularization/spec.md` em `2cba532`
- `legacy/sprint-17-review.md` (other) ← `docs/archive/2025_technical/specs/sprint17-modularization/sprint-17-review.md` em `2cba532`
- `legacy/sprint17-modularization--tasks.md` (tasks) ← `docs/archive/2025_technical/specs/sprint17-modularization/tasks.md` em `2cba532`
