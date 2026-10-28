<!-- docs/specs/features/F15-sort-the-series/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F15: Ordenar as séries por nome, quantidade de álbuns ou data · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
SeriesToolbar (seletor «Sort») → SeriesController.sortSeries → SeriesGridRenderer; começa por quantidade de álbuns crescente (behavior.md, library-series-sort).

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-08) Fluxo: SeriesToolbar (seletor «Sort») → SeriesController ordena os grupos de séries → SeriesGridRenderer redesenha.
  - Onde mora (origem da história): inventário do V1: A5 (`controllers/SeriesController.js:489-523`); ROADMAP legado, Sprint 21 («Series Sorting»).
  - Entregue em `29b3f5e` (2026-01-14, «fix(series): resolved sorting issues and refined labels»): `public/css/animations.css`, `public/css/index.css`, `public/css/modals.css`, `public/css/views/home.css`, `public/js/components/ranking/TracksTable.js`, `public/js/components/ranking/UserRankModal.js`, `public/js/components/series/SeriesGridRenderer.js`, `public/js/components/series/SeriesToolbar.js`, `public/js/components/ui/LoadMoreButton.js` e mais 9.

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
A ordem só se nota no painel de todas as séries (comportamento do código). O commit 29b3f5e é o grande da Sprint 21 e traz também esqueletos de carregamento, rolagem virtual e telas do celular (F18).
