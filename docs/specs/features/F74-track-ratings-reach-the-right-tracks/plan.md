# Plan — Feature F74: A nota de cada faixa chega à faixa certa · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
Uma regra de identidade de faixa, no molde da regra de identidade de álbum (`shared/albumIdentity.js`): um módulo puro, degraus com nome, um exemplo real e um teste para cada exceção, e uma versão. O servidor e o app perguntam a ela; nenhum outro lugar compara títulos de faixas. Sem camada nova e sem ponte nova: o servidor carrega a regra como já carrega a do álbum.

**O que a investigação achou antes do desenho** (12 páginas do BestEverAlbums lidas em 2026-11-20; `reports/evidence/F74/2026-11-20-track-identity-measure.md`):

| Causa | Faixas sem nota | O que foi feito |
|---|---|---|
| (a) a mesma faixa escrita de outro jeito | 12 | a regra (`shared/trackIdentity.js`) |
| (b) o leitor não lê linhas da página | 0 | nada: o leitor tira todas as linhas das 12 páginas |
| (c) a fonte dá nota a menos faixas do que a edição tem | 83 | nada: não é defeito |
| (d) a página de outra edição | 7 | a busca escolhe a página pelas faixas (`pageOfTheEdition`, no raspador) |
| (e) outra | 1 | nada: a fonte chama a faixa por outro nome |

Quem comparava títulos de faixas, e com quê, antes desta feature:

| Lugar | Chave |
|---|---|
| `server/lib/services/EnrichmentService.js` | `normalizeKey` (apaga os parênteses), depois `toFuzzyCore` (corta em «:», « - », « by »; tira o «e» final) |
| `server/lib/ranking.js` | `normalizeKey`; depois «um contém o outro»; depois 40% das palavras em comum |
| `server/lib/rankingSources/completeRanking.js`, `server/lib/albumAnswer.js` | `normalizeKey` |
| `public/js/helpers/BEAEnrichmentHelper.js` | `NormalizationUtils.toCore` (apaga os parênteses): mesmo com a resposta certa do servidor, a extra voltava a pegar a nota da original aqui |
| `public/js/helpers/SpotifyEnrichmentHelper.js` | o título em minúsculas; depois «um contém o outro» |
| `public/js/models/albumAverages.js` | só letras e números |
| `public/js/ranking/BalancedRankingStrategy.js`, `public/js/algorithms/mixins/TrackEnrichmentMixin.js` | cada um a sua |
| `public/js/models/Album.js`, `public/js/ranking/UserRankingStrategy.js` | o título em minúsculas |

## Technical Design
**A regra** (`shared/trackIdentity.js`, `TRACK_IDENTITY_RULE_VERSION = 1`). Um título é lido em: o texto inteiro (parênteses como palavras), o título fora das notas, e as notas (o que vem entre parênteses, colchetes ou chaves, ou depois de « - »). Uma nota ou só descreve a mesma gravação (`DESCRIBING_NOTES`: remaster, mono, estéreo, mix com ano, «Album Version», «Bonus Track»; «feat.» e «vs»; «Including …») ou faz parte do que a faixa é. Os degraus, do mais forte ao mais fraco (`TIERS`):

1. `same-text` — o mesmo texto: caixa, acento, pontuação, parênteses e «&» à parte. (REQ-01)
2. `same-song-described` — igual depois de tirar as notas que só descrevem, ou depois de igualar o que é só escrita («Part One» = «Pt 1», o «The» do começo, as escritas de `KNOWN_WRITINGS`). (REQ-01)
3. `same-place-one-word-apart` — o mesmo número de faixa, e um título é o outro com uma palavra a mais. (REQ-01)
4. `medley-listed-shorter` — dois medleys, um listando só as primeiras músicas do outro. (REQ-01)
5. `title-without-its-note` — um título é o outro sem a nota. (REQ-02)

`matchTracks(faixasDoÁlbum, entradasDaFonte)` percorre os degraus do mais forte ao mais fraco sobre o álbum inteiro e dá cada entrada a uma faixa só: ganha o degrau mais forte, depois a faixa que vem antes. (REQ-02, REQ-03) Duas notas diferentes no mesmo título são duas gravações (`another-recording`) e nenhum degrau as junta.

**O que mudou do desenho sugerido, e por quê.**
- O degrau «nunca é a mesma» virou o degrau mais fraco numa distribuição de uma para uma. Com «nunca», «Live At The Apollo (1962)» cairia de 7 faixas com nota para nenhuma (toda faixa diz «(Live 1962)», a fonte escreve sem) e «Substance» perderia cinco («The Perfect Kiss (Substance Edit)» e «Perfect Kiss»). A extra continua sem levar a nota da original: a original pega a entrada antes.
- Sem lista de palavras de versão para os parênteses: toda nota que não só descreve é tratada igual. A lista existe só para o que vem depois de « - », onde o traço pode ser parte do título.
- Dois degraus a mais, por faixas reais: o do mesmo número de faixa (4 faixas: «My Sarah», «Do Anything You Want to Do», «A Train Makes a Lonely Sound», «Ride On Pony») e o do medley (1).
- «(Single Version)» fica como outra versão: não há exemplo nos dados.

**Os lugares que passaram a perguntar à regra.** (REQ-04, REQ-07)
- Servidor: `lib/trackIdentity.js` (a ponte); `services/EnrichmentService.js` (as notas; a resposta leva `trackRule`); `ranking.js` (as menções de cada fonte, fonte por fonte); `rankingSources/completeRanking.js`, `rankingSources/rankingPlan.js`, `fetchRanking.js`; `albumAnswer.js`, `services/GenerationService.js`; `routes/debug.js`.
- App: `models/sameTrack.js` (o lado do app); `helpers/BEAEnrichmentHelper.js`; `helpers/SpotifyEnrichmentHelper.js`; `models/albumAverages.js`; `models/Album.js`; `ranking/UserRankingStrategy.js`; `ranking/BalancedRankingStrategy.js`; `algorithms/mixins/TrackEnrichmentMixin.js`.
- Saíram: `shared/normalize.js`, `public/js/utils/NormalizationUtils.js`, e de `server/lib/normalize.js` os limpadores `toCore`, `toFuzzyCore`, `normalizeFuzzy`, `normalizeArtist`. `normalizeKey` não ficou para nenhum outro uso: ninguém mais precisava dele.
- Não é identidade de faixa e ficou como estava: `SpotifyEnrichmentRepository.normalizeKey(artist, album)`, que é a chave de um álbum no armazenamento.

**A página da edição** (causa d; REQ-05). `getRankingForAlbum(título, artista, { tracks })`. Quando a página aceita pela regra do álbum divide com o álbum menos da metade das faixas dela, o raspador lê as outras páginas de mesmo nome que a mesma busca listou (no máximo duas) e fica com a que divide mais faixas. As páginas de mesmo nome vêm de `candidatesOfTheSameName`, função nova de `shared/albumIdentity.js` que lista e não aceita nada. O raspador guarda também o número da faixa na página (`trackNumber`).

**As notas guardadas** (REQ-06). O servidor carimba `found` e `no_ratings` com `trackRule`. O `AcclaimEnricher` leva o carimbo; `sourceOutcome` o põe na anotação; o `AlbumCacheAdapter` o grava em `enrichment.acclaim.trackRule` e, na leitura, só acredita nas notas com o carimbo da versão do app. Sem o carimbo, o álbum sai sem as notas, sem a evidência e sem o endereço da página, e a fonte é perguntada de novo, uma vez. O `BEAEnrichmentHelper` escreve a resposta inteira: a linha sem nota tira a nota antiga da faixa.

**Testes.** `test/shared/trackIdentity.test.js` (83), `test/server/trackRatings.test.js`, `test/server/scraperEdition.test.js`, `test/services/albums/trackRatings.test.js`, `test/architecture/trackIdentityRule.test.js`. Dados reais em `test/fixtures/trackIdentity/measuredAlbums.json` e `test/fixtures/besteveralbums/tracks/`.

**A segunda fatia** (`TRACK_IDENTITY_RULE_VERSION = 2`; `reports/evidence/F74/2026-11-20-track-identity-second-measure.md`). O que as páginas mostraram, e o que foi feito:

| O que era | Faixas | O que foi feito |
|---|---|---|
| o título e a lista das suas partes depois de «: » (Yes, Crosby, Stills, Nash & Young, Genesis «Supper's Ready») | 4 | degrau `title-with-its-parts`: o mesmo título antes dos dois-pontos, e as partes iguais sem a numeração («I.», «A.»), ou as partes de um lado só (REQ-08) |
| a fonte lista duas faixas num título («The Cinema Show / Aisle Of Plenty») | 1 | degrau `first-of-titles-listed-together`: a primeira leva a nota, a segunda não (REQ-09) |
| letras trocadas por asteriscos (Dr. Dre) | 4 | degrau `letters-starred-out`: um asterisco por letra, as outras palavras iguais (REQ-09) |
| o título é o que o outro traz entre parênteses («Bang a Gong (Get It On)» e «Get It On») | 1 | degrau `title-in-its-brackets`, o mais fraco; duas palavras no mínimo (REQ-09) |
| só escrita: «Fourth» e «4th», «Five» e «5», «Pts. 2 & 3» e «Pt. Two & Three», «A Song…» e «Song…», «Hangin'» e «Hanging», «a.K.A.» e «/» | 7 | no segundo degrau, em `writtenAlike` (REQ-09) |
| uma grafia («Midnite» / «Midnight», «Greatdayndamornin'» / «Greatdayindamornin'») | 2 | `KNOWN_WRITINGS` (REQ-09) |
| o lugar na lista lido como número da faixa («My Sarah», «Do Anything You Want to Do», «Ride On Pony», em produção) | 3 | a regra lê `position` da faixa (`placeOfTrack`); sem ele, o lugar na lista (REQ-10) |
| o leitor pulava títulos de uma letra («u», «i») e cortava o número de «2:45 AM» | 3 | o raspador: título de uma letra é faixa; a linha que tem o número numa célula própria fica com o título inteiro (`titleWithoutItsNumber`) (REQ-11) |
| não está na página da fonte | 13 | nada |

Nenhum degrau novo aceita por «um contém o outro»: o de partes exige o título inteiro antes dos dois-pontos; o das faixas listadas juntas exige a primeira inteira; o dos parênteses exige a nota inteira. O degrau do medley não mudou, e um medley não entra no degrau de partes. A versão subiu para 2: as notas guardadas com a versão 1 são pedidas de novo, uma vez.

## Dependencies
- Publicação do servidor: o casamento das notas e a escolha da edição acontecem em `server/lib`. Publicar o servidor antes do app.
- A publicação já leva `shared/` inteiro (`scripts/deploy-server.sh` copia a pasta para `server/_shared_temp`); o arquivo novo entra sem mudança no script.

## Documents Consulted
`AGENTS.md`, `MEMORY.md`, `docs/specs/arch.md` (a regra do álbum, F55 e F68; o servidor diz a verdade, F52), `docs/specs/behavior.md`, `docs/specs/uat.md` (UAT-221), `shared/albumIdentity.js`, `test/architecture/albumIdentityRule.test.js`, `scripts/deploy-server.sh`, `docs/manual/00_Deployment_and_Setup.md`, `docs/specs/features/F73-screens-keep-the-field-and-let-go/plan.md`.

Declarações do passo retroativo da via rápida:
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — atualizado (no commit do conserto): a seção «Uma regra só para dizer que é a mesma faixa (F74)» e a linha de `shared/` no mapa de componentes
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade nem campo do Firestore mudou; o registro do álbum no navegador ganhou `enrichment.acclaim.trackRule`, e a forma desse registro está descrita em `docs/specs/arch.md` e no manual, não aqui
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhuma tela mudou de forma
- `docs/specs/behavior.md` — atualizado (no commit do conserto): `^track-ratings-right-track` nasce, `^local-album-cache` muda
- `docs/wiki/` — sem mudança: nenhuma página descreve a regra que esta feature mudou

## Risks & Considerations
- **Ordem de publicação.** O app novo com o servidor antigo não acredita em nenhuma nota guardada nem recebida (não vem carimbada): pergunta de novo a cada carga, até o servidor novo entrar.
- **O álbum fica sem notas por alguns segundos** na primeira abertura depois da mudança; se a fonte falhar, até a carga seguinte.
- **Menos faixas com nota em alguns álbuns.** Onde uma nota estava em duas faixas, uma delas perde: «Mirage (Deluxe Edition)» vai de 10 para 6. A média do álbum muda.
- **«Lost Someone»** perde a nota que tinha (era a da segunda metade). Pergunta aberta na spec.
- **O caminho de `/api/generate`** deixou de casar menções por «um contém o outro» e por 40% das palavras: uma menção da IA com o título escrito de um jeito que nenhum degrau reconhece vai para as menções sem faixa.
- **Até dois pedidos a mais à fonte** quando a primeira página é de outra edição, dentro do prazo do pedido e pela fila educada.
- **As médias do inventário** só mudam com «Update ratings».
- **Segunda fatia:** «F**k» casa com qualquer palavra de mesmas letras à vista e mesmo tamanho; «X (Outro Nome)» casa com uma faixa «Outro Nome» da fonte quando nenhuma faixa do álbum tem esse título. Os dois são degraus fracos, numa distribuição de uma para uma.
- **Segunda fatia: não vista num navegador nem contra o servidor publicado.** A primeira foi publicada e medida em produção pelo integrador em 2026-11-20.
