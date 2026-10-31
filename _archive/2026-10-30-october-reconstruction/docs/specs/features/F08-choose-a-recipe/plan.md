<!-- docs/specs/features/F08-choose-a-recipe/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F08: Escolher entre mais de uma receita para montar a playlist · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
Padrão Strategy do arch.md: cada receita é um algoritmo registrado em algorithms/index.js (BaseAlgorithm e as receitas de cascata e de Top N); o seletor da tela de playlists escolhe o algoritmo e a fonte da nota (Balanced, Spotify Popularity, BEA Rating).

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-10) Fluxo: Seletor de receitas e de fonte da nota → registro de algoritmos (algorithms/index.js) → o gerador executa a receita escolhida.
  - Onde mora (origem da história): inventário do V1: B4, P2 e seção 3.1 (`algorithms/index.js:24-30`); ROADMAP legado, Sprint 8 («Algorithm Selector UI») e Sprint 17.9 (ADR-0015, «Flavor» vira «Recipe»).
  - Entregue em `e038315` (2025-12-16, «feat(sprint8): Implement Algorithm Strategy Pattern with MJRP Balanced Cascade»): `public/js/algorithms/BaseAlgorithm.js`, `public/js/algorithms/LegacyRoundRobinAlgorithm.js`, `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js`, `public/js/algorithms/SDraftBalancedAlgorithm.js`, `public/js/algorithms/SDraftOriginalAlgorithm.js`, `public/js/algorithms/index.js`, `public/js/views/PlaylistsView.js`.

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
O registro tem hoje quatro receitas; o commit e038315 entregou três algoritmos e o conjunto atual veio depois (Sprints 15.5 e 17.9). Esta feature descreve o resultado em produção, não os três do commit.
