---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-149"]
planned_for: "[[ROADMAP#^REL-39]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F53: A suíte de testes volta a ficar verde
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Rodar os testes do projeto volta a dar um resultado limpo: tudo passa, e o que não é teste de unidade sai da contagem.

**Por quê:** A suíte tem 28 falhas antigas que nunca foram consertadas. Com ela sempre vermelha, um teste novo que quebre se perde no meio, e as regras de arquitetura escritas como teste não barram nada.

**Como saber que funcionou:** `npx vitest run` termina sem nenhuma falha.

## Problem Statement
O MJRP, em 2026-11-19: «conserte os 28 testes falhando». As falhas vêm de testes que descrevem código que mudou (a loja de séries virou loja pura), de um ambiente de teste sem o guardado do navegador e de roteiros que dirigem um navegador de verdade contados como teste de unidade.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-149
  verified_by:: «a escrever: teste ou [[uat#^UAT-01]] — obrigatório antes do Done»

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
«a escrever: o estado de tela do info-arch.md ou de comportamento do behavior.md que os nós apontam — ou N/A se não apontam nenhum»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- «a escrever: um item mensurável e testável por critério de aceite dos nós importados»

## Out of Scope
- «a escrever: o que esta feature não faz»

## Open Questions
<!-- ALL resolved before Plan. -->
- «a escrever: pergunta — resposta, quem, quando; ou "Nenhuma." se todas estão resolvidas»
