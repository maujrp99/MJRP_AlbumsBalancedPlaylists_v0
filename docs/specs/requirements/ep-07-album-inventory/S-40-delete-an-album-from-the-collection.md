---
id: S-40
aliases: [S-40]
type: requirement
format: story
status: Backlog
epic: "[[prd#^EP-07]]"
---
# S-40 · Excluir um álbum da coleção

## pt-BR

Como colecionador de álbuns, quero excluir da coleção um álbum que não quero mais registrar, depois de confirmar, para que a coleção não guarde o que não é mais meu.
Hoje (fato lido do código; não funciona): a janela «Remove from Inventory?» abre, mas a exclusão falha: o controlador chama `inventoryStore.deleteAlbum`, que não existe (o método da loja é `removeAlbum`), e a pessoa não vê aviso nenhum.
Origem: inventário do V1: I8 (`controllers/InventoryController.js:314-323`, `stores/inventory.js:222`); achado do pacote B (item 7 da dívida técnica); ROADMAP legado, Sprint 5 listava «Inventory CRUD» completo. Proposta pelo agente a partir do inventário; nada foi entregue.

## en

**Delete an album from the collection**

As an album collector, I want to delete from the collection an album I no longer want registered, after confirming, so that the collection does not keep what is no longer mine.
Today (read from the code; it does not work): the “Remove from Inventory?” window opens, but the deletion fails: the controller calls `inventoryStore.deleteAlbum`, which does not exist (the store's method is `removeAlbum`), and the person sees no notice.
Origin: the V1 inventory of the v0: I8 (`controllers/InventoryController.js:314-323`, `stores/inventory.js:222`); package B finding (technical-debt item 7); legacy ROADMAP, Sprint 5 listed “Inventory CRUD” as complete. Proposed by the agent from the inventory; nothing was delivered.
