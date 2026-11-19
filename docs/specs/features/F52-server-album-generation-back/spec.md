---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-181", "UAT-23"]
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
# Feature F52: A busca de álbum por IA do servidor volta a responder
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O servidor passa a dizer a verdade ao app, em três passos nesta ordem: um contrato de erros (não existe, falhou, demorou), para uma falha não virar «sem dado»; o raspador de notas aceitando só o álbum certo; e só então um cache das notas no servidor, com o limite de chamadas medido.

**Por quê:** Hoje o servidor responde 200 e vazio quando o raspador falha, o app grava isso como «sem nota», e cada nota é buscada de novo a cada visita. Um cache posto antes de acertar o raspador congelaria respostas erradas.

**Como saber que funcionou:** Uma falha do servidor aparece no app como falha, com «tentar de novo»; a segunda visita a uma série não espera pelas notas.

## Problem Statement
A busca por IA respondia 402 em produção (UAT-181, sintoma resolvido pela cobrança em 2026-11-19). Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`).

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-181
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
