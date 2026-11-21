---
type: ux-audit
subject: "Reconferência visual pré-merge do ramo wip/f80-home-bar-is-the-menu-build: a home «A barra é o menu» v4 (o ritmo da página, vinhetas por história, abertura enxuta no celular) na página de entrada real, contra o protótipo aprovado design/inception/splash-menu-bar-v4.html — 1280 e 393"
project: mjrpalbumblender-v0
features: [F80]
moment: delivery
date: "2026-11-21 15:06"
judged: "2026-11-21 15:06"
judged_commit: 6cc8863
who_judged: separate-agent
verdict: fail
p0: 0
p1: 1
p2: 4
duration_s: 2400
status: open
---

# Reconferência visual — a home v4 «A barra é o menu»

**Veredito: não passa (`fail`), sem P0; 1 P1 e 4 P2.** A página construída bate com o protótipo v4 em quase tudo: as mesmas alturas de seção e os mesmos trechos vazios ao pixel, as cinco vinhetas animam de verdade, entram e saem com a rolagem, param com o ícone de pausa e com o repouso, e ficam na imagem composta com movimento reduzido. As duas saídas aprovadas estão lá. O P1: no celular, com conta, o botão «Inicie» encosta no título (0 px de folga), porque o parágrafo que dava o espaço foi escondido no celular.

## Como foi feito
- **Quem julgou:** agente juiz separado (Opus); não construiu o ramo.
- **Objeto:** o ramo em `6cc8863`, servido pelo Vite do próprio ramo (`vite --port 5413`, raiz `/`); o protótipo aprovado `design/inception/splash-menu-bar-v4.html` da `main`, servido estático (`:5414`). Os dois servidores e o Chrome foram parados ao fim.
- **Costura da conta:** a do próprio `gate.js` — uma chave `firebase:authUser:…:[DEFAULT]` com `isAnonymous:false` no localStorage antes de carregar; nenhum login real. No protótipo, `?in=1`.
- **Ferramenta:** Chrome headless por CDP (`shoot.mjs`, ao lado deste relatório), rodado pelo `machine_load.py`. 393 × 852 (toque, escala 2) e 1280 × 900; sem e com conta; PT (clique em «PT», porque o navegador headless fala inglês e a página escolhe EN) e EN.
- **Capturas e medidas:** `captures/` (243 PNG: `build-*`, `proto-*`, lado a lado `sbs-*`, grades `G*`, `D*`, `R393`, `P*`) e `measures-static-*.json`, `measures-ptc.json`, `measures-motion.json`, `measures-gap.json`.

## O que foi conferido
- **Primeira tela do celular:** sem conta, só o sobretítulo, «Mergulhe nos álbuns que você ama.», a linha laranja «Seus álbuns do momento, numa playlist balanceada.» e «Abrir o app»; o parágrafo e o «Entrar» do meio somem; no topo, só «Entrar» (e PT/EN). O caixote aparece de 399 a 805 px (PT, sem conta) e de 311 a 717 px (com conta) — na primeira tela (`build-393-out-ptc-first.png`, `P1.png`). No protótipo ele começava a 545 px. Saídas aprovadas: **conferidas**.
- **A barra como menu e progresso:** cinco itens, o trecho do item da história acesa em laranja, a marca ⟲ da virada no computador; no celular a barra fica embaixo. Sem conta os itens vão às âncoras (`#start`…); com conta vão às telas do app (`/start`, `/albums`, `/blend`, `/saved-playlists`, `/inventory`), e o rodapé também. Com conta o topo e a abertura mostram só o «Inicie» de fogo.
- **Alturas e trecho vazio (PT, sem conta), construído = protótipo:** celular Inicie 508, Álbuns 828, Blend 533, virada 69, Playlists 533, Inventário 533, Convite 439; trecho vazio 50 / 36 / 50 / 50 / 50 / 29 px. Computador 630 / 662 / 630 / 143 / 630 / 630 / 504; trecho vazio 61 / 48 / 89 / 106 / 120 / 120 px (protótipo 62 / 48 / 90 / 108 / 122 / 120). Com conta e em EN também batem (`measures-static-*.json`).
- **A faixa curta «vire o disco»:** 69 px no celular, 143 px (PT) / 117 px (EN) no computador, igual ao protótipo.
- **O cartão de ranking:** The Velvet Underground & Nico · 1967, faixas reais «Venus In Furs ↑ você subiu», «Sunday Morning», «I'm Waiting for the Man», «Femme Fatale», «+ 7 faixas». «Venus In Furs» sobe quando o cartão passa do meio (classe `go`), igual ao protótipo.
- **Movimento, medido de verdade** (`measures-motion.json`, amostras a cada 600 ms e o estado das animações): as cinco vinhetas animam — os discos do Blend giram (matriz muda a cada amostra), o campo do Inicie digita (`v4type`), a faixa em fogo sobe (`v4climb`), ▶ e ✓ pulsam (`v4pulse`, `v4chip`), os carretéis giram (`v4spin`). Entram e saem: opacidade 0 → 0,16 → 0,63 → 1 entrando e 1 → 0,63 → 0,17 → 0 saindo, e a classe `live` cai com opacidade 0 — os mesmos números do protótipo. Pausa: 0 animações rodando na página toda; volta ao tocar de novo. Repouso (11 s sem rolar): 0 animações rodando. Movimento reduzido: nenhuma animação, a página nem se arma (`v4-armed` ausente), o ícone de pausa some, e cada vinheta fica na imagem composta («Pink Floyd» e três resultados, as seis linhas acesas, ▶ e os dois ✓) — `R393.png`, igual ao protótipo.
- **Só `transform` e `opacity`:** todos os `@keyframes v4*` e a transição do cartão (`public/splash.html` 278–365) mexem só nessas duas propriedades; nenhuma mudança de layout atribuída às vinhetas.
- **Sem rolagem lateral:** `scrollWidth` = largura em todos os casos. **Sem erro no console** no ramo. **Nada cortado:** só o «Pink Floyd» da vinheta, cortado de propósito (decorativo, `aria-hidden`).
- **Contraste:** todo texto das histórias ≥ 4,5:1; nenhum texto fica sobre uma vinheta (no computador ela vem abaixo do texto, no celular ao lado da capa).

## Achados
- **P1-1 · no celular, com conta, o «Inicie» encosta no título.** O título termina em y = 255 e o botão começa em y = 255: 0 px de folga. Sem conta são 18 px (da linha laranja ao botão); no protótipo, 18 px (do parágrafo ao botão). É a primeira tela de toda pessoa com conta no celular. Âncora: `public/splash.html` 373–375 (no celular, `.hero .what{display:none}`; só `.hero .h-sub` ganha `margin-bottom:18px`, e a abertura com conta não tem `.h-sub`). Evidência: `measures-gap.json` (`build-393 in`), `build-393-in-ptc-first.png`, `P1.png`. A mudança: no celular, dar a folga ao grupo dos botões, não à linha laranja (por exemplo `.hero .ctas{margin-top:18px}` e tirar o `margin-bottom` da `.h-sub`), conferindo os dois estados.
- **P2-1 · PT e EN no topo do celular têm 40 × 44 px.** A largura fica abaixo dos 44 px de toque. Âncora: o grupo `.lang` do cabeçalho (`public/splash.html` 441 e seu CSS no celular). Evidência: `measures-ptc.json` (`small`). A mudança: `min-width:44px` nos dois botões no celular.
- **P2-2 · o título em inglês diverge do protótipo.** O ramo diz «Dive into the albums you love.»; a v4 aprovada diz «Dig through the albums you love.» (o S-62 também). Âncora: `public/splash/copy.js` 91. Evidência: `sbs-393-out-en-first.png`, `sbs-1280-out-en-first.png`. A mudança: alinhar ao protótipo, ou registrar a troca como decisão do dono.
- **P2-3 · no computador, a página pula um pouco ao carregar, por causa das capas do caixote.** O pulo vem das capas `.sl s0…s4` (CLS 0,006 a 0,027) e soma ao pulo da troca do cabeçalho quando a página descobre a conta (0,005 a 0,017, que o protótipo também tem). O total fica entre 0,022 e 0,034, abaixo de 0,1. Nada disso vem das vinhetas. Âncora: o caixote (`public/splash/framing.js` / `crate3d.js`, as `.sl`). Evidência: `measures-ptc.json`, `measures-static-build.json` (`bottom.shifts`). A mudança, se valer: reservar o lugar das capas antes de aparecerem.
- **P2-4 · a legenda do caixote fica em inglês depois de trocar para PT.** As legendas das histórias trocam («— álbum fictício»), mas a do disco da frente continua «North Atlas · fictional album» até o próximo disco. Âncora: `public/splash/splash.js` (`captionLine` e o `onChange` do `languageControl`, 296–310). Evidência: `build-393-out-ptc-first.png`. A mudança: refazer a legenda da frente no `onChange` do idioma. Vem de antes da v4.

## Não visto
- O conjunto de capas reais (`real`): o servidor de desenvolvimento serve as capas fictícias, então o ramo foi comparado com capas fictícias e o protótipo com capas reais. Os links «Ouça no Apple Music» das capas e do cartão não apareceram no ramo por isso.
- O Caixote 3D em WebGL no Chrome headless foi visto só em captura; as 60 fps e o iPhone de verdade (Safari, toque real) não foram vistos.
- O leitor de tela, além da árvore de acessibilidade.
- As larguras entre 393 e 899 px.
