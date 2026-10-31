---
status: Accepted
lane: standard
solution_type: feature
imports: []
sprint: SPR-17.75
planned_for: "[[ROADMAP#^REL-37]]"
delivered_by: ["2cba532", "4fcd95f", "d3a9087", "fe90616"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F35: Sprint 17.75: Album Classification Modularization (ARCH-18)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 17.75: Classification Modularization especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-37 (Versão do produto v3.17.5).

## Functionalities
- (refactor) Pasta classification/ com BaseStrategy e ElectronicGenreDetector — *evidência:* spec §Funil; arquivos no código; commit 4fcd95f
- (refactor) Estratégias do funil: AppleMetadata, TitleKeyword, RemixTracks, TrackCount e AIWhitelist — *evidência:* spec Etapas 1–5; arquivos no código; commits d3a9087, fe90616
- (refactor) AlbumTypeClassifier como orquestrador (Chain of Responsibility) — *evidência:* spec §Arquitetura; AlbumTypeClassifier.js; roadmap Sprint 17.75
- (refactor) AlbumSearchService passa a usar as estratégias injetadas — *evidência:* roadmap Sprint 17.75 «Refactored Service»; commit d3a9087

## Sources
- `legacy/sprint17.75-classification-modularization--plan.md` (plan) ← `docs/archive/2025_technical/specs/sprint17.75-classification-modularization/plan.md` em `2cba532`
- `legacy/sprint17.75-classification-modularization--spec.md` (spec) ← `docs/archive/2025_technical/specs/sprint17.75-classification-modularization/spec.md` em `2cba532`
- `legacy/sprint17.75-classification-modularization--tasks.md` (tasks) ← `docs/archive/2025_technical/specs/sprint17.75-classification-modularization/tasks.md` em `2cba532`
