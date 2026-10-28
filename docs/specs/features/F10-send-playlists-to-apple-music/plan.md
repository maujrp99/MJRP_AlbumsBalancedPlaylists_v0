<!-- docs/specs/features/F10-send-playlists-to-apple-music/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F10: Enviar as playlists para o Apple Music · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
PlaylistsExport (navegador) → MusicKit JS com autorização sob demanda; o token de desenvolvedor é assinado pelo servidor (rota /api/musickit-token, MusicKitTokenService); busca no catálogo e criação das playlists numa pasta.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-22) Fluxo: PlaylistsExport → MusicKit (autorização sob demanda; o token de desenvolvedor vem do servidor em /api/musickit-token) → busca no catálogo e criação das playlists na pasta.
  - Onde mora (origem da história): inventário do V1: P16, L7 (`components/playlists/PlaylistsExport.js:66-225`, `services/musickit/MusicKitAuth.js:54-176`); ROADMAP legado, Sprint 7 («Apple Music Integration»).
  - Entregue em `0be7441` (2025-12-12, «feat(export): implement Apple Music playlist export with MusicKit authorization»): `public/js/views/PlaylistsView.js`.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Apple MusicKit JS, citado no ROADMAP legado (Sprint 7).

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
Sem credencial configurada o servidor responde 503 «MusicKit not configured» (behavior.md, apple-music-not-configured); a autorização cancelada tem aviso próprio.
