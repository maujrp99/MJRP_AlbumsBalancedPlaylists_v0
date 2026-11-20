<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F67: O Scan da Home responde ao clique · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f67-home-scan-answers`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f67-home-scan-answers`, a partir da `main` em `a5fdf5a`
- [x] causa lida no código antes de mexer: cada caminho em que o clique termina sem resposta visível, com arquivo e linha, na seção Problem Statement da spec; o defeito do roteador reproduzido em teste
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
- [x] TASK-01 `public/js/utils/deadline.js` e `test/utils/deadline.test.js`: promessa com prazo e a falha com nome — commit `4b6aa73` · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/models/scanState.js` e `test/models/scanState.test.js`: estados, transições com geração, contagem por tipo e os textos da tela — commit `4b6aa73` · implements:: REQ-01, REQ-02, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-03 `AlbumSearchService.scanArtist` com o prazo do catálogo e a lista da IA depois da primeira classificação; `test/services/album-search/AlbumSearchService.scan.test.js` — commit `4b6aa73` · implements:: REQ-03, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-04 `MusicKitAuth.init` com prazo, identidade do início e o script que já carregou; `test/services/musickit/MusicKitAuth.deadline.test.js` — commit `4b6aa73` · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-05 `SearchController` como dono do estado e `HomeView.renderScan` como único desenho; sem `alert`; «Try again»; comandos delegados que leem o campo na hora; `test/components/home/SearchController.scan.test.js` — commit `4b6aa73` · implements:: REQ-01, REQ-02, REQ-04, REQ-05, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-06 `router.js` `renderView` com identidade por mudança de endereço; `test/router.overlap.test.js` (6 de 7 casos falhavam antes) — commit `4b6aa73` · implements:: REQ-06 · model:: opus · rounds:: 1
- [x] TASK-07 `HomeController`: `dispose` e `toast.warning` no lugar de `toast.warn`, que não existe — commit `4b6aa73` · implements:: REQ-02 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-08 suíte (`npx vitest run`: 982 passando, 919 antes), `npx vite build` e complexidade até 10 nas funções novas (`npx eslint --rule '{"complexity":["error",10]}'` nos arquivos tocados) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07 · model:: sonnet · rounds:: 1
- [x] TASK-09 prova no navegador pelo roteiro do relatório de entrega (clique com resposta na hora, dois cliques, catálogo travado pelo console até «Try again», sem resultados, artista eletrônico com a lista da IA chegando depois, volta do `/album-series` com a tela respondendo) — prova: `reports/evidence/F67/2026-11-19-home-scan-browser-proof.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [ ] TASK-10 o passo retroativo da via rápida: «Prototype: none» dito pelo MJRP e o ok visual dele (Touch ID no merge) · implements:: REQ-01 · model:: opus · waiting:: human — o protótipo e o ok visual são do MJRP · action:: o MJRP diz «Prototype: none» para os consertos e dá o ok visual no merge

## Documentation
- [x] `docs/specs/behavior.md` (os estados da busca da Home e a tela sempre montada) e `docs/manual/` (14, 16, 19, 20, 21, 22) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia

## For the owner at UAT
- O MJRP julga os prazos e os textos novos
- Fecha quando o MJRP disser «Prototype: none» e der o ok visual (passo retroativo da via rápida); depois, o aceite é dele no UAT.
