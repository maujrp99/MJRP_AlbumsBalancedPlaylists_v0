---
id: S-36
aliases: [S-36]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-07]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^inventory-search-and-filters]]", "[[behavior#^inventory-filter-empty]]"]
delivered_by: ["730a9d2"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-36 · Buscar na coleção por título, artista ou notas e filtrar por formato e situação

## pt-BR

Como colecionador de álbuns, quero buscar na coleção por título, artista ou notas, e filtrar por formato (CD, vinil, digital) e situação (tenho, quero ter), para que eu ache um item numa coleção grande.
Hoje (fato lido do código): sem resultado, a tela diz «No albums found matching your filters.».
Entrega (histórico, antes do harness): 2025-12-08 (730a9d2); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: I3 (`views/InventoryView.js:119-151`, `controllers/InventoryController.js:112-151`); ROADMAP legado, Sprint 5.

## en

**Search and filter the collection**

As an album collector, I want to search the collection by title, artist or notes, and filter by format (CD, vinyl, digital) and status (owned, wishlist), so that I find an item in a large collection.
Today (read from the code): with no match, the screen says “No albums found matching your filters.”.
Delivery (history, before the harness): 2025-12-08 (730a9d2); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: I3 (`views/InventoryView.js:119-151`, `controllers/InventoryController.js:112-151`); legacy ROADMAP, Sprint 5.
