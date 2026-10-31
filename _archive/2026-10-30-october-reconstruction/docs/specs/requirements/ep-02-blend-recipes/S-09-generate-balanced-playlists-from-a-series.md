---
id: S-09
aliases: [S-09]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-02]]"
planned_for: "[[ROADMAP#^REL-01]]"
points_to: ["[[behavior#^playlists-generating]]", "[[behavior#^playlists-no-albums]]", "[[behavior#^playlists-no-ratings-confirm]]", "[[behavior#^playlists-generate-no-albums]]", "[[behavior#^playlists-generated-names]]"]
delivered_by: ["c8be9fa"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-09 · Gerar playlists equilibradas a partir de uma série

## pt-BR

Como quem cura playlists a partir de álbuns, quero gerar, a partir de uma série, playlists que equilibram as faixas de todos os álbuns, para que eu ouça uma mistura coerente, em vez de álbum por álbum.
Hoje (fato lido do código): o app gera «Greatest Hits», «Deep Cuts» e «Orphan Tracks»; sem nota nenhuma nos álbuns, pergunta se quero continuar mesmo assim; sem álbuns carregados, pede para carregá-los.
Entrega (histórico, antes do harness): 2025-11-27 (c8be9fa); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: P2, P3, P20, K1 (`controllers/PlaylistsController.js:228-268`, `ranking/BalancedRankingStrategy.js:100-185`); ROADMAP legado, Sprint 4 («Core playlist generation»).

## en

**Generate balanced playlists from a series**

As someone who curates playlists from albums, I want to generate, from a series, playlists that balance the tracks of all the albums, so that I listen to a coherent blend instead of album by album.
Today (read from the code): the app generates “Greatest Hits”, “Deep Cuts” and “Orphan Tracks”; with no ratings on any album, it asks whether I want to continue anyway; with no albums loaded, it asks me to load them.
Delivery (history, before the harness): 2025-11-27 (c8be9fa); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: P2, P3, P20, K1 (`controllers/PlaylistsController.js:228-268`, `ranking/BalancedRankingStrategy.js:100-185`); legacy ROADMAP, Sprint 4 (“Core playlist generation”).
