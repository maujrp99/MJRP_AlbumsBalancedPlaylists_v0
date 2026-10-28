---
id: S-46
aliases: [S-46]
type: requirement
format: story
status: Backlog
epic: "[[prd#^EP-02]]"
---
# S-46 · Abrir o menu de mistura já com a série escolhida

## pt-BR

Como quem cura playlists a partir de álbuns, quero tocar em «Blend your Albums» numa série e chegar ao menu de mistura com essa série já escolhida, para que eu não escolha duas vezes a série que acabei de abrir.
Hoje (fato lido do código): o botão leva a `/blend?seriesId=…`, mas o menu ignora o parâmetro e pede a série de novo.
Origem: inventário do V1: A2, B3 (`components/series/SeriesHeader.js:22-65`, `views/BlendingMenuView.js:44`); entrada de 17/jan de 2026 do histórico do git (botão «Blend» com `?seriesId=`). Proposta pelo agente a partir do inventário; nada foi entregue.

## en

**Open the blending menu with the series chosen**

As someone who curates playlists from albums, I want to tap “Blend your Albums” on a series and land on the blending menu with that series already chosen, so that I don't pick twice the series I just opened.
Today (read from the code): the button goes to `/blend?seriesId=…`, but the menu ignores the parameter and asks for the series again.
Origin: the V1 inventory of the v0: A2, B3 (`components/series/SeriesHeader.js:22-65`, `views/BlendingMenuView.js:44`); git history entry of 2026-01-17 (“Blend” button with `?seriesId=`). Proposed by the agent from the inventory; nothing was delivered.
