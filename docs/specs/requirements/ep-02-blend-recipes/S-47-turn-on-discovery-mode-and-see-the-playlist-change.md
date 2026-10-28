---
id: S-47
aliases: [S-47]
type: requirement
format: story
status: Backlog
epic: "[[prd#^EP-02]]"
---
# S-47 · Ligar o modo descoberta e ver a playlist mudar

## pt-BR

Como quem cura playlists a partir de álbuns, quero ligar o modo descoberta no menu de mistura e ver a playlist sair diferente, para que a opção que o menu oferece tenha efeito.
Hoje (fato lido do código; não funciona): o interruptor existe, é enviado à geração, mas nenhuma receita o lê; ligar ou desligar não muda nada. O que o modo deve fazer a documentação não diz (pergunta ao MJRP no relatório do pacote C1).
Origem: inventário do V1: B5, B6, B9 (`services/PlaylistGenerationService.js:68-76`, `components/blend/BlendIngredientsPanel.js:73-81`). Proposta pelo agente a partir do inventário; nada foi entregue.

## en

**Turn on discovery mode and see the playlist change**

As someone who curates playlists from albums, I want to turn on discovery mode in the blending menu and see the playlist come out different, so that the option the menu offers has an effect.
Today (read from the code; it does not work): the switch exists and is sent to the generator, but no recipe reads it; turning it on or off changes nothing. What the mode should do is not in the documentation (question to the MJRP in the package C1 report).
Origin: the V1 inventory of the v0: B5, B6, B9 (`services/PlaylistGenerationService.js:68-76`, `components/blend/BlendIngredientsPanel.js:73-81`). Proposed by the agent from the inventory; nothing was delivered.
