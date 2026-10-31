---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-03
sprint: SPR-16
planned_for: "[[ROADMAP#^REL-35]]"
delivered_by: ["1265ff1", "af6ab52", "cc40fd1", "d3ed5e1"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F33: Sprint 16: Cleanup & Critical Integrity (Batch Naming)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 16: Cleanup & Batch Naming Feature especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-35 (Versão do produto v3.16.0).

**Épico:** EP-03.

## Functionalities
- (refactor) ConfirmModal e InputModal seguros com DialogService; apagar o Modals.js legado — *evidência:* tasks.md Fase 2 [x]
- (refactor) Consolidar componentes: remover BatchGroupCard e PlaylistCard em favor de Card e TrackRow — *evidência:* tasks.md Fase 3 [x]
- (refactor) Varredura final de segurança: SafeDOM nos sinks de innerHTML restantes — *evidência:* tasks.md Fase 4 [x]; commits af6ab52, cc40fd1
- Nome padrão do lote («TheAlbumBlender Playlist…») na criação, na edição e na exportação — *evidência:* tasks.md Fase 5 [x]; commit d3ed5e1
- Editar um lote não volta mais o nome ao original (#102): o lote editado sobrescreve o certo — *evidência:* tasks.md Fase 5 [x]

## Sources
- `legacy/sprint16-cleanup--plan.md` (plan) ← `docs/archive/2026-01/sprint16-cleanup/plan.md` em `1265ff1`
- `legacy/sprint16-cleanup--spec.md` (spec) ← `docs/archive/2026-01/sprint16-cleanup/spec.md` em `1265ff1`
- `legacy/sprint16-cleanup--tasks.md` (tasks) ← `docs/archive/2026-01/sprint16-cleanup/tasks.md` em `1265ff1`
