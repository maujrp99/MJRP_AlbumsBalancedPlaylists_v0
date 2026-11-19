---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-206"]
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
# Feature F69: Popularidade do Spotify: falha é falha, e «não conectado» não é «sem dado»
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** A popularidade do Spotify passa a ter três desfechos separados: o Spotify não tem o álbum («sem dado»), a consulta falhou (token vencido, 401, 429, rede: «falhou», com «tentar de novo») e a conta não está conectada (nem falha nem «sem dado»; nada é gravado na série). O mesmo vale para o caminho do servidor, se alguma rota o expõe.

**Por quê:** Hoje os três casos terminam como «sem dado», que é guardado por 1 hora e gravado nos fatos da série como «a popularidade não tem dado». A proposta emendada da F52 deixou este ponto fora e pediu uma feature própria.

**Como saber que funcionou:** Com o Spotify desconectado, nenhuma série passa a dizer «sem popularidade»; com o acesso vencido, o álbum mostra «falhou» e «tentar de novo» traz o dado depois de reconectar.

## Problem Statement
Achado pelo auxiliar da F52 em 2026-11-19 (`PopularityEnricher` termina em `empty` sempre que o álbum não tem `spotifyId`). Criada pelo agente sob a dispensa do MJRP de 2026-11-19 19:03 («decida e registre»).

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-206
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
