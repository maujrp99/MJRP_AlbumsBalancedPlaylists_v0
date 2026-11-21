# Tasks — Feature F48: O guardado de álbuns é confiável: nova tentativa, sem gravar à toa, e o Clear Cache limpa de verdade · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19. Cada conserto teve o teste escrito antes, visto falhar no código antigo, e depois passar. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f48-album-cache-and-retry`, cortado da `main` local (`23d81d7`)
- [x] linha de base medida: `npx vitest run` com 232 passando e 28 falhando em 9 arquivos antigos, mais 8 arquivos de `test/e2e/` sem suíte
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
- [x] TASK-01 `public/js/utils/retry.js`: nova tentativa com recuo exponencial, variação e teto, sem conhecer o projeto — 6 testes em `test/utils/retry.test.js` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/api/client.js`: `ApiError`, `_postGenerate` com prazo de 90 s, e `_fetchAlbumFromAPI` com o texto do pedido fora do `try` e nova tentativa só em falha de rede ou 5xx — 9 testes em `test/api/client.test.js` · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/services/albums/adapters/CatalogAdapter.js`: o motivo da falha da segunda fonte vai ao console em vez de sumir · implements:: REQ-03 · model:: sonnet · rounds:: 1
- [x] TASK-04 `public/js/repositories/UserRankingRepository.js`: a instância do cache por injeção, validade de 1 hora, «sem ranking» guardado, esquecimento ao salvar e ao apagar — 8 testes em `test/repositories/UserRankingRepository.test.js` · implements:: REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/services/albums/clearAlbumCaches.js` e a ligação `clearAppAlbumCaches` em `public/js/services/albums/albumLoading.js`: para a carga, limpa o cache, remove as chaves antigas de álbum — 5 testes em `test/services/albums/clearAlbumCaches.test.js` · implements:: REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/cache/CacheManager.js`: `clear()` falha quando o IndexedDB não limpa — 2 testes em `test/cache/CacheManager.clear.test.js` · implements:: REQ-06, REQ-08 · model:: opus · rounds:: 2
- [x] TASK-07 `public/js/components/Footer.js` e `public/js/app.js`: o botão chama a limpeza injetada, não apaga o `localStorage`, avisa a falha — 3 testes em `test/components/Footer.test.js` · implements:: REQ-06, REQ-07, REQ-08 · model:: opus · rounds:: 2
- [x] TASK-08 `public/js/repositories/SharedAlbumRepository.js`: a gravação na coleção `albums`, sem o ranking pessoal — 5 testes em `test/repositories/SharedAlbumRepository.test.js` · implements:: REQ-09, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-09 `public/js/services/SeriesService.js` e `public/js/stores/albums.js`: o «Refetch» grava pelo repositório; saem `saveToFirestore`, `loadFromFirestore`, `updateAlbum(db, album)` e o `import` do Firestore da store; `test/services/SeriesService.test.js` atualizado (2 casos) · implements:: REQ-10 · model:: opus · rounds:: 1
- [x] TASK-10 `test/architecture/albumLoadBoundaries.test.js`: `stores/albums.js` fora de `KNOWN_EXCEPTIONS` (de três para dois arquivos) · implements:: REQ-10 · model:: sonnet · rounds:: 1
- [x] TASK-11 removidos com `git rm`: `public/js/views/controllers/AlbumsStateController.js` (morto: só o importava `public/legacy/AlbumsView_DEPRECATED.js`) e esse arquivo legado (sem quem o importe) · implements:: REQ-10 · model:: sonnet · rounds:: 1
- [x] TASK-12 passar o «Refetch Metadata» pela fila da carga (`arch.md`, seção 15, linha «Refetch Metadata»): hoje ele roda em `SeriesService.refetchAlbumMetadata`, fora da fila, e só depois entrega o álbum à carga — feito na F56: o «Refetch» passa pela fila e pelo estado do serviço (REQ-07 da F56; merge `042da86`) · implements:: REQ-10 · model:: opus · rounds:: 1

## Verification
- [x] TASK-13 suíte inteira (`npx vitest run`): 271 passam, as mesmas 28 falhas da linha de base, nenhuma nova; `npx vite build` compila · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: sonnet · rounds:: 1
- [x] TASK-14 conferência no navegador, conta do MJRP, pela sessão de integração: nova tentativa (servidor fora), segunda visita sem leitura de ranking por álbum, «Clear Cache» que refaz a busca e mantém o Spotify, «Refetch» que grava sem o ranking pessoal — prova: `reports/evidence/F48-album-cache-and-retry/F48-browser-2026-11-19.json` · implements:: REQ-01, REQ-04, REQ-06, REQ-07, REQ-09 · model:: opus · rounds:: 1
- [ ] TASK-15 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): behavior: o plan.md declara `behavior.md` «atualizado», mas nenhum commit da feature toca docs/specs/behavior.md; Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra; Issues: a feature conserta UAT-175, UAT-176, UAT-177 e nenhum commit dela toca docs/specs/uat.md (a issue `fixed`, com a evidência). É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F48-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-01 · model:: opus

## Documentation
- [x] `docs/manual/` (00, 06, 07, 07b, 08, 11, 19, 98 e o `regression_checklist`), `docs/specs/data-model.md` (o que se grava em `albums`) e `docs/specs/arch.md` (seção 17 e o achado do Firestore fora dos repositórios)
- [x] spec, plano e tarefas preenchidos (passo retroativo, 2026-11-19)
- [x] `docs/specs/uat.md`: passar UAT-175, UAT-176 e UAT-177 a `fixed` depois do merge (sessão de integração); a UAT-14 segue aberta, com dois arquivos na lista — UAT-175, UAT-176 e UAT-177 estão em `fixed`
- [x] levar o ramo à `main` — feito: ramo mergeado na `main` local (`40ca80d`)

## For the owner at UAT
- O MJRP julga no navegador, com as duas perguntas abertas da spec, e dá o OK na UAT-175, na UAT-176 e na UAT-177.
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
- Push da `main` ao remoto (e, com ele, a primeira rodada da automação do GitHub): é do MJRP.
