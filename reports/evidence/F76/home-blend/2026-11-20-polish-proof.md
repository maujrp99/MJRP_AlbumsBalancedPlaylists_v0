---
type: evidence
feature: F76
date: 2026-11-20
---
# F76 · polimento da Home (crítica N1, N10, N4, N15, N16) — prova

O app de verdade servido pelo Vite deste ramo (`feat/f76-mobile-polish-home-playlists`) e, para o antes, uma cópia de `main` (`git archive`) noutra porta; o arnês `reports/evidence/F76/harness/home-blend.mjs` preenche a Home pela própria página (18 álbuns de títulos longos). Tamanhos: 393x852 e **393x660** com toque, 1280x800.

```sh
npx vite --port 5194 --strictPort --host 127.0.0.1
SCENES=home-empty,home-results,home-chosen,home-scrolled,home-bulk,home-sheet,home-sheet-named,home-sheet-noname,edit-series node reports/evidence/F76/harness/home-blend.mjs polish 5194
```

Cenas novas: `home-scrolled` (a grade rolada 200 px: N1), `home-sheet-named` e `home-sheet-noname` (a folha dos escolhidos com e sem nome: N10).

- N1: antes, «Studio», «EPs», «Compendiums» e «?» presos no topo, sem fundo, sobre as capas (`before-polish/home-scrolled-393x852.png`); depois, só capas (`polish/home-scrolled-393x852.png`).
- N10: a folha mostra «SERIES NAME» com o valor da página; sem nome, «Create series» abre a folha com «Give the series a name first.» e o cursor no campo.
- Em todas as cenas do celular, nos dois tamanhos: largura 393, 0 texto < 12, 0 campo < 16, 0 alvo < 44 (`polish/measures.json`).
- Computador, 1280x800: `home-results`, `home-chosen`, `home-scrolled`, `home-bulk` idênticos pixel a pixel; `home-empty` difere numa faixa de 228x5 px no brilho do botão «Sign In» da barra do computador (antisserrilhado da primeira cena da rodada; nenhum arquivo deste ramo a desenha).
