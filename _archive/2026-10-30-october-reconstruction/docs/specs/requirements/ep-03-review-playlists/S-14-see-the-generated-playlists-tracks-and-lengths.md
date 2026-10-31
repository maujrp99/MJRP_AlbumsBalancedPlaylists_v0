---
id: S-14
aliases: [S-14]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-03]]"
planned_for: "[[ROADMAP#^REL-01]]"
points_to: ["[[behavior#^playlists-grid]]", "[[behavior#^playlists-track-row]]"]
delivered_by: ["c8be9fa"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-14 · Ver as playlists geradas, com as faixas e a duração de cada uma

## pt-BR

Como quem cura playlists a partir de álbuns, quero ver as playlists geradas com o título, as faixas, a duração e a posição de cada faixa por fonte de nota, para que eu confira o resultado antes de guardar ou exportar.
Hoje (fato lido do código): a grade tem 1, 2 ou 3 colunas conforme a largura; cada faixa mostra selos de posição (a minha em azul, BestEverAlbums em laranja, Spotify em verde).
Entrega (histórico, antes do harness): 2025-11-27 (c8be9fa); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: P8, P9 (`components/playlists/PlaylistGrid.js:28-139`, `components/ui/TrackRow.js:34-211`); ROADMAP legado, Sprint 3 («Playlists view») e Sprint 4.

## en

**See the generated playlists, tracks and lengths**

As someone who curates playlists from albums, I want to see the generated playlists with the title, the tracks, the length and each track's position by rating source, so that I check the result before saving or exporting.
Today (read from the code): the grid has 1, 2 or 3 columns by width; each track shows position badges (mine in blue, BestEverAlbums in orange, Spotify in green).
Delivery (history, before the harness): 2025-11-27 (c8be9fa); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: P8, P9 (`components/playlists/PlaylistGrid.js:28-139`, `components/ui/TrackRow.js:34-211`); legacy ROADMAP, Sprint 3 (“Playlists view”) and Sprint 4.
