---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-181"]
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
**A feature:** O servidor volta a devolver o álbum quando a Apple Music não o tem, em vez de responder com um erro de pagamento.

**Por quê:** Em produção a busca de álbum por IA responde 402 (pagamento exigido); os álbuns que só ela acharia ficam com o aviso de que não carregaram.

**Como saber que funcionou:** Um pedido de álbum ao servidor de produção responde com o álbum, e os quatro álbuns hoje com aviso de falha carregam ou ficam com um motivo claro.

## Problem Statement
Quatro álbuns das séries do MJRP não carregam: a Apple Music não os acha pelo pedido gravado, e a segunda fonte, que é a busca por IA do servidor, responde com um erro de pagamento. O MJRP pediu para arrumar pela conta do Google Cloud e do Firebase («abra uma feature pra arrumarmos isso via google cloud e firebase cli e eu posso entrar no console tb»).

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
