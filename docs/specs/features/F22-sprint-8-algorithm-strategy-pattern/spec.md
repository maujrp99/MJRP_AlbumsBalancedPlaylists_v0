---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-02
sprint: SPR-8
planned_for: "[[ROADMAP#^REL-26]]"
delivered_by: ["2cba532", "e038315"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F22: Sprint 8: Algorithm Strategy Pattern
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 8: Algorithm Strategy Pattern especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-26 (Versão do produto v2.8.0).

**Épico:** EP-02.

## Functionalities
- Registro de algoritmos com interface única generate() (BaseAlgorithm e index.js) — *evidência:* CHANGELOG arquivado v2.8.0 «New Files»; commit e038315
- Seletor de algoritmo na tela de playlists, antes de gerar, com nome, selo e descrição — *evidência:* CHANGELOG arquivado v2.8.0 «Algorithm Selector UI»
- Três algoritmos: Legacy Round-Robin, S-Draft Original e MJRP Balanced Cascade — *evidência:* CHANGELOG arquivado v2.8.0 «3 Playlist Generation Algorithms»; commit e038315
- Algoritmo recomendado já escolhido (selo RECOMMENDED no MJRP Balanced Cascade) — *evidência:* CHANGELOG arquivado v2.8.0 «(RECOMMENDED)»
- A playlist gerada continua igual (arrastar e soltar funciona) e as entradas antigas de nº de playlists e durações saem — *evidência:* CHANGELOG arquivado v2.8.0 «Changed: PlaylistsView»; commit e038315

## Sources
- `legacy/ALGORITHM_MENU.md` (other) ← `docs/archive/2025_technical/specs/algorithm-strategy/ALGORITHM_MENU.md` em `2cba532`
- `legacy/algorithm-strategy--plan.md` (plan) ← `docs/archive/2025_technical/specs/algorithm-strategy/plan.md` em `2cba532`
- `legacy/algorithm-strategy--spec.md` (spec) ← `docs/archive/2025_technical/specs/algorithm-strategy/spec.md` em `2cba532`
- `legacy/algorithm-strategy--tasks.md` (tasks) ← `docs/archive/2025_technical/specs/algorithm-strategy/tasks.md` em `2cba532`
