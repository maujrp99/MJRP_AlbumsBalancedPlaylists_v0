<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F52: O servidor diz a verdade · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> O desenho é a seção «O servidor diz a verdade — proposta (F52)» do `docs/specs/arch.md`; a seção 11 vale sobre as seções 2, 5 e 7. Este plano registra a fatia 1 e, na seção «Fatia 3 e medição», as fatias 3 e 4 como foram construídas. A fatia 2 foi entregue pela F55 e está no plano dela.

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

## Risks & Considerations
- **Ordem de publicação:** o site vai primeiro (lê o formato novo e o antigo), o servidor depois. Ao contrário, a aba aberta leria o formato novo com o código antigo: funciona para notas e para `/api/generate`, e perde a lista da IA até recarregar.
- **Mais «falhou» com a fonte instável:** antes, uma busca do raspador que falhava caía para a seguinte; agora qualquer requisição que falha derruba o pedido daquele álbum. É o desenho; «falhou» tem «tentar de novo» e não é guardado. O prazo de 30 s por requisição do raspador segue maior que os 20 s do app (fatia 3).
- **Registros já guardados no navegador** («sem nota» que foi falha, página com zero notas como `done`) não mudam nesta fatia; a fatia 2 troca a versão do registro.
- **Carga segurada por 429** pode durar até o fim da janela do limite (até uma hora); a tela mostra só o aviso, e os álbuns ficam como «carregando».
- **A suíte da raiz não tem o `cheerio`:** os testes do raspador usam um leitor de HTML de teste (sobre o jsdom) com a parte da interface que as buscas usam. As funções que leem a tabela de notas não são exercidas pela suíte; foram conferidas no servidor de verdade, numa cópia local.

- **(fatia 3) Mais de uma instância no Cloud Run:** a fila, as esperas e a divisão em voo são por instância. Sem `--max-instances=1` o ritmo com a fonte é o de cada instância, somado. O limite de 4 do app continua como segundo freio.
- **(fatia 3) Álbum ausente sob carga:** achar um álbum custa 3 requisições à fonte (2,0 s medido local); concluir «não tem» custa de 4 a cerca de 10. Com 4 pedidos do app por vez e 2 requisições por vez na fonte, um lote de álbuns ausentes pode passar de 15 s e voltar como `upstream_timeout` (falha, com «tentar de novo»), não como «não tem». O log (`answer: "upstream_timeout"`) dá o número.
- **(fatia 3) Fonte ocupada sem fim:** a carga segura, volta, e segura de novo enquanto a tela estiver aberta; não há limite de vezes.
- **(fatia 3) `/api/generate`** passa pela mesma fila e pelo prazo de 8 s por requisição, sem orçamento total.
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
