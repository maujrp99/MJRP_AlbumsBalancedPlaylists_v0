<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F55: Os álbuns pedidos, ou um aviso: uma regra só para dizer que é o mesmo álbum · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
<!-- How it fits arch.md; components affected; what this plan refines in arch.md and data-model.md. -->
> Este plano registra a fatia 1 como foi construída (via rápida: escrito depois do código). A fatia 2 não está planejada aqui. O resumo de arquitetura é a seção «Uma regra só para dizer que é o mesmo álbum (F55)» do `docs/specs/arch.md`.

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

**Alternativas pesadas:**
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

**O que saiu:** `public/js/models/AlbumIdentity.js` (a nota de semelhança) e `test/repro_identity.js`; de `utils/stringUtils.js`, `calculateSimilarity`, `SIMILARITY_THRESHOLD`, `generateAlbumKey` e `normalizeForComparison`; de `utils/NormalizationUtils.js`, `normalizeArtist`, `toFuzzyCore` e `normalizeFuzzy`; de `SpotifyService`, `_levenshteinDistance`, `_similarityScore`, `_searchByArtistFuzzy` e `_validateMatch`; de `api/client.js`, `extractArtist` e `extractAlbum` (a consulta é lida por `albumQuery.js`); do raspador, `pageContainsArtistOrTitle`.

**O que ficou, por não ser decisão de identidade de álbum:** `cleanTitle` (app e servidor) só limpa o TEXTO mandado a uma busca; `toCore` e `toFuzzyCore` em `server/lib/normalize.js` e `toCore` no app casam títulos de FAIXA; `shared/normalize.js` (`normalizeKey`) é a chave de faixa do ranking.

## Dependencies
<!-- New dependencies with their justification — aligned with constitution.md and PRINCIPLES.md (Constitution
     Check); contradicting either needs a recorded decision first (mjrp-recording-decisions). -->
Nenhuma.

## Documents Consulted
<!-- arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, the NFR nodes. -->
`docs/specs/arch.md` (a proposta da carga e «O servidor diz a verdade», item 5.2 e seção 11), `docs/decisions/0019-one-owner-for-the-album-load.md`, `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 3), `docs/manual/01_System_Architecture.md` (seção 6), `docs/specs/constitution.md`, `docs/specs/uat.md` (UAT-184). `info-arch.md`, `behavior.md` e `design-system.md` não se aplicam: a fatia não cria tela.

## Risks & Considerations
- **Álbum certo que deixa de aparecer.** A regra é estrita de propósito. Um título de catálogo com qualificador que não é edição («Weezer (Blue Album)», «(Original Motion Picture Soundtrack)») não bate com o título sem ele; uma série antiga cujo título guardado difere do título do catálogo perde o álbum mesmo com o identificador certo guardado. Mitigação: a contagem só-leitura, rodada antes de publicar, lista esses casos como `different`.
- **O guardado antigo.** O registro do navegador é por consulta e vale 7 dias: um álbum trocado já guardado continua aparecendo depois da publicação, até vencer ou até o «Clear Cache». A troca de versão do registro é da fatia 2 (e da fatia 2 da F52).
- **Formato da fonte raspada.** O rótulo «Título by Artista» e o cabeçalho da página do álbum foram lidos da fonte em 2026-11-19. Se mudarem, o raspador responde «não achei» em vez de notas; nunca o vizinho.
- **Conserto em `server/` só se prova publicando.** O raspador e o Spotify do servidor só foram provados em teste de unidade.
- **Mais chamadas pagas à IA.** Um álbum que a Apple tem, mas cujo título não bate, cai na segunda fonte (paga). O volume não foi medido.
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
| REQ-01 a REQ-08 | a contagem e a carga num navegador, com o login do MJRP; o raspador publicado | a série «Grunge Rock - Classics» mostra «Core» ou o aviso; a contagem roda e não grava | navegador e produção | não (à espera do integrador e do MJRP) |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): dois álbuns homônimos do artista na fonte de notas (dois «Stone Temple Pilots») não trazem o ano no link, e o raspador fica com o primeiro; romano e arábico («IV», «4») não são igualados; um título só de símbolos («÷») é comparado como está.
