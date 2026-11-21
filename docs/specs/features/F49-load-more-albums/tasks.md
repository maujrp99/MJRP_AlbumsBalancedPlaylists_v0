<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F49: O botão de carregar mais álbuns de uma série funciona · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f49-load-more-albums`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f49-load-more-albums`, a partir da `main` em `4dc353a`
- [x] causa lida no código antes de mexer: quem desenha o botão, onde o clique morre, onde estão os álbuns depois do décimo segundo, com arquivo e linha, na seção Problem Statement da spec; o defeito reproduzido em teste da tela inteira (4 dos 8 casos de `test/views/SeriesView.loadMore.test.js` falhavam antes)
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
<!-- Atomic (one focused session), verifiable (a clear "done"), ordered by dependency: data → logic →
     components → composition → polish. -->
<!-- Marks, after `implements::`, separated by ` · `:
     model:: sonnet|opus — MANDATORY on every task; the author of this file decides, the implementer never does.
                        sonnet = MECHANICAL: texts and registry keys, summaries, format samples and tests, derived
                        files, renames. opus = code design, architecture, critique, visual recheck. There is no
                        default: a task without the mark fails the cross-check.
     rounds:: N       — written when the task CLOSES ([x]): how many Execute ⇄ Verify rounds it took (ceiling 3).
                        `python3 mjrp-scripts/loop.py --check-tasks tasks.md` fails a closed task without it. -->
- [x] TASK-01 `public/js/models/seriesExpansion.js` e `test/models/seriesExpansion.test.js`: o limite, o corte e o estado da visita (séries abertas, esquecidas na troca de escopo) — 7 testes passando · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/components/ui/LoadMoreButton.js`: `type="button"`, o número de álbuns retidos, singular e plural — coberto por `test/components/series/SeriesGridRenderer.loadMore.test.js` · implements:: REQ-03, REQ-04 · model:: sonnet · rounds:: 1
- [x] TASK-03 `public/js/components/series/SeriesGridRenderer.js`: o grupo da série desenhado pelo estado (`props.expandedSeriesIds`), `focusAlbum`, e a retirada de `_attachEventListeners` e `_handleLoadMore` — `test/components/series/SeriesGridRenderer.loadMore.test.js`, 8 testes passando · implements:: REQ-01, REQ-03, REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-04 o clique ligado ao estado: `SeriesEventHandler` (`load-more-series` → `onShowAllAlbums`), `SeriesView` (`expansion`, `showAllAlbums`, `syncExpansionScope`) e `SeriesViewUpdater.updateGrid` (repassa a lista) — `test/views/SeriesView.loadMore.test.js`, 8 testes passando · implements:: REQ-01, REQ-02, REQ-04, REQ-05 · model:: opus · rounds:: 1

## Verification
- [x] TASK-05 suíte (`npx vitest run`: 1330 passando, 1307 antes), `npx vite build` e complexidade até 10 nas funções novas ou mudadas (`npx eslint --rule '{"complexity":["error",10]}'` nos arquivos tocados; as duas acima do limite, `SeriesView.updateAlbums` e `SeriesEventHandler.handleRemoveAlbum`, já estavam e não ganharam caminho) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: sonnet · rounds:: 1
- [x] TASK-06 prova no navegador: o MJRP viu em produção, numa série de 15 álbuns, o clique em «Load 3 more albums» mostrar os três restantes e o botão sumir («f49: testando em prod, all good», 2026-11-19 23:22); o teclado e a série continuar aberta seguem cobertos pelos testes · evidência: `reports/evidence/F49/2026-11-19-load-more-albums-proof.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/behavior.md` (estado novo `^library-series-more-albums`) e `docs/manual/` (09, 12, 15, 29) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia
- [ ] TASK-08 fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde · implements:: REQ-01 · model:: sonnet
- [ ] TASK-07 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra. É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F49-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-01 · model:: opus

## For the owner at UAT
- O MJRP julga o texto do botão («Load N more albums» mantido; o clique não carrega nada) e a escolha valer só para a visita
