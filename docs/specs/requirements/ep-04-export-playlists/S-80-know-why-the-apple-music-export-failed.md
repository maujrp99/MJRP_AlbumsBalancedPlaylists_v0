---
id: S-80
aliases: [S-80]
type: requirement
format: story
status: In progress
epic: "[[prd#^EP-04]]"
planned_for: "[[ROADMAP#^REL-41]]"
---
# S-80 · Quando o Apple Music recusa a minha conta ou uma busca de faixa falha, quero que a exportação me diga o motivo verdadeiro e o que fazer, para que eu não pense que as minhas músicas não existem no Apple Music.

## pt-BR

Origem: a issue UAT-307, achada ao consertar a UAT-302 (F97): na exportação para o Apple Music, a busca de uma faixa no catálogo engole qualquer erro e devolve «nada», a mesma resposta de «o catálogo não tem»; com todas as buscas falhando, a exportação diz que nenhuma faixa foi encontrada. É o mesmo engano que a exportação para o Spotify tinha ([[S-79-know-why-the-spotify-export-failed]]). O MJRP, em 2026-11-23, sobre consertar o Apple Music: «2.sim». Ele exporta para o Apple Music: é o caminho de primeira classe ([[S-72-export-a-playlist-from-the-saved-playlists-screen]]).
Junto, a issue UAT-308: com o app em português, as frases que a exportação e o aviso de «carregamento em pausa» escrevem por conta própria ainda saem em inglês. Toda frase na tela vem do dicionário do idioma.
A F98 registra o conserto.

## en

**When Apple Music refuses my account or a track search fails, I want the export to tell me the real reason and what to do, so that I do not think my songs are missing from Apple Music.**

Origin: issue UAT-307, found while fixing UAT-302 (F97): the Apple Music catalogue search swallowed every error and answered «nothing», the same answer as «the catalogue has none», so an export whose searches all failed said no track was found. The MJRP, 2026-11-23, on fixing it: «2.sim». With it, issue UAT-308: with the app in Portuguese, the sentences the export and the «loading is paused» notice write by themselves were still in English. F98 registers the fix.
