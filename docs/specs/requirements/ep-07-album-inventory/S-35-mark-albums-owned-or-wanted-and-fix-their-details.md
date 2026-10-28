---
id: S-35
aliases: [S-35]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-07]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^inventory-status-changed]]", "[[behavior#^inventory-item-edited]]"]
delivered_by: ["730a9d2"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-35 · Marcar se tenho o álbum ou se quero ter, e corrigir formato, preço e notas

## pt-BR

Como colecionador de álbuns, quero mudar a situação de um álbum entre «não tenho», «tenho» e «quero ter», e corrigir o formato, a moeda, o preço e as notas, para que a coleção diga a verdade sobre o que tenho.
Hoje (fato lido do código): trocar a situação avisa «Moved to Collection», «Moved to Wishlist» ou «Marked as Not Owned»; editar avisa «Album updated».
Entrega (histórico, antes do harness): 2025-12-08 (730a9d2); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: I5, I7 (`controllers/InventoryController.js:259-312`, `components/inventory/InventoryEditModal.js:18-121`); ROADMAP legado, Sprint 5.

## en

**Mark albums owned or wanted, and fix their details**

As an album collector, I want to change an album's status between “not owned”, “owned” and “wishlist”, and fix the format, currency, price and notes, so that the collection tells the truth about what I own.
Today (read from the code): changing the status says “Moved to Collection”, “Moved to Wishlist” or “Marked as Not Owned”; editing says “Album updated”.
Delivery (history, before the harness): 2025-12-08 (730a9d2); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: I5, I7 (`controllers/InventoryController.js:259-312`, `components/inventory/InventoryEditModal.js:18-121`); legacy ROADMAP, Sprint 5.
