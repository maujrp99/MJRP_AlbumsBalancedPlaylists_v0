# F84 · o sensor visual: cada achado explicado (2026-11-21)

**Comando:** `python3 <harness>/mjrp-scripts/machine_load.py run --label v0-visual-sensor --wait 3600 -- node mjrp-scripts/visual_parity/run.mjs test/visual/visual.config.mjs` · **config:** `test/visual/visual.config.mjs` · **rodadas:** `run-1-2026-11-21/` (regiões genéricas `header`/`main`/`footer`) e `2026-11-21/` (regiões da casca do app). Playwright 1.63.0, Chromium e WebKit, 1280 e 393, escuro. Sem conta; nada gravado (catálogo e `writeSeries` trocados dentro da página).

**Resultado real da rodada 2:** P0 18 · P1 0 · P2 27 · exit 1. A F80 (7 cenários × 4 condições) e todo o celular (393) não têm nenhuma diferença.

## Os 18 P0 `shell-order` (F79, só a 1280, Chromium e WebKit) — conferidos par a par

- **Rodada 1 (seletores genéricos): artefato dos seletores.** O `header` que a configuração achava não era a casca: no protótipo é `header#phone-topbar` (a barra do celular, 611 px de altura inútil no computador) e no produto `header#homeArtist` (o título do artista, 0 px). A casca do app, nos dois lados, é `#header-container > nav.top-nav` (74 px, igual) e `footer.site-footer`.
- **Rodada 2 (seletores da casca): a ordem mudou de «header / footer» para «header › main» contra «header › main › footer» — e essa diferença é real.** O protótipo (a captura da Home real, sem o CSS do rodapé) renderiza o rodapé com 0 px e o logotipo MJRP sem tamanho, enorme, no canto de baixo à esquerda (visível em `pairs/*/f79-empty.pair.jpg`, `f79-many.pair.jpg`); o produto mostra o rodapé de verdade (Home · Albums · Playlists · Clear Cache, «Powered by MJRP Software»). Não é diferença de seletor: o protótipo aprovado não tem rodapé utilizável nessa tela. **Fica relatado, sem mexer no produto nem esconder a região.** Decisão que cabe ao MJRP: aceitar o rodapé do produto (o protótipo é que está com defeito) ou pedir a correção do protótipo.

## Os 27 P2

- **`token-names` (18, todas as condições):** nomes de variáveis CSS diferentes (`--flame`, `--t-*` no protótipo; `--home-*` no produto). O protótipo usa nomes próprios; o kit não compara valores. P2 de nome, sem efeito visível nos pares.
- **`header-height` (9):** o kit mede o primeiro `<header>` da página, que não é a casca nos dois lados (acima): 611 px × 0 px em oito estados, o `phone-topbar` escondido do protótipo contra o título do artista do produto; em `f79-many`, 100 px × 44 px, dois elementos `<header>` diferentes também. Não aponta diferença visível; os pares lado a lado mostram a casca igual.

## O que o sensor não diz, e os pares mostram (para quem confere)

- Em `f79-many`, o protótipo adiciona 13 álbuns e o produto 17 («Added 13 albums» × «Added 17 albums»; «+6» × «+10» na base): parece dado do estado montado, não forma; não foi julgado aqui e fica para quem confere.

## A rota da Home (F85)

Na `main` a Home é `/home`; a F85 passa para `/start`, com `/home` redirecionando. A configuração lê `VISUAL_HOME_PATH` (padrão `/home`). Com o redirecionamento do lado do cliente o sensor continua valendo sem mudar; se o redirecionamento for do servidor ou perder o `window.controller`, basta `VISUAL_HOME_PATH=/start` ou trocar o padrão em `test/visual/visual.config.mjs` (a constante `HOME_PATH`).
