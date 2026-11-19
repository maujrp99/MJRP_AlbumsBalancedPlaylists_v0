# Plan — Feature F46: Cada série termina carregada, vazia ou com aviso de falha, e nada some durante a carga · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), em 2026-11-19. Diz o que a F45 e a F51 já tinham entregue desta feature e o que foi feito no ramo `fix/f46-albums-load-state`.

## Architecture Approach
Segue a proposta «Carga da tela de álbuns» do `docs/specs/arch.md`; a seção 18 registra o que esta feature construiu e vale sobre as anteriores.

**Já entregue antes desta feature.** Pela F45: a store de carga com uma entrada por pedido, o estado da série derivado (`models/albumLoadState.js`), a grade desenhada por esse estado, o aviso «N albums did not load · Try again» e `AlbumLoadService.retryFailed`. Pela F51: a página desenhada inteira (sem o truque das três primeiras séries) e as inscrições do controlador desfeitas no começo de cada visita.

**O que esta feature acrescenta.**
1. O ranking pessoal ganha dono no cliente: `OwnRankingService` (salva e mantém a lista de álbuns ranqueados, lida uma vez por pessoa) e `OwnRankingsStore` (estado puro). O repositório só é alcançado onde os serviços são montados.
2. A carga ganha `refreshSource(albumId, source)`: refaz uma fonte de um álbum. Para isso o trabalho de cada álbum passou a ser encadeado (um depois do outro por álbum), de modo que uma fonte lenta em curso não escreve por cima do ranking recém-lido.
3. O casamento entre ranking e pedido é função pura (`models/ownRanking.js`); o filtro puro continua recebendo o conjunto de chaves.
4. O controlador larga a tela quando ela fecha (`detachView`).

Refina o `arch.md` (seção 18). Não muda o `data-model.md`: nada novo é gravado.

## Technical Design
Fluxo do ranking salvo: `UserRankModal` (só mostra e avisa) → `onSubmit` → `SeriesEventHandler` → `onSaveRanking` → `SeriesView` → `SeriesController.saveRanking` → `OwnRankingService.save` (repositório + store) → `AlbumLoadService.refreshSource(album.id, 'userRanking')` → a store de carga troca o álbum → a grade redesenha.

Fluxo do filtro: escolher «My Ranking» → `SeriesController.handleFilterChange` → `OwnRankingService.ensureLoaded` (uma leitura) → `OwnRankingsStore` avisa → `SeriesController.getOwnRankedKeys` monta as chaves com `rankedQueryKeys(séries, índice, chaves dos carregados com ranking)` → `filterSeries` → página → pedido de carga só das séries da página.

| Arquivo | O que faz | REQ |
|---|---|---|
| `public/js/services/albums/AlbumLoadService.js` | `refreshSource(albumId, source)`; `_runChain` encadeia o trabalho por álbum | REQ-05 |
| `public/js/services/ranking/OwnRankingService.js` | `ensureLoaded()` e `save(album, rankings)`, com portas injetadas | REQ-05, REQ-06, REQ-07 |
| `public/js/services/ranking/ownRanking.js` | monta o serviço com o repositório e o id do usuário | REQ-07 |
| `public/js/stores/ownRankings.js` | a lista de álbuns ranqueados e o seu estado (`idle`, `loading`, `ready`, `failed`); o índice é derivado | REQ-06 |
| `public/js/models/ownRanking.js` | `nameIdentity`, `titleIdentity`, `stableAlbumId`, `buildRankedIndex`, `isQueryRanked`, `rankedQueryKeys` | REQ-06 |
| `public/js/controllers/SeriesController.js` | `saveRanking`, `getOwnRankedKeys` sobre todas as séries, `onOwnRankingsChange`, `detachView` | REQ-04, REQ-05, REQ-06 |
| `public/js/components/ranking/UserRankModal.js` | salva por `onSubmit`; não importa repositório; não escapa texto de nó de texto | REQ-05, REQ-07 |
| `public/js/components/series/SeriesEventHandler.js` | abre o modal e repassa o pedido de salvar; não muta mais o álbum publicado | REQ-05, REQ-07 |
| `public/js/views/SeriesView.js` | liga `onSaveRanking` ao controlador; `destroy` chama `detachView` | REQ-04, REQ-05 |

**Como o ranking casa com o pedido.** O ranking é guardado sob o id do álbum carregado (`artista_título` em slug) com `artistName` e `albumTitle`; a série guarda o que foi pedido. Os dois lados são escritos do mesmo jeito antes de comparar: sem caixa, sem acento, «&» como «and», sem pontuação, entidades HTML desfeitas e sem a nota de edição («(Deluxe Edition)», «(Remastered 2014)», «- 2017 Remaster»). Um ranking gravado sem os nomes casa pelo id. O que o nome não casa (o catálogo deu outro título) casa de forma exata quando o álbum está carregado e traz o ranking.

## UI/UX Design (if the feature touches a screen)
Nenhuma tela nova. O modal de ranking, o aviso de falha e os estados da série são os que já existiam. Mudança visível: um nome com «&» no modal deixa de aparecer como «&amp;».

## Dependencies
Nenhuma.

## Documents Consulted
`docs/specs/arch.md` (proposta «Carga da tela de álbuns», seções 15 a 17), `docs/specs/data-model.md` (`users/{uid}/albumRankings`), `docs/specs/constitution.md`, `docs/specs/uat.md` (UAT-173, UAT-174), `docs/manual/08`, `09`, `16`. O projeto não tem `info-arch.md` nem `design-system.md`.

## Risks & Considerations
- O casamento por nome pode deixar de fora um álbum ranqueado cujo título no catálogo difere do pedido e que ainda não carregou. Aparece quando a série carrega. Saída exata proposta e não feita: `facts.albumId` (muda dado gravado).
- A leitura da lista de rankings é uma leitura da coleção inteira (`getAllRankings`), feita uma vez por pessoa e só quando o filtro é escolhido.
- `UserRankingRepository.getAllRankings` devolve lista vazia quando a leitura falha: nesse caso o filtro mostra só os carregados e não avisa. O arquivo é da F48.
- O encadeamento por álbum muda a ordem interna do serviço de carga: os 19 testes anteriores do serviço seguem verdes.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 13:21 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | estado da série derivado das entradas | carregando, completa, com falha, vazia | modelo, store | sim (F45) |
| REQ-02 | `retryFailed` busca só os que falharam; o controlador repassa | aviso e «Try again» | serviço, controlador | sim |
| REQ-03 | página 2 sem bloco cinza | página desenhada inteira | navegador | não (evidência da F51) |
| REQ-04 | `detachView` para de desenhar; nova visita desenha uma vez por mudança | sair e voltar | controlador | sim |
| REQ-05 | `refreshSource`: só a fonte, só o álbum, todas as séries, espera a fonte em curso, falha marca só a fonte | ranking salvo na tela | serviço, controlador, modal | sim |
| REQ-06 | nomes que divergem (10 casos), não casar álbum diferente (5), leitura única, troca de pessoa | «My Ranking» em todas as séries | modelo, serviço, controlador | sim |
| REQ-07 | importações do modal, do serviço, da store e da tela | fronteiras | arquitetura | sim |

Bordas fora dos critérios: o título que o catálogo troca (casa só depois de carregar); a leitura que falha em silêncio no repositório.
