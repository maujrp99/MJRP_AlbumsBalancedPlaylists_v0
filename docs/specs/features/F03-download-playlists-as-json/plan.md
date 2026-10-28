<!-- docs/specs/features/F03-download-playlists-as-json/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F03: Baixar as playlists geradas num arquivo JSON · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
Fluxo curto no navegador: o quadro «Actions & Export» da tela de playlists chama o PlaylistsExport, que monta o JSON a partir da store de playlists e dispara o download. Sem servidor e sem Firestore.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-21) Fluxo: Quadro «Actions & Export» → PlaylistsExport monta o JSON a partir da store de playlists e dispara o download no navegador.
  - Onde mora (origem da história): inventário do V1: P15, E3 (`components/playlists/PlaylistsExport.js:33-58`); ROADMAP legado, Sprint 4.
  - Entregue em `c8be9fa` (2025-11-27, «feat(sprint4): complete playlist management, fix series mixing and rank display»): `public/js/api/client.js`, `public/js/cache/albumCache.js`, `public/js/components/Breadcrumb.js`, `public/js/stores/playlists.js`, `public/js/stores/series.js`, `public/js/views/AlbumsView.js`, `public/js/views/HomeView.js`, `public/js/views/PlaylistsView.js`, `public/js/views/RankingView.js` e mais 1.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Nenhuma.

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
Nenhum conhecido na documentação.
