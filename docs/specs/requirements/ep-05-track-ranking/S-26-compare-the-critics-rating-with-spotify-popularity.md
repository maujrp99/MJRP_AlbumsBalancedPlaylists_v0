---
id: S-26
aliases: [S-26]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-05]]"
planned_for: "[[ROADMAP#^REL-03]]"
points_to: ["[[behavior#^album-detail-modal]]", "[[behavior#^album-enrich-spotify]]", "[[behavior#^spotify-background-enrichment]]"]
delivered_by: ["b9530f1"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-26 · Comparar a nota da crítica com a popularidade no Spotify

## pt-BR

Como quem cura playlists a partir de álbuns, quero ver lado a lado, para cada faixa, a nota da crítica e a popularidade no Spotify, para que eu escolha a mistura sabendo onde as duas fontes discordam.
Hoje (fato lido do código): com o Spotify conectado, o app busca a popularidade em segundo plano; o botão «Enrich Data» faz o mesmo para um álbum; sem conexão, o app diz «Connect to Spotify first…».
Entrega (histórico, antes do harness): 2025-12-19 (b9530f1); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: M1, M2, K3, L8 (`components/ranking/TracksRankingComparison.js:117-260`, `services/SpotifyEnrichmentService.js`); ROADMAP legado, Sprint 11 («Multi-Source Ranking UI»).

## en

**Compare the critics' rating with Spotify popularity**

As someone who curates playlists from albums, I want to see side by side, for each track, the critics' rating and the Spotify popularity, so that I choose the blend knowing where the two sources disagree.
Today (read from the code): with Spotify connected, the app fetches popularity in the background; the “Enrich Data” button does the same for one album; without a connection, the app says “Connect to Spotify first…”.
Delivery (history, before the harness): 2025-12-19 (b9530f1); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: M1, M2, K3, L8 (`components/ranking/TracksRankingComparison.js:117-260`, `services/SpotifyEnrichmentService.js`); legacy ROADMAP, Sprint 11 (“Multi-Source Ranking UI”).
