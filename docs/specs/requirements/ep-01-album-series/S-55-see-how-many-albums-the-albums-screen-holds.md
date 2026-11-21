---
id: S-55
aliases: [S-55]
type: requirement
format: story
status: Done
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-40]]"
points_to: ["[[behavior#^library-counts]]"]
delivered_by: ["49c786e", "274dfe4"]
---
# S-55 · Como quem cura séries de álbuns, quero ver na tela de séries quantos álbuns ela reúne, para que eu saiba o tamanho da minha coleção sem contar.

## pt-BR

Hoje a tela de séries de álbuns mostra a contagem de cada série no cabeçalho dela, mas não diz o total: quantas séries e quantos álbuns existem, nem quantos passam pelos filtros.
Origem: pedido do MJRP de 2026-11-20: «outra melhoria conseguimos colocar quantos albums estao na página de albuns series?».

**Critérios de aceite** (do que o MJRP julgou em 2026-11-20 00:55, estado `behavior#^library-counts`):
- Dado o painel de todas as séries, Quando a pessoa o abre, Então a linha da paginação diz as séries e os álbuns que as séries da página pedem («Showing 1–20 of 48 series · 97 albums»), nas duas caixas, a de cima e a de baixo.
- Dado um filtro ou uma busca ligados, Quando a lista se reduz, Então a linha diz quantas séries passam, de quantas, e os álbuns delas («… of 12 series (of 50 in all) · 10 albums»).
- Dado que a pessoa troca de página, ou que o scroll carrega mais séries, Quando a lista muda, Então o número de álbuns acompanha o que está na tela.
- Dado que a tela mostra uma série só, Quando ela abre, Então a paginação não aparece e a contagem não aparece (o MJRP pediu a contagem aqui na primeira versão; a decisão de 2026-11-20 a deixou na paginação; a reconferência de 2026-11-21 abriu a UAT-248 pedindo-a de volta).


## en

**As someone who curates album series, I want to see on the series screen how many albums it holds, so that I know the size of my collection without counting.**

Origin: the MJRP's request of 2026-11-20.

**Acceptance criteria** (from what the MJRP judged on 2026-11-20 00:55, state `behavior#^library-counts`):
- Given the screen of all series, When the person opens it, Then the pager line gives the series and the albums those series on the page ask for ("Showing 1–20 of 48 series · 97 albums"), in both pager boxes, the top one and the bottom one.
- Given a filter or a search is on, When the list shrinks, Then the line says how many series pass, out of how many, and their albums.
- Given the person changes page, or the scroll loads more series, When the list changes, Then the album number follows what is on screen.
- Given the screen shows a single series, When it opens, Then no pager and no count appear (the first version asked for the count here; the 2026-11-20 decision left it in the pager; the 2026-11-21 recheck opened UAT-248 asking for it back).

