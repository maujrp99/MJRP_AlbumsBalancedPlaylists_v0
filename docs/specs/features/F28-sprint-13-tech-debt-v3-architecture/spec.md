---
status: Accepted
lane: standard
solution_type: feature
imports: []
sprint: SPR-13
planned_for: "[[ROADMAP#^REL-31]]"
delivered_by: ["dfd10f0", "56bc737", "4a337bd", "614792a"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F28: Sprint 13: Tech Debt & V3 Architecture
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 13: Tech Debt & V3 Architecture especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-31 (Versão do produto v3.1.0 (sem tag)).

## Functionalities
- (refactor) CRIT-1: salvar o lote de playlists de forma atômica (runBatchSave) — *evidência:* spec ✅ IMPLEMENTED; snapshot [x]
- (refactor) CRIT-2: eliminar o innerHTML com dado do usuário (XSS) — *evidência:* spec ✅ IMPLEMENTED; snapshot [x]
- (refactor) ARCH-1: decompor a PlaylistsView (Controller, GridRenderer, DragHandler) — *evidência:* spec ✅ IMPLEMENTED; snapshot [x]; commit 614792a
- (refactor) ARCH-2: SpotifyEnrichmentRepository no padrão BaseRepository — *evidência:* roadmap Sprint 13; SpotifyEnrichmentRepository.js no código
- (refactor) ARCH-3: BaseCard para reuso de cartões — *evidência:* roadmap Sprint 13
- (refactor) ARCH-5 e DEBT-2: cache consolidado, AlbumCache para IndexedDB pelo CacheManager — *evidência:* roadmap Sprint 13; CacheManager.js no código
- (refactor) ARCH-6: carregamento incremental da SeriesView — *evidência:* roadmap Sprint 13
- (refactor) CRIT-5: corrigir o pipeline de dados do álbum (álbuns errados ao editar uma série) — *evidência:* roadmap «CRIT-1 to CRIT-5: album pipeline fixes»
- Correções #92 (cache/exibição do álbum), #93 (painel Reconfigurar) e #94 (barra de progresso) — *evidência:* roadmap Sprint 13 «Issues #92, #93, #94»

## Sources
- `legacy/CACHE_ARCHITECTURE.md` (other) ← `docs/archive/2025-12/sprint13-tech-debt/CACHE_ARCHITECTURE.md` em `dfd10f0`
- `legacy/TECHNICAL_DEBT_BACKLOG.md` (other) ← `docs/archive/2025-12/sprint13-tech-debt/TECHNICAL_DEBT_BACKLOG.md` em `dfd10f0`
- `legacy/album-data-pipeline-analysis.md` (other) ← `docs/archive/2025-12/sprint13-tech-debt/album-data-pipeline-analysis.md` em `dfd10f0`
- `legacy/arch-1-playlistsview_plan_snapshot.md` (plan) ← `docs/archive/2025-12/sprint13-tech-debt/arch-1-playlistsview_plan_snapshot.md` em `dfd10f0`
- `legacy/arch-1-playlistsview_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/arch-1-playlistsview_spec.md` em `dfd10f0`
- `legacy/arch-2-standardize-stores_plan.md` (plan) ← `docs/archive/2025-12/sprint13-tech-debt/arch-2-standardize-stores_plan.md` em `dfd10f0`
- `legacy/arch-2-standardize-stores_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/arch-2-standardize-stores_spec.md` em `dfd10f0`
- `legacy/arch-3-basecard_plan.md` (plan) ← `docs/archive/2025-12/sprint13-tech-debt/arch-3-basecard_plan.md` em `dfd10f0`
- `legacy/arch-3-basecard_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/arch-3-basecard_spec.md` em `dfd10f0`
- `legacy/arch-4-album-search-modularization_spec.md` (spec) ← `docs/technical/specs/sprint13-tech-debt/arch-4-album-search-modularization_spec.md` em `56bc737`
- `legacy/arch-5-cache-consolidation_plan.md` (plan) ← `docs/archive/2025-12/sprint13-tech-debt/arch-5-cache-consolidation_plan.md` em `dfd10f0`
- `legacy/arch-5-cache-consolidation_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/arch-5-cache-consolidation_spec.md` em `dfd10f0`
- `legacy/arch-6-series-loading-optimization_plan.md` (plan) ← `docs/archive/2025-12/sprint13-tech-debt/arch-6-series-loading-optimization_plan.md` em `dfd10f0`
- `legacy/arch-6-series-loading-optimization_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/arch-6-series-loading-optimization_spec.md` em `dfd10f0`
- `legacy/codebase_analysis.md` (other) ← `docs/archive/2025-12/sprint13-tech-debt/codebase_analysis.md` em `dfd10f0`
- `legacy/complementary_analyisi.md` (other) ← `docs/technical/specs/sprint13-tech-debt/complementary_analyisi.md` em `4a337bd`
- `legacy/complementary_analyisis2.md` (other) ← `docs/archive/2025-12/sprint13-tech-debt/complementary_analyisis2.md` em `dfd10f0`
- `legacy/complementary_analysis.md` (other) ← `docs/archive/2025-12/sprint13-tech-debt/complementary_analysis.md` em `dfd10f0`
- `legacy/crit-1-atomic-saves_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/crit-1-atomic-saves_spec.md` em `dfd10f0`
- `legacy/crit-2-innerhtml_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/crit-2-innerhtml_spec.md` em `dfd10f0`
- `legacy/crit-5-album-pipeline_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/crit-5-album-pipeline_spec.md` em `dfd10f0`
- `legacy/debt-2-indexeddb_spec.md` (spec) ← `docs/archive/2025-12/sprint13-tech-debt/debt-2-indexeddb_spec.md` em `dfd10f0`
- `legacy/session_summary_2025_12_25.md` (other) ← `docs/archive/2025-12/sprint13-tech-debt/session_summary_2025_12_25.md` em `dfd10f0`
- `legacy/task_snapshot_2025_12_25.md` (tasks) ← `docs/archive/2025-12/sprint13-tech-debt/task_snapshot_2025_12_25.md` em `dfd10f0`
