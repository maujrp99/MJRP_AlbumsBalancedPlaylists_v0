# Tasks — Feature F45: A tela de álbuns carrega vários álbuns ao mesmo tempo, com prazo, e as séries do topo primeiro · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f45-albums-load-in-parallel` (os ramos da F47 e da F51 foram empilhados sobre ele)
- [x] proposta de arquitetura escrita no `docs/specs/arch.md` e criticada duas vezes antes do serviço e da store (2026-11-19 11:23 a 11:31)
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
- [x] TASK-01 `public/js/utils/TaskQueue.js`: fila com limite, prioridade, prazo e cancelamento — teste escrito antes, 12 de 12 passam · implements:: REQ-01, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/models/albumLoadState.js`: as regras puras de estado do álbum e da série — 15 testes; nasceu em `services/albums/loadState.js` e foi movida para `models/`, porque a store não pode importar `services/` · implements:: REQ-08 · model:: opus · rounds:: 2
- [x] TASK-03 `public/js/stores/albumLoad.js` e `public/js/models/cloneAlbum.js`: a store única da carga e a cópia do álbum — 10 testes da store · implements:: REQ-08, REQ-09 · model:: opus · rounds:: 1
- [x] TASK-04 `public/js/services/albums/AlbumLoadService.js`: o dono da carga, com gerações, reconciliação, achar separado de enriquecer, `retryFailed`, `stop`, `whenIdle` — 18 testes com dublês das fontes · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-09, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/services/albums/adapters/CatalogAdapter.js` e `public/js/models/albumQuery.js`: o catálogo sobre a Apple Music, com o servidor como segunda fonte — a primeira medição, com 6 buscas, levou a Apple a responder 429; corrigido para 3 por vez, nova tentativa com espera crescente, e a falha da Apple não cai mais na segunda fonte · implements:: REQ-01, REQ-06 · model:: opus · rounds:: 2
- [x] TASK-06 `public/js/services/albums/adapters/enrichers.js`: notas, popularidade e ranking pessoal, cada um devolvendo um álbum novo; `applyBEAData` exportada em `helpers/BEAEnrichmentHelper.js` · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/services/albums/adapters/AlbumCacheAdapter.js`: o guardado por pedido, base mais um registro por fonte, «vazio» por 1 hora, ranking pessoal nunca guardado · implements:: REQ-10 · model:: opus · rounds:: 1
- [x] TASK-08 `public/js/services/albums/albumLoading.js` e `setAlbumsBySeries` em `public/js/stores/albums.js`: a composição das fontes e a projeção na prateleira que as outras telas leem · implements:: REQ-01, REQ-09 · model:: opus · rounds:: 1
- [x] TASK-09 `public/js/controllers/SeriesController.js`: sai o laço de carga (647 → 405 linhas); o controlador pede ao serviço, reconcilia e desfaz as inscrições da visita anterior · implements:: REQ-04, REQ-09 · model:: opus · rounds:: 1
- [x] TASK-10 `public/js/components/series/SeriesGridRenderer.js` e `SeriesEventHandler.js`: a série desenhada pelo estado derivado, o aviso «N albums did not load. Try again» e a ação `retry-series` · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-11 `CatalogAdapter.js`: carregar pela edição escolhida (`appleMusicId`), numa chamada só — 32 dos 196 identificadores responderam 404; corrigido para cair na busca por nome na hora (feito no commit da F47, `5e98488`) · implements:: REQ-07 · model:: opus · rounds:: 2
- [x] TASK-12 `AlbumLoadService.js`: fila própria para as fontes rápidas (`sourceConcurrency: 6`), depois que a carga de 217 álbuns mostrou as fontes rápidas disputando as vagas do catálogo (feito no commit da F47, `5e98488`) · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-13 `LOAD_LIMITS.slowConcurrency` de 2 para 4, medido com 45 séries: 31 notas em 60 s, contra cerca de 20 com 2 (commit `4fe722c`) · implements:: REQ-05 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-14 suíte inteira (`npx vitest run`): 189 passam, 28 falham nos mesmos 9 arquivos da linha de base; nenhuma regressão nova · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-08, REQ-09, REQ-10 · model:: sonnet · rounds:: 1
- [x] TASK-15 medição no navegador, guardado apagado, 20 séries e 80 álbuns: os 80 aos 8,5 s; sair e voltar mantém 20 blocos e 80 álbuns — a primeira tentativa terminou com 5 séries em aviso de falha (429), a segunda passou; `reports/evidence/F45-albums-load-in-parallel/F45-probe-after-2026-11-19.json` · implements:: REQ-01, REQ-06, REQ-09 · model:: opus · rounds:: 2
- [x] TASK-16 medição no navegador com 45 séries e 217 álbuns: tudo resolvido aos 31 s, nenhum 429; `reports/evidence/F47-series-list-without-cut/F47-probe-2026-11-19.json` · implements:: REQ-05, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-17 conferir no navegador o que só tem teste com dublê: clicar em «Try again» numa série com falha e medir a segunda visita, com o guardado cheio — prova: `reports/evidence/F45-albums-load-in-parallel/F45-desktop-failure-notice-2026-11-19.jpg`, `reports/evidence/F45-albums-load-in-parallel/F45-probe-after-2026-11-19.json` · implements:: REQ-08, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-18 o que a trava do passo retroativo cobrava antes do `Done` (conferido em 2026-11-21): behavior: `docs/specs/behavior.md` (`^library-loading-skeleton`) agora diz, neste commit, o teto de buscas, a ordem das séries e os prazos de `LOAD_LIMITS` (o resto já estava no commit `d9e6103`, da v4.0). Reconferência visual: relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`, em 2026-11-21 (veredito do lote `fail`, sem P0; sem achado desta feature: cada série desenha a sua parte quando chega, sem bloco cinza de página inteira; o tempo de carga não se vê num harness) · implements:: REQ-01 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/manual/` atualizado na área tocada (06, 07, 07b, 08, 09, 11, 17, 19, mapa de arquivos) — commit `12713e2`, 2026-11-19 12:34
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [x] `docs/specs/arch.md`: pôr na proposta o que mudou ao construir (aviso de falha na F45, teto 4 das notas, fila das fontes rápidas, carga pela edição escolhida, falha da Apple sem segunda fonte) e escrever a ADR da seção 14 — a proposta e a ADR-0019 dizem o que mudou ao construir (`arch.md`, tabela da carga; `docs/decisions/0019-one-owner-for-the-album-load.md`)
- [x] `docs/specs/behavior.md`: corrigir `^library-loading-skeleton` e registrar o estado «série com aviso de falha» — os estados «Álbum que não carregou» e «Carregando os álbuns» estão em `behavior.md`
- [x] levar o ramo à `main` — feito: ramo mergeado na `main` local (`f295316`)

## For the owner at UAT
- O MJRP confere no navegador e dá o OK na UAT-172.
- resposta do MJRP à decisão 1 da proposta (a carga não regrava mais a coleção `albums`)
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
- Push da `main` ao remoto (e, com ele, a primeira rodada da automação do GitHub): é do MJRP.
