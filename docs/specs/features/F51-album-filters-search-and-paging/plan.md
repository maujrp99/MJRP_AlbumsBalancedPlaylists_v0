# Plan — Feature F51: Filtros que valem para todas as séries, busca que deixa digitar e paginação na tela de álbuns · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), a partir do `docs/log.md` de 2026-11-19 (11:57, 12:01, 12:06), do código do ramo e da conferência em `reports/evidence/F51-album-filters-search-and-paging/`.

## Architecture Approach
A feature constrói a seção 16, «Filtros, busca e paginação da tela de álbuns», de «Carga da tela de álbuns — proposta», no `docs/specs/arch.md`. É a opção C escolhida pelo MJRP («vamos fazer a opcao C»): os fatos que os filtros leem moram no pedido de álbum, dentro da série.

Em resumo: cada item de `albumQueries` ganha o bloco `facts` (`{ year, sources: { acclaim, popularity }, checkedAt }`); o serviço de carga aprende e não grava; um serviço pequeno grava só a diferença, pelo repositório; o filtro é função pura sobre os pedidos; a tela pagina o resultado do filtro; a barra de filtros atualiza em vez de se refazer.

O que difere do `arch.md`, e que o documento ainda não diz (tarefa aberta):
- a seção 16 põe a F51 «depois da F46»; ela foi feita antes, e a lista que cresce usa um observador próprio, no paginador;
- o item 1 diz que o filtro «My Ranking» leria a coleção de rankings numa leitura só; o que foi feito lê só os álbuns carregados;
- o aviso «quantos pedidos ainda não foram conferidos» (tabela de riscos) não foi feito: `countUnchecked` existe em `models/seriesFilter.js` e a tela não a usa;
- as três funções de aptidão da seção 16 não têm teste.

O `data-model.md` foi atualizado: `albumQueries` com `appleMusicId` e `facts`.

## Technical Design
Fluxo da tela: `SeriesController.getPageView` → `filterSeries(séries ordenadas, critérios)` → `paginate` (páginas) ou `takeFirst` (lista que cresce) → `requestLoad` pede ao `albumLoadService` só as séries da página → `SeriesGridRenderer` desenha a página inteira (`pageBounded`) → `Pager` mostra a contagem e os controles.

Fluxo dos fatos: a `albumLoadStore` muda → 2 s sem mudança (`FACTS_SETTLE_MS`) → `SeriesFactsService.syncFinishedSeries` → por série terminada, `withSettledFacts` compara o que a carga aprendeu com o que a série tem → se mudou, `SeriesRepository.saveAlbumFacts` grava `albumQueries` (sem mexer em `updatedAt`) e a `albumSeriesStore.setAlbumQueries` atualiza a memória.

Peças novas:
- `public/js/models/seriesFilter.js` — `filterSeries`, `listArtists`, `describeQuery`, `decadeOf`, `isFiltering`, `countUnchecked`. Lê a série, nunca o que está carregado. REQ-01, REQ-02, REQ-07, REQ-09.
- `public/js/models/paging.js` — `PAGE_SIZES` (10 a 100), `DEFAULT_PAGE_SIZE` (10), `PagingMode`, `normalizePageSize`, `paginate`, `takeFirst`. REQ-04, REQ-05, REQ-07.
- `public/js/models/albumFacts.js` — `hasSettledFacts`, `factsOfEntry`, `withSettledFacts`; as fontes guardadas são `acclaim` e `popularity`, nunca o ranking pessoal. REQ-08.
- `public/js/services/series/SeriesFactsService.js` — `syncFinishedSeries`; espera a série terminar; grava só quando há diferença; falha na gravação é avisada no console e não muda a série em memória. REQ-08.
- `public/js/components/ui/Pager.js` — a contagem («Showing 1–10 of 45 series»), o seletor «Series per page», a troca «Pages» / lista que cresce, os botões de página (no máximo 9, o resto em «…»), «Load N more» e um `IntersectionObserver` no fim da lista. Só mostra e avisa; a página é do controlador. REQ-04, REQ-05, REQ-06.

Peças mudadas:
- `public/js/controllers/SeriesController.js` — `getPageView`, `getOwnRankedKeys`, `getVisibleSeriesList`, `handlePage`, `handlePageSize`, `handlePagingMode`, `handleShowMore`, `resetPaging`; `requestLoad` passa só as séries da página; o tamanho e a forma ficam em `localStorage` (`albumsPageSize`, `albumsPagingMode`). REQ-01, REQ-04, REQ-05, REQ-07.
- `public/js/components/ui/FilterToolbar.js` — desenha o campo `#genericSearch` uma vez e o mantém; os outros controles só são redesenhados quando o que mostram muda. É a causa da UAT-179. REQ-03.
- `public/js/repositories/SeriesRepository.js` — `saveAlbumFacts(seriesId, albumQueries)`: o único lugar que grava os fatos. REQ-08.
- `public/js/stores/albumSeries.js` — `setAlbumQueries`. REQ-08.
- `public/js/services/albums/albumLoading.js` — monta o `seriesFactsService` e o liga à store de carga. REQ-08.
- `public/js/components/series/SeriesGridRenderer.js` — `pageBounded`: a lista já cortada é desenhada inteira, sem o truque das três primeiras séries. REQ-07.
- `public/js/views/SeriesView.js`, `public/js/views/helpers/SeriesComponentFactory.js`, `public/js/views/helpers/SeriesViewUpdater.js` — montam o paginador (só no painel de todas as séries) e tiram a lista de artistas das séries. REQ-02, REQ-06.

## UI/UX Design (if the feature touches a screen)
Os estados são os da spec, como no protótipo `design/inception/albums-paging-v1.html` (as duas formas, lado a lado; o MJRP ficou com as duas e pediu o tamanho de 10 a 100).

- Paginador: um painel abaixo da grade, com a contagem à esquerda e, à direita, «Series per page» e a troca de forma. Usa as classes do app (`glass-panel`, `form-control`, `btn`, `bg-brand-orange`); nenhum componente do design system foi redesenhado.
- Barra de filtros: a mesma de antes; muda só o modo de atualizar.

Captura: `reports/evidence/F51-album-filters-search-and-paging/F51-desktop-search-robert-plant-2026-11-19.jpg`. Não houve sensor visual nem reconferência independente contra o protótipo: a conferência foi do agente, no navegador.

## Dependencies
Nenhuma dependência de pacote. A feature depende do código da F45 (o serviço e a store de carga) e da F47 (a lista de séries inteira); o ramo foi empilhado sobre os dois.

## Documents Consulted
- `docs/specs/arch.md` — «a atualizar»: a seção 16 foi escrita antes do código; os quatro pontos da seção «Architecture Approach» acima ainda não estão nela.
- `docs/specs/data-model.md` — «atualizado» no commit `12713e2` (2026-11-19 12:34): `albumQueries` com `appleMusicId` e `facts`.
- `docs/specs/behavior.md` — «a atualizar»: `^library-search-and-filters` descreve os filtros antigos e não há estado de paginação.
- `docs/specs/constitution.md` — «sem mudança»; lido pelos padrões que o desenho cita (`DP-01`, `DP-12`, `DP-20`).
- `docs/specs/uat.md` — «sem mudança» por esta feature: a UAT-179 e a UAT-180 seguem `open`.
- `docs/manual/` — «atualizado» no commit `12713e2`: 08, 09, 12, 17 e 32 (o paginador, os filtros que leem a série, o campo de busca, `SeriesFactsService`, o documento da série com `facts`).
- `info-arch.md`, `design-system.md` e wireframes — o projeto não tem; é o que impede o commit do protótipo.

Declarações do passo retroativo da via rápida (conferidas nos commits que citam a F51, em 2026-11-21):
- `docs/specs/arch.md` — atualizado (commits que citam a F51 e tocam o arquivo: `c6af8e0`, `d4164e8`, `7de148a`)
- `docs/specs/tech-stack.md` — sem mudança (nenhum commit que cita a F51 toca o arquivo)
- `docs/specs/design-system.md` — sem mudança (nenhum commit que cita a F51 toca o arquivo)
- `docs/specs/behavior.md` — sem mudança (nenhum commit que cita a F51 toca o arquivo)
- `docs/wiki/` — sem mudança (nenhum commit que cita a F51 toca uma página da wiki do projeto)

## Risks & Considerations
- O fato gravado envelhece (o álbum ganhou nota depois). A carga da série reescreve a diferença; `checkedAt` diz quando foi conferido.
- Dois aparelhos editando a mesma série ao mesmo tempo podem perder o `facts` de um: a gravação escreve o campo `albumQueries` inteiro. Aceito para um usuário só.
- Um pedido gravado como texto («Artista - Título») vira objeto quando ganha `facts`. Na conta do MJRP são 21 de 217; os leitores de `albumQueries` já aceitam as duas formas.
- O filtro por fonte fica incompleto para a série que nunca carregou, e a tela não avisa.
- O filtro «My Ranking» só vê os álbuns carregados.
- A barra de filtros, o paginador, o controlador e a grade não têm teste automático: a prova deles é a conferência no navegador.
- A UAT-179 foi corrigida pela causa na barra de filtros; a Home tem campo próprio e a tela de playlists guardadas não foi conferida.
- `POST /api/generate` em produção responde 402: a segunda fonte de álbuns está fora do ar.
- A suíte inteira tem 28 falhas de antes desta feature (linha de base de 2026-11-19).

## Test plan
> Derivado dos REQ do `spec.md` (a feature não importa requisito) · 2026-11-19 12:37, hora de Brasília

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `seriesFilter.test.js`: os dez casos de `filterSeries` (artista, década, busca, soma de filtros, série escolhida); busca «robert plant» no navegador traz séries de outras páginas | mesma resposta em qualquer página | modelo, navegador | sim; o navegador, não |
| REQ-02 | `seriesFilter.test.js`: «lists every artist of every series, from the queries, sorted and once each»; 93 artistas no filtro com uma página carregada | lista completa de artistas | modelo, navegador | sim; o navegador, não |
| REQ-03 | digitação real de 12 teclas no campo de busca da tela de álbuns: o campo mantém o texto e o foco | UAT-179, tela de álbuns | navegador | não |
| REQ-04 | `paging.test.js`: «offers 10, 20 … 100 series a page», «cuts a numbered page and says where it stands», «the last page may be short», «a page past the end becomes the last one…», «100 a page shows 45 series at once»; páginas 1 e 2 no navegador | «Showing 11–20 of 45 series» | modelo, navegador | sim; o navegador, não |
| REQ-05 | `paging.test.js`: «the growing list shows the first ones and says whether there is more»; trocar para a rolagem e rolar até o fim | de 10 para 20 séries | modelo, navegador | sim; o navegador, não |
| REQ-06 | leitura da contagem no navegador, sem filtro e com filtro | «Showing 1–4 of 4 series (of 45 in all)» | navegador | não |
| REQ-07 | `seriesFilter.test.js`: «gives the keys of the queries that passed, to pick the loaded albums by»; `paging.test.js`: os cortes; página 2 sem bloco cinza depois de 6 s | página carregada inteira | modelo, navegador | sim; o navegador, não |
| REQ-08 | `SeriesFactsService.test.js`: os sete casos (grava ao terminar, nada na segunda vez, espera a série, deixa o que falhou, reescreve quando mudou, sem ranking pessoal, falha de gravação); 67 de 217 pedidos com `facts` depois de três páginas | fatos gravados na série | serviço, navegador | sim; o navegador, não |
| REQ-09 | `seriesFilter.test.js`: «by source, reading the facts written in the query», «"pending" is the query with no source found yet, checked or not» | filtro por fonte sem carregar | modelo | sim |
| REQ-10 | nenhum: não construído | UAT-180, aberta | — | não |

Rodado em 2026-11-19 12:33: `test/models/seriesFilter.test.js` (14), `test/models/paging.test.js` (7) e `test/services/series/SeriesFactsService.test.js` (7), todos passam.

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): o filtro por ano e o filtro por fonte não foram conferidos no navegador; os tamanhos de 20 a 100 não foram escolhidos no navegador; a memória da escolha (tamanho e forma) ao recarregar a página não foi conferida; a gravação dos fatos com falha de rede só tem teste com dublê.
