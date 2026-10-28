---
id: S-24
aliases: [S-24]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-04]]"
planned_for: "[[ROADMAP#^REL-03]]"
points_to: ["[[behavior#^spotify-export-steps]]", "[[behavior#^spotify-export-merge-or-separate]]", "[[behavior#^spotify-export-success]]", "[[behavior#^spotify-export-error]]"]
delivered_by: ["6013d87", "2336104"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-24 · Enviar as playlists para o Spotify, juntas ou separadas

## pt-BR

Como quem cura playlists a partir de álbuns, quero enviar as playlists para o Spotify como uma só playlist privada ou como uma playlist para cada uma, para que eu ouça a mistura no Spotify.
Hoje (fato lido do código): a janela mostra o progresso, quantas faixas foram achadas, a taxa de acerto e até 10 faixas não achadas.
Entrega (histórico, antes do harness): 2025-12-19 (6013d87), 2025-12-20 (2336104); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: X1 a X5, E1 (`components/SpotifyExportModal.js`, `services/SpotifyExportService.js`); ROADMAP legado, Sprint 11 («Export to Spotify»). O botão «Open in Spotify» no modo separado não faz nada e está em outra story.

## en

**Send the playlists to Spotify, merged or separate**

As someone who curates playlists from albums, I want to send the playlists to Spotify as a single private playlist or as one playlist each, so that I listen to the blend on Spotify.
Today (read from the code): the window shows progress, how many tracks were found, the match rate and up to 10 tracks not found.
Delivery (history, before the harness): 2025-12-19 (6013d87), 2025-12-20 (2336104); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: X1 to X5, E1 (`components/SpotifyExportModal.js`, `services/SpotifyExportService.js`); legacy ROADMAP, Sprint 11 (“Export to Spotify”). The “Open in Spotify” button in separate mode does nothing and is in another story.
