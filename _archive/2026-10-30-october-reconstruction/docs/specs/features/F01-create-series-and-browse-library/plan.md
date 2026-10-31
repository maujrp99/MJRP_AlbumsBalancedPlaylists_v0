<!-- docs/specs/features/F01-create-series-and-browse-library/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F01: Criar uma série de álbuns e achar os álbuns na biblioteca, com a nota de cada faixa · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
Camadas do navegador do arch.md: Views (HomeView, SeriesView/AlbumsView, RankingView) → Controllers → Stores/Services → Repositório da série; o servidor entra só para a nota das faixas (rota /api/enrich-album, que raspa o BestEverAlbums). O cache de álbuns tem duas camadas (memória e IndexedDB). Nada a refinar em arch.md nem em data-model.md: o que foi entregue já é o que esses documentos descrevem.

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-01) Fluxo: Tela inicial (HomeView) recebe o nome e o conjunto de álbuns escolhidos, o HomeController monta o pedido, a store de séries grava a série e a tela abre a série criada.
  - Onde mora (origem da história): inventário do V1: H1, H11 (`controllers/HomeController.js:219-275`); ROADMAP legado, Sprint 2 («HomeView with series creation»).
  - Entregue em `5542a3c` (2025-11-26, «feat(v2.0): Sprint 2 - Router & Views complete»): `public/js/router.js`, `public/js/stores/albums.js`, `public/js/views/BaseView.js`, `public/js/views/HomeView.js`.
- [REQ-02] (S-04) Fluxo: Rota /albums → SeriesView/SeriesController carrega os metadados das séries → AlbumCache (memória + IndexedDB) → cartões de álbum desenhados pelo renderizador; a escolha de grade ou lista vai para o localStorage.
  - Onde mora (origem da história): inventário do V1: A1, A6, A8, A13, A18, M1 (`views/SeriesView.js`, `controllers/SeriesController.js:90-317`); ROADMAP legado, Sprint 3 («Albums Library», «Grid vs Expanded view toggle»).
  - Entregue em `1e5be0b` (2025-11-26, «feat(v2.0): Sprint 3 - Albums & Ranking Views complete»): `public/js/api/client.js`, `public/js/cache/albumCache.js`, `public/js/views/AlbumsView.js`, `public/js/views/HomeView.js`, `public/js/views/RankingView.js`.
- [REQ-03] (S-05) Fluxo: FilterToolbar → SeriesFilterService aplica busca e filtros sobre os álbuns já carregados → o renderizador redesenha a grade.
  - Onde mora (origem da história): inventário do V1: A3, A4 (`components/ui/FilterToolbar.js:49-60`, `services/SeriesFilterService.js:37-82`); o filtro «My Ranking» entrou no Sprint 21.
  - Entregue em `585bed7` (2025-11-28, «Sprint 4.5 Phase 2: Partial completion - MODE 3 implemented, cache issue deferred to Spri…»): `public/assets/images/logoMRP.svg`, `public/js/api/client.js`, `public/js/components/Icons.js`, `public/js/views/AlbumsView.js`, `public/js/views/RankingView.js`.
- [REQ-04] (S-25) Fluxo: Servidor /api/enrich-album raspa o BestEverAlbums e devolve o ranking das faixas → o cliente guarda a nota na faixa → TracksTable desenha a tabela e ordena pelo cabeçalho; o gerador de playlists recebe as faixas já em ordem de aclamação.
  - Onde mora (origem da história): inventário do V1: A13, A17, K2 (`components/ranking/TracksTable.js:8-290`, `server/lib/services/EnrichmentService.js:35-103`); ROADMAP legado, Sprint 3 («BestEverAlbums badge integration»).
  - Entregue em `1e5be0b` (2025-11-26, «feat(v2.0): Sprint 3 - Albums & Ranking Views complete»): `public/js/api/client.js`, `public/js/cache/albumCache.js`, `public/js/views/AlbumsView.js`, `public/js/views/HomeView.js`, `public/js/views/RankingView.js`.
  - Entregue em `7154dc7` (2025-11-25, «feat(curator): feed balanced playlist generator with acclaim-ordered tracks»): `public/js/app.js`, `public/js/curation.js`.

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Nenhuma dependência nova nomeada pelos commits nem pelo histórico; usa a stack de docs/specs/tech-stack.md (JavaScript puro, Vite, cache no navegador, raspagem do BestEverAlbums no servidor).

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
A lista de séries é lida com limit 20 e sem paginação (data-model.md, «Corte de 20 séries»): quem tem mais de 20 séries deixa de ver as outras e nada avisa. Os dados de cada álbum ficam em cache por sete dias (behavior.md, local-album-cache). Nenhum desses é desta feature a corrigir: estão registrados nos documentos canônicos.
