---
id: S-16
aliases: [S-16]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-03]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^playlists-save-saved]]", "[[behavior#^playlists-save-failed]]"]
delivered_by: ["b6034b6"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-16 · Guardar as playlists geradas num lote, na nuvem

## pt-BR

Como quem cura playlists a partir de álbuns, quero guardar as playlists geradas num lote ligado à série, para que eu volte a elas depois, de qualquer lugar onde eu entre com a minha conta.
Hoje (fato lido do código): o botão «Save to Series History» mostra «Saving…» e depois «Saved!»; guardar de novo um lote com o mesmo nome não avisa que sobrescreve; depois de guardar, a tela passa a ser de edição do lote.
Entrega (histórico, antes do harness): 2025-12-07 (b6034b6); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: P14 (`controllers/PlaylistsController.js:273-387`); ROADMAP legado, Sprint 5 («Firestore Persistence: Cloud sync for Albums, Series, and Playlists»).

## en

**Save generated playlists as a batch in the cloud**

As someone who curates playlists from albums, I want to save the generated playlists as a batch tied to the series, so that I come back to them later, from anywhere I sign in.
Today (read from the code): the “Save to Series History” button shows “Saving…” and then “Saved!”; saving a batch with the same name again does not warn that it overwrites; after saving, the screen becomes the batch's edit screen.
Delivery (history, before the harness): 2025-12-07 (b6034b6); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: P14 (`controllers/PlaylistsController.js:273-387`); legacy ROADMAP, Sprint 5 (“Firestore Persistence: Cloud sync for Albums, Series, and Playlists”).
