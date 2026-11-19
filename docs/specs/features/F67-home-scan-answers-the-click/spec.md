---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-204"]
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
# Feature F67: O Scan da Home responde ao clique
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Clicar em Scan na Home tem sempre uma resposta visível, de um dono só: buscando (botão ocupado), resultados, sem resultados ou falhou com «tentar de novo». A consulta ao catálogo tem prazo, e os álbuns aparecem assim que o catálogo responde; a lista da IA chega depois.

**Por quê:** Em produção, o clique em Scan pareceu não fazer nada, e o registro do servidor mostra que ele nem chegou ao servidor. Hoje a busca não tem prazo, avisa por `alert` e espera a IA antes de mostrar qualquer álbum.

**Como saber que funcionou:** Com o catálogo travado, a tela mostra «falhou» com «tentar de novo» dentro do prazo; com o catálogo respondendo, os álbuns aparecem antes de a IA responder.

## Problem Statement
O MJRP, em 2026-11-19: «bug em prod, cliquei no botao e scan e parece que nao faz nada»; depois, «agora foi, estranho». Decisão do MJRP de 2026-11-19: o conserto passa na frente assim que a F55 entrar («1. Sim pode»).

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-204
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
