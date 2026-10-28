<!-- docs/specs/features/F17-rating-origin-and-refetch/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F17: Ver de onde vem a nota de cada faixa e buscar de novo os dados de um álbum · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
O servidor passa a expor as evidências de cada nota (fetchRanking.js, EnrichmentService) → TrackTransformer as guarda em ranking.evidence → TracksTable monta a dica da estrela; SeriesService.refetchAlbumMetadata enriquece o álbum e grava na store de álbuns.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-28) Fluxo: Servidor expõe as evidências de cada nota → TrackTransformer as guarda em ranking.evidence → TracksTable monta a dica da estrela.
  - Onde mora (origem da história): inventário do V1: A17, K2 (`components/ranking/TracksTable.js:119-135`); ROADMAP legado, Sprint 23 («Evidence UI»).
  - Entregue em `bb801a5` (2026-01-19, «fix(ranking): sprint 23 ranking refactor and bugfixes»): `public/js/components/ranking/TracksTable.js`, `public/js/helpers/BEAEnrichmentHelper.js`, `public/js/services/SeriesService.js`, `public/js/transformers/TrackTransformer.js`, `server/lib/fetchRanking.js`, `server/lib/scrapers/besteveralbums.js`, `server/lib/services/EnrichmentService.js`.
- [REQ-02] (S-29) Fluxo: SeriesController.refetch → SeriesService.refetchAlbumMetadata enriquece o álbum, atualiza o cache e grava na store de álbuns → a grade redesenha.
  - Onde mora (origem da história): inventário do V1: A16 (`controllers/SeriesController.js:406-436`, `services/SeriesService.js:302-475`); ROADMAP legado, Sprint 23 («Cache Sync: Refetch»).
  - Entregue em `a2f789e` (2026-01-17, «feat(refetch): implement Refetch Metadata with refined UI (v3125)»): `public/js/components/series/SeriesEventHandler.js`, `public/js/components/ui/AlbumCardRenderer.js`, `public/js/components/ui/Card.js`, `public/js/controllers/SeriesController.js`, `public/js/services/SeriesService.js`, `public/js/views/SeriesView.js`.

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
arch.md, passo 6: quando o servidor não lê uma fonte, responde 200 com resultado vazio e o cliente não distingue «sem dado» de «fonte fora do ar» (achado 7 da auditoria), risco registrado fora desta feature.
