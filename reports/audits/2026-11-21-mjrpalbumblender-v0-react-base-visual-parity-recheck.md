---
type: ux-audit
subject: "Reconferência visual pré-merge do ramo claude/f83-wave-0-base (F83, onda 0): a tela «Coming soon» em React em /artists, /genres e /tracks, o aviso «No connection» com «Try again», o painel de falha e a barra de progresso — 1280 e 393"
project: mjrpalbumblender-v0
features: [F83]
moment: delivery
date: "2026-11-21 14:36"
judged: "2026-11-21 14:36"
judged_commit: 0681a96
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 3
duration_s: 1500
status: open
---

# Reconferência visual — a base do React e a tela «Coming soon» (F83, onda 0)

**Veredito: passa (`pass`), sem P0 e sem P1; ficam 3 P2.** As três telas do canário são iguais às de produção, no HTML de `#app` e pixel a pixel, a 1280 e a 393, no servidor de desenvolvimento e no build de produção. Sem rede, a tela diz «No connection» com «Try again» de 45 px de altura; com a rede de volta, «Try again» desenha a tela sem recarregar a página. Os P2: o texto branco do botão de fogo (decisão de cor já aberta no design system), «Try again» sem sinal quando a rede ainda não voltou, e o painel de falha com o rastro técnico (igual ao de antes, por REQ-01).

## Como foi feito
- **Quem julgou:** agente juiz separado (Opus); não construiu o ramo. Li a spec (`docs/specs/features/F83-site-screens-in-react/spec.md`, REQ-01, REQ-02, REQ-05, REQ-10), a evidência do construtor (`reports/evidence/F83/wave-0/`), `public/js/router.js`, `public/js/utils/loadScreen.js`, `public/js/utils/failurePanel.js`, `public/js/screens/coming-soon/ComingSoon.tsx` e o design system.
- **Objeto:** o ramo em `0681a96`, no worktree `agent-a0f9da6a9f38c150d`. Servidor de desenvolvimento do ramo em `127.0.0.1:5791`; um build do ramo (`vite build` para a pasta de rascunho, sob `machine_load.py`) servido por um servidor estático local; produção em https://mjrp-playlist-generator.web.app. Sem conta, sem escrita (só a sessão anônima que o app abre sozinho). Servidores parados ao fim; o build de rascunho descartado.
- **Capturas e medidas:** minhas, com Playwright (Chromium): `judge.mjs`, `bar.mjs`, `nav.mjs`, `build-check.mjs`, `measures.json`, `run.log` e 33 PNG em `captures/`, ao lado deste relatório. 1280 x 800 e 393 x 852 (celular, toque). Comparação pixel a pixel com animações paradas (limiar 30 na soma RGB).

## O que foi conferido
- **(1) As três telas do canário contra produção.** `/artists`, `/genres`, `/tracks`, a 1280 e a 393: HTML de `#app` igual (1729, 1406 e 1750 caracteres), **0 pixel diferente** em todas as seis capturas (`measures.json` `1280/artists` … `393/tracks`; `captures/{1280,393}-{artists,genres,tracks}-{branch,production}.png`). Fonte Syne no título (30 px) e no corpo; título, painel e botão nas mesmas posições (título em 443,306 a 1280; 16,244 a 393; botão 193 x 45). Título da aba igual nos dois («MJRP The Album Blender - Playlist Generator»). Menu: o item da tela marcado igual nos dois; no celular a barra do topo diz «Series by Artist / by Genre / by Track» nos dois. Sem rolagem lateral (`scrollWidth` = largura). Console sem erro. No build do ramo, o `#app` das seis também é igual ao de produção (`build-check.mjs`).
- **Voltar.** `/start` → `/artists` → voltar do navegador: `/start` com uma tela só; avançar: `/artists`; «Back to Albums»: `/albums`. Igual no ramo e em produção, a 1280 e a 393 (`back-*` em `measures.json`).
- **(2) «No connection» e «Try again».** Rede cortada pela emulação do navegador, ida a `/artists` a partir de `/start`: o painel aparece em 12 ms, com `role="alert"`, título «No connection» (Syne 20 px, branco), a frase «This screen could not be downloaded. Check your connection and try again; what you have open here is kept.» (16 px, branco a 60 % sobre preto, 7,4:1) e o botão «Try again» (`.btn.btn-primary`, o botão principal do app no design system): **118 x 45 px** a 1280 e a 393 (`captures/1280-offline-no-connection.png`, `393-offline-no-connection.png`). Nada cortado; a barra de progresso não fica presa. Rede de volta, «Try again»: «Artist Series» desenha; `performance.timeOrigin` e uma marca na janela iguais, nenhum novo `load` da página (`offline-1280`, `offline-393`; `captures/*-offline-after-try-again.png`). No build do ramo, a 393, por `/tracks` e com toque: botão 118 x 45, a tela desenha, a mesma página, 0 recargas (`393-offline-*-build.png`).
- **(3) O painel de falha.** Provocado trocando o arquivo da tela por um que lança erro ao desenhar: aparece o mesmo painel das telas feitas à mão («View Error», o erro, «Go Back» de 116 x 47 px), agora pela barreira do React (`captures/{1280,393}-failure-panel.png`). Mesmo modelo e mesmo HTML que o roteador escreve (`errorPanelHtml`), como pede REQ-01.
- **A barra de progresso.** Com o arquivo da tela atrasado 1,5 s: a barra (6 px, laranja, no topo) aparece aos 152 ms e some 200 ms depois de a tela desenhar (`bar.mjs`; `captures/1280-progress-bar-slow-screen.png`). Com 100 ms de atraso, e ao voltar a uma tela já baixada, ela não aparece.
- **(4) Start e álbuns.** `/start` e `/albums` a 1280 e a 393: **0 pixel diferente** de produção; o HTML de `/start` igual; o de `/albums` difere só na hora de «Last updated» no rodapé (abaixo da dobra).
- **O menu depois de navegar dentro do app** continua marcando «Start» em `/artists`, mas produção faz exatamente o mesmo (`nav.mjs`): não é deste ramo, não conta como achado.

## Achados
- **P2-1 · texto branco no botão de fogo (decisão de cor já aberta).** «Try again» é o `.btn-primary` do app: branco 14 px peso 700 sobre o degradê `#f97316 → #dc2626` dá 2,8:1 na ponta laranja (4,8:1 na vermelha); a 14 px não conta como texto grande. É a pergunta P1 «texto-no-fogo» do `docs/specs/design-system.md`, ainda sem decisão do dono, e vale para todo botão principal do app. Âncora: `public/js/router.js` `_noConnectionPanel`; `captures/393-offline-no-connection.png`. A mudança: nenhuma neste ramo; segue a decisão do design system quando vier.
- **P2-2 · «Try again» sem rede ainda não diz nada.** Tocado com a rede ainda fora, o painel é redesenhado igual, sem nenhum sinal de que o toque aconteceu (`retryWhileOffline` em `offline-1280`/`offline-393`). A pessoa não sabe se tentou. Âncora: `public/js/router.js` `wireRetry` e `_noConnectionPanel`. A mudança, se valer: durante a pergunta à rede, o botão diz «Trying…» e fica desligado, e na volta sem rede a frase diz «Still no connection.».
- **P2-3 · o painel de falha fala em termos técnicos.** «View Error» e o rastro da pilha (com endereços de arquivo) aparecem para a pessoa; a 393 o rastro sai pela direita dentro da caixa (rolagem interna). É o painel de antes, mantido igual de propósito (REQ-01), então não é regressão. Âncora: `public/js/utils/failurePanel.js` `errorPanelModel`; `captures/393-failure-panel.png`. A mudança, numa decisão à parte (muda a aparência): uma frase simples («This screen could not be shown.») com «Go back», e o rastro só no console.

## Não visto
- Um iPhone de verdade: só a emulação de 393 com toque.
- A rede que responde à pergunta e cai antes de o arquivo chegar (o caminho da recarga única da F64): não provocado.
- O painel «This screen could not be loaded» (aba numa versão antiga) e o português em prévia: não provocados por mim.
- Estados com conta (sem login, por regra desta passada); a busca de artista do Start.
