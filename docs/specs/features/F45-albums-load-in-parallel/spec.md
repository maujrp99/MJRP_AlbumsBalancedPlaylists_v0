---
status: Done
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-172"]
---
# Feature F45: A tela de álbuns carrega vários álbuns ao mesmo tempo, com prazo, e as séries do topo primeiro
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** A tela de álbuns deixa de buscar um álbum de cada vez. Vários álbuns chegam ao mesmo tempo, cada um com um prazo, e as séries do topo da tela vêm primeiro. Buscar só as séries à vista, ao rolar, não foi feito aqui: a tela passou a buscar só as séries da página quando ganhou paginação, em outra feature.

**Por quê:** Hoje, com 20 séries, a tela leva minutos: um álbum a cada 5 ou 6 segundos, e quase tudo fica em bloco cinza enquanto isso.

**Como saber que funcionou:** Com os dados do navegador limpos, as séries à vista aparecem completas em poucos segundos, e o tempo até a última série à vista cai para uma fração dos 5 minutos medidos em 2026-11-19.

## Problem Statement
A pessoa abre a tela de álbuns e espera minutos olhando blocos cinza. Os álbuns entram numa fila única, um por vez, e cada um espera a busca das notas (5 segundos em média) antes de liberar o seguinte. Um álbum que não responde segura todos os outros para sempre.

## Requirements
- [REQ-01] A tela busca vários álbuns ao mesmo tempo, em vez de um por vez. · fixes UAT-172
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `test/utils/TaskQueue.test.js`, `reports/evidence/F45-albums-load-in-parallel/F45-probe-after-2026-11-19.json`
- [REQ-02] O álbum aparece assim que é achado. As notas, a popularidade e o ranking pessoal chegam depois, sem segurar a tela. · fixes UAT-172
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `test/services/albums/adapters.test.js`, `reports/evidence/F45-albums-load-in-parallel/F45-probe-after-2026-11-19.json`
- [REQ-03] Cada busca tem prazo. O álbum que não responde é dado como falho e não segura os outros. · fixes UAT-172
  verified_by:: `test/utils/TaskQueue.test.js`, `test/services/albums/AlbumLoadService.test.js`
- [REQ-04] As séries carregam na ordem em que aparecem na tela: as de cima primeiro. · fixes UAT-172
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `test/utils/TaskQueue.test.js`
- [REQ-05] Há um teto de buscas simultâneas por tipo de fonte: 3 no catálogo, 6 nas fontes rápidas (ranking pessoal e popularidade guardada) e 4 nas notas. As fontes rápidas não ocupam as vagas da busca no catálogo. · fixes UAT-172
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `reports/evidence/F47-series-list-without-cut/F47-probe-2026-11-19.json`
- [REQ-06] Quando a loja de música recusa por excesso de pedidos, a tela tenta de novo, com espera crescente. A falha da loja não aciona a segunda fonte, que é paga. · fixes UAT-172
  verified_by:: `test/services/albums/adapters.test.js`, `reports/evidence/F45-albums-load-in-parallel/F45-probe-after-2026-11-19.json`
- [REQ-07] O álbum carrega pela edição que a pessoa escolheu ao montar a série, numa chamada só. Se a loja não tem mais essa edição, a tela busca pelo nome na hora. · fixes UAT-172
  verified_by:: `test/services/albums/adapters.test.js`, `reports/evidence/F47-series-list-without-cut/F47-probe-2026-11-19.json`
- [REQ-08] Cada série mostra o estado em que está: carregando, completa ou com aviso. A série com álbum que falhou continua na tela, diz quantos álbuns não carregaram e oferece «Try again», que busca de novo só os que falharam.
  verified_by:: `test/models/albumLoadState.test.js`, `test/stores/albumLoad.test.js`, `test/services/albums/AlbumLoadService.test.js`, `reports/evidence/F45-albums-load-in-parallel/F45-desktop-failure-notice-2026-11-19.jpg`
- [REQ-09] Sair da tela e voltar mantém o que já carregou e não busca de novo. O resultado de uma carga antiga não é escrito por cima da atual. Série criada ou mudada entra na carga ao reabrir a tela.
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `reports/evidence/F45-albums-load-in-parallel/F45-probe-after-2026-11-19.json`
- [REQ-10] O que foi achado fica guardado no navegador, e a visita seguinte não busca de novo. Uma falha nunca é guardada. «A fonte não tem dado» vale por 1 hora. O ranking pessoal nunca é guardado junto do álbum.
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `test/services/albums/adapters.test.js`

## Observable States
N/A: a feature não importa nenhum requisito (conserto da issue UAT-172), então nenhum estado é apontado. O que a tela passou a mostrar, para registro:
- Série carregando: bloco cinza.
- Série completa: os álbuns da série.
- Série com falha: a série continua na tela com o aviso «N albums did not load. Try again»; quando todos os álbuns falharam, sobra o cabeçalho da série com o aviso.

O `behavior.md` ainda descreve a carga antiga (`^library-loading-skeleton`); a correção está nas tarefas abertas.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. O aviso de falha mudou a tela sem protótipo. Decidido pelo agente, sob a ordem do MJRP de consertar rápido e documentar depois (2026-11-19); revisável por ele.
- Transversal layer touched: componentes compartilhados (a grade de séries ganhou o aviso de falha). Nenhum token ou fonte nova: o aviso usa as classes de cor que o app já tinha.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- Com os dados do navegador apagados, 20 séries e 80 álbuns: os 80 álbuns estão na tela em 8,5 segundos. Antes: 1 álbum aos 8,5 segundos e 46 de 80 aos 4 minutos e 40 segundos. Medido em 2026-11-19: 33 álbuns aos 3 s, 50 aos 5 s, 80 aos 8,5 s.
- Nessa medição: nenhum erro no console, nenhuma recusa da loja por excesso de pedidos, nenhum álbum com falha.
- Sair para a Home e voltar: a tela mantém 20 blocos e 80 álbuns. Antes caía de 20 para 15 em 10 segundos.
- Com 45 séries e 217 álbuns (medição feita depois, com a lista de séries inteira): 57 álbuns aos 5 s, 118 aos 10 s, tudo resolvido aos 31 s; 213 achados e 4 com aviso de falha.
- Quando um álbum falha, a série mostra o aviso com a contagem e o «Try again». Visto na primeira tentativa de medição, em 5 séries.

## Out of Scope
- Buscar só as séries à vista, ao rolar a tela. Não foi construído, nem aqui nem na F46: a paginação (F51) faz a tela buscar só as séries da página, e o observador de visibilidade por série deixou de ser necessário.
- As notas rápidas. Elas chegam em segundo plano, ao longo de minutos: 17 de 80 aos 40 s com 2 buscas por vez; com 4 por vez, 31 notas em 60 s numa conta de 45 séries. O servidor leva de 5 a 7 segundos por busca e não guarda o que já buscou. Fica para a fatia do servidor.
- Distinguir «o álbum não tem nota» de «a busca da nota falhou». O servidor responde igual nos dois casos; a tela trata a resposta vazia como «sem nota», por 1 hora. Pede mudança no servidor.
- A tela de mistura e o modo de edição de playlist. Continuam no caminho antigo de carga.
- O «Refetch» de um álbum. Ainda corre fora da fila e o resultado é adotado depois (F48).
- O botão «Clear Cache», a nova tentativa do servidor e o guardado do ranking pessoal (F48).
- A segunda fonte de álbuns. Em produção ela responde 402 (pagamento exigido): o álbum que a loja não tem fica com o aviso de falha.

## Open Questions
- A carga parou de regravar cada álbum na nuvem a cada visita. Vale? — decidido pelo agente em 2026-11-19, porque nada no app lê essa gravação; ainda sem resposta do MJRP (decisão 1 da proposta de arquitetura).
- O aviso de falha com «Try again» estava previsto para a F46 e saiu aqui. A F46 ainda cobre as issues UAT-173 e UAT-174, que seguem abertas; quem fecha é o MJRP, ao julgar.
- O teto de 4 buscas de nota por vez é o definitivo? — em medição desde 2026-11-19 12:01; o agente decide medindo, o gargalo é o servidor.
- O título da feature dizia «só as séries à vista», que não foi construído. Corrigido em 2026-11-19 para «as séries do topo primeiro», que é o que a carga faz (a prioridade segue a ordem da tela); a carga é por página, pela F51.
