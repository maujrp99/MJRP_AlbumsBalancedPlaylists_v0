# Plan — Feature F45: A tela de álbuns carrega vários álbuns ao mesmo tempo, com prazo, e as séries do topo primeiro · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), a partir do `docs/log.md` de 2026-11-19, do código do ramo e das medições em `reports/evidence/F45-albums-load-in-parallel/`.

## Architecture Approach
A feature constrói a primeira fatia do desenho da seção «Carga da tela de álbuns — proposta» do `docs/specs/arch.md` (seções 1 a 15; onde a 15 contradiz as anteriores, vale a 15). O desenho passou por duas críticas independentes em 2026-11-19, as duas «pode seguir depois dos P0»; as emendas estão na seção 15.

Em resumo: um serviço é o único dono da carga; uma store pura é a única dona de «pedido → álbum e estado»; achar o álbum é separado de enriquecê-lo; uma fila dá limite, prioridade, prazo e cancelamento; as fontes (catálogo, notas, popularidade, ranking pessoal, guardado) entram por injeção, atrás de adaptadores; a prateleira antiga (`stores/albums.js`) vira leitura projetada da store nova.

O que a feature refina no `arch.md`, e que o documento ainda não diz (tarefa aberta):
- o aviso de falha com «Try again» saiu aqui, e não na F46 (seção 15, item 4);
- o teto das notas é 4, e não 2 (seção 15, item 8); as fontes rápidas têm fila própria, com teto 6;
- o catálogo carrega pela edição escolhida (`appleMusicId`) e cai na busca por nome quando a loja responde 404;
- a falha da Apple Music não cai na segunda fonte;
- o estado da proposta segue «proposta, em construção»; a ADR (seção 14) não foi escrita.

O `data-model.md` não muda por esta feature: nenhum dado gravado mudou de forma. A carga deixou de regravar a coleção `albums` (decisão do agente, revisável pelo MJRP).

## Technical Design
Fluxo: `SeriesController.requestLoad` → `albumLoadService.load({ scopeKey, series, fresh })` → reconciliação (pedido novo entra pendente, pedido que saiu é removido, o resto fica) → por álbum: guardado (`AlbumCacheAdapter`) ou busca no catálogo (`CatalogAdapter`, fila de teto 3) → o álbum é publicado na `albumLoadStore` → fontes em cadeia: ranking pessoal e popularidade (fila de teto 6), depois notas (fila de teto 4) → cada fonte devolve um álbum novo e troca a referência na store → a store avisa uma vez por tique → `projectLoadedAlbums` copia para `stores/albums.js` → `SeriesGridRenderer` desenha cada série pelo estado derivado.

Peças novas:
- `public/js/utils/TaskQueue.js` — fila com limite de tarefas ao mesmo tempo, prioridade por tarefa e por grupo, prazo por tarefa com `AbortSignal`, `cancelAll`, `onIdle`; erros `TaskTimeoutError` e `TaskCancelledError`. Não importa nada do projeto. REQ-01, REQ-03, REQ-04.
- `public/js/models/albumLoadState.js` — regras puras: `queryKey`, `createEntry`, `deriveSeriesState`, `AlbumStatus`, `EnrichmentStatus`, `FailureReason` (não achado, prazo, rede). Nasceu em `services/albums/loadState.js` e mudou para `models/`, porque a store não pode importar `services/`. REQ-08.
- `public/js/models/cloneAlbum.js` — cópia do álbum e das faixas, para o enriquecimento não mutar o publicado. REQ-02.
- `public/js/models/albumQuery.js` — `parseAlbumQuery`: a leitura única de «Artista - Título» (só o primeiro separador divide). REQ-07.
- `public/js/stores/albumLoad.js` — store pura; guarda as entradas por série, deriva o estado da série, agrupa os avisos por tique, `subscribe` devolve o `unsubscribe`. REQ-08, REQ-09.
- `public/js/services/albums/AlbumLoadService.js` — `load`, `retryFailed`, `stop`, `whenIdle`, `adoptAlbum`; gerações (só a carga atual escreve); `LOAD_LIMITS`: `findConcurrency: 3`, `findTimeoutMs: 45000`, `sourceConcurrency: 6`, `slowConcurrency: 4`, `enrichTimeoutMs: 20000`. Não importa rede, Firestore nem tela. REQ-01 a REQ-05, REQ-08, REQ-09, REQ-10.
- `public/js/services/albums/adapters/CatalogAdapter.js` — Apple Music com o servidor como segunda fonte; carrega pela edição escolhida (`_detailsOfChosen`), cai na busca por nome no 404; cada tentativa na Apple tem 10 s (`APPLE_DEADLINE_MS`); novas tentativas com espera de 0,7 s, 1,8 s e 4 s, mais variação (`APPLE_RETRY_WAITS_MS`); só «a Apple não tem o álbum» vai à segunda fonte. REQ-06, REQ-07.
- `public/js/services/albums/adapters/enrichers.js` — `AcclaimEnricher` (notas; devolve o álbum novo já ordenado pela nota), `PopularityEnricher`, `UserRankingEnricher`; cada um distingue «feito», «vazio» e erro. REQ-02.
- `public/js/services/albums/adapters/AlbumCacheAdapter.js` — guardado por pedido: a base do álbum e um registro por fonte; «vazio» confiável por 1 hora; o ranking pessoal nunca é guardado. REQ-10.
- `public/js/services/albums/albumLoading.js` — a composição (qual adaptador serve qual porta) e a projeção na prateleira.

Peças mudadas:
- `public/js/controllers/SeriesController.js` — perdeu o laço de carga (647 → 405 linhas na F45): pede ao serviço, reconcilia quando a lista de séries muda, desfaz as inscrições da visita anterior; `retrySeries`, `getSeriesStates`. REQ-04, REQ-09.
- `public/js/components/series/SeriesGridRenderer.js` — `_emptySeriesDisplay` (carregando, falhou, oculta), `_renderFailureNotice`, `_renderFailedSeriesGroup`. REQ-08.
- `public/js/components/series/SeriesEventHandler.js` — a ação `retry-series`. REQ-08.
- `public/js/stores/albums.js` — o setter `setAlbumsBySeries`, usado só pela projeção.
- `public/js/helpers/BEAEnrichmentHelper.js` — `applyBEAData` passou a ser exportada.
- `public/js/views/SeriesView.js`, `public/js/views/helpers/SeriesViewUpdater.js` — passam o estado das séries à grade.
- `public/js/app.js` — `window.albumLoadStore` e `window.albumLoadService`, para inspeção e teste (entrou no commit da F47).

## UI/UX Design (if the feature touches a screen)
A tela mudou em um ponto, sem protótipo (decisão do agente; ver a spec): a série com álbum que falhou ganhou uma faixa vermelha clara com o texto «1 album did not load.» ou «N albums did not load.» e o botão «Try again». Quando todos os álbuns da série falharam, a série fica na tela só com o cabeçalho e o aviso. As classes de cor são as do Tailwind que o app já usa; nenhum componente novo.

Capturas: `F45-desktop-before-2026-11-19.jpg`, `F45-desktop-after-2026-11-19.jpg`, `F45-desktop-failure-notice-2026-11-19.jpg`, em `reports/evidence/F45-albums-load-in-parallel/`. Não houve sensor visual: a conferência foi do agente, no navegador.

## Dependencies
Nenhuma.

## Documents Consulted
- `docs/specs/arch.md` — «a atualizar»: a proposta foi escrita antes do código; os cinco pontos da seção «Architecture Approach» acima ainda não estão nela.
- `docs/specs/data-model.md` — «sem mudança» por esta feature.
- `docs/specs/behavior.md` — «a atualizar»: `^library-loading-skeleton` descreve a carga antiga e não há estado para o aviso de falha.
- `docs/specs/constitution.md` — «sem mudança»; lido pelos padrões que o desenho cita (`DP-01`, `DP-05`, `DP-07`, `DP-12`, `DP-14`, `DP-20`, `DP-22`, `DP-23`).
- `docs/specs/uat.md` — «sem mudança» por esta feature: a UAT-172 segue `open` até o MJRP julgar.
- `docs/manual/` — «atualizado» no commit `12713e2` (2026-11-19 12:34): 06, 07, 07b, 08, 09, 11, 17, 19 e o mapa de arquivos. Não revistos: os documentos do servidor (02 a 05), mistura e playlists (15, 18, 21), integrações (20, 22), testes (24) e dívida técnica (29).
- `info-arch.md` e `design-system.md` — o projeto não tem.

## Risks & Considerations
- As notas dependem de um raspador no servidor, sem cache: de 5 a 7 segundos por busca. Subir o teto do navegador rende pouco; o conserto é no servidor.
- O servidor responde igual para «sem nota» e «a busca falhou». A tela guarda «sem nota» por 1 hora, o que pode esconder uma falha por esse tempo.
- Cancelar é descartar: a Apple Music, o Firestore e o servidor não abortam de fato; o desenho só garante que o resultado de uma carga antiga não é escrito.
- `/blend` e o modo de edição ainda chamam `apiClient.fetchAlbum` (`controllers/BlendingController.js:133`): dois caminhos de carga convivem até a última fatia.
- O «Refetch» corre fora da fila e é adotado depois (`adoptAlbum`).
- `POST /api/generate` em produção responde 402: a segunda fonte está fora do ar.
- A grade e o controlador não têm teste automático; a prova deles é a medição no navegador.
- Das funções de aptidão da proposta, só uma tem teste: a fila não importa nada do projeto. As outras (a store não importa `services/`, dono único, chave única) não têm.
- Os testes provam que os tetos são respeitados, não os números 3, 6 e 4: os números vêm das medições.
- A suíte inteira tem 28 falhas de antes desta feature (linha de base de 2026-11-19); «sem regressão» mede-se contra ela.

## Test plan
> Derivado dos REQ do `spec.md` (a feature não importa requisito) · 2026-11-19 12:37, hora de Brasília

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `AlbumLoadService.test.js`: «loads every album of every series…»; `TaskQueue.test.js`: «runs at most `concurrency` tasks at the same time»; medição no navegador | 80 álbuns em 8,5 s | serviço, utilitário, navegador | sim; a medição, não |
| REQ-02 | `AlbumLoadService.test.js`: «publishes the album as soon as the catalog answers, before the slow source has finished», «never mutates an album it has published»; `adapters.test.js`: os cinco casos de `enrichers` | álbum na tela antes da nota | serviço, adaptador | sim |
| REQ-03 | `TaskQueue.test.js`: «rejects a task that passes its deadline…»; `AlbumLoadService.test.js`: «an album whose search never answers fails at its deadline and does not hold the others» | falha no prazo, os outros seguem | utilitário, serviço | sim |
| REQ-04 | `AlbumLoadService.test.js`: «starts the series at the top of the screen first»; `TaskQueue.test.js`: os dois casos de prioridade | ordem da tela | serviço, utilitário | sim |
| REQ-05 | `AlbumLoadService.test.js`: «keeps the slow source under its limit…», «a quick source that hangs does not take the slots of the album searches»; medição com 217 álbuns sem 429 | tetos respeitados | serviço, navegador | sim; a medição, não |
| REQ-06 | `adapters.test.js`: «tries Apple Music again after a failure…», «says the search failed, not "not found", when Apple Music keeps failing, and never asks the paid second source»; medição sem 429 | nova tentativa; sem segunda fonte | adaptador, navegador | sim; a medição, não |
| REQ-07 | `adapters.test.js`: «loads the edition the person chose, by its id…», «searches by name, at once and without waiting, when the chosen edition is no longer there (404)» | edição escolhida; 404 cai no nome | adaptador | sim |
| REQ-08 | `albumLoadState.test.js`: os seis casos de `deriveSeriesState`; `albumLoad.test.js`: «derives the state of a series instead of storing it»; `AlbumLoadService.test.js`: «an album the catalog does not have ends as "failed: not found"…», «retryFailed searches again only the albums that failed»; captura do aviso | série com aviso, nunca oculta | modelo, store, serviço, navegador | sim; o desenho do aviso, não |
| REQ-09 | `AlbumLoadService.test.js`: «a result that arrives for an older load is discarded…», «opening the same scope again keeps what is loaded…», «reconciles when the series changed…», «stop drops what is in flight…»; sair e voltar no navegador | 20 blocos e 80 álbuns ao voltar | serviço, navegador | sim; sair e voltar, não |
| REQ-10 | `AlbumLoadService.test.js`: «on a second visit reads the album and its finished sources from the cache, with no search», «a failed search or a failed source is never written to the cache»; `adapters.test.js`: os cinco casos de `AlbumCacheAdapter` | segunda visita sem busca | serviço, adaptador | sim |

Rodado em 2026-11-19 12:33: os nove arquivos de teste das três features (F45, F47, F51), 116 testes, todos passam.

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): a segunda visita no navegador (guardado cheio) não foi medida, só testada com dublê; o «Try again» não foi clicado no navegador, só testado no serviço; a resposta 402 da segunda fonte não tem teste.
