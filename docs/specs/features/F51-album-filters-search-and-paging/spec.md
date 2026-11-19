---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-179", "UAT-180"]
planned_for: "[[ROADMAP#^REL-39]]"
---
# Feature F51: Filtros que valem para todas as séries, busca que deixa digitar e paginação na tela de álbuns
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** A tela de álbuns passa a mostrar as séries em páginas, os filtros (série, artista, busca, ano e fonte) valem para todas as séries e não só para as que já carregaram, e o campo de busca deixa digitar a palavra inteira.

**Por quê:** Hoje o filtro só enxerga os álbuns já carregados, o campo de busca perde o cursor a cada letra, e 45 séries numa tela só pedem paginação.

**Como saber que funcionou:** Com a primeira página na tela, filtrar por um artista de uma série da última página mostra essa série; digitar uma palavra de dez letras na busca não exige clicar de novo no campo.

## Problem Statement
O MJRP: «o campo de bucas tem problemas, eu nao consigo digitar tudo da mesma vez» e «como ficaria a questao de filtros se a gente utilizasse paginacao nas telas?». Com as 45 séries na tela, quem filtra por artista, ano ou fonte só recebe resposta sobre o que já carregou, e quem busca digita uma letra por vez.

## Requirements
- [REQ-01] Os filtros por série, artista e ano e a busca respondem sobre todas as séries da conta, carregadas ou não, e dão a mesma resposta em qualquer página.
  verified_by:: `test/models/seriesFilter.test.js`, `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-02] A lista de artistas do filtro traz os artistas de todas as séries, não só os dos álbuns já carregados.
  verified_by:: `test/models/seriesFilter.test.js`, `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-03] Na tela de álbuns, o campo de busca mantém o cursor enquanto a pessoa digita, e a lista se filtra a cada letra. · fixes UAT-179
  verified_by:: `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-04] A tela mostra as séries em páginas numeradas. A pessoa escolhe quantas séries por página, de 10 a 100, de 10 em 10; começa em 10, e a escolha fica lembrada no navegador.
  verified_by:: `test/models/paging.test.js`, `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-05] A pessoa pode trocar as páginas numeradas por uma lista que cresce: ao chegar ao fim, ou ao clicar em «Load 10 more», entra o lote seguinte. A forma escolhida fica lembrada no navegador.
  verified_by:: `test/models/paging.test.js`, `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-06] A tela diz quantas séries está mostrando e de quantas; com filtro, diz também o total da conta.
  verified_by:: `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-07] A tela primeiro filtra todas as séries e depois corta a página. Ela busca só os álbuns das séries da página, e trocar de página mantém o que já carregou.
  verified_by:: `test/models/paging.test.js`, `test/models/seriesFilter.test.js`, `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-08] Quando uma série termina de carregar, o ano e as fontes de cada álbum ficam gravados na própria série. Só a diferença é gravada, uma vez por série, e nada quando nada mudou. A série antiga se preenche sozinha na primeira carga. O ranking pessoal não entra nessa gravação.
  verified_by:: `test/services/series/SeriesFactsService.test.js`, `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-09] O filtro por fonte lê o que está gravado na série, sem precisar carregar o álbum.
  verified_by:: `test/models/seriesFilter.test.js`
- [REQ-10] Um álbum cujo artista tem «&» no nome carrega como os outros. **Não entregue:** nada foi feito para este requisito. · fixes UAT-180
  verified_by:: ainda sem prova; a issue UAT-180 segue aberta

## Observable States
N/A: a feature não importa nenhum requisito (conserto das issues UAT-179 e UAT-180), então nenhum estado é apontado. O que a tela passou a mostrar, para registro, como no protótipo que o MJRP viu:
- Páginas numeradas: «Showing 1–10 of 45 series», o seletor «Series per page» e os botões de página.
- Lista que cresce: «Showing 1–10 of 45 series» com o botão «Load 10 more».
- Com filtro: «Showing 1–4 of 4 series (of 45 in all)».
- Filtro sem resultado: «No series matches these filters».

O `behavior.md` ainda não tem esses estados (`^library-search-and-filters` descreve os filtros antigos); a correção está nas tarefas abertas.

## Prototype Parity (if the feature touches a screen)
- Prototype: `design/inception/albums-paging-v1.html`, visto e escolhido pelo MJRP em 2026-11-19 («opção A e b, séries por página, go for it»; e «o ideal seria poder escolher multiplos de 10 por pagina, 10, 20, 30, 40, 50, ...100»). O arquivo está na pasta, mas fora do git: o commit dele foi recusado pela trava do espelho do protótipo, que pede o `info-arch.md` e os wireframes, e o projeto não tem nenhum dos dois. A recusa está registrada no `docs/log.md` (2026-11-19 12:34) e não foi contornada.
- Transversal layer touched: componentes compartilhados (a barra de filtros, que a tela de playlists guardadas também usa, e o paginador novo). Nenhum token ou fonte nova.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

## Success Criteria
- Ao abrir a tela na conta do MJRP (45 séries): 10 séries desenhadas, «Showing 1–10 of 45 series», páginas de 1 a 5. Conferido em 2026-11-19.
- A lista de artistas do filtro tem 93 artistas com só a primeira página carregada. Antes trazia só os dos álbuns já carregados.
- Digitar «robert plant» de uma vez, 12 teclas, sem clicar de novo: o campo fica com o texto e o cursor, e a tela mostra as quatro séries de Robert Plant, vindas de outras páginas.
- Página 2: «Showing 11–20 of 45 series», 10 séries desenhadas, nenhum bloco cinza depois de 6 segundos.
- Lista que cresce: de 10 para 20 séries ao rolar até o fim.
- Depois de visitar três páginas, 67 dos 217 álbuns pedidos têm o ano e as fontes gravados na série.
- Ainda não medido: a escolha de 20 a 100 séries por página no navegador; o filtro por ano e o filtro por fonte no navegador; o campo de busca da Home e o da tela de playlists guardadas.

## Out of Scope
- O álbum com «&» no nome do artista (UAT-180). Segue aberto: o pedido está gravado com «&amp;» e quem grava assim ainda não foi localizado.
- O campo de busca da Home. A issue UAT-179 fala dele também; ele é outro campo e não foi conferido.
- O filtro «My Ranking» sobre todas as séries. Ele só enxerga os álbuns já carregados, porque o ranking mora com a pessoa, não na série.
- Migrar as séries antigas de uma vez. Decisão do MJRP: «preenche sozinho na primeira carga». Até a primeira carga de cada série, o filtro por fonte fica incompleto para ela.
- Dizer na tela quantos álbuns ainda não foram conferidos. Estava no desenho e não foi feito.
- A paginação com a tela mostrando uma série só. O paginador aparece apenas no painel de todas as séries.
- A segunda fonte de álbuns. Em produção ela responde 402 (pagamento exigido): o álbum que a loja não tem fica com o aviso de falha.

## Open Questions
- A UAT-179 pode fechar só com a tela de álbuns consertada? — não: a issue cita a Home, ainda não conferida. Quem fecha é o MJRP, ao julgar.
- Quem grava o pedido com «&amp;»? — não localizado (UAT-180); sem dono nem data.
- A tela de playlists guardadas ganhou o mesmo conserto da busca? — ela usa a mesma barra de filtros, mas não foi conferida no navegador.
- O filtro por fonte de uma série nunca carregada deve avisar que está incompleto? — sem resposta; hoje não avisa.
