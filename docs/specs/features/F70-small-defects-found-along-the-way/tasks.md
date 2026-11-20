<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F70: Defeitos pequenos achados no caminho da v5.0 · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19 (via rápida: os documentos foram escritos no mesmo ramo, depois do código). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado da `main` local (com o commit `44b5dd0`): `fix/f70-small-defects`
- [x] lidos o `AGENTS.md`, a pasta da F70 e as issues UAT-208, 209, 210 e 63; cada defeito conferido no código de hoje antes do conserto
- [ ] conferência cruzada da spec e do plano: fica para o fecho, porque os dois foram escritos depois do código

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
- [x] TASK-01 `public/js/api/paidRoutes.js` (quem pode usar as rotas pagas) e os dois chamadores, `services/album-search/AlbumSearchService.js` e `api/client.js`: o visitante não pede; `_fetchAlbumFromAPI` dividida — commit `66d10bd`, `test/api/paidRoutes.test.js` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `services/inventory/InventoryService.js` `updatePrice` mantém a moeda do item; `controllers/InventoryController.js` `handleUpdatePrice` avisa a falha; chave `sorting` duplicada removida — commit `3562fb2`, `test/services/inventory/InventoryService.price.test.js`, `test/controllers/InventoryController.price.test.js` · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/models/ratingsOutcome.js` e `api/client.js` `normalizeAlbumData`: o desfecho de cada fonte segue no álbum e a página de notas só fica quando veio `found`; `normalizeAlbumData` dividida — commit `3012df5`, `test/api/generateRatingsOutcome.test.js` · implements:: REQ-03 · model:: opus · rounds:: 2
- [x] TASK-04 `public/js/components/ui/coverImage.js` e os seis lugares que desenham capa; `onerror` do HTML removido de `AlbumCascade.js` — commit `ae13bca`, `test/components/ui/coverImage.test.js` · implements:: REQ-04 · model:: opus · rounds:: 1

## Verification
- [x] TASK-05 suíte inteira (`npx vitest run`) verde e `npx vite build` compilando no ramo, com os testes de arquitetura (complexidade até 10, nenhum módulo morto, camadas) · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: sonnet · rounds:: 1
- [ ] TASK-06 prova no navegador, do integrador: como visitante numa segunda origem (nenhum pedido a `/api/ai/*` nem a `/api/generate`; status «→ artista») e com a conta do dono (os pedidos saem; uma capa com endereço quebrado mostra o substituto) · implements:: REQ-01, REQ-04 · model:: opus · waiting:: resource — a prova pede um navegador, que o auxiliar que implementou não tem · action:: o integrador segue os passos do relatório de entrega do ramo, depois de integrá-lo
- [ ] TASK-07 julgamento do MJRP (tarefa do humano) · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: opus · waiting:: human — o aceite das issues é do MJRP · action:: o MJRP confere as quatro issues e julga o substituto único de capa

## Documentation
- [x] `docs/specs/behavior.md`: `^home-scan-classifying` e `^library-album-failed` (visitante), `^inventory-price-keeps-currency`, `^library-ai-album-ratings`, `^album-cover-stand-in`
- [x] manual: `03_Backend_API_Layer.md`, `07_Frontend_Data_Infra.md`, `08_Frontend_Models.md`, `13_Frontend_Components_Shared.md`, `19_Frontend_JS_Root.md`, `21_Dynamic_UI_Mapping.md`, `99_Frontend_Component_Reference_Sheet.md`, `00_Dir_File_Structure_Map.md`
- [x] spec, plano e tarefas escritos do que foi feito (2026-11-19)
- [ ] status das issues em `docs/specs/uat.md` e o `MEMORY.md`: do integrador, depois da prova no navegador
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde; só então `status: Done` (depende do aceite do MJRP)
