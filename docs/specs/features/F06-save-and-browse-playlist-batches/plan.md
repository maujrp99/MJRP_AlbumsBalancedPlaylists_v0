<!-- docs/specs/features/F06-save-and-browse-playlist-batches/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F06: Guardar as playlists geradas num lote na nuvem e consultá-las depois, por série e por lote · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
Camadas do arch.md: PlaylistsController → PlaylistsService grava as playlists no Firestore em artifacts/mjrp-albums/users/{uid}/curator/data/series/{seriesId}/playlists; SavedPlaylistsView/SavedPlaylistsController leem as playlists de todas as séries e agrupam por série e lote. Não existe documento de lote: o lote é o campo batchName repetido em cada playlist (data-model.md).

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-16) Fluxo: PlaylistsController.save → PlaylistsService grava cada playlist com o nome do lote sob a série no Firestore → a store entra no modo de edição.
  - Onde mora (origem da história): inventário do V1: P14 (`controllers/PlaylistsController.js:273-387`); ROADMAP legado, Sprint 5 («Firestore Persistence: Cloud sync for Albums, Series, and Playlists»).
  - Entregue em `b6034b6` (2025-12-07, «fix(persistence): resolve permissions error and router bugs»): `public/css/modals.css`, `public/js/router.js`, `public/js/stores/playlists.js`, `public/js/views/PlaylistsView.js`.
- [REQ-02] (S-18) Fluxo: SavedPlaylistsView/SavedPlaylistsController leem as playlists de todas as séries → agrupam por série e lote → cartão do lote, linha de playlist e janela de detalhes.
  - Onde mora (origem da história): inventário do V1: S1 a S9 (`views/SavedPlaylistsView.js`, `components/playlists/Saved*`, `components/playlists/PlaylistDetailsModal.js`); ROADMAP legado, Sprint 5 e Sprint 22 (filtros e ordenação).
  - Entregue em `3919f18` (2025-12-06, «WIP: Ghost Albums debugging (4 failed attempts) + SavedPlaylistsView + UI fixes»): `public/assets/data/albums.csv`, `public/js/app.js`, `public/js/components/Autocomplete.js`, `public/js/components/Icons.js`, `public/js/components/TopNav.js`, `public/js/repositories/BaseRepository.js`, `public/js/services/AlbumLoader.js`, `public/js/stores/albums.js`, `public/js/stores/playlists.js` e mais 7.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Nenhuma nova (Firestore já entregue em F04).

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
data-model.md: o lote é só um nome repetido em cada playlist, então renomear ou apagar um lote mexe em vários documentos. PlaylistsService.saveBatch usa o SDK do Firestore fora do repositório (arch.md, achado 1 da auditoria). O commit 3919f18 traz «WIP» no título e foi o que o nó citou como entrega de S-18.
