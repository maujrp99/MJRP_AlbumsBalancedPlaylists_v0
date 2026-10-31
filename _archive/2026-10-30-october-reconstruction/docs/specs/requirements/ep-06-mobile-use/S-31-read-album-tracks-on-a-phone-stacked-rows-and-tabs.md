---
id: S-31
aliases: [S-31]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-06]]"
planned_for: "[[ROADMAP#^REL-05]]"
points_to: ["[[behavior#^album-track-table]]", "[[behavior#^album-detail-modal]]"]
delivered_by: ["b9530f1", "29b3f5e"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-31 · Ler as faixas de um álbum no celular, em linhas empilhadas e abas por fonte

## pt-BR

Como quem escuta música no celular, quero ler as faixas de um álbum em linhas empilhadas e trocar entre as abas Original, BestEverAlbums e Spotify, para que a comparação das notas caiba na tela do celular.
Hoje (fato lido do código): no celular a tabela de faixas empilha as linhas, e a janela de detalhes troca a tabela larga pelas três abas.
Entrega (histórico, antes do harness): 2025-12-19 (b9530f1), 2026-01-14 (29b3f5e); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A17, M1, KB2 (`components/ranking/TracksTable.js:230-290`, `components/ranking/TracksTabs.js`); ROADMAP legado, Sprint 21 («touch-friendly tables»).

## en

**Read album tracks on a phone: stacked rows and tabs**

As someone who listens on a phone, I want to read an album's tracks in stacked rows and switch between the Original, BestEverAlbums and Spotify tabs, so that the rating comparison fits on the phone screen.
Today (read from the code): on a phone the track table stacks its rows, and the details window swaps the wide table for the three tabs.
Delivery (history, before the harness): 2025-12-19 (b9530f1), 2026-01-14 (29b3f5e); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A17, M1, KB2 (`components/ranking/TracksTable.js:230-290`, `components/ranking/TracksTabs.js`); legacy ROADMAP, Sprint 21 (“touch-friendly tables”).
