<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F69: Popularidade do Spotify: falha é falha, e «não conectado» não é «sem dado» · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito em 2026-11-19, junto com o código, no ramo `fix/f69-spotify-popularity-failure`. Não foi visto num navegador. O conserto do servidor só se prova publicando.

## Diagnóstico (lido no código antes de mexer, `main` em `b6a21de`)

| Onde | O que fazia | Por que era errado |
|---|---|---|
| `services/albums/adapters/enrichers.js`, `PopularityEnricher.enrich` | `done` se o álbum voltou com `spotifyId`, senão `empty` | os três casos (não tem, falhou, não conectado) viravam `empty`, guardado por 1 hora e escrito nos fatos como `popularity: false` |
| `helpers/SpotifyEnrichmentHelper.js`, `applyEnrichmentToAlbum` | `try/catch` em volta de tudo; sem sessão, devolvia o álbum como veio | engolia a falha e o «não conectado» |
| `services/SpotifyService.js`, `enrichAlbumData` | `catch` que devolvia `null` para qualquer erro | 401, 429 e rede viravam «não achei» |
| `services/SpotifyService.js`, `_searchByArtist` | `catch` que devolvia `[]` | a falha da última busca virava «nenhum candidato», isto é, «o Spotify não tem» |
| `services/SpotifyService.js`, `isAvailable` (`SpotifyAuthService.isAuthenticated`) | «conectado» = o acesso ainda não venceu | depois de 1 hora, com a renovação disponível, ninguém perguntava ao Spotify: «acesso vencido» virava «sem dado» sem nenhuma chamada |
| `services/SpotifyService.js`, `getAlbumTracksWithPopularity` | um pedido só de `/tracks?ids=` | álbum com mais de 50 faixas dava erro 400, engolido como «sem dado» |
| `services/SpotifyEnrichmentService.js` + `app.js` (`spotify-auth-success`) | laço de fundo: todas as `albumQueries` de todas as séries, uma a uma, 100 ms entre elas; gravava em `SpotifyEnrichmentStore`; avisos «Enriching N albums…» | fora da fila, do estado e da espera da carga; não atualizava os álbuns da tela; só lia consultas em texto (a consulta em objeto, que é a de hoje, era pulada: `parseAlbumQuery` devolvia `null`), então quase não fazia nada |
| `components/ranking/TracksRankingComparison.js`, `enrichWithSpotifyData` (botão «Enrich Data») | `searchAlbum` + `getAlbumTracksWithPopularity` direto do componente; escrevia no álbum da tela | fora da fila; mudava o álbum que pertence à carga; não guardava nada (o dado sumia na carga seguinte); o evento `album-enriched` não tinha quem ouvisse |
| `views/helpers/SeriesGridHelper.js`, `refreshGrid` | `applyEnrichmentToAlbums(..., { fetchIfMissing: false })` a cada redesenho | um terceiro escritor de dado do Spotify nos álbuns da carga, com uma leitura do Firestore por álbum sem popularidade a cada redesenho; a função de aptidão da F56 não o via (procurava `applyEnrichmentToAlbum(`, sem o `s`) |
| `server/lib/services/spotifyPopularity.js` | `{ error }` para «não achou», «sem credencial» e toda falha | alcançado por `POST /api/generate` (`GenerationService` → `fetchRankingForAlbum`); falha lida como «não tem» |

## Architecture Approach
<!-- How it fits arch.md; components affected; what this plan refines in arch.md and data-model.md. -->
Encaixa na «Carga da tela de álbuns» do `arch.md` (cada fonte atrás de uma porta, com estado próprio) e completa o ponto que a proposta da F52 deixou de fora (seção 11, item 10; seção 12, «fica aberto», item 3). A regra da F52, «falha é falha», passa a valer para a popularidade, e entra um terceiro estado, que a F52 não tinha: a fonte que depende de a pessoa estar conectada.

Componentes afetados: o cliente do Spotify (`SpotifyService`), a fonte de popularidade nova (`adapters/spotifyPopularitySource.js`), o `PopularityEnricher`, o estado da carga (`models/albumLoadState.js`, `models/albumSourceAsk.js`), o guardado (`AlbumCacheAdapter`), os fatos da série (`models/albumFacts.js`, `models/seriesFilter.js`), o aviso do blend (`models/albumAsk.js`), a comparação de faixas e o gêmeo do servidor. Refina no `arch.md` a seção nova «A popularidade do Spotify tem três desfechos (F69)»; o `data-model.md` não muda (o formato dos fatos está em `docs/manual/32_Data_Schema_Reference.md`).

## Technical Design
<!-- Data flow first · components/modules (what each receives, renders or returns, emits) · API/interface
     changes · explicit file paths. Each component names the REQ-xx it addresses. -->
**Fluxo.** `AlbumLoadService` (fila das fontes rápidas) → `PopularityEnricher.enrich(album)` → `SpotifyPopularitySource.read(album)` → primeiro o que já está em `SpotifyEnrichmentStore`; sem isso e sem sessão, `not_connected`; com sessão, `SpotifyService.albumPopularity(artist, title)`.

| Peça | Arquivo | Recebe → devolve | REQ |
|---|---|---|---|
| Resposta do Spotify | `public/js/services/SpotifyService.js`, `albumPopularity` (no lugar de `enrichAlbumData`) | `(artist, title)` → `{ found: true, data }` ou `{ found: false, reason: 'not_found' \| 'no_tracks' }`; **lança** `SpotifyReconnectError`, `SpotifyRateLimitError` ou o erro da rede/API. `_searchByArtist` deixa de engolir a falha; as faixas são lidas de 50 em 50 | REQ-01 |
| «Conectado» | `public/js/services/SpotifyAuthService.js`, `hasSession()` | → `true` se o acesso está no prazo **ou** pode ser renovado | REQ-01, REQ-02 |
| A fonte, um caminho só | `public/js/services/albums/adapters/spotifyPopularitySource.js` | `read(album)` → `{ kind: 'found', data }`, `{ kind: 'not_found', reason, rule }` ou `{ kind: 'not_connected' }`; **lança** na falha. `SpotifyReconnectError` vira `not_connected`. 429: guarda a hora até a qual não pergunta; espera de até `MAX_SPOTIFY_HOLD_MS` (30 s) é lançada com `hold: { reason: 'spotify_busy', retryAfterMs }`, a maior ou sem tempo é lançada sem `hold` (falha). Tudo o que alcança é dado (loja, cliente, sessão, relógio) | REQ-01, REQ-02, REQ-04, REQ-07 |
| Os três desfechos | `public/js/services/albums/adapters/enrichers.js`, `PopularityEnricher` | → `done` (numa cópia do álbum), `empty` com `reason` e `rule`, ou `not-connected`; a falha sobe | REQ-01, REQ-02 |
| Escrever o dado no álbum | `public/js/helpers/SpotifyEnrichmentHelper.js`, `applySpotifyData(album, data)` | só escreve; não pergunta nem lê loja. `applyEnrichmentToAlbum(s)` saíram | REQ-07 |
| Estado novo | `public/js/models/albumLoadState.js`: `EnrichmentStatus.NOT_CONNECTED = 'not-connected'`, `HoldReason.SPOTIFY_BUSY = 'spotify_busy'`, o texto em `holdNotice` | — | REQ-02, REQ-04 |
| O que o desfecho significa para a carga | `public/js/models/albumSourceAsk.js`, `sourceOutcome` | `not-connected` → `{ status: 'not-connected', note: null }`; `AlbumLoadService._publishSource` só guarda quando há `note` | REQ-02 |
| O guardado | `public/js/services/albums/adapters/AlbumCacheAdapter.js` | `empty` de popularidade sem motivo não vale (`ALWAYS_SAYS_WHY`); com `not_found`, vale `EMPTY_TRUST.not_found` (24 h) sob a regra de identidade do registro | REQ-05, REQ-06 |
| Os fatos | `public/js/models/albumFacts.js` (`FACTS_VERSION = 2`, `knownSources`, `factsOfEntry`, `hasSettledFacts`), `public/js/models/seriesFilter.js` (`describeQuery`, `countUnchecked(series, source)`) | uma chave por fonte que **respondeu**; a que falhou ou não estava conectada mantém o valor conhecido ou fica sem chave; `false` de popularidade sem versão é lido como «não se sabe» | REQ-02, REQ-06 |
| Aviso do blend | `public/js/models/albumAsk.js`: `SourceGap.NOT_CONNECTED`, «because Spotify is not connected» | — | REQ-02 |
| Ao conectar | `public/js/services/albums/popularityOnConnect.js`, ligado em `albumLoading.js` | ouve `spotify-auth-change`; com sessão, chama `refreshSource(albumId, 'popularity')` para os álbuns da tela em `not-connected` | REQ-03 |
| A linha da tela | `public/js/models/popularityState.js` (`describePopularity`), `public/js/components/ranking/TracksRankingComparison.js` (`renderPopularityNotice`), `public/js/controllers/SeriesController.js` (`getPopularityStatus`, `askPopularity`), `public/js/views/helpers/SeriesGridHelper.js` | o componente recebe `popularity: { status, onAsk }` e não fala com o Spotify | REQ-02, REQ-04, REQ-07 |
| O que saiu | `public/js/services/SpotifyEnrichmentService.js` (apagado), o ouvinte de `spotify-auth-success` em `public/js/app.js`, `enrichWithSpotifyData` do componente, a aplicação de dado do Spotify em `refreshGrid` | — | REQ-07 |
| Gêmeo do servidor | `server/lib/services/spotifyPopularity.js` | `getSpotifyPopularityRanking` → `{ outcome: 'found', … }`, `{ outcome: 'not_found' }` ou `{ outcome: 'not_configured' }`; **lança** `UpstreamError` (`upstreamErrorFrom`). `fetchRanking.js` não mudou: os dois pontos que o chamam já estão em `try/catch` e seguem para a fonte seguinte; a falha agora é registrada como falha | REQ-08 |

**As duas rotas de fora da fila, uma a uma.**
- *Laço de fundo (`SpotifyEnrichmentService`)*: **removido.** A carga já pede a popularidade de todo álbum que carrega; ao conectar, `popularityOnConnect` pede a dos que estão na tela. O que se perde: o pré-aquecimento das séries que não estão na tela (que, na prática, já quase não acontecia, porque o laço pulava as consultas em objeto).
- *Botão «Enrich Data»*: **roteado** por `refreshSource`. Mudou de rótulo conforme o estado («Try again», «Ask again») e some quando a fonte está em «não conectado» (aí só a pessoa pode resolver, no botão do Spotify do cabeçalho). Na janela do álbum e no inventário a linha não aparece: ali o álbum não está na carga.

**Por que `not-connected` é estado da fonte, e não espera (`hold`).** A espera é «o servidor disse algo e a carga volta sozinha» ou «entre na conta do app»; ela faz toda tela parar de esperar por fontes. «Não conectado ao Spotify» é permanente até a pessoa agir, vale para uma fonte só e não deve atrapalhar as notas. Como estado da fonte, o álbum fica pronto, o blend segue com o aviso certo, e nada mais muda.

**Linhas tocadas nos quatro arquivos em que a F58 trabalhava** (depois de trazer a `main` com a F58 para o ramo):
- `public/js/services/albums/AlbumLoadService.js`: o comentário das portas (linha 20, `'done'|'empty'|'not-connected'`) e, em `_publishSource`, `if (published && note)` com uma linha de comentário acima.
- `public/js/models/albumLoadState.js`: `NOT_CONNECTED` em `EnrichmentStatus`; `SPOTIFY_BUSY` em `HoldReason` e a linha do seu comentário; três linhas em `holdNotice`.
- `public/js/services/albums/AlbumAsks.js` e `public/js/utils/TaskQueue.js`: nada.
- (da F58, fora dos quatro) `public/js/models/albumSourceAsk.js`: uma linha em `sourceOutcome` e o seu comentário.

## UAT-28: as chaves do Spotify no `localStorage` (análise; proposta para o MJRP, nada mudou)

**O fato.** O app é um cliente público do Spotify (PKCE, sem segredo). `SpotifyAuthService.setSession` grava no `localStorage` o acesso (1 hora), o prazo e a chave de renovação. A F59 já apaga tudo ao sair da conta. Qualquer script que rode na página lê as três entradas.

**O que um conserto de verdade precisa.**

| Caminho | O que resolve | O que custa | Quem decide |
|---|---|---|---|
| A. Chaves só na memória da página | nada fica no disco | a cada recarga a pessoa precisa autorizar o Spotify de novo: sem a chave de renovação guardada em algum lugar não há como renovar, e a autorização silenciosa por `iframe` não é oferecida pelo Spotify. Também não protege contra o script que roda na página enquanto ela está aberta | produto (a recarga pede login) |
| B. Corretor de chaves no servidor: o servidor troca o código, guarda a chave de renovação e entrega à página só o acesso de 1 hora (em memória), com a sessão do app num cookie `HttpOnly` | a chave de renovação nunca chega ao navegador; um script na página só alcança um acesso de 1 hora | rotas novas no servidor, um lugar para guardar a chave de renovação por pessoa (com cifra e a regra do banco), o servidor passa a ser parte do login do Spotify, e o app deixa de ser cliente público (ganha segredo). É uma decisão de arquitetura e de produto | MJRP (ADR) |
| C. Aceitar o padrão: aprovar na constituição que credencial de terceiro pode ficar no navegador (BYOK, PRINCIPLES §I.14), com a ameaça escrita, e reduzir a ameaça: tirar o `'unsafe-inline'` do `script-src` e os scripts de terceiros (UAT-25 já serviu o Tailwind do próprio site) | fecha a issue pela regra; a superfície de roubo diminui | não tira a chave do disco | MJRP (emenda da constituição) |

**Recomendação do agente.** C agora (é o que o app já é, com a ameaça reduzida e escrita) e B se o app passar a ter mais de uma pessoa usando contas do Spotify. A não vale o custo: piora o uso e não fecha a ameaça principal. Nenhum dos três foi feito: o armazenamento está como estava.

## Dependencies
<!-- New dependencies with their justification — aligned with constitution.md and PRINCIPLES.md (Constitution
     Check); contradicting either needs a recorded decision first (mjrp-recording-decisions). -->
Nenhuma.

## Documents Consulted
<!-- arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, the NFR nodes. -->
`AGENTS.md`, `MEMORY.md` (`## Now`), `docs/specs/arch.md` («Carga da tela de álbuns»; a proposta da F52, seções 11 e 12; F56; F58), `docs/specs/behavior.md`, `docs/specs/uat.md` (UAT-206, UAT-28), `docs/decisions/0019-one-owner-for-the-album-load.md`, `server/lib/outcome.js`, `docs/manual/06`, `08`, `17`, `32`.

## Risks & Considerations
- **Mais chamadas ao Spotify depois de 1 hora.** Antes, com o acesso vencido, ninguém perguntava; agora a carga pergunta (até 6 álbuns ao mesmo tempo, 3 a 5 chamadas por álbum). O 429 é tratado (espera curta segura, longa falha), e o Spotify não é perguntado antes da hora que deu. O limite real do Spotify não foi medido.
- **Uma espera do Spotify é uma espera da carga inteira para quem lê.** Enquanto dura (até 30 s), o blend não espera por nenhuma fonte, as notas incluídas, e diz «not waited for: the server paused the load». É a regra da espera de hoje; o texto fala em «servidor» e aqui é o Spotify.
- **`SpotifyEnrichmentStore` é lido antes da sessão.** Um dado guardado ali com a regra de identidade antiga (antes da F55) segue valendo por 30 dias; a F69 não o confere.
- **Renovação que falha por rede encerra a sessão** (`SpotifyAuthService._requestNewAccess`): a pessoa vê «não conectado» e precisa conectar de novo. Não é desta feature; ficou escrito no `spec.md`.
- **O aviso do filtro** («N albums have not been checked… An album is checked the first time its series loads») não diz que a popularidade precisa do Spotify conectado.
- **O servidor não foi publicado nem exercitado contra o Spotify.**

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 21:10 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `SpotifyService.albumPopularity`: achou; não achou; sem faixas; falha da busca só pelo artista; falha ao ler faixas; 429; 401 sem renovação | resposta tipada ou erro tipado, nunca `null` para falha | serviço | sim (`test/services/spotify/SpotifyAlbumPopularity.test.js`) |
| REQ-01 | `SpotifyPopularitySource.read`: guardado; sem sessão; achou; não achou; falha; sessão que acaba | `found` / `not_found` / `not_connected` / lança | adaptador | sim (`test/services/albums/spotifyPopularity.test.js`) |
| REQ-02 | carga com a fonte em «não conectado»: estado, álbum pronto, nada guardado; fatos sem a chave; aviso do blend; linha da tela | `^library-loading-skeleton`, `^blend-source-missing`, `^album-enrich-spotify` | serviço, modelo, componente | sim |
| REQ-03 | sinal de sessão sem sessão não pede nada; com sessão pede só a popularidade, sem nova busca no catálogo | `^spotify-background-enrichment` | serviço | sim |
| REQ-04 | falha → `failed`, nada guardado, `retryFailed` refaz; 429 curto segura e retoma, um aviso; 429 longo ou sem tempo é falha; não pergunta antes da hora | `^spotify-background-enrichment` | serviço, adaptador | sim |
| REQ-05 | `not_found` com a regra vale 24 h; com outra versão da regra não vale | `^local-album-cache` | adaptador | sim |
| REQ-06 | `empty` de popularidade sem motivo não vale; `popularity: false` sem versão é «não se sabe» e some ou se confirma na carga | `^local-album-cache`; fatos | adaptador, modelo | sim |
| REQ-07 | só a fonte chama o Spotify para popularidade; só a composição a liga; o laço não existe; a tela não escreve `spotifyId` | — | arquitetura | sim (`test/architecture/spotifyPopularityOnePath.test.js`) |
| REQ-08 | servidor: achou; não achou; sem faixas; sem credencial; 500; 429; token recusado; lento | contrato da F52 | servidor | sim (`test/server/spotifyPopularityOutcome.test.js`) |
| todos | no navegador, com a conta do MJRP: desconectado, série carregada, fatos e registro; reconectar | os estados acima | tela | não (TASK-12, do integrador) |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): o estado de cada fonte não aparece no cartão da vista compacta; o blend, durante uma espera do Spotify, fala em «servidor».
