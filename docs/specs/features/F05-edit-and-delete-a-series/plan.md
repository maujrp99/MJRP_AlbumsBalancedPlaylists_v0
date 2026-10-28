<!-- docs/specs/features/F05-edit-and-delete-a-series/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F05: Editar uma série (nome e álbuns) e excluí-la sem apagar os álbuns do inventário · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
Camadas do arch.md: janela de edição e de exclusão (componentes da série) → SeriesEventHandler/SeriesService → store e repositório da série. A edição acrescenta álbuns pela mesma busca de artista da tela inicial (MusicKitSearchAdapter, Autocomplete).

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-06) Fluxo: Janela de editar série (SeriesEditModal) → SeriesEventHandler chama o SeriesService → a store e o repositório atualizam a série → a grade se redesenha sem recarregar.
  - Onde mora (origem da história): inventário do V1: A10, A12, A14 (`components/series/SeriesEditModal.js:10-221`, `controllers/SeriesEventHandler.js:205-306`); ROADMAP legado, Sprint 15 («Edit Modal Refactor: Artist scan») e Sprint 21.5 (remoção sem piscar).
  - Entregue em `19d38c1` (2025-12-07, «feat(album-series): enhanced Edit modal with album list management»): `public/js/views/AlbumSeriesListView.js`.
  - Entregue em `b3b9f32` (2025-12-31, «feat(Sprint15-Phase6): Lazy authorize + browser locale storefront + Edit modal artist scan»): `public/js/components/Autocomplete.js`, `public/js/components/series/SeriesModals.js`, `public/js/services/MusicKitSearchAdapter.js`, `public/js/services/MusicKitService.js`, `public/js/stores/albumSeries.js`, `public/js/views/playlists/PlaylistsExport.js`.
- [REQ-02] (S-07) Fluxo: SeriesModals pede a confirmação (DialogService) → SeriesService/repositório apagam a série → a tela volta a /albums.
  - Onde mora (origem da história): inventário do V1: A10, A11 (`components/series/SeriesModals.js:55-85`); ROADMAP legado, Sprint 5.
  - Entregue em `b85f473` (2025-12-03, «feat: implement persistence and series management UI»): `public/js/app.js`, `public/js/components/Icons.js`, `public/js/components/TopNav.js`, `public/js/repositories/BaseRepository.js`, `public/js/stores/albums.js`, `public/js/stores/playlists.js`, `public/js/stores/series.js`, `public/js/views/AlbumsView.js`, `public/js/views/HomeView.js` e mais 3.

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
data-model.md: o array albumQueries inteiro é regravado a cada inclusão de álbum (SeriesService.js:176-180); duas edições quase simultâneas podem se sobrepor. Registrado nos documentos canônicos, fora desta feature.
