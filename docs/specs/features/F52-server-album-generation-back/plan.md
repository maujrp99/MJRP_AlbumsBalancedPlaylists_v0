<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F52: O servidor diz a verdade · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> O desenho é a seção «O servidor diz a verdade — proposta (F52)» do `docs/specs/arch.md`; a seção 11 vale sobre as seções 2, 5 e 7. Este plano registra a fatia 1 e, na seção «Fatia 3 e medição», as fatias 3 e 4 como foram construídas. A fatia 5 (o caminho de `/api/generate`) está na seção «Fatia 5». A fatia 2 foi entregue pela F55 e está no plano dela.

## Architecture Approach
Um contrato, um lugar que escreve, um lugar que lê (DP-19, resultado tipado, atravessando a rede):

- **Quem escreve:** `server/lib/outcome.js`. Um serviço devolve `success(data, outcome)` ou `failure(code, opções)`; a rota entrega a `respond(res, resultado)`. Sucesso é `{ data, outcome }` com `outcome` sempre presente; falha é `{ error: { code, retryable } }`, com `code` de uma lista fechada.
- **A tabela do provedor de IA:** `server/lib/aiProviderOutcome.js`, como dado (`AI_PROVIDER_TABLE`), lida pelas duas rotas que chamam o provedor.
- **Quem lê:** `public/js/api/serverResult.js`, puro. Devolve `found`, `not_found`, `no_ratings`, `legacy` (200 sem `outcome`, do servidor antigo) ou `failed` com `code`, `retryable`, `status` e `hold`.
- **Onde a falha era engolida:** dentro do raspador (`server/lib/scrapers/besteveralbums.js`), não no serviço. Toda requisição passa por uma função (`getPage`) que lança `UpstreamError`; nenhum `catch` das buscas sobrou.
- **Carga segurada:** `AlbumLoadService._addHeld` e `TaskQueue.pause/resume`. Um erro com `hold` não é falha do álbum.

**Decisões tomadas na construção (do agente, revisáveis):**
- *Status do que não adianta repetir:* 424 (Failed Dependency). É 4xx (a aba antiga não repete) e não é 401 nem 429, que são a porta e o limite do próprio servidor e seguram a fila do app.
- *`retryable` de `rate_limited` e `unauthorized` é `false`:* o campo quer dizer «repetir em segundos pode dar certo». Quem cuida do 401 e do 429 é a carga segurada, não a repetição.
- *O 200 que não vira álbum* (resposta do provedor sem álbum, reprovada no esquema, ou que quebra ao ser lida) é a linha `unusable`: 424, sem repetir. Antes o servidor repassava a resposta crua com 200.
- *Resposta não-2xx da fonte de notas é sempre falha*, inclusive 404: o critério da crítica é «com a busca da fonte fora do ar, a resposta é erro».
- *A lista de álbuns por IA foi para `data.albums`* (o contrato vale para todas as rotas); uma aba antiga deixa de lê-la até recarregar.
- *O 401 segura a carga até `resume()`, uma nova `load()` ou `retryFailed()`*; nenhum código de tela foi tocado, e o aviso sai por um toast pedido pelo arquivo de composição.

**Alternativas pesadas:**
- *Erro do provedor sempre como 5xx (proposta original):* cobrança e cota virariam três chamadas pagas por álbum numa aba antiga. Recusada pela crítica (achado 2).
- *Serviço de notas tratar o erro, sem tocar o raspador:* o raspador não lança; carimbaria `not_found` em falha. Recusada pela crítica (achado 1).
- *Continuar na busca seguinte quando uma busca do raspador falha, e só falhar no fim:* daria mais respostas, mas uma busca mais frouxa poderia aceitar o álbum vizinho justamente quando a mais exata falhou. Fica a regra estrita: qualquer falha sobe.
- *Pausar a fila da busca de álbuns no 429 do servidor:* ela também fala com a Apple Music; pararia por até uma hora álbuns que não dependem do servidor.

## Technical Design
**Servidor**
- `server/lib/outcome.js` (novo): `OUTCOMES`, `ERROR_CODES`, `success`, `failure`, `bodyOf`, `respond`, `UpstreamError`, `upstreamErrorFrom`, `isTimeout` · REQ-01
- `server/lib/asyncRoute.js` (`errorResponder`), `server/lib/auth/requireUser.js`, `server/lib/rateLimit.js`: passam por `outcome.js`, com os status de antes (401, 403, 429 com `Retry-After`, 503, 400, 500) · REQ-01
- `server/lib/scrapers/besteveralbums.js`: `createBestEverScraper({ http, loadHtml, logger })`; `getPage` lança `UpstreamError`; `parseSuggest` lê a resposta da busca; os `catch` de `fetchAlbumPage`, `pageContainsArtistOrTitle`, `_standardFindAlbumId`, `_fuzzyFindAlbumId`, `findArtistPage`, `getRankingForAlbum` e `getRankingFromUrl` saíram · REQ-02
- `server/lib/services/EnrichmentService.js`: devolve resultado tipado (`found`, `not_found`, `no_ratings`, falha) · REQ-02
- `server/lib/aiProviderOutcome.js` (novo): a tabela e `providerCaseOf`, `providerFailure`, `failureFromProviderError`, `describeProviderError` · REQ-03
- `server/lib/services/GenerationService.js`: resultado tipado; `_albumFromResponse` · REQ-03
- `server/routes/handlers/albums.js` e `server/routes/handlers/ai.js` (novos): os manipuladores, fora do Express para serem testados sem servidor; `server/routes/albums.js` e `server/routes/ai.js` só montam · REQ-01, REQ-02, REQ-03

**App**
- `public/js/api/serverResult.js` (novo): `readServerResult`, `failedWithoutAnswer`, `ApiError`, `ResultKind` · REQ-04
- `public/js/api/client.js`: `_post` (a chamada única), `requestRatings`, `BEAenrichAlbum` (significado antigo), `_fetchAlbumFromAPI` repete por `retryable` · REQ-04
- `public/js/services/album-search/AlbumSearchService.js`: a lista da IA lida pelo leitor; falha não fica guardada; uma pergunta por busca · REQ-04
- `public/js/services/albums/adapters/enrichers.js` (`AcclaimEnricher`): `not_found` e `no_ratings` viram `empty`; falha é lançada · REQ-04
- `public/js/services/albums/adapters/CatalogAdapter.js`: `_findInServer` relança erro com `hold` · REQ-05
- `public/js/utils/TaskQueue.js`: `pause`, `resume`, `paused` · REQ-05
- `public/js/services/albums/AlbumLoadService.js`: `_addHeld`, `_holdFor`, `_endHold`, `getHold`, `resume`; `_enrichOne` dividido (`_newAsk`, `_askSource`, `_overNewestAlbum`, `_publishSource`) · REQ-05
- `public/js/models/albumLoadState.js`: `HoldReason`, `holdNotice`; `public/js/services/albums/albumLoading.js`: liga `requestRatings` e o aviso · REQ-05

## Fatia 3 e medição (construídas em 2026-11-19, ramo `fix/f52-slices-3-4`)

**Onde a seção 11 mudou o pedido da sessão** (a seção 11 vale):
- *Prazo de confiança:* 24 horas para «álbum sem página» e 7 dias só para «página sem notas» (item 4); o pedido dizia 7 dias para os dois.
- *Memória curta por instância:* não construída (item 10: cortada até haver número). Ficou só a divisão de pedidos iguais em voo, que não guarda nada.
- *Popularidade do Spotify:* não construída aqui (item 10: item próprio). Não há feature criada para ela; o que a leitura mostrou está em «Risks & Considerations».
- *Orçamento:* 15 s por álbum e 8 a 10 s por requisição (item 6); foi usado 8 s.
- *Uma instância fixa no Cloud Run* (item 9): é pré-condição de publicação, não código.

**Servidor: três módulos pequenos, com relógio injetado**
- `server/lib/politeQueue.js` (novo): `createPoliteQueue(...)`, `PaceError`, `noPace`. O único dono do ritmo com a fonte: limite de simultâneos, intervalo mínimo entre inícios, pausa de todos quando a fonte diz «ocupada», repetição do mesmo pedido depois da espera. Nunca dorme além do prazo do pedido · REQ-07, REQ-10
- `server/lib/timeBudget.js` (novo): `createBudget({ ms })` com `deadlineAt`, `remainingMs()` e `race(work, source)` · REQ-07
- `server/lib/inFlight.js` (novo): `createInFlight().share(key, start)`; a chave é esquecida quando o trabalho termina · REQ-09
- `server/lib/scrapers/besteveralbums.js`: `pageGetter({ deadlineAt, stats })` constrói o `getPage` de cada pedido (fila, prazo de `min(8 s, o que resta)`, cada endereço pedido uma vez por pedido); `searchesWith(getPage)` são as buscas de antes, sem mudança na regra de aceite; `BEA_PACE`, `REQUEST_TIMEOUT_MS`, `busyOfSource` · REQ-07, REQ-10
- `server/lib/outcome.js`: `UpstreamError` leva `retryAfterMs` · REQ-10
- `server/lib/services/EnrichmentService.js`: `ALBUM_BUDGET_MS`, `_searchOnce` (em voo + orçamento), `_failureOf` (`Retry-After`), `trace` no resultado · REQ-07, REQ-09, REQ-10
- `server/routes/handlers/albums.js`: a linha de log `enrich` por pedido · REQ-08

**App**
- `adapters/enrichers.js`: `empty` leva `reason` (`not_found`, `no_ratings`; nenhum no servidor antigo) · REQ-07
- `adapters/AlbumCacheAdapter.js`: `EMPTY_TRUST` (24 h, 7 d, 1 h) e `reason` no registro · REQ-07
- `AlbumLoadService.js`: `_publishSource` passa o motivo; `adoptAlbum` só grava `done` quando o álbum voltou com notas · REQ-07, REQ-10
- `api/serverResult.js` e `models/albumLoadState.js`: `upstream_busy` com `Retry-After` segura a carga (`HoldReason.SOURCE_BUSY`), com aviso próprio · REQ-10

**Números escolhidos (decididos pelo agente — revisáveis)**

| Número | Valor | Por quê |
|---|---|---|
| «álbum sem página» vale | 24 horas | seção 11, item 4: começar curto; a página pode ser criada |
| «página sem notas» vale | 7 dias | seção 11, item 4; é a vida do próprio registro |
| «vazio» sem motivo vale | 1 hora | a regra de antes: pode ter sido falha (servidor antigo) |
| orçamento por álbum | 15 s | seção 11, item 6; o app espera 20 s |
| prazo por requisição à fonte | 8 s | seção 11, item 6 (8 a 10 s); cabem quase duas lentas no orçamento |
| simultâneos na fonte | 2 | o app pede 4 álbuns por vez; um álbum achado custa 3 requisições |
| intervalo entre inícios | 250 ms | no máximo 4 requisições por segundo; medido local: álbum achado em 2,0 s |
| espera no 429 e no 503 | 1 s, dobrando, até 30 s | DP-23; o `Retry-After` da fonte vale no lugar, cortado em 5 minutos |
| tentativas do mesmo pedido | 3 | 1 s + 2 s de espera cabem no orçamento |

**Alternativas pesadas**
- *Dividir a resposta inteira (com as notas casadas) entre pedidos iguais:* as faixas de dois pedidos podem diferir (edições); divide-se só a busca da página.
- *Guardar respostas por minutos na memória da instância:* cortada pela crítica até haver número.
- *Contexto implícito (AsyncLocalStorage) para o prazo:* escolhido o explícito, uma porta (`getPage`) por pedido.
- *Marcar cada álbum como falha quando a fonte pede uma espera longa:* viraria a série inteira em «falhou»; a carga já sabia esperar pelo 429 do servidor, e o mesmo mecanismo serve.
- *Trocar a versão do registro guardado para confiar por dias:* a F55 já confere cada registro na leitura; o «vazio» antigo não tem motivo e segue valendo 1 hora.

## Fatia 5 — o caminho de `/api/generate` (construída em 2026-11-19, ramo `fix/f52-slice-5-generate-path-tells-the-truth`)

**O que sobrava da UAT-23.** As notas e a lista da IA já diziam a verdade; o caminho de `POST /api/generate` ainda transformava falha em sucesso: arquivo de prompts ausente virava `{}`; `fetchRankingForAlbum` engolia a falha do raspador e a do Spotify e seguia; `GenerationService` registrava «Ranking fetch skipped» e devolvia o álbum como `found`, sem notas, igual a «as fontes não têm notas». As três funções do caminho mediam 139, 65 e 49 de complexidade.

**O desenho: uma esteira de fontes com desfecho tipado, e passos puros.**

| Peça | Onde | O que faz |
|---|---|---|
| Desfecho de uma fonte | `server/lib/rankingSources/sourceOutcome.js` | `found`, `not_found`, `no_ratings`, `not_configured`, `failed`, `not_asked`; `askSource` pergunta a fonte dentro do prazo do pedido e transforma o que for lançado em `failed` (com o código da lista fechada) |
| As três fontes | `rankingSources/bestEverSource.js`, `spotifySource.js`, `modelSource.js` | uma função cada: perguntam e devolvem o desfecho; não capturam falha |
| A ordem, declarada | `server/lib/fetchRanking.js` (`PIPELINE`) | `acclaim` sempre; `popularity` quando a página não lista faixa ou tem poucas notas; `aiRanking` quando nenhuma das duas deu o ranking do álbum inteiro |
| As decisões, puras | `rankingSources/rankingPlan.js`, `completeRanking.js` | que fonte ainda é precisa, que resposta vira o ranking, e a página incompleta completada pela IA |
| A consolidação, pura | `server/lib/ranking.js` | quadro das faixas, cada menção no seu lugar, pontos de Borda, ordem |
| A resposta do álbum, pura | `server/lib/albumAnswer.js` | fontes, entradas, `ratings`, ranking consolidado, nota e posição em cada faixa |
| O serviço | `server/lib/services/GenerationService.js` | o álbum decide o resultado; as notas nunca derrubam o pedido; o que quebra dentro do servidor é lançado |
| Prompts | `server/lib/prompts.js` | `loadPrompts` lança `PromptsError`; `requirePrompt` é como uma rota lê um prompt; `server/index.js` carrega na partida (uma linha) |

**Como a mudança foi presa antes.** Os testes de caracterização (commit `4ceabac`) rodaram contra o código antigo, com as fontes trocadas por dublês; depois da reescrita passam sem mudança, menos três que diziam «TODAY» e viraram o comportamento novo. Na primeira versão o dublê entrava no lugar dos módulos que a função antiga pedia por conta própria; com a esteira, entra por injeção (`createRankingFetch(deps)`); as afirmações dos testes não mudaram.

**Decisões tomadas na construção (do agente, revisáveis):**
- *As notas não derrubam o pedido; o defeito do servidor derruba.* Fonte que falha é `failed` ao lado do álbum. Consolidação que quebra, ou prompt que falta, é `internal`: responder um álbum «sem notas» seria a mesma mentira.
- *Três chaves, pelos nomes que o app usa nas fontes:* `acclaim` (BestEverAlbums), `popularity` (Spotify), `aiRanking` (a IA). Os valores `found`, `not_found` e `no_ratings` são os do `outcome.js`; `not_configured` é o da F69; `failed` e `not_asked` são novos e só existem aqui.
- *`not_asked` existe* porque a esteira só pergunta a fonte seguinte quando a anterior deixou o ranking incompleto: sem ele, «não perguntei» pareceria «não tem».
- *O raspador é perguntado uma vez.* O serviço perguntava de novo quando o ranking não vinha do BestEverAlbums; a esteira já sabe o que a página respondeu. No caminho em que o Spotify ganha, a página fica no álbum como evidência, agora com o endereço.
- *O prazo acabar na fase das notas não descarta o álbum pago:* a fonte que ainda roda vira `failed` e o álbum sai. Só o provedor que não responde o álbum vira `upstream_timeout`.
- *Prazo de 75 s*, abaixo dos 90 s do app; o cliente de IA tem 60 s próprios por chamada. Sem medição.
- *Os dois prompts são obrigatórios na carga* (`albumSearchPrompt`, `rankingPrompt`): um arquivo sem um deles não é «um arquivo com menos prompts», é uma publicação quebrada.
- *O validador do álbum (`ajv`) também falha alto:* é dependência declarada do servidor; não carregar virava «validação desligada».
- *O catch vazio é medido em todo o `server/`*; o «só escreve no log» é medido no caminho das duas rotas, sem exceção.

**Alternativas pesadas:**
- *Remendar cada `catch` da função de 139:* manteria a função e cinco caminhos de saída; o dono pediu arquitetura. Recusada.
- *Falhar o pedido inteiro quando uma fonte de notas falha:* joga fora um álbum pago, e o app repetiria a chamada paga. Recusada (o pedido da fatia já dizia).
- *Um campo só (`ratings: 'failed'`):* não diz qual fonte; o app tem um enriquecedor por fonte. Recusada.
- *Corrida com o prazo no manipulador da rota:* descartaria o álbum quando só as notas atrasam. Recusada; o prazo é lido dentro do serviço.
- *Deixar a suíte de complexidade do servidor sem as pastas que a F65 ia remover:* a conta do dono (26 e 9) as incluía; entraram na lista e saíram dela quando a F65 chegou.

**Todo `catch` de `server/lib`, `server/routes` e `server/index.js`** (linhas de 2026-11-19, depois da fatia; as linhas «antes» são as da `main` em `6ae9940`):

| Onde | O que fazia ou faz | Estado |
|---|---|---|
| `prompts.js:18-21` (antes) | arquivo ausente ou ilegível virava `{}` com aviso | **consertado**: `loadPrompts` lança `PromptsError`, na partida |
| `fetchRanking.js:103-104`, `:121` (antes) | sem prompt de ranking devolvia `entries: []` | **consertado**: `requirePrompt` lança; a rota responde `internal` |
| `fetchRanking.js:202-205` (antes) | falha do Spotify (página com poucas notas): aviso e seguia | **consertado**: `popularity: failed` |
| `fetchRanking.js:305-310` (antes) | falha da IA ao completar a página: aviso e devolvia a página | **consertado**: `aiRanking: failed` (a página segue saindo) |
| `fetchRanking.js:312-315` (antes) | falha do raspador: aviso e seguia para o Spotify | **consertado**: `acclaim: failed` |
| `fetchRanking.js:341-343` (antes) | falha do Spotify: `// ignore` | **consertado**: `popularity: failed` |
| `fetchRanking.js:363` (antes) | `catch (e) { }` ao ler o motivo de parada do modelo | **removido**: leitura sem `try` |
| `fetchRanking.js:19` (antes) | `require('./logger')` com `console` de reserva | **removido** |
| `GenerationService.js:65-68` (antes) | tudo que quebrasse depois do provedor virava «resposta inaproveitável» (424) | **consertado**: só a leitura do álbum; o resto é lançado (`internal`) |
| `GenerationService.js:86` (antes) | `catch (e) { /* ignore */ }` no log de uso | **removido** |
| `GenerationService.js:124-126` (antes) | segunda pergunta ao raspador, falha só no log | **removido** com a segunda pergunta |
| `GenerationService.js:133-135` (antes) | «Ranking fetch skipped»: álbum `found` sem notas | **consertado**: `data.ratings` |
| `GenerationService.js:162-166` (antes) | consolidação que quebra: 200 com ranking vazio, erro e pilha no corpo | **consertado**: lançado (`internal`) |
| `GenerationService.js:193-195`, `:209-211` (antes) | escrever posição nas faixas e ordenar: falha só no log | **removido**: passos puros, sem `catch` |
| `ranking.js:147` (antes) | `catch (e) { return null }` ao escolher a nota | **removido** |
| `normalize.js:214-217`, `:220` (antes) | `require` de `validateSource` e de `logger` com reserva | **removido** |
| `normalize.js:226-246` (antes) | conferência do endereço de referência: dois `catch` vazios em volta do próprio log, um ramo que nunca rodava, `.catch(() => false)` | **reescrito**: `checkedReferenceUrl` |
| `schema.js:15-17` (antes) | `ajv` ou o esquema não carregam: «validação desligada» | **consertado**: lançado na partida |
| `normalize.js:74`, `:79` | tentativa de ler JSON da resposta da IA; sem JSON devolve `null` e quem chamou responde `unusable` | legítimo (leitura opcional) |
| `normalize.js:112` | vazio: pedaço do texto da IA que não é um objeto JSON | legítimo, na lista com motivo |
| `validateSource.js:9` | `verifyUrl` responde `false`: é a resposta de «o endereço não conferiu» | legítimo |
| `logger.js:8` | o `meta` que não vira JSON: a linha sai sem ele | legítimo |
| `prompts.js:48`, `:74` | relança como `PromptsError` | legítimo (diz o que falhou) |
| `rankingSources/sourceOutcome.js:59` | transforma em `failed` com código, e escreve `ranking_source_failed` | legítimo (resultado tipado) |
| `politeQueue.js:117`, `scrapers/besteveralbums.js:126`, `services/spotifyPopularity.js:163`, `albumIdentity.js:12` | relançam (`PaceError`, `UpstreamError`) | legítimo |
| `services/EnrichmentService.js:76`, `services/GenerationService.js:119`, `:147`, `:170`, `routes/handlers/ai.js:55` | falha tipada pela tabela ou pelo contrato; o que não é da fonte é relançado | legítimo |
| `routes/handlers/ai.js:28` | JSON quebrado da lista da IA: lê os títulos um a um; sem lista é `unusable` | legítimo |
| `auth/verifyIdToken.js:32`, `:46`, `:80`, `auth/requireUser.js:26` | `AuthError`, depois 401 ou 503 pelo contrato | legítimo |
| `asyncRoute.js:15` | `.catch(next)`: entrega ao respondedor de erros | legítimo |
| `index.js:12` | sem `fetch-blob`, usa substitutos mínimos de `File` e `Blob` | deixado (partida; `index.js` só ganhou uma linha) |
| `index.js:38` | vazio: o mesmo bloco de substitutos | deixado, na lista com motivo |
| `index.js:100` | `require('./lib/logger')` com `console` de reserva | deixado (o arquivo existe sempre; mexer é do `index.js`) |
| `routes/musickit.js:48` | 500 com a mensagem do erro no corpo, formato próprio | deixado: fora do caminho; a spec da F52 deixa a rota fora |
| `routes/playlists.js:64` | idem | saiu com a rota, removida pela F65 |
| `routes/debug.js:41`, `:86`, `:110`, `:119`, `:136` | respondem a mensagem (e a pilha) do erro | deixado: rotas de depuração, desligadas em produção (F59) |
| `routes/debug.js:72` | vazio: sem álbum legível, mostra a resposta crua | deixado, na lista com motivo |
| `routes/debug.js:78` | só log: falha do raspador vira `bestEverEvidence: null` | deixado: rota de depuração; é o único «só log» fora de `scripts/` e `test/` |
| `server/scripts/**`, `server/test/**` | dez `catch` que só escreviam no log | saíram com as pastas, removidas pela F65 |

**Riscos e bordas (fatia 5):**
- **A F65 entrou na `main` enquanto a fatia era feita** e removeu `server/scripts/**`, `server/test/**`, `routes/playlists.js` e `shared/curation.js`. A `main` foi trazida para o ramo: as 4 linhas de `server/scripts` e as 9 de `shared/curation.js` saíram das listas de complexidade (o teste pediu). As listas ficam com 14 funções no servidor e nenhuma em `shared/`.
- **Um servidor que subia «meio quebrado» agora não sobe.** É o pedido; o teste de fumaça da publicação sobe o servidor preparado antes de enviar e para ali.
- **A chamada ao provedor que perde a corrida com o prazo não é cancelada:** termina no prazo próprio (60 s) e a resposta é descartada. Na prática o prazo próprio vem antes dos 75 s.
- **A conferência dos endereços de referência da IA** (`validateSource.verifyUrl`) faz uma requisição a cada endereço que o modelo devolve; corre dentro do prazo do pedido, mas o servidor busca endereços escolhidos pelo modelo. Anterior a esta fatia; anotado, sem dono.
- **O app ainda grava o que a rota responde sem olhar `ratings`:** até o item do app, um álbum que veio com `acclaim: failed` segue sendo tratado como hoje (o enriquecedor de notas pergunta por conta própria em `/api/enrich-album`, que já diz a verdade).

### Test plan — fatia 5
> Derivado dos REQ-11 a REQ-16 · 2026-11-19 21:50 (Brasília)

| REQ | Verificação | O que confere | Nível | Automática |
|---|---|---|---|---|
| REQ-11 | `test/server/rankingPipeline.test.js` | a ordem das fontes e o que sai em cada caminho (escrito contra o código antigo); o desfecho de cada fonte em 13 casos; a falha do provedor pelo código da tabela; sem mensagem de fonte na resposta | servidor, unidade | sim |
| REQ-11 | `test/server/rankingConsolidation.test.js` | a consolidação: ordem por nota, pontos de Borda, títulos repetidos, título contido, palavras em comum, menção sem faixa, faixas desconhecidas | servidor, unidade | sim |
| REQ-11 | `test/server/rankingEntries.test.js` | o endereço de referência que não confere sai e a entrada fica | servidor, unidade | sim |
| REQ-12 | `test/server/generateAlbumAnswer.test.js` | o álbum com as notas nas faixas em cada caminho; `data.ratings` nos quatro casos (achou, não tem, falhou, não configurado); consolidação que quebra é lançada | servidor, serviço inteiro com dublês de fonte | sim |
| REQ-12 | `test/api/siteAgainstGenerateWithRatings.test.js` | o `APIClient` de hoje lê o mesmo álbum com e sem `ratings` | app, unidade | sim |
| REQ-13 | `test/server/prompts.test.js` | arquivo ausente, ilegível, não JSON, vazio, sem um prompt: lança; a mensagem que a publicação procura; a falha não fica guardada; o `index.js` carrega na partida | servidor, unidade | sim |
| REQ-13 | `test/server/generateAlbumAnswer.test.js` | sem prompt, a rota responde 500 `internal` e o provedor não é chamado | servidor, rota com o respondedor de erros | sim |
| REQ-14 | `test/server/generateAlbumAnswer.test.js`, `test/server/rankingPipeline.test.js` | o prazo é menor que o do app (lido do `client.js`); provedor que não responde: 504; fonte que não responde: `failed` e o álbum sai; sem tempo, nenhuma fonte é perguntada | servidor, unidade | sim |
| REQ-15 | `test/server/generateAlbumAnswer.test.js` | a linha `generate` no sucesso e na falha; nada do álbum nem da pessoa | servidor, unidade | sim |
| REQ-16 | `test/architecture/noSwallowedFailure.test.js`, `test/architecture/complexityLimit.test.js` | nenhum `catch` vazio fora da lista; nenhum «só log» no caminho; servidor e `shared/` dentro do limite, fora das listas | arquitetura | sim |
| REQ-11 a REQ-15 | cópia local do servidor (como a imagem), com um substituto da IA na própria máquina e o BestEverAlbums inalcançável, com `curl` (2026-11-19) | 200 com `ratings: { acclaim: "failed", popularity: "not_configured", aiRanking: "found" }` e a linha `generate`; 424 no 402 do substituto; sem o arquivo de prompts o servidor sai com erro e a conferência da publicação falha | servidor de verdade, sem chamada paga | não |

Bordas fora dos critérios: o caminho «a página tem as notas» (`acclaim: found`) não foi visto no servidor de verdade (pediria requisições ao BestEverAlbums); as funções que leem a tabela de notas do raspador seguem fora da suíte da raiz (sem `cheerio`).

## UI/UX Design (if the feature touches a screen)
Nenhuma tela muda. Na fatia 3 há um terceiro aviso: «The ratings source asked to slow down. Loading ratings is paused. It resumes by itself at HH:MM.». Na fatia 1, aparece um aviso (toast) quando a carga é segurada: «Your sign-in could not be confirmed. Sign in again to keep loading ratings.» ou «The server asked to slow down. Loading is paused. It resumes by itself at HH:MM.».

## Dependencies
Nenhuma dependência nova. O `cheerio` continua sendo dependência só do `server/`; o raspador passou a pedi-lo só ao ler uma página, para o módulo carregar na suíte da raiz, que não o tem.

## Documents Consulted
- `docs/specs/arch.md`, «O servidor diz a verdade — proposta (F52)», seções 1 a 11
- `reports/audits/2026-11-19-mjrpalbumblender-v0-f52-proposal-critique.md`
- `docs/specs/uat.md` (UAT-181, UAT-23)
- `docs/specs/features/F59-close-what-is-open-security/` (a porta e o limite do servidor; `serverFetch`)
- `docs/manual/03_Backend_API_Layer.md`, `docs/manual/07_Frontend_Data_Infra.md`
- (fatia 5) `reports/audits/2026-11-19-mjrpalbumblender-v0-open-issues-triage.md` (linha da UAT-23), `scripts/deploy-server.sh` (o teste de fumaça), `test/architecture/complexityLimit.test.js` (o molde da F58), `docs/specs/features/F69-spotify-popularity-failure-is-failure/` (os desfechos da popularidade no servidor)

## Risks & Considerations
- **Ordem de publicação:** o site vai primeiro (lê o formato novo e o antigo), o servidor depois. Ao contrário, a aba aberta leria o formato novo com o código antigo: funciona para notas e para `/api/generate`, e perde a lista da IA até recarregar.
- **Mais «falhou» com a fonte instável:** antes, uma busca do raspador que falhava caía para a seguinte; agora qualquer requisição que falha derruba o pedido daquele álbum. É o desenho; «falhou» tem «tentar de novo» e não é guardado. O prazo de 30 s por requisição do raspador segue maior que os 20 s do app (fatia 3).
- **Registros já guardados no navegador** («sem nota» que foi falha, página com zero notas como `done`) não mudam nesta fatia; a fatia 2 troca a versão do registro.
- **Carga segurada por 429** pode durar até o fim da janela do limite (até uma hora); a tela mostra só o aviso, e os álbuns ficam como «carregando».
- **A suíte da raiz não tem o `cheerio`:** os testes do raspador usam um leitor de HTML de teste (sobre o jsdom) com a parte da interface que as buscas usam. As funções que leem a tabela de notas não são exercidas pela suíte; foram conferidas no servidor de verdade, numa cópia local.

- **(fatia 3) Mais de uma instância no Cloud Run:** a fila, as esperas e a divisão em voo são por instância. Sem `--max-instances=1` o ritmo com a fonte é o de cada instância, somado. O limite de 4 do app continua como segundo freio.
- **(fatia 3) Álbum ausente sob carga:** achar um álbum custa 3 requisições à fonte (2,0 s medido local); concluir «não tem» custa de 4 a cerca de 10. Com 4 pedidos do app por vez e 2 requisições por vez na fonte, um lote de álbuns ausentes pode passar de 15 s e voltar como `upstream_timeout` (falha, com «tentar de novo»), não como «não tem». O log (`answer: "upstream_timeout"`) dá o número.
- **(fatia 3) Fonte ocupada sem fim:** a carga segura, volta, e segura de novo enquanto a tela estiver aberta; não há limite de vezes.
- **(fatia 3) `/api/generate`** passa pela mesma fila e pelo prazo de 8 s por requisição, sem orçamento total. (Resolvido na fatia 5: 75 s no total.)
- **(fatia 3) Registros `done` com página e zero notas, de antes da F52,** não se refazem sozinhos (ver Open Questions da spec).
- **Popularidade do Spotify (fora desta feature; lido, não mexido):** `PopularityEnricher` (`adapters/enrichers.js`) termina em `empty` sempre que o álbum volta sem `spotifyId`, e isso cobre três casos diferentes: o Spotify não tem o álbum, a pessoa não está conectada, e a chamada falhou (token vencido, 401, 429, rede). O `empty` vale 1 hora no guardado e vira «sem dado» nos fatos da série (`models/albumFacts.js` grava `popularity: false`). O item próprio precisa: erro tipado nas camadas de baixo, `failed` na falha, e um estado para «não conectado» que não vá para os fatos.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 17:30 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/server/outcome.test.js` | sucesso com `outcome`; cada código com o seu status e `retryable`; os quatro lugares que montam erro usam o formato | servidor, unidade | sim |
| REQ-02 | `test/server/ratings.test.js` | cada busca do raspador lança a falha; `null` só com a fonte respondendo; serviço e rota respondem o desfecho ou o 5xx | servidor, unidade | sim |
| REQ-03 | `test/server/aiProvider.test.js` | cada linha da tabela, nas duas rotas; nada do provedor no corpo | servidor, unidade | sim |
| REQ-03 | `test/api/oldTabAgainstNewServer.test.js` | a aba antiga (código congelado no teste) contra as respostas do servidor novo | app, unidade | sim |
| REQ-04 | `test/api/serverResult.test.js`, `test/api/client.test.js` | servidor novo e servidor antigo; repetir pelo campo | app, unidade | sim |
| REQ-04 | `test/services/albums/adapters.test.js`, `test/services/album-search/AlbumSearchService.aiList.test.js` | `empty`, `done`, falha lançada; falha da lista não guardada | app, unidade | sim |
| REQ-05 | `test/services/albums/AlbumLoadService.test.js`, `test/utils/TaskQueue.test.js`, `test/models/albumLoadState.test.js` | 429 e 401 seguram sem marcar falha; um aviso; a fila pausa e volta | app, unidade | sim |
| REQ-01, REQ-02 | cópia local do servidor, com `curl` | 401, 400, 503, `found`, `not_found`, 502 com a fonte inalcançável | servidor de verdade | não |
| REQ-07, REQ-10 | `test/server/pace.test.js` | a fila (limite, intervalo, espera crescente, `Retry-After`, nunca além do prazo), o orçamento, a divisão em voo | servidor, unidade | sim |
| REQ-07, REQ-08, REQ-09, REQ-10 | `test/server/ratingsPace.test.js` | o raspador pela fila e com prazo; o serviço com orçamento e uma busca por álbum; a rota com `Retry-After` e a linha de log sem dado de pessoa nem de álbum | servidor, unidade | sim |
| REQ-07, REQ-10 | `test/services/albums/emptyTrust.test.js` | 24 h, 7 d, 1 h; o motivo do enricher ao registro; falha nunca guardada; «Refetch» sem notas não grava `done` | app, unidade | sim |
| REQ-10 | `test/api/serverResult.test.js`, `test/services/albums/AlbumLoadService.test.js`, `test/models/albumLoadState.test.js` | `upstream_busy` com `Retry-After` segura; sem ele é falha; o aviso | app, unidade | sim |
| REQ-07 | `test/api/oldTabAgainstNewServer.test.js` | a aba da fatia 1 e a aba mais antiga contra 503 com `Retry-After` e 504 | app, unidade | sim |
| REQ-07, REQ-08, REQ-09 | cópia local do servidor, com `curl` (2026-11-19) | dois pedidos iguais: `found` nos dois, log `source` (3 requisições, 2014 ms) e `joined` (0); álbum inventado: `not_found`, 4 requisições, 1159 ms; corpo inválido: 400, `how: none` | servidor de verdade | não |

Bordas fora dos critérios: o estado «carga segurada» não tem tela (só o aviso); o nome «Pigs on the Wing 1» não casou com a faixa da fonte na conferência local (regra de casamento de faixas, anterior a esta feature).
