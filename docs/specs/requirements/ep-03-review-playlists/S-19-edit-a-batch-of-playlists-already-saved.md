---
id: S-19
aliases: [S-19]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-03]]"
planned_for: "[[ROADMAP#^REL-03]]"
points_to: ["[[behavior#^playlists-edit-mode]]", "[[behavior#^playlists-edit-not-found]]", "[[behavior#^playlists-save-saved]]"]
delivered_by: ["f1b3d46"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-19 · Editar um lote de playlists já guardado

## pt-BR

Como quem cura playlists a partir de álbuns, quero abrir um lote guardado na tela de edição, mudar as faixas ou o nome e guardar de novo, para que eu ajuste uma mistura sem refazê-la do zero.
Hoje (fato lido do código): a tela se chama «Edit Playlist Batch» e mostra «Editing: <lote>»; guardar apaga o lote antigo e grava o novo; lote que não existe mais leva à tela «Batch Not Found».
Entrega (histórico, antes do harness): 2025-12-18 (f1b3d46); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: P1, P5, P14 (`controllers/PlaylistsController.js:26-117`, `views/PlaylistsView.js:266-312`); ROADMAP legado, Sprint 9+10 («EditPlaylistView»).

## en

**Edit a batch of playlists already saved**

As someone who curates playlists from albums, I want to open a saved batch on the edit screen, change the tracks or the name and save again, so that I adjust a blend without redoing it from scratch.
Today (read from the code): the screen is called “Edit Playlist Batch” and shows “Editing: <batch>”; saving deletes the old batch and writes the new one; a batch that no longer exists leads to the “Batch Not Found” screen.
Delivery (history, before the harness): 2025-12-18 (f1b3d46); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: P1, P5, P14 (`controllers/PlaylistsController.js:26-117`, `views/PlaylistsView.js:266-312`); legacy ROADMAP, Sprint 9+10 (“EditPlaylistView”).
