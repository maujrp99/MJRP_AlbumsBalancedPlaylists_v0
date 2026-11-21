---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-64-edit-the-site-content-from-an-admin]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F82: Um admin para o site, com o CMS-kit do MJRP
**Approved**: pendente

## Summary
**A feature:** Um admin, feito com o CMS-kit do MJRP, onde o dono edita o conteúdo do site.

**Por quê:** Hoje todo texto do site mora no código; os sites do MJRPpersonal já têm um admin com o CMS-kit.

**Como saber que funcionou:** A escrever com a proposta.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «As próximas features agora serao de internacionalizar o site e criar um admin como temos nos sites do MJRP personal, utilizando o CMS-kit nosso.»

## Requirements
- [REQ-01] «a escrever depois das conversas com o MJRPpersonal e o harness e da proposta de arquitetura» · fixes S-64

- [REQ-02] O CMS traz uma chave para ligar e desligar a medição de uso do site (F77, PostHog), que nasce desligada. Palavras do MJRP (Control Center, D-05, 2026-11-21 09:08): «Deixar desligada e entrar no CMS uma feature toggle pra ligar assim que terminarmos a Migracao para o react e o buil do CMS». Como foi lido: a medição continua desligada agora; a chave entra no CMS, e ele liga depois da migração para o React e de o CMS estar construído. A regra dele para o kit vale: recurso de CMS nasce no kit e serve a todos os CMS, então a peça «chave de liga e desliga» é assunto da F332 do harness · fixes S-64

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
A escrever.

## Open Questions
- O que o admin edita: os textos das telas, a página de entrada, as traduções (F81), mais alguma coisa.
- O que é o CMS-kit hoje: onde mora, que stack pede, como se instala num projeto que não é dele (este site é JavaScript puro com Vite e Firebase).
- Quem entra no admin e como (hoje só o MJRP usa o site).
- Onde o conteúdo fica guardado e como chega ao site publicado.
- A ordem entre F81 e F82: o admin antes, para as traduções já nascerem nele, ou depois.
