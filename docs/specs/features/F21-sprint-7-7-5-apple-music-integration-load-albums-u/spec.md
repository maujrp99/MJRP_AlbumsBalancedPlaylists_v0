---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-09
sprint: SPR-7-7.5
planned_for: "[[ROADMAP#^REL-25]]"
delivered_by: ["1265ff1", "49ca257", "2f1752d", "e02fd20", "0be7441", "058dd33"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F21: Sprint 7 / 7.5: Apple Music Integration, Load Albums UX, AlbumsView
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 7-7.5: Data Enrichment + View Revamp especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-20 (Versão do produto v2.4.0), REL-21 (Versão do produto v2.4.1), REL-22 (Versão do produto v2.5.0), REL-23 (Versão do produto v2.6.0), REL-24 (Versão do produto v2.7.0), REL-25 (Versão do produto v2.7.1); mora na REL-25, a última.

**Épico:** EP-09 (também EP-04).

## Functionalities
- Token de desenvolvedor do MusicKit gerado no servidor (JWT ES256) em /api/musickit-token — *evidência:* tasks.md 1.1–1.3 [x]
- Serviço MusicKit no front: buscar álbuns, ler a discografia do artista e montar a URL da capa no tamanho pedido — *evidência:* tasks.md 2.1–2.2 [x]
- Capas em alta resolução (500px+) nos cartões de álbum e miniaturas de 100px no autocomplete — *evidência:* tasks.md 3.1–3.3, 4.1–4.2 [x]; commits 2f1752d, e02fd20
- Autocomplete de álbuns com a discografia oficial do artista, busca aproximada (uFuzzy + Web Worker) — *evidência:* tasks.md 2.2 [x]; CHANGELOG arquivado v2.4.0 «Autocomplete»
- Tela de carregar álbuns em duas áreas (configuração da série × seleção de álbuns) — *evidência:* sprint-7-load-albums-ux; CHANGELOG arquivado v2.4.0 «Load Albums UX: split view»
- Exportar a playlist para o Apple Music: autoriza, cria a playlist na biblioteca e avisa as faixas sem correspondência — *evidência:* tasks.md 5.1–5.4 [x]; commit 0be7441; roadmap Sprint 7-7.5
- Carregar o álbum com dados do Apple Music (faixas, ano, capa HD) em vez de gerados por IA — *evidência:* SPRINT_7_5 US1; CHANGELOG arquivado v2.7.0 «Album Loading»
- Visão Albums com escopo «All Series» × série única e agrupamento visual por série — *evidência:* SPRINT_7_5 US3 e ALBUMS_VIEW_SERIES_FILTER_SPEC; CHANGELOG arquivado v2.7.0 «AlbumsView Scope Architecture»
- Grade responsiva no modo compacto e modal de detalhes ao clicar na capa — *evidência:* SPRINT_7_5 US2; CHANGELOG arquivado v2.7.0; commit 058dd33
- Editar e excluir série dentro da própria visão Albums (consolida a lista de séries) — *evidência:* CHANGELOG arquivado v2.7.1 «Edit/Delete Series in AlbumsView»; roadmap «AlbumsView Consolidation»
- (refactor) Modos compacto/expandido como estratégias (ViewMode Strategy) — *evidência:* CHANGELOG arquivado v2.7.0; ViewModeStrategy.js no código

## Sources
- `legacy/SPRINT_7_5_LOAD_ALBUM_REFACTOR.md` (other) ← `docs/archive/2025-12/sprint-7-apple-music/SPRINT_7_5_LOAD_ALBUM_REFACTOR.md` em `1265ff1`
- `legacy/sprint-7-apple-music--plan.md` (plan) ← `docs/archive/2025-12/sprint-7-apple-music/plan.md` em `1265ff1`
- `legacy/sprint-7-apple-music--spec.md` (spec) ← `docs/archive/2025-12/sprint-7-apple-music/spec.md` em `1265ff1`
- `legacy/sprint-7-c-view-revamp.md` (other) ← `docs/archive/2025-12/sprint-7-apple-music/sprint-7-c-view-revamp.md` em `1265ff1`
- `legacy/sprint-7-load-albums-ux.md` (other) ← `docs/archive/2025-12/sprint-7-apple-music/sprint-7-load-albums-ux.md` em `1265ff1`
- `legacy/sprint-7-apple-music--tasks.md` (tasks) ← `docs/archive/2025-12/sprint-7-apple-music/tasks.md` em `1265ff1`
- `legacy/ALBUMS_VIEW_SERIES_FILTER_SPEC.md` (spec) ← `docs/technical/specs/ALBUMS_VIEW_SERIES_FILTER_SPEC.md` em `49ca257`
