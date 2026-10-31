<!-- docs/specs/features/F18-phone-use/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F18: Usar o app no celular: menu em gaveta, faixas empilhadas e ordenação pelo toque · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
TopNav alterna o menu pela largura (abaixo de 768 px, gaveta); TracksTable renderiza as duas estruturas e alterna por classes responsivas; UserRankModal usa tela cheia por largura; SortableJS com espera no toque (spec do Sprint 21).

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-30) Fluxo: TopNav alterna o menu horizontal pela gaveta conforme a largura da janela.
  - Onde mora (origem da história): inventário do V1: T3, KB2 (`components/TopNav.js:92-147,258-308`); ROADMAP legado, Sprint 21 («Mobile Layout»).
  - Entregue em `9ebed2b` (2025-12-06, «feat(phase1): TopNav 5 items + nomenclature refactor»): `public/js/app.js`, `public/js/components/Icons.js`, `public/js/components/TopNav.js`, `public/js/stores/albumSeries.js`, `public/js/views/AlbumSeriesListView.js`, `public/js/views/AlbumsView.js`, `public/js/views/ConsolidatedRankingView.js`, `public/js/views/HomeView.js`, `public/js/views/PlaylistsView.js` (a gaveta à esquerda, com o fundo que escurece a tela, o ✕, o fechar ao tocar num link e a rolagem travada).
  - Entregue em `11747c3` (2025-12-09, «chore(release): Prepare v1.0.0 with UI standardization, mobile menu fixes, and album view refinements»): `public/index-v2.html`, `public/js/components/TopNav.js`, `public/js/views/AlbumsView.js` (a gaveta e o fundo só abaixo de 768 px, e fechar a gaveta ao ampliar a janela).
- [REQ-02] (S-31) Fluxo: TracksTable renderiza as duas estruturas (tabela e linhas empilhadas) e alterna por classes responsivas; TracksTabs oferece as três abas.
  - Onde mora (origem da história): inventário do V1: A17, M1, KB2 (`components/ranking/TracksTable.js:230-290`, `components/ranking/TracksTabs.js`); ROADMAP legado, Sprint 21 («touch-friendly tables»).
  - Entregue em `b9530f1` (2025-12-19, «feat(ranking): add Multi-Source Ranking UI components (Sprint 11 Phase 3)»): `public/js/components/ranking/TracksRankingComparison.js`, `public/js/components/ranking/TracksTable.js`, `public/js/components/ranking/TracksTabs.js`, `public/js/views/AlbumsView.js`, `public/js/views/albums/AlbumsGridRenderer.js` (as abas por fonte, que no celular trocam a tabela larga).
  - Entregue em `29b3f5e` (2026-01-14, «fix(series): resolved sorting issues and refined labels»): `public/js/components/ranking/TracksTable.js` (as linhas empilhadas do celular, escondidas a partir de 768 px) e os demais arquivos listados em REQ-03.
- [REQ-03] (S-32) Fluxo: UserRankModal aplica o modo de tela cheia pela largura da janela; o arrasto usa o SortableJS com espera no toque.
  - Onde mora (origem da história): inventário do V1: M3, KB2 (`components/ranking/UserRankModal.js:54-61`); ROADMAP legado, Sprint 21 («fullscreen modals»).
  - Entregue em `29b3f5e` (2026-01-14, «fix(series): resolved sorting issues and refined labels»): `public/css/animations.css`, `public/css/index.css`, `public/css/modals.css`, `public/css/views/home.css`, `public/js/components/ranking/TracksTable.js`, `public/js/components/ranking/UserRankModal.js`, `public/js/components/series/SeriesGridRenderer.js`, `public/js/components/series/SeriesToolbar.js`, `public/js/components/ui/LoadMoreButton.js` e mais 9.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
IntersectionObserver e SortableJS com espera no toque (spec arquivada do Sprint 21); nenhuma dependência nova de pacote.

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
O commit 6d79577, de fechamento da Sprint 21, mexe só em documentação e testes e por isso não é citado como entrega; o código do celular está em 9ebed2b, 11747c3, b9530f1 e 29b3f5e. A spec do Sprint 21 propôs 200 ms de espera no toque e o código atual usa 100 ms (behavior.md, playlists-track-dragged); vale o código.
