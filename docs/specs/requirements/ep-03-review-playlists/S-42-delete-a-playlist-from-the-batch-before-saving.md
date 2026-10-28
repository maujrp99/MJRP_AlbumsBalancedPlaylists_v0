---
id: S-42
aliases: [S-42]
type: requirement
format: story
status: Backlog
epic: "[[prd#^EP-03]]"
---
# S-42 · Excluir uma playlist do lote antes de guardar

## pt-BR

Como quem cura playlists a partir de álbuns, quero excluir uma playlist do lote gerado, antes de guardá-lo, para que só fique no lote o que eu quero guardar.
Hoje (fato lido do código; não funciona): o código escuta o pedido de excluir, mas nenhum botão do cartão da playlist o envia, então a pessoa não consegue fazê-lo.
Origem: inventário do V1: P11 (`views/PlaylistsView.js:75-81`, `components/playlists/PlaylistGrid.js:119-163`). Proposta pelo agente a partir do inventário; nada foi entregue.

## en

**Delete a playlist from the batch before saving**

As someone who curates playlists from albums, I want to delete a playlist from the generated batch before saving it, so that only what I want to keep stays in the batch.
Today (read from the code; it does not work): the code listens for the delete request, but no button on the playlist card sends it, so the person cannot do it.
Origin: the V1 inventory of the v0: P11 (`views/PlaylistsView.js:75-81`, `components/playlists/PlaylistGrid.js:119-163`). Proposed by the agent from the inventory; nothing was delivered.
