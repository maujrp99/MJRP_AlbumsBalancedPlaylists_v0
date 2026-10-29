<!-- docs/specs/features/F02-generate-and-reorder-playlists/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F02: Gerar playlists equilibradas a partir de uma série e reorganizá-las arrastando as faixas · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
Fluxo do arch.md: View (PlaylistsView) → Controller → algoritmo de curadoria no navegador (registro em algorithms/index.js) → store de playlists → grade. O estado das playlists fica na store e o rascunho no localStorage. As três histórias saíram no mesmo commit, por isso as tasks abaixo dividem por história e citam o mesmo commit.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-09) Fluxo: PlaylistsController chama o gerador (algoritmo de cascata balanceada sobre a ordem de aclamação das faixas) → a store de playlists recebe o resultado → a tela de playlists desenha a grade.
  - Onde mora (origem da história): inventário do V1: P2, P3, P20, K1 (`controllers/PlaylistsController.js:228-268`, `ranking/BalancedRankingStrategy.js:100-185`); ROADMAP legado, Sprint 4 («Core playlist generation»).
  - Entregue em `c8be9fa` (2025-11-27, «feat(sprint4): complete playlist management, fix series mixing and rank display»): `public/js/api/client.js`, `public/js/cache/albumCache.js`, `public/js/components/Breadcrumb.js`, `public/js/stores/playlists.js`, `public/js/stores/series.js`, `public/js/views/AlbumsView.js`, `public/js/views/HomeView.js`, `public/js/views/PlaylistsView.js`, `public/js/views/RankingView.js` e mais 1.
- [REQ-02] (S-14) Fluxo: Store de playlists → PlaylistGrid/PlaylistCard e TrackRow desenham título, contagem, duração em mm:ss e os selos de posição.
  - Onde mora (origem da história): inventário do V1: P8, P9 (`components/playlists/PlaylistGrid.js:28-139`, `components/ui/TrackRow.js:34-211`); ROADMAP legado, Sprint 3 («Playlists view») e Sprint 4.
  - Entregue em `c8be9fa` (2025-11-27, «feat(sprint4): complete playlist management, fix series mixing and rank display»): `public/js/api/client.js`, `public/js/cache/albumCache.js`, `public/js/components/Breadcrumb.js`, `public/js/stores/playlists.js`, `public/js/stores/series.js`, `public/js/views/AlbumsView.js`, `public/js/views/HomeView.js`, `public/js/views/PlaylistsView.js`, `public/js/views/RankingView.js` e mais 1.
- [REQ-03] (S-15) Fluxo: PlaylistsDragHandler (SortableJS) → PlaylistsService.moveTrack grava um retrato do estado anterior → a store de playlists atualiza e a tela redesenha.
  - Onde mora (origem da história): inventário do V1: P10, P12, DD3 (`components/playlists/PlaylistsDragHandler.js:31-71`, `views/PlaylistsView.js:83-94`); ROADMAP legado, Sprint 4 («Drag-and-drop with Sortable.js»). Desfazer e refazer não têm botão e estão em outra story.
  - Entregue em `c8be9fa` (2025-11-27, «feat(sprint4): complete playlist management, fix series mixing and rank display»): `public/js/api/client.js`, `public/js/cache/albumCache.js`, `public/js/components/Breadcrumb.js`, `public/js/stores/playlists.js`, `public/js/stores/series.js`, `public/js/views/AlbumsView.js`, `public/js/views/HomeView.js`, `public/js/views/PlaylistsView.js`, `public/js/views/RankingView.js` e mais 1.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
SortableJS (arrastar e soltar), citado no ROADMAP legado, Sprint 4; nenhuma outra dependência nova.

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
O rascunho das playlists geradas fica só no localStorage e se perde ao recarregar (item que não funciona hoje, fora desta feature). Sem nota nenhuma nos álbuns o ranking equilibrado fica sem base; o app pergunta antes de continuar (behavior.md, playlists-no-ratings-confirm).
