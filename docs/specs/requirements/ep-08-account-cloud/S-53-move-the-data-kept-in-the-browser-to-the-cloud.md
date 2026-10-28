---
id: S-53
aliases: [S-53]
type: requirement
format: story
status: Backlog
epic: "[[prd#^EP-08]]"
---
# S-53 · Levar os dados guardados no navegador para a nuvem

## pt-BR

Como quem cura playlists a partir de álbuns, quero levar para a nuvem as séries, playlists e coleção que ficaram guardadas no meu navegador, por uma tela que eu encontre no app, para que eu não perca o que montei antes de ter conta.
Hoje (fato lido do código): a tela «Data Migration» funciona pelo endereço `/save-all`, mas nenhum botão do app leva a ela (o «Data Sync» do menu é definido e nunca desenhado), e a migração automática de convidado para conta provavelmente nunca dispara.
Origem: inventário do V1: V1, V2, L5 (`views/SaveAllView.js:11-183`, `components/TopNav.js:29-31,206-213`); achado do pacote B (item 7: a migração chama `saveSeries`, que não existe); ROADMAP legado, Sprint 7. Proposta pelo agente a partir do inventário; nada foi entregue.

## en

**Move the data kept in the browser to the cloud**

As someone who curates playlists from albums, I want to move to the cloud the series, playlists and collection that stayed in my browser, through a screen I can find in the app, so that I don't lose what I built before having an account.
Today (read from the code): the “Data Migration” screen works at the address `/save-all`, but no button in the app leads to it (the menu's “Data Sync” is defined and never drawn), and the automatic guest-to-account migration probably never fires.
Origin: the V1 inventory of the v0: V1, V2, L5 (`views/SaveAllView.js:11-183`, `components/TopNav.js:29-31,206-213`); package B finding (item 7: the migration calls `saveSeries`, which does not exist); legacy ROADMAP, Sprint 7. Proposed by the agent from the inventory; nothing was delivered.
