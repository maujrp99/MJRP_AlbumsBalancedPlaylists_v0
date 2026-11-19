---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-172"]
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F45: A tela de álbuns carrega vários álbuns ao mesmo tempo, com prazo, e só as séries à vista
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** A tela de álbuns deixa de buscar um álbum de cada vez. Vários álbuns chegam ao mesmo tempo, cada um com um prazo, e só as séries que estão à vista são buscadas; as outras carregam quando a pessoa rola até elas.

**Por quê:** Hoje, com 20 séries, a tela leva minutos: um álbum a cada 5 ou 6 segundos, e quase tudo fica em bloco cinza enquanto isso.

**Como saber que funcionou:** Com os dados do navegador limpos, as séries à vista aparecem completas em poucos segundos, e o tempo até a última série à vista cai para uma fração dos 5 minutos medidos em 2026-11-19.

## Problem Statement
A pessoa abre a tela de álbuns e espera minutos olhando blocos cinza. Os álbuns entram numa fila única, um por vez, e cada um espera a busca das notas (5 segundos em média) antes de liberar o seguinte. Um álbum que não responde segura todos os outros para sempre.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-172
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
