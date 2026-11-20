# F76 · polimento da janela do álbum e do ranking (N6, N7, N9, N4) — prova

**Ramo:** `feat/f76-mobile-polish-inventory-windows`. **Como:** `../harness/album-window.html` (componentes de verdade, título de 72 letras, 16 faixas, item de inventário com valor do Discogs) servido pelo Vite do worktree (`npx vite --port 5392 --strictPort --host 127.0.0.1`) e `shoot.mjs` com `SCREENS=inventory,inventory-open,rank,rank-discard` (os dois últimos cenários são novos).

| Medida | Antes (`polish-before/`) | Depois (`polish-after/`) |
|---|---|---|
| Janela do Inventário, faixas inteiras a 393x852 | 0 (faixas em y≈965) | 3 (controle das faixas em y≈465) |
| Janela do Inventário a 393x660 | 0 | 0 inteiras: o controle das faixas à vista, a primeira faixa no pé |
| Alvos < 44 · texto < 12 · rolagem de lado (celular) | 0 · 0 · 0 | 0 · 0 · 0 |
| 1280x800 (`inventory`, `album`, `rank`) | — | idênticos pixel a pixel (`polish-after-desk/`) |

O que vi: a linha do valor («Estimated value / ≈ $30.75 Discogs ⌄ Data provided by Discogs.») e a linha das três lojas ficam calmas e alinhadas; aberta (`inventory-open`), a seção é a de antes. «Original» agora na superfície clara, sem competir com o laranja. A folha «Discard changes?» (`rank-discard`) sobe sobre a lista com «Keep editing» em destaque e «Discard» em vermelho. N7(b), os botões sem rótulo, não apareceu nas capturas do Chrome: o ajuste é defensivo.
