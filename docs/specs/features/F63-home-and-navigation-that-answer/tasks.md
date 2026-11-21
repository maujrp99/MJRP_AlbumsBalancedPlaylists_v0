<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F63: Home e navegação que respondem · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f63-home-and-navigation-answer`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f63-home-and-navigation-answer`, a partir da `main` em `d210f35`
- [x] cada issue conferida no código da `main` antes de mexer (a tabela «ainda existia?» no Problem Statement da spec, com arquivo e linha)
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
- [x] TASK-01 `router.js`: `redirect` e `setAddress`; o endereço sem tela redireciona trocando a entrada; `app.js`: as quatro rotas que só mandam adiante usam `redirect`; `test/router.history.test.js` (7 casos, todos falhavam antes) — commit `2b7b76b` · implements:: REQ-01, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-02 `SeriesController.loadScope` escreve o endereço pelo roteador (`entering` troca, a troca de escopo acrescenta); `SeriesView.mount` e `SeriesViewHandlers`; `test/controllers/SeriesController.address.test.js` — commit `2b7b76b` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-03 `test/architecture/historyOwnedByRouter.test.js`: nenhuma escrita do histórico fora do roteador, com as três exceções nomeadas — commit `2b7b76b` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-04 `models/albumQuery.js`: `parsePastedAlbumLine` e `PastedLineProblem`, sobre o `parseAlbumQuery`; tabela de 31 casos em `test/models/bulkPaste.test.js` — commit `986d1ca` · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-05 `models/bulkPaste.js` (novo, puro): `readPastedList`, `bulkInputState`, `toStagedAlbum`, `bulkOutcome`, `SkipReason`; testes no mesmo arquivo — commit `986d1ca` · implements:: REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-06 `HomeController`: `handleBulkProcess` de complexidade 15 para 4, `stageBulkEntries`, `stageBulkEntry`, `showBulkOutcome`, `validateBulkInput`; `HomeView`: `#bulkPasteReport`, `setBulkBusy`, `setBulkInputState`, `renderBulkReport`; `test/controllers/HomeController.bulk.test.js` (8 casos, 7 falhavam antes; o da caixa vazia prova a UAT-26) — commit `986d1ca` · implements:: REQ-02, REQ-03, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-07 `AuthNav`: o menu da conta com `aria-expanded`, clique, clique fora, Esc e seta para baixo; `test/components/AuthNav.menu.test.js` (7 casos) — commit `aa78dfa` · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-08 `TrackRow`: ações escondidas só onde há mouse, à vista no foco do teclado, com `aria-label`; `PlaylistGrid` sem o segundo esconde; `test/components/ui/TrackRow.touch.test.js` — commit `aa78dfa` · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-09 `BlendSeriesSelector.selectById` e `BlendingMenuView.mount(params)`: a série do endereço vem escolhida; cartões respondem ao teclado; `test/views/BlendingMenuView.fromSeries.test.js` — commit `6e26e88` · implements:: REQ-09, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-10 `algorithms/*.js`: 28 textos em português passados para o inglês (lista antes → depois nas Open Questions da spec) — commit `9fa70c8` · implements:: REQ-10 · model:: sonnet · rounds:: 1
- [x] TASK-11 `test/architecture/interfaceInEnglish.test.js`: falha em string de `public/js` em português (28 achados antes da TASK-10); `test/architecture/oneTabTitle.test.js`: o título único da F54 — commits `9fa70c8`, `d2c734e` · implements:: REQ-10 · model:: opus · rounds:: 1
- [x] TASK-12 `DialogService`: o Esc e o diálogo que toma o lugar de outro respondem «cancelar»; `test/services/DialogService.dismiss.test.js` (3 de 4 falhavam antes) — commit `d2c734e` · implements:: REQ-06 · model:: opus · rounds:: 1
- [x] TASK-13 `SeriesDropdown`: o item «Soon» não é link; `test/router.links.test.js` — commit `a4c996a` · implements:: REQ-05 · model:: opus · rounds:: 2
- [x] TASK-14 UAT-10: decidir entre ligar as telas de ranking ao serviço de carga e pôr os links, ou aposentá-las (Open Questions da spec) — decidido pelo agente na F65: aposentadas (UAT-10 em `fixed`, `c9f15ec`; a decisão segue revisável pelo MJRP) · implements:: REQ-11 · model:: opus · rounds:: 1
- [x] TASK-15 UAT-11: decidir entre remover a tela de migração (F65) e reescrevê-la (F58) antes de ligá-la ao menu (Open Questions da spec) — decidido pelo agente na F65: removida (UAT-11 em `fixed`, `c9f15ec`; a decisão segue revisável pelo MJRP) · implements:: REQ-12 · model:: opus · rounds:: 1
- [x] TASK-16 UAT-27 e o olho de detalhes da UAT-13, no código das playlists guardadas: `router.navigate('/home')` em `views/SavedPlaylistsView.js:292` (e tirar a exceção de `test/architecture/historyOwnedByRouter.test.js`); as classes do `TrackRow` em `components/playlists/SavedPlaylistRow.js:51` e `SavedPlaylistActions.js:86` — feito pelo integrador (UAT-27 em `fixed`, `df05727`; UAT-13, `aa78dfa`) · implements:: REQ-13, REQ-08 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-17 suíte (`npx vitest run`: 1233 passando, 1143 antes), `npx vite build` e complexidade até 10 nas funções novas e nas tocadas (`npx eslint --no-config-lookup --rule '{"complexity":["error",10]}'` em `router.js`, `HomeController.js`, `HomeView.js`, `models/albumQuery.js`, `models/bulkPaste.js`; `SeriesController.loadScope` fica em 10) · implements:: REQ-01, REQ-02, REQ-03, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: sonnet · rounds:: 1
- [x] TASK-18 prova no navegador pelo roteiro do relatório de entrega (criar série e voltar; volta do Spotify e voltar; colar a lista com hífen e com linha ruim; menu da conta no clique, no Esc e em 390 px; ✕ da faixa em tela de toque; «Blend your Albums» com a série marcada; receitas em inglês; itens «Soon»; Esc numa confirmação) — prova: `reports/evidence/F63/2026-11-19-home-and-navigation-proof.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-19 o passo retroativo da via rápida, a parte do agente: «Prototype: none» gravada na `spec.md` com a frase do MJRP (2026-11-20 00:10); a reconferência visual independente, por quem não implementou: `reports/audits/2026-11-19-F63-visual-parity-recheck.md` (não passou limpo: 2 P1, que viraram a UAT-217 e a UAT-218, hoje `fixed`); o código está na `main` (merges `cbd96fa`, `946fc21`, `5c3abda`) e nenhum merge traz nota de Touch ID (não há nota `mjrp-visual-ok` no repositório), então o olhar dele na tela fica na marca `needs_human` da spec, não numa tarefa · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-20 barra do topo: a imagem do título com fundo transparente; os nomes com a regra `navigation/barName.js` e o nome inteiro em `title` · implements:: REQ-14 · model:: opus · rounds:: 1
- [x] TASK-21 a barra do topo cabe na tela (UAT-218): os nomes encolhem (`min-w-0` da barra até o nome), a barra vai a 1400 px a partir de 1280, o botão do Spotify vira ícone abaixo de 1280, o menu lateral vale até 1024; visto a 375, 800, 1024, 1280 e 1440 px sem rolagem horizontal · evidência: `reports/evidence/F63/2026-11-19-top-bar-fits.md` · implements:: REQ-15 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/behavior.md` (12 estados reescritos e 4 novos) e `docs/manual/` (00 mapa de arquivos, 08, 11, 13, 15, 17, 19, 21 seção 1.2, 24, 29, 99) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia

## For the owner at UAT
- Decisões tomadas por agente na F65 e revisáveis: as telas de ranking (UAT-10) e a tela de migração (UAT-11) saíram em vez de serem ligadas ao menu (Open Questions da spec).
- O MJRP julga as palavras traduzidas e os textos novos, o menu da conta que não abre mais ao passar o mouse, a caixa de colagem que fica com as linhas a corrigir
- O olhar dele na tela é a marca `needs_human` da spec; o aceite é dele no UAT.
