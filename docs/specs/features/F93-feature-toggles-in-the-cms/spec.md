---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-75-turn-features-on-and-off-from-the-cms]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F93: Chaves para ligar e desligar features em produção, pelo CMS
**Approved**: pendente. Em esboço, esperando o MJRP. Depende do CMS (F82).

## Summary
**A feature:** No CMS, uma chave por feature para ligá-la e desligá-la em produção, a começar pela integração com o Discogs; e uma arquitetura em que desligar uma feature não deixa rastro na tela nem carrega código dela.

**Por quê:** O MJRP quer tirar features de produção com facilidade.

**Como saber que funcionou:** A escrever com a proposta.

## Problem Statement
Dito pelo MJRP em 2026-11-22: «no CMS importante termos feature toggle para ligarmos e desligarmos features em prod. A começar pela integração com a discogs. A ideia é facilmente tirar features de prod por isso creio que a componentizacao e modularização sejam essências na arquitetura da plataforma, to certo?»

## Requirements
- [REQ-01] O CMS tem uma seção de chaves: o dono liga e desliga cada feature em produção, sem publicar de novo · fixes S-75
- [REQ-02] A primeira chave é a da integração com o Discogs (valor do álbum e links de compra que dependem dele) · fixes S-75
- [REQ-03] Feature desligada não deixa rastro na tela (nem botão, nem aviso, nem espaço) e não carrega código próprio; o resto do produto segue funcionando · fixes S-75
- [REQ-04] Componentização e modularização como requisito da arquitetura: proposta do agente como NFR-03, pendente do MJRP (a constituição não foi mudada) · fixes S-75

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
O CMS em si (F82); a chave da medição de uso (F82, REQ-02), que usa a mesma peça de chave que o kit do CMS traz (F332 do harness); decidir quais features terão chave além do Discogs.

## Open Questions
- **Resposta do orquestrador à pergunta dele («to certo?»): sim**, é essencial; falta o MJRP aceitar o NFR-03.
- Hoje o Discogs tem um interruptor que é variável do serviço (`DISCOGS_VALUES`, F75, REQ-10; lida a cada pedido). A chave do CMS substitui a variável, ou as duas valem (a do serviço como corte de emergência)?
- Chave para todos, para pessoas nomeadas (como o `DISCOGS_VALUES_FOR` de hoje) ou por pedido de quem usa?
- Que outras features ganham chave depois do Discogs (a medição de uso, já pedida na F82; a exportação para Spotify; a lista a decidir).
- Relação com a F82: features próprias que dependem do CMS (decidido pelo agente, revisável; ver F92). Esta generaliza o REQ-02 da F82.
