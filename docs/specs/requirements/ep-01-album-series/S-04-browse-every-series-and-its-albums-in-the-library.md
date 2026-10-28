---
id: S-04
aliases: [S-04]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-01]]"
points_to: ["[[behavior#^library-scope-url]]", "[[behavior#^library-loading-skeleton]]", "[[behavior#^library-load-failed]]", "[[behavior#^library-empty]]", "[[behavior#^library-view-mode-remembered]]", "[[behavior#^album-card]]", "[[behavior#^album-detail-modal]]"]
delivered_by: ["1e5be0b"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-04 · Ver todas as séries e os álbuns de cada uma na biblioteca

## pt-BR

Como quem cura playlists a partir de álbuns, quero abrir a biblioteca e ver as minhas séries com os álbuns de cada uma, em grade ou em lista, para que eu encontre o que já montei sem recomeçar.
Hoje (fato lido do código): a escolha de grade ou lista fica guardada no navegador; enquanto carrega, cada série aparece como esqueleto; biblioteca vazia leva à tela inicial.
Entrega (histórico, antes do harness): 2025-11-26 (1e5be0b); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A1, A6, A8, A13, A18, M1 (`views/SeriesView.js`, `controllers/SeriesController.js:90-317`); ROADMAP legado, Sprint 3 («Albums Library», «Grid vs Expanded view toggle»).

## en

**Browse every series and its albums in the library**

As someone who curates playlists from albums, I want to open the library and see my series with each one's albums, as a grid or a list, so that I find what I already built without starting over.
Today (read from the code): the grid-or-list choice is remembered in the browser; while loading, each series shows as a skeleton; an empty library leads to the home screen.
Delivery (history, before the harness): 2025-11-26 (1e5be0b); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A1, A6, A8, A13, A18, M1 (`views/SeriesView.js`, `controllers/SeriesController.js:90-317`); legacy ROADMAP, Sprint 3 (“Albums Library”, “Grid vs Expanded view toggle”).
