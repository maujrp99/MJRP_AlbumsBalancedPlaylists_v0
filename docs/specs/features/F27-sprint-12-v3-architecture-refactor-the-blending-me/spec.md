---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-02
sprint: SPR-12
planned_for: "[[ROADMAP#^REL-30]]"
delivered_by: ["dfd10f0", "2905ffc", "804e63a", "d6775c3", "05957a2", "bb6a1f8"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F27: Sprint 12: V3 Architecture Refactor & The Blending Menu
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 12: Critical Fixes & Architecture Refactor especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-30 (Versão do produto v3.0.0 (sem tag)).

**Épico:** EP-02.

## Functionalities
- (refactor) SeriesView como orquestrador fino (389 linhas) com SeriesController e componentes de série — *evidência:* tasks.md §1, §3 [x]
- (refactor) Componente base e componentes compartilhados (grade, cartão de entidade, filtros, cabeçalho, arrastar e soltar, esqueleto, menu de contexto) — *evidência:* tasks.md §2 [x]
- (refactor) Componentes de inventário e playlists (InventoryGrid, PlaylistsDragBoard, PlaylistExportToolbar) — *evidência:* tasks.md §2 US4 [x]
- Blending Menu em /blend: assistente com cartões de receita, seletor de série e painel de ingredientes — *evidência:* blending-menu spec Fase 2 ✅; commits 2905ffc, 804e63a; BlendingMenuView.js no código
- Painel de ingredientes que muda conforme a receita (tipo de ranking, modo descoberta) — *evidência:* blending-menu spec Fase 3 ✅; commit d6775c3
- (refactor) Mixins de algoritmo (duração, balanceamento, enriquecimento de faixas) — *evidência:* blending-menu spec Fase 1A ✅ (14 testes); mixins/ no código
- Receitas Top-N (Top 3 e Top 5 por críticos ou por popularidade) — *evidência:* blending-menu spec Fase 1B ✅ (16 testes); TopN*Algorithm.js no código
- TopNav redesenhado: navegação por série e entrada do Blending Menu — *evidência:* topnav-redesign spec ✅ aprovada; commit 05957a2; roadmap «TopNav restoration»
- (refactor) Camada de serviços de playlists (geração e persistência) separada das views — *evidência:* playlists-refactor spec (12.5); commit bb6a1f8; PlaylistGenerationService.js e PlaylistPersistenceService.js

## Sources
- `legacy/AlgorithmsMenu.md` (other) ← `docs/archive/2025-12/sprint12-architecture-v3.0/blending-menu/AlgorithmsMenu.md` em `dfd10f0`
- `legacy/algorithm-analysis.md` (other) ← `docs/archive/2025-12/sprint12-architecture-v3.0/blending-menu/algorithm-analysis.md` em `dfd10f0`
- `legacy/background-enrichment-spec.md` (spec) ← `docs/archive/2025-12/sprint12-architecture-v3.0/blending-menu/background-enrichment-spec.md` em `dfd10f0`
- `legacy/blending-menu--plan.md` (plan) ← `docs/archive/2025-12/sprint12-architecture-v3.0/blending-menu/plan.md` em `dfd10f0`
- `legacy/blending-menu--spec.md` (spec) ← `docs/archive/2025-12/sprint12-architecture-v3.0/blending-menu/spec.md` em `dfd10f0`
- `legacy/blending-menu--tasks.md` (tasks) ← `docs/archive/2025-12/sprint12-architecture-v3.0/blending-menu/tasks.md` em `dfd10f0`
- `legacy/code-review.md` (other) ← `docs/archive/2025-12/sprint12-architecture-v3.0/code-review.md` em `dfd10f0`
- `legacy/sprint12-architecture-v3.0--plan.md` (plan) ← `docs/archive/2025-12/sprint12-architecture-v3.0/plan.md` em `dfd10f0`
- `legacy/architecture-analysis.md` (other) ← `docs/archive/2025-12/sprint12-architecture-v3.0/playlists-refactor/architecture-analysis.md` em `dfd10f0`
- `legacy/data-schema-refactor--architecture-analysis.md` (other) ← `docs/archive/2025-12/sprint12-architecture-v3.0/playlists-refactor/data-schema-refactor/architecture-analysis.md` em `dfd10f0`
- `legacy/data-schema-refactor--plan.md` (plan) ← `docs/archive/2025-12/sprint12-architecture-v3.0/playlists-refactor/data-schema-refactor/plan.md` em `dfd10f0`
- `legacy/data-schema-refactor--spec.md` (spec) ← `docs/archive/2025-12/sprint12-architecture-v3.0/playlists-refactor/data-schema-refactor/spec.md` em `dfd10f0`
- `legacy/data-schema-refactor--tasks.md` (tasks) ← `docs/archive/2025-12/sprint12-architecture-v3.0/playlists-refactor/data-schema-refactor/tasks.md` em `dfd10f0`
- `legacy/playlists-refactor--plan.md` (plan) ← `docs/archive/2025-12/sprint12-architecture-v3.0/playlists-refactor/plan.md` em `dfd10f0`
- `legacy/playlists-refactor--spec.md` (spec) ← `docs/archive/2025-12/sprint12-architecture-v3.0/playlists-refactor/spec.md` em `dfd10f0`
- `legacy/playlists-refactor--tasks.md` (tasks) ← `docs/archive/2025-12/sprint12-architecture-v3.0/playlists-refactor/tasks.md` em `dfd10f0`
- `legacy/sprint12-architecture-v3.0--spec.md` (spec) ← `docs/archive/2025-12/sprint12-architecture-v3.0/spec.md` em `dfd10f0`
- `legacy/sprint12-architecture-v3.0--tasks.md` (tasks) ← `docs/archive/2025-12/sprint12-architecture-v3.0/tasks.md` em `dfd10f0`
- `legacy/topnav-redesign--plan.md` (plan) ← `docs/archive/2025-12/sprint12-architecture-v3.0/topnav-redesign/plan.md` em `dfd10f0`
- `legacy/topnav-redesign--spec.md` (spec) ← `docs/archive/2025-12/sprint12-architecture-v3.0/topnav-redesign/spec.md` em `dfd10f0`
