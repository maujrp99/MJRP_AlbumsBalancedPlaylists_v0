<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F61: Playlists guardadas em poucos segundos · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f61-saved-playlists-fast`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f61-saved-playlists-fast`, a partir da `main` em `c72dcc2`
- [x] causa lida no código antes de mexer: cada leitura da rota até o primeiro desenho, com arquivo e linha, na seção «Diagnóstico» do plano; a contagem de antes medida com o banco falso (48 leituras, 1 no ar)
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
- [x] TASK-01 `test/helpers/fakeFirestore.js`: contagem de leituras (`fake.reads()`), quantas no ar ao mesmo tempo (`fake.maxReadsAtOnce()`) e falha de leitura por caminho — commit `7547b0e` · implements:: REQ-01 · model:: sonnet · rounds:: 1
- [x] TASK-02 `public/js/models/savedPlaylists.js` e `test/models/savedPlaylists.test.js`: estados, lotes, totais do cartão, ordem de leitura e origem das capas, sem importar nada — commit `7547b0e` · implements:: REQ-02, REQ-03, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/stores/savedPlaylists.js`: o estado da lista e de cada série, só guardado — commit `7547b0e` · implements:: REQ-03, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-04 `public/js/services/playlists/SavedPlaylistsReader.js` com `test/services/playlists/SavedPlaylistsReader.test.js` e `SavedPlaylistsReader.reads.test.js` (o teste de aptidão: 1 + N leituras, 8 no ar, 7 esperas para 47 séries): carga com geração, senha por série, fila com limite e prazo, releitura de uma série, os dois apagamentos, o que já foi lido mantido, capas — commit `7547b0e` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 2
- [x] TASK-05 `public/js/services/playlists/adapters/RepositoryPlaylistsSource.js` e `public/js/services/playlists/savedPlaylistsReading.js`: a porta servida pelos repositórios e a composição — commit `7547b0e` · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/components/playlists/SavedPlaylistsController.js` e `test/components/playlists/SavedPlaylistsController.test.js`: pede ao leitor e entrega o que o store tem; sem repositório — commit `7547b0e` · implements:: REQ-05, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/views/SavedPlaylistsView.js` e `test/views/SavedPlaylistsView.test.js`: `mount` sem espera, escuta do store, um grupo redesenhado só quando muda, linha de estado, avisos de falha com «Try again», `destroy` que para de escutar — commit `7547b0e` · implements:: REQ-02, REQ-03, REQ-04 · model:: opus · rounds:: 2
- [x] TASK-08 `SavedSeriesGroup.js`, `SavedPlaylistCard.js` e `SavedPlaylistRow.js`: o aviso de falha na série; as playlists do lote e as faixas da playlist construídas na primeira abertura — commit `7547b0e` · implements:: REQ-03, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-09 `test/architecture/savedPlaylistsBoundaries.test.js`: as fronteiras de importação do desenho como teste — commit `7547b0e` · implements:: REQ-08 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-10 suíte (`npx vitest run`: 1046 passando, 982 antes), `npx vite build` e complexidade até 10 nas funções novas (`npx eslint --rule 'complexity: ["error", 10]'` nos arquivos tocados) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: sonnet · rounds:: 1
- [x] TASK-11 prova no navegador com a conta do MJRP, com o tempo medido pelo roteiro do relatório de entrega: tempo até a primeira série e até a lista inteira (antes: 20,1 s e 19,9 s), volta à tela, «Try again» numa série com a rede cortada, apagar um lote sem reler a lista, abrir um lote e uma playlist — prova: `reports/evidence/F61/2026-11-19-saved-playlists-timing.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [ ] TASK-12 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra. É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F61-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-01 · model:: opus

## Documentation
- [x] `docs/specs/arch.md` (seção «Leitura das playlists guardadas»), `docs/specs/behavior.md` (os estados da tela) e `docs/manual/` (00, 01, 06, 09, 14, 17, 21, 24, 29, 99 e a lista de regressão) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia

## For the owner at UAT
- O MJRP julga os textos novos, o limite de 8 leituras juntas e a lista que aparece na hora ao voltar
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
