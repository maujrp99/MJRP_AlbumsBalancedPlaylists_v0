---
id: S-22
aliases: [S-22]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-04]]"
planned_for: "[[ROADMAP#^REL-03]]"
points_to: ["[[behavior#^apple-export-done]]", "[[behavior#^apple-export-failed]]", "[[behavior#^apple-music-not-configured]]"]
delivered_by: ["0be7441"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-22 · Enviar as playlists para o Apple Music

## pt-BR

Como quem cura playlists a partir de álbuns, quero enviar as playlists do lote para o Apple Music, numa pasta com o nome da série, para que eu ouça a mistura no player que já uso.
Hoje (fato lido do código): o app pede a autorização do Apple Music só nesse momento; cria uma playlist por item e avisa quantas foram enviadas e quantas faixas não foram achadas.
Entrega (histórico, antes do harness): 2025-12-12 (0be7441); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: P16, L7 (`views/playlists/PlaylistsExport.js:66-225`, `services/musickit/MusicKitAuth.js:54-176`); ROADMAP legado, Sprint 7 («Apple Music Integration»).

## en

**Send the playlists to Apple Music**

As someone who curates playlists from albums, I want to send the batch's playlists to Apple Music, in a folder named after the series, so that I listen to the blend in the player I already use.
Today (read from the code): the app asks for Apple Music authorization only at that moment; it creates one playlist per item and says how many were sent and how many tracks were not found.
Delivery (history, before the harness): 2025-12-12 (0be7441); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: P16, L7 (`views/playlists/PlaylistsExport.js:66-225`, `services/musickit/MusicKitAuth.js:54-176`); legacy ROADMAP, Sprint 7 (“Apple Music Integration”).
