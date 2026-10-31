<!-- docs/specs/features/F09-edit-and-delete-saved-batches/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F09: Editar um lote de playlists guardado e excluir lotes ou todas as playlists de uma série · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
Rota /playlists/edit → EditPlaylistView carrega o lote do Firestore, e não do localStorage, para evitar as playlists fantasma; guarda por nome do lote (apaga o antigo e grava o novo). A exclusão fica nas ações da tela de playlists guardadas.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-19) Fluxo: Rota /playlists/edit → EditPlaylistView carrega o lote do Firestore (não do localStorage) → a pessoa edita → guardar apaga o lote antigo e grava o novo pelo nome do lote.
  - Onde mora (origem da história): inventário do V1: P1, P5, P14 (`controllers/PlaylistsController.js:26-117`, `views/PlaylistsView.js:266-312`); ROADMAP legado, Sprint 9+10 («EditPlaylistView»).
  - Entregue em `f1b3d46` (2025-12-18, «feat(playlists): add EditPlaylistView to fix #54 and #55 - Created EditPlaylistView.js (4…»): `public/js/app.js`, `public/js/views/EditPlaylistView.js`, `public/js/views/SavedPlaylistsView.js`.
- [REQ-02] (S-20) Fluxo: SavedPlaylistActions pede a confirmação → SavedPlaylistsController apaga as playlists do lote ou da série → a lista se redesenha.
  - Onde mora (origem da história): inventário do V1: S5, S6 (`components/playlists/SavedPlaylistActions.js:22-41`, `components/playlists/SavedPlaylistsController.js:183-253`); histórico do git (e057cfe).
  - Entregue em `e057cfe` (2025-12-16, «fix: Delete All Playlists now keeps series - only deletes playlists»): `public/js/views/SavedPlaylistsView.js`.

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
Guardar uma edição apaga o lote antigo e grava o novo, pelo nome do lote (comportamento do código, behavior.md, playlists-edit-mode). O lote é só um nome repetido em cada playlist (data-model.md).
