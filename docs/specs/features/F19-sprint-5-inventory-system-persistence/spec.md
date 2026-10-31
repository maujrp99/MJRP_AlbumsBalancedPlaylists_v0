---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-08
sprint: SPR-5
planned_for: "[[ROADMAP#^REL-16]]"
delivered_by: ["43e6eab", "bf2a266", "12802cd", "8aa1fb0"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F19: Sprint 5: Inventory System & Persistence
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 5: Inventory System & Persistence especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-16 (Versão do produto v2.1.0).

**Épico:** EP-08 (também EP-07).

## Functionalities
- Menu de topo com 5 itens (Home, Albums, Album Series, Playlist Series, Inventory), no desktop e no celular — *evidência:* tasks.md 1.1–1.4 [x]
- (refactor) Renomear views e stores para a nomenclatura Album Series (SeriesListView→AlbumSeriesListView, series→albumSeries) — *evidência:* tasks.md 1.5–1.12 [x]
- Persistência no Firestore (SDK modular) das séries e dos álbuns, por conta — *evidência:* tasks.md 2.1–2.7 [x]; CHANGELOG arquivado v2.1.0 «Firestore Integration»
- (refactor) Padrão de repositórios (Series/Album/Playlist) e cache IndexedDB para o acesso aos dados — *evidência:* CHANGELOG arquivado v2.1.0 «Repository Pattern», «IndexedDB Caching»
- Álbuns-fantasma: o contexto de uma série não vaza para outra — *evidência:* tasks.md 3.1–3.3 [x]; CHANGELOG arquivado v2.1.0 «Fixed: Ghost Albums»
- Modal do inventário visível e centralizado em todas as rotas — *evidência:* tasks.md 3b.1–3b.4 [x]
- Inventário: ver, adicionar, editar e excluir álbuns que a pessoa possui, com preço editável na linha e multimoeda, sem exclusão em cascata — *evidência:* UI spec §5 e Architecture Updates; commits 12802cd, 8aa1fb0; roadmap «Inventory CRUD»
- Séries de álbuns e séries de playlists guardadas na nuvem, com editar e excluir — *evidência:* UI spec §3–4; commit 12802cd «complete persistence UI»; roadmap «Firestore Persistence»
- Playlists guardadas persistem ao recarregar a página — *evidência:* plan Fase 4; commit 12802cd; roadmap v2.1.0

## Sources
- `legacy/SPRINT5_IMPLEMENTATION_PLAN.md` (plan) ← `docs/archive/2025-12/sprint-5/SPRINT5_IMPLEMENTATION_PLAN.md` em `43e6eab`
- `legacy/SPRINT5_TASKS.md` (tasks) ← `docs/archive/2025-12/sprint-5/SPRINT5_TASKS.md` em `43e6eab`
- `legacy/SPRINT_5_UI_SPECS_ARCHIVED.md` (spec) ← `docs/archive/SPRINT_5_UI_SPECS_ARCHIVED.md` em `bf2a266`
- `legacy/SPRINT_5_ARCHITECTURE_UPDATES_ARCHIVED.md` (other) ← `docs/archive/SPRINT_5_ARCHITECTURE_UPDATES_ARCHIVED.md` em `bf2a266`
