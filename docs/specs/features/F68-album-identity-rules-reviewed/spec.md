---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-205"]
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
# Feature F68: As regras de identidade de álbum revistas, fáceis de ler e de manter
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Uma revisão de todas as regras que decidem «este é o álbum pedido» (`shared/albumIdentity.js` e os lugares que a chamam): o que normaliza, o que conta como edição, como trata subtítulo, como escolhe entre candidatos e onde cada fonte adapta os dados. O resultado é uma regra que se lê de cima a baixo, com cada caso de borda nomeado, com exemplo e teste, e um desenho que aguenta crescer quando entrarem as seções por gênero.

**Por quê:** A regra única nasceu na F55 e já ganhou a primeira exceção (o subtítulo de «No Quarter»). O MJRP prevê o algoritmo ficando mais complexo com as futuras seções de gênero e quer que a manutenção e o entendimento continuem fáceis.

**Como saber que funcionou:** Quem nunca viu o código explica, lendo um arquivo, por que dois álbuns são ou não o mesmo; cada exceção tem nome, exemplo real e teste; a contagem de álbuns trocados na conta do MJRP segue em zero.

## Problem Statement
O MJRP, em 2026-11-19: «o no quarter é um edge case, vamos tratá-lo com afrouxamento mas coloca no Do not forget do memory e abre uma feature pra revisao das regras todas pra encontrar a identidade de album, até pq depois com as futuras seções de genero, prevejo termos um algoritmo ficando mais complexo e precisamos revisar pra que a manutencao e o entendimento do mesmo seja fácil de entender.»

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-205
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
