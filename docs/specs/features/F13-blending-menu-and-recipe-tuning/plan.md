<!-- docs/specs/features/F13-blending-menu-and-recipe-tuning/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F13: Montar a mistura em passos, ajustar a receita, dar nome ao lote e gerar de novo sem sair da tela · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
BlendingMenuView → BlendSeriesSelector, BlendRecipeCard e BlendIngredientsPanel → BlendingController e PlaylistGenerationService → algoritmos Top N e cascata; o RegeneratePanel da tela de playlists reaproveita os mesmos componentes. A palavra «flavor» virou «recipe» no Sprint 17.9 (ADR-0015).

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-11) Fluxo: BlendingMenuView → BlendSeriesSelector, BlendRecipeCard e BlendIngredientsPanel → BlendingController gera pelo PlaylistGenerationService e entrega ao PlaylistsView.
  - Onde mora (origem da história): inventário do V1: B1, B2, B4, B7, B8 (`views/BlendingMenuView.js:44-446`, `controllers/BlendingController.js:51-208`); ROADMAP legado, Sprint 7 («Rebrand: The Album Blender») e Sprint 15.5.
  - Entregue em `e8ebe0b` (2025-12-23, «docs: Add comprehensive project summary, roadmap, product vision, and temporary debug logs»): `public/js/algorithms/LegacyRoundRobinAlgorithm.js`, `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js`, `public/js/algorithms/MJRPBalancedCascadeV0Algorithm.js`, `public/js/algorithms/SDraftOriginalAlgorithm.js`, `public/js/algorithms/Top3AcclaimedAlgorithm.js`, `public/js/algorithms/Top3PopularAlgorithm.js`, `public/js/algorithms/Top5AcclaimedAlgorithm.js`, `public/js/algorithms/Top5PopularAlgorithm.js`, `public/js/algorithms/TopNAlgorithm.js` e mais 10.
  - Entregue em `9d53fdf` (2025-12-31, «feat(v3.16): Sprint 15.5 Prod Polish - Blending Menu UI & AlbumSeries Store Fix»): `public/js/algorithms/Top3AcclaimedAlgorithm.js`, `public/js/algorithms/Top3PopularAlgorithm.js`, `public/js/algorithms/Top5AcclaimedAlgorithm.js`, `public/js/algorithms/Top5PopularAlgorithm.js`, `public/js/components/blend/BlendIngredientsPanel.js`, `public/js/components/blend/BlendSeriesSelector.js`, `public/js/components/ui/TrackRow.js`, `public/js/services/PlaylistGenerationService.js`, `public/js/stores/albumSeries.js` e mais 3.
- [REQ-02] (S-12) Fluxo: BlendIngredientsPanel mostra só os controles que a receita usa → getConfig normaliza a escolha → TopNAlgorithm aplica quantidade, agrupamento e duração.
  - Onde mora (origem da história): inventário do V1: B5, P20 e seção 3.1 (`components/blend/BlendIngredientsPanel.js:16-347`, `algorithms/TopNAlgorithm.js:52-277`); ROADMAP legado, Sprint 15.5 («Algorithm Renaming», «Grouping Tracks»). O «Discovery Mode» não tem efeito (B6) e está em outra story.
  - Entregue em `ab4bbb6` (2026-01-02, «fix(sprint15.5): Apple Music Export, Index Duplication, Batch Name Input, Grouping Strate…»): `public/js/algorithms/TopNAlgorithm.js`, `public/js/components/blend/BlendIngredientsPanel.js`, `public/js/components/playlists/PlaylistGrid.js`, `public/js/components/playlists/RegeneratePanel.js`, `public/js/controllers/BlendingController.js`, `public/js/services/PlaylistGenerationService.js`, `public/js/stores/playlists.js`, `public/js/views/PlaylistsView.js`, `public/js/views/playlists/PlaylistsExport.js`.
  - Entregue em `a86877a` (2026-01-02, «v3.15.5: Sprint 15.5 Prod Polish - Algorithm Renaming, UI Fixes, Grouping Logic»): `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js`, `public/js/algorithms/Top3AcclaimedAlgorithm.js`, `public/js/algorithms/Top3PopularAlgorithm.js`, `public/js/algorithms/Top5AcclaimedAlgorithm.js`, `public/js/algorithms/Top5PopularAlgorithm.js`, `public/js/algorithms/TopNAlgorithm.js`, `public/js/algorithms/index.js`, `public/js/components/blend/BlendIngredientsPanel.js`, `public/js/components/ranking/TracksTable.js` e mais 4.
- [REQ-03] (S-13) Fluxo: RegeneratePanel reaproveita o seletor de receitas e os ingredientes → PlaylistsController regenera sobre os álbuns já carregados.
  - Onde mora (origem da história): inventário do V1: P7 (`components/playlists/RegeneratePanel.js:35-151`); ROADMAP legado, Sprint 13 («Issues #92, #93, #94: reconfigure panel»).
  - Entregue em `333e72b` (2025-12-23, «feat: create playlist UI components (Phase 2)»): `public/js/components/playlists/BatchGroupCard.js`, `public/js/components/playlists/PlaylistCard.js`, `public/js/components/playlists/PlaylistGrid.js`, `public/js/components/playlists/RegeneratePanel.js`, `public/js/components/playlists/TrackItem.js`, `public/js/components/playlists/index.js`.
- [REQ-04] (S-17) Fluxo: Campo de nome do lote (PlaylistsGridRenderer) → store de playlists guarda o nome → PlaylistGrid e PlaylistsExport o usam nos títulos.
  - Onde mora (origem da história): inventário do V1: P6 (`components/playlists/PlaylistsGridRenderer.js:89-104`, `components/playlists/PlaylistGrid.js:55-62`); ROADMAP legado, Sprint 16 («Batch Naming Integration»).
  - Entregue em `d3ed5e1` (2026-01-02, «feat: Batch Naming integration (Sprint 15.5)»): `public/js/components/playlists/PlaylistCard.js`, `public/js/components/playlists/PlaylistGrid.js`, `public/js/components/playlists/PlaylistsGridRenderer.js`, `public/js/stores/playlists.js`, `public/js/views/PlaylistsView.js`, `public/js/views/playlists/PlaylistsExport.js`.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Nenhuma nova.

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
O menu de mistura aceita só «Albums»; Artists, Genres e Tracks aparecem desligados com «(Coming Soon)» (behavior.md, blend-series-choice). O commit e8ebe0b tem título de documentação, mas traz o menu de mistura inteiro (BlendingMenuView, componentes e algoritmos).
