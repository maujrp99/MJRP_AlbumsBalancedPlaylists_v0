---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-196", "UAT-197", "UAT-198", "UAT-05", "UAT-12"]
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
# Feature F60: Nada do que foi salvo se perde
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Salvar a edição de um lote só apaga o antigo depois de gravar o novo; um salvamento grava uma vez, na série certa; apagar uma série cuida das playlists dela; playlists geradas sobrevivem a recarregar a página; ao sair da conta a tela esvazia; os dados de visitante passam para a conta ao entrar.

**Por quê:** Hoje há caminhos em que um lote some, um salvamento cai em outra série e o inventário de uma pessoa aparece para a seguinte.

**Como saber que funcionou:** Cada caminho tem um teste que falha hoje e passa depois; no navegador, uma falha de gravação provocada deixa o lote como estava.

## Problem Statement
Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`).

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-196
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
