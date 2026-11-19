<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F52: O servidor diz a verdade · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> O desenho é a seção «O servidor diz a verdade — proposta (F52)» do `docs/specs/arch.md`; a seção 11 vale sobre as seções 2, 5 e 7. Este plano registra a fatia 1 como foi construída. As fatias 2 a 4 não estão planejadas aqui.

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

## UI/UX Design (if the feature touches a screen)
Nenhuma tela muda nesta fatia. Aparece um aviso (toast) quando a carga é segurada: «Your sign-in could not be confirmed. Sign in again to keep loading ratings.» ou «The server asked to slow down. Loading is paused. It resumes by itself at HH:MM.».

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

Bordas fora dos critérios: o estado «carga segurada» não tem tela (só o aviso); o nome «Pigs on the Wing 1» não casou com a faixa da fonte na conferência local (regra de casamento de faixas, anterior a esta feature).
