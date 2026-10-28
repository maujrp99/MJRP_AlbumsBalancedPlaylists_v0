---
id: S-11
aliases: [S-11]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-02]]"
planned_for: "[[ROADMAP#^REL-04]]"
points_to: ["[[behavior#^blend-steps-unlock]]", "[[behavior#^blend-series-choice]]", "[[behavior#^blend-series-none]]", "[[behavior#^blend-recipe-choice]]", "[[behavior#^blend-generating]]", "[[behavior#^blend-failed]]", "[[behavior#^blend-default-batch-name]]"]
delivered_by: ["e8ebe0b", "9d53fdf"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-11 · Montar a mistura em passos: série, receita e ingredientes

## pt-BR

Como quem cura playlists a partir de álbuns, quero percorrer um menu de mistura em passos, escolhendo a série, a receita e os ingredientes, e gerar no fim, para que eu saiba o que falta escolher e gere a playlist de uma vez.
Hoje (fato lido do código): os passos seguintes ficam trancados até o anterior ser escolhido; o lote nasce com o nome «TheAlbumBlender Playlist AAAA-MM-DD HH:mm»; no fim abre a tela de playlists.
Entrega (histórico, antes do harness): 2025-12-23 (e8ebe0b), 2025-12-31 (9d53fdf); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: B1, B2, B4, B7, B8 (`views/BlendingMenuView.js:44-446`, `controllers/BlendingController.js:51-208`); ROADMAP legado, Sprint 7 («Rebrand: The Album Blender») e Sprint 15.5.

## en

**Build the blend in steps: series, recipe, ingredients**

As someone who curates playlists from albums, I want to go through a blending menu in steps, choosing the series, the recipe and the ingredients, and generate at the end, so that I know what is left to choose and generate the playlist in one go.
Today (read from the code): the next steps stay locked until the previous one is chosen; the batch is born named “TheAlbumBlender Playlist YYYY-MM-DD HH:mm”; at the end the playlists screen opens.
Delivery (history, before the harness): 2025-12-23 (e8ebe0b), 2025-12-31 (9d53fdf); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: B1, B2, B4, B7, B8 (`views/BlendingMenuView.js:44-446`, `controllers/BlendingController.js:51-208`); legacy ROADMAP, Sprint 7 (“Rebrand: The Album Blender”) and Sprint 15.5.
