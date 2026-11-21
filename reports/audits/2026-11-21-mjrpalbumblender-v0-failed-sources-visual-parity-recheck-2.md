---
type: ux-audit
subject: "Segunda reconferência visual pré-merge do ramo wip/failed-sources-are-shown-2026-11-21, depois dos consertos dos achados da primeira (UAT-244, F52; UAT-245, F69) — 1280 e 393"
project: mjrpalbumblender-v0
features: [F52, F69]
moment: delivery
date: "2026-11-21 13:57"
judged: "2026-11-21 13:57"
judged_commit: 7ea5473
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 2
duration_s: 600
status: open
---

# Segunda reconferência visual — fontes que falharam na janela do álbum

**Veredito: passa (`pass`), sem P0 e sem P1; ficam 2 P2.** O «Try again» tem 44 px de altura no celular nos dois avisos, o aviso da nota nomeia o BestEverAlbums, e durante o novo pedido a janela diz «Asking BestEverAlbums for ratings…» em vez de sumir. Ficam o azul fora da paleta (não mexido, decisão de cor) e um pulo menor da lista durante o pedido.

## Como foi feito
- **Quem julgou:** o mesmo agente juiz (Opus) da primeira reconferência (`2026-11-21-mjrpalbumblender-v0-failed-sources-visual-parity-recheck.md`, commit `5da1ab5`); não construiu o ramo.
- **Objeto:** o ramo em `7ea5473`; a diferença desde `4b2dcd6` em `public/` é `TracksRankingComparison.js` (um `renderNotice` para os dois avisos; botão `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0`) e `ratingsState.js` (texto novo, linha de «asking» para `pending`/`loading`).
- **Costura:** a mesma da primeira passada (`reports/evidence/F52/recheck/harness/`, já no ramo): a `ViewAlbumModal` e a `TracksRankingComparison` reais, o CSS real, um `Album` de fixture e um substituto da carga. Servidor local parado ao fim.
- **Capturas e medidas:** `recheck-2/` (ao lado deste relatório: `shoot.mjs`, `measures.json`, 22 PNG). 1280 x 800 e 393 x 852 (toque, escala 2); antes, logo depois do toque (`-asking`) e 2 s depois (`-after`). Console sem erro.

## O que foi conferido
- **«Try again» no celular:** 76 x 44 px nos dois avisos (`ratings-393`, `popularity-393`, `both-393` em `measures.json`; `both-393.png`). No computador fica 72 x 24 px, como antes (o alvo de 44 px é regra do celular). P1-1 da primeira passada: **resolvido**.
- **Texto:** «BestEverAlbums did not answer.» com «Try again» (`ratings-393.png`, `ratings-1280.png`); o mesmo nome que a coluna «BestEverAlbums» e a aba «BEA». P2-1: **resolvido**.
- **Durante o novo pedido:** ao tocar, a linha quieta «Asking BestEverAlbums for ratings…» aparece no lugar do aviso, em cinza `#9ca3af` 14 px (`ratings-fails-again-393-asking.png`, `ratings-1280-asking.png`); com sucesso some (`ratings-393-after.png`); com nova falha o aviso volta (`ratings-fails-again-393-after.png`). Igual ao comportamento do aviso do Spotify. A parte «parece que deu certo» da P2-3: **resolvida**. O pulo: ver P2-2 abaixo.
- **Nada cortado ou fora da borda:** aviso 361 px (16 a 377) a 393, 1054 px a 1280; `scrollWidth` igual à largura nas duas; com o botão de 44 px o aviso do celular tem 78 px de altura e o texto cabe numa linha.
- **Contraste:** o mesmo da primeira passada (texto `#60a5fa` ≈ 6,7:1; botão branco sobre `#2563eb` 5,2:1); a linha cinza `#9ca3af` sobre o painel ≈ 7:1.
- **O álbum com `spotifyId`:** continua sem aviso, o que é certo (a popularidade de um álbum com `spotifyId` nunca chega a `failed`; ver a primeira reconferência).

## Achados
- **P2-1 · azul fora da paleta (fica).** Era o P2-2 da primeira passada; não foi mexido, e é decisão de cor do dono do design system. Âncora: `TracksRankingComparison.renderNotice` e `renderAskButton` (`blue-*`); `both-393.png`. A mudança: os avisos de fonte no desenho do aviso de falha da série (`.series-load-failure`) ou num aviso de estado declarado no design system, junto com a UAT-250.
- **P2-2 · a lista ainda sobe durante o pedido, menos que antes.** Ao tocar, o aviso de 78 px (celular) vira uma linha de 20 px: a lista de faixas sobe de y = 282 para y = 224 (58 px) no celular, e de 408 para 370 (38 px) no computador, e desce de novo se a fonte falha outra vez (`measures.json` `listTop`; `ratings-fails-again-393.png` → `-asking.png` → `-after.png`). Na primeira passada o aviso sumia por inteiro (~80 px CSS; o «~160 px» da primeira passada eram pixels da captura em escala 2). O aviso do Spotify faz o mesmo. Âncora: `TracksRankingComparison.renderNotice` (`px-1` para a linha quieta, caixa com `p-4` para a falha). A mudança, se valer: a linha de «asking» dentro da mesma caixa, com a mesma altura.

## Não visto
- A carga real com o BestEverAlbums ou o Spotify fora do ar (sem conta; substituto da carga).
- A janela aberta do inventário e da janela de ranking (sem `sources`, nada aparece por desenho).
- O que acontece entre 393 e 768 px (o `md:` do botão) e um iPhone de verdade: só a emulação de 393 com toque.
