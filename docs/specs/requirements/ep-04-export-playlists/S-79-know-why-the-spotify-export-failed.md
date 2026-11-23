---
id: S-79
aliases: [S-79]
type: requirement
format: story
status: In progress
epic: "[[prd#^EP-04]]"
planned_for: "[[ROADMAP#^REL-41]]"
---
# S-79 · Quando o Spotify recusa a minha conta ou uma busca de faixa falha, quero que a exportação me diga o motivo verdadeiro e o que fazer, para que eu não pense que as minhas músicas não existem no Spotify.

## pt-BR

Origem: o MJRP, em 2026-11-23: «o meu parceiro falou que tentou exportar e nao conseguiu, frustrante tive que dar um potencial motivo, será que consegue investigar?». O parceiro, às 16:50: «Eu não consegui exportar. Ele disse que não encontrou as faixas.» É a issue UAT-302.
Causa confirmada: o app do The Album Blender no Spotify está em «Development mode», com a lista de usuários vazia; nesse modo o Spotify recusa (HTTP 403) toda chamada da Web API de qualquer conta que não seja a do dono. A exportação conta toda busca recusada como «faixa não encontrada» e, com todas recusadas, termina em «No tracks found on Spotify». O MJRP, sobre o conserto: «conserta pls».
A F97 registra o conserto. A exportação para o Apple Music é o caminho de primeira classe ([[S-72-export-a-playlist-from-the-saved-playlists-screen]]) e continua disponível para quem o Spotify recusa.

## en

**When Spotify refuses my account or a track search fails, I want the export to tell me the real reason and what to do, so that I do not think my songs are missing from Spotify.**

Origin: the MJRP's words of 2026-11-23 (above), issue UAT-302. Confirmed cause: The Album Blender's Spotify app is in «Development mode» with an empty user list, so Spotify refuses (HTTP 403) every Web API call of any account but the owner's; the export counted every refused search as «track not found» and ended in «No tracks found on Spotify». F97 registers the fix.
