<!-- docs/specs/features/F12-build-a-series-from-an-artist-or-a-list/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F12: Montar uma série procurando um artista ou colando uma lista de álbuns · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
HomeView → SearchController e HomeController → AlbumSearchService (busca no catálogo do Apple Music, módulo independente) com AlbumTypeClassifier (cadeia de estratégias por palavra do título, lista de IA e metadado do Apple); DiscographyRenderer e StagingAreaRenderer desenham a grade e a área de montagem, que se reordena arrastando.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-02) Fluxo: SearchController consulta o catálogo do Apple Music pelo AlbumSearchService → o AlbumTypeClassifier classifica cada álbum → DiscographyRenderer desenha a grade e a área de montagem recebe os álbuns escolhidos.
  - Onde mora (origem da história): inventário do V1: H2, H4, H5, H6, H7, H9 (`components/home/SearchController.js:20-169`, `services/album-search/AlbumTypeClassifier.js:19-60`); ROADMAP legado, Sprint 14 («Split-Panel Staging Area & Search») e Sprint 17.75 (classificação por tipo).
  - Entregue em `4c62a82` (2025-12-28, «feat(HomeView V3): Major UX fixes and full Initialize Load implementation»): `public/css/neon.css`, `public/js/components/home/SearchController.js`, `public/js/components/home/StagingAreaController.js`, `public/js/controllers/HomeController.js`, `public/js/services/album-search/AlbumSearchService.js`, `public/js/views/HomeView.js`, `public/js/views/albums/AlbumsScopedRenderer.js`, `public/js/views/renderers/DiscographyRenderer.js`, `public/js/views/renderers/StagingAreaRenderer.js`.
- [REQ-02] (S-03) Fluxo: HomeController lê a caixa de texto linha a linha → AlbumSearchService procura cada par → os achados entram na área de montagem.
  - Onde mora (origem da história): inventário do V1: H3, H10 (`controllers/HomeController.js:76-217`); ROADMAP legado, Sprint 14. O caso de caixa vazia falha (H10, linha 132) e está na lista de conserto, não aqui.
  - Entregue em `cd4dc21` (2025-12-27, «feat(arch-11): Refine HomeView V3 and Plan Phase 2»): `public/js/components/home/SearchController.js`, `public/js/components/home/StagingAreaController.js`, `public/js/controllers/HomeController.js`, `public/js/services/MusicKitService.js`, `public/js/views/BaseView.js`, `public/js/views/HomeView.js`, `public/js/views/renderers/DiscographyRenderer.js`, `public/js/views/renderers/StagingAreaRenderer.js`.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Nenhuma nova nomeada pelos commits; usa o catálogo do Apple Music pelo MusicKit já entregue.

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
A classificação de álbuns por tipo é heurística (estratégias de título, lista de IA e metadado), então um álbum pode cair em «?» (não classificado); está no behavior.md, home-discography-type-filters.
