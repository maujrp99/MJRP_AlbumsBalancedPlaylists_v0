# Paridade visual — Album Blender · Home (F79) e página de entrada (F80) × produto (2026-11-21)

Gerado por `mjrp-scripts/visual_parity/run.mjs`. Linhas: (cenário, checagem) que divergem; "projetos" são as condições (navegador-viewport-paleta) onde diverge. Dado diferente não conta.

**Totais (linhas):** P0 18 · P1 0 · P2 27

## Por checagem

| Sev | Checagem | Cenários | Condições |
|---|---|---|---|
| P0 | shell-order | 18 | 2 |
| P2 | token-names | 18 | 4 |
| P2 | header-height | 9 | 4 |

## Por cenário

| Sev | Checagem | Cenário | Condições | Protótipo | Produto |
|---|---|---|---|---|---|
| P0 | shell-order | f79-chosen | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-chosen1 | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-created | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-createfail | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-creating | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-empty | chromium-w1280-dark, webkit-w1280-dark | header | footer |
| P0 | shell-order | f79-error | chromium-w1280-dark, webkit-w1280-dark | header | footer |
| P0 | shell-order | f79-guest | chromium-w1280-dark, webkit-w1280-dark | header | footer |
| P0 | shell-order | f79-many | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-noname | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-notfound | chromium-w1280-dark, webkit-w1280-dark | header | footer |
| P0 | shell-order | f79-paste | chromium-w1280-dark, webkit-w1280-dark | header | footer |
| P0 | shell-order | f79-pastereport | chromium-w1280-dark, webkit-w1280-dark | header | footer |
| P0 | shell-order | f79-removed | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-reorder | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-results | chromium-w1280-dark, webkit-w1280-dark | header | header › footer |
| P0 | shell-order | f79-scanning | chromium-w1280-dark, webkit-w1280-dark | header | footer |
| P0 | shell-order | f79-typing | chromium-w1280-dark, webkit-w1280-dark | header | footer |
| P2 | header-height | f79-empty | chromium-w1280-dark, webkit-w1280-dark | 611px | 0px |
| P2 | header-height | f79-error | chromium-w1280-dark, webkit-w1280-dark | 611px | 0px |
| P2 | header-height | f79-guest | chromium-w1280-dark, webkit-w1280-dark | 611px | 0px |
| P2 | header-height | f79-many | todas (4) | 100px | 44px |
| P2 | header-height | f79-notfound | chromium-w1280-dark, webkit-w1280-dark | 611px | 0px |
| P2 | header-height | f79-paste | chromium-w1280-dark, webkit-w1280-dark | 611px | 0px |
| P2 | header-height | f79-pastereport | chromium-w1280-dark, webkit-w1280-dark | 611px | 0px |
| P2 | header-height | f79-scanning | chromium-w1280-dark, webkit-w1280-dark | 611px | 0px |
| P2 | header-height | f79-typing | chromium-w1280-dark, webkit-w1280-dark | 611px | 0px |
| P2 | token-names | f79-chosen | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-chosen1 | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-created | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-createfail | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-creating | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-empty | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-error | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-guest | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-many | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-noname | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-notfound | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-paste | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-pastereport | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-removed | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-reorder | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-results | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-scanning | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
| P2 | token-names | f79-typing | todas (4) | só no protótipo: --eq-grad --flame --flame-a --flame-b --flame-text --t-dock-h --t-line --t-muted --t-panel --t-soft | só no produto: --home-dock-h --home-eq-grad --home-flame --home-flame-a --home-flame-b --home-flame-text --home-line --home-muted --home-panel --home-soft --home-text-font |
