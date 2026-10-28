---
id: S-25
aliases: [S-25]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-05]]"
planned_for: "[[ROADMAP#^REL-01]]"
points_to: ["[[behavior#^album-track-table]]", "[[behavior#^album-card]]"]
delivered_by: ["1e5be0b", "7154dc7"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-25 · Ver as faixas de cada álbum com a nota do BestEverAlbums

## pt-BR

Como quem cura playlists a partir de álbuns, quero ver, na lista de cada álbum, as faixas com a posição e a nota da crítica no BestEverAlbums, para que eu saiba quais faixas a crítica mais aclama.
Hoje (fato lido do código): clicar no cabeçalho da coluna ordena a tabela; o cabeçalho mostra as médias; faixa sem dado fica na ordem original.
Entrega (histórico, antes do harness): 2025-11-26 (1e5be0b), 2025-11-25 (7154dc7); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A13, A17, K2 (`components/ranking/TracksTable.js:8-290`, `server/lib/services/EnrichmentService.js:35-103`); ROADMAP legado, Sprint 3 («BestEverAlbums badge integration»).

## en

**See album tracks with the BestEverAlbums rating**

As someone who curates playlists from albums, I want to see, in each album's list, the tracks with their position and critics' rating on BestEverAlbums, so that I know which tracks the critics acclaim the most.
Today (read from the code): clicking a column header sorts the table; the header shows the averages; a track without data stays in its original order.
Delivery (history, before the harness): 2025-11-26 (1e5be0b), 2025-11-25 (7154dc7); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A13, A17, K2 (`components/ranking/TracksTable.js:8-290`, `server/lib/services/EnrichmentService.js:35-103`); legacy ROADMAP, Sprint 3 (“BestEverAlbums badge integration”).
