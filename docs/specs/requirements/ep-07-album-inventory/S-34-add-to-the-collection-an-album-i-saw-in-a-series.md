---
id: S-34
aliases: [S-34]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-07]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^album-add-to-inventory]]", "[[behavior#^inventory-saved-per-user]]"]
delivered_by: ["2f980d0"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-34 · Registrar na coleção um álbum que vi numa série

## pt-BR

Como colecionador de álbuns, quero registrar na coleção, a partir do cartão do álbum, o formato, a moeda, o preço e as notas, para que o que eu tenho fique guardado junto do que eu escuto.
Hoje (fato lido do código): o álbum entra como «Not Owned»; álbum já registrado é recusado; a coleção fica guardada por pessoa, na nuvem. Não há botão de adicionar na própria tela da coleção.
Entrega (histórico, antes do harness): 2025-12-09 (2f980d0); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A15, I9, I10 (`components/modals/InventoryAddModal.js:15-160`, `repositories/InventoryRepository.js:41-65`); ROADMAP legado, Sprint 5 («Inventory CRUD»).

## en

**Add to the collection an album I saw in a series**

As an album collector, I want to register in the collection, from the album card, the format, currency, price and notes, so that what I own is kept next to what I listen to.
Today (read from the code): the album enters as “Not Owned”; an album already registered is refused; the collection is kept per person, in the cloud. There is no add button on the collection screen itself.
Delivery (history, before the harness): 2025-12-09 (2f980d0); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A15, I9, I10 (`components/modals/InventoryAddModal.js:15-160`, `repositories/InventoryRepository.js:41-65`); legacy ROADMAP, Sprint 5 (“Inventory CRUD”).
