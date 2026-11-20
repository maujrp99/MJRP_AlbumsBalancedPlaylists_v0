<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F71: O inventário tem todos os álbuns das minhas séries; filtro por Owned, Not Owned e Wishlist · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `feat/f71-inventory-holds-every-album-of-my-series`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado da `main` local (com o commit `2722d1d`): `feat/f71-inventory-holds-every-album-of-my-series`; suíte verde (2219 testes), build e lint limpos antes de começar
- [x] lidos o nó S-54, os estados `^inventory-*` do `behavior.md`, o código do inventário (tela, controlador, serviço, loja, repositório, modelos), o caminho do «Add to Inventory» do cartão, a loja de séries, o leitor de consultas e a regra de identidade
- [ ] conferência cruzada da spec e do plano: fica para o fecho (via rápida: os dois foram escritos junto com o código)

## Implementation
- [x] TASK-01 `public/js/models/inventoryStatus.js`: as três situações, `statusOf`, `ownedValueOf`, rótulos, opções do filtro e do seletor, contagem; `models/inventoryStats.js` passa a perguntar a ele · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/models/inventoryFilter.js`: busca, formato e situação numa regra pura, e as três contagens do cabeçalho; `controllers/InventoryController.js` (filtro, totais e `handleStatusChange`) passa a perguntar aos modelos · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/models/inventoryFromSeries.js`: o álbum feito de uma consulta de série, «é o mesmo álbum?», o plano (o que entra e o que fica de fora, com o motivo) e os textos; entrada em `CALL_SITES` de `test/architecture/albumIdentityRule.test.js` · implements:: REQ-04, REQ-05, REQ-06, REQ-08 · model:: opus · rounds:: 2
- [x] TASK-04 `public/js/repositories/BaseRepository.js` (`createMany`) e `public/js/repositories/InventoryRepository.js` (`addBatch`, `_itemFor`): muitos itens numa gravação só, «Not Owned», sem formato, preço ou moeda inventados · implements:: REQ-07, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/services/inventory/InventoryService.js` (`planSeriesAlbums`, `addAlbumsAsNotOwned`; `addAlbum` pergunta `findInInventory`) e `public/js/services/inventory/inventoryWiring.js` (`readSeriesOfThePerson`): o plano contra o banco, a gravação em partes de 100, um aviso da loja no fim, a falha dita como foi · implements:: REQ-04, REQ-05, REQ-07, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/controllers/InventoryController.js` (`handleAddSeriesAlbums`) e `public/js/views/InventoryView.js` (o botão «Add the albums of my series», o estado ocupado, o cabeçalho com as três contagens, o filtro «All / Owned / Not Owned / Wishlist») · implements:: REQ-02, REQ-03, REQ-04, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/views/renderers/InventoryGridRenderer.js`, `public/js/components/ViewAlbumModal.js` e `public/js/components/InventoryEditModal.js`: o cartão e as janelas de um item sem faixas, sem formato e sem preço; a situação pelo modelo · implements:: REQ-01, REQ-09 · model:: opus · rounds:: 1
- [x] TASK-08 `test/architecture/complexityAllowlist.js`: saem `repositories/InventoryRepository.js:addAlbum` e `views/InventoryView.js:render`, trazidas para dentro do limite · implements:: REQ-07 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-09 suíte inteira verde (2326 testes em 191 arquivos; eram 2219), `npx vite build` compila, `npx eslint . --quiet` sem erro; os testes de arquitetura (`layerBoundaries`, `firestoreBehindRepositories`, `noDeadModules`, `interfaceInEnglish`, `outsideTextEscaped`, `albumIdentityRule`, `complexityLimit`) passam · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · rounds:: 2
- [ ] TASK-10 prova no navegador e execução na conta do MJRP: abrir o inventário, conferir o filtro e as contagens, rodar «Add the albums of my series», contar os itens depois, conferir que os de antes não mudaram e que nenhum pedido saiu para o Apple Music · implements:: REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · waiting:: human — o auxiliar não tem navegador nem conta, e a ação grava na conta do MJRP · action:: o integrador segue os passos do relatório do auxiliar (anotar antes: total e as três contagens; apertar o botão; conferir a confirmação; contar depois; guardar a evidência em `reports/evidence/F71-inventory-holds-every-album-of-my-series/`)
- [ ] TASK-11 julgamento do MJRP (tarefa do humano) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · waiting:: human — o aceite é do MJRP · action:: o MJRP olha o inventário com os álbuns das séries, o filtro e as contagens, e responde às Open Questions do `spec.md` (o inventário seguir as séries sozinho; a ordem da grade; as mudanças de comportamento fora do pedido)

## Documentation
- [x] `docs/specs/behavior.md`: os estados `^inventory-*` que mudam, o novo `^inventory-series-albums-added`, e `^album-detail-modal` e `^album-add-to-inventory`
- [x] `docs/specs/data-model.md`: `format` e `currency` do item podem ser `null`; o `albumData` de um item que veio de uma série
- [x] `docs/manual/21_Dynamic_UI_Mapping.md` (seção 6), `docs/manual/14_Frontend_Components_Feature_Map.md`, `docs/manual/09_Frontend_Views.md`, `docs/manual/10_Frontend_Renderers.md`, `docs/manual/11_Frontend_Components_Root.md` e `docs/manual/07_Frontend_Data_Infra.md`: as frases que deixaram de ser verdade
- [x] spec, plano e tarefas escritos junto com o código (2026-11-19)
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde; só então `status: Done` (depende da TASK-10 e do aceite do MJRP)
