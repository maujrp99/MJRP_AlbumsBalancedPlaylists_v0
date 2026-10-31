---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-05
sprint: SPR-11
planned_for: "[[ROADMAP#^REL-29]]"
delivered_by: ["1265ff1", "4ac955d", "b355d29", "6013d87", "b62bc48", "2276044", "b9530f1"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F25: Sprint 11: Spotify Integration & Multi-Source Ranking
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 11: Spotify Integration & Documentation especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-29 (Versão do produto v2.11.0 (sem tag)).

**Épico:** EP-05 (também EP-04).

## Functionalities
- Conectar a conta do Spotify (OAuth PKCE) com renovação automática do token — *evidência:* tasks.md Fase 1 [x]; commit 4ac955d; SpotifyAuthService.js
- Popularidade do Spotify (0–100) por faixa, buscada e guardada — *evidência:* tasks.md Fase 2 [x]; commit b355d29; SpotifyEnrichmentService.js
- Enriquecimento automático em segundo plano com correspondência aproximada — *evidência:* commits 6013d87, b62bc48, 2276044
- Ranking multi-fonte: BestEver, Spotify, ordem original, com a origem de cada ranking — *evidência:* FR-3; commit b355d29; roadmap «Spotify Data Enrichment»
- Comparar nota da crítica × popularidade: colunas, médias, cabeçalhos que ordenam e links BEA/Spotify (TracksRankingComparison) — *evidência:* FR-3.5, FR-4; commit b9530f1; roadmap «Multi-Source Ranking UI»
- Exportar as playlists para o Spotify: busca as faixas, cria a playlist, adiciona e avisa as não encontradas — *evidência:* FR-6; roadmap «Export to Spotify»; SpotifyExportService.js

## Sources
- `legacy/documentation_plan.md` (plan) ← `docs/archive/2025-12/sprint11-spotify-integration/documentation_plan.md` em `1265ff1`
- `legacy/sprint11-spotify-integration--plan.md` (plan) ← `docs/archive/2025-12/sprint11-spotify-integration/plan.md` em `1265ff1`
- `legacy/sprint11-spotify-integration--spec.md` (spec) ← `docs/archive/2025-12/sprint11-spotify-integration/spec.md` em `1265ff1`
- `legacy/sprint11-spotify-integration--tasks.md` (tasks) ← `docs/archive/2025-12/sprint11-spotify-integration/tasks.md` em `1265ff1`
