---
status: In Progress
lane: fast
solution_type: feature
imports: ["[[S-54-have-every-album-of-my-series-in-my-inventory]]", "[[S-56-rank-my-inventory-by-acclaim-and-popularity]]"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: feature`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F71: O inventário tem todos os álbuns das minhas séries; filtro por Owned, Not Owned e Wishlist
**Approved**: not a gate (via rápida; o MJRP julga)

> **Nota de 2026-11-23 (arrumação do board).** As telas feitas à mão que esta spec cita (arquivos de `public/js/views/` e `public/js/components/`) não existem mais: o site foi reescrito em React (F83, em produção desde 2026-11-23) e as telas moram em `public/js/screens/` e `public/js/ui/`. Os nomes de arquivo abaixo são históricos; o comportamento pedido continua valendo.

## Summary
**A feature:** O inventário ganha uma ação que põe nele todos os álbuns das séries da pessoa que ainda não estão lá, marcados como «Not Owned»; o filtro de situação passa a oferecer «Owned», «Not Owned» e «Wishlist», além de «All»; e, na segunda fatia, o inventário guarda, mostra e ordena por duas médias de cada álbum, «Avg Rating» e «Avg Pop», lidas pela ação «Update ratings».

**Por quê:** O MJRP quer ver, num lugar só, o que já possui e o que falta dos álbuns que ele curou; hoje o inventário só tem o que foi adicionado um a um.

**Como saber que funcionou:** (primeira fatia) Depois da ação, todo álbum das séries aparece no inventário uma vez só; os que já estavam lá mantêm a situação, o preço e o formato; o filtro mostra cada um dos três grupos pelo nome.

## Problem Statement
Segunda fatia (2026-11-20), o MJRP com a captura das duas médias do cartão: «no inventory, na 71, pode usar as metricas do print e ter um filtro/ranking por BEA Avg rank e Spotify Avg Pop.?» — o inventário mostra «Avg Rank» e «Avg Pop» de cada álbum e ordena por elas.

O MJRP, em 2026-11-20: «registre uma melhoria, coloque todos os os albums que tenho na minha albums list como parte do meu inventory. tudo marcado como not owned, e melhore o filtro de status para Owned, Not Owned, Wishlist».

O que a leitura do código mostrou (2026-11-19, ramo `feat/f71-inventory-holds-every-album-of-my-series`):

- **A situação de um item estava escrita em cinco lugares.** O item guarda `owned`: `true` é Owned, `false` é Wishlist, `null` ou ausente é Not Owned. Quem lia isso, cada um à sua maneira: o filtro e os totais do `controllers/InventoryController.js`, o seletor e a cor do cartão em `views/renderers/InventoryGridRenderer.js`, os números de `models/inventoryStats.js`, o aviso da troca de situação e a janela do álbum (`components/ViewAlbumModal.js`).
- **O filtro da tela não tinha «Not Owned».** A tela oferecia «All Status», «✓ Owned Only» e «Wishlist Only»; o controlador sabia filtrar `not-owned`, mas nenhuma opção o pedia. O cabeçalho mostrava «✓ n Owned» e «n Wishlist», sem os que não são nem um nem outro.
- **A janela do álbum dizia «OWNED» para todo item.** Ela monta o álbum a partir de `albumData`, que não tem `owned`: a comparação `owned !== false` dava sempre «OWNED», e o formato, o preço e as notas do item nunca apareciam. Com 176 itens «Not Owned» a janela diria o contrário em todos.
- **Um álbum só entra no inventário pelo cartão de um álbum carregado** (`InventoryAddModal` → `InventoryService.addAlbum` → `InventoryRepository.addAlbum`), um por vez, com formato obrigatório e uma leitura do inventário inteiro por álbum. O «já está no inventário» é decidido pelo id que o app dá ao álbum carregado (`albumData.id`), e só por ele: a edição «Core (Remastered)» entra ao lado de «Core».
- **As séries já guardam o que o inventário precisa para desenhar o cartão:** artista, título, ano, endereço da capa e id do Apple Music (`albumQueries`, escritas por `models/albumQuery.js` `toAlbumQuery`), ou o texto «Artista - Álbum».

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] A situação de um item do inventário é uma de três — Owned, Not Owned, Wishlist — e é dita por um lugar só do app: o cartão (seletor e cor), o filtro, os totais, a janela do álbum e o aviso da troca de situação perguntam a esse lugar. O que está gravado não muda (`owned`: `true`, `false`, `null`): nenhum item existente muda de situação e nada é migrado. · fixes S-54
  verified_by:: `test/models/inventoryStatus.test.js`, `test/models/inventoryStats.test.js`, `test/controllers/InventoryController.seriesAlbums.test.js` («changing the status of an item»), `test/views/InventoryView.statusAndSeries.test.js` («the card of an item», «the album window of an item»)
- [REQ-02] O filtro de situação da tela oferece, nesta ordem, «All», «Owned», «Not Owned» e «Wishlist», e funciona junto com a busca e com o filtro de formato. · fixes S-54
  verified_by:: `test/models/inventoryFilter.test.js`, `test/views/InventoryView.statusAndSeries.test.js` («the status filter offers…», «choosing "Not Owned"…», «the filter works with the search…»)
- [REQ-03] O cabeçalho mostra «N albums» e as três contagens — «✓ n Owned», «n Not Owned», «♡ n Wishlist» — dos itens que passam pela busca e pelo filtro de formato. · fixes S-54
  verified_by:: `test/models/inventoryFilter.test.js` («the three counts of the header»), `test/controllers/InventoryController.seriesAlbums.test.js` («the status filter and the counts of the header»), `test/views/InventoryView.statusAndSeries.test.js` («the header shows…»)
- [REQ-04] A tela do inventário tem a ação «Add the albums of my series», um botão alcançável pelo teclado, que põe no inventário todo álbum das séries da pessoa que ainda não está lá, cada um marcado «Not Owned». A lista vem do que as séries guardam (artista, título, ano, capa, id do Apple Music): nenhum álbum é carregado e nada é pedido ao catálogo. · fixes S-54
  verified_by:: `test/models/inventoryFromSeries.test.js` («the inventory album made from a series query»), `test/services/inventory/InventoryService.seriesAlbums.test.js`, `test/services/inventory/inventoryWiring.series.test.js`, `test/views/InventoryView.statusAndSeries.test.js` («the button "Add the albums of my series"»); a prova no navegador e a execução na conta do MJRP são a TASK-10
- [REQ-05] Um álbum entra uma vez só: o mesmo álbum pedido em várias séries, ou que já está no inventário, não entra de novo. «O mesmo álbum» é decidido pela regra única de identidade (`shared/albumIdentity.js`, primeiro nível: o mesmo título ou uma edição dele, do mesmo artista), pelo id do Apple Music e pelo id de álbum do próprio inventário, quando os dois lados têm. A mesma resposta vale para o «Add to Inventory» do cartão de um álbum. · fixes S-54
  verified_by:: `test/models/inventoryFromSeries.test.js` («which albums of the series go into the inventory», «is this album in the inventory?»), `test/services/inventory/InventoryService.seriesAlbums.test.js` («InventoryService.addAlbum after the series went in»), `test/architecture/albumIdentityRule.test.js`
- [REQ-06] Antes de gravar, a pessoa vê o que vai acontecer — quantos álbuns entram, de quantas séries, e quantos já estão e ficam como estão — e confirma. Sem nada a adicionar, um aviso diz isso e nada é gravado. · fixes S-54
  verified_by:: `test/models/inventoryFromSeries.test.js` («what the person is told»), `test/controllers/InventoryController.seriesAlbums.test.js` («add the albums of my series»)
- [REQ-07] A gravação passa pelo serviço e pelo repositório do inventário, em partes, cada parte uma gravação inteira ou nenhuma; o botão fica ocupado e diz o progresso; o fim diz a verdade — «Added N albums as Not Owned» ou, na falha, quantos entraram e quantos não. A parte que falha não desfaz as anteriores, e rodar a ação de novo adiciona só o resto. · fixes S-54
  verified_by:: `test/repositories/InventoryRepository.addBatch.test.js`, `test/services/inventory/InventoryService.seriesAlbums.test.js`, `test/controllers/InventoryController.seriesAlbums.test.js`, `test/architecture/firestoreBehindRepositories.test.js`, `test/architecture/layerBoundaries.test.js`
- [REQ-08] A ação nunca muda um item que já existe: situação, preço, formato e notas ficam como estão. · fixes S-54
  verified_by:: `test/models/inventoryFromSeries.test.js` («an album already in the inventory is left out, whatever its status»), `test/services/inventory/InventoryService.seriesAlbums.test.js` («items that were there are not written again or changed»)
- [REQ-09] Um item que veio de uma série desenha o seu cartão e abre as suas janelas sem erro com o que tem: sem faixas, sem formato e sem preço. O cartão não mostra formato nem preço que o item não tem; a janela do álbum diz que as faixas não estão guardadas; a janela de editar não inventa um formato ao salvar. · fixes S-54
  verified_by:: `test/views/InventoryView.statusAndSeries.test.js` («the card of an item», «the album window of an item»)
- [REQ-10] Com cerca de 200 itens, a tela desenha os cartões numa passada, sem ler o banco por cartão, e a adição em lote avisa a tela uma vez, no fim. · fixes S-54
  verified_by:: `test/services/inventory/InventoryService.seriesAlbums.test.js` («writes the albums in parts… tells the store only at the end»), `test/views/InventoryView.statusAndSeries.test.js` («draws 200 cards in one pass»), `test/models/inventoryFromSeries.test.js` («plans the 200 albums of 47 series…»)
- [REQ-11] As duas médias de um álbum são ditas por um modelo só, `models/albumAverages.js`: «Avg Rating» é a média da nota do BestEverAlbums das faixas (só as de nota maior que zero) e «Avg Pop» é a média da popularidade do Spotify das faixas (só as de zero ou mais), com uma casa decimal e guardadas como número; sem nenhuma faixa que conte, a média é `null`, nunca zero. O inventário e a comparação de faixas leem as médias desse modelo. · fixes S-56
  verified_by:: `test/models/albumAverages.test.js`
- [REQ-12] Na comparação de faixas de um álbum, «Avg Rank» (a média das posições, que só media quantas faixas o álbum tem) sai e dá lugar a «Avg Rating», calculada pelo modelo; «My Avg» e «Avg Pop» seguem com o mesmo sentido, e uma média sem dados mostra «—». · fixes S-56
  verified_by:: `test/components/ranking/TracksTable.averages.test.js`, `test/components/ranking/TracksRankingComparison.popularity.test.js`
- [REQ-13] O item do inventário guarda as médias do seu álbum, num campo opcional `averages: { rating, popularity, ratedTracks, popTracks, at }` (`at`: a hora, em ISO, em que foram calculadas), porque o cache de álbuns do navegador é por consulta de série e expira em 7 dias. O item sem o campo não mostra média nenhuma. · fixes S-56
  verified_by:: `test/repositories/InventoryRepository.averages.test.js`, `test/services/inventory/InventoryService.ratings.test.js`, `test/views/InventoryView.ratings.test.js` («the card»)
- [REQ-14] A tela do inventário tem a ação «Update ratings», um botão alcançável pelo teclado, ao lado de «Add the albums of my series». Ela faz **um** pedido ao serviço de carga de álbuns (`albumAsks.albumsOf`, com as fontes `acclaim` e `popularity`) com um álbum por item, sem chamar a rede nem o cache por outro caminho. Com mais de 30 álbuns a pessoa confirma antes («Read the ratings of 211 albums? This can take a few minutes.»). O botão fica desligado com `aria-busy` e diz o progresso («Reading ratings… 40 of 211», depois «Saving ratings…»), a outra ação do botão espera, e o pedido é abortado quando a pessoa sai da tela. · fixes S-56
  verified_by:: `test/services/inventory/InventoryService.ratings.test.js`, `test/controllers/InventoryController.ratings.test.js`, `test/views/InventoryView.ratings.test.js` («the button "Update ratings"»), `test/models/inventoryRatings.test.js`; a prova no navegador e a execução na conta do MJRP são a TASK-17
- [REQ-15] Cada álbum pronto da resposta volta ao seu item pela regra única de identidade (`findInInventory`, a mesma da ação das séries), as médias são calculadas por `averagesOfAlbum`, e gravadas em partes de 100, cada parte uma gravação só (`BaseRepository.updateMany`). Uma média que a fonte não deu desta vez (por exemplo, o Spotify não conectado) mantém o valor que o item já tinha: um número nunca é trocado por «nada». O serviço devolve um resultado tipado e não lança por causa de uma parte que falha; a parte que falha não desfaz as anteriores, e rodar de novo grava o resto. · fixes S-56
  verified_by:: `test/models/inventoryRatings.test.js`, `test/services/inventory/InventoryService.ratings.test.js`, `test/repositories/InventoryRepository.averages.test.js`
- [REQ-16] O fim diz a verdade: quantos álbuns ganharam notas, quantos não foram achados, quantos vieram sem nota nenhuma, e, quando uma fonte faltou, uma frase simples («Spotify is not connected: popularity was not read for 150 albums.»); se uma parte da gravação falha, quantos foram gravados e como gravar o resto. Sair da tela no meio não mostra aviso. · fixes S-56
  verified_by:: `test/models/inventoryRatings.test.js` («what the person is told»), `test/controllers/InventoryController.ratings.test.js`
- [REQ-17] O inventário se ordena por um seletor `#inventorySort` na barra de filtros, com «Artist» (o padrão), «Avg Rating» (a maior primeiro), «Avg Pop» (a maior primeiro) e «Recently added» (a mais nova primeiro). O item sem valor para a ordem escolhida vem **por último**, qualquer que seja a direção; o empate cai em artista e título. «Recently added» lê a data que os itens de fato têm (`addedToInventory`, ou `createdAt`: carimbo do Firestore `{ seconds }`, `Date`, texto ISO ou número). A ordem fica junto com a busca e os filtros. Um filtro por nota mínima **não** foi construído (Open Questions). · fixes S-56
  verified_by:: `test/models/inventorySort.test.js`, `test/controllers/InventoryController.ratings.test.js` («the order by the averages»), `test/views/InventoryView.ratings.test.js` («the order»)
- [REQ-18] O cartão do inventário (grade e lista) mostra as duas médias numa linha pequena — «Avg Rating: 78.4 · Avg Pop: 42.6%» — quando o item as tem, só a que tem se tiver uma só, e nada (nem «—») quando não tem nenhuma. O nome do álbum continua texto, nunca marcação. · fixes S-56
- [REQ-19] No inventário, a janela de um álbum mostra as faixas do álbum, com as notas e a popularidade de agora, pedidas à carga de álbuns, para qualquer item (o que veio de uma série e o antigo). Enquanto pede, diz que está carregando; se o álbum não é achado, mostra as faixas que o item guarda ou diz que não foi possível. · fixes S-54 · [[uat#^UAT-220]]
- [REQ-20] O cartão do inventário diz de quantas faixas cada média saiu, ao lado da média. · fixes S-56
- [REQ-21] A ordenação do inventário segue o padrão da lista de séries: cada critério aparece nas duas direções, com a seta na opção («Avg Rating (↓)», «Avg Rating (↑)», «Avg Pop (↓)», «Avg Pop (↑)», «Artist (A-Z)», «Artist (Z-A)», «Newest», «Oldest»). Um item sem valor fica no fim nas duas direções. · fixes S-56
- [REQ-22] Um item do inventário sem capa ganha a capa do álbum quando a carga de álbuns o entrega: «Update ratings» grava a capa no item, e a janela do álbum a mostra. Uma capa que o item já tem não é trocada. · fixes S-54 · [[uat#^UAT-222]]
  verified_by:: `test/views/InventoryView.ratings.test.js` («the card»), `test/models/albumAverages.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
O nó S-54 não aponta para nenhum estado (está no nível do problema). Os estados de comportamento que mudam ou nascem, em `docs/specs/behavior.md`:

- `^inventory-header-totals` (muda): as três contagens, dos itens que passam pela busca e pelo formato.
- `^inventory-search-and-filters` (muda): situação com «All», «Owned», «Not Owned», «Wishlist».
- `^inventory-item-card` (muda): item sem formato não mostra formato; item sem preço não mostra preço.
- `^inventory-status-changed` (muda): a falha da gravação mostra o aviso e a tela volta ao que está guardado.
- `^inventory-item-edited` (muda): «Not set» no formato de um item sem formato.
- `^inventory-saved-per-user` (muda): «já está» decidido também pela regra de identidade.
- `^inventory-series-albums-added` (novo): a ação «Add the albums of my series».
- `^album-detail-modal` (muda): a janela do álbum mostra a situação, o formato, o preço e as notas do item; sem item, nenhuma situação; sem faixas, uma linha no lugar delas.
- `^album-add-to-inventory` (muda): o cartão de um álbum recusa também a edição de um álbum que já está.

Segunda fatia (S-56), em `docs/specs/behavior.md`:

- `^inventory-ratings-updated` (novo): a ação «Update ratings».
- `^inventory-order` (novo): o seletor «Artist / Avg Rating / Avg Pop / Recently added».
- `^inventory-item-card` (muda): a linha das duas médias, quando o item as tem.
- `^album-track-table` (muda): o topo mostra My Avg, Avg Rating e Avg Pop; «Avg Rank» saiu.

Nenhum estado de tela novo num `info-arch.md`: a ação é um botão na barra de filtros que já existe, e não houve protótipo (via rápida; o MJRP julga na tela).

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
O nó S-54 ainda não tem critérios de aceite escritos (nível do problema); os itens abaixo vêm das palavras do MJRP e do «Como saber que funcionou».

- Na conta do MJRP (23 itens, 199 álbuns distintos em 47 séries, na contagem de 2026-11-19): depois da ação, o cabeçalho mostra por volta de 199 álbuns mais os itens do inventário que não estão em nenhuma série; a soma das três contagens é o total; os 23 itens de antes têm a mesma situação, preço, formato e notas. A contar no navegador (TASK-10).
- Nenhum álbum aparece duas vezes: rodar a ação de novo mostra «Every album of your series is already in your inventory. Nothing was added.» e nada é gravado.
- O filtro «Not Owned» mostra os itens novos; «Owned» e «Wishlist» mostram os de antes, cada um no seu grupo; a busca continua a valer junto.
- Durante a ação, a aba de rede não mostra nenhum pedido ao Apple Music nem ao servidor do app: só leituras e gravações do Firestore (TASK-10).
- Depois da ação, «Add to Inventory» no cartão de um álbum que veio de uma série responde «Album is already in your inventory».
- Segunda fatia: depois de «Update ratings» na conta do MJRP (211 itens), os itens mostram a linha das médias, e a ordem «Avg Rating» põe a maior nota primeiro e os itens sem nota por último; com o Spotify desconectado o fim diz a frase do Spotify e nenhuma «Avg Pop» que o item já tinha é apagada. A contar no navegador (TASK-17).
- Nenhuma função nova ou editada passa de complexidade 10; `InventoryRepository.addAlbum` e `InventoryView.render` saíram da lista de exceções.

## Out of Scope
- **Escrever no inventário quando uma série é criada ou editada.** Fica como pergunta aberta abaixo; nesta feature a ação é repetível e traz as séries novas quando é apertada de novo.
- **Tirar do inventário o álbum que saiu de uma série.** A ação só adiciona.
- **Carregar os álbuns pelo catálogo para o inventário** (faixas, notas): o item traz o que a série guarda.
- **Ordenar a grade.** (Primeira fatia.) Feita depois, no mesmo ramo: por artista e título. Na segunda fatia o seletor ganhou as médias e a data de entrada (REQ-17).
- **Paginar a grade.** 200 cartões são desenhados numa passada; não há nada quadrático no desenho.
- **Migrar o campo `owned`** para um campo de texto: o valor gravado fica como sempre foi.
- **O ramo morto de `handleUpdateAlbum`** (espera `false` de um serviço que lança): mesmo defeito que a F70 consertou no preço; não é desta entrega.

## Open Questions
<!-- ALL resolved before Plan. -->
- **O inventário deve seguir as séries sozinho, sem o botão?** — Aberta para o MJRP. Hoje: não; a ação é repetível, e apertá-la de novo traz os álbuns das séries novas (só o que falta entra). O que o automático pediria: (1) `SeriesService.createSeries`, `addAlbumToSeries` e a edição de série chamarem o serviço do inventário depois de gravar a série, o que liga duas áreas que hoje não se conhecem; (2) decidir o que acontece quando um álbum sai de uma série ou a série é apagada — o item «Not Owned» sai do inventário? E se a pessoa já o marcou «Owned» ou pôs preço? E se outra série ainda o pede? (3) uma marca de origem confiável em cada item (esta entrega já grava `albumData.metadata.addedFrom: 'series'`); (4) o que fazer com a falha da segunda gravação (a série foi salva, o inventário não). Recomendação do agente: manter o botão e, se o MJRP quiser o automático, fazer só a entrada (nunca a saída) numa feature própria.
- **As três contagens do cabeçalho devem ignorar o filtro de situação?** — Decidido pelo agente — revisável, 2026-11-19: sim. Antes, escolher «Owned» zerava a contagem de «Wishlist»; agora as três dizem quantos itens cada situação tem para a busca e o formato escolhidos, e «N albums» e «Total Owned» seguem o que está na grade. O MJRP julga na TASK-11.
- **A regra de identidade trata «(Live)» e «(Remastered)» como edição do mesmo álbum: dois pedidos assim nas séries viram um item só.** — Decidido pelo agente — revisável, 2026-11-19: vale a regra única, sem exceção nesta tela (o pedido do MJRP é «uma regra só»). As entradas deixadas de fora saem no console do navegador, com o motivo, para a conferência da TASK-10; se algum par for de álbuns que ele quer separados, a exceção entra em `shared/albumIdentity.js`, não aqui.
- **Um cartão sem preço deve mostrar «$0.00»?** — Decidido pelo agente — revisável, 2026-11-19: não. Com 176 itens «Not Owned» sem preço, «$0.00» em cada um diria que custaram nada. Muda também os itens antigos sem preço, que mostravam «$0.00» ou «R$ 0.00». O MJRP julga na TASK-11.
- **A janela do álbum aberta fora do inventário (na tela de álbuns) mostrava «OWNED» para qualquer álbum.** — Decidido pelo agente — revisável, 2026-11-19: sem item do inventário, a janela não mostra situação nenhuma; aberta do inventário, mostra a do item. O MJRP julga na TASK-11.
- **Em que ordem a grade deve mostrar 200 itens?** — Decidido pelo agente — revisável, 2026-11-19: por artista e depois por título (feito na primeira fatia, `models/inventorySort.js`); na segunda fatia, o seletor oferece também as médias e a data de entrada.
- **Um texto de série sem « - » (só o título, sem artista) não vira item.** — Decidido pelo agente — revisável, 2026-11-19: fica de fora, contado na confirmação («n entries with no artist or no title are left out»); o inventário exige artista e título, e sem artista a regra de identidade aceitaria o álbum de qualquer artista.
- **«filtro/ranking»: um filtro por nota mínima não foi construído.** — Aberta para o MJRP. O pedido dizia «filtro/ranking por BEA Avg rank e Spotify Avg Pop»; foi feita só a ordenação (o «ranking»). Um filtro por nota mínima («só álbuns com Avg Rating de 80 para cima») pediria: (1) um campo numérico na barra de filtros (ou um seletor de faixas de nota), com o valor guardado em `state.filters`; (2) uma regra nova em `models/inventoryFilter.js` (`filterInventory`) que lê `item.averages.rating` e `item.averages.popularity`, decidindo antes o que fazer com o item sem média (sair do filtro, o mais honesto, ou ficar); (3) as contagens do cabeçalho passarem a seguir o filtro novo, ou ignorá-lo como ignoram o de situação; (4) testes do modelo, do controlador e da tela. Não muda o dado guardado: `averages` já tem o que o filtro precisa.
- **«Avg Rank» saiu da comparação de faixas do álbum.** — Decidido pelo MJRP em 2026-11-19 («poderia trocar por AVG Rating tb»); fica registrado como mudança de comportamento fora da tela do inventário, para ele julgar na TASK-17.
- **As médias do inventário só mudam quando a pessoa aperta «Update ratings».** — Decidido pelo agente — revisável, 2026-11-19: o item guarda o número da última leitura (`averages.at` diz quando); nada o refaz sozinho. Um álbum cuja fonte não respondeu desta vez mantém o número anterior em vez de virar «—». Se o MJRP quiser que o inventário se atualize sem o botão (por exemplo, ao abrir a tela quando `at` for velho), é outra feature: pede uma regra de «velho», uma leitura em segundo plano pela mesma fila e um lugar que diga à pessoa que está acontecendo.
- **O botão pede ao serviço de carga todos os álbuns do inventário de uma vez.** — Decidido pelo agente — revisável, 2026-11-19: 211 álbuns passam pela fila educada do catálogo, das notas e do Spotify, e podem levar minutos (o tempo real não foi medido: depende do que o navegador já guarda para essas consultas). Por isso a pergunta antes de começar, com mais de 30 álbuns. A consulta de cada item leva artista, título, ano e o id do Apple Music que o item guarda.
