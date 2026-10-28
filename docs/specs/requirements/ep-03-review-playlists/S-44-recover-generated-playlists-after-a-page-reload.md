---
id: S-44
aliases: [S-44]
type: requirement
format: story
status: Backlog
epic: "[[prd#^EP-03]]"
---
# S-44 · Recuperar as playlists geradas depois de recarregar a página

## pt-BR

Como quem cura playlists a partir de álbuns, quero recarregar a página e ainda ver as playlists que gerei e não guardei, para que um clique errado não jogue fora a mistura.
Hoje (fato lido do código; não funciona): o conjunto é gravado no navegador (chave `mjrp_current_playlists`), mas nunca é lido de volta; recarregar perde o que não foi guardado.
Origem: inventário do V1: P18 (`services/PlaylistsService.js:84,198-235`). Proposta pelo agente a partir do inventário; nada foi entregue.

## en

**Recover generated playlists after a page reload**

As someone who curates playlists from albums, I want to reload the page and still see the playlists I generated and did not save, so that a wrong click does not throw the blend away.
Today (read from the code; it does not work): the set is written to the browser (key `mjrp_current_playlists`) but never read back; reloading loses what was not saved.
Origin: the V1 inventory of the v0: P18 (`services/PlaylistsService.js:84,198-235`). Proposed by the agent from the inventory; nothing was delivered.
