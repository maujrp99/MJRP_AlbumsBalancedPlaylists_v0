---
type: ux-audit
subject: "Reconferência visual pré-merge do ramo wip/failed-sources-are-shown-2026-11-21: a janela do álbum diz que a fonte de notas (UAT-244, F52) e o Spotify (UAT-245, F69) não responderam, com «Try again» — 1280 e 393, contra o design system e o aviso de popularidade que já existia"
project: mjrpalbumblender-v0
features: [F52, F69]
moment: delivery
date: "2026-11-21 13:51"
judged: "2026-11-21 13:51"
judged_commit: 4b2dcd6
who_judged: separate-agent
verdict: fail
p0: 0
p1: 1
p2: 3
duration_s: 1500
status: open
---

# Reconferência visual — fontes que falharam na janela do álbum

**Veredito: não passa (`fail`), sem P0; 1 P1 e 3 P2.** Os dois avisos aparecem onde a pessoa olha (no alto da janela, logo abaixo do cabeçalho, sem rolar), com palavras simples, sem nada cortado nem passando da borda, com contraste bom, e somem depois de um «Try again» que dá certo. A UAT-244 e a UAT-245 estão respondidas na janela do álbum aberta da tela de álbuns. O P1 é o «Try again» de 24 px de altura no celular, abaixo dos 44 px do design system. Nenhum P0: nada impede usar a tela.

## Como foi feito
- **Quem julgou:** um agente juiz (Opus) que não construiu este ramo. Capturas e medidas minhas; as do construtor (`reports/evidence/F52/*.png`, `F69/*.png`) não foram usadas como prova.
- **Referência:** sem protótipo aprovado (conserto de UAT). A referência é `docs/specs/design-system.md` e o aviso de popularidade que já existia (`TracksRankingComparison.renderPopularityNotice`, F69).
- **Objeto:** o código do ramo em `4b2dcd6`. Sem conta não se chega à tela com dados; usei a mesma costura do construtor, refeita por mim: a `ViewAlbumModal` e a `TracksRankingComparison` reais, o CSS real, um `Album` de fixture e um substituto da carga dos álbuns que diz «falhou» e, no «Try again», passa por `pending` → `loading` → o desfecho pedido (`done` ou `failed` de novo). Mais um caso que o construtor não tinha: o álbum com `spotifyId`. Nada gravado, nenhuma rede do Firebase; o servidor foi parado.
- **Capturas e medidas:** `reports/evidence/F52/recheck/` (`shoot.mjs`, `harness/`, `measures.json`, 22 PNG). 1280 x 800 e 393 x 852 (toque, escala 2). Por caso: antes, logo depois do toque (`-asking`) e 2 s depois (`-after`). Console sem erro.

## O que foi conferido
- **Onde a pessoa olha:** o aviso fica em y = 326 px no computador e y = 188 px no celular, inteiro na primeira tela, acima da tabela de faixas (`ratings-1280.png`, `ratings-393.png`). Com as duas fontes falhando, os dois avisos empilham, nota primeiro (`both-1280.png`, `both-393.png`).
- **Palavras:** «The ratings source did not answer.» e «Spotify did not answer.», cada um com «Try again». Simples e verdadeiras: dizem que a fonte não respondeu, não que o álbum não tem nota. Ver P2-1 sobre o nome da fonte.
- **Nada cortado ou fora da borda:** aviso 1054 px (113 a 1167) em 1280; 361 px (16 a 377) em 393; `scrollWidth` igual à largura da janela nas duas; o texto cabe numa linha.
- **Contraste:** texto `#60a5fa` 14 px sobre azul a 10 % por cima do painel `#101014` (celular) ≈ 6,7:1; «Try again» branco sobre `#2563eb` 5,2:1. Os dois passam 4,5:1.
- **Some depois de um «Try again» que dá certo:** sim nas duas larguras e nas duas fontes (`*-after.png`, `measures.json` `after.m.present: false`). Se a fonte falha de novo, o aviso volta (`ratings-fails-again-*-after.png`).
- **Tamanho do «Try again»:** 72 x 24 px (1280) e 76 x 24 px (393). Ver P1-1.
- **A cor:** o aviso é azul (`bg-blue-500/10`, `border-blue-500/20`, texto `text-blue-400`, botão `bg-blue-600`), copiado do aviso de popularidade de antes. **O azul não está na paleta**: o design system tem preto, painel, superfície, laranja, vermelho, fogo, cinza, verde, rosa, vermelho claro, âmbar, Spotify — nenhum azul. O azul era um defeito herdado (a mesma família da UAT-250); o ramo o copiou para um aviso novo. Ver P2-2.
- **A ressalva do `spotifyId`:** o aviso de popularidade só aparece para álbum sem `spotifyId` (`TracksRankingComparison.js:173`). Lendo a carga: `PopularityEnricher.enrich` (`public/js/services/albums/adapters/enrichers.js`, «if (album.spotifyId) return { status: DONE … }») responde `done` na hora para todo álbum com `spotifyId`, sem perguntar ao Spotify. Então a popularidade só chega a `failed` num álbum sem `spotifyId` — a condição da tela cobre todos os casos em que a falha pode acontecer. Conferido no navegador: com `spotifyId` e estado `failed` forçado, nada aparece (`popularity-with-spotifyid-*.png`), o que não esconde nenhuma falha real. **A UAT-245 está respondida.**
- **A UAT-244 está respondida** na janela aberta pela tela de álbuns (`SeriesEventHandler` → `SeriesController.sourcesOf` → `enrichment.acclaim`). A janela aberta de outras telas (inventário, ranking) não recebe `sources` e não diz nada; a UAT pede a tela de álbuns.

## Achados
- **P1-1 · «Try again» de 24 px no celular.** O design system pede alvo de toque de 44 x 44 px (§ Celular, `--phone-target`, WCAG 2.5.5). O botão mede 76 x 24 px a 393 (`measures.json`, `ratings-393` e `popularity-393`, `button.h: 24`), e é a única ação do aviso. Âncora: `public/js/components/ranking/TracksRankingComparison.js`, `renderAskButton` (`px-3 py-1 … text-xs`). A mudança: no celular, o botão com 44 px de altura (ou a área de toque de 44 px com `.tap-44`), texto 14 px.
- **P2-1 · a nota não diz qual fonte.** O aviso do Spotify nomeia a fonte; o da nota diz «The ratings source», enquanto as faixas logo abaixo dizem «BEA» e a tabela «BestEverAlbums». A pessoa não liga «ratings source» à coluna. Âncora: `public/js/models/ratingsState.js` (`FAILED_LINE`), `both-393.png`. A mudança: «BestEverAlbums did not answer.» (ou o nome que a coluna usa).
- **P2-2 · azul fora da paleta, num aviso novo.** Âncora: `TracksRankingComparison.renderRatingsNotice` e `renderAskButton` (`blue-*`); `ratings-1280.png`. O design system não tem azul; a ação é laranja e a falha de carga já tem um desenho na mesma tela de álbuns (`.series-load-failure`, vermelho a 10 % com texto `text-red-200` e «Try again» sublinhado, `SeriesGridRenderer`). A mudança: os dois avisos de fonte no desenho do aviso de falha da série (ou num aviso de estado que o design system declare), e o botão sem azul. Decisão de cor: do dono do design system, junto com a UAT-250.
- **P2-3 · «Try again» da nota some sem dizer que está perguntando, e a tela pula.** Ao tocar, o estado vai a `pending` e o aviso da nota desaparece na hora (`describeRatings` só fala de `failed`); a lista sobe ~160 px no celular, parece que deu certo, e se a fonte falha de novo o aviso volta e a lista desce (`ratings-fails-again-393-asking.png` → `-after.png`). O aviso do Spotify, no mesmo caso, diz «Asking Spotify for popularity…» (`popularity-393-asking.png`). Âncora: `public/js/models/ratingsState.js`. A mudança: uma linha quieta «Asking BestEverAlbums…» para `pending`/`loading`, como a da popularidade.

## Não visto
- A tela de álbuns de verdade com conta, a carga real e o BestEverAlbums ou o Spotify realmente fora do ar: usei o substituto da carga. Que `enrichment.acclaim` chegue a `failed` na carga real foi lido no código (`AlbumLoadService._failSource`), não visto.
- O cartão do álbum na grade não diz nada da nota que falhou; a pessoa só sabe ao abrir a janela. A UAT-244 pede a janela; anoto sem achado.
- A janela aberta do inventário e da janela de ranking (sem `sources`, nada aparece por desenho).
- iPhone de verdade: só a emulação de 393 com toque.
