---
id: S-33
aliases: [S-33]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-07]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^inventory-header-totals]]", "[[behavior#^inventory-currency-toggle]]", "[[behavior#^inventory-view-mode-remembered]]", "[[behavior#^inventory-item-card]]"]
delivered_by: ["bf561e0", "165c055"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-33 · Ver a minha coleção de álbuns, quantos tenho e quanto vale

## pt-BR

Como colecionador de álbuns, quero abrir a coleção e ver os álbuns, quantos tenho, quantos quero ter e o total em dólar ou em real, para que eu saiba o que já tenho antes de montar uma série.
Hoje (fato lido do código): o botão USD/BRL escolhe qual soma mostrar (não converte uma moeda na outra); os totais são dos itens que passam pelos filtros; a escolha de grade ou lista fica guardada.
Entrega (histórico, antes do harness): 2025-11-28 (bf561e0), 2025-12-09 (165c055); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: I1, I2, I4, I5, I6 (`views/InventoryView.js:57-223`, `controllers/InventoryController.js:186-257`); ROADMAP legado, Sprint 5 («Inventory CRUD»).

## en

**See my collection, how many I own and its worth**

As an album collector, I want to open the collection and see the albums, how many I own, how many I want and the total in dollars or reais, so that I know what I already have before building a series.
Today (read from the code): the USD/BRL button chooses which sum to show (it does not convert one currency into the other); totals are for the items that pass the filters; the grid-or-list choice is remembered.
Delivery (history, before the harness): 2025-11-28 (bf561e0), 2025-12-09 (165c055); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: I1, I2, I4, I5, I6 (`views/InventoryView.js:57-223`, `controllers/InventoryController.js:186-257`); legacy ROADMAP, Sprint 5 (“Inventory CRUD”).
