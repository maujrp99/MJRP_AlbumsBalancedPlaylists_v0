---
id: S-29
aliases: [S-29]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-05]]"
planned_for: "[[ROADMAP#^REL-05]]"
points_to: ["[[behavior#^album-refetch-feedback]]"]
delivered_by: ["a2f789e"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-29 · Buscar de novo os dados de um álbum

## pt-BR

Como quem cura playlists a partir de álbuns, quero pedir ao app que busque de novo os dados de um álbum, nas fontes de nota, para que as notas e a popularidade das faixas fiquem em dia.
Hoje (fato lido do código): o botão «Refetch» mostra avisos de início, sucesso ou falha e uma barra de progresso no topo; a mistura passa a usar os dados novos.
Entrega (histórico, antes do harness): 2026-01-17 (a2f789e); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A16 (`controllers/SeriesController.js:406-436`, `services/SeriesService.js:302-475`); ROADMAP legado, Sprint 23 («Cache Sync: Refetch»).

## en

**Fetch an album's data again**

As someone who curates playlists from albums, I want to ask the app to fetch an album's data again, from the rating sources, so that the tracks' ratings and popularity stay up to date.
Today (read from the code): the “Refetch” button shows start, success or failure notices and a progress bar at the top; the blend then uses the new data.
Delivery (history, before the harness): 2026-01-17 (a2f789e); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A16 (`controllers/SeriesController.js:406-436`, `services/SeriesService.js:302-475`); legacy ROADMAP, Sprint 23 (“Cache Sync: Refetch”).
