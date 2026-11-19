---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-175", "UAT-176", "UAT-177"]
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F48: O guardado de álbuns é confiável: nova tentativa, sem gravar à toa, e o Clear Cache limpa de verdade
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O que o app guarda no navegador sobre álbuns passa a se comportar como a pessoa espera: uma falha do servidor é tentada de novo, um álbum que não mudou não é regravado na nuvem a cada visita, e o botão «Clear Cache» apaga de fato o que está guardado.

**Por quê:** Hoje a nova tentativa nunca roda, cada visita regrava todos os álbuns na nuvem, e o botão de limpar não limpa o guardado de álbuns.

**Como saber que funcionou:** O teste da nova tentativa passa; a segunda visita à tela de álbuns não grava álbum nenhum na nuvem; depois do «Clear Cache» a tela busca os álbuns de novo.

## Problem Statement
Três defeitos do mesmo assunto, o guardado de álbuns: a nova tentativa ao servidor estoura um erro antes de rodar; a tela regrava cada álbum na nuvem e relê cada ranking a cada visita; e o botão «Clear Cache» só apaga uma parte que já não guarda os álbuns.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-175, UAT-176, UAT-177
  verified_by:: «a escrever: teste ou [[uat#^UAT-01]] — obrigatório antes do Done»

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
«a escrever: o estado de tela do info-arch.md ou de comportamento do behavior.md que os nós apontam — ou N/A se não apontam nenhum»

## Prototype Parity (if the feature touches a screen)
<!-- What the approved visual reference holds across every screen and no node carries: the design system's tokens and fonts,
     the shared components, the shell (brand, menu order, context bar, the behaviour every card has), the
     responsiveness (widths, tables, drawers). The product's FIRST screen feature ports the design system's CSS, fonts
     and components. A cut or swap of anything of the design system points to its recorded decision. -->
- Prototype: «a escrever: design/inception/<nome>-vN.html aprovado»
- Transversal layer touched: «a escrever: tokens e fontes · componentes compartilhados · shell · responsividade»
- Design-system cuts or swaps: «a escrever: none, ou a decisão que registra»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- «a escrever: um item mensurável e testável por critério de aceite dos nós importados»

## Out of Scope
- «a escrever: o que esta feature não faz»

## Open Questions
<!-- ALL resolved before Plan. -->
- «a escrever: pergunta — resposta, quem, quando; ou "Nenhuma." se todas estão resolvidas»
