# Tasks — Feature F51: Filtros que valem para todas as séries, busca que deixa digitar e paginação na tela de álbuns · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] desenho escrito na seção 16 da proposta, no `docs/specs/arch.md`, depois da escolha do MJRP pela opção C (2026-11-19 11:57)
- [x] protótipo com as duas formas de paginação (`design/inception/albums-paging-v1.html`) visto pelo MJRP, que ficou com as duas, por série, de 10 a 100 por página (2026-11-19 12:01)
- [x] ramo criado: `fix/f51-album-filters-search-and-paging`, empilhado sobre o da F47
- [ ] conferência cruzada da spec e do plano: fica para o fecho, porque os dois foram escritos depois do código

## Implementation
- [x] TASK-01 `public/js/models/seriesFilter.js`: os filtros como função pura sobre os pedidos das séries (série, artista, ano, fonte, busca) e a lista de artistas — 14 testes · implements:: REQ-01, REQ-02, REQ-07, REQ-09 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/models/paging.js`: páginas numeradas e lista que cresce, por série, de 10 a 100 — 7 testes · implements:: REQ-04, REQ-05, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/models/albumFacts.js` e `public/js/services/series/SeriesFactsService.js`: o ano e as fontes de cada álbum gravados no pedido, só a diferença, quando a série termina de carregar — 7 testes · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-04 `saveAlbumFacts` em `public/js/repositories/SeriesRepository.js`, `setAlbumQueries` em `public/js/stores/albumSeries.js` e a ligação em `public/js/services/albums/albumLoading.js`: a gravação dos fatos, sem mexer em `updatedAt` · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/components/ui/Pager.js`: a contagem, o tamanho da página, a troca de forma, os botões de página e «Load N more» · implements:: REQ-04, REQ-05, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/controllers/SeriesController.js`: a visão da página (`getPageView`), os comandos de paginação e o pedido de carga só das séries da página · implements:: REQ-01, REQ-04, REQ-05, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/components/ui/FilterToolbar.js`: o campo de busca desenhado uma vez; os outros controles atualizados só quando mudam · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-08 `SeriesView.js`, `SeriesComponentFactory.js`, `SeriesViewUpdater.js` e `SeriesGridRenderer.js`: o paginador na tela, a lista de artistas saindo das séries e a página desenhada inteira, sem o truque das três primeiras séries · implements:: REQ-02, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [ ] TASK-09 achar quem grava o pedido com «&amp;» no lugar de «&», corrigir a gravação e o pedido já gravado («Jimmy Page &amp; Robert Plant - No Quarter») · implements:: REQ-10 · model:: opus

## Verification
- [x] TASK-10 suíte inteira (`npx vitest run`): 223 passam, as mesmas 28 falhas da linha de base · implements:: REQ-01, REQ-02, REQ-04, REQ-05, REQ-07, REQ-08, REQ-09 · model:: sonnet · rounds:: 1
- [x] TASK-11 conferência no navegador, conta do MJRP (45 séries, 217 pedidos): 10 de 45 na primeira página e 5 páginas; «robert plant» digitado de uma vez mantém o foco e traz quatro séries de outras páginas; página 2 sem bloco cinza; a rolagem cresce de 10 em 10; 67 de 217 pedidos com `facts` depois de três páginas; `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: opus · rounds:: 1
- [ ] TASK-12 conferir o campo de busca da Home e o da tela de playlists guardadas para a UAT-179 · implements:: REQ-03 · model:: opus
- [ ] TASK-13 conferir no navegador o filtro por ano, o filtro por fonte, os tamanhos de 20 a 100 e a memória da escolha ao recarregar · implements:: REQ-04, REQ-09 · model:: sonnet
- [ ] TASK-14 julgamento do MJRP no navegador (tarefa do humano); a UAT-179 e a UAT-180 seguem `open` até lá · implements:: REQ-01, REQ-03, REQ-04, REQ-05 · model:: opus

## Documentation
- [x] `docs/specs/data-model.md` (`albumQueries` com `facts`) e `docs/manual/` (08, 09, 12, 17, 32) — commit `12713e2`, 2026-11-19 12:34
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [ ] `docs/specs/arch.md`: pôr na seção 16 o que mudou ao construir (a F51 antes da F46, «My Ranking» só sobre o carregado, o aviso de pedidos não conferidos que não saiu, as funções de aptidão sem teste)
- [ ] `docs/specs/behavior.md`: corrigir `^library-search-and-filters` e registrar os estados da paginação
- [ ] pôr o protótipo `design/inception/albums-paging-v1.html` no git: recusado pela trava do espelho do protótipo (faltam o `info-arch.md` e os wireframes); a orquestradora leva ao MJRP
- [ ] levar o ramo à `main` (o merge não foi feito; push e aceite são do MJRP)
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde; só então `status: Done`
