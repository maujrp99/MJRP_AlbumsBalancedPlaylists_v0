<!-- docs/specs/features/F16-my-own-track-ranking/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F16: Dar a minha própria ordem às faixas de um álbum e misturar por ela · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
UserRankModal (arrastar) → UserRankingRepository grava por usuário e álbum (Firestore e IndexedDB, via CacheManager) → UserRankingStrategy e TopNUserAlgorithm usam a ordem; sem ordem guardada vale a ordem original do álbum. O prefixo UGR identifica a fonte nos títulos.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-27) Fluxo: Janela «Rank It» (UserRankModal) → UserRankingRepository grava por usuário e álbum (Firestore + IndexedDB) → UserRankingStrategy e TopNUserAlgorithm usam a ordem; sem ordem guardada vale a ordem original.
  - Onde mora (origem da história): inventário do V1: M3, K5, B4, P20, DD2 (`components/ranking/UserRankModal.js`, `ranking/UserRankingStrategy.js`); ROADMAP legado, Sprint 20 («User Ranking System», «Recipe Parity»).
  - Entregue em `7aa9704` (2026-01-11, «Sprint 20: Fix User Ranking UI Persistence & Sorting delegation (Grid/List)»): `public/js/algorithms/TopNUserAlgorithm.js`, `public/js/algorithms/index.js`, `public/js/components/ranking/TracksTable.js`, `public/js/components/ranking/UserRankModal.js`, `public/js/components/series/SeriesEventHandler.js`, `public/js/components/ui/AlbumCardRenderer.js`, `public/js/controllers/SeriesController.js`, `public/js/models/Album.js`, `public/js/ranking/UserRankingStrategy.js` e mais 2.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Nenhuma nova (Firestore e IndexedDB já em uso).

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
As regras do Firestore deixam albumRankings abertas a qualquer pessoa, até sem login (arch.md, quadro de regras: comentário «DEBUG» no próprio arquivo); risco registrado nos documentos canônicos, fora desta feature.
