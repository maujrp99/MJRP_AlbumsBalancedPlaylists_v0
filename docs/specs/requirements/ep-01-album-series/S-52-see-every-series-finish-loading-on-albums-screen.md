---
id: S-52
aliases: [S-52]
type: requirement
format: story
status: Prioritized
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-39]]"
---
# S-52 · Como quem cura playlists a partir de álbuns, quero que a tela de álbuns termine de carregar cada série, sem bloco cinza preso nem série que some, para que eu confie no que ela mostra.

## pt-BR

Hoje (medido no navegador em 2026-11-19, com 20 séries e 80 álbuns): o primeiro álbum aparece aos 8,5 segundos e depois chega um a cada 5 ou 6 segundos; aos 48 segundos há 3 séries desenhadas e 17 blocos cinza; quem sai da tela no meio da carga e volta vê séries sumirem; um álbum que falha não deixa sinal; a lista é cortada em 20 séries sem aviso. Respostas do MJRP (2026-11-19): o corte em 20 séries é acidente; série com álbum que falhou aparece com aviso; a tela carrega só o que está à vista e o resto ao rolar.
Origem: pedido do MJRP de consertar o v0, a começar pela carga da tela de álbuns (`docs/log.md`, 2026-11-19); issues UAT-172 a UAT-177 e UAT-24 do `docs/specs/uat.md`; relatório de causa do V1. Os consertos são das features F45 a F49.

## en

**As someone who curates playlists from albums, I want the albums screen to finish loading every series, with no grey block left hanging and no series that disappears, so that I trust what it shows.**

Origin: the MJRP's request to fix the v0, starting with the albums screen load (`docs/log.md`, 2026-11-19); issues UAT-172 to UAT-177 and UAT-24 in `docs/specs/uat.md`; the V1 cause report. The fixes belong to features F45 to F49.
