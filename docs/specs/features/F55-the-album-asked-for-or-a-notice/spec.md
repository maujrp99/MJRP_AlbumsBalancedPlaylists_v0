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
# Feature F55: Os álbuns pedidos, ou um aviso: uma regra só para dizer que é o mesmo álbum
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Uma regra só decide «este é o álbum pedido», e ela vale nos cinco lugares que hoje decidem cada um do seu jeito: o catálogo da Apple Music, o Spotify, o BestEverAlbums no servidor, a capa local e a busca por IA. O título tem de bater por conta própria; sem resultado que bata, a série avisa em vez de mostrar outro álbum. Quando o identificador guardado não vale mais e o álbum certo é achado, o identificador novo é gravado na série, por um único escritor. A feature começa contando quantos álbuns da conta estão trocados hoje.

**Por quê:** Hoje, com o artista certo, qualquer álbum passa na conferência; e a mesma falha existe em cinco lugares.

**Como saber que funcionou:** Nenhuma série mostra um álbum diferente do pedido; a contagem de álbuns trocados na conta do MJRP vai a zero ou vira aviso.

## Problem Statement
O MJRP, em 2026-11-19: «eu nuca adicionei esse album do stone temple pilots, provavelmente era o core»; e «pq "o album pedido" e nao "os"». Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`).

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
