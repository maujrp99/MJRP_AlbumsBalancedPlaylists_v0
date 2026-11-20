<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F58: Carga e gravação de playlists dentro do limite de complexidade · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Diagnóstico: o que a medição e a leitura do código acharam

Medido em 2026-11-19, na `main` em `50e7b2e`, antes de mudar: `node test/architecture/support/measureComplexity.js public/js shared server` (a regra `complexity` do ESLint com limite 10, sem a configuração de lint do projeto).

| Onde | Funções acima de 10, antes | Depois |
|---|---|---|
| `public/js` (sem `vendor/`) | 97 | 94 |
| `public/js/vendor/` (código de terceiros) | 4 | 4 |
| `shared/` | 9 | 9 |
| `server/` | 26 | 26 |
| **Total** | **136** | **133** |

Na carga de álbuns (`services/albums/`, `stores/albumLoad.js`, `utils/TaskQueue.js`, os modelos da carga): **2 antes** (`_holdFor` 12, `_enrichOne` 12), **0 depois**. A terceira que saiu da lista é a função de estatísticas da loja de inventário (12; virou regra pura dentro do limite, pela UAT-18). Por consequência da UAT-19, `handleRemoveAlbum` baixou de 21 para 19 e segue na lista.

As quatro issues, conferidas no código de hoje:

| Issue | Ainda existia? | Onde (arquivo:linha na `main`) |
|---|---|---|
| UAT-194 | sim, com outros números | `public/js/services/albums/AlbumLoadService.js:379` (`_holdFor`, 12) e `:533` (`_enrichOne`, 12). A `find` do `CatalogAdapter`, citada na issue com 12, já estava dentro do limite. |
| UAT-14 | em parte | só `public/js/views/SaveAllView.js:5-6` (SDK 11.6.1 do Firebase por CDN). `services/PlaylistsService.js` saiu na F60 e `stores/albums.js` na F48. |
| UAT-18 | em parte | `public/js/stores/inventory.js:6-9` (repositório, `app.js`, cache, outra loja), `public/js/stores/UserStore.js:1` (serviço de login), `public/js/stores/SpotifyEnrichmentStore.js:16-18` (banco, repositório, cache). `stores/albums.js` já não importava o Firestore. `stores/playlists.js` tem 169 linhas. |
| UAT-19 | em parte | `public/js/views/SeriesView.js:16` e `public/js/components/series/SeriesEventHandler.js:10` (`firebase-init.js`); `public/js/components/TopNav.js:8` e `public/js/stores/inventory.js:7` (`db` de `app.js`, o ciclo); `public/js/controllers/PlaylistsController.js:100` (`PlaylistRepository`) e `:39, :56, :85, :186, :201, :245` (`app.js`); `controllers/BlendingController.js:113`, `components/playlists/PlaylistsDragHandler.js:65`, `components/playlists/SavedPlaylistsController.js:95`, `views/playlists/PlaylistsDragDrop.js:65, :74`, `services/PlaylistPersistenceService.js:162` (`app.js`). `SeriesController` e `BlendingController` já não importavam o `userRankingRepository`. |

## Architecture Approach
<!-- How it fits arch.md; components affected; what this plan refines in arch.md and data-model.md. -->
O desenho ficou em `docs/specs/arch.md`, seção «O serviço de carga dentro do limite de complexidade (F58)». Nada muda em `data-model.md`: nenhum dado gravado mudou. A ADR-0019 segue valendo (um dono para a carga); o texto dela diz agora que o dono tem dois colaboradores nomeados.

**A regra do corte.** Uma função acima do limite não é partida ao meio: sai dela uma responsabilidade com nome. Duas costuras, as que as features anteriores apontaram:

| Costura | O que estava junto | Para onde foi | Por quê ali |
|---|---|---|---|
| A espera | dentro de `_holdFor`: o que a espera vira, o temporizador, a pausa da fila, o aviso à pessoa; dentro de `_addHeld`: pedir de novo quando a espera acaba | as regras para `models/albumLoadHold.js` (puras); o que decorre delas para `services/albums/LoadHold.js`; o estado para `stores/albumLoad.js` | a espera começava dentro de uma tarefa e não mudava nada no store, por isso o `AlbumAsks` olhava a cada segundo. Como estado do store, quem assina fica sabendo na hora, e a regra («entre na conta» ganha de «aguarde») se testa sem fila nem relógio |
| O pedido por fonte | dentro de `_enrichOne`: decidir se pergunta, marcar como carregando, perguntar, aplicar sobre o álbum mais novo, publicar, tratar a falha | as regras para `models/albumSourceAsk.js` (`awaitsSource`, `overNewestAlbum`, `sourceOutcome`); «só o último pedido escreve» para `utils/LatestOnly.js`; no serviço ficam `_enrichOne` (decide), `_askAndPublish` (pergunta e publica) e `_failSource` | cada pedaço tem uma pergunta própria e se testa sozinho; o serviço fica com a ordem das coisas |

**Opções para a espera.**

| Opção | O que resolve | O que custa |
|---|---|---|
| A. Só partir `_holdFor` em funções menores dentro do serviço | o número | a espera continua invisível para quem lê a carga: o relógio de 1 s fica |
| **B. Regras puras, um colaborador e o estado no store — escolhida** | o número, o relógio e o teste da regra sem fila | três arquivos onde havia um; o store avisa uma vez a mais quando a espera começa e quando acaba |
| C. O `LoadHold` escrever direto no store | um arquivo a menos de ligação | o store de carga passaria a ter dois escritores; a regra «só o serviço escreve» (teste da F56) cairia |

**O que apareceu ao tirar o relógio.** Ele não via só a espera: via também a carga parada (`stop()`, o «Clear Cache»), que aumentava a geração do serviço sem mudar nada no store. O teste que já existia para isso (`AlbumAsks.test.js`, «the load is stopped in the middle») ficou vermelho sem o relógio. A parada virou estado do store (`stopGeneration` / `isStopped`).

**As dívidas de arquitetura.** Cada uma no dono que a regra nomeia: a ADR-0017 manda o estado na loja e o resto num serviço; a ADR-0016 manda a tela falar com serviço. O app não tem raiz de composição: como na carga (`albumLoading.js`), cada assunto ganhou um arquivo que monta o serviço com as fontes de verdade (`inventoryWiring.js`, `userSession.js`), e o `app.js`, que monta o app, entrega ao menu e à tela de migração o que alcança o banco.

## Technical Design
<!-- Data flow first · components/modules (what each receives, renders or returns, emits) · API/interface
     changes · explicit file paths. Each component names the REQ-xx it addresses. -->
**Fluxo da espera.** Uma porta (o catálogo, uma fonte) lança um erro com `hold` → `LoadHold.add` o pega dentro da tarefa → `LoadHold.hear(hold, fila)` → `holdAfter` diz o que a espera vira → a fila do servidor pausa, se for o caso → `publish(espera)` → `AlbumLoadService` escreve `store.setHold(espera)` → o store avisa quem assinou → o `AlbumAsks` lê `store.getHold()` e decide (`readAsk`, `holdWait`). No fim da espera (`end`, pelo temporizador, por `resume()`, por uma carga nova): a fila retoma, `publish(null)`, quem esperava pede de novo.

| Peça | Arquivo | O que faz | REQ |
|---|---|---|---|
| Regras da espera (nova) | `public/js/models/albumLoadHold.js` | `holdAfter`, `isNewsToThePerson`, `stopsServerQueue`, `resumesIn`: puras | REQ-01, REQ-02 |
| `LoadHold` (nova) | `public/js/services/albums/LoadHold.js` | a espera em vigor: `hear`, `end`, `endIf`, `startLoad`, `add`, `current`; recebe a fila do servidor e as portas `publish` e `onNotice` | REQ-01, REQ-02 |
| Loja de carga | `public/js/stores/albumLoad.js` | `setHold` / `getHold`; `stopGeneration` / `isStopped` | REQ-02 |
| Regras do pedido por fonte (nova) | `public/js/models/albumSourceAsk.js` | `awaitsSource`, `hasAnswered`, `overNewestAlbum`, `sourceOutcome`: puras | REQ-01 |
| `LatestOnly` (nova) | `public/js/utils/LatestOnly.js` | «só o último pedido de uma chave conta»; a contagem nunca recomeça, então um pedido esquecido por `clear()` nunca volta a ser o último | REQ-01 |
| Serviço de carga | `public/js/services/albums/AlbumLoadService.js` | perde `_addHeld`, `_holdFor`, `_tellHold`, `_endHold`, `_endHoldOf`, `_newAsk`, `_overNewestAlbum`; ganha `_askAndPublish`, `_failSource`; `stop()` avisa o store; `getHold()` e `resume()` seguem na interface | REQ-01, REQ-02 |
| `AlbumAsks` | `public/js/services/albums/AlbumAsks.js` | sem `setInterval`; lê a espera do store; um prazo único enquanto há espera | REQ-02 |
| Regra do prazo da espera (nova) | `holdWait` em `public/js/models/albumAsk.js` | desde quando o pedido está sob a espera, se passou do tempo de uma busca, daqui a quanto olhar de novo | REQ-02 |
| Medidor (novo) | `test/architecture/support/measureComplexity.js` | roda a regra `complexity` do ESLint e devolve as funções acima do limite; também imprime a tabela | REQ-01, REQ-03 |
| Lista (nova) | `test/architecture/complexityAllowlist.js` | `{ 'arquivo:função': número }` das 94 funções de `public/js` acima de 10, com quem pode baixá-la | REQ-03 |
| Tela de migração | `public/js/views/SaveAllView.js`, `public/js/app.js` | a tela recebe `{ migrationUtility, getUserId }` da rota; nenhum `import` de Firebase | REQ-04 |
| Loja de inventário | `public/js/stores/inventory.js` | estado e setters: `reset`, `setLoading`, `setAlbums`, `setError`, `replaceAlbums` | REQ-05 |
| `InventoryService` (novo) | `public/js/services/inventory/InventoryService.js`, `inventoryWiring.js` | o que a loja fazia: trocar de pessoa, ler, acrescentar, atualizar, preço otimista, remover; recebe `createRepository` | REQ-05, REQ-06 |
| Estatísticas (nova) | `public/js/models/inventoryStats.js` | `inventoryStatistics(albums)`, pura, dentro do limite | REQ-05 |
| Loja de usuário | `public/js/stores/UserStore.js` | estado e setters: `setUser`, `setLoading`, `setError` | REQ-05 |
| `UserSessionService` (novo) | `public/js/services/auth/UserSessionService.js`, `userSession.js` | ouve o login e escreve na loja; `loginWithGoogle`, `loginWithApple`, `logout` (que eram da loja e nenhuma tela chama) | REQ-05 |
| Tela de álbuns e menu | `public/js/views/SeriesView.js`, `public/js/components/series/SeriesEventHandler.js`, `public/js/components/TopNav.js`, `public/js/controllers/InventoryController.js`, `public/js/components/InventoryAddModal.js` | sem `import` do banco nem do `app.js`; o inventário é pedido ao serviço | REQ-06 |

**Interfaces que mudaram.** `new AlbumAsks({ service, store })` não aceita mais `checkEveryMs`. `new SaveAllView({ migrationUtility, getUserId })` e `new TopNav({ migrationUtility })` recebem o que antes importavam. `inventoryStore` não tem mais `loadAlbums`, `addAlbum`, `updateAlbum`, `updatePrice`, `removeAlbum`, `isInInventory`, `init`, `handleUserChange`: são do `inventoryService`. `userStore` não tem mais `loginWithGoogle`, `loginWithApple`, `logout`, `handleAuthChange`.

## Segunda fatia (2026-11-19, ramo `fix/f58-layers-and-lint-gate`): o que restava da UAT-18 e da UAT-19

**O que restava**, lido na lista de `test/architecture/layerBoundaries.test.js` na `main` em `44b5dd0`: uma loja (`stores/SpotifyEnrichmentStore.js`: Firestore, repositório e cache), um controlador que criava o seu repositório (`controllers/PlaylistsController.js:100`) e quatro arquivos que importavam o `app.js` para pegar `db` e `auth` (`PlaylistsController`, `BlendingController`, `PlaylistsDragHandler`, `SavedPlaylistsController`).

**A loja do Spotify não tinha estado.** Era um leitor do Firestore com um cache, usado por um caminho só: a fonte de popularidade da carga (`services/albums/adapters/spotifyPopularitySource.js`, F69), que já a recebia como porta (`store: { get, save }`). Virou o que é.

| Opção | O que resolve | O que custa |
|---|---|---|
| A. Mover o arquivo para `services/` como está | o teste | segue importando o banco e criando o repositório: o serviço não se testa sem Firebase |
| **B. Serviço que recebe o repositório, e um arquivo de montagem — escolhida** | o teste, e o serviço se testa com o `fakeFirestore` | dois arquivos onde havia um |
| C. A fonte de popularidade falar direto com o repositório | um arquivo a menos | a fonte passaria a conhecer a regra de validade e o tratamento de falha de leitura; e os arquivos de `adapters/` eram de outro ramo |

| Peça | Arquivo | O que faz | REQ |
|---|---|---|---|
| `StoredSpotifyPopularity` (novo) | `public/js/services/spotify/StoredSpotifyPopularity.js` | `get(artist, title)`: o dado guardado quando ainda é aceito, senão `null` (também quando o banco não pôde ser lido); `save(artist, title, data)`: grava e lança se não pôde. Sem estado; não importa nada | REQ-07 |
| Montagem (nova) | `public/js/services/spotify/spotifyPopularityWiring.js` | o serviço com o `SpotifyEnrichmentRepository`, o banco e um `CacheManager` próprio, como antes | REQ-07 |
| Composição da carga | `public/js/services/albums/albumLoading.js` | entrega o serviço montado à fonte de popularidade | REQ-07 |
| Removido | `public/js/stores/SpotifyEnrichmentStore.js` | com ele saíram os métodos que nada chamava: a remoção de órfãos na leitura (pedia uma função que ninguém passava), `hasValidEnrichment`, `delete`, `getCount`, `normalizeKey` | REQ-07 |

**O dado não mudou.** A coleção `spotify_enrichment`, o nome do documento (`artista-álbum` normalizado), os campos e a regra de validade ficam no `SpotifyEnrichmentRepository`, que não foi tocado. Os nove casos de `StoredSpotifyPopularity.test.js` rodaram primeiro contra a loja antiga (todos verdes) e depois contra o serviço.

**As playlists: um lugar monta o serviço.** O `PlaylistsService` já recebia o banco e o cache no construtor; quem os trazia era cada chamador, de dentro do `app.js` (por `import()` tardio, para o ciclo não quebrar a carga). Agora `services/playlists/playlistsWiring.js` os entrega, com quem está na conta, e `getPlaylistsService()` não recebe argumento.

| Peça | Arquivo | O que muda | REQ |
|---|---|---|---|
| Montagem (nova) | `public/js/services/playlists/playlistsWiring.js` | `getPlaylistsService()`: o serviço único, feito na primeira vez que alguém pede (como antes), com `db`, `cacheManager` e `signedInUserId: () => auth.currentUser?.uid \|\| 'anonymous-user'`; liga o `watchStore()` | REQ-08 |
| `PlaylistsService` | `public/js/services/PlaylistsService.js` | perde a fábrica `getPlaylistsService(db, cacheManager)`; ganha `findBatch(seriesId, batchName)` (o que o controlador fazia com o repositório) e `saveCurrentBatch` usa quem está na conta quando ninguém é nomeado | REQ-08 |
| Controlador das playlists | `public/js/controllers/PlaylistsController.js` | sem `import()` do `app.js`, do cache e do `PlaylistRepository`; pede `findBatch` e `saveCurrentBatch({ batchName })` | REQ-08 |
| Blend, arrasto, lista das guardadas, tela | `controllers/BlendingController.js`, `components/playlists/PlaylistsDragHandler.js`, `components/playlists/SavedPlaylistsController.js`, `views/PlaylistsView.js` | pedem o serviço à montagem | REQ-08 |
| `app.js` | `public/js/app.js` | importa o `firebase-init.js` pelo efeito e não exporta nada | REQ-08 |

**O que muda no tempo, e por que não muda o comportamento.** Três chamadas eram feitas depois de um `import()` e agora são diretas: (1) o blend entra em «modo criar» logo depois de pôr as playlists na loja, e não alguns instantes depois: o estado final é o mesmo, e o rascunho é escrito uma vez em vez de removido e escrito; (2) o arrasto pede `moveTrack` numa microtarefa (`queueMicrotask`), depois de o tratador do Sortable devolver, como acontecia; (3) o controlador das playlists pede o serviço sem esperar. Uma falha ao entrar em «modo criar» segue só avisada no console.

**Regras novas no teste das camadas.** `app.js` não tem `export`; só a montagem faz `new PlaylistsService`, e a tela não importa a classe; o `PlaylistsService` não importa Firebase, cache nem tela; nenhuma tela, componente ou controlador lê `auth.currentUser`.

**Riscos da segunda fatia.** Sem navegador: o arrasto (a ordem entre o Sortable e o redesenho) e a ordem de importação (a montagem das playlists importa o `firebase-init.js`, que o `app.js` importa antes de tudo) não foram vistos. Outro ramo (`fix/f70-small-defects`) mexe no inventário, na busca e nos adaptadores da carga: nenhum arquivo dele foi tocado; o comentário de `services/albums/adapters/spotifyPopularitySource.js:14` ainda diz `SpotifyEnrichmentStore` e fica para depois da junção.

## Dependencies
<!-- New dependencies with their justification — aligned with constitution.md and PRINCIPLES.md (Constitution
     Check); contradicting either needs a recorded decision first (mjrp-recording-decisions). -->
Nenhuma. O teste do limite usa o `eslint` que já está no `package.json` (`devDependencies`), pela sua interface de programa.

## Documents Consulted
<!-- arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, the NFR nodes. -->
`AGENTS.md`, `PRINCIPLES.md` §I.3, `docs/specs/constitution.md`, `docs/specs/arch.md` (as seções da carga, 11, 17, 19 e a da F56), `docs/decisions/0016-service-layer-extraction.md`, `0017-pure-state-stores.md`, `0019-one-owner-for-the-album-load.md`, `docs/specs/uat.md` (UAT-194, UAT-14, UAT-18, UAT-19, UAT-11), `reports/audits/2026-11-19-mjrpalbumblender-v0-load-architecture-analysis.md` (seção 6), `docs/manual/01_System_Architecture.md` (seção 6), `docs/manual/07_Frontend_Data_Infra.md`.

## Risks & Considerations
- **Sem navegador.** O implementador não viu nenhuma tela. O que os testes não veem: a ordem de importação no `app.js` (o `userSession.js` precisa do Firebase iniciado; está logo depois do `firebase-init.js`), o menu e a tela de migração montados com o que recebem, e a tela de álbuns com uma espera de verdade. A prova é a TASK-13.
- **O inventário guarda dado da pessoa.** A F60 consertou perda de dado ali (UAT-198). O código de troca de pessoa foi movido sem mudar a ordem das coisas, e os seis testes da UAT-198 passam contra o serviço.
- **Uma notificação a mais.** O store de carga avisa quando a espera começa e acaba, e quando a carga é parada. As telas redesenham o mesmo estado.
- **A lista das 94.** Ela não conserta nada: impede piorar. Quem mexer numa função listada e a baixar precisa tirar a linha, senão o teste falha (é o que faz a lista diminuir).
- **Outros ramos.** F62 e F57 estavam abertos. Não foi tocado o código do blend, das playlists, da exportação, do Spotify, da busca da Home, da classificação nem do modal de edição de série. `components/series/SeriesEventHandler.js` (três linhas) e `controllers/InventoryController.js` foram tocados; se a F57 mexeu no primeiro, o conflito é de três linhas.

## A tabela medida

Todas as funções acima de 10 em 2026-11-19, antes da feature, com o número depois. «10 ou menos» é a função que saiu da lista. A linha é a da `main` em `50e7b2e`.

| Função | Arquivo:linha | Antes | Depois |
|---|---|---|---|
| `fetchRankingForAlbum` | `server/lib/fetchRanking.js:99` | 139 | 139 |
| `_albumFromResponse` | `server/lib/services/GenerationService.js:75` | 65 | 65 |
| `arrow function` | `public/js/vendor/uFuzzy.js:2` | 54 | 54 |
| `consolidateRanking` | `server/lib/ranking.js:31` | 49 | 49 |
| `toCanonical` | `public/js/transformers/TrackTransformer.js:55` | 40 | 40 |
| `constructor` | `public/js/models/Track.js:36` | 39 | 39 |
| `generate` | `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js:57` | 38 | 38 |
| `extractRankingPayload` | `server/lib/normalize.js:277` | 34 | 34 |
| `handleExportToAppleMusic` | `public/js/views/playlists/PlaylistsExport.js:67` | 33 | 33 |
| `generate` | `public/js/algorithms/MJRPBalancedCascadeV0Algorithm.js:54` | 32 | 32 |
| `arrow function` | `public/js/algorithms/mixins/TrackEnrichmentMixin.js:101` | 32 | 32 |
| `handleExportToSpotify` | `public/js/views/playlists/PlaylistsExport.js:234` | 31 | 31 |
| `arrow function` | `public/js/ranking/BalancedRankingStrategy.js:92` | 30 | 30 |
| `arrow function` | `public/js/vendor/uFuzzy.js:2` | 30 | 30 |
| `normalizeRankingEntry` | `server/lib/normalize.js:249` | 28 | 28 |
| `arrow function` | `shared/curation.js:134` | 26 | 26 |
| `async arrow function` | `server/routes/debug.js:53` | 24 | 24 |
| `curate` | `shared/curation.js:253` | 23 | 23 |
| `generate` | `public/js/algorithms/TopNAlgorithm.js:52` | 22 | 22 |
| `generate` | `public/js/algorithms/LegacyRoundRobinAlgorithm.js:52` | 21 | 21 |
| `handleRemoveAlbum` | `public/js/components/series/SeriesEventHandler.js:213` | 21 | 19 **(F58)** |
| `filterAlbums` | `public/js/services/SeriesFilterService.js:20` | 21 | 21 |
| `execute` | `public/js/services/album-search/classification/AIWhitelistStrategy.js:20` | 21 | 21 |
| `getAlbumDetails` | `public/js/services/musickit/MusicKitCatalog.js:72` | 21 | 21 |
| `run` | `server/scripts/testRankingCall.js:5` | 21 | 21 |
| `arrow function` | `public/js/algorithms/LegacyRoundRobinAlgorithm.js:306` | 20 | 20 |
| `arrow function` | `public/js/algorithms/LegacyRoundRobinAlgorithm.js:366` | 20 | 20 |
| `runSwapBalancing` | `public/js/algorithms/mixins/PlaylistBalancingMixin.js:30` | 20 | 20 |
| `arrow function` | `public/js/algorithms/mixins/TrackEnrichmentMixin.js:170` | 20 | 20 |
| `preloadSeriesThumbnails` | `public/js/components/blend/BlendSeriesSelector.js:88` | 20 | 20 |
| `arrow function` | `public/js/controllers/SeriesController.js:415` | 20 | 20 |
| `exportPlaylists` | `public/js/services/SpotifyExportService.js:25` | 20 | 20 |
| `arrow function` | `public/js/components/ranking/TracksRankingComparison.js:49` | 19 | 19 |
| `updateAlbums` | `public/js/views/SeriesView.js:181` | 19 | 19 |
| `enforceAlbumCoverage` | `public/js/algorithms/SDraftBalancedAlgorithm.js:402` | 18 | 18 |
| `arrow function` | `public/js/components/ui/AlbumCardRenderer.js:213` | 18 | 18 |
| `getArtistAlbums` | `public/js/services/musickit/MusicKitCatalog.js:125` | 18 | 18 |
| `filterAlbums` | `public/js/views/albums/AlbumsFilters.js:15` | 18 | 18 |
| `arrow function` | `shared/curation.js:232` | 18 | 18 |
| `arrow function` | `public/js/algorithms/LegacyRoundRobinAlgorithm.js:82` | 17 | 17 |
| `arrow function` | `public/js/algorithms/LegacyRoundRobinAlgorithm.js:288` | 17 | 17 |
| `arrow function` | `public/js/components/ui/AlbumCardRenderer.js:199` | 17 | 17 |
| `renderRankingBadge` | `public/js/components/ui/Card.js:265` | 17 | 17 |
| `tryRecoverRankingFromText` | `server/lib/normalize.js:87` | 17 | 17 |
| `attempt` | `server/scripts/testRankingRetry.js:5` | 17 | 17 |
| `generate` | `public/js/algorithms/SDraftBalancedAlgorithm.js:57` | 16 | 16 |
| `renderRow` | `public/js/components/ranking/TracksTable.js:59` | 16 | 16 |
| `constructor` | `public/js/models/Album.js:12` | 16 | 16 |
| `addAlbum` | `public/js/repositories/InventoryRepository.js:32` | 16 | 16 |
| `arrow function` | `public/js/vendor/uFuzzy.js:2` | 16 | 16 |
| `async arrow function` | `server/lib/normalize.js:226` | 16 | 16 |
| `runFase4SwapBalancing` | `shared/curation.js:423` | 16 | 16 |
| `generate` | `public/js/algorithms/SDraftOriginalAlgorithm.js:59` | 15 | 15 |
| `applyBEAData` | `public/js/helpers/BEAEnrichmentHelper.js:18` | 15 | 15 |
| `applyEnrichmentToAlbum` | `public/js/helpers/SpotifyEnrichmentHelper.js:25` | 15 | 15 |
| `restoreDraft` | `public/js/services/PlaylistsService.js:286` | 15 | 15 |
| `arrow function` | `public/js/utils/SafeDOM.js:58` | 15 | 15 |
| `arrow function` | `server/lib/fetchRanking.js:291` | 15 | 15 |
| `arrow function` | `public/js/algorithms/LegacyRoundRobinAlgorithm.js:267` | 14 | 14 |
| `mergeSmallPlaylists` | `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js:303` | 14 | 14 |
| `isSwapValid` | `public/js/algorithms/mixins/PlaylistBalancingMixin.js:97` | 14 | 14 |
| `arrow function` | `public/js/algorithms/mixins/TrackEnrichmentMixin.js:80` | 14 | 14 |
| `open` | `public/js/components/InventoryEditModal.js:12` | 14 | 14 |
| `buildBadges` | `public/js/components/ui/TrackRow.js:161` | 14 | 14 |
| `migrate` | `public/js/migration/MigrationUtility.js:150` | 14 | 14 |
| `matches` | `public/js/models/seriesFilter.js:49` | 14 | 14 |
| `arrow function` | `public/js/ranking/BEARankingStrategy.js:25` | 14 | 14 |
| `arrow function` | `public/js/ranking/BalancedRankingStrategy.js:71` | 14 | 14 |
| `searchTrack` | `public/js/services/SpotifyService.js:205` | 14 | 14 |
| `execute` | `public/js/services/album-search/classification/TitleKeywordStrategy.js:50` | 14 | 14 |
| `execute` | `public/js/services/album-search/classification/TypeSanityCheckStrategy.js:20` | 14 | 14 |
| `arrow function` | `public/js/services/musickit/MusicKitCatalog.js:42` | 14 | 14 |
| `generateEqualizer` | `public/js/utils/SvgGenerator.js:18` | 14 | 14 |
| `retryWithBackoff` | `public/js/utils/retry.js:34` | 14 | 14 |
| `callProvider` | `server/lib/aiClient.js:6` | 14 | 14 |
| `verify` | `server/lib/auth/verifyIdToken.js:61` | 14 | 14 |
| `arrow function` | `shared/curation.js:146` | 14 | 14 |
| `arrow function` | `shared/curation.js:204` | 14 | 14 |
| `arrow function` | `shared/curation.js:275` | 14 | 14 |
| `buildRankingSummary` | `shared/curation.js:469` | 14 | 14 |
| `_fetchAlbumFromAPI` | `public/js/api/client.js:103` | 13 | 13 |
| `normalizeAlbumData` | `public/js/api/client.js:240` | 13 | 13 |
| `renderRecipeCard` | `public/js/components/blend/BlendRecipeCard.js:81` | 13 | 13 |
| `arrow function` | `public/js/controllers/InventoryController.js:155` | 13 | 13 |
| `applySpotifyData` | `public/js/helpers/SpotifyEnrichmentHelper.js:86` | 13 | 13 |
| `loadAlbumsFromLocalStorage` | `public/js/migration/MigrationUtility.js:104` | 13 | 13 |
| `_writeCurrentBatch` | `public/js/services/PlaylistsService.js:372` | 13 | 13 |
| `filterSeries` | `public/js/services/SavedPlaylistsFilterService.js:22` | 13 | 13 |
| `classify` | `public/js/services/album-search/AlbumTypeClassifier.js:41` | 13 | 13 |
| `arrow function` | `public/js/services/musickit/MusicKitCatalog.js:89` | 13 | 13 |
| `renderGenerateButton` | `public/js/views/BlendingMenuView.js:201` | 13 | 13 |
| `arrow function` | `server/lib/fetchRanking.js:211` | 13 | 13 |
| `arrow function` | `server/lib/fetchRanking.js:269` | 13 | 13 |
| `arrow function` | `server/lib/scrapers/besteveralbums.js:360` | 13 | 13 |
| `async arrow function` | `server/routes/debug.js:34` | 13 | 13 |
| `albumTitlesIn` | `server/routes/handlers/ai.js:17` | 13 | 13 |
| `runTests` | `server/scripts/verifyRankingFlow.js:9` | 13 | 13 |
| `isSwapValid` | `shared/curation.js:411` | 13 | 13 |
| `buildRankingSummary` | `public/js/algorithms/BaseAlgorithm.js:140` | 12 | 12 |
| `handleUnderDurationPlaylists` | `public/js/algorithms/SDraftBalancedAlgorithm.js:308` | 12 | 12 |
| `arrow function` | `public/js/api/client.js:216` | 12 | 12 |
| `attachListeners` | `public/js/components/TopNav.js:232` | 12 | 12 |
| `arrow function` | `public/js/components/series/ArtistScanner.js:157` | 12 | 12 |
| `render` | `public/js/components/ui/Pager.js:34` | 12 | 12 |
| `loadSeriesFromLocalStorage` | `public/js/migration/MigrationUtility.js:59` | 12 | 12 |
| `describeQuery` | `public/js/models/seriesFilter.js:30` | 12 | 12 |
| `arrow function` | `public/js/ranking/BalancedRankingStrategy.js:158` | 12 | 12 |
| `arrow function` | `public/js/services/MusicKitSearchAdapter.js:43` | 12 | 12 |
| `calculate` | `public/js/services/album-search/ScoreCalculator.js:30` | 12 | 12 |
| `execute` | `public/js/services/album-search/classification/AppleMetadataStrategy.js:15` | 12 | 12 |
| `_holdFor` | `public/js/services/albums/AlbumLoadService.js:379` | 12 | 10 ou menos **(F58)** |
| `_enrichOne` | `public/js/services/albums/AlbumLoadService.js:533` | 12 | 10 ou menos **(F58)** |
| `arrow function` | `public/js/stores/inventory.js:285` | 12 | 10 ou menos **(F58)** |
| `sortBy` | `public/js/utils/FilterUtils.js:57` | 12 | 12 |
| `render` | `public/js/views/BlendingMenuView.js:47` | 12 | 12 |
| `arrow function` | `public/js/views/albums/AlbumsScopedRenderer.js:44` | 12 | 12 |
| `describeProviderError` | `server/lib/aiProviderOutcome.js:62` | 12 | 12 |
| `extractFromCandidate` | `server/lib/normalize.js:145` | 12 | 12 |
| `trimOverDurationPlaylists` | `public/js/algorithms/mixins/DurationTrimmingMixin.js:28` | 11 | 11 |
| `readServerResult` | `public/js/api/serverResult.js:99` | 11 | 11 |
| `constructor` | `public/js/components/blend/BlendIngredientsPanel.js:69` | 11 | 11 |
| `render` | `public/js/components/playlists/TrackItem.js:43` | 11 | 11 |
| `render` | `public/js/components/ui/TrackRow.js:41` | 11 | 11 |
| `arrow function` | `public/js/ranking/SpotifyRankingStrategy.js:26` | 11 | 11 |
| `arrow function` | `public/js/services/SeriesFilterService.js:50` | 11 | 11 |
| `search` | `public/js/services/album-search/AlbumSearchService.js:37` | 11 | 11 |
| `arrow function` | `public/js/vendor/uFuzzy.js:2` | 11 | 11 |
| `render` | `public/js/views/InventoryView.js:33` | 11 | 11 |
| `renderContent` | `public/js/views/PlaylistsView.js:214` | 11 | 11 |
| `arrow function` | `public/js/views/albums/AlbumsFilters.js:47` | 11 | 11 |
| `function` | `public/js/workers/search.worker.js:51` | 11 | 11 |
| `function` | `server/lib/asyncRoute.js:21` | 11 | 11 |
| `upstreamErrorFrom` | `server/lib/outcome.js:109` | 11 | 11 |
| `arrow function` | `server/lib/scrapers/besteveralbums.js:401` | 11 | 11 |
| `generateAlbum` | `server/lib/services/GenerationService.js:32` | 11 | 11 |
| `testScraper` | `server/scripts/testMusicboardScraper.js:9` | 11 | 11 |

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 20:48 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `complexityLimit.test.js`: a regra `complexity` do ESLint nos arquivos da carga; uma função de complexidade 11 de teste é vista, uma de 10 não | nenhuma função da carga acima de 10 | aptidão | sim |
| REQ-01 | a suíte da carga que já existia (`AlbumLoadService.test.js`, `.guests.test.js`, `emptyTrust.test.js`, `adapters.test.js`, `catalogIdentity.test.js`) sem mudar expectativa; `albumSourceAsk.test.js`, `LatestOnly.test.js` | a carga se comporta como antes | serviço, modelo | sim |
| REQ-02 | `albumLoadHold.test.js` (16 casos da regra), `LoadHold.test.js` (14), `albumLoad.test.js` (a espera e a parada no store), `AlbumLoadService.test.js` (a espera está no store e quem assina é avisado), `AlbumAsks.test.js` (sem intervalo; fica sabendo pelo store em menos de 500 ms; a espera que acaba antes do prazo; nenhum prazo sobra depois de largado), `albumAsk.test.js` (`holdWait`) | a espera é estado; o pedido não tem relógio | modelo, serviço, loja | sim |
| REQ-03 | `complexityLimit.test.js` contra `complexityAllowlist.js`: função fora da lista, função que piorou, função consertada que ficou na lista | a lista só diminui | aptidão | sim |
| REQ-04 | `firestoreBehindRepositories.test.js` (4 regras); `SaveAllView.test.js` (usa o utilitário recebido; migra para quem está logado) | um Firebase; o Firestore só nos repositórios | aptidão, tela | sim |
| REQ-05 | `layerBoundaries.test.js` (lojas); `inventory.test.js`, `UserStore.test.js` (só estado); `InventoryService.test.js`, `InventoryService.userChange.test.js` (os casos da UAT-198 contra o serviço), `UserSessionService.test.js`, `inventoryStats.test.js` | loja pura; o comportamento do inventário e do login como antes | aptidão, loja, serviço, modelo | sim |
| REQ-06 | `layerBoundaries.test.js` (tela e `app.js`); `InventoryController.delete.test.js` | a tela não importa o banco; nada importa o `app.js` fora da lista | aptidão, controlador | sim |
| todos | a tela de álbuns carrega, um blend gera, uma espera 401 de visitante avisa uma vez | nada mudou à vista | navegador | não (TASK-13, do integrador) |
| REQ-07 | `layerBoundaries.test.js` (lojas: lista vazia); `StoredSpotifyPopularity.test.js` (9 casos com o `fakeFirestore`: o documento e os campos gravados; ler sem acento e sem caixa; nada guardado; registro antigo aceito por 30 dias; depois de 30 dias não responde e o documento fica; outro formato ou sem id; falha de leitura dá `null`; falha de escrita lança; o cache recebido evita a segunda leitura); `spotifyPopularityOnePath.test.js` (só a composição conhece a montagem; só a montagem conhece o serviço e o repositório) | loja nenhuma alcança o banco; o dado gravado segue lido | aptidão, serviço | sim |
| REQ-08 | `layerBoundaries.test.js` (tela e `app.js`: listas vazias; `app.js` sem `export`; um lugar faz o serviço; a tela não lê o login); `playlistsWiring.test.js` (7 casos: o mesmo serviço para todos; guardar sem nomear a pessoa vai para quem está na conta, lido na hora; sem ninguém na conta vai para «anonymous-user»; `findBatch` lê o lote na ordem; lote inexistente; o serviço vigia a loja desde que é feito) | o serviço recebe o banco e a pessoa num lugar só | aptidão, serviço | sim |
| REQ-08 | as suítes da F60 e da F62 (`PlaylistsController.save`, `.edit`, `.restore`, `.albums`, `BlendingController.load`, `PlaylistsService.*`) sem mudar expectativa (só a preparação: o que era simulado no `app.js` é simulado no `firebase-init.js`) | as playlists se comportam como antes | controlador, serviço | sim |
| REQ-07, REQ-08 | gerar, editar, arrastar, guardar, abrir um lote guardado; a popularidade do Spotify de um álbum guardado e de um novo | nada mudou à vista | navegador | não (TASK-20, do integrador) |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): Nenhuma muda o comportamento. Achados escritos no relatório de entrega: a tela de migração provavelmente não abria (o segundo Firebase não tinha app iniciado); `InventoryController.handleUpdatePrice` chama `updatePrice` sem a moeda.
