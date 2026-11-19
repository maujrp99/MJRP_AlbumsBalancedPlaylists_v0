<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F56: Blend e edição de playlists pelo serviço de carga · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Diagnóstico: os caminhos que carregavam por fora

Lido no código da `main` em `d210f35`, em 2026-11-19, antes de mudar.

| # | Caminho | Onde (arquivo:linha na `main`) | O que fazia de errado |
|---|---|---|---|
| 1 | Laço do blend | `controllers/BlendingController.js:125-159` (`loadAlbumsFromSeries`): `apiClient.fetchAlbum` em `:133`, ranking em `:138`, prateleira em `:154-156` | um álbum por vez, sem prazo; busca de novo o que a tela de álbuns tem; procura por texto, sem a edição escolhida; a falha vira `console.warn` em `:150` |
| 2 | Laço da edição de playlists | `controllers/PlaylistsController.js:126-193` (`loadAlbumsForSeries`): `apiClient.fetchMultipleAlbums` em `:172`, prateleira em `:166-167` e `:177` | igual ao 1; os erros só são contados no console (`:183-185`) |
| 3 | Pergunta antes de gerar | `controllers/PlaylistsController.js:242-248` | decide «tem nota?» olhando a prateleira, não o estado das fontes |
| 4 | Salvar a edição recarrega tudo | `views/helpers/SeriesModalsManager.js:36-42` chama `loadScope(..., true)`; `controllers/SeriesController.js:143-145` passa `skipCache` a `requestLoad`; `:171` chama `albumLoadService.load({ fresh })`; `services/albums/AlbumLoadService.js:103` abre geração | `fresh` zera o estado de todas as séries e ignora o guardado |
| 5 | Injeção de álbuns | `components/series/SeriesEditModal.js:148-188`; `services/SeriesService.js:237-293` (`injectAlbumsIntoViewCache`: pede notas em `:244-256` por `BEAEnrichmentHelper.enrichAlbum`, escreve na prateleira em `:285` e `:289`); também chamada em `:200` e `:457` | notas pedidas fora da fila, sem limite; escreve na prateleira por fora das gerações |
| 6 | «Refetch» | `controllers/SeriesController.js:332-363`; `services/SeriesService.js:305-478` (`refetchAlbumMetadata`: notas em `:325`, Spotify em `:351`, injeção em `:457`, documento compartilhado em `:465`, cache antigo em `:470`); `services/albums/AlbumLoadService.js:183-192` (`adoptAlbum`) | fora da fila; `adoptAlbum` escreve no store sem conferir a geração e grava «notas prontas» mesmo quando as duas fontes falharam |
| 7 | Tirar álbum e apagar série | `components/series/SeriesEventHandler.js:237` e `:294` (`albumsStore.removeAlbum`); `services/SeriesService.js:144-145` | escrevem na prateleira por fora da carga |
| 8 | Cliente antigo | `api/client.js:44-149` (`fetchAlbum`), `:309-356` (`fetchMultipleAlbums`), `:223-230` (`BEAenrichAlbum`) | o caminho dos itens 1, 2, 5 e 6 |

## Architecture Approach
<!-- How it fits arch.md; components affected; what this plan refines in arch.md and data-model.md. -->
É a decisão 1 da ADR-0019 («um serviço é dono da carga; as telas não fazem laço sobre álbuns»), que estava como «não feito». O desenho ficou em `docs/specs/arch.md`, seção «Toda tela pede os álbuns ao serviço de carga (F56)». Nada muda em `data-model.md`: nenhum dado gravado mudou de forma.

**A escolha: juntar-se à geração em vigor, não abrir um contexto por tela.**

| Opção | O que resolve | O que custa |
|---|---|---|
| A. Um contexto por tela (outra instância do serviço, outro store) | isola de vez | para dividir as filas, o `cancelAll` de uma geração derrubaria as tarefas da outra e a espera do servidor ficaria dividida; sem dividir, o limite de 3 buscas na Apple dobra (429 medido com 6); a mesma série na tela e no blend é buscada duas vezes |
| **B. Juntar-se à geração (`join` / `leave`), a série como «convidada» — escolhida** | o que a tela tem é a resposta; o que está a caminho é esperado, não repetido; uma fila, um limite, uma espera | o pedido precisa entrar de novo quando começa outra geração (feito no `AlbumAsks`); soltar uma série dentro da mesma geração pede que o trabalho de um álbum termine sozinho (feito: o carimbo) |
| C. Vários contextos dentro do mesmo serviço | o melhor dos dois | reescreve o serviço, que a F58 vai dividir; grande demais para uma fatia |

## Technical Design
<!-- Data flow first · components/modules (what each receives, renders or returns, emits) · API/interface
     changes · explicit file paths. Each component names the REQ-xx it addresses. -->
**Fluxo.** Tela → controlador → `albumAsks.albumsOf({ series, sources, signal, onProgress })` → `AlbumLoadService.join(series)` → as mesmas filas, portas e guardado → store de carga → o pedido lê o store a cada mudança → resultado tipado → `AlbumLoadService.leave(ids)`.

| Peça | Arquivo | O que faz | REQ |
|---|---|---|---|
| `AlbumAsks` (nova) | `public/js/services/albums/AlbumAsks.js` | a porta: conta quantos pedidos esperam cada série, entra de novo numa geração nova, lê o estado, solta ao servir ou ao ser largada; só importa modelos | REQ-01, REQ-02, REQ-03 |
| Regras do pedido (novas, puras) | `public/js/models/albumAsk.js` | `readAsk` (pronto? o quê?), o resultado tipado, `askNotices`, `noAlbumsMessage`, `askProgressText` | REQ-01, REQ-04, REQ-05 |
| Fontes da receita (novas, puras) | `public/js/models/recipeSources.js` | `resolveRankingId`, `sourcesForRecipe`; `PlaylistGenerationService` passou a usar a mesma regra | REQ-04 |
| `AlbumLoadService` | `public/js/services/albums/AlbumLoadService.js` | `join`, `leave`, `reloadAlbum`; `_reconcileSeries` (tirado do `load`, que ficou menor); o carimbo (`_stampOf`, `_endChain`); `_kept` (não lê o guardado para uma entrada `fresh`); `adoptAlbum` saiu | REQ-02, REQ-03, REQ-06, REQ-07 |
| Estado | `public/js/models/albumLoadState.js` | `reconcileEntry`: mesma edição fica, edição nova recomeça | REQ-06 |
| Store de carga | `public/js/stores/albumLoad.js` | séries convidadas (`addGuest`, `removeGuest`, `isGuest`, `getAllSeriesIds`); `setSeriesOrder` não as solta | REQ-02, REQ-03 |
| Fila | `public/js/utils/TaskQueue.js` | `boost` / `unboost` (quem espera passa na frente) e `cancelGroup` | REQ-02, REQ-03 |
| Composição | `public/js/services/albums/albumLoading.js` | exporta `albumAsks`; a projeção inclui as convidadas | REQ-01, REQ-08 |
| Blend | `public/js/controllers/BlendingController.js`, `public/js/views/BlendingMenuView.js` | `_albumsFor`; `generateFromSeries` e `regenerate` pedem pela porta; `BlendCancelledError`; a tela mostra os avisos e larga o pedido ao sair | REQ-04 |
| Edição de playlists | `public/js/controllers/PlaylistsController.js` | `loadAlbumsForSeries` e `handleGenerate` pela porta; `destroy` larga os pedidos | REQ-05 |
| Tela de álbuns | `views/helpers/SeriesModalsManager.js`, `components/series/SeriesEditModal.js`, `components/series/SeriesEventHandler.js`, `controllers/SeriesController.js`, `services/SeriesService.js` | salvar reconcilia; sem injeção; «Refetch» por `reloadAlbum`; sem escrita avulsa na prateleira | REQ-06, REQ-07, REQ-08 |
| Prateleira | `public/js/stores/albums.js` | perdeu `addAlbumToSeries`, `addAlbum`, `removeAlbum`, `clearAlbumSeries`, `removeAlbumsBySeriesIdFromContext` | REQ-08 |
| Cliente antigo | `public/js/api/client.js`, `public/js/helpers/BEAEnrichmentHelper.js` | saíram `fetchAlbum`, `fetchMultipleAlbums`, `BEAenrichAlbum` e `enrichAlbum` | REQ-09 |
| Aptidão | `test/architecture/screensLoadThroughTheService.test.js` | 9 regras lidas do código-fonte | REQ-08, REQ-09 |

**Gerações e escopo, como ficam.**
- `load()` (tela de álbuns) continua dona do escopo e das gerações. `join()` nunca abre geração, a não ser depois de `stop()`, quando o store ainda guarda o que a carga parada deixou.
- Uma série convidada tem entradas como qualquer outra, não entra em `seriesOrder` (não conta em `isLoading`, não aparece na tela de álbuns) e sobrevive a `setSeriesOrder`.
- Geração nova: `startGeneration` apaga as entradas e mantém a marca de convidada; o `AlbumAsks` vê `service.generation` diferente e chama `join` de novo.
- O carimbo de um trabalho é `{ generation, chainId, epoch }`. `leave`, `reloadAlbum` e a troca de edição sobem o `epoch` do álbum: o que o trabalho antigo trouxer depois é descartado por `_patch`, como numa geração velha, e o trabalho novo não fica esperando atrás do antigo.

## Dependencies
<!-- New dependencies with their justification — aligned with constitution.md and PRINCIPLES.md (Constitution
     Check); contradicting either needs a recorded decision first (mjrp-recording-decisions). -->
Nenhuma.

## Documents Consulted
<!-- arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, the NFR nodes. -->
`AGENTS.md`; `docs/decisions/0019-one-owner-for-the-album-load.md`; `docs/specs/arch.md` («Carga da tela de álbuns», seções 11, 16 a 19); `docs/manual/01_System_Architecture.md` seção 6; `docs/specs/behavior.md`; `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 3, itens 3.24 a 3.31); `reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md` (cenários 6, 12 e 17); `docs/specs/uat.md` (UAT-189, UAT-191).

## Risks & Considerations
- **Não foi visto num navegador.** Quem escreveu não tem navegador; os tempos e os avisos na tela são do integrador (TASK-14).
- **O relógio do pedido.** A espera do servidor começa dentro de uma tarefa e não muda nenhuma entrada do store, então o pedido olha de novo a cada 1 s. Funciona e é barato, mas é um relógio; um aviso de espera no store o dispensaria (F58).
- **A prateleira guarda a última projeção de uma série convidada depois que ela sai da carga.** É o que as telas de ranking leem depois de um blend. Quem gera de novo não depende disso: pede outra vez.
- **Troca de edição recomeça o álbum.** A correção de identificador da F55 muda o `appleMusicId` guardado na série; `reconcileEntry` reconhece o identificador do álbum já carregado e não recarrega. Se o álbum carregado não disser de onde veio (`metadata.sourceId` ausente, álbum vindo da segunda fonte), o álbum é buscado de novo uma vez.
- **O «Refetch» some com o cartão por um instante** (a entrada volta a «pendente» até o catálogo responder). Antes o cartão ficava e um aviso dizia «Metadata updated» mesmo quando as fontes tinham falhado.
- **Mudanças de comportamento para o MJRP julgar:** a pergunta «No ratings detected... Continue?» saiu; o blend segue sem os álbuns que falharam; o «Refetch» não grava mais o documento compartilhado `albums`.
- **Conflito com o ramo `fix/f52-slices-3-4`.** Este ramo não tocou em `adapters/enrichers.js` nem em `AlbumCacheAdapter.js`. Tocou em `api/client.js` (remoção de métodos) e em `helpers/BEAEnrichmentHelper.js` (remoção de `enrichAlbum`); se o outro ramo mexeu nesses trechos, o integrador resolve.

## Test plan
> Derivado dos REQ do `spec.md` e dos critérios dos requisitos importados · 2026-11-19 20:05 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | prontos e falhos com motivo; série já na tela sem chamada ao catálogo; série fora da tela vinda do guardado | resultado tipado; zero buscas repetidas | serviço, modelo | sim |
| REQ-02 | tela de álbuns carregando + outra tela pede; pede a série que a tela ainda carrega; troca de escopo no meio; `stop()` no meio; a tela abre pela primeira vez no meio; dois pedidos juntos | geração e entradas da tela intactas; uma busca por álbum | serviço, store | sim |
| REQ-03 | pedido largado com busca no ar; um de dois pedidos largado; servido e solto com fonte não pedida ainda no ar; soltar e pedir de novo na hora | nada na fila, nada no store, nada no guardado; o segundo pedido carrega | serviço, fila | sim |
| REQ-04 | fontes pela receita; segue sem os falhos e avisa; fonte em falta avisada; nenhum pronto para; largado não gera | `^blend-generating`, `^blend-albums-left-out`, `^blend-source-missing`, `^blend-failed`, `^blend-left-while-loading` | controlador, modelo | sim |
| REQ-05 | abrir a edição pede e avisa; lê a lista de séries se preciso; gerar de novo mostra os avisos; sair larga | `^playlists-edit-albums`, `^playlists-generating`, `^playlists-generate-no-albums` | controlador | sim |
| REQ-06 | série pedida de novo com um álbum trocado; outra edição do mesmo título; edição trocada com fonte no ar; salvar chama `load` sem `fresh` | `^series-edit-saved-reloads-only-changes` | serviço, modelo, controlador | sim |
| REQ-07 | `reloadAlbum` busca de novo sem ler o guardado; em todas as séries; resposta antiga não escreve; falha é do álbum | `^album-refetch-feedback` | serviço, controlador | sim |
| REQ-08 | a prateleira não tem método de pôr ou tirar um álbum; `SeriesService` não tem injeção nem refetch | um escritor | store, serviço, aptidão | sim |
| REQ-09 | importações e chamadas lidas do código-fonte; o cliente não tem mais os métodos | 9 regras | aptidão | sim |
| REQ-01, REQ-04, REQ-05, REQ-06 | tempos no navegador com a conta do MJRP | menos de 2 s no blend e na edição; outras séries não recarregam | navegador | não (TASK-14) |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): a pergunta «No ratings detected... Continue?» saiu; o «Refetch» não grava mais o documento compartilhado `albums`; o blend de um visitante (sem login) segue sem as notas, com o aviso «not waited for».
