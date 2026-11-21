<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F65: Tirar o que nada usa · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois de construído (via rápida), em 2026-11-19, no ramo `fix/f65-remove-what-nothing-uses`. Sem navegador nesta sessão: o que é de tela fica para o integrador.

## Architecture Approach
A feature não muda o desenho do app: tira o que o desenho já não usava e acrescenta dois sensores. A definição de «vivo» passa a ser uma só e está escrita no `docs/specs/arch.md` (seção «O que nada usa saiu, e dois sensores que seguram isso (F65)»): um arquivo é vivo quando uma entrada o alcança pelo grafo de importações, e teste não conta como uso.

- **Entradas:** `public/index.html` (o site: carrega `/js/firebase-config.js` e `/js/app.js`) e `server/index.js` (o servidor: `npm start` em `server/`, `CMD` do `server/Dockerfile`). Os scripts dos dois `package.json` e os roteiros de `scripts/` hoje não rodam nenhum outro arquivo de código do repositório (rodam `vite`, `vitest`, `eslint`, `gcloud`, `firebase`); a ferramenta os lê, e um arquivo que eles passem a nomear vira entrada.
- **Refina no `arch.md`:** as rotas da casca (18 para 15), as rotas do servidor (sai `playlists`), a linha da curadoria, a lista dos que importam o `app.js` (seis para quatro) e a tabela das regras do banco (duas linhas sem nenhum código que as use).
- **Refina no `data-model.md`:** a coleção raiz `albums` e o layout `users/{uid}/series/**` não têm mais leitor nem gravador no código.

## Technical Design

### 1. O grafo de importações (REQ-01)
`test/architecture/support/importGraph.js` lê o código com o `espree`, sem rodar nada. Conta como «carrega»: `import … from`, `export … from`, `import()`, `require()`, `require.resolve()`, `new URL('./x', import.meta.url)`, `new Worker('./x')`, com os sufixos do Vite (`?worker`, `?url`) tirados e os apelidos do `vite.config.js` resolvidos (`@`, `@stores`, `@components`, `@views`, `@shared`); no HTML, `<script src>` e `<link href>`; no CSS, `@import`. Devolve os arquivos alcançados, as importações que apontam para arquivo que não existe e os arquivos com importação de nome montado em tempo de execução. Como script (`node test/architecture/support/importGraph.js`) imprime os módulos mortos.

`test/architecture/noDeadModules.test.js` (12 casos) é a parte que fica: reprova módulo de `public/js`, `shared` ou `server` que nenhuma entrada alcança, folha de `public/css` que nada carrega, importação quebrada e importação que o grafo não consegue seguir. Exceção única, com o motivo: `public/js/firebase-config.example.js` (modelo copiado à mão). A lista de exceções reprova linha que sobrou. Conferido por mutação: com a importação do `Footer` comentada no `app.js`, o teste acusa `public/js/components/Footer.js`.

**Medido na `main` (`2f9215b`):** 49 módulos mortos, 4.998 linhas (37 em `public/js`, 12 em `server/`). **No ramo:** 254 arquivos alcançados, nenhum morto.

### 2. O que saiu, por grupo (um commit cada)

| Grupo | O que saiu | Arquivos | Linhas |
|---|---|---|---|
| Módulos mortos de `public/js` (REQ-01) | oito algoritmos antigos, `cache/albumCache.js`, `repositories/SharedAlbumRepository.js`, `components/Autocomplete.js`, `services/PlaylistPersistenceService.js`, `services/SeriesFilterService.js`, `services/MusicKitSearchAdapter.js`, `utils/SvgGenerator.js`, `utils/MJRPLogoGenerator.js`, os modelos `Playlist` e `Series`, quatro arquivos de reexportação e os componentes soltos; mais `public/js/tests/TrackTransformerTest.js` e `views/playlists/PlaylistsDragDrop.js` | 38 | cerca de 4.600 |
| Telas retiradas (REQ-02) | rotas `/ranking/:albumId`, `/consolidated-ranking`, `/save-all`; `views/RankingView.js`, `views/ConsolidatedRankingView.js`, `views/SaveAllView.js`, `migration/MigrationUtility.js`, `repositories/AlbumRepository.js`; o «Data Sync» do `components/TopNav.js`; o ramo de `/ranking` do `components/Breadcrumb.js` | 5 removidos, 3 editados | cerca de 1.200 |
| Servidor (REQ-03, REQ-04) | `server/routes/playlists.js` com a montagem e a guarda no `server/index.js`; `shared/curation.js`; `generatePlaylists` e `normalizePlaylists` de `public/js/api/client.js`; `server/scripts/**`; `server/search_debug.*`; `server/test/**`; quatro configurações de lint e formatação | 33 | 2.077, mais 8.399 do `server/package-lock.json` |
| `scripts/` e raiz (REQ-05) | dezesseis arquivos de `scripts/` (treze geradores e roteiros, três arquivos de dados), `reproduce_match.js`, `sort_test.html`, `restart_dev.sh`, `.flatten_ts`, `.eslintrc.json` | 21 | 29.386 (26.586 são dois JSON de dados) |
| Páginas e arquivos de `public/` fora da build | `debug-curator.html`, `debug-svg-generator.html`, `static_prototype_v3.html`, `typography-preview.html`, `404.html`, `legacy/**`, `_api.main.js`, `config.js`, `package.json`, o atalho `js/shared` | 12 (um é o atalho) | cerca de 3.300 |
| Testes que nenhum comando roda (REQ-04) | `tests/**`, `test/scripts/**`, `test/e2e/**` (com dez capturas de tela) e os testes só de coisas removidas | 37 | cerca de 3.100 |
| CSS | a regra `.text-accent-secondary` de `public/css/modals.css` (só a tela de ranking retirada a usava) | 1 editado | 4 |

No total, contra a `main`: 143 arquivos removidos, 5 criados (a ferramenta do grafo, a busca de segredos, os dois testes novos e `test/server/answerParsing.test.js`).

**Conferências antes de tirar.** Cada arquivo foi procurado pelo nome em `public/`, `server/`, `shared/`, `scripts/`, `test/`, nas páginas HTML, nos JSON e nos arquivos de configuração. `shared/curation.js`: nenhum módulo vivo o importa nem usa `CurationEngine` ou `curateAlbums`; o blend usa `public/js/algorithms/`, que não o toca. `public/404.html`: o `firebase.json` não a cita (toda rota é reescrita para `/index.html`) e o roteiro de publicação não a copia para `dist/`. `public/package.json`: repetia o `"type": "module"` da raiz. `public/js/shared`: um atalho para `shared/` que nenhuma importação usa (o app importa por `@shared`).

**O que o grafo não acusava e saiu assim mesmo:** `views/playlists/PlaylistsDragDrop.js` (alcançado só por `views/playlists/index.js`, que o reexportava; ninguém chamava `setupDragAndDrop`) e `public/js/tests/TrackTransformerTest.js` (um roteiro de console).

**O que a triagem listava e não saiu:**
- `public/js/firebase-config.example.js`: é o modelo de configuração; fica, como exceção escrita do teste.
- `stores/SpotifyEnrichmentStore.js` e `services/SpotifyEnrichmentService.js`: vivos (e da F69).
- Os arquivos de dados de `public/assets/data`: não são código; ver «Achados».
- Tudo o mais que a triagem listava saiu.

### 3. O servidor e a UAT-21 (REQ-03, REQ-04)
`server/test/` tinha oito arquivos: três importavam `public/js/curation.js`, que não existe; `run-tests.js` chamava o site de notas de verdade; `normalize.test.js` e `schema.test.js` eram do Jest, que nenhum comando rodava; `scraper-fixtures-test.js` era um roteiro solto. O que era verdadeiro e roda sem rede foi para `test/server/answerParsing.test.js` (7 casos: o texto da resposta da IA; a consolidação das posições). Não foram trazidos, e por quê: o esquema do álbum (a raiz instala o `ajv` 6, o servidor usa o 8) e a leitura da página de notas com o HTML de exemplo (o `cheerio` é dependência só do servidor).

`server/package.json`: `test` passa a ser `cd .. && npx vitest run test/server`; saem `lint`, `lint:fix`, `format`, os sete pacotes de desenvolvimento (`eslint`, `eslint-config-prettier`, `eslint-plugin-node`, `eslint-plugin-prettier`, `jest`, `prettier`, `standard`) e o bloco `jest`. Todas as dependências de execução ficam.

**Prova do servidor, feita numa cópia fora do repositório** (a pasta `server/` com `shared/` e `config/` ao lado, como o roteiro de publicação monta): `npm ci --omit=dev` instala 123 pacotes; `node index.js` sobe sem variável nenhuma; `GET /_health` 200; `POST /api/playlists` 404; `POST /api/enrich-album`, `POST /api/generate` e `POST /api/ai/studio-albums` 401 sem login; `GET /api/musickit-status` 200; os dois módulos de `shared/` carregam. Repetida depois de trazer a `main` com a F69: mesmo resultado.

### 4. A busca de segredos (REQ-05)
`test/security/support/secretScan.js` lê os arquivos de texto que o git acompanha (numa cópia sem `.git`, como a que os roteiros de publicação exportam, lê a pasta e pula `.env`, `.env.local` e `.env.*.local`). Regras: valor longo (hexadecimal, base64 ou letras em caixa aleatória) atribuído a um nome com `token`, `secret`, `password`, `api_key`, `private_key` ou `access_key`; a mesma coisa numa linha de arquivo de ambiente; `Authorization: Discogs token=…` e `Bearer …` com valor literal; chave privada com conteúdo depois do cabeçalho; chaves de formato conhecido (Google, AWS, GitHub, Slack, `sk-…`, JWT). Devolve arquivo, linha e regra; o valor não é guardado nem impresso.

`test/security/noSecretsInRepo.test.js` (11 casos): o repositório sem achados; a lista dos valores públicos sem linha sobrando; e o que a busca pega e o que deixa passar, com amostras montadas em tempo de execução. **Vermelho antes** (rodado com os dois scripts ainda na árvore): `scripts/fetch-missing-artists.js:12` e `scripts/generate-dataset.js:8`, e só eles. **Verde depois.** Valor público por desenho, na lista com o motivo: a configuração web do Firebase em `public/js/firebase-config.js`.

### 5. Os `package.json` (REQ-06)
- **Raiz:** `description` em dia; entram `espree` `^10.4.0` e `postcss` `^8.5.6` (usados por `test/architecture/` e não declarados), nas versões que o `package-lock.json` já resolvia; saem `puppeteer` (com `test/e2e`) e `jsonwebtoken` (só os scripts removidos o usavam; o do servidor fica no `server/package.json`); saem os scripts `test:e2e` e `test:e2e:headful`. **O `dotenv` fica**: `server/lib/services/spotifyPopularity.js`, que `test/server/spotifyAlbumIdentity.test.js` e `test/server/spotifyPopularityOutcome.test.js` carregam, faz `require('dotenv')` ao carregar.
- **Os dois `package-lock.json` foram refeitos só no arquivo** (`npm install --package-lock-only --ignore-scripts`, a raiz numa cópia fora do repositório): na raiz saem 70 pacotes (as árvores do `puppeteer` e do `jsonwebtoken`), nenhum entra nem muda de versão ou de assinatura; no servidor ficam os 123 pacotes de produção, idênticos, e saem os 517 de desenvolvimento. `npm ci --dry-run` aceita o da raiz; `npm ci --omit=dev` instalou o do servidor.
- **Prova numa cópia limpa do ramo** (`git archive` do commit, sem `.git` e sem `node_modules`, como os roteiros de publicação fazem): `npm ci` instala 395 pacotes, sem `puppeteer` nem `jsonwebtoken`; `npx vitest run` passa com 1945 testes em 162 arquivos (a busca de segredos lê a pasta quando não há git); `npx vite build` compila.

### 6. O ESLint (REQ-07; UAT-20, em parte)
`eslint.config.mjs`: uma lista do que não é lido (`dist/`, `coverage/`, `node_modules/`, `_archive/`, `_backups/`, `public/js/vendor/`, as cópias do harness, as pastas sem código do app) e um bloco por tipo de código. As regras continuam as recomendadas, com `no-unused-vars` e `no-undef` em aviso.

| | Arquivos | Erros | Avisos |
|---|---|---|---|
| `main`, cópia limpa, configuração antiga | 531 | 63 | 521 (377 `no-undef`, 142 `no-unused-vars`) |
| Ramo, configuração nova (com a F69 dentro) | 419 | 25 | 90 |

**O que resta, por regra:** `no-unused-vars` 88 (aviso); `no-useless-escape` 17 (`utils/NormalizationUtils.js:25`, `server/lib/normalize.js:24,39,54,132`, `server/lib/scrapers/besteveralbums.js:443-444`); `no-empty` 3; `no-dupe-keys` 2 (`components/Icons.js:100` «Plus» e `controllers/InventoryController.js:44` «sorting»: a segunda chave vence a primeira); `no-case-declarations` 1 (`components/series/SeriesEventHandler.js:203`); `no-async-promise-executor` 1 (`services/AlbumLoader.js:21`); `no-dupe-else-if` 1 (`server/lib/normalize.js:234`: um ramo que nunca roda); uma diretiva `eslint-disable` sem uso (`server/lib/asyncRoute.js:20`); `no-undef` 1.

**O `no-undef` que resta é defeito de verdade, anotado e não consertado:** em `server/lib/fetchRanking.js` o comentário de documentação antes de `normalizeRating` não fecha, a função fica dentro do comentário, e `mergeRankingEvidence` (linha 72) a chama. Hoje nada chama `mergeRankingEvidence`: é código morto dentro de um arquivo vivo, que quebraria se fosse usado.

**Consertado por ser mecânico e em arquivo já tocado:** quatro importações sem uso em `components/TopNav.js` e a do `axios` em `api/client.js` (o pacote do site não muda de tamanho: a build já o deixava de fora).

**O que falta para o lint virar portão:** zerar os 25 erros (17 são barras invertidas a mais em expressões regulares; os outros oito pedem leitura, não chute) e decidir se `no-undef` passa a erro. Só então entra na CI e nos roteiros de publicação.

### 7. Classes de estilo sem regra (UAT-203, a parte que só se levanta)
Método: toda palavra escrita num atributo `class`, num `className` ou num `classList.add/remove/toggle` de `public/js` e de `public/index.html`, comparada com as regras do CSS construído (o pacote do Vite mais `public/css/modals.css`, que a página liga direto). Uma segunda passada procura os nomes das famílias de estilo em qualquer texto entre aspas (acha a classe guardada numa variável; pode trazer uma palavra que não é classe, como `role="alert"`: o arquivo e a linha permitem conferir). Uma classe do Tailwind em uso está no CSS construído por definição; as que aparecem aqui são as que o Tailwind não reconheceu (por exemplo, `bg-surface-darker`, cor que o tema não tem) e as que nunca tiveram regra. **Nada foi reestilizado.**

**Mortas junto com o arquivo que as escrevia (24, saíram com ele):** `autocomplete-container`, `border-t-accent-primary`, `loader-spinner`, `result-item`, `results-dropdown` (`Autocomplete.js`); `fa-box-open`, `fa-circle`, `fa-layer-group`, `fa-music`, `fa-save`, `fa-search`, `fa-spotify`, `fa-star`, `fa-sync-alt`, `fab`, `fas` (as do Font Awesome, que o app não carrega: `InventoryGrid.js`, `ContextMenu.js`, `PlaylistExportToolbar.js`, `PlaylistsDragBoard.js`, `SeriesFilterBar.js`); `inventory-grid-wrapper`; `playlist-column`, `track-card`; `track-drag-handle`, `track-info`, `track-item`, `track-meta`, `track-title` (`TrackItem.js`). Não sobra nenhuma classe `fa-*` no app.

**Em tela viva (119 nomes: 105 em atributos de classe e os demais achados pela segunda passada), para o MJRP decidir:**

**Com cara de estilo esperado (42):** nomes de famílias de componente ou de tema (botão, selo, aviso, campo, fundo, cor de destaque, animação). Quem os escreveu esperava uma aparência que nenhuma regra dá.

| Classe | Usos | Onde (arquivo:linha, a partir de `public/js/`) |
|---|---|---|
| `accent-accent-primary` | 1 | `components/playlists/PlaylistsGridRenderer.js:202` |
| `alert` | 5 | `components/playlists/PlaylistsGridRenderer.js:175`, `components/playlists/SavedSeriesGroup.js:87`, `components/series/SeriesEditModal.js:63`, `views/PlaylistsView.js:303`, `views/SavedPlaylistsView.js:270` |
| `alert-error` | 1 | `views/PlaylistsView.js:303` |
| `alert-warning` | 1 | `components/playlists/PlaylistsGridRenderer.js:175` |
| `animate-fade-in` | 1 | `components/ViewAlbumModal.js:103` |
| `animate-fade-in-up` | 1 | `components/ViewAlbumModal.js:67` |
| `animate-fade-out-down` | 1 | `components/ViewAlbumModal.js:102` |
| `animate-progress-indeterminate` | 1 | `components/GlobalProgress.js:25` |
| `animate-scale-in` | 1 | `components/playlists/SavedSeriesGroup.js:32` |
| `badge-neutral` | 5 | `components/ViewAlbumModal.js:172`, `components/ViewAlbumModal.js:177`, `components/playlists/PlaylistsGridRenderer.js:206`, `components/series/SeriesEditModal.js:58`, `views/InventoryView.js:61` |
| `badge-primary` | 1 | `components/ui/Card.js:292` |
| `bg-accent-primary` | 1 | `views/albums/AlbumsGridRenderer.js:29` |
| `bg-accent-primary/10` | 1 | `components/playlists/PlaylistsGridRenderer.js:199` |
| `bg-accent-primary/20` | 1 | `components/TopNav.js:145` |
| `bg-surface` | 3 | `components/playlists/PlaylistGrid.js:113`, `components/playlists/RegeneratePanel.js:74`, `components/playlists/SavedPlaylistCard.js:44` |
| `bg-surface-dark/30` | 1 | `components/ViewAlbumModal.js:48` |
| `bg-surface-dark/95` | 1 | `components/Toast.js:114` |
| `bg-surface-darker` | 1 | `components/ViewAlbumModal.js:62` |
| `bg-surface-darker/50` | 1 | `components/ViewAlbumModal.js:24` |
| `bg-surface/60` | 3 | `components/blend/BlendIngredientsPanel.js:266`, `components/blend/BlendIngredientsPanel.js:300`, `components/blend/BlendSeriesSelector.js:160` |
| `border-3` | 1 | `views/BlendingMenuView.js:410` |
| `border-accent-primary` | 3 | `components/playlists/PlaylistsGridRenderer.js:199`, `views/SavedPlaylistsView.js:261`, `views/albums/AlbumsGridRenderer.js:26` |
| `btn-circle` | 1 | `components/ViewAlbumModal.js:215` |
| `btn-ghost` | 7 | `components/ViewAlbumModal.js:215`, `components/playlists/SavedPlaylistActions.js:33`, `components/playlists/SavedPlaylistActions.js:69`, `components/playlists/SavedPlaylistActions.js:89`, `components/playlists/SavedPlaylistRow.js:43` e mais 2 |
| `btn-large` | 1 | `components/playlists/PlaylistsGridRenderer.js:239` |
| `btn-warning` | 2 | `components/ui/FilterToolbar.js:109`, `components/ui/modals/ConfirmModal.js:39` |
| `fade-in` | 9 | `components/SpotifyExportModal.js:177`, `components/playlists/PlaylistsGridRenderer.js:159`, `components/playlists/PlaylistsGridRenderer.js:23`, `components/playlists/PlaylistsGridRenderer.js:66`, `components/series/SeriesHeader.js:31` e mais 4 |
| `focus:border-accent-primary` | 1 | `components/playlists/PlaylistsGridRenderer.js:222` |
| `focus:ring-accent-primary` | 3 | `components/InventoryAddModal.js:59`, `components/InventoryEditModal.js:58`, `views/renderers/InventoryGridRenderer.js:89` |
| `group-hover:bg-accent-primary` | 2 | `components/playlists/SavedPlaylistActions.js:55`, `components/playlists/SavedSeriesGroup.js:57` |
| `hover:badge-accent` | 1 | `components/ui/Card.js:292` |
| `hover:bg-accent-primary/10` | 1 | `components/ui/AlbumCardRenderer.js:71` |
| `hover:bg-surface-lighter` | 1 | `views/InventoryView.js:76` |
| `hover:text-accent-primary` | 1 | `components/ui/AlbumCardRenderer.js:71` |
| `input` | 6 | `components/SpotifyExportModal.js:119`, `components/SpotifyExportModal.js:122`, `components/blend/BlendIngredientsPanel.js:355`, `components/playlists/PlaylistsGridRenderer.js:165`, `components/ui/FilterToolbar.js:62` e mais 1 |
| `input-bordered` | 1 | `components/playlists/PlaylistsGridRenderer.js:165` |
| `modal-backdrop` | 1 | `components/SpotifyExportModal.js:176` |
| `slide-in-from-bottom-2` | 1 | `components/ui/AlbumCardRenderer.js:178` |
| `text-muted` | 44 | `components/Footer.js:28`, `components/Footer.js:40`, `components/TopNav.js:169`, `components/blend/BlendIngredientsPanel.js:202`, `components/blend/BlendIngredientsPanel.js:217` e mais 39 |
| `text-muted/50` | 2 | `components/navigation/SeriesDropdown.js:115`, `components/navigation/SeriesDropdown.js:119` |
| `user-select-none` | 1 | `views/renderers/InventoryGridRenderer.js:86` |
| `zoom-in-95` | 2 | `components/SpotifyExportModal.js:177`, `components/ui/BaseModal.js:85` |

**Nomes de estrutura sem regra (57):** marcam um bloco da tela; não se sabe, sem navegador, se alguém esperava estilo deles.

| Classe | Usos | Onde |
|---|---|---|
| `albums-list` | 1 | `views/renderers/InventoryGridRenderer.js:44` |
| `algorithm-option` | 1 | `components/playlists/PlaylistsGridRenderer.js:198` |
| `algorithm-options` | 1 | `components/playlists/PlaylistsGridRenderer.js:196` |
| `all-series-container` | 3 | `components/series/SeriesGridRenderer.js:112`, `views/albums/AlbumsScopedRenderer.js:159`, `views/albums/AlbumsScopedRenderer.js:204` |
| `authenticated` | 1 | `services/AuthService.js:53` |
| `breadcrumb` | 1 | `components/Breadcrumb.js:16` |
| `breadcrumb-current` | 1 | `components/Breadcrumb.js:21` |
| `breadcrumb-separator` | 1 | `components/Breadcrumb.js:28` |
| `compact` | 2 | `components/ui/FilterToolbar.js:159`, `components/ui/FilterToolbar.js:166` |
| `created-playlist-link` | 1 | `components/SpotifyExportModal.js:351` |
| `empty` | 1 | `views/HomeView.js:242` |
| `export-actions` | 1 | `components/playlists/PlaylistsGridRenderer.js:114` |
| `export-section` | 1 | `components/playlists/PlaylistsGridRenderer.js:110` |
| `filter-dropdown` | 1 | `components/ui/FilterToolbar.js:123` |
| `filters-row` | 1 | `components/ui/FilterToolbar.js:44` |
| `filters-section` | 1 | `components/ui/FilterToolbar.js:43` |
| `footer-brand` | 1 | `components/Footer.js:39` |
| `footer-links` | 1 | `components/Footer.js:28` |
| `grabbing` | 2 | `components/playlists/PlaylistsDragHandler.js:44`, `components/playlists/PlaylistsDragHandler.js:50` |
| `header-actions` | 1 | `components/playlists/PlaylistsGridRenderer.js:72` |
| `header-content` | 1 | `components/playlists/PlaylistsGridRenderer.js:68` |
| `invalid` | 1 | `views/HomeView.js:245` |
| `inventory-card-wrapper` | 1 | `views/renderers/InventoryGridRenderer.js:109` |
| `last-update` | 1 | `components/Footer.js:47` |
| `load-more-btn` | 1 | `components/ui/LoadMoreButton.js:18` |
| `loading-content` | 2 | `views/PlaylistsView.js:334`, `views/albums/AlbumsGridRenderer.js:25` |
| `loading-overlay` | 2 | `views/PlaylistsView.js:333`, `views/albums/AlbumsGridRenderer.js:24` |
| `loading-spinner` | 3 | `views/PlaylistsView.js:335`, `views/SavedPlaylistsView.js:261`, `views/albums/AlbumsGridRenderer.js:26` |
| `loading-status` | 1 | `views/albums/AlbumsGridRenderer.js:31` |
| `loading-text` | 2 | `views/PlaylistsView.js:336`, `views/albums/AlbumsGridRenderer.js:27` |
| `logo-icon` | 1 | `components/TopNav.js:49` |
| `mobile-series-section` | 1 | `components/TopNav.js:101` |
| `nav-logo` | 1 | `components/TopNav.js:48` |
| `no-albums-warning` | 1 | `components/playlists/PlaylistsGridRenderer.js:174` |
| `playlist-card` | 1 | `components/playlists/PlaylistGrid.js:113` |
| `playlist-grid` | 1 | `components/playlists/PlaylistGrid.js:68` |
| `playlist-header` | 1 | `components/playlists/PlaylistGrid.js:114` |
| `playlist-name` | 1 | `components/playlists/PlaylistGrid.js:171` |
| `playlist-title-prefix` | 1 | `components/playlists/PlaylistGrid.js:166` |
| `powered-by` | 1 | `components/Footer.js:40` |
| `regenerate-header` | 2 | `components/playlists/RegeneratePanel.js:79`, `components/playlists/RegeneratePanel.js:83` |
| `search-bar` | 1 | `components/ui/FilterToolbar.js:45` |
| `series-actions` | 1 | `views/albums/AlbumsScopedRenderer.js:114` |
| `series-group-header` | 3 | `components/series/SeriesGridRenderer.js:152`, `views/albums/AlbumsScopedRenderer.js:107`, `views/albums/AlbumsScopedRenderer.js:132` |
| `series-load-failure` | 1 | `components/series/SeriesGridRenderer.js:185` |
| `series-pager` | 2 | `components/ui/Pager.js:46`, `components/ui/Pager.js:57` |
| `series-pager-count` | 1 | `components/ui/Pager.js:59` |
| `series-pager-more` | 1 | `components/ui/Pager.js:124` |
| `series-pager-pages` | 1 | `components/ui/Pager.js:99` |
| `series-pager-unchecked` | 1 | `components/ui/Pager.js:86` |
| `settings-section` | 1 | `components/playlists/PlaylistsGridRenderer.js:188` |
| `site-footer` | 1 | `components/Footer.js:24` |
| `sort-dropdown` | 1 | `components/ui/FilterToolbar.js:141` |
| `status-select` | 2 | `views/InventoryView.js:228`, `views/renderers/InventoryGridRenderer.js:89` |
| `top-nav` | 1 | `components/TopNav.js:41` |
| `valid` | 2 | `views/HomeView.js:243`, `views/HomeView.js:244` |
| `view-header` | 1 | `components/playlists/PlaylistsGridRenderer.js:66` |

**Usados também como seletor no JavaScript (20):** servem para o código achar o elemento; não ter regra pode ser de propósito.

`albums-grid`, `blend-grouping-btn`, `blend-output-btn`, `blend-ranking-btn`, `blend-recipe-card`, `blend-series-card`, `blend-track-count-btn`, `breadcrumb-link`, `close-modal-btn`, `delete-album-btn`, `edit-album-btn`, `filters-controls`, `inventory-row-wrapper`, `playlist-tracks`, `regenerate-chevron`, `regenerate-content`, `regenerate-panel`, `series-group`, `series-group-skeleton`, `series-pager-size`.

**No sentido contrário: regras de `public/css` que nenhum arquivo do app escreve (22).** Já não tinham uso na `main`; ficam, listadas: `animate-pulse-custom`, `badge-refreshing`, `count-badge`, `is-refreshing`, `skeleton-avatar`, `skeleton-card`, `stale-overlay` (`animations.css`); `form-checkbox` (`modals.css`); `neon-border-blue`, `neon-border-green`, `neon-border-orange`, `text-neon-blue`, `text-neon-green` (`neon.css`); `select-bordered`, `tech-btn-danger`, `tech-card`, `tech-green-accent`, `tech-grid-bg`, `tech-header-bar`, `tech-input`, `tech-orange-accent`, `tech-title` (`tech-theme.css`). A 23ª, `.text-accent-secondary`, perdeu o último uso neste ramo e saiu.

### 8. Achados, não mexidos
- **Regras do `firestore.rules` sem nenhum código que as use** (não editado: publicar regras é do MJRP). Podem ser fechadas (trocar por `allow read, write: if false;` ou tirar o bloco):
  - `match /albums/{albumId} { allow read, write: if request.auth != null; }`: a coleção compartilhada. O «Refetch» deixou de gravar nela na F56; o `SharedAlbumRepository`, único gravador, saiu aqui. O comentário acima da regra («Necessário porque o Refetch Metadata grava na raiz») deixou de ser verdade.
  - `match /users/{userId}/series/{seriesId}`, `match /users/{userId}/series/{seriesId}/albums/{albumId}` e `match /users/{userId}/series/{seriesId}/playlists/{playlistId}`: só a migração (`AlbumRepository`, `MigrationUtility`) usava esse layout.
  - Não conferido: se há documentos nessas coleções em produção.
- **Cerca de 44 MB em `public/assets` que o app não carrega e que vão para o site a cada publicação:** `data/albums-curated.json` (17,8 MB), `data/albums-expanded-backup.json` (13,0 MB), `herobanne-for-reference.png` (1,4 MB), e em `images/`: `newMJRPlogo.png` (4,2 MB), `newMJRPlogorealistic.png` (4,2 MB), `TheAlbumPlaylistSynth_original.png` (1,5 MB), `hero_bg_final.png`, `hero_bg.png`, `TheAlbumPlaylistSynth.png`, `TheAlbumPlaylistSynth_optimized.png`, `TheAlbumPlaylistSynth_transparent.png`, `logo.svg`. Com os geradores de `scripts/` removidos, a receita que montou os arquivos de dados só existe no histórico do git.
- **Funções exportadas que ninguém chama, em arquivo vivo** (passada aproximada, por nome): `renderLoadingProgress` (`views/albums/AlbumsGridRenderer.js`); `applyMixins` (`algorithms/mixins/index.js`) e `scanEmpty` (`models/scanState.js`), usadas só por testes.
- **`docs/specs/constitution.md`:** o artigo dos testes ainda cita «E2E Tests (Puppeteer)» e o do padrão Strategy a pasta `classification/`; a constituição tem cópia gerada e não foi emendada aqui.
- **Inertes depois desta feature, não mexidos:** a variável `PUPPETEER_SKIP_DOWNLOAD` em `scripts/lib/deploy-common.sh` (a lógica dos roteiros de publicação não é desta feature).

## Dependencies
Nenhuma nova. `espree` e `postcss` já estavam instalados (vinham com o `eslint` e o `tailwindcss`) e eram usados pelos testes de arquitetura sem declaração; passam a ser declarados. Saem `puppeteer` e `jsonwebtoken` da raiz e sete pacotes de desenvolvimento do servidor.

## Documents Consulted
`AGENTS.md`, `docs/specs/arch.md`, `docs/specs/data-model.md`, `docs/specs/behavior.md`, `docs/specs/tech-stack.md`, `docs/specs/constitution.md`, as linhas UAT-203, 21, 10, 11, 17, 20, 30 e 19 do `docs/specs/uat.md`, `reports/audits/2026-11-19-mjrpalbumblender-v0-open-issues-triage.md`, as entradas de 2026-11-19 do `docs/log.md`, `firebase.json`, `firestore.rules`, `vite.config.js`, `vitest.config.js`, os roteiros de `scripts/`.

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/arch.md` — atualizado (commit `6f047d7`)
- `docs/specs/data-model.md` — atualizado (commit `6f047d7`)
- `docs/specs/tech-stack.md` — atualizado (commit `6f047d7`)
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — sem mudança: não descreve as telas nem a rota que saíram
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou
- `docs/specs/constitution.md` — sem mudança: o último commit que a tocou antes da feature é de 2026-10-28 (a v2.0.0, de 2026-11-20, é da F78); nenhum commit que cita a F65 a toca

## Risks & Considerations
- **Uma tela pode depender de algo que só o navegador mostra.** A suíte e a build passam, o grafo não acha importação quebrada, mas nenhuma tela foi aberta nesta sessão. A prova é do integrador (roteiro abaixo).
- **`public/package.json` saiu.** Sem ele, o Vite passa a guardar o cache de desenvolvimento em `node_modules/.vite` da raiz (o lugar padrão) em vez de `public/node_modules/.vite`. `npx vite build` compila, e o servidor de desenvolvimento foi iniciado numa cópia limpa do ramo (`npx vite`, noutra porta): a página, `/js/app.js`, o worker da busca e um módulo importado por `@shared` responderam 200. Nenhuma tela foi aberta.
- **Os roteiros de navegador saíram.** Se o MJRP quiser uma suíte de navegador, é escrevê-la de novo contra as telas de hoje; reverter o commit traz de volta roteiros que já não casavam com o app.
- **Cada grupo é um commit**, para que uma remoção errada seja desfeita sozinha.

### Roteiro da prova no navegador (integrador)
Com `scripts/start-local.sh` (ou `cd server && npm ci && node index.js` e, noutro terminal, `npm ci && npm run dev`), em `http://127.0.0.1:5010`, console aberto. As 15 rotas do `app.js`:
1. `/home`: a Home abre; a busca de um artista mostra os filtros e os cartões.
2. `/albums` e `/albums/:seriesId`: as séries carregam, com notas; a vista expandida mostra a comparação de faixas.
3. `/blend`: escolher uma série e gerar; `/playlists` mostra as playlists; arrastar uma faixa; guardar.
4. `/saved-playlists` e `/playlist-series`: as playlists guardadas aparecem; «Edit» abre `/playlists/edit`.
5. `/inventory`: o inventário abre; adicionar e remover um álbum.
6. `/artists`, `/genres`, `/tracks`: a tela «Coming Soon».
7. `/album-series` e `/series`: levam para `/albums`.
8. `/callback`: é a volta do login do Spotify (conectar o Spotify pelo menu a exercita).
9. Os três endereços retirados, digitados: `/ranking/qualquer`, `/consolidated-ranking`, `/save-all` levam para `/home`.
10. O menu, no computador e no celular (largura menor que 768): todos os links abrem; não há botão «Data Sync» (nunca houve).
11. O rodapé: «Clear cache» funciona.
Em todas: nenhum erro novo no console, nenhum pedido 404 a arquivo `.js` ou `.css`.

### Roteiro da prova do servidor (integrador)
`cd server && npm ci && node index.js`, depois: `curl -i http://localhost:3000/_health` (200, `{"ok":true}`); `curl -i -X POST http://localhost:3000/api/playlists -H 'Content-Type: application/json' -d '{}'` (404); `curl -i -X POST http://localhost:3000/api/enrich-album -H 'Content-Type: application/json' -d '{}'` (401 sem login); `curl -i http://localhost:3000/api/musickit-status` (200). Pelo app, com login: as notas de um álbum chegam (`/api/enrich-album`).

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 21:40, hora de Brasília

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `noDeadModules.test.js`: todo módulo e toda folha de estilo alcançados; exceções sem linha sobrando; nenhuma importação quebrada nem de nome montado | nenhum módulo morto | arquitetura | sim |
| REQ-01 | os seis casos de «the graph follows every way a file is loaded» | o grafo segue página, apelido, `?worker`, `import()`, `require()`, `@import` | arquitetura | sim |
| REQ-02 | `router.test.js` «unknown address»; `outsideTextIsText.test.js` (caminho de navegação) | endereço retirado leva para a Home; o caminho de navegação não tem ramo de ranking | unidade | sim |
| REQ-02 | roteiro do navegador, passos 1 a 11 | toda tela com caminho no menu abre | tela | não (integrador) |
| REQ-03 | `authGuard.test.js`, `client.test.js`; prova do servidor | as rotas que ficam respondem; `/api/playlists` 404 | servidor | em parte (a prova do servidor é à mão) |
| REQ-04 | `answerParsing.test.js` (7 casos); o `include` do Vitest | todo teste roda em `npx vitest run` | unidade | sim |
| REQ-05 | `noSecretsInRepo.test.js` (11 casos) | nenhum segredo; vermelho antes, verde depois | segurança | sim |
| REQ-06 | `npm ci --dry-run` (raiz), `npm ci --omit=dev` (servidor), suíte e build | os arquivos de trava aceitos | build | não (feito à mão; os roteiros de publicação rodam `npm ci`) |
| REQ-07 | `npx eslint .` | 1 `no-undef`, que é defeito de verdade | lint | não é portão ainda |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): Nenhuma. As três telas retiradas não tinham caminho no app; quem tinha o endereço guardado passa a cair na Home.
