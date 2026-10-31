---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-02
sprint: SPR-15.5
planned_for: "[[ROADMAP#^REL-34]]"
delivered_by: ["dfd10f0", "ab4bbb6"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F32: Sprint 15.5: Prod Polish & Blending Fixes
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 15.5: Prod Polish & Blending Fixes especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-34 (Versão do produto v3.15.5).

**Épico:** EP-02 (também EP-05).

## Functionalities
- Selo «Acclaim» renomeado para «BestEverAlbums» em toda a interface — *evidência:* tasks.md Fase 1 e 4 [x]; CHANGELOG v3.15.5
- Miniaturas de capa no Blending Menu com capa substituta se a imagem falha — *evidência:* tasks.md Fase 1 [x]
- Receitas renomeadas com nomes que se explicam (ex.: «Top 3 Tracks by Spotify Popularity») — *evidência:* tasks.md Fase 2 [x]
- Ordem dos ingredientes (Grouping, Output Mode, Target Duration) e duração-alvo só quando faz sentido — *evidência:* tasks.md Fase 2 [x]
- Receitas agrupadas por origem (Spotify e BEA) no menu — *evidência:* tasks.md Fase 2 [x]
- Parâmetro «Grouping Tracks» com 4 estratégias (por álbum, ranking global, grupo por artista, aleatório) — *evidência:* tasks.md Fase 3 [x]
- Várias playlists passam a ser preenchidas em sequência, preservando o agrupamento — *evidência:* tasks.md Fase 3 [x]
- Correções críticas de produção: exportação para o Apple Music, índice duplicado, nome do lote — *evidência:* tasks.md Fase 4 [x]; commit ab4bbb6; issues #114, #115

## Sources
- `legacy/sprint15.5-prod-polish--tasks.md` (tasks) ← `docs/archive/2025-12/sprint15.5-prod-polish/tasks.md` em `dfd10f0`
