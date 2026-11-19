---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-184"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F55: O álbum pedido, ou um aviso
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Uma série só mostra um álbum achado pela busca por nome quando o título dele bate com o pedido; se nenhum bate, a série avisa que o álbum não carregou, em vez de mostrar outro. Quando o identificador guardado não vale mais e o álbum certo é achado, o identificador novo é gravado na série.

**Por quê:** Hoje uma série pode mostrar um álbum que a pessoa nunca escolheu, sem aviso: com o artista certo, a conferência aceita qualquer álbum.

**Como saber que funcionou:** A série «Grunge Rock - Classics» mostra «Core» ou o aviso de que ele não carregou, nunca «Shangri-La Dee Da».

## Problem Statement
O MJRP, em 2026-11-19: «eu nuca adicionei esse album do stone temple pilots, provavelmente era o core».

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-184
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
