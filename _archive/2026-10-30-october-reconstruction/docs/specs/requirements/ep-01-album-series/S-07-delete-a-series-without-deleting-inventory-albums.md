---
id: S-07
aliases: [S-07]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^series-delete-confirm]]", "[[behavior#^series-deleted]]", "[[behavior#^series-delete-failed]]"]
delivered_by: ["b85f473"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-07 · Excluir uma série sem apagar os álbuns do inventário

## pt-BR

Como quem cura playlists a partir de álbuns, quero excluir uma série que não quero mais, depois de confirmar, para que a biblioteca fique só com o que uso, e os álbuns do inventário continuem lá.
Hoje (fato lido do código): a janela «Delete Series?» avisa que os álbuns não saem do inventário; se eu estava vendo só essa série, volto à biblioteca.
Entrega (histórico, antes do harness): 2025-12-03 (b85f473); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A10, A11 (`components/series/SeriesModals.js:55-85`); ROADMAP legado, Sprint 5.

## en

**Delete a series without deleting inventory albums**

As someone who curates playlists from albums, I want to delete a series I no longer want, after confirming, so that the library keeps only what I use, and the inventory albums stay.
Today (read from the code): the “Delete Series?” window warns that albums are not removed from the inventory; if I was viewing only that series, I go back to the library.
Delivery (history, before the harness): 2025-12-03 (b85f473); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A10, A11 (`components/series/SeriesModals.js:55-85`); legacy ROADMAP, Sprint 5.
