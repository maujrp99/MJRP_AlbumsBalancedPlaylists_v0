# F72 — a tela de séries diz quantos álbuns tem: prova no navegador (2026-11-19 22:53)

Ramo `feat/f72-albums-screen-says-how-many`. Testes: 2229 passando em 185 arquivos; lint sem erro; build ok. App local com a conta do MJRP.

| Cenário | Linha sob o título |
|---|---|
| Todas as séries, sem filtro | «47 series · 227 albums» |
| Busca «floyd» | «2 of 47 series · 4 albums» |
| Busca apagada | «47 series · 227 albums» |
| Série «Grunge Rock - Classics» escolhida | «5 albums» |

O número é o dos álbuns pedidos nas séries que passam pelos filtros, em todas as páginas; o mesmo álbum pedido em duas séries conta duas vezes.

## Não visto

- Largura de celular; os filtros de artista, ano e fonte (a frase usa a mesma resposta do filtro que a busca).

## A paginação também no topo (2026-11-20 00:09)

Em `http://127.0.0.1:5010/albums`, conta do MJRP: cabeçalho «48 series · 230 albums». A caixa de cima fica acima da grade e mostra o mesmo que a de baixo («Showing 1–40 of 48 series», «Previous 1 2 Next»). Clicar em «2» na de cima: as duas passam a «Showing 41–48 of 48 series». No modo «Scroll»: a de cima não tem «Load more»; a de baixo tem.

## A contagem na paginação (2026-11-20 00:55)

Julgamento do MJRP: a contagem é a do que está na tela e fica na paginação; a linha do cabeçalho sai. Em `http://127.0.0.1:5010/albums`, na conta dele: «Showing 1–40 of 48 series · 167 albums» nas duas caixas; página 2: «Showing 41–48 of 48 series · 63 albums»; modo «Scroll», depois de «Load more»: «Showing 1–48 of 48 series · 230 albums». Sob o título não há mais linha de contagem.
