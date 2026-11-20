---
status: In Progress
lane: fast
solution_type: feature
imports: ["[[S-54-have-every-album-of-my-series-in-my-inventory]]"]
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

## Summary
**A feature:** O inventário ganha uma ação que põe nele todos os álbuns das séries da pessoa que ainda não estão lá, marcados como «Not Owned»; e o filtro de situação passa a oferecer «Owned», «Not Owned» e «Wishlist», além de «All».

**Por quê:** O MJRP quer ver, num lugar só, o que já possui e o que falta dos álbuns que ele curou; hoje o inventário só tem o que foi adicionado um a um.

**Como saber que funcionou:** Depois da ação, todo álbum das séries aparece no inventário uma vez só; os que já estavam lá mantêm a situação, o preço e o formato; o filtro mostra cada um dos três grupos pelo nome.

## Problem Statement
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

Nenhum estado de tela novo num `info-arch.md`: a ação é um botão na barra de filtros que já existe, e não houve protótipo (via rápida; o MJRP julga na tela).

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
O nó S-54 ainda não tem critérios de aceite escritos (nível do problema); os itens abaixo vêm das palavras do MJRP e do «Como saber que funcionou».

- Na conta do MJRP (23 itens, 199 álbuns distintos em 47 séries, na contagem de 2026-11-19): depois da ação, o cabeçalho mostra por volta de 199 álbuns mais os itens do inventário que não estão em nenhuma série; a soma das três contagens é o total; os 23 itens de antes têm a mesma situação, preço, formato e notas. A contar no navegador (TASK-10).
- Nenhum álbum aparece duas vezes: rodar a ação de novo mostra «Every album of your series is already in your inventory. Nothing was added.» e nada é gravado.
- O filtro «Not Owned» mostra os itens novos; «Owned» e «Wishlist» mostram os de antes, cada um no seu grupo; a busca continua a valer junto.
- Durante a ação, a aba de rede não mostra nenhum pedido ao Apple Music nem ao servidor do app: só leituras e gravações do Firestore (TASK-10).
- Depois da ação, «Add to Inventory» no cartão de um álbum que veio de uma série responde «Album is already in your inventory».
- Nenhuma função nova ou editada passa de complexidade 10; `InventoryRepository.addAlbum` e `InventoryView.render` saíram da lista de exceções.

## Out of Scope
- **Escrever no inventário quando uma série é criada ou editada.** Fica como pergunta aberta abaixo; nesta feature a ação é repetível e traz as séries novas quando é apertada de novo.
- **Tirar do inventário o álbum que saiu de uma série.** A ação só adiciona.
- **Carregar os álbuns pelo catálogo para o inventário** (faixas, notas): o item traz o que a série guarda.
- **Ordenar a grade.** A tela não tem ordenação ligada (o controlador ordena por um campo que os itens não têm, e a ordem que se vê é a do banco). Com 200 itens isso passa a pesar: está nas perguntas abaixo.
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
- **Em que ordem a grade deve mostrar 200 itens?** — Aberta para o MJRP. Hoje a ordem é a do banco (o id automático do item), que para a pessoa parece aleatória. A troca é pequena (ordenar por artista e título, em `InventoryController`), mas muda a tela de um jeito que ele não pediu; não foi feita.
- **Um texto de série sem « - » (só o título, sem artista) não vira item.** — Decidido pelo agente — revisável, 2026-11-19: fica de fora, contado na confirmação («n entries with no artist or no title are left out»); o inventário exige artista e título, e sem artista a regra de identidade aceitaria o álbum de qualquer artista.
