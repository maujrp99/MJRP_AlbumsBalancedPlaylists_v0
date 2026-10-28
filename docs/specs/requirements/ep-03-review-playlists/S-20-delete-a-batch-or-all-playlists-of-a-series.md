---
id: S-20
aliases: [S-20]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-03]]"
planned_for: "[[ROADMAP#^REL-03]]"
points_to: ["[[behavior#^saved-batch-delete]]", "[[behavior#^saved-series-delete-all]]"]
delivered_by: ["e057cfe"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-20 · Excluir um lote de playlists, ou todas as playlists de uma série

## pt-BR

Como quem cura playlists a partir de álbuns, quero excluir um lote, ou todas as playlists de uma série, depois de confirmar, para que eu limpe o que não quero mais guardar.
Hoje (fato lido do código): as janelas «Delete Batch?» e «Delete All Playlists?» pedem confirmação; depois vem um aviso de sucesso ou de falha.
Entrega (histórico, antes do harness): 2025-12-16 (e057cfe); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: S5, S6 (`components/playlists/SavedPlaylistActions.js:22-41`, `components/playlists/SavedPlaylistsController.js:183-253`); histórico do git (e057cfe).

## en

**Delete a batch or all playlists of a series**

As someone who curates playlists from albums, I want to delete a batch, or all the playlists of a series, after confirming, so that I clear out what I no longer want to keep.
Today (read from the code): the “Delete Batch?” and “Delete All Playlists?” windows ask for confirmation; then comes a success or failure notice.
Delivery (history, before the harness): 2025-12-16 (e057cfe); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: S5, S6 (`components/playlists/SavedPlaylistActions.js:22-41`, `components/playlists/SavedPlaylistsController.js:183-253`); git history (e057cfe).
