---
id: S-10
aliases: [S-10]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-02]]"
planned_for: "[[ROADMAP#^REL-03]]"
points_to: ["[[behavior#^playlists-generation-settings]]", "[[behavior#^blend-recipe-choice]]"]
delivered_by: ["e038315"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-10 · Escolher entre mais de uma receita para montar a playlist

## pt-BR

Como quem cura playlists a partir de álbuns, quero escolher a receita da mistura entre as que o app oferece e a fonte da nota que ela usa, para que a playlist saia do jeito que eu quero ouvir.
Hoje (fato lido do código): hoje são quatro receitas (a recomendada «[MJRP] Zé's Balanced Playlists», mais três de «Top N» por popularidade no Spotify, por crítica ou pela minha ordem); a palavra «receita» substituiu «flavor» em 2026-01-11.
Entrega (histórico, antes do harness): 2025-12-16 (e038315); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: B4, P2 e seção 3.1 (`algorithms/index.js:24-30`); ROADMAP legado, Sprint 8 («Algorithm Selector UI») e Sprint 17.9 (ADR-0015, «Flavor» vira «Recipe»).

## en

**Choose among several recipes to build the playlist**

As someone who curates playlists from albums, I want to choose the blend recipe among the ones the app offers, and the rating source it uses, so that the playlist comes out the way I want to hear it.
Today (read from the code): today there are four recipes (the recommended “[MJRP] Zé's Balanced Playlists”, plus three “Top N” ones by Spotify popularity, by critics or by my own order); the word “recipe” replaced “flavor” on 2026-01-11.
Delivery (history, before the harness): 2025-12-16 (e038315); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: B4, P2 and section 3.1 (`algorithms/index.js:24-30`); legacy ROADMAP, Sprint 8 (“Algorithm Selector UI”) and Sprint 17.9 (ADR-0015, “Flavor” becomes “Recipe”).
