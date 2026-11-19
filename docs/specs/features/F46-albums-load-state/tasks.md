# Tasks — Feature F46: Cada série termina carregada, vazia ou com aviso de falha, e nada some durante a carga · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). As duas primeiras foram entregues por outras features e estão aqui para a feature contar a sua história inteira. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico).

## Pre-Implementation
- [x] ramo criado: `fix/f46-albums-load-state`, cortado da `main` local (`23d81d7`)
- [x] conferido no código o que a F45 e a F51 já tinham entregue desta feature (estado por série, aviso com «Try again», página inteira, inscrições desfeitas a cada visita)
- [ ] conferência cruzada da spec e do plano: fica para o fecho, porque os dois foram escritos depois do código

## Implementation
- [x] TASK-01 (entregue pela F45) `models/albumLoadState.js`, `stores/albumLoad.js`, `SeriesGridRenderer.js`: o estado da série derivado, a grade desenhada por ele, o aviso «N albums did not load · Try again» e `AlbumLoadService.retryFailed` · implements:: REQ-01, REQ-02 · model:: opus · rounds:: 1
- [x] TASK-02 (entregue pela F51) `SeriesGridRenderer.js` e `SeriesViewUpdater.js`: a página desenhada inteira, sem o truque das três primeiras séries · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/services/albums/AlbumLoadService.js`: `refreshSource(albumId, source)` e o trabalho de cada álbum encadeado em `_runChain` — 5 testes novos · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-04 `public/js/models/ownRanking.js`: o casamento entre ranking e pedido como função pura — 22 testes · implements:: REQ-06 · model:: opus · rounds:: 2
- [x] TASK-05 `public/js/stores/ownRankings.js`, `public/js/services/ranking/OwnRankingService.js` e `ownRanking.js`: o dono do ranking pessoal no cliente, com leitura única e portas injetadas — 10 testes · implements:: REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/components/ranking/UserRankModal.js` e `public/js/components/series/SeriesEventHandler.js`: o modal salva por `onSubmit` e não importa o repositório; a tela deixa de mutar o álbum publicado — 3 testes · implements:: REQ-05, REQ-07 · model:: opus · rounds:: 2
- [x] TASK-07 `public/js/controllers/SeriesController.js` e `public/js/views/SeriesView.js`: `saveRanking`, «My Ranking» sobre todas as séries, `detachView` ao fechar a tela — 15 testes do controlador · implements:: REQ-02, REQ-04, REQ-05, REQ-06 · model:: opus · rounds:: 2
- [x] TASK-08 `test/architecture/ownRankingBoundaries.test.js`: 7 funções de aptidão (modal, serviço, store, tela, quem alcança o repositório, texto sem escape fora de gabarito HTML) · implements:: REQ-07 · model:: opus · rounds:: 2

## Verification
- [x] TASK-09 suíte inteira (`npx vitest run`): 337 passam, as mesmas 28 falhas da linha de base; `npx vite build` compila · implements:: REQ-01, REQ-02, REQ-04, REQ-05, REQ-06, REQ-07 · model:: sonnet · rounds:: 1
- [ ] TASK-10 conferência no navegador, conta do MJRP: sair e voltar no meio da carga; «Try again»; salvar um ranking; «My Ranking» com uma página carregada (sessão de integração) · implements:: REQ-02, REQ-03, REQ-04, REQ-05, REQ-06 · model:: opus
- [ ] TASK-11 julgamento do MJRP no navegador (tarefa do humano); a UAT-173 e a UAT-174 seguem abertas até lá · implements:: REQ-01, REQ-02, REQ-04 · model:: opus

## Documentation
- [x] `docs/specs/arch.md` seção 18; `docs/manual/` (06, 08, 09, 12, 16, 17, mapa de arquivos, `regression_checklist`); spec, plano e tarefas escritos do que foi feito
- [ ] `docs/specs/uat.md`: UAT-173 e UAT-174 em `fixed` depois da conferência no navegador (sessão de integração)
- [ ] levar o ramo à `main` (push e aceite são do MJRP)
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde; só então `status: Done`
