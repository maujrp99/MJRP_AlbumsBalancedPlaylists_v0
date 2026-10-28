---
id: S-18
aliases: [S-18]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-03]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^saved-loading]]", "[[behavior#^saved-load-failed]]", "[[behavior#^saved-empty]]", "[[behavior#^saved-filter-empty]]", "[[behavior#^saved-hierarchy]]", "[[behavior#^saved-batch-card]]", "[[behavior#^saved-series-header]]", "[[behavior#^saved-playlist-details]]"]
delivered_by: ["3919f18"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-18 · Consultar as playlists guardadas, por série e por lote

## pt-BR

Como quem cura playlists a partir de álbuns, quero abrir as playlists guardadas organizadas por série e por lote, buscar, ordenar e ver as faixas de cada playlist, para que eu encontre uma mistura que já fiz.
Hoje (fato lido do código): os lotes vêm do mais novo ao mais antigo; cada lote começa recolhido e mostra capas, contagens e data; a lista tem estados de carregando, falha, vazio e sem resultado.
Entrega (histórico, antes do harness): 2025-12-06 (3919f18); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: S1 a S9 (`views/SavedPlaylistsView.js`, `components/playlists/Saved*`, `components/playlists/PlaylistDetailsModal.js`); ROADMAP legado, Sprint 5 e Sprint 22 (filtros e ordenação).

## en

**Browse the saved playlists, by series and by batch**

As someone who curates playlists from albums, I want to open the saved playlists organized by series and by batch, search, sort and see each playlist's tracks, so that I find a blend I already made.
Today (read from the code): batches come from newest to oldest; each batch starts collapsed and shows covers, counts and date; the list has loading, failure, empty and no-match states.
Delivery (history, before the harness): 2025-12-06 (3919f18); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: S1 to S9 (`views/SavedPlaylistsView.js`, `components/playlists/Saved*`, `components/playlists/PlaylistDetailsModal.js`); legacy ROADMAP, Sprint 5 and Sprint 22 (filters and sorting).
