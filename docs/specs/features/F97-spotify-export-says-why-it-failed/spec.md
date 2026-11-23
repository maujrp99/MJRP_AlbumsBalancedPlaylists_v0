---
status: In Progress
lane: fast
solution_type: fix
imports: ["[[S-79-know-why-the-spotify-export-failed]]"]
fixes: ["UAT-302"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F97: A exportação para o Spotify diz por que falhou
**Approved**: not a gate (via rápida; o MJRP julga)

> **Via rápida.** O MJRP, 2026-11-23, sobre a issue UAT-302: «conserta pls». Conserto de um defeito com causa confirmada: a construção parte deste resumo; os documentos se completam no passo retroativo, antes de a feature fechar.

## Summary
**A feature:** Quando o Spotify recusa a conta de quem exporta, ou quando uma busca de faixa falha, a janela de exportação diz o que aconteceu de verdade e o que fazer. «Faixa não encontrada» passa a valer só quando o Spotify respondeu e não tinha a faixa.

**Por quê:** O parceiro do MJRP tentou exportar e a janela terminou em «No tracks found on Spotify». As faixas existem; o Spotify é que recusou a conta dele. A mensagem mentiu, e o MJRP teve de adivinhar um motivo para dar a ele.

**Como saber que funcionou:** Uma conta que o Spotify recusa vê «o Spotify não permitiu esta conta», com o próximo passo (pedir ao dono para incluir o e-mail da conta do Spotify; a exportação para o Apple Music está disponível), e nunca «faixas não encontradas». Uma falha de rede ou do servidor do Spotify aparece como «não foi possível conferir», separada das faixas não encontradas, com «Tentar de novo» quando nada pôde ser conferido.

## Problem Statement
Dito pelo MJRP em 2026-11-23: «o meu parceiro falou que tentou exportar e nao conseguiu, frustrante tive que dar um potencial motivo, será que consegue investigar?». O parceiro, às 16:50: «Eu não consegui exportar. Ele disse que não encontrou as faixas.» Sobre o conserto, o MJRP: «conserta pls».

Causa confirmada (2026-11-23): o app do The Album Blender no painel de desenvolvedor do Spotify está em «Development mode», com a lista de usuários vazia. Nesse modo o Spotify recusa, com HTTP 403, toda chamada da Web API de qualquer conta que não seja a do dono.

No código (conferido na `main` em 2026-11-23; só leitura):
- `public/js/services/SpotifyService.js` (`_fetch`): um 403 vira um `Error` comum, sem nome, igual a qualquer outra falha.
- `public/js/services/SpotifyExportService.js` (`stopsTheExport`, `_uriOf`): só `SpotifyReconnectError` e `SpotifyRateLimitError` param a exportação; toda outra falha de busca é engolida e devolvida como «sem faixa» (`null`), a mesma resposta de «o Spotify respondeu e não tem».
- `SpotifyExportService._deliverAll`: com nenhuma faixa casada, o relatório diz `No tracks found on Spotify`.

Com toda busca recusada, o relatório diz que nenhuma faixa foi encontrada. É uma mentira: nada foi conferido.

Tornar o app do Spotify público (o pedido de «Extended Quota Mode» ao Spotify) ou incluir contas na lista de usuários é assunto do dono, no painel do Spotify, e fica fora desta feature; aqui o app passa a dizer a verdade.

**Regras de texto, do MJRP (2026-11-23):** o produto se chama «The Album Blender», inteiro; em português diz-se «álbum» e «álbuns», nunca «disco».

**Prototype**: none — conserto de comportamento: a janela de exportação já tem os quadros de falha («reconectar», «limite de chamadas», «erro»); os estados novos usam os mesmos quadros e botões (decidido pelo agente, revisável: o MJRP julga a tela).

## Requirements
- [REQ-01] Um 403 do Spotify em qualquer chamada da exportação (busca, criar a playlist, incluir faixas) para a exportação e aparece como «o Spotify não permitiu esta conta», com o próximo passo: o app está numa fase de testes limitada; peça ao dono para incluir o e-mail da sua conta do Spotify; a exportação para o Apple Music está disponível. Nunca aparece como «faixas não encontradas» · fixes S-79
- [REQ-02] Qualquer outra falha de busca (rede, erro 5xx, tempo esgotado) é contada e mostrada como «não foi possível conferir», separada de «não encontrada»; uma faixa só conta como «não encontrada» quando o Spotify respondeu e não tinha nenhuma · fixes S-79
- [REQ-03] Quando nada pôde ser conferido, a janela diz isso e oferece «Tentar de novo» · fixes S-79
- [REQ-04] Os textos novos existem em inglês e em português nos dicionários (`public/js/i18n/en/exportWindow.js` e `public/js/i18n/pt/exportWindow.js`), na voz do produto · fixes S-79
- [REQ-05] O evento de uso `playlists_exported` distingue este desfecho (a conta recusada, e a exportação em que nada pôde ser conferido) dos outros · fixes S-79

## Observable States
A escrever no passo retroativo, do que for construído. Já sabidos: conta recusada pelo Spotify (403); todas as buscas falharam (nada conferido); parte das buscas falhou (playlist criada, com faixas «não conferidas» separadas das «não encontradas»); o Spotify respondeu e não tem nenhuma faixa («não encontradas», como hoje); português e inglês; 1280 px e 390 px.

## Success Criteria
A escrever no passo retroativo. O que a prova tem de mostrar: com a API do Spotify respondendo 403, a janela mostra a recusa e o próximo passo; respondendo 500, mostra «não foi possível conferir» e «Tentar de novo»; respondendo listas vazias de verdade, mostra «não encontradas».

## Out of Scope
Mudar o app do Spotify de «Development mode» para público, ou incluir contas na lista de usuários (é do dono, no painel do Spotify); a exportação para o Apple Music (o mesmo padrão de falha engolida é só conferido e relatado nesta feature, não consertado); o carregamento de álbuns e o enriquecimento pelo Spotify (outras chamadas que podem receber 403); a conexão com o Spotify (login).

## Open Questions
Nenhuma aberta com o MJRP.

**A conferir na construção (não é pergunta para ele):**
- **O texto do próximo passo.** A redação em português e em inglês nasce nos dicionários e passa pela aprovação dele no Painel, como os outros textos do app.
- **O Apple Music faz o mesmo?** A construção confere o caminho do Apple Music pelo mesmo padrão e relata; se fizer, vira issue própria.
