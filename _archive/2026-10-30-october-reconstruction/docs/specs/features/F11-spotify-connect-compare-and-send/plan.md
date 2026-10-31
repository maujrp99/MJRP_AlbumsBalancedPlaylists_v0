<!-- docs/specs/features/F11-spotify-connect-compare-and-send/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F11: Conectar o Spotify, comparar a nota da crítica com a popularidade e enviar as playlists · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
SpotifyAuthService (OAuth com PKCE, token no localStorage) → SpotifyService/SpotifyEnrichmentService buscam a popularidade e a guardam num cache global no Firestore (spotify_enrichment) → TracksRankingComparison e TracksTabs mostram as duas fontes → SpotifyExportModal/SpotifyExportService criam as playlists.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-23) Fluxo: SpotifyConnectButton → SpotifyAuthService (OAuth com PKCE) → o token vai para o localStorage → ao voltar da autorização o app avisa o resultado.
  - Onde mora (origem da história): inventário do V1: L6, C1 (`services/SpotifyAuthService.js:21-283`, `components/SpotifyConnectButton.js:37-97`); ROADMAP legado, Sprint 11 («Spotify OAuth Integration»).
  - Entregue em `4ac955d` (2025-12-19, «feat(spotify): add Spotify OAuth and Service integration (Sprint 11 Phase 1-2)»): `public/js/app.js`, `public/js/components/Icons.js`, `public/js/components/SpotifyConnectButton.js`, `public/js/components/TopNav.js`, `public/js/router.js`, `public/js/services/SpotifyAuthService.js`, `public/js/services/SpotifyService.js`.
- [REQ-02] (S-24) Fluxo: SpotifyExportModal → SpotifyExportService procura as faixas (com correspondência aproximada), cria a playlist e acrescenta as faixas pela API do Spotify.
  - Onde mora (origem da história): inventário do V1: X1 a X5, E1 (`components/SpotifyExportModal.js`, `services/SpotifyExportService.js`); ROADMAP legado, Sprint 11 («Export to Spotify»). O botão «Open in Spotify» no modo separado não faz nada e está em outra story.
  - Entregue em `6013d87` (2025-12-19, «Sprint 11: Spotify auto-enrichment + fuzzy matching + view toggle fix»): `public/js/api/client.js`, `public/js/components/SpotifyExportModal.js`, `public/js/services/SpotifyService.js`, `public/js/views/AlbumsView.js`, `public/js/views/EditPlaylistView.js`, `public/js/views/PlaylistsView.js`, `public/js/views/playlists/PlaylistsExport.js`.
  - Entregue em `2336104` (2025-12-20, «Fix(UI/Playlist): Fix Playlist Generation ignoring Spotify Popularity & Fix Loading Bar UI»): `public/js/algorithms/LegacyRoundRobinAlgorithm.js`, `public/js/components/InlineProgress.js`, `public/js/components/SpotifyExportModal.js`, `public/js/components/ranking/TracksTable.js`, `public/js/views/AlbumsView.js`, `public/js/views/PlaylistsView.js`.
- [REQ-03] (S-26) Fluxo: SpotifyEnrichmentService busca a popularidade e a guarda (cache global no Firestore) → TracksRankingComparison e TracksTabs mostram as duas fontes lado a lado.
  - Onde mora (origem da história): inventário do V1: M1, M2, K3, L8 (`components/ranking/TracksRankingComparison.js:117-260`, `services/SpotifyEnrichmentService.js`); ROADMAP legado, Sprint 11 («Multi-Source Ranking UI»).
  - Entregue em `b9530f1` (2025-12-19, «feat(ranking): add Multi-Source Ranking UI components (Sprint 11 Phase 3)»): `public/js/components/ranking/TracksRankingComparison.js`, `public/js/components/ranking/TracksTable.js`, `public/js/components/ranking/TracksTabs.js`, `public/js/views/AlbumsView.js`, `public/js/views/albums/AlbumsGridRenderer.js`.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Spotify Web API com OAuth PKCE, citado no ROADMAP legado (Sprint 11).

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
O token do Spotify fica no localStorage do navegador (arch.md); a coleção spotify_enrichment do Firestore é aberta a qualquer autenticado, inclusive anônimo (arch.md, quadro de regras), risco registrado fora desta feature.
