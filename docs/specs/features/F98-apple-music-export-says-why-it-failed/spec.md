---
status: In Progress
lane: fast
solution_type: fix
imports: ["[[S-80-know-why-the-apple-music-export-failed]]"]
fixes: ["UAT-307", "UAT-308"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F98: A exportação para o Apple Music diz por que falhou
**Approved**: not a gate (via rápida; o MJRP julga)

> **Via rápida.** O MJRP, 2026-11-23, sobre consertar a exportação para o Apple Music (issue UAT-307): «2.sim». Conserto de um defeito com causa confirmada: a construção parte deste resumo; os documentos se completam no passo retroativo, antes de a feature fechar.

## Summary
**A feature:** Quando o Apple Music recusa a conta de quem exporta, ou quando uma busca de faixa falha, a exportação diz o que aconteceu de verdade e o que fazer. «Faixa não encontrada» passa a valer só quando o Apple Music respondeu e não tinha a faixa. O fim da exportação aparece na própria janela de exportar, com «Tentar de novo». E toda frase da exportação e do aviso de «carregamento em pausa» sai no idioma do app.

**Por quê:** O MJRP exporta para o Apple Music: é o caminho de primeira classe. Hoje, uma queda de rede durante a busca faz a exportação dizer que as faixas não existem no Apple Music. É a mesma mentira que a exportação para o Spotify contava (UAT-302, F97). E, com o app em português desde 2026-11-23, parte das frases ainda sai em inglês.

**Como saber que funcionou:** Com a busca do Apple Music falhando, a janela diz «não foi possível conferir», separado de «não encontrada», e oferece «Tentar de novo». Com o Apple Music recusando a conta, a janela diz isso e o próximo passo, e nunca «faixas não encontradas». Uma exportação que deixou faixas de fora não tem título de sucesso. Com o app em português, nenhuma frase da exportação sai em inglês.

## Problem Statement
A issue UAT-307 (aberta em 2026-11-23 19:40 pelo construtor da F97): «Na exportação para o Apple Music, a busca de uma faixa no catálogo engole qualquer erro e devolve "nada" (`MusicKitCatalog.findTrackFromAlbum`), a mesma resposta de "o catálogo não tem"; com todas as buscas falhando, a janela diz que nenhuma faixa foi encontrada.» O MJRP, 2026-11-23, sobre consertar: «2.sim».

A issue UAT-308 (aberta em 2026-11-23 19:40 pelos juízes da F97 e da F81): com o app em português, ficam em inglês as frases que o serviço de exportação escreve por conta própria («No tracks found on Spotify», reconectar, limite de chamadas) e os avisos de «carregamento em pausa» (`holdNotice`).

No código (conferido na `main` em 2026-11-23; só leitura):
- `public/js/services/musickit/MusicKitCatalog.js` (`findTrackFromAlbum`, `findTrack`): toda falha da busca é escrita no console e devolvida como `null`.
- `public/js/services/AppleMusicExportService.js` (`_catalogIdsOf`): `null` vai para `notFound`; uma playlist sem nenhuma faixa vai para `empty` («No track was found in Apple Music»).
- `public/js/services/musickit/MusicKitLibrary.js` (`createOrGetFolder`): toda falha vira «a pasta não pôde ser criada», também a recusa da conta.
- O fim da exportação para o Apple Music aparece só em avisos que somem (`appleExportMessages`, 12 segundos), escritos em inglês dentro do serviço; não há «Tentar de novo».
- `public/js/services/SpotifyExportService.js` e `public/js/models/albumLoadState.js` (`holdNotice`) escrevem frases em inglês.
- A janela do Spotify dá o título «Export Complete!» a uma exportação que deixou faixas sem conferir (P2 do juiz da F97).

**Regras de texto, do MJRP:** o produto se chama «The Album Blender», inteiro, sem artigo antes em português; em português diz-se «álbum» e «álbuns», nunca «disco».

**Prototype**: none — conserto de comportamento: o relatório do Apple Music usa os mesmos quadros, listas e botões que a janela do Spotify já tem (decidido pelo agente, revisável: o MJRP julga a tela).

## Requirements
- [REQ-01] A busca de uma faixa no catálogo do Apple Music tem três respostas: achou, o catálogo não tem, não foi possível conferir. Uma faixa só conta como «não encontrada» quando o Apple Music respondeu e não tinha nenhuma; a busca que falhou (rede, erro 5xx, tempo esgotado) é contada e mostrada à parte, como «não foi possível conferir» · fixes S-80
- [REQ-02] Quando o Apple Music recusa a pessoa (sem assinatura, autorização revogada, 401 ou 403 da API) em qualquer chamada da exportação (autorizar, ler ou criar a pasta, buscar, criar a playlist), a exportação para e a janela diz isso com o próximo passo. Nunca aparece como «faixas não encontradas» · fixes S-80
- [REQ-03] Quando nada pôde ser conferido, a janela diz isso e oferece «Tentar de novo» · fixes S-80
- [REQ-04] O fim da exportação para o Apple Music aparece na janela de exportar: o que foi criado, o que não foi, as faixas que faltaram e por quê. Um resultado parcial (faixas sem conferir) não tem título de sucesso: diz o que ficou de fora e oferece tentar de novo. Vale igual para a janela do Spotify · fixes S-80
- [REQ-05] O evento de uso `playlists_exported` leva, para o Apple Music, os mesmos valores de `reason` do Spotify (a conta recusada; nada pôde ser conferido) · fixes S-80
- [REQ-06] Toda frase que os serviços de exportação (Spotify e Apple Music) e o aviso de «carregamento em pausa» escrevem vem dos dicionários, em inglês e em português: o serviço e o modelo devolvem um código e os dados, e quem mostra traduz. Um teste de guarda falha quando um deles devolve uma frase pronta · fixes S-80
- [REQ-07] O texto da recusa do Spotify é verdadeiro para qualquer 403 e mantém o passo «peça para incluir o seu e-mail»; em inglês, «the list has only a few places» · fixes S-80
- [REQ-08] Nas duas janelas, o resultado da exportação é anunciado a leitores de tela (`role="status"`) e o foco vai para o título do resultado quando ele aparece · fixes S-80

## Observable States
A escrever no passo retroativo, do que for construído. Já sabidos: exportação completa; todas as buscas falharam (nada conferido); parte das buscas falhou (playlist criada, com faixas «não conferidas» separadas das «não encontradas», sem título de sucesso); a conta recusada pelo Apple Music; a autorização não dada; o catálogo respondeu e não tem nenhuma faixa («não encontradas»); português e inglês; 1280 px e 390 px.

## Success Criteria
A escrever no passo retroativo. O que a prova tem de mostrar, com o MusicKit simulado: busca respondendo 500 em tudo, a janela mostra «não foi possível conferir» e «Tentar de novo»; um misto, as duas listas separadas e nenhum título de sucesso; a autorização recusada e o 403, a recusa com o próximo passo; listas vazias de verdade, «não encontradas».

## Out of Scope
A conta de desenvolvedor da Apple e a chave do MusicKit (são do dono); a exportação que atualiza uma playlist já criada (a decisão dele: cria nova); o carregamento de álbuns pelo Apple Music (outras chamadas do catálogo); as frases que outros serviços escrevem fora da exportação e do aviso de pausa; tornar o app do Spotify público.

## Open Questions
Nenhuma aberta com o MJRP.

**A conferir na construção (não é pergunta para ele):**
- **Os textos.** A redação em português e em inglês nasce nos dicionários e passa pela aprovação dele no Painel, como os outros textos do app.
- **O 403 do Spotify.** Se o corpo da resposta permite separar com segurança a recusa do modo de desenvolvimento dos outros 403; se não, o texto fica verdadeiro para qualquer 403.
