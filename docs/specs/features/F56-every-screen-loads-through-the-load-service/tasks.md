<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F56: Blend e edição de playlists pelo serviço de carga · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f56-screens-load-through-the-service`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f56-screens-load-through-the-service`, a partir da `main` em `d210f35`
- [x] caminhos lidos no código antes de mexer, com arquivo e linha, na seção «Diagnóstico» do plano; suíte da `main` verde antes de começar (1143 testes) e `vite build` compilando
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
- [x] TASK-01 `public/js/utils/TaskQueue.js` e `test/utils/TaskQueue.test.js`: `boost` / `unboost` de um grupo e `cancelGroup` — commit `957a00d` · implements:: REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/stores/albumLoad.js` e `test/stores/albumLoad.test.js`: séries convidadas, mantidas quando a tela de álbuns troca a sua lista e fora do que ela conta — commit `957a00d` · implements:: REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/models/albumAsk.js`, `public/js/models/recipeSources.js`, `reconcileEntry` em `public/js/models/albumLoadState.js`, com `test/models/albumAsk.test.js` e `test/models/recipeSources.test.js`: as regras puras do pedido, do resultado tipado, dos avisos, das fontes da receita e da troca de edição — commit `957a00d` · implements:: REQ-01, REQ-04, REQ-05, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-04 `public/js/services/albums/AlbumLoadService.js` e `test/services/albums/AlbumLoadService.guests.test.js`: `join`, `leave`, `reloadAlbum`, `_reconcileSeries`, o carimbo por álbum, `_kept`; `adoptAlbum` removido — commit `957a00d` · implements:: REQ-02, REQ-03, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/services/albums/AlbumAsks.js` e `test/services/albums/AlbumAsks.test.js` (22 testes, as intercalações com a carga da tela de álbuns escritas antes do código): a porta única — commit `957a00d` · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/services/albums/albumLoading.js`: `albumAsks` composto; a projeção inclui as séries convidadas — commit `957a00d` · implements:: REQ-01, REQ-08 · model:: sonnet · rounds:: 1
- [x] TASK-07 `public/js/controllers/BlendingController.js`, `public/js/views/BlendingMenuView.js`, `public/js/services/PlaylistGenerationService.js`, com `test/controllers/BlendingController.load.test.js` e `BlendingController.regenerate.test.js`: o blend pede pela porta, espera as fontes da receita, segue com os prontos, devolve os avisos; a tela os mostra e larga o pedido ao sair — commit `957a00d` · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-08 `public/js/controllers/PlaylistsController.js` e `test/controllers/PlaylistsController.albums.test.js`: abrir a edição e gerar de novo pela porta, com os avisos; `destroy` larga os pedidos — commit `957a00d` · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-09 `public/js/views/helpers/SeriesModalsManager.js`, `components/series/SeriesEditModal.js`, `components/series/SeriesEventHandler.js`, `controllers/SeriesController.js`, `services/SeriesService.js`, com `test/controllers/SeriesController.test.js` e os testes do `SeriesService`: salvar reconcilia; sem injeção; «Refetch» por `reloadAlbum`; sem escrita avulsa na prateleira — commit `957a00d` · implements:: REQ-06, REQ-07, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-10 `public/js/stores/albums.js` e `test/stores/albums.test.js`: a prateleira sem os métodos de pôr e tirar um álbum — commit `957a00d` · implements:: REQ-08 · model:: sonnet · rounds:: 1
- [x] TASK-11 `public/js/api/client.js`, `public/js/helpers/BEAEnrichmentHelper.js` e os testes deles: `fetchAlbum`, `fetchMultipleAlbums`, `BEAenrichAlbum` e `enrichAlbum` removidos depois de conferir que nada os chamava — commit `957a00d` · implements:: REQ-09 · model:: sonnet · rounds:: 1
- [x] TASK-12 `test/architecture/screensLoadThroughTheService.test.js`: as 9 regras como teste, conferidas contra o `BlendingController` antigo (6 ficam vermelhas) — commit `957a00d` · implements:: REQ-08, REQ-09 · model:: opus · rounds:: 1

## Verification
- [x] TASK-13 suíte (`npx vitest run`: 1232 passando, 1143 antes), `npx vite build` e complexidade até 10 nas funções novas (`npx eslint --rule 'complexity: [2, 10]'` nos arquivos tocados: só funções que já estavam acima e não foram tocadas) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09 · model:: sonnet · rounds:: 1
- [x] TASK-14 prova no navegador com a conta do MJRP, com o tempo medido pelo roteiro do relatório de entrega: «Blend It» até a tela de playlists com os álbuns já carregados (antes: 8 a 18 s) e com a série fora da tela; abrir a edição de um lote até os álbuns prontos; salvar a edição de uma série sem as outras recarregarem (antes: cerca de 10 s); «Refetch» de um álbum; um álbum que falha aparecendo no aviso do blend; sair do blend durante a carga — prova: `reports/evidence/F56/2026-11-19-screens-through-the-load-service-proof.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-15 o passo retroativo da via rápida, a parte do agente: «Prototype: none» gravada na `spec.md` com a frase do MJRP (2026-11-20 00:10); a reconferência visual independente, por quem não implementou: `reports/audits/2026-11-19-F56-visual-parity-recheck.md` (passa, 0 P0, 0 P1); o código está na `main` (merges `042da86`, `06fba84`) e nenhum merge traz nota de Touch ID (não há nota `mjrp-visual-ok` no repositório), então o olhar dele na tela fica na marca `needs_human` da spec, não numa tarefa · implements:: REQ-01 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/arch.md` (seção «Toda tela pede os álbuns ao serviço de carga (F56)»), `docs/decisions/0019-one-owner-for-the-album-load.md` (a lista do que falta), `docs/specs/behavior.md` (os estados do blend, das playlists e da tela de álbuns) e `docs/manual/` (01, 06, 07, 08, 15, 17, 18, 19, 21, 99) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia

## For the owner at UAT
- O MJRP julga o blend seguir sem os álbuns que falharam, os textos dos avisos, a saída da pergunta «No ratings detected... Continue?» e o «Refetch» sem gravar o documento compartilhado
- O olhar dele na tela é a marca `needs_human` da spec; o aceite é dele no UAT.
