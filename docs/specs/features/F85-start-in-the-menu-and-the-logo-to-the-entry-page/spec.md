---
status: In Progress
lane: fast
solution_type: feature
imports: ["[[S-67-reach-the-entry-page-from-the-logo]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F85: «Start» no menu, e o logotipo leva à página de entrada
**Approved**: pendente

## Summary
**A feature:** O item «Home» do menu passa a se chamar «Start» (a tela onde se monta uma série) e o logotipo passa a levar à página de entrada, que vira a home do site.

**Por quê:** A tela de montar série não é uma home: é o começo do fluxo. A home de um site é para onde o logotipo leva.

**Como saber que funcionou:** No menu e na barra do celular lê-se «Start»; clicar no logotipo abre a página de entrada; quem tem conta aberta continua caindo direto na tela de trabalho ao abrir o site; nenhum link salvo quebra.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «O item home do menu, deveria mudar para Initiate ou Start e o logo deveria ser a home que deveria ser a splash/landing page, o que acha?» e, depois da opinião do agente: «podemos mudar isso em prod já?»

## Requirements
- [REQ-01] O item do menu (computador) e a aba (celular) da tela de montar série dizem «Start»; o endereço passa a ser `/start`, e `/home` leva a ele · fixes S-67
- [REQ-02] O logotipo, no computador e no celular, leva à página de entrada (`/?entry` para quem tem conta aberta) · fixes S-67
- [REQ-03] Abrir o site com a conta aberta continua levando direto à tela de trabalho, sem pintar a página de entrada; os botões «Open the app» da página de entrada levam a `/start` · fixes S-67

## Observable States
Os de hoje, com o rótulo novo; nenhum estado novo.

## Success Criteria
Os três requisitos vistos no navegador a 1280 e a 393 px, com e sem conta; `/home`, `/home?signin` e os links diretos continuam abrindo.

## Out of Scope
Redesenhar a página de entrada para quem tem conta; os álbuns dela escolhidos no CMS (F82, REQ-03).

## Decided by the owner
- **O nome** (MJRP, 2026-11-21, no chat): «pode ser new Series», depois «pensando bem, pode ser Starte e Inicie em pt», e por fim «Start». Como foi lido: o item se chama **«Start»** em inglês e **«Inicie»** em português do Brasil (o português entra com a F81).

## Open Questions
- **Decidido pelo agente — revisável**, porque o MJRP não escolheu: com a conta aberta, abrir o site continua indo direto à tela de trabalho, e só o logotipo leva à página de entrada (a alternativa é a raiz mostrar sempre a página de entrada).
