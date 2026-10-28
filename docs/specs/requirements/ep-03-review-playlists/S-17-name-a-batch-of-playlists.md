---
id: S-17
aliases: [S-17]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-03]]"
planned_for: "[[ROADMAP#^REL-04]]"
points_to: ["[[behavior#^playlists-batch-name-live]]", "[[behavior#^blend-default-batch-name]]"]
delivered_by: ["d3ed5e1"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-17 · Dar nome a um lote de playlists

## pt-BR

Como quem cura playlists a partir de álbuns, quero dar um nome ao lote de playlists e ver os títulos da grade acompanharem o que digito, para que eu reconheça cada lote quando voltar a ele ou o exportar.
Hoje (fato lido do código): o campo está sempre à vista, com um nome padrão; ao digitar, os títulos viram «1. Lote - Título» na hora; o nome vale também para a exportação.
Entrega (histórico, antes do harness): 2026-01-02 (d3ed5e1); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: P6 (`views/renderers/PlaylistsGridRenderer.js:89-104`, `components/playlists/PlaylistGrid.js:55-62`); ROADMAP legado, Sprint 16 («Batch Naming Integration»).

## en

**Name a batch of playlists**

As someone who curates playlists from albums, I want to give the batch of playlists a name and see the grid titles follow what I type, so that I recognize each batch when I return to it or export it.
Today (read from the code): the field is always visible, with a default name; as I type, the titles become “1. Batch - Title” right away; the name also applies to the export.
Delivery (history, before the harness): 2026-01-02 (d3ed5e1); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: P6 (`views/renderers/PlaylistsGridRenderer.js:89-104`, `components/playlists/PlaylistGrid.js:55-62`); legacy ROADMAP, Sprint 16 (“Batch Naming Integration”).
