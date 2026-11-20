# Tasks — Feature F46: Cada série termina carregada, vazia ou com aviso de falha, e nada some durante a carga · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). As duas primeiras foram entregues por outras features e estão aqui para a feature contar a sua história inteira. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico).

## Pre-Implementation
- [x] ramo criado: `fix/f46-albums-load-state`, cortado da `main` local (`23d81d7`)
- [x] conferido no código o que a F45 e a F51 já tinham entregue desta feature (estado por série, aviso com «Try again», página inteira, inscrições desfeitas a cada visita)
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

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
- [x] TASK-10 conferência no navegador, conta do MJRP: sair e voltar no meio da carga; «Try again»; salvar um ranking; «My Ranking» com uma página carregada (sessão de integração) — prova: `reports/evidence/F46-albums-load-state/F46-browser-2026-11-19.json`, `reports/evidence/F46-albums-load-state/F46-ranking-2026-11-19.json` · implements:: REQ-02, REQ-03, REQ-04, REQ-05, REQ-06 · model:: opus · rounds:: 1
- [ ] TASK-11 o passo retroativo da via rápida: «Prototype: none» dito pelo MJRP e o ok visual dele (Touch ID no merge) · implements:: REQ-01 · model:: opus · waiting:: human — o protótipo e o ok visual são do MJRP · action:: o MJRP diz «Prototype: none» para os consertos e dá o ok visual no merge

## Documentation
- [x] `docs/specs/arch.md` seção 18; `docs/manual/` (06, 08, 09, 12, 16, 17, mapa de arquivos, `regression_checklist`); spec, plano e tarefas escritos do que foi feito
- [x] `docs/specs/uat.md`: UAT-173 e UAT-174 em `fixed` depois da conferência no navegador (sessão de integração) — UAT-173 e UAT-174 estão em `fixed`
- [x] levar o ramo à `main` — feito: ramo mergeado na `main` local (`40ca80d`)

## For the owner at UAT
- O MJRP confere no navegador e dá o OK na UAT-173 e na UAT-174.
- Fecha quando o MJRP disser «Prototype: none» e der o ok visual (passo retroativo da via rápida); depois, o aceite é dele no UAT.
- Push da `main` ao remoto (e, com ele, a primeira rodada da automação do GitHub): é do MJRP.
