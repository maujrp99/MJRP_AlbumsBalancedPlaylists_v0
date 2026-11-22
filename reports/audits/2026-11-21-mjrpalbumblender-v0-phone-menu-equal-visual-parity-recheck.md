---
type: ux-audit
subject: "Reconferência visual pré-merge do ramo fix/f88-phone-menu-equal-in-home-and-app, no site CONSTRUÍDO (vite build) e no WebKit com perfis de iPhone: um menu de baixo só, os mesmos pixels na home e no app (UAT-270), o ícone «Go» do Start, a barra opaca"
project: mjrpalbumblender-v0
features: [F88]
moment: delivery
date: "2026-11-21 21:10"
judged: "2026-11-21 21:10"
judged_commit: 8c09860
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 3
duration_s: 2700
status: open
---

# Reconferência visual — o menu de baixo do celular, igual na home e no app

**Veredito: passa (`pass`), sem P0 e sem P1; 3 P2.** O defeito que o dono viu no iPhone está consertado no site construído: no WebKit, com iPhone 14 e iPhone SE, o menu de baixo da home (PT e EN, sem e com conta) e o de cada tela do app (`/start`, `/albums`, `/blend`, `/playlists`, `/saved-playlists`, `/inventory`) têm as mesmas medidas ao centésimo de pixel: barra de 76 px, fileira de barras de 17 px em y = 7, ícones 24 × 24 em y = 29, rótulos em y = 56 com Syne 12 px 700, o mesmo fundo opaco `#0a0a0c`, a mesma linha de cima. Na sobreposição dos recortes, a fileira de barras e os ícones dão **0 pixel diferente** fora do item atual. A única diferença que sobra é a espessura com que o Mac desenha os rótulos (P2-1), que no iPhone de verdade não deve existir. O «Go» lê como a palavra, tem o peso dos outros quatro e fica laranja quando atual; a casa sumiu de todo lugar.

## Como foi feito
- **Quem julgou:** agente juiz separado (Opus); não construiu o ramo.
- **Objeto:** `8c09860` e `main` (`ccc9feb`; depois da base do ramo, `3f3393b`, `main` só mudou documentos), cada um construído com `vite build` pela fila da máquina (`machine_load.py`, rótulo `judge-f88-phone-build`) em pastas de rascunho e servidos por um servidor local em `127.0.0.1` que reescreve as rotas como o `firebase.json` (`/home` → `index.html`, o resto → `app.html`, `/api` → 500).
- **Navegador:** Playwright 1.56.1 (de outro projeto do MJRP na máquina), WebKit, perfis `iPhone 14` (390 × 664) e `iPhone SE` (320 × 568); larguras livres de 768, 820 e 899 px; computador a 1280 × 800.
- **Costuras:** os pedidos a `identitytoolkit`, `securetoken`, `firestore.googleapis` e `firebaseinstallations` foram recusados (58 pedidos); nenhum login, nada escrito. «Com conta» na home = a classe `html.in` da própria página. **Texto maior:** `-webkit-text-size-adjust:150%` e os rótulos forçados a 18 px / 21 px (uma simulação, não o aA do Safari).
- **Roteiros e medidas** (rascunho, fora do repositório): `work/judge.mjs`, `work/cmp.mjs`, `work/font.mjs`, `work/judge.json`. Os servidores foram parados ao fim de cada roteiro.
- **Capturas:** `captures/` (11 recortes, 1,2 MB).

## O que foi conferido
1. **Os mesmos pixels na home e no app** (`iPhone14-bars-home-and-every-app-screen.png`, `iPhoneSE-bars-home-and-every-app-screen.png`):
   - **Medidas:** um só `.pbar` por página; altura 76 px, encostada no fim da tela; fileira de barras 390 (SE: 320) × 17 px em y = 7, 65 barras (SE: 53) nas duas páginas; ícones em x = 27, 105, 183, 261, 339 (SE: 20, 84, …); rótulos em y = 56, altura 14; `Syne 12px 700`, espaçamento −0,36 px; cinza `#b9b9c2`, atual `#fb923c`; traço 2; fundo `rgb(10,10,12)`, opacidade 1, sem desfoque; linha de cima 1 px `rgba(255,255,255,.12)`; `padding-bottom` do corpo 76 px nas duas.
   - **Sobreposição dos recortes** (home EN contra cada tela do app, o item atual mascarado): fileira de barras 0 pixel diferente no iPhone 14; no SE de 46 a 135 pixels, que são o trecho aceso passando um pouco da coluna (53 barras não dividem por 5). Ícones: 0. Rótulos: diferem na espessura (P2-1).
   - **O item atual:** laranja, com o ícone brilhando, e o trecho de barras aceso (4 barras no recorte de cada coluna) em todas as telas do app. Na home, no topo, nenhum está aceso; o trecho segue a rolagem, como já era.
2. **Barra opaca** (`opaque-over-white-and-yellow.png`): com uma faixa branca e amarela de letras brancas de 40 px posta logo atrás da barra, na home e em Albums, o fundo da barra continua `#0a0a0c` puro; nada aparece através. No `main` a barra da home era translúcida e a capa passava por trás dos rótulos (`iPhoneSE-main-vs-branch-home-start-and-menu-sheet.png`, primeiro quadro).
3. **«Go»** (`icons-row-start-current-iPhone14.png`): lê como «Go»; mancha de 18 × 23 px contra 14–22 × 20–22 dos outros quatro, mesma quantidade de tinta (1253 px contra 1094–1672) e mesmo traço; laranja quando atual. A casa (`M3 10.5 12 3l9 7.5`, ainda definida em `Icons.js`) não aparece em nenhuma página no celular, nem na folha «Menu» (aberta por toque no SE), nem no computador, onde a barra não mostra ícones (`.ms .ic` escondido).
4. **Rótulos e barras:** nenhum rótulo nem ícone divide pixels com as barras em nenhuma combinação, também com texto maior (5 px das barras ao ícone). Alvos: 78 × 75 (SE 64 × 75), com texto maior 82 de altura. Tamanho normal: nenhum rótulo cortado, nem «Inventário» no SE (folga de 7,3 px até «Playlists»). Com texto maior: P2-2.
5. **O que a barra mais alta cobre:** a barra ficou 11 px mais alta que a da home no `main` (76 contra 65).
   - **Start:** o painel da série (`.home-dock`) sobe junto e termina exatamente no topo da barra (iPhone 14: 522–588; SE: 372–492).
   - **Blend:** a barra de ação termina no topo da barra (523–588).
   - **Inventory:** a barra fixa do inventário fica no alto (219–280); o fim da lista toca o topo da barra, sem passar.
   - **Albums, Playlists e Saved playlists:** vazias, com o Firestore recusado; o fim da página fica acima da barra e o corpo reserva 76 px.
   - **A janela do álbum:** cobre a tela inteira por cima da barra (`modals.css`, `z-index` máximo), então a barra não chega às ações dela; visto no CSS, não na tela (sem dados).
   - **A primeira tela da home:** no iPhone 14 o caixote aparece; no SE quase só a legenda (P2-3).
6. **O computador a 1280 px:** a barra de cima tem as mesmas posições (330 → 950, cinco paradas de 124 × 52) no ramo e no `main`. Pixel a pixel: Albums, Inventory e Start 0 diferença; na home só as faíscas aleatórias do caixote (`desk1280-*.png`).
7. **De 768 a 899 px:** a 768, 820 e 899 px a home e o app usam o mesmo `.pbar` de 76 px, com as mesmas posições de ícones (`w820-home-and-albums.png`).

## Achados
- **P2-1 · no WebKit do Mac, os rótulos da home saem mais finos que os do app.** As medidas são iguais, mas a home põe `-webkit-font-smoothing:antialiased` no `body` e o app deixa `auto`; no Mac isso muda a espessura do Syne. Os recortes diferem só na linha dos rótulos (cerca de 2400 pixels no iPhone 14). No iOS essa propriedade não age, então no iPhone deve ser igual; numa janela estreita do Safari no Mac (768–899 px) a passagem ainda «pula» um pouco.
  - **Âncora:** `public/splash/bar-menu.css` (`.pbar`), `public/splash.html` (`body`).
  - **Evidência:** `label-weight-home-top-app-bottom-iPhone14.png`; `work/font.mjs`.
  - **A mudança:** fixar o desenho da fonte na própria barra, por exemplo `-webkit-font-smoothing:antialiased` em `.pbar`.
- **P2-2 · com texto maior, «Playlists» e «Inventory» se tocam, agora nas duas páginas.** A 18 px, os rótulos longos cortam com reticências, mas o `max-width:calc(100% + 6px)` deixa cada rótulo passar 3 px para cada lado da sua parada. As caixas se cruzam −2,2 px no iPhone 14, onde se lê «PlaylistsInvento…», e −6 px no SE. Continua a UAT-263, agora igual na home e no app.
  - **Âncora:** `public/splash/bar-menu.css`, `.pbar .ms .lb`.
  - **Evidência:** `larger-text-18px-home-and-app.png`.
  - **A mudança:** `max-width:100%` com um respiro (por exemplo, `padding:0 2px` na parada), ou permitir duas linhas com texto maior.
- **P2-3 · no iPhone SE, a primeira tela da home quase não mostra o caixote.** A barra 11 px mais alta e agora opaca cobre o que antes aparecia por baixo. Sobram a legenda «Álbuns fictícios · arte original» e uma faixa de cerca de 30 px da capa. No iPhone 14 o caixote aparece bem.
  - **Âncora:** `public/splash.html` (o herói no celular), `public/splash/bar-menu.css` (`--pbar-h`).
  - **Evidência:** `iPhoneSE-first-screens-home-start-and-iPhone14-home.png`; `iPhoneSE-main-vs-branch-home-start-and-menu-sheet.png`.
  - **A mudança:** em telas baixas (altura ≤ 600 px), apertar o espaço do herói para o caixote subir, ou aceitar como está.

## Não visto
- **Um iPhone de verdade:** só o WebKit do Playwright com os perfis. O Safari do iOS (que deve tirar o P2-1), o aA e o Dynamic Type de verdade e a área segura real não foram vistos.
- **Listas com dados:** com o Firestore recusado, Albums, Playlists e Saved playlists ficaram vazias, e a janela do álbum não abriu. As últimas linhas e as ações da janela foram conferidas pelo espaço que o corpo reserva e pelo CSS, não com conteúdo.
- **Já registrado e fora deste ramo:** a 320 px o cabeçalho da home ainda rola para o lado (largura 346–383; UAT-262). O painel da série no Start do SE aperta o texto («No albu… yet»), igual ao `main`.
