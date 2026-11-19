<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F58: Carga e gravação de playlists dentro do limite de complexidade · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f58-load-service-within-the-limit`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f58-load-service-within-the-limit`, a partir da `main` em `50e7b2e`
- [x] medição feita antes de mexer (136 funções acima de 10; 2 na carga) e as quatro issues conferidas no código, com arquivo e linha, na seção «Diagnóstico» do plano; suíte da `main` verde antes de começar (1543 testes) e `vite build` compilando
- [ ] conferência cruzada da spec e do plano: fica para o fecho (via rápida)

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
- [x] TASK-01 `test/architecture/support/measureComplexity.js`: o medidor (a regra `complexity` do ESLint, limite 10) e a tabela de antes — commit `89cdf20` · implements:: REQ-01, REQ-03 · model:: sonnet · rounds:: 1
- [x] TASK-02 `public/js/models/albumLoadHold.js` e `test/models/albumLoadHold.test.js`: as regras puras da espera (`holdAfter`, `isNewsToThePerson`, `stopsServerQueue`, `resumesIn`) — commit `89cdf20` · implements:: REQ-01, REQ-02 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/stores/albumLoad.js` e `test/stores/albumLoad.test.js`: a espera (`setHold` / `getHold`) e a parada (`stopGeneration` / `isStopped`) como estado da loja de carga, teste vermelho antes — commit `89cdf20` · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-04 `public/js/services/albums/LoadHold.js` e `test/services/albums/LoadHold.test.js`: a espera em vigor sai do `AlbumLoadService` (`_addHeld`, `_holdFor`, `_tellHold`, `_endHold`, `_endHoldOf`) para um colaborador; o serviço entrega a porta que escreve na loja — commit `89cdf20` · implements:: REQ-01, REQ-02 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/services/albums/AlbumAsks.js`, `holdWait` em `public/js/models/albumAsk.js`, com `test/services/albums/AlbumAsks.test.js` e `test/models/albumAsk.test.js`: o relógio de 1 s sai; o pedido lê a espera da loja e arma um prazo único enquanto há espera; o caso «a carga é parada no meio» ficou vermelho sem o relógio e passou com a parada como estado — commit `89cdf20` · implements:: REQ-02 · model:: opus · rounds:: 2
- [x] TASK-06 `public/js/models/albumSourceAsk.js`, `public/js/utils/LatestOnly.js`, com `test/models/albumSourceAsk.test.js` e `test/utils/LatestOnly.test.js` (vermelhos antes), e `_enrichOne` / `_askAndPublish` / `_failSource` / `_publishSource` em `public/js/services/albums/AlbumLoadService.js`: o pedido por fonte com regras puras — commit `89cdf20` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/views/SaveAllView.js`, a rota `/save-all` em `public/js/app.js`, com `test/views/SaveAllView.test.js` e `test/architecture/firestoreBehindRepositories.test.js` (vermelhos antes): a tela de migração sem Firebase próprio — commit `8ddf1a0` · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-08 `public/js/models/inventoryStats.js` e `test/models/inventoryStats.test.js`: as estatísticas do inventário fixadas por teste contra o código antigo e reescritas dentro do limite — commit `8ddf1a0` · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-09 `public/js/stores/inventory.js`, `public/js/services/inventory/InventoryService.js`, `inventoryWiring.js`, `public/js/controllers/InventoryController.js`, `public/js/components/InventoryAddModal.js`, com `test/stores/inventory.test.js`, `test/services/inventory/InventoryService.test.js`, `InventoryService.userChange.test.js` (os casos da UAT-198, movidos) e `test/controllers/InventoryController.delete.test.js`: a loja de inventário só guarda estado — commit `8ddf1a0` · implements:: REQ-05, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-10 `public/js/stores/UserStore.js`, `public/js/services/auth/UserSessionService.js`, `userSession.js`, a importação em `public/js/app.js`, com `test/stores/UserStore.test.js` e `test/services/auth/UserSessionService.test.js`: a loja de usuário só guarda estado — commit `8ddf1a0` · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-11 `public/js/views/SeriesView.js`, `public/js/components/series/SeriesEventHandler.js`, `public/js/components/TopNav.js` (que recebe o `MigrationUtility` do `app.js`), com `test/architecture/layerBoundaries.test.js` e a lista do que resta: a tela de álbuns e o menu sem `import` do banco nem do `app.js` — commit `8ddf1a0` · implements:: REQ-05, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-12 `test/architecture/complexityLimit.test.js`, `test/architecture/complexityAllowlist.js` (94 linhas, cada uma com quem pode baixá-la), `test/architecture/fixtures/aboveTheLimit.js`, e as regras novas em `test/architecture/albumLoadBoundaries.test.js`: o limite como teste, conferido por mutação (uma função de complexidade 11 posta em `services/albums/` reprova; uma linha tirada, um número baixado e uma linha a mais na lista reprovam) · implements:: REQ-01, REQ-03 · model:: opus · rounds:: 1

## Verification
- [x] TASK-13 suíte (`npx vitest run`: 1647 passando, 1543 antes) e `npx vite build` compilando; a medição de depois (133 funções acima de 10; 0 na carga) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06 · model:: sonnet · rounds:: 1
- [ ] TASK-14 prova no navegador, pelo integrador (o implementador não tinha navegador): a tela de álbuns carrega as séries e as notas como antes; um blend de uma série gera playlists; como visitante, as notas respondem 401, aparece um aviso só («Your sign-in could not be confirmed...»), nenhuma nota fica como falha, e entrar na conta e reabrir a tela retoma; o inventário abre, muda um preço e remove um álbum; o menu e o login funcionam; `/save-all` abre · implements:: REQ-01, REQ-02, REQ-04, REQ-05, REQ-06 · model:: opus
- [ ] TASK-15 julgamento do MJRP (tarefa do humano): o que resta da UAT-18 e da UAT-19 ficar numa lista em vez de consertado nesta feature; o limite de 10 entrar ou não na `constitution.md` · implements:: REQ-03, REQ-05, REQ-06 · model:: opus · waiting:: human — o aceite das issues é do MJRP · action:: o MJRP lê a lista em `test/architecture/layerBoundaries.test.js` e em `test/architecture/complexityAllowlist.js` e diz se as issues fecham

## Documentation
- [x] `docs/specs/arch.md` (a seção «O serviço de carga dentro do limite de complexidade (F58)», a de direção das dependências e as duas frases que ficaram falsas), `docs/decisions/0019-one-owner-for-the-album-load.md` (o texto, não o estado) e `docs/manual/` (01, 07, 10, 11, 14, 21, 23, 99) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [ ] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde
