---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-72-export-a-playlist-from-the-saved-playlists-screen]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F90: Exportar uma playlist a partir da tela das séries de playlists
**Approved**: pendente. O MJRP pediu em 2026-11-21 («poder exportar a playlist a partir da tela da playlist series sem ter que entrar em edit batch»); o desenho reaproveita o export da tela de edição e os botões e folhas da tela guardada, sem protótipo julgado antes (decidido pelo agente, revisável: o MJRP julga no iPhone).

## Summary
**A feature:** Cada playlist de um lote aberto, e o lote, ganham «Export» na tela das séries de playlists; abre a mesma janela de export da tela de edição, com Apple Music, Spotify e o arquivo JSON, nessa ordem.

**Por quê:** Hoje exportar exige abrir «Edit Batch», uma tela feita para mudar playlists. O MJRP quer só exportar, e o mais comum é uma playlist, não o lote. Ele usa o Apple Music.

**Como saber que funcionou:** No iPhone, o MJRP abre uma série, um lote, toca no export de uma playlist, escolhe Apple Music e a playlist aparece na pasta da série, sem ter aberto a edição; o mesmo no lote, que cria todas; nada no lote guardado mudou.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «Uma coisa que senti falta na playlist agora. Foi poder exportar a playlist a partir da tela da playlist series sem ter que entrar em edit batch.»; à proposta de um «Export» no lote e de um export em cada playlist: «1 os dois , mas principalmente um playlist específica». «eu pessoalmente, uso Apple Music e não Spotify». Issue: UAT-276.

## Requirements
«Celular» aqui é a tela de até 899 px de largura.

- [REQ-01] Na tela `/saved-playlists`, com um lote aberto, cada playlist tem uma ação «Export» na sua linha (nome acessível «Export <nome da playlist>») que exporta só aquela playlist; no celular o alvo tem pelo menos 44 px. · fixes S-72
- [REQ-02] O lote tem uma ação «Export» ao lado de «Edit» (no celular, na folha «⋯» do lote, ao lado de «Edit batch») que exporta todas as playlists do lote. · fixes S-72
- [REQ-03] As duas abrem a mesma janela de export que a tela de edição usa, uma só peça de código para as duas telas, com os destinos nesta ordem: Apple Music, Spotify, o arquivo JSON. · fixes S-72
- [REQ-04] No Apple Music, a regra da pasta continua: a pasta da série é criada ou reaproveitada e só a playlist pedida é criada nela, com o nome que ela teria no export do lote inteiro («<posição>. <lote> - <título>»), de modo que exportar uma e depois o lote não duplica. · fixes S-72
- [REQ-05] Os estados do export valem como na tela de edição: sem conexão com o serviço, o mesmo pedido de conexão; exportando; pronto; falha com os mesmos avisos; faixas que o serviço não achou. Exportar não grava nem muda nada no lote. · fixes S-72
- [REQ-06] Só o que já existe é usado: botões, ícones, classes e tokens do `design-system.md`; os textos são em inglês; o teclado e o retorno do foco como nas outras ações da linha. · fixes S-72
- [REQ-07] A tela de edição do lote continua exportando como antes, agora pela mesma peça. · fixes S-72
- [REQ-08] Só no Apple Music, antes de exportar há um passo «Folder in Apple Music», na mesma peça (vale na tela de edição e nas duas entradas da tela guardada): o nome da série vem escolhido e marcado como o padrão (aceitar é um toque em «Export»); lista as pastas de playlists que a biblioteca já tem para escolher; um campo «New folder» para digitar um nome (igual a uma pasta existente, sem contar maiúsculas, reaproveita a pasta, como o export já faz); e «No folder» (a playlist vai para o topo da biblioteca: o `createPlaylistInFolder` sem pasta já faz isso). Estados: lendo as pastas, nenhuma existe, a lista não carregou (diz em palavras comuns que ainda dá para exportar para a pasta da série ou para um nome digitado), nome vazio ou só espaços recusado com aviso. A última escolha fica guardada no navegador por série e vem escolhida da próxima vez. Spotify e o JSON não mudam. Pedido do MJRP em 2026-11-21: à pergunta «Pasta na Apple Music: basta a de hoje (o nome da série), ou quer escolher ao exportar?»: «Quero escolher ao exportar». · fixes S-72

## Observable States
A escrever.

## Success Criteria
- **REQ-01** · testes: o clique no export de uma playlist abre a janela com só aquela playlist; a 393 px o botão tem 44 px.
- **REQ-02** · testes: o export do lote abre a janela com todas as playlists do lote.
- **REQ-03** · os destinos aparecem na ordem Apple Music, Spotify, JSON; a tela de edição e a guardada importam o mesmo módulo.
- **REQ-04** · teste: com um serviço de Apple Music de mentira, uma playlist cria uma só playlist na pasta da série, com o nome do export do lote.
- **REQ-05** · testes por destino e por estado, com os serviços de mentira; nenhuma chamada real ao Apple Music ou ao Spotify.
- **REQ-06** · `test/architecture` passa; a prova no navegador está em `reports/evidence/F90/`.
- **REQ-07** · os testes do export da tela de edição continuam passando.
- **REQ-08** · testes com o MusicKit de mentira: cada estado do passo, a escolha lembrada (chave `mjrp_apple_music_folder:<nome da série>`, valor `{"name":…}` ou `{"none":true}`) e a pasta que chega ao `createPlaylistInFolder`; capturas do passo a 1280 e no celular.
- Um export real para o Apple Music não foi feito pelo agente (precisa da conta e da chave do MusicKit do MJRP); a lista de pastas (`/v1/me/library/playlist-folders`, com `limit=100`) e a criação numa pasta escolhida também só se provam com a conta do MJRP.

## Out of Scope
Mudar o que o export cria; exportar uma faixa; escolher a pasta do Apple Music; a tela de playlists em React (linha de migração: tarefa aberta no plano).

## Open Questions
- No Spotify, uma playlist só vira uma playlist do Spotify; o nome padrão é «<série> - <título>». Se o MJRP preferir outro, é uma linha.
- Os textos novos («Export», «Export <nome>», o título da janela, «Folder in Apple Music», «New folder», «No folder», «(default)», os avisos do passo) estão pendentes da aprovação do MJRP.
