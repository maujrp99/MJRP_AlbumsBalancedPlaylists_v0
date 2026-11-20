---
status: Done
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-149"]
planned_for: "[[ROADMAP#^REL-39]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F53: A suíte de testes volta a ficar verde
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Rodar os testes do projeto volta a dar um resultado limpo: tudo passa, e o que não é teste de unidade sai da contagem.

**Por quê:** A suíte tem 28 falhas antigas que nunca foram consertadas. Com ela sempre vermelha, um teste novo que quebre se perde no meio, e as regras de arquitetura escritas como teste não barram nada.

**Como saber que funcionou:** `npx vitest run` termina sem nenhuma falha.

## Problem Statement
O MJRP, em 2026-11-19: «conserte os 28 testes falhando». As falhas vêm de testes que descrevem código que mudou (a loja de séries virou loja pura), de um ambiente de teste sem o guardado do navegador e de roteiros que dirigem um navegador de verdade contados como teste de unidade.

## Requirements
- [REQ-01] Rodar os testes de unidade do projeto termina sem nenhuma falha e com código de saída 0. · fixes UAT-149
  verified_by:: `npx vitest run` (431 passam, 0 falham, em 2026-11-19)
- [REQ-02] O ambiente de teste entrega o guardado do navegador (`localStorage`, `sessionStorage`), vazio no começo de cada teste, em qualquer versão do Node. · fixes UAT-149
  verified_by:: `test/services/infra/StorageService.test.js`, `test/services/spotify/SpotifyAuthSignal.test.js`
- [REQ-03] Cada teste descreve o código que existe: nenhum importa arquivo que não existe nem confere comportamento que saiu do código. · fixes UAT-149
  verified_by:: `test/stores/series.test.js`, `test/views/ConsolidatedRankingView.test.js`, `test/components/playlists/PlaylistGrid.duration.test.js`, `test/views/helpers/SeriesComponentFactory.test.js`
- [REQ-04] Os roteiros que dirigem um navegador de verdade não contam como teste de unidade; têm executor próprio. · fixes UAT-149
  verified_by:: `vitest.config.js` (exclui `test/e2e/`), `package.json` (`test:e2e`)

## Observable States
N/A: a feature não importa nenhum requisito (conserto da issue UAT-149), então nenhum estado é apontado. Nada muda para quem usa o app.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. A feature não toca tela: só arquivos de teste e a configuração do Vitest.
- Transversal layer touched: nenhuma.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- `npx vitest run` termina com 0 falhas e código de saída 0. Medido em 2026-11-19: 431 passam; antes eram 28 falhas.
- Nenhum arquivo de `public/js/` nem de `server/` mudou para os testes passarem.

## Out of Scope
- Rodar e consertar os roteiros de navegador (`npm run test:e2e`): não foram rodados.
- O teste do servidor que importa `public/js/curation.js`, arquivo que não existe (UAT-21).
- Ligar a suíte a uma verificação que bloqueie commit ou deploy (UAT-20).
- A mensagem «Maximum call stack size exceeded» que aparece na saída de erro durante a suíte, sem derrubar teste.

## Open Questions
- De onde vem «Maximum call stack size exceeded» na saída de erro? — não investigado; fica como tarefa aberta.
