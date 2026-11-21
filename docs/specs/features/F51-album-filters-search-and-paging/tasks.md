# Tasks — Feature F51: Filtros que valem para todas as séries, busca que deixa digitar e paginação na tela de álbuns · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] desenho escrito na seção 16 da proposta, no `docs/specs/arch.md`, depois da escolha do MJRP pela opção C (2026-11-19 11:57)
- [x] protótipo com as duas formas de paginação (`design/inception/albums-paging-v1.html`) visto pelo MJRP, que ficou com as duas, por série, de 10 a 100 por página (2026-11-19 12:01)
- [x] ramo criado: `fix/f51-album-filters-search-and-paging`, empilhado sobre o da F47
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
- [x] TASK-01 `public/js/models/seriesFilter.js`: os filtros como função pura sobre os pedidos das séries (série, artista, ano, fonte, busca) e a lista de artistas — 14 testes · implements:: REQ-01, REQ-02, REQ-07, REQ-09 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/models/paging.js`: páginas numeradas e lista que cresce, por série, de 10 a 100 — 7 testes · implements:: REQ-04, REQ-05, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/models/albumFacts.js` e `public/js/services/series/SeriesFactsService.js`: o ano e as fontes de cada álbum gravados no pedido, só a diferença, quando a série termina de carregar — 7 testes · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-04 `saveAlbumFacts` em `public/js/repositories/SeriesRepository.js`, `setAlbumQueries` em `public/js/stores/albumSeries.js` e a ligação em `public/js/services/albums/albumLoading.js`: a gravação dos fatos, sem mexer em `updatedAt` · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/components/ui/Pager.js`: a contagem, o tamanho da página, a troca de forma, os botões de página e «Load N more» · implements:: REQ-04, REQ-05, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/controllers/SeriesController.js`: a visão da página (`getPageView`), os comandos de paginação e o pedido de carga só das séries da página · implements:: REQ-01, REQ-04, REQ-05, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/components/ui/FilterToolbar.js`: o campo de busca desenhado uma vez; os outros controles atualizados só quando mudam · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-08 `SeriesView.js`, `SeriesComponentFactory.js`, `SeriesViewUpdater.js` e `SeriesGridRenderer.js`: o paginador na tela, a lista de artistas saindo das séries e a página desenhada inteira, sem o truque das três primeiras séries · implements:: REQ-02, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-09 o pedido gravado com «&amp;»: a leitura única do pedido (`models/albumQuery.js`) e a chave (`queryKey`) desfazem as entidades HTML (`models/text.js`), o catálogo é consultado com o texto limpo (`CatalogAdapter`), e as duas telas que gravam pedido (Home e edição de série) passam por uma função só, `toAlbumQuery`. A origem não está no código de hoje nem nas versões lidas do histórico: nenhum caminho atual escapa texto antes de gravar. O banco não foi reescrito — 12 testes em `test/models/text.test.js` · implements:: REQ-10 · model:: opus · rounds:: 1
- [x] TASK-15 `SeriesController.getPageView` e `components/ui/Pager.js`: com o filtro por fonte ativo, a tela diz quantos álbuns ainda não foram conferidos (`countUnchecked`, `readsFacts`) — testes em `test/components/ui/Pager.test.js` e `test/controllers/SeriesController.test.js` · implements:: REQ-11 · model:: opus · rounds:: 1
- [x] TASK-16 `public/js/views/SavedPlaylistsView.js`: a página é desenhada uma vez e só a lista muda; antes a página inteira era refeita a cada letra e o campo de busca era trocado, mesmo com a barra de filtros consertada — 3 testes em `test/views/SavedPlaylistsView.test.js` · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-17 testes da tela que não existiam: `test/components/ui/Pager.test.js` (19), `test/components/ui/FilterToolbar.test.js` (9), `test/controllers/SeriesController.test.js` (15) · implements:: REQ-03, REQ-04, REQ-05, REQ-06 · model:: opus · rounds:: 1

## Verification
- [x] TASK-10 suíte inteira (`npx vitest run`): 223 passam, as mesmas 28 falhas da linha de base · implements:: REQ-01, REQ-02, REQ-04, REQ-05, REQ-07, REQ-08, REQ-09 · model:: sonnet · rounds:: 1
- [x] TASK-11 conferência no navegador, conta do MJRP (45 séries, 217 pedidos): 10 de 45 na primeira página e 5 páginas; «robert plant» digitado de uma vez mantém o foco e traz quatro séries de outras páginas; página 2 sem bloco cinza; a rolagem cresce de 10 em 10; 67 de 217 pedidos com `facts` depois de três páginas; `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-12 campo de busca da Home e da tela de playlists guardadas (UAT-179), por leitura e teste: a de playlists tinha o defeito e foi consertada (TASK-16); na Home o campo (`#artistScanInput`) é desenhado uma vez e só escuta o Enter, não foi achado redesenho a cada tecla. O que foi achado e consertado: o controlador da tela de álbuns continuava desenhando numa tela fechada enquanto a carga seguia (`SeriesController.detachView`, F46). Falta repetir no navegador · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-13 conferir no navegador o filtro por ano, o filtro por fonte, os tamanhos de 20 a 100 e a memória da escolha ao recarregar — prova: `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`, `reports/evidence/F51-album-filters-search-and-paging/F51-desktop-search-robert-plant-2026-11-19.jpg` · implements:: REQ-04, REQ-09 · model:: sonnet · rounds:: 1

## Documentation
- [x] `docs/specs/data-model.md` (`albumQueries` com `facts`) e `docs/manual/` (08, 09, 12, 17, 32) — commit `12713e2`, 2026-11-19 12:34
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [x] `docs/specs/arch.md`: a seção 17 diz o que mudou ao construir, e a seção 18 o fecho («My Ranking» sobre todas as séries, o aviso de pedidos não conferidos, os testes da tela) — 2026-11-19
- [x] `docs/specs/behavior.md`: corrigir `^library-search-and-filters` e registrar os estados da paginação — «Busca e filtros» e «Séries por página» estão em `behavior.md`
- [ ] TASK-19 pôr o protótipo `design/inception/albums-paging-v1.html` no git — ele existe só como arquivo solto na pasta do projeto principal (fora do git; escolhido pelo MJRP em 2026-11-19). A trava do espelho do protótipo (`prototype_sync_check.py`) recusa o commit dele sem, no mesmo commit: (1) o `docs/specs/info-arch.md` dando o estado de cada tela e nomeando `albums-paging-v1.html` como o protótipo mais novo; (2) um wireframe por tela, `design/wireframes/albums-paging-v1-<tela>.png`, de cada tela do protótipo. É trabalho de agente (a `mjrp-designing-ui` escreve o info-arch e gera os wireframes); não pede nada do MJRP · implements:: REQ-01 · model:: opus
- [x] levar o ramo à `main` — feito: ramo mergeado na `main` local (`5268f45`)
- [ ] TASK-20 fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde; só então `status: Done` · implements:: REQ-01 · model:: sonnet
- [ ] TASK-18 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra; Issues: a UAT-180 na docs/specs/uat.md não está `fixed (F51: <commit> · <teste ou passos → resultado>)` (o Status diz «fixed (F46: 510a840 · `test/models/text.test.js`; no navegad»). É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F51-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-01 · model:: opus

## For the owner at UAT
- O MJRP confere no navegador e dá o OK na UAT-179 e na UAT-180.
- Push da `main` ao remoto (e, com ele, a primeira rodada da automação do GitHub): é do MJRP.
