---
id: S-02
aliases: [S-02]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-04]]"
points_to: ["[[behavior#^home-scan-loading]]", "[[behavior#^home-scan-found]]", "[[behavior#^home-scan-not-found]]", "[[behavior#^home-scan-failed]]", "[[behavior#^home-discography-type-filters]]", "[[behavior#^home-discography-filter-empty]]", "[[behavior#^home-album-added-to-stack]]", "[[behavior#^home-stack-empty]]", "[[behavior#^home-stack-filled]]"]
delivered_by: ["4c62a82"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-02 · Procurar os álbuns de um artista e escolher quais entram na série

## pt-BR

Como quem cura playlists a partir de álbuns, quero procurar um artista, ver a discografia do mais novo ao mais antigo, filtrar por tipo (estúdio, EP, single, ao vivo) e escolher os álbuns, para que eu monte a série sem digitar o título de cada álbum.
Hoje (fato lido do código): «Studio» começa ligado; escolher um álbum o põe no conjunto, que se reordena arrastando; o app classifica cada álbum pelo tipo (álbum, EP, single, ao vivo, coletânea) e entende apelidos de artista como «led zep».
Entrega (histórico, antes do harness): 2025-12-28 (4c62a82); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: H2, H4, H5, H6, H7, H9 (`controllers/SearchController.js:20-169`, `services/album-search/AlbumTypeClassifier.js:19-60`); ROADMAP legado, Sprint 14 («Split-Panel Staging Area & Search») e Sprint 17.75 (classificação por tipo).

## en

**Find an artist's albums and pick the ones to mix**

As someone who curates playlists from albums, I want to search for an artist, see the discography from newest to oldest, filter by type (studio, EP, single, live) and pick the albums, so that I build the series without typing every album title.
Today (read from the code): “Studio” starts on; picking an album puts it in the chosen set, which is reordered by dragging; the app classifies each album by type (album, EP, single, live, compilation) and understands artist nicknames such as “led zep”.
Delivery (history, before the harness): 2025-12-28 (4c62a82); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: H2, H4, H5, H6, H7, H9 (`controllers/SearchController.js:20-169`, `services/album-search/AlbumTypeClassifier.js:19-60`); legacy ROADMAP, Sprint 14 (“Split-Panel Staging Area & Search”) and Sprint 17.75 (classification by type).
