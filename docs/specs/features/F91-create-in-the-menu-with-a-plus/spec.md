---
status: Draft
lane: fast
solution_type: improvement
imports: ["[[S-73-name-the-start-screen-create-with-a-plus]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F91: «Criar» (Create) no menu, com um ícone de adição
**Approved**: pendente. Em esboço, esperando o MJRP.

> **Nota de 2026-11-23 (arrumação do board).** Construída, julgada por agente separado e em produção desde 2026-11-22 11:55, com a palavra do MJRP («publique»): o menu diz «Create»/«Criar» com o sinal de mais, e o botão diz «Go and create!». O que esta spec chama de «Start» é o nome antigo. Falta só o passo retroativo da via rápida (as seções «A escrever», a S-73 com a entrega e o estado de tela, a declaração dos documentos no plano). As tarefas seguem sem marca e a feature em `Draft` porque ela não está na «Priorizada» de hoje, e a trava do commit recusa marcar o que não foi priorizado.

## Summary
**A feature:** O item do menu e a tela hoje chamados «Start» (ícone «Go» na barra de baixo do celular) passam a se chamar «Create», em português «Criar», com um ícone de adição (um sinal de mais).

**Por quê:** O verbo diz o que a tela faz: montar uma série. O MJRP perguntou se seria melhor.

**Como saber que funcionou:** No menu do computador e na barra do celular lê-se «Create» (em português, «Criar») com o sinal de mais; o endereço e o resto do menu seguem funcionando.

## Problem Statement
Dito pelo MJRP em 2026-11-22: «O que acha de mudar o start para Crie/Create ? E ao invés de um ícone de go seja algo relacionado a adição?» É uma pergunta, não uma decisão. Opinião dada pelo orquestrador: concorda; o verbo diz o que a tela faz; um sinal de mais como ícone.

## Requirements
- [REQ-01] O item do menu do computador, a aba do celular, o título da tela e o rodapé que hoje dizem «Start» passam a dizer «Create» («Criar» em português, com a F81) · fixes S-73
- [REQ-02] O ícone «Go» da aba do celular (e do menu, onde houver) é trocado por um ícone de adição, o sinal de mais, do conjunto de ícones que o `design-system.md` já tem ou, faltando, acrescentado a ele · fixes S-73
- [REQ-03] O endereço `/start` e os links salvos continuam funcionando; mudar o endereço é uma pergunta aberta abaixo · fixes S-73

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
Mudar o que a tela faz; o logotipo e a página de entrada (F85); o desenho do menu (F88).

## Open Questions
- **O MJRP confirma o nome e o ícone?** (a decisão que espera por ele). O nome «Start»/«Inicie» foi escolhido por ele na F85 depois de «Initiate» e «New Series»; «Create» o substitui.
- O endereço passa a `/create`, com `/start` redirecionando, ou fica `/start`? A propor junto com o nome.
- A F85 e a F88 ainda estão em andamento e usam «Start»: a mudança entra depois delas ou junto, a combinar com o orquestrador.
