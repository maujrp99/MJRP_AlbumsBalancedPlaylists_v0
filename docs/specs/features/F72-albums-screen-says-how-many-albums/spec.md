---
status: Draft
lane: fast
solution_type: feature
imports: ["[[S-55-see-how-many-albums-the-albums-screen-holds]]"]
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
# Feature F72: A tela de séries diz quantos álbuns e quantas séries ela mostra
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O cabeçalho da tela de séries de álbuns passa a dizer quantas séries e quantos álbuns ela reúne; com um filtro ou uma busca ligados, diz quantos passam e de quantos.

**Por quê:** O MJRP quer saber o tamanho do que tem na tela sem contar série por série.

**Como saber que funcionou:** Com todas as séries, o cabeçalho mostra o total de séries e de álbuns; ao filtrar, o número acompanha; numa série só, mostra os álbuns dela.

## Problem Statement
O MJRP, em 2026-11-20: «outra melhoria conseguimos colocar quantos albums estao na página de albuns series?».

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes S-55
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
