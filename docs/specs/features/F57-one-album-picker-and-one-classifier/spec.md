---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-185", "UAT-193"]
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
# Feature F57: Uma peça só para escolher álbuns de um artista
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Criar uma série (Home) e editar uma série usam a mesma peça para buscar um artista, agrupar os álbuns por tipo e escolher; álbuns de estúdio aparecem como álbuns de estúdio nas duas telas.

**Por quê:** Hoje a Home e a janela de edição mostram a mesma busca de dois jeitos, e álbuns de estúdio conhecidos caem em «?».

**Como saber que funcionou:** Buscando «Kendrick Lamar» nas duas telas, as abas e o conteúdo são os mesmos, e «To Pimp a Butterfly» está entre os álbuns de estúdio.

## Problem Statement
O MJRP, em 2026-11-19: «os 2 albuns mais famosos e aclamados do kendrick lamar na busca, apareceram em (?) na home»; e «verificar a necessidade real das logicas de edit como um todo (na playlist tb) serem diferentes das de adicionarem».

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-185
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
