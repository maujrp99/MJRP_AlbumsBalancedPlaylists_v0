---
id: S-27
aliases: [S-27]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-05]]"
planned_for: "[[ROADMAP#^REL-05]]"
points_to: ["[[behavior#^album-rank-it-modal]]", "[[behavior#^album-rank-it-saved]]", "[[behavior#^library-search-and-filters]]"]
delivered_by: ["7aa9704"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-27 · Dar a minha própria ordem às faixas e misturar por ela

## pt-BR

Como quem cura playlists a partir de álbuns, quero ordenar as faixas de um álbum arrastando, guardar essa ordem e escolher a receita que mistura por ela, para que a playlist reflita o meu gosto, não só a crítica nem a popularidade.
Hoje (fato lido do código): a janela «Rank It» mostra a posição de cada faixa no BestEverAlbums e no Spotify como referência; guardada a ordem, o cartão ganha o selo «MY RANKING», a coluna «My Rank» e o filtro «My Ranking»; a receita «Top Tracks by My Own Ranking» usa essa ordem.
Entrega (histórico, antes do harness): 2026-01-11 (7aa9704); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: M3, K5, B4, P20, DD2 (`components/ranking/UserRankModal.js`, `ranking/UserRankingStrategy.js`); ROADMAP legado, Sprint 20 («User Ranking System», «Recipe Parity»).

## en

**Give the tracks my own order and blend by it**

As someone who curates playlists from albums, I want to order an album's tracks by dragging, save that order and choose the recipe that blends by it, so that the playlist reflects my taste, not just critics or popularity.
Today (read from the code): the “Rank It” window shows each track's position on BestEverAlbums and Spotify as a reference; once saved, the card gets the “MY RANKING” badge, the “My Rank” column and the “My Ranking” filter; the “Top Tracks by My Own Ranking” recipe uses that order.
Delivery (history, before the harness): 2026-01-11 (7aa9704); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: M3, K5, B4, P20, DD2 (`components/ranking/UserRankModal.js`, `ranking/UserRankingStrategy.js`); legacy ROADMAP, Sprint 20 (“User Ranking System”, “Recipe Parity”).
