---
id: S-03
aliases: [S-03]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-04]]"
points_to: ["[[behavior#^home-bulk-format-hint]]", "[[behavior#^home-bulk-processed]]", "[[behavior#^home-bulk-nothing-found]]", "[[behavior#^home-bulk-failed]]"]
delivered_by: ["cd4dc21"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-03 · Colar uma lista de «Artista - Álbum» para montar a série

## pt-BR

Como quem cura playlists a partir de álbuns, quero colar uma lista com um «Artista - Álbum» por linha e ver os álbuns achados, para que eu monte a série de uma vez, com a lista que já tenho.
Hoje (fato lido do código): a borda da caixa fica verde quando o formato está certo e laranja quando não; linhas sem «-» são ignoradas; o resultado vem num aviso «Processed N albums.».
Entrega (histórico, antes do harness): 2025-12-27 (cd4dc21); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: H3, H10 (`controllers/HomeController.js:76-217`); ROADMAP legado, Sprint 14. O caso de caixa vazia falha (H10, linha 132) e está na lista de conserto, não aqui.

## en

**Paste a list of albums to build a series**

As someone who curates playlists from albums, I want to paste a list with one “Artist - Album” per line and see the albums found, so that I build the series in one go, from a list I already have.
Today (read from the code): the box border turns green when the format is right and orange when it is not; lines without “-” are ignored; the result comes in a notice “Processed N albums.”.
Delivery (history, before the harness): 2025-12-27 (cd4dc21); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: H3, H10 (`controllers/HomeController.js:76-217`); legacy ROADMAP, Sprint 14. The empty-box case fails (H10, line 132) and is on the fix list, not here.
