<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F71: O inventário tem todos os álbuns das minhas séries; filtro por Owned, Not Owned e Wishlist · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito junto com o código, em 2026-11-19 (via rápida). Diz o que foi construído e por quê.

## Architecture Approach
Encaixa no caminho que o `arch.md` já fixa — tela → controlador → serviço → repositório, loja só com estado (ADR-0016, ADR-0017) — sem camada nova e sem dependência nova:

- **Três regras puras em `public/js/models/`**: a situação (`inventoryStatus.js`), o filtro e as contagens (`inventoryFilter.js`), e a ação das séries (`inventoryFromSeries.js`: o álbum feito de uma consulta, «é o mesmo álbum?», o plano, os textos). Nenhuma importa serviço, repositório, loja ou tela.
- **O serviço do inventário** (`services/inventory/InventoryService.js`) ganha o plano e a gravação em partes; continua a ser o único que escreve na loja.
- **O repositório** (`repositories/InventoryRepository.js`, sobre `BaseRepository.createMany`) ganha a gravação de muitos itens numa gravação só. Nenhum Firestore fora dos repositórios.
- **A regra de identidade não muda** (`shared/albumIdentity.js`, versão 2). `inventoryFromSeries.js` entra na lista de lugares que perguntam a ela (`test/architecture/albumIdentityRule.test.js`, `CALL_SITES`) e não compara texto por conta própria.

O que refina no `arch.md`: nada de estrutural. No `data-model.md`: `format` e `currency` do item passam a poder ser `null`; `albumData` pode ser o álbum feito de uma consulta de série, com a marca `metadata.addedFrom: 'series'`.

## Technical Design

### Fluxo de dados da ação
1. **Tela** (`views/InventoryView.js`): o botão `#addSeriesAlbumsBtn`, na barra de filtros, chama `controller.handleAddSeriesAlbums({ confirm })`, com `confirm` = `dialogService.confirm`.
2. **Controlador** (`controllers/InventoryController.js`): marca o botão ocupado («Reading your series…»), pede as séries (`readSeriesOfThePerson`) e o plano (`inventoryService.planSeriesAlbums`).
3. **Plano** (`models/inventoryFromSeries.js` `planSeriesAlbums(series, items)`): devolve `{ toAdd, skipped, seriesCount, alreadyThere, repeated, incomplete }`. Nada é escrito.
4. **Confirmação**: sem nada a adicionar, aviso e fim. Com algo, a pergunta («176 albums from your 47 series will be added as Not Owned. 23 albums already in your inventory stay as they are.»). «Cancel» ou Escape: fim, nada escrito.
5. **Gravação** (`InventoryService.addAlbumsAsNotOwned(toAdd, { onProgress })`): partes de 100 álbuns; cada parte é `InventoryRepository.addBatch` → `BaseRepository.createMany` → um `writeBatch` do Firestore (tudo ou nada). Depois de cada parte, `onProgress` muda o texto do botão («Adding albums… 100 of 176») sem redesenhar a tela.
6. **Fim**: o serviço lê o inventário de novo uma vez (`loadAlbums`), a loja avisa a tela, e o controlador mostra o aviso do resultado.

### A regra única da origem dos dados (REQ-04)
**Um item feito pela ação leva o que a consulta da série leva, e mais nada**, tenha a pessoa aberto a tela de álbuns antes ou não. O álbum carregado que a loja de álbuns pode ter em memória não é usado: o resultado dependeria de quais telas foram abertas. As séries são lidas do banco na hora da ação (`SeriesService.loadFromFirestore`), não da memória.

O álbum feito de uma consulta (`inventoryAlbumFromQuery`), que vira o `albumData` do item:

| Campo | De onde vem | Quando falta |
|---|---|---|
| `id` | `stableAlbumId(artist, title)` — o mesmo id que o app dá ao álbum carregado com esses nomes | nunca |
| `title`, `artist` | `askedAlbum(query)` (o leitor único de consultas: `album` como título, entidades HTML desfeitas) | a entrada fica de fora |
| `year` | `query.year` | `null` (consulta em texto) |
| `coverUrl` | `query.coverUrl`, com `{w}`/`{h}` trocados por 600 | `null` → o cartão mostra o substituto de capa (F70) |
| `appleMusicId` | `query.appleMusicId` | `null` |
| `metadata.addedFrom` | `'series'` | — |

O que ele **não** tem, e o item feito pelo cartão tem: `tracks`, `tracksOriginalOrder`, `acclaim`, ids e dados do Spotify, `metadata.source`/`sourceId`/`identityReason`. O item em si (`InventoryRepository._itemFor`) entra com `owned: null`, `format: null`, `purchasePrice: null`, `currency: null`, `notes: ''`.

### «O mesmo álbum» (REQ-05)
`isSameAlbum(a, b)` em `inventoryFromSeries.js`, nesta ordem:
1. os dois têm id do Apple Music e é o mesmo (`albumData.appleMusicId`, ou `albumData.metadata.sourceId` quando `metadata.source` é «Apple Music»); ou
2. os dois têm o id de álbum do app e é o mesmo; ou
3. os dois têm artista e `compareAlbumIdentity(a, b).same` (primeiro nível da regra: título exato ou edição dele, mesmo artista). O segundo nível («o mesmo se sozinho») não vale aqui: ele só é concedido pelo `pickAlbum`, com os candidatos de uma fonte à vista.

Ids diferentes não provam álbuns diferentes: a comparação segue para os nomes. Sem artista de um dos lados, os nomes não provam nada (a regra aceitaria o álbum de qualquer artista).

A ordem das perguntas para cada entrada das séries: incompleta → já está no inventário → repete uma entrada anterior das séries → entra. Entre duas entradas do mesmo álbum, entra a primeira na ordem das séries (a ordem em que o banco as devolve, mais recentes primeiro) e das consultas.

`findInInventory(album, items)` é a mesma pergunta para um álbum só; `InventoryService.addAlbum` passa a fazê-la antes de gravar, de modo que o cartão de um álbum responde «Album is already in your inventory» também para a edição de um álbum que veio de uma série.

### Componentes
| Arquivo | O que recebe e devolve | REQ |
|---|---|---|
| `public/js/models/inventoryStatus.js` (novo) | `statusOf(item)`, `ownedValueOf(status)`, rótulos, opções do filtro e do seletor, `passesStatusFilter`, `countByStatus`, `statusChangeMessage` | REQ-01, REQ-02, REQ-03 |
| `public/js/models/inventoryFilter.js` (novo) | `filterInventory(items, { search, format, ownership })`; `statusCountsFor(items, { search, format })` | REQ-02, REQ-03 |
| `public/js/models/inventoryFromSeries.js` (novo) | `inventoryAlbumFromQuery`, `findInInventory`, `planSeriesAlbums`, `confirmationText`, `nothingToAddText`, `progressText`, `outcomeText` | REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 |
| `public/js/models/inventoryStats.js` | conta pelas três situações (ganha `notOwnedCount`) | REQ-01 |
| `public/js/repositories/BaseRepository.js` | `createMany(dataList)`: uma gravação, no máximo 500 documentos, uma invalidação do cache | REQ-07 |
| `public/js/repositories/InventoryRepository.js` | `addBatch(albums)`; `_itemFor` (o item, um molde só para `addAlbum` e `addBatch`) | REQ-07, REQ-08 |
| `public/js/services/inventory/InventoryService.js` | `planSeriesAlbums(series)`, `addAlbumsAsNotOwned(albums, { onProgress })`; `addAlbum` pergunta `findInInventory` | REQ-04, REQ-05, REQ-07, REQ-10 |
| `public/js/services/inventory/inventoryWiring.js` | `readSeriesOfThePerson()`: as séries do banco, da mesma pessoa do inventário | REQ-04 |
| `public/js/controllers/InventoryController.js` | filtro e totais pelos modelos; `handleStatusChange`; `handleAddSeriesAlbums({ confirm })` | REQ-01, REQ-02, REQ-03, REQ-06, REQ-07 |
| `public/js/views/InventoryView.js` | cabeçalho com as três contagens; filtro; o botão e o seu estado ocupado (`showSeriesAdd`) | REQ-02, REQ-03, REQ-04, REQ-07 |
| `public/js/views/renderers/InventoryGridRenderer.js` | seletor e cor pelo modelo; sem formato e sem preço quando o item não tem | REQ-01, REQ-09 |
| `public/js/components/ViewAlbumModal.js` | situação, formato, preço e notas do item; a linha no lugar das faixas | REQ-01, REQ-09 |
| `public/js/components/InventoryEditModal.js` | «Not set» no formato de um item sem formato | REQ-09 |

### O cache do «já está no inventário»
`InventoryRepository.findByAlbumId` guarda, na chave `album_<albumData.id>`, só o item **achado**; «não está» nunca é guardado. Um item novo não tem resposta velha a contradizer: a próxima pergunta lê o inventário e o acha. `createMany` invalida a lista (`all`) uma vez. Nada mais é preciso para o cache concordar com os itens novos (provado em `test/repositories/InventoryRepository.addBatch.test.js`).

### Falha e recuperação (REQ-07)
Cada parte é atômica; a parte que falha para a corrida e não desfaz as anteriores. O serviço devolve `{ added, total, error, reloaded }` e nunca lança por causa de uma parte: o controlador diz «Added 100 of 176 albums as Not Owned, then a write failed. 76 albums were not added: run the action again to add the rest.». Rodar de novo planeja contra o inventário do banco e adiciona só o que falta: a idempotência é a recuperação. Se a pessoa troca de conta no meio, a leitura do fim não é feita para a conta nova.

### Desempenho (REQ-10)
- **Desenho.** A grade é um texto HTML feito numa passada (`InventoryGridRenderer.render`) e posto de uma vez; nenhum cartão lê o banco. No teste (jsdom), 200 cartões em grade mais 200 em lista saem em cerca de 120 ms; o navegador real não foi medido (TASK-10). Sem paginação: nada no desenho é quadrático.
- **Avisos da loja.** Durante a gravação, nenhum; no fim, os dois de uma leitura («lendo», «lido»), seja qual for o número de álbuns. O progresso muda só o texto do botão.
- **Plano.** A comparação por nomes é feita par a par pela regra (ela é dona de como um título é lido), o que é quadrático no número de álbuns: 250 entradas contra 200 itens levam cerca de 0,2 s no teste, uma vez por clique, antes da confirmação. Os ids são achados por tabela, antes dos nomes. Se as séries crescerem dez vezes isso passa a pesar; a saída então é a regra expor uma chave de título, numa feature dela.
- **Filtro.** Uma passada nos itens por tecla da busca, como antes.

## Segunda fatia (S-56): as médias «Avg Rating» e «Avg Pop» no inventário

> Escrito junto com o código, em 2026-11-19 (via rápida). Decisão do MJRP: «opção A e to achando que o AVG rank nao faz sentido pra mim, poderia trocar por AVG Rating tb».

### Desenho
1. **Um modelo puro, `models/albumAverages.js`.** `averagesOf(tracks)` devolve `{ rating, popularity, ratedTracks, popTracks }`: `rating` é a média de `track.rating` das faixas com nota número maior que zero; `popularity`, a média de `track.spotifyPopularity` das faixas com número de zero para cima; uma casa decimal, guardada como número; `null` quando nenhuma faixa conta (nunca zero). `averagesOfAlbum(album)` junta as faixas da ordem `acclaim` sobre a ordem original, como a comparação de faixas as mostra (`mergedTracksOf`, que é o corpo que estava em `TracksRankingComparison.normalizeTracks`, agora lá só delega), e chama `averagesOf`. Os textos — «Avg Rating: 78.4», «Avg Pop: 42.6%», «—» — saem do mesmo arquivo.
2. **A comparação de faixas.** `TracksTable.renderStatsHeader` mostra «My Avg», «Avg Rating» e «Avg Pop»; as duas últimas vêm do modelo. «Avg Rank» (a média das posições, que só media quantas faixas o álbum tem) saiu. `TracksRankingComparison.getAverages` não tinha chamador (só devolvia `avgRank` e `avgPop`) e foi apagada; a exceção de complexidade da função de mescla saiu da lista, porque o corpo novo, no modelo, cabe no limite.
3. **O item guarda as médias.** Campo opcional `averages: { rating, popularity, ratedTracks, popTracks, at }`, escrito só por `InventoryRepository.setAverages` (a porta antiga `updateAlbum` continua a recusar um campo que não conhece). Durável porque o cache de álbuns do navegador é por consulta de série e expira em 7 dias: sem o campo, o inventário teria de recarregar 211 álbuns a cada abertura.
4. **A ação «Update ratings».** Um botão `#updateRatingsBtn` na barra de filtros, ao lado do das séries; ocupado e desligado, com `aria-busy`, e as duas ações se travam uma à outra.
   - `InventoryController.handleUpdateRatings({ confirm })`: com mais de 30 álbuns pergunta («Read the ratings of 211 albums? This can take a few minutes.»); chama `inventoryService.updateAverages({ signal, onProgress })`; mostra o fim; `dispose()` (chamado por `InventoryView.destroy()`, que o roteador chama ao sair) aborta o pedido.
   - `InventoryService.updateAverages`: faz **um** pedido, `albumAsks.albumsOf({ series: [{ id: 'inventory-ratings', albumQueries }], sources: ['acclaim', 'popularity'], signal, onProgress })`, pela porta única da carga (fila educada, retenções, cache do navegador): nenhum acesso à rede nem ao cache por outro caminho. Cada consulta é montada do item (`models/inventoryRatings.js` `queryOfItem`: artista, título, ano e, quando o item guarda, o id do Apple Music — o `appleIdOf` de `inventoryFromSeries.js`, agora exportado). O serviço recebe `albumAsks` pelo construtor; quem o liga é `inventoryWiring.js`.
   - **A resposta volta ao item** por `findInInventory` (a regra única de identidade; este código não compara texto), as médias saem de `averagesOfAlbum`, e `mergeAverages` mantém o valor anterior de uma média que a fonte não deu desta vez: um número nunca é trocado por `null` porque uma fonte faltou (por exemplo, o Spotify não conectado). Sem nada novo e sem nada antes, nada é gravado.
   - **Gravação** em partes de 100 (`SERIES_WRITE_SIZE`), cada parte um `BaseRepository.updateMany` (um `writeBatch`, no máximo 500, que **nunca cria**: um item que sumiu no meio faz a parte falhar, e o serviço já tira os itens que a loja não tem mais). A loja é avisada uma vez, no fim, com as médias que foram gravadas. O serviço devolve `{ aborted, total, planned, saved, notFound, withoutRatings, popularityNotConnected, unanswered, error }` e não lança por uma parte que falha; se a pessoa troca de conta no meio, nada é gravado.
   - **Progresso**: «Reading ratings… 40 of 211» (álbuns prontos — achados com as duas fontes respondidas, ou falhados — do total), depois «Saving ratings…».
   - **O fim** (`ratingsOutcome`): «Ratings updated for 180 of 211 albums.» e, só se for verdade, «20 albums were not found.», «11 albums had no ratings at their sources.», «Spotify is not connected: popularity was not read for 150 albums.», «A source did not answer for N albums: the numbers they had before were kept.»; na falha de gravação, quantos foram gravados e como gravar o resto.
5. **A ordem.** `models/inventorySort.js` ganha `SORT_OPTIONS`, `sortingFor` e os leitores `averageRating`, `averagePopularity` e `addedToInventory`; o controlador só passa a escolha (`handleSortChoice`). O item sem valor vem por último qualquer que seja a direção; o empate cai em artista e título. A data é a que os itens de fato têm: `addedToInventory` (ou `createdAt`), carimbo do Firestore `{ seconds }` ou `toMillis`, `Date`, texto ISO ou número. (O leitor `addedAt` que havia no modelo lia um campo que nenhum item tem; saiu.)
6. **O cartão.** `InventoryGridRenderer.renderAverages` põe uma linha pequena (`text-xs text-gray-400`, classes que a tela já usa) na grade e na lista; só as médias que o item tem, e nada quando não tem nenhuma.

### O que mudou em relação ao desenho pedido
- `InventoryView.destroy()` é novo: o roteador chama `destroy()` ao sair da tela, e a tela só tinha `onUnmount()`, que ninguém chamava (a assinatura da loja do inventário ficava ligada depois de sair). `destroy()` chama `onUnmount()`, que agora também aborta o pedido.
- A lista de exceções de complexidade encolheu em uma entrada (`components/ranking/TracksRankingComparison.js:arrow function`).

### Componentes (segunda fatia)
| Arquivo | O que recebe e devolve | REQ |
|---|---|---|
| `public/js/models/albumAverages.js` (novo) | `averagesOf`, `averagesOfAlbum`, `mergedTracksOf`, `ratingText`, `popularityText`, `ratingValue`, `popularityValue`, `averagesLine` | REQ-11, REQ-12, REQ-18 |
| `public/js/models/inventoryRatings.js` (novo) | `ratingsAskOf`, `queryOfItem`, `mergeAverages`, `planAverages`, `ratingsQuestion`, `ratingsProgressText`, `ratingsOutcome` | REQ-14, REQ-15, REQ-16 |
| `public/js/models/inventorySort.js` | `SORT_OPTIONS`, `sortingFor`, `sortInventory` com os três leitores novos | REQ-17 |
| `public/js/repositories/BaseRepository.js` | `updateMany(updates)`: uma gravação, no máximo 500 | REQ-15 |
| `public/js/repositories/InventoryRepository.js` | `setAverages(entries)` | REQ-13, REQ-15 |
| `public/js/services/inventory/InventoryService.js` | `updateAverages({ signal, onProgress, now })` | REQ-14, REQ-15, REQ-16 |
| `public/js/services/inventory/inventoryWiring.js` | entrega `albumAsks` ao serviço | REQ-14 |
| `public/js/controllers/InventoryController.js` | `handleUpdateRatings`, `handleSortChoice`, `dispose` | REQ-14, REQ-16, REQ-17 |
| `public/js/views/InventoryView.js` | o seletor, o botão, `showRatings`, `destroy` | REQ-14, REQ-17 |
| `public/js/views/renderers/InventoryGridRenderer.js` | a linha das médias | REQ-18 |
| `public/js/components/ranking/TracksTable.js`, `TracksRankingComparison.js` | «Avg Rating» no lugar de «Avg Rank»; a mescla pelo modelo | REQ-12 |

### Riscos e limites da segunda fatia
- **Sem prova no navegador nem na conta real** (TASK-17): o auxiliar não tem navegador nem conta; a ação nunca rodou contra o Firestore nem contra a carga de álbuns de verdade. O tempo de 211 álbuns pela fila não foi medido.
- **A cobertura das notas é parcial.** O casamento de títulos de faixa em edições ampliadas é parcial (`MEMORY.md`, «Pending on Agent»): a «Avg Rating» desses álbuns vem de poucas faixas (`ratedTracks` diz quantas). O cartão mostra a média sem dizer de quantas faixas ela vem.
- **A regra de identidade** decide a que item cada álbum pertence; dois itens que a regra tem por um mesmo álbum recebem a média do primeiro que a regra acha.
- **Regras do Firestore**: a gravação é uma atualização do mesmo caminho e do mesmo dono (`artifacts/mjrp-albums/users/{uid}/inventory`); `firestore.rules` aceita qualquer campo nesse caminho.

## Dependencies
Nenhuma.

## Documents Consulted
`AGENTS.md`, `MEMORY.md` (`## Now`), `docs/specs/arch.md` (camadas, a regra de identidade, as lojas), `docs/specs/data-model.md` (InventoryItem, Series), `docs/specs/behavior.md` (os estados `^inventory-*`), `docs/specs/constitution.md`, o nó S-54, e os testes de arquitetura (`layerBoundaries`, `firestoreBehindRepositories`, `noDeadModules`, `interfaceInEnglish`, `outsideTextEscaped`, `albumIdentityRule`, `complexityLimit`). Não há `info-arch.md` nem `design-system.md` a consultar para esta tela.

## Risks & Considerations
- **Sem prova no navegador nem na conta real.** O auxiliar que escreveu o código não tem navegador nem conta; a ação nunca rodou contra o Firestore. A prova e a execução na conta do MJRP são a TASK-10.
- **A regra de identidade une edições.** «Core» e «Core (Remastered)», e também «The Wall» e «The Wall (Live)», são um álbum para a regra; duas entradas assim nas séries viram um item. É o que a regra única diz; a lista do que ficou de fora sai no console para conferência.
- **A ação não tem «desfazer».** Os itens feitos por ela levam `albumData.metadata.addedFrom: 'series'` e nenhum formato; é por aí que se distinguem dos que já estavam, se for preciso tirá-los (um a um na tela, ou pelo console do Firebase).
- **Regras do Firestore.** A gravação usa o mesmo caminho e o mesmo dono dos itens de hoje (`artifacts/mjrp-albums/users/{uid}/inventory`); `firestore.rules` não foi lido nem mudado. Se as regras validarem campos (por exemplo `format` obrigatório), a primeira parte falha, nada entra e o aviso diz isso.
- **Mudanças de comportamento fora do pedido**, para o MJRP julgar (TASK-11): as três contagens ignoram o filtro de situação; o cartão sem preço não mostra «$0.00»; o item sem formato não mostra «Unknown»; a janela do álbum mostra a situação do item (e nenhuma, fora do inventário); a falha ao trocar a situação agora mostra o aviso; o cartão de um álbum recusa a edição de um álbum que já está.

## Test plan
> Derivado dos REQ do `spec.md` e das palavras do MJRP no nó S-54 · 2026-11-19 23:10 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | a situação lida e escrita (`true`/`false`/`null`); ida e volta; rótulos; aviso da troca | `^inventory-status-changed`, `^inventory-item-card` | modelo, controlador, tela | sim |
| REQ-02 | opções do filtro e a sua ordem; cada situação; junto com busca e formato | `^inventory-search-and-filters` | modelo, tela | sim |
| REQ-03 | as três contagens para busca e formato; não zeram ao escolher uma situação | `^inventory-header-totals` | modelo, controlador, tela | sim |
| REQ-04 | o álbum feito de consulta em objeto e em texto; nada indefinido; as séries lidas do banco, da mesma pessoa | `^inventory-series-albums-added` | modelo, serviço | sim |
| REQ-04 | a ação na conta real: nenhum pedido ao Apple Music; os itens novos na tela | `^inventory-series-albums-added` | navegador | não (TASK-10) |
| REQ-05 | mesmo álbum em duas séries; «Core» e «Core (Remastered)»; «Core» e «Core Memories»; texto e objeto; já no inventário por nomes, por id do Apple Music e por id do app; o cartão de um álbum depois | `^inventory-saved-per-user`, `^album-add-to-inventory` | modelo, serviço, arquitetura | sim |
| REQ-06 | o texto da confirmação (singular e plural); «não» não grava; nada a adicionar | `^inventory-series-albums-added` | modelo, controlador, tela | sim |
| REQ-07 | uma gravação por parte; mais de 500 recusado; falha na 2.ª parte; rodar de novo; falha na 1.ª; leitura do fim que falha; troca de pessoa no meio; botão ocupado e progresso | `^inventory-series-albums-added` | repositório, serviço, controlador | sim |
| REQ-08 | o item «Owned» com preço, formato e notas fica igual depois do plano e da gravação | `^inventory-series-albums-added` | modelo, serviço | sim |
| REQ-09 | cartão sem formato e sem preço; capa ausente; texto de fora escapado; janela do álbum sem faixas; janela de editar sem formato | `^inventory-item-card`, `^album-detail-modal`, `^inventory-item-edited` | tela | sim |
| REQ-10 | 230 álbuns: nenhum aviso da loja durante, dois no fim; 200 cartões numa passada; o plano de 250 entradas em menos de 1 s | `^inventory-series-albums-added` | serviço, tela, modelo | sim |
| REQ-11 | média das notas > 0 e das popularidades >= 0; uma casa; `null` sem dados; o que não é número não conta; a mescla de `acclaim` sobre a ordem original | `averages` do item (`data-model.md`) | modelo | sim |
| REQ-12 | o topo da tabela diz «My Avg», «Avg Rating», «Avg Pop» e não «Avg Rank»; «—» sem dados; o mesmo número do inventário | `^album-track-table` | tela | sim |
| REQ-13 | só `averages` é gravado; sem `undefined`; `updateAlbum` segue recusando o campo | `averages` do item (`data-model.md`) | repositório, serviço | sim |
| REQ-14 | um pedido a `albumAsks.albumsOf` com as duas fontes e o sinal; pergunta com mais de 30; botão ocupado e progresso; sair da tela aborta | `^inventory-ratings-updated` | serviço, controlador, tela | sim |
| REQ-14 | a ação na conta real, com a rede aberta | `^inventory-ratings-updated` | navegador | não (TASK-17) |
| REQ-15 | álbum de volta ao item; um número nunca vira `null`; partes de 100; parte que falha; troca de pessoa; item que sumiu | `^inventory-ratings-updated` | modelo, serviço, repositório | sim |
| REQ-16 | os textos do fim, cada frase só quando é verdade; o Spotify desconectado; falha de gravação; sair da tela sem aviso | `^inventory-ratings-updated` | modelo, controlador | sim |
| REQ-17 | as quatro opções; o maior primeiro; item sem valor por último nas duas direções; o empate; a data como carimbo, `toMillis`, `Date`, ISO e número; a ordem com os filtros | `^inventory-order` | modelo, controlador, tela | sim |
| REQ-18 | a linha na grade e na lista; só o que o item tem; nada sem média; nome escapado | `^inventory-item-card` | tela | sim |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): o nó S-54 não tem critérios de aceite; as decisões de borda tomadas aqui estão nas Open Questions do `spec.md` (as contagens e o filtro de situação, o cartão sem preço, a janela do álbum fora do inventário, a entrada sem artista, as edições unidas pela regra, a ordem da grade).
