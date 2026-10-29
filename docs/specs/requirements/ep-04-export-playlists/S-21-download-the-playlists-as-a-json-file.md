---
id: S-21
aliases: [S-21]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-04]]"
planned_for: "[[ROADMAP#^REL-01]]"
points_to: ["[[behavior#^playlists-download-json]]", "[[behavior#^playlists-actions-panel]]"]
delivered_by: ["c8be9fa"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-21 · Baixar as playlists num arquivo JSON

## pt-BR

Como quem cura playlists a partir de álbuns, quero baixar as playlists geradas num arquivo JSON, para que eu guarde uma cópia delas fora do app.
Hoje (fato lido do código): o arquivo se chama `playlists_<lote>_<AAAA-MM-DD>.json` e leva as playlists e o nome do lote.
Entrega (histórico, antes do harness): 2025-11-27 (c8be9fa); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: P15, E3 (`views/playlists/PlaylistsExport.js:33-58`); ROADMAP legado, Sprint 4.

## en

**Download the playlists as a JSON file**

As someone who curates playlists from albums, I want to download the generated playlists as a JSON file, so that I keep a copy of them outside the app.
Today (read from the code): the file is named `playlists_<batch>_<YYYY-MM-DD>.json` and carries the playlists and the batch name.
Delivery (history, before the harness): 2025-11-27 (c8be9fa); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: P15, E3 (`views/playlists/PlaylistsExport.js:33-58`); legacy ROADMAP, Sprint 4.
