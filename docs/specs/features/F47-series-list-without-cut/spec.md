---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-24"]
planned_for: "[[ROADMAP#^REL-39]]"
---
# Feature F47: A lista de séries mostra todas as séries, sem o corte em 20
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** A lista de séries passa a trazer todas as séries da pessoa, não só as 20 mais recentes.

**Por quê:** O corte em 20 nunca foi decidido (o MJRP, 2026-11-19: «nunca determinei que me lembre limite de series, logo, acidente»), e quem passa de 20 perde séries de vista sem aviso.

**Como saber que funcionou:** Uma conta com 21 séries ou mais vê todas na tela de álbuns e no seletor de séries.

## Problem Statement
Quem tem mais de 20 séries só vê as 20 atualizadas mais recentemente; a 21ª em diante some de todas as listas, sem aviso. Parece perda de dados.

## Requirements
- [REQ-01] A lista de séries traz todas as séries da conta, sem limite de quantidade. · fixes UAT-24
  verified_by:: `test/services/SeriesService.test.js`, `reports/evidence/F47-series-list-without-cut/F47-probe-2026-11-19.json`
- [REQ-02] Uma série sem data de atualização também aparece na lista, por último. · fixes UAT-24
  verified_by:: `test/services/SeriesService.test.js`
- [REQ-03] A ordem da lista continua a mesma: a série atualizada mais recentemente vem primeiro. · fixes UAT-24
  verified_by:: `test/services/SeriesService.test.js`

## Observable States
N/A: a feature não importa nenhum requisito (conserto da issue UAT-24), então nenhum estado é apontado. Nenhum estado novo de tela: a lista só deixou de ser cortada.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. A tela passou a mostrar mais séries (45 em vez de 20, na conta do MJRP), sem protótipo. Decidido pelo agente, sob a ordem do MJRP de consertar rápido e documentar depois («go for it, faz a F47 agora», 2026-11-19).
- Transversal layer touched: nenhuma. Nenhum componente, token ou fonte mudou.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

## Success Criteria
- Na conta do MJRP, com 45 séries gravadas: a tela de álbuns mostra as 45. Antes mostrava 20 e escondia 25. Medido em 2026-11-19.
- As quatro séries com Robert Plant, que estavam entre as escondidas, aparecem.
- Nada foi perdido nem regravado: o conserto só muda a leitura.
- Com as 45 séries, os 217 álbuns pedidos se resolvem em 31 segundos, com os dados do navegador apagados: 213 achados e 4 com aviso de falha.

## Out of Scope
- Mostrar as séries em páginas. Com 45 séries numa tela só, a paginação virou outra feature (F51), feita em seguida: hoje a tela de álbuns mostra 10 séries por página, de 45.
- Os 4 álbuns que não carregaram na medição. Um deles é o pedido gravado com «&amp;» no lugar de «&» (UAT-180, aberta). Os outros três a loja de música não tem, e a segunda fonte está fora do ar em produção.
- Avisar quando há mais séries do que a tela mostra. Deixou de ser preciso: a lista vem inteira.

## Open Questions
- O seletor de séries mostra as 45? — não conferido no navegador. Ele lê a mesma lista que a tela de álbuns, mas a medição só contou as séries da tela. Fica como tarefa aberta.
- Uma conta com centenas de séries lê todas de uma vez. Precisa de teto? — não decidido; para a conta de hoje (45 séries) a leitura é uma só e rápida. Decide o MJRP se a conta crescer.
