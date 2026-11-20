<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F57: Uma peça só para escolher álbuns de um artista · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f57-one-album-picker-and-one-classifier`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f57-one-album-picker-and-one-classifier`, a partir da `main` em `89ff06c`
- [x] problema estabelecido antes de mexer: os dois fluxos de ponta a ponta com arquivo e linha, a tabela de diferenças e a causa do caso do Kendrick Lamar reproduzida em teste com o classificador antigo (seção «O problema, estabelecido antes do código» do plano)
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
- [x] TASK-01 `public/js/models/albumType.js` e `test/models/albumType.test.js`: o classificador puro, os tipos, os motivos, a definição única de «eletrônico»; os dois álbuns do Kendrick Lamar, deluxe, EP, single, ao vivo, compilação, trilha sonora, eletrônico com e sem a lista da IA · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 2
- [x] TASK-02 `services/album-search/AlbumSearchService.js`: `scanArtist` com o classificador novo, `_classifyAll` síncrono com `typeReason`, `getArtistDiscography` e o resto morto fora, chave de agrupamento para qualquer alfabeto; os dois testes do serviço com álbuns em forma de catálogo · implements:: REQ-02, REQ-04, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/models/albumPicker.js` e `test/models/albumPicker.test.js`: filtros, contagem, ordem, selos; a contagem sai de `models/scanState.js` · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-04 `components/album-picker/AlbumPickerController.js` e `pickerParts.js`: a peça, a porta de três métodos, a costura `onPick`, as partes desenhadas · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-05 Home sobre a peça: `controllers/HomeController.js`, `views/HomeView.js`, `views/renderers/DiscographyRenderer.js`; `SearchController.js` removido; o teste da busca da Home passa a montar a Home de verdade (`test/components/home/HomePicker.scan.test.js`) · implements:: REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/models/seriesDraft.js` e `test/models/seriesDraft.test.js`: o estado do salvamento, os textos, o álbum já na lista · implements:: REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-07 Edição de série sobre a peça: `components/album-picker/AlbumPickerPanel.js`, `components/series/SeriesEditModal.js` como classe, salvar com resposta; `ArtistScanner.js` removido; `test/components/series/SeriesEditModal.test.js` · implements:: REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-08 `test/architecture/oneAlbumPicker.test.js`: um classificador, um caminho de busca, uma peça · implements:: REQ-01, REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-09 remover o que ficou morto: `AlbumTypeClassifier.js`, `classification/*`, `EditionFilter.js`, `types.js`, `search/DiscographyToolbar.js`, `search/VariantPickerModal.js`, `test/scripts/test_classification_logic.js`; os dois testes que os nomeavam acertados · implements:: REQ-01, REQ-05 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-10 suíte (`npx vitest run`: 1521 passando, 1417 antes), `npx vite build` e complexidade até 10 nas funções novas e editadas (`npx eslint --rule '{"complexity":["error",10]}'` nos arquivos tocados; a única acima é `AlbumSearchService.search`, 11, de antes e não tocada) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: sonnet · rounds:: 1
- [x] TASK-11 prova no navegador pelo roteiro do relatório de entrega (o mesmo artista na Home e na janela «Edit Series»: filtros, quantidades e cartões iguais; os dois álbuns do Kendrick Lamar em «Studio»; um artista eletrônico com a lista da IA chegando depois; falha com «Try again»; «Saving…» ao salvar) — prova: `reports/evidence/F57/2026-11-19-one-picker-one-classifier-proof.md` · implements:: REQ-02, REQ-04, REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [ ] TASK-12 o passo retroativo da via rápida: «Prototype: none» dito pelo MJRP e o ok visual dele (Touch ID no merge) · implements:: REQ-01 · model:: opus · waiting:: human — o protótipo e o ok visual são do MJRP · action:: o MJRP diz «Prototype: none» para os consertos e dá o ok visual no merge

## Documentation
- [x] `docs/specs/arch.md` (seção nova), `docs/specs/behavior.md` (os estados da busca nas duas telas, o classificador, o salvamento) e `docs/manual/` (00, 01, 10, 14, 15, 16, 21, 22, 29) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia

## For the owner at UAT
- O MJRP julga as mudanças de comportamento do classificador e a aparência nova da busca na janela de edição
- `docs/specs/constitution.md`, artigo dos padrões: a linha do Strategy (`DP-04`) ainda cita `public/js/services/album-search/classification/`, pasta que saiu; a constituição tem cópia gerada (`.specify/memory/constitution.md`) e a emenda é de quem a regenera (integrador, com o MJRP)
- Fecha quando o MJRP disser «Prototype: none» e der o ok visual (passo retroativo da via rápida); depois, o aceite é dele no UAT.
