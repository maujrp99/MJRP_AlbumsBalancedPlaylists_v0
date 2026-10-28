---
id: S-15
aliases: [S-15]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-03]]"
planned_for: "[[ROADMAP#^REL-01]]"
points_to: ["[[behavior#^playlists-track-removed]]", "[[behavior#^playlists-track-dragged]]"]
delivered_by: ["c8be9fa"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-15 · Reorganizar as playlists arrastando faixas e tirando as que não quero

## pt-BR

Como usuário avançado no computador, quero arrastar faixas dentro de uma playlist e de uma para outra, e tirar a faixa que não quero, para que a playlist final fique do meu jeito.
Hoje (fato lido do código): no computador o ✕ da faixa aparece ao passar o mouse; no toque o arrasto começa depois de 100 ms.
Entrega (histórico, antes do harness): 2025-11-27 (c8be9fa); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: P10, P12, DD3 (`views/playlists/PlaylistsDragHandler.js:31-71`, `views/PlaylistsView.js:83-94`); ROADMAP legado, Sprint 4 («Drag-and-drop with Sortable.js»). Desfazer e refazer não têm botão e estão em outra story.

## en

**Reorder playlists by dragging and removing tracks**

As a power user on the computer, I want to drag tracks within a playlist and from one to another, and remove a track I don't want, so that the final playlist ends up my way.
Today (read from the code): on the computer the track's ✕ appears on hover; on touch, dragging starts after 100 ms.
Delivery (history, before the harness): 2025-11-27 (c8be9fa); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: P10, P12, DD3 (`views/playlists/PlaylistsDragHandler.js:31-71`, `views/PlaylistsView.js:83-94`); legacy ROADMAP, Sprint 4 (“Drag-and-drop with Sortable.js”). Undo and redo have no button and are in another story.
