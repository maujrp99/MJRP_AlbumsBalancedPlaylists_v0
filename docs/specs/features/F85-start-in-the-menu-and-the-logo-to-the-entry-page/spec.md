---
status: In Progress
lane: fast
solution_type: feature
imports: ["[[S-67-reach-the-entry-page-from-the-logo]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F85: «Start» no menu, e o logotipo leva à página de entrada
**Approved**: pendente

> **Nota de 2026-11-23 (arrumação do board).** O item que esta feature chamou de «Start» hoje se chama «Create» («Criar»), com o sinal de mais (F91, em produção desde 2026-11-22). O menu e a barra foram reescritos em React (F83).

## Summary
**A feature:** O item «Home» do menu passa a se chamar «Start» (a tela onde se monta uma série) e o logotipo passa a levar à página de entrada, que vira a home do site.

**Por quê:** A tela de montar série não é uma home: é o começo do fluxo. A home de um site é para onde o logotipo leva.

**Como saber que funcionou:** No menu e na barra do celular lê-se «Start»; clicar no logotipo abre a página de entrada; quem tem conta aberta continua caindo direto na tela de trabalho ao abrir o site; nenhum link salvo quebra.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «O item home do menu, deveria mudar para Initiate ou Start e o logo deveria ser a home que deveria ser a splash/landing page, o que acha?» e, depois da opinião do agente: «podemos mudar isso em prod já?»

## Requirements
- [REQ-01] O item do menu (computador) e a aba (celular) da tela de montar série dizem «Start»; o endereço passa a ser `/start` · fixes S-67
  - Revisto em 2026-11-21 (MJRP, depois de ver em produção: «home está redirecionando pra start, o /home agora deveria ser o entry...»; UAT-238): `/home` **não** leva a `/start`; `/home` é a página de entrada, a home do site, para todos, com ou sem conta, sem redirecionar.
- [REQ-02] O logotipo, no computador e no celular, leva à página de entrada, em `/home` (era `/?entry`; MJRP, 2026-11-21, UAT-238) · fixes S-67
- [REQ-03] Abrir o site (`/`) mostra a página de entrada a todos, com ou sem conta aberta: ninguém é mandado a `/start` sozinho; os botões «Open the app» da página de entrada levam a `/start` · fixes S-67
  - Revisto em 2026-11-21 (MJRP, UAT-239): «conta aberta sempre home qdo vc acessa o link principal do site, aí vc teria o botao para start». Antes, a raiz mandava quem tinha conta direto a `/start`, sem pintar a página; agora a raiz pinta a página de uma vez, sem esconder e sem esperar. A leitura «há conta neste navegador?» (`public/splash/gate.js`, `hasAccount`) fica como função pura para o próximo passo do desenho (trocar o cabeçalho), e nada redireciona.

## Observable States
Os de hoje, com o rótulo novo; nenhum estado novo.

## Success Criteria
Os três requisitos vistos no navegador a 1280 e a 393 px, com e sem conta; `/home` e `/home?signin` mostram a página de entrada, com e sem conta; `/start`, `/start?signin` e os links diretos continuam abrindo.

## Out of Scope
Redesenhar a página de entrada para quem tem conta; os álbuns dela escolhidos no CMS (F82, REQ-03).

## Decided by the owner
- **O nome** (MJRP, 2026-11-21, no chat): «pode ser new Series», depois «pensando bem, pode ser Starte e Inicie em pt», e por fim «Start». Como foi lido: o item se chama **«Start»** em inglês e **«Inicie»** em português do Brasil (o português entra com a F81).

## Open Questions
- **Fechado pelo MJRP em 2026-11-21** (UAT-238): `/home` é a página de entrada para todos. A raiz `/` mudou no mesmo dia (REQ-03, UAT-239): a página de entrada para todos.
- **Decidido pelo agente — revisável**, porque o MJRP não escolheu: com a conta aberta, abrir o site continua indo direto à tela de trabalho, e só o logotipo leva à página de entrada (a alternativa é a raiz mostrar sempre a página de entrada).
