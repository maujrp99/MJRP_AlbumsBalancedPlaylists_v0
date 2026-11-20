<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F55: Os álbuns pedidos, ou um aviso: uma regra só para dizer que é o mesmo álbum · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
<!-- How it fits arch.md; components affected; what this plan refines in arch.md and data-model.md. -->
> Este plano registra as duas fatias como foram construídas (via rápida: escrito depois do código). A fatia 2 está em «Fatia 2», mais abaixo em cada seção. O resumo de arquitetura é a seção «Uma regra só para dizer que é o mesmo álbum (F55)» do `docs/specs/arch.md`.

Uma regra, um módulo puro, dois lados que a usam (DP-19, resultado tipado):

- **A regra:** `shared/albumIdentity.js`. Não importa nada. Recebe `{ artist, title, year? }` dos dois lados e devolve um veredito tipado; escolhe entre candidatos, ou nenhum.
- **O lado do app:** `public/js/models/askedAlbum.js` lê a consulta guardada (o pedido) e o que cada fonte devolve (o candidato) nos mesmos três campos, e reexporta a regra. Um lugar adapta e pergunta; não compara texto.
- **O lado do servidor:** `server/lib/albumIdentity.js` carrega a regra por `import()` (o servidor é CommonJS; é o que já se faz com `shared/normalize.js` e `shared/curation.js`). O `scripts/deploy-server.sh` já copia a pasta `shared/` inteira para a imagem; nada mudou no script nem no `Dockerfile`.
- **Refina o `arch.md`:** a linha nova em «Compartilhado» e a seção nova no fim. Não muda o `data-model.md`: nenhum dado guardado mudou de forma (o álbum carregado ganhou um campo opcional em `metadata`, que é texto livre).

**Decisões tomadas na construção (do agente, revisáveis):**
- *Dois degraus de acerto.* Título inteiro igual (`exact-title`) vem antes de título igual só depois de tirar as notas de edição (`edition-of-title`). Assim «Core» pedido escolhe «Core» e não «Core (Super Deluxe Edition)» quando os dois estão nos resultados, e a edição serve quando é tudo o que há.
- *Nota de edição por vocabulário fechado, não por «qualquer coisa entre parênteses».* «(Blue Album)», «(Vol. 2)», «(Live at the Forum '76)» ficam no título; «(Deluxe Edition)», «(2017)», «[Expanded]», «- EP» saem.
- *Subtítulo:* só sai se for nota de edição (ver Open Questions do `spec.md`).
- *Artista:* comparado inteiro; o «and» entre nomes é tirado, para «Robert Plant & Alison Krauss» bater com os dois artistas que o Spotify devolve separados. Uma consulta sem artista é decidida só pelo título.
- *Consulta digitada num texto só* («The Beatles Abbey Road», sem « - »): bate quando o texto é o artista seguido do título do candidato. O modelo antigo aceitava isso; foi mantido para não piorar.
- *O raspador não abre a página de um resultado cujo rótulo já diz que é outro álbum.* Antes abria todas; agora só as de rótulo ilegível. Menos pedidos à fonte.
- *A segunda chamada à busca em HTML dentro de `getRankingForAlbum` saiu:* repetia a que `findAlbumId` já tinha feito.
- *O identificador guardado é conferido contra o pedido, como a tarefa pediu.* O risco (título guardado diferente do título do catálogo) está em Risks.

**Fatia 2 — o desenho.**

- **O segundo degrau mora na regra, não num lugar.** `compareAlbumIdentity` ganhou um terceiro veredito, `same-if-alone` (com `same: false` e o motivo `title-before-subtitle`): «é o álbum, se a fonte não tiver nada melhor». Uma comparação sozinha não sabe o que mais a fonte tem, então não aceita. Quem aceita é o `pickAlbum`, que vê todos os candidatos: o degrau é a primeira posição da ordem (`rank`), então um candidato do primeiro degrau sempre vem antes; e a escolha do segundo degrau só acontece quando todos os que passaram são um álbum só (o mesmo título sem as notas de edição). O veredito do álbum escolhido é sempre `same`; o motivo diz como.
- **Um álbum guardado não tem candidatos ao lado.** `compareKeptAlbum(pedido, guardado)` acredita no segundo degrau só quando o álbum traz o motivo que a escolha deixou nele (`identityReason`). É a mesma pergunta para o guardado no navegador, para a contagem e para «qual consulta da série pediu este álbum».
- **O que o álbum carrega.** `metadata.identityReason` (o motivo pelo qual foi aceito, sempre) e `metadata.replacedSourceId` (o identificador guardado de que ele NÃO veio, só quando o identificador mudou). O lugar guarda o motivo que recebeu; não nomeia o degrau.
- **Um escritor para a série.** O `SeriesFactsService` já era o único escritor do que a carga aprende (os `facts`, F51). A correção do identificador entra na mesma passada e na mesma escrita: `withSettledFacts` e depois `withCorrectedSources` (`models/albumFacts.js`), sobre `withCorrectedSource(consulta, álbum)` (`models/albumQuery.js`, o lugar que já escreve o formato da consulta). O caminho até o Firestore continua um: `SeriesRepository.saveAlbumFacts`.
- **O guardado é conferido na leitura.** `AlbumCacheAdapter.get` e `APIClient._keptAlbumAskedFor` perguntam à regra e esquecem o registro que não passa. Sem nova versão de registro.
- **Refina o `arch.md`:** a seção da regra, reescrita para as duas fatias. Refina o `data-model.md`: a linha de `albumQueries` (o `appleMusicId` passa a ser corrigido pelo app). Nenhum formato guardado mudou.

**Decisões tomadas na construção da fatia 2 (do agente, revisáveis; a F68 revê todas):**
- *Terceiro veredito, e não um `same` marcado.* Todo lugar que lê `.same` de uma comparação sozinha (o identificador guardado, a resposta da IA, a página do raspador) continua estrito sem mudar uma linha; afrouxar exige passar pela escolha entre candidatos.
- *«Exatamente um» conta álbuns, não registros.* A Apple lista o mesmo álbum mais de uma vez (edição simples, «Deluxe», remasterização). Dois registros do mesmo título com subtítulo são um álbum; dois títulos diferentes são dois, e aí é «não achei».
- *Sem artista, sem segundo degrau.* Uma consulta só com o título não tem em que se segurar.
- *Só o subtítulo.* O qualificador entre parênteses («Weezer (Blue Album)») não entrou: a decisão do MJRP foi sobre o caso do subtítulo.
- *O identificador é gravado também para o álbum do segundo degrau* (ver Open Questions do `spec.md`).
- *A capa e o ano acompanham o identificador, só se a consulta os guarda.* Foram copiados do álbum do identificador antigo quando a pessoa escolheu (`toAlbumQuery`).
- *Repetição ao adicionar é só o título próprio.* Uma edição é outra coisa a pedir (a pessoa escolhe a edição na Home).
- *No raspador e no Spotify, o degrau é julgado por lista.* Cada resposta de busca é uma lista; a ordem das buscas não mudou.

**Alternativas pesadas na fatia 2:**
- *Afrouxar no lugar da chamada (só no catálogo da Apple):* o Spotify e a fonte de notas ficariam sem o álbum, e a regra deixaria de ser uma. Recusada.
- *`same` com uma marca (`loose: true`):* todo `.same` já escrito passaria a aceitar o segundo degrau sem ver os outros candidatos. Recusada.
- *Nova versão do registro guardado (`albumload:v2:`):* descarta 227 álbuns e as notas guardadas para consertar 8, e não cobre o guardado antigo do blend. Recusada.
- *Um segundo serviço para gravar o identificador:* seriam duas escritas do mesmo array `albumQueries` em corrida (a última vence e apaga a outra). Recusada.
- *Achar a consulta a remover pela carga (a entrada que carregou o álbum):* mais exato, mas faria o `SeriesService` depender da carga da tela. Recusada nesta fatia; a regra basta.

**Alternativas pesadas (fatia 1):**
- *Manter a nota de semelhança e subir o limite:* qualquer limite deixa «Core Memories» perto de «Core» e «IV» perto de «III». Recusada: o título tem de bater inteiro.
- *Tirar tudo entre parênteses antes de comparar* (o que `toCore` fazia): «Weezer (Blue Album)» viraria «Weezer (Green Album)». Recusada.
- *Tirar qualquer subtítulo depois de «:»* (o que o `toFuzzyCore` do servidor fazia): «The Wall: Live in Berlin» viraria «The Wall». Recusada.
- *Conferir a resposta da IA no servidor:* o servidor recebe a consulta como texto e não a devolve estruturada; quem aceita o álbum é o app. Fica no app nesta fatia.

## Technical Design
<!-- Data flow first · components/modules (what each receives, renders or returns, emits) · API/interface
     changes · explicit file paths. Each component names the REQ-xx it addresses. -->
**Fluxo.** Fonte devolve candidatos → o lugar lê cada um em `{ artist, title, year? }` → `pickAlbum(pedido, candidatos, leitor)` → o candidato que passa, ou «não achei» pelo caminho que o lugar já tinha.

| Componente | Arquivo | Recebe → devolve | REQ |
|---|---|---|---|
| A regra | `shared/albumIdentity.js` | `compareAlbumIdentity(pedido, candidato)` → `{ verdict, same, reason }`; `pickAlbum(pedido, candidatos, leitor)` → `{ found, candidate, index, verdict }`; `sameArtist(a, b)`; `albumFromLabel('Título by Artista')` → leituras | REQ-01 |
| O lado do app | `public/js/models/askedAlbum.js` | `askedAlbum(consulta)`, `appleCandidate`, `spotifyCandidate`, `localCandidate` → `{ artist, title, year }` | REQ-01 |
| O carregador no servidor | `server/lib/albumIdentity.js` | `loadAlbumIdentity()` → a regra, carregada uma vez | REQ-01 |
| Catálogo da Apple (carga) | `public/js/services/albums/adapters/CatalogAdapter.js` | `_searchInApple` escolhe pela regra; `_detailsOfChosen(id, consulta)` confere o álbum do identificador; `metadata.replacedSourceId` quando o identificador não foi usado | REQ-02, REQ-03 |
| Catálogo da Apple (caminho antigo) e resposta da IA | `public/js/api/client.js` | `fetchAlbum` escolhe pela regra; `_isTheAlbumAskedFor(consulta, resposta)` antes de `normalizeAlbumData` | REQ-02, REQ-07 |
| Spotify no app | `public/js/services/SpotifyService.js` | `searchAlbum(artist, album, year?)`: três buscas listam, a regra aceita | REQ-04 |
| Spotify no servidor | `server/lib/services/spotifyPopularity.js` | `findSpotifyAlbum(pedido, token, http?)` | REQ-04 |
| Raspador | `server/lib/scrapers/besteveralbums.js` | `pickSuggested`, `albumsNamedByPage`, `pageIsTheAlbum`, `fetchAlbumPage`, `findArtistPage`, `rankingFromArtistPage`: cada um lê em `{ title, artist }` e pergunta à regra | REQ-05 |
| Dados locais | `public/js/services/OptimizedAlbumLoader.js` | `findAlbum(artist, album)` → a linha do álbum pedido, ou `null` | REQ-06 |
| Contagem | `public/js/services/albums/albumIdentityAudit.js`; `countWrongAlbums` em `albumLoading.js`; `window.albumIdentityAudit` em `app.js`; `peek` em `CacheManager`, `MemoryCache`, `IndexedDBCache`, `AlbumCacheAdapter` | `auditAlbumIdentity({ series, shownFor })` → `{ rows, summary }` | REQ-08 |
| Função de aptidão | `test/architecture/albumIdentityRule.test.js` | lê os arquivos-fonte | REQ-09 |

**Fatia 2.**

| Componente | Arquivo | Recebe → devolve | REQ |
|---|---|---|---|
| A regra, segundo degrau | `shared/albumIdentity.js` | `compareAlbumIdentity` → `{ verdict: 'same' \| 'same-if-alone' \| 'different', same, reason }`; `pickAlbum` aceita o segundo degrau quando é o único álbum; `compareKeptAlbum(pedido, { artist, title, identityReason })` | REQ-13 |
| O lado do app | `public/js/models/askedAlbum.js` | `keptAlbum(álbum)` → `{ artist, title, year, identityReason }`; `indexOfQueryFor(consultas, álbum)`; `alreadyAskedFor(consultas, álbum)`; `identityNotice(álbum)` → a linha do cartão, ou `null` | REQ-12, REQ-15 |
| Catálogo da Apple | `adapters/CatalogAdapter.js` | `metadata.identityReason`; `replacedSourceId` só quando o identificador mudou; o identificador guardado aceita só o primeiro degrau | REQ-10, REQ-14, REQ-15 |
| Caminho antigo e resposta da IA | `public/js/api/client.js` | `metadata.identityReason`; `_keptAlbumAskedFor(consulta)` confere o guardado antigo; a resposta da IA aceita só o primeiro degrau | REQ-11, REQ-14 |
| Raspador | `server/lib/scrapers/besteveralbums.js` | `pageIsTheAlbum` aceita só o primeiro degrau (uma página, nenhum outro candidato à vista) | REQ-14 |
| A consulta corrigida | `public/js/models/albumQuery.js`, `models/albumFacts.js` | `withCorrectedSource(consulta, álbum)`; `withCorrectedSources(consultas, entradas, chave)` → `{ albumQueries, changed }` | REQ-10 |
| O escritor | `public/js/services/series/SeriesFactsService.js` | uma escrita por série terminada, com os fatos e os identificadores corrigidos | REQ-10 |
| O guardado da carga | `adapters/AlbumCacheAdapter.js` | `get` descarta o registro que não é o álbum pedido; `peek` devolve também o motivo | REQ-11, REQ-15 |
| Adicionar e remover | `public/js/services/SeriesService.js` | `addAlbumToSeries`, `removeAlbumFromSeries` perguntam à regra | REQ-12 |
| O cartão | `public/js/components/ui/AlbumCardRenderer.js` | `renderBadges(álbum)`: o selo do ranking e a linha do segundo degrau | REQ-15 |
| Contagem | `services/albums/albumIdentityAudit.js`, `albumLoading.js` | pergunta por `compareKeptAlbum`; o álbum da tela é lido por `keptAlbum` | REQ-15 |
| Função de aptidão | `test/architecture/albumIdentityRule.test.js` | o segundo degrau, os leitores do guardado, o `SeriesService`, o escritor único | REQ-16 |

**O que saiu:** `public/js/models/AlbumIdentity.js` (a nota de semelhança) e `test/repro_identity.js`; de `utils/stringUtils.js`, `calculateSimilarity`, `SIMILARITY_THRESHOLD`, `generateAlbumKey` e `normalizeForComparison`; de `utils/NormalizationUtils.js`, `normalizeArtist`, `toFuzzyCore` e `normalizeFuzzy`; de `SpotifyService`, `_levenshteinDistance`, `_similarityScore`, `_searchByArtistFuzzy` e `_validateMatch`; de `api/client.js`, `extractArtist` e `extractAlbum` (a consulta é lida por `albumQuery.js`); do raspador, `pageContainsArtistOrTitle`.

**O que ficou, por não ser decisão de identidade de álbum:** `cleanTitle` (app e servidor) só limpa o TEXTO mandado a uma busca; `toCore` e `toFuzzyCore` em `server/lib/normalize.js` e `toCore` no app casam títulos de FAIXA; `shared/normalize.js` (`normalizeKey`) é a chave de faixa do ranking.

## Dependencies
<!-- New dependencies with their justification — aligned with constitution.md and PRINCIPLES.md (Constitution
     Check); contradicting either needs a recorded decision first (mjrp-recording-decisions). -->
Nenhuma.

## Documents Consulted
<!-- arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, the NFR nodes. -->
`docs/specs/arch.md` (a proposta da carga e «O servidor diz a verdade», item 5.2 e seção 11), `docs/decisions/0019-one-owner-for-the-album-load.md`, `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 3), `docs/manual/01_System_Architecture.md` (seção 6), `docs/specs/constitution.md`, `docs/specs/uat.md` (UAT-184). `info-arch.md`, `behavior.md` e `design-system.md` não se aplicam: a fatia não cria tela.

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — atualizado (commit `196e704`)
- `docs/specs/data-model.md` — atualizado (commit `196e704`)
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (commit `196e704`)
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- **Álbum certo que deixa de aparecer.** A regra é estrita de propósito. Um título de catálogo com qualificador que não é edição («Weezer (Blue Album)», «(Original Motion Picture Soundtrack)») não bate com o título sem ele; uma série antiga cujo título guardado difere do título do catálogo perde o álbum mesmo com o identificador certo guardado. Mitigação: a contagem só-leitura, rodada antes de publicar, lista esses casos como `different`.
- **O guardado antigo.** O registro do navegador é por consulta e vale 7 dias: um álbum trocado já guardado continua aparecendo depois da publicação, até vencer ou até o «Clear Cache». A troca de versão do registro é da fatia 2 (e da fatia 2 da F52).
- **Formato da fonte raspada.** O rótulo «Título by Artista» e o cabeçalho da página do álbum foram lidos da fonte em 2026-11-19. Se mudarem, o raspador responde «não achei» em vez de notas; nunca o vizinho.
- **Conserto em `server/` só se prova publicando.** O raspador e o Spotify do servidor só foram provados em teste de unidade.
- **Mais chamadas pagas à IA.** Um álbum que a Apple tem, mas cujo título não bate, cai na segunda fonte (paga). O volume não foi medido.
- **Fatia 2: o segundo degrau aceita um álbum que não é o pedido.** «Greatest Hits» pedido, e a fonte só com «Greatest Hits: Vol 2», carrega o volume 2. É o custo do afrouxamento decidido; a linha no cartão diz que foi assim, e a contagem mostra o motivo. Mitigação: só um álbum, só com artista, só num sentido, nunca na frente do álbum pedido.
- **Fatia 2: a lista da busca é curta.** A Apple é perguntada por 5 resultados: «o único álbum com subtítulo» é o único entre esses 5.
- **Fatia 2: a fonte de notas e o título comprido.** As notas e a popularidade são pedidas com o título do álbum carregado («No Quarter: Jimmy Page & Robert Plant Unledded»). Se a fonte só tiver «No Quarter», não casa: o degrau é num sentido só. Fica como «sem dado». Não medido contra a fonte real.
- **Fatia 2: mais chamadas à segunda fonte (paga) logo depois de publicar.** O álbum trocado descartado do guardado é buscado de novo; se a Apple não o tiver pelo título, cai na IA, a cada carga, até a consulta ser consertada. São 8 álbuns na conta do MJRP, e 7 deles a Apple tem.
- **Fatia 2: uma busca a mais para o álbum do segundo degrau.** O identificador gravado dele não é obedecido sozinho: cada carga sem guardado faz a leitura por identificador e depois a busca por nome.
- **Fatia 2: escrita concorrente.** A correção do identificador regrava o array `albumQueries` inteiro, como os `facts`: duas abas, a última vence (já declarado no `data-model.md`).
- **Complexidade.** As funções novas estão em 10 ou menos (conferido com a regra `complexity` do ESLint). `APIClient._fetchAlbumFromAPI` já estava acima do limite e ganhou um desvio (11 → 12); é da F58.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 18:10 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/shared/albumIdentity.test.js` | «Core» não é «Shangri-La Dee Da» nem «Core Memories»; edições; subtítulo nos dois sentidos; álbum homônimo do artista e títulos numerados; o ano só ordena; sem candidato, «não achei» | compartilhado, unidade | sim |
| REQ-02 | `test/services/albums/catalogIdentity.test.js`, `test/api/clientIdentity.test.js` | com «Shangri-La Dee Da» primeiro nos resultados, carrega «Core»; só com outros álbuns, não carrega nenhum | app, unidade | sim |
| REQ-03 | `test/services/albums/catalogIdentity.test.js` | identificador que leva ao álbum, a uma edição dele, a outro álbum, ou que não existe mais | app, unidade | sim |
| REQ-04 | `test/services/spotify/SpotifyAlbumMatch.test.js`, `test/server/spotifyAlbumIdentity.test.js` | nunca o primeiro resultado; o álbum simples antes da edição; dois artistas | app e servidor, unidade | sim |
| REQ-05 | `test/server/scraperIdentity.test.js`, `test/server/ratings.test.js` | cada ponto de aceite do raspador, com respostas no formato da fonte; «álbum ausente, artista presente dá não achei»; falha continua falha | servidor, unidade | sim |
| REQ-06 | `test/services/OptimizedAlbumLoader.identity.test.js` | nunca a primeira linha | app, unidade | sim |
| REQ-07 | `test/api/clientIdentity.test.js` | a IA responde outro álbum: `null`, uma chamada só | app, unidade | sim |
| REQ-08 | `test/services/albums/albumIdentityAudit.test.js` | uma linha por álbum pedido, os totais, nenhuma escrita (`peek`) | app, unidade | sim |
| REQ-09 | `test/architecture/albumIdentityRule.test.js` | cada lugar importa a regra e não compara texto | arquitetura | sim |
| REQ-10 | `test/services/series/SeriesFactsService.test.js`, `test/services/albums/catalogIdentity.test.js` | o identificador novo, a capa e o ano gravados uma vez, na escrita dos fatos; nada gravado quando o identificador foi obedecido; a falha da escrita não derruba nada | app, unidade | sim |
| REQ-11 | `test/services/albums/adapters.test.js`, `test/api/clientIdentity.test.js` | «Core» pedido e «Shangri-La Dee Da» guardado: descartado; a edição fica; o título com subtítulo só fica com o motivo; `peek` não descarta | app, unidade | sim |
| REQ-12 | `test/services/SeriesService.identity.test.js` | remover «Core» não remove «Core Memories»; edição, acento, `&amp;`; o id; adicionar não é barrado por «contém» | app, unidade | sim |
| REQ-13 | `test/shared/albumIdentity.test.js` | «No Quarter»; «The Wall» com e sem «The Wall»; os dois «Greatest Hits»; um sentido só; sem artista; dois registros do mesmo álbum | compartilhado, unidade | sim |
| REQ-14 | `test/services/albums/catalogIdentity.test.js`, `test/api/clientIdentity.test.js`, `test/services/spotify/SpotifyAlbumMatch.test.js`, `test/server/spotifyAlbumIdentity.test.js`, `test/server/scraperIdentity.test.js` | cada fonte com lista aceita o segundo degrau; o identificador guardado, a resposta da IA e a página sozinha não | app e servidor, unidade | sim |
| REQ-15 | `test/components/ui/AlbumCardIdentityNote.test.js`, `test/services/albums/albumIdentityAudit.test.js` | a linha no cartão (grade e lista) e em nenhum outro; a contagem diz igual, com o motivo | app, unidade | sim |
| REQ-16 | `test/architecture/albumIdentityRule.test.js` | nenhum lugar nomeia ou concede o segundo degrau; um escritor só | arquitetura | sim |
| REQ-10 a REQ-15 | a carga das séries «Robert Plant 00-10s» e «Grunge Rock - Classics» num navegador, com o login do MJRP; a contagem antes e depois | «No Quarter» carrega com a linha; «Core» no lugar de «Shangri-La Dee Da» sem «Clear Cache»; o identificador novo na série; `different: 0` | navegador | não (à espera do integrador: TASK-15) |
| REQ-01 a REQ-08 | a contagem e a carga num navegador, com o login do MJRP; o raspador publicado | a série «Grunge Rock - Classics» mostra «Core» ou o aviso; a contagem roda e não grava | navegador e produção | não (à espera do integrador e do MJRP) |

Bordas da fatia 2 fora dos critérios: o título pedido que já tem subtítulo e é o começo de um título mais comprido («Live: Volume One» e «Live: Volume One - The Encores») também é segundo degrau; o identificador guardado que leva a outro álbum, quando o álbum pedido só existe na segunda fonte (IA), fica guardado e não obedecido.

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): dois álbuns homônimos do artista na fonte de notas (dois «Stone Temple Pilots») não trazem o ano no link, e o raspador fica com o primeiro; romano e arábico («IV», «4») não são igualados; um título só de símbolos («÷») é comparado como está.
