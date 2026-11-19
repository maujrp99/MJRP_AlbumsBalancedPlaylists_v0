---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-15", "UAT-16", "UAT-28", "UAT-199", "UAT-25"]
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
# Feature F59: Fechar o que está aberto: banco, servidor e chaves
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O que estava aberto fica fechado: as regras do banco no repositório fecham cada dado no seu dono e são a fonte do que é publicado; o servidor de produção sai sem rotas de depuração e com a IA paga atrás de login e de um limite; a volta do login do Spotify é conferida; o site publicado não entrega o código-fonte.

**Por quê:** O cruzamento com os relatórios anteriores achou que isso é mais grave que tudo no plano da v5.0. A conferência de 2026-11-19 mostrou o tamanho real: em produção as regras do banco já estavam fechadas (aberto estava o arquivo do repositório); as rotas de depuração e a IA paga estão abertas de fato.

**Como saber que funcionou:** Um pedido sem login ao ranking de outra pessoa é recusado; as rotas de depuração respondem 404 em produção; `/api/generate` sem login é recusado; uma volta do Spotify que não bate é recusada.

## Problem Statement
Decisão do MJRP de 2026-11-19: tudo entra na v5.0, cada feature pronta e testada vai para produção sozinha; e «Siga a sua prioridade», com a segurança em primeiro. Origem: `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`, seção B.

## Fatias (cada uma vai para produção sozinha)
- **A. Só o site** — feita em 2026-11-19: arquivo de regras igual às regras em vigor e apontado pelo `firebase.json`; volta do Spotify conferida e segredos do aperto de mão vindos do gerador criptográfico; sair da conta encerra a sessão do Spotify; build sem mapas de código.
- **B. Servidor, sem mudar o app** — feita e publicada em 2026-11-19 (revisão `mjrp-proxy-00196-sj7`): rotas de depuração só com `ENABLE_DEBUG_ROUTES=true`; rota que quebra responde sem derrubar o servidor.
- **C. Servidor e app** — feita em 2026-11-19: as rotas pagas (`/api/generate`, `/api/ai/*`) só respondem a quem entrou com uma conta, 60 chamadas por hora por pessoa; as de trabalho (`/api/enrich-album`, `/api/playlists`) a qualquer pessoa logada, visitante incluído, 900 por hora. O app manda o login em toda chamada ao servidor, por um lugar só (`api/serverFetch.js`). **Decisão tomada pelo agente, revisável pelo MJRP:** visitante (login anônimo) não usa as rotas pagas; uma variável do servidor reabre isso.
- **D. Token do Discogs** — saiu desta feature em 2026-11-19, por decisão do MJRP, para a F59 poder fechar: é a F66.
- **E. Texto e conteúdo** — texto inserido como HTML sem tratamento; política de conteúdo e Tailwind servido do próprio site (UAT-25).

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] «a escrever: o que o sistema faz — O QUÊ, nunca COMO» · fixes UAT-15
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
