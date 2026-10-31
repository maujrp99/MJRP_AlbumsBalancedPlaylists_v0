---
id: S-05
aliases: [S-05]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-01]]"
points_to: ["[[behavior#^library-search-and-filters]]", "[[behavior#^library-filter-empty]]"]
delivered_by: ["585bed7"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-05 · Achar um álbum na biblioteca por busca e filtros

## pt-BR

Como quem cura playlists a partir de álbuns, quero buscar por título ou artista e filtrar por série, artista, década e fonte da nota, para que eu chegue ao álbum que quero numa biblioteca grande.
Hoje (fato lido do código): sem resultado, a tela diz «No albums match your filters»; trocar de série zera a busca e os filtros.
Entrega (histórico, antes do harness): 2025-11-28 (585bed7); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A3, A4 (`components/ui/FilterToolbar.js:49-60`, `services/SeriesFilterService.js:37-82`); o filtro «My Ranking» entrou no Sprint 21.

## en

**Find an album in the library by search and filters**

As someone who curates playlists from albums, I want to search by title or artist and filter by series, artist, decade and rating source, so that I reach the album I want in a large library.
Today (read from the code): with no match, the screen says “No albums match your filters”; switching series clears the search and the filters.
Delivery (history, before the harness): 2025-11-28 (585bed7); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A3, A4 (`components/ui/FilterToolbar.js:49-60`, `services/SeriesFilterService.js:37-82`); the “My Ranking” filter arrived in Sprint 21.
