---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-178", "UAT-182", "UAT-183"]
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F50: Um endereço local só para o login e para o Spotify
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Rodando o app na própria máquina, o login e a conexão com o Spotify passam a funcionar no mesmo endereço, e a documentação diz qual é e em que porta.

**Por quê:** Hoje um endereço serve para o Spotify e outro para o login, cada um com a sua sessão, e a porta documentada está ocupada no macOS.

**Como saber que funcionou:** Abrindo o app local pelo endereço documentado, a pessoa entra com a conta e conecta o Spotify sem trocar de endereço.

## Problem Statement
O MJRP: «temos problemas de usar localhost e 127.0.0.1 um funciona para spotify e outra pra apple, isso é algo que gostaria de arrumar tb». Quem desenvolve ou testa localmente fica meio logado em dois endereços.

## Requirements
- [REQ-01] O app local roda num endereço só, `http://127.0.0.1:5010`, e uma página aberta em `localhost` é levada para o mesmo lugar nesse endereço. · fixes UAT-178
  verified_by:: `test/utils/localAddress.test.js`, `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json`
- [REQ-02] A porta local é fixa e está escrita, com os cadastros que dependem dela, no `PORT_INFO.txt`, no `README.md` e no manual. · fixes UAT-178
  verified_by:: `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json`
- [REQ-03] Ao conectar ou desconectar o Spotify, o botão do topo mostra o estado novo sem recarregar a página. · fixes UAT-182
  verified_by:: `test/services/spotify/SpotifyAuthSignal.test.js`, `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json`
- [REQ-04] O «x» do botão «Connected» pergunta pelo diálogo do próprio app e, com o sim, desconecta. · fixes UAT-183
  verified_by:: `test/services/spotify/SpotifyAuthSignal.test.js`, `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json`

## Observable States
N/A: a feature não importa nenhum requisito (conserto das issues UAT-178, UAT-182 e UAT-183), então nenhum estado é apontado.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. A única mudança de tela é a pergunta de desconectar, que passou da caixa nativa do navegador para o diálogo que o app já usa em «Delete Series?». Decidido pelo agente, sob a ordem do MJRP («corrija o defeito que achou pls», 2026-11-19).
- Transversal layer touched: nenhuma. O diálogo é o `ConfirmModal` existente.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

## Success Criteria
- Abrir `http://localhost:5010/albums` leva a `http://127.0.0.1:5010/albums`. Visto no navegador em 2026-11-19.
- No mesmo endereço, o MJRP entra na conta pelo Google e conecta o Spotify. Visto em 2026-11-19.
- Conectar e desconectar o Spotify muda o botão na hora. Visto pelo MJRP: «connect e disconnect do spotify ok agora no 5010».

## Out of Scope
- O login pela Apple no endereço local. Em produção funciona; em `127.0.0.1:5010` a Apple respondeu 403. A causa não está provada e o conserto, se houver, é outra feature.
- O servidor local e o CORS dele: o endereço local do site fala com o servidor pelo repasse do Vite.

## Open Questions
- O login pela Apple funciona em endereço local? — não respondido. Falta o MJRP repetir o teste com a sessão da Apple aberta; se falhar de novo, ele decide entre um túnel com HTTPS e entrar pelo Google no ambiente local.
- A autorização do Apple Music para exportar playlist funciona em `127.0.0.1:5010`? — não conferido.
