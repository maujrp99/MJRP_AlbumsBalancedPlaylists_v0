---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-09
sprint: SPR-9+10
planned_for: "[[ROADMAP#^REL-28]]"
delivered_by: ["91dc165", "a3b1ded", "edc75ae", "394904c", "f1b3d46", "56a3fdf", "7ccf410", "621ea61"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F23: Sprint 9: Ranking Enrichment (sprint9-ranking-enrichment)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 9+10: Ranking Enrichment & Codebase Refactoring especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-28 (Versão do produto v2.9.0).

**Épico:** EP-09 (também EP-05, EP-03).

## Functionalities
- Busca de artista no catálogo completo do Apple Music (qualquer artista) — *evidência:* sprint9-specs «Next Steps»: Implement artist search [DONE]; commit 56a3fdf
- Correção da correspondência no BestEverAlbums (normalizeLoose, Led Zeppelin IV) — *evidência:* SPRINT_9_10_PENDING «normalizeLoose fix» DONE; besteveralbums.js no código
- Ranking com cadeia de reserva: BestEver, depois popularidade do Spotify, depois IA — *evidência:* SPRINT_9_10_PENDING «Fallback pipeline» DONE; spotifyPopularity.js; fetchRanking.js
- Filtro por fonte do ranking (dropdown) nas séries — *evidência:* SPRINT_9_10_PENDING «Source Filter» DONE; issue #57 corrigida
- Editar um lote de playlists guardado na EditPlaylistView: carregar do Firestore, editar faixas, regenerar com outro algoritmo e sobrescrever o lote antigo — *evidência:* BUG_SPEC_REVIEW (decisões #54/#55); CHANGELOG arquivado v2.9.0 «EditPlaylistView»; commits 7ccf410, 621ea61
- Playlists numeradas (visual e na geração) e barra de progresso global com esqueletos de carregamento — *evidência:* SPRINT_9_10_PENDING «Today's Fixes»; CHANGELOG arquivado v2.9.0 «GlobalProgress», «Playlist Numbering»

## Sources
- `legacy/agent_b_tasks.md` (tasks) ← `docs/technical/specs/sprint9-ranking-enrichment/agent_b_tasks.md` em `91dc165`
- `legacy/musicboard_scraper_onboarding.md` (other) ← `docs/technical/specs/sprint9-ranking-enrichment/musicboard_scraper_onboarding.md` em `a3b1ded`
- `legacy/rankings_architecture.md` (other) ← `docs/technical/specs/sprint9-ranking-enrichment/rankings_architecture.md` em `edc75ae`
- `legacy/sprint9-specs.md` (spec) ← `docs/technical/specs/sprint9-ranking-enrichment/sprint9-specs.md` em `91dc165`
- `legacy/SPRINT_9_10_PENDING.md` (other) ← `docs/technical/specs/sprint9-10-combined/SPRINT_9_10_PENDING.md` em `394904c`
- `legacy/BUG_SPEC_REVIEW.md` (other) ← `docs/technical/specs/sprint9-10-combined/BUG_SPEC_REVIEW.md` em `f1b3d46`
