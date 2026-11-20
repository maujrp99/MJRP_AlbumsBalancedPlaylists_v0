---
status: Draft
lane: fast
solution_type: feature
imports: ["[[S-54-have-every-album-of-my-series-in-my-inventory]]", "[[S-56-rank-my-inventory-by-acclaim-and-popularity]]"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: feature`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F71: O inventário tem todos os álbuns das minhas séries; filtro por Owned, Not Owned e Wishlist
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O inventário ganha uma ação que põe nele todos os álbuns das séries da pessoa que ainda não estão lá, marcados como «Not Owned»; e o filtro de situação passa a oferecer «Owned», «Not Owned» e «Wishlist», além de «All».

**Por quê:** O MJRP quer ver, num lugar só, o que já possui e o que falta dos álbuns que ele curou; hoje o inventário só tem o que foi adicionado um a um.

**Como saber que funcionou:** Depois da ação, todo álbum das séries aparece no inventário uma vez só; os que já estavam lá mantêm a situação, o preço e o formato; o filtro mostra cada um dos três grupos pelo nome.

## Problem Statement
Segunda fatia (2026-11-20), o MJRP com a captura das duas médias do cartão: «no inventory, na 71, pode usar as metricas do print e ter um filtro/ranking por BEA Avg rank e Spotify Avg Pop.?» — o inventário mostra «Avg Rank» e «Avg Pop» de cada álbum e ordena por elas.

O MJRP, em 2026-11-20: «registre uma melhoria, coloque todos os os albums que tenho na minha albums list como parte do meu inventory. tudo marcado como not owned, e melhore o filtro de status para Owned, Not Owned, Wishlist».

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes S-54
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
