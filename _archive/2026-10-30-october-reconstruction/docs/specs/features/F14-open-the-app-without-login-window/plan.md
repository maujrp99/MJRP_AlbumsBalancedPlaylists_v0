<!-- docs/specs/features/F14-open-the-app-without-login-window/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F14: Abrir o app e começar a usar sem janela de login nem de autorização · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
O app entra como convidado sozinho (login anônimo); MusicKitService passa a autorizar sob demanda (lazy authorize) e a escolher a loja pelo idioma do navegador; a janela de entrada é aberta só pelo botão.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-39) Fluxo: Entrada anônima automática (sem janela) → MusicKitService autoriza sob demanda no envio → LoginModal só abre pelo botão «Sign In».
  - Onde mora (origem da história): inventário do V1: L1, L2, L7 (`services/musickit/MusicKitAuth.js:54-176`); ROADMAP legado, Sprint 15 («ARCH-13: Lazy Authorize»).
  - Entregue em `b3b9f32` (2025-12-31, «feat(Sprint15-Phase6): Lazy authorize + browser locale storefront + Edit modal artist scan»): `public/js/components/Autocomplete.js`, `public/js/components/series/SeriesModals.js`, `public/js/services/MusicKitSearchAdapter.js`, `public/js/services/MusicKitService.js`, `public/js/stores/albumSeries.js`, `public/js/views/playlists/PlaylistsExport.js`.

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
Nenhum conhecido na documentação.
