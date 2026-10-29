<!-- docs/specs/features/F07-album-inventory/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F07: Manter a coleção de álbuns: ver o que tenho, registrar, marcar a situação e buscar · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
Camadas do arch.md: InventoryView → InventoryController/InventoryStore → InventoryRepository (Firestore, sob artifacts/mjrp-albums/users/{uid}/inventory). A store faz I/O e importa o db: desvio da regra da ADR-0017, registrado no arch.md (achado 5 da auditoria).

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-33) Fluxo: InventoryView → InventoryController e InventoryStore leem os itens pelo InventoryRepository → cabeçalho com os totais e cartões dos itens.
  - Onde mora (origem da história): inventário do V1: I1, I2, I4, I5, I6 (`views/InventoryView.js:57-223`, `controllers/InventoryController.js:186-257`); ROADMAP legado, Sprint 5 («Inventory CRUD»).
  - Entregue em `bf561e0` (2025-11-28, «Sprint 5.3 Partial: InventoryView + InventoryStore»): `public/assets/images/newMJRPlogo.png`, `public/assets/images/newMJRPlogorealistic.png`, `public/js/stores/inventory.js`, `public/js/views/InventoryView.js`.
  - Entregue em `165c055` (2025-12-09, «fix(inventory): Loop fix, header UI simplification, owned dropdown»): `public/js/views/InventoryView.js`.
- [REQ-02] (S-34) Fluxo: Botão «+» do cartão → janela de registro → InventoryStore.addAlbum → InventoryRepository grava sob o uid.
  - Onde mora (origem da história): inventário do V1: A15, I9, I10 (`components/InventoryAddModal.js:15-160`, `repositories/InventoryRepository.js:41-65`); ROADMAP legado, Sprint 5 («Inventory CRUD»).
  - Entregue em `2093d63` (2025-11-29, «docs: Update documentation for Sprint 5.3 completion and bump version to v2.0.0-alpha.2»; apesar do título, o commit traz código de produto): `public/js/components/InventoryModals.js` (a janela de registro, com formato, moeda, preço e notas), `public/js/views/AlbumsView.js` (o botão do cartão do álbum), `public/js/views/InventoryView.js`, `public/js/repositories/InventoryRepository.js`, `public/css/modals.css` e mais 9.
  - Entregue em `cd7dff4` (2025-12-11, «Fix: Prevent duplicate albums in inventory with check in InventoryRepository»): `public/js/repositories/InventoryRepository.js` (o álbum já registrado é recusado).
- [REQ-03] (S-35) Fluxo: InventoryController.changeStatus e a janela de editar → InventoryStore atualiza o item (otimista, com volta atrás se a gravação falha) → InventoryRepository.
  - Onde mora (origem da história): inventário do V1: I5, I7 (`controllers/InventoryController.js:259-312`, `components/InventoryEditModal.js:18-121`); ROADMAP legado, Sprint 5.
  - Entregue em `730a9d2` (2025-12-08, «feat(inventory): add View Album Details modal, Owned status toggle, and ownership filter»): `public/js/components/ViewAlbumModal.js`, `public/js/views/InventoryView.js`.
- [REQ-04] (S-36) Fluxo: InventoryView aplica busca e filtros sobre os itens carregados pelo InventoryController.
  - Onde mora (origem da história): inventário do V1: I3 (`views/InventoryView.js:119-151`, `controllers/InventoryController.js:112-151`); ROADMAP legado, Sprint 5.
  - Entregue em `730a9d2` (2025-12-08, «feat(inventory): add View Album Details modal, Owned status toggle, and ownership filter»): `public/js/components/ViewAlbumModal.js`, `public/js/views/InventoryView.js`.

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
inventory.js é uma store que faz I/O (arch.md, achado 5); a coleção depende das regras do Firestore, que são a única autorização (arch.md). O commit 2f980d0, que o nó S-34 citava antes, mexe só em configuração de entrada e implantação (firebase.json, index.html, vite.config.js) e não é entrega da coleção; a entrega do registro está em 2093d63 e cd7dff4.
