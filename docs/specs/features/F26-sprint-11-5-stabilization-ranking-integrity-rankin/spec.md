---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-05
sprint: SPR-11.5
delivered_by: ["1265ff1", "43e6eab", "7cf6aa6", "7bc8373"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F26: Sprint 11.5: Stabilization & Ranking Integrity (+ Ranking Strategy)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 11.5: Stabilization & Ranking Integrity especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

**Épico:** EP-05 (também EP-02).

## Functionalities
- Estratégias de ranking (Balanced, Spotify, BEA) atrás de uma interface única — *evidência:* ranking-strategy tasks §1 [x]; commit 7cf6aa6; RankingStrategy/BEARankingStrategy.js no código
- Seletor da fonte do ranking na tela de playlists, que alimenta o algoritmo — *evidência:* ranking-strategy tasks §3 [x]; commit 7cf6aa6
- Cada cartão de álbum mostra as faixas do próprio álbum (bug #71, sem mistura entre álbuns) — *evidência:* spec FR-001; commit 7bc8373 «fix rankings»
- O selo BestEver persiste ao recarregar (bestEverAlbumId guardado no álbum) — *evidência:* spec FR-002; commit 7bc8373 (AlbumRepository.js, albums.js)
- Barra de progresso embutida abaixo dos filtros e coluna de duração visível — *evidência:* ranking-strategy tasks §4–5 [x]; commit 7bc8373

## Sources
- `legacy/sprint11.5-stabilization-refactor--plan.md` (plan) ← `docs/archive/2025-12/sprint11.5-stabilization-refactor/plan.md` em `1265ff1`
- `legacy/plan_continuity.md` (plan) ← `docs/archive/2025-12/sprint11.5-stabilization-refactor/plan_continuity.md` em `1265ff1`
- `legacy/sprint11.5-stabilization-refactor--spec.md` (spec) ← `docs/archive/2025-12/sprint11.5-stabilization-refactor/spec.md` em `1265ff1`
- `legacy/sprint11.5-stabilization-refactor--tasks.md` (tasks) ← `docs/archive/2025-12/sprint11.5-stabilization-refactor/tasks.md` em `1265ff1`
- `legacy/ranking-strategy--plan.md` (plan) ← `docs/archive/2025-12/sprint9-10-combined/ranking-strategy/plan.md` em `43e6eab`
- `legacy/ranking-strategy--spec.md` (spec) ← `docs/archive/2025-12/sprint9-10-combined/ranking-strategy/spec.md` em `43e6eab`
- `legacy/ranking-strategy--tasks.md` (tasks) ← `docs/archive/2025-12/sprint9-10-combined/ranking-strategy/tasks.md` em `43e6eab`
