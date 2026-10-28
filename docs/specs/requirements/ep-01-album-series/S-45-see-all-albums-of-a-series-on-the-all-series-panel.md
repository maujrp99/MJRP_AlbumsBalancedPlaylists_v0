---
id: S-45
aliases: [S-45]
type: requirement
format: story
status: Backlog
epic: "[[prd#^EP-01]]"
---
# S-45 · Ver todos os álbuns de uma série no painel de todas as séries

## pt-BR

Como quem cura playlists a partir de álbuns, quero pedir mais álbuns de uma série no painel de todas as séries e ver os que passam do limite, para que eu veja a série inteira sem abrir uma por uma.
Hoje (fato lido do código): o painel mostra no máximo 12 álbuns por série e o botão «Load N more albums» não faz nada; os demais só aparecem ao abrir a série sozinha.
Origem: inventário do V1: A9 (`views/helpers/SeriesGridRenderer.js:149,161-175`, `controllers/SeriesEventHandler.js:152-159`); ROADMAP legado, Sprint 22 (LoadMoreButton, entrada de 18/jan). Proposta pelo agente a partir do inventário; nada foi entregue.

## en

**See all albums of a series on the all-series panel**

As someone who curates playlists from albums, I want to ask for more albums of a series on the all-series panel and see the ones beyond the limit, so that I see the whole series without opening them one by one.
Today (read from the code): the panel shows at most 12 albums per series and the “Load N more albums” button does nothing; the rest only show when opening the series alone.
Origin: the V1 inventory of the v0: A9 (`views/helpers/SeriesGridRenderer.js:149,161-175`, `controllers/SeriesEventHandler.js:152-159`); legacy ROADMAP, Sprint 22 (LoadMoreButton, entry of Jan 18). Proposed by the agent from the inventory; nothing was delivered.
