---
type: ux-audit
subject: "Segunda reconferência visual pré-merge do ramo feat/f88-top-menu-build, depois dos consertos dos 7 achados da primeira (c0e4d4c): a home nova (F80) e o menu do topo do app (F88), com a barra centrada de 412 px, o corte em 900 px para a home e o app, e o estado da Apple Music perguntado em segundo plano — 393, 800, 820, 900 a 1600"
project: mjrpalbumblender-v0
features: [F80, F88]
moment: delivery
date: "2026-11-21 18:48"
judged: "2026-11-21 18:48"
judged_commit: c51abfc
who_judged: separate-agent
verdict: fail
p0: 0
p1: 1
p2: 3
duration_s: 2600
status: open
---

# Segunda reconferência visual — a home nova e o menu do topo do app

**Veredito: não passa (`fail`), sem P0; 1 P1 e 3 P2.** Os sete achados da primeira passada foram respondidos: o P1 da Apple Music está resolvido, e o pulo de 768–899 px também (a home e o app usam o mesmo desenho até 899 px). Mas o conserto da posição da barra trouxe um problema novo e maior que o de antes: para centrar a barra na página, ela foi estreitada de 620 para 412 px na home e no app. É uma saída visível da home v4 que o dono aprovou, e precisa voltar a ele.

## Como foi feito
- **Quem julgou:** o mesmo agente juiz (Opus) da primeira passada (`2026-11-21-mjrpalbumblender-v0-home-and-top-menu-visual-parity-recheck.md`, commit `481ec94`); não construiu o ramo.
- **Objeto:** o ramo em `c51abfc` (diferença desde `481ec94` em `public/`: `bar-menu.css` `--bar-w`, `top-menu.css`, `splash.html`, `appleState.js`, `connections.js`, `AuthNav.js`, `isPhone.js`, `mobile.css` e `css/mobile/*` de 767 para 899 px, `tailwind.config.js` `md: 900px`).
- **Antes e depois nas larguras de tablet:** o «antes» é a árvore de `481ec94` exportada (`git archive`) para a pasta de rascunho; as telas desse commit são as de produção, com `md` = 768. Cada tela foi servida pelas costuras da reconferência em lote (`reports/evidence/visual-recheck-batch/2026-11-21/{albums,playlists,inventory}/harness/`: as views reais com dados de exemplo — 50 séries, 211 discos no inventário, 6 playlists). Sete servidores Vite (um app, três costuras do depois, três do antes) e o Chrome headless, todos parados ao fim. A Start com resultados usa a costura `shell/stub.mjs` no app real.
- **Produção:** lida sem conta, a 800 × 1100 e 820 × 1180, com o Firebase Auth e o Firestore recusados no navegador; nada criado nem escrito lá. **Aviso honesto sobre a primeira passada:** naquela vez a produção foi aberta sem essa recusa, e o app de produção tenta um cadastro anônimo para todo visitante; podem ter ficado até 3 contas anônimas no Auth de produção.
- **Costuras do app:** as mesmas da primeira passada (conta de teste estável, MusicKit substituto, token respondido localmente, `/v1/me` local).
- **Capturas e medidas:** `captures-2/` (133 PNG; lado a lado `sbs-*`, grade `grid-tablet-800-b.png`) e `bar2.json`, `tablet.json`, `apple2.json`, `verify2.json`; roteiros `bar2.mjs`, `tablet.mjs`, `apple2.mjs`, `verify2.mjs`, ao lado deste relatório.

## Os sete achados da primeira passada
- **P1-1, o botão nega a Apple Music: resolvido.** Enquanto a pergunta está a caminho, o botão fica neutro: rótulo «Account and connections», sem ponto e com `data-apple="pending"`; nunca diz «Nothing connected». Depois, o estado verdadeiro aparece sem abrir o painel: com o token levando 5 s, o ponto e o rótulo «Apple Music connected» chegam em 5,3 s. Quem não autorizou vê «Nothing connected» só depois da resposta. Com falha, o botão continua neutro e o painel mostra «Could not connect» + «Try again». Com os dois serviços conectados, aparecem os dois pontos. Evidência: `apple2.json`, `apple2-*.png`. A primeira pintura não ficou mais pesada: ela acontece por volta de 20–45 ms, e o pedido do token sai depois do fim da carga (cerca de 125–150 ms). O peso foi para depois da carga, e para todo visitante (P2-2).
- **P2-1, a barra encostada à esquerda: respondido com o centro**, mas com a largura cortada (P1-1 abaixo).
- **P2-2, o pulo de 768–899 px: resolvido.** A 800 e 820 px, a home e o app têm o mesmo topo de 56 px e a mesma barra de baixo de 65 px. A marca tem 133 × 22 nos dois (`verify2.json` `home-800`/`start-800`; `sbs-tablet-start-and-passage-800.png`). O custo está no P2-1 abaixo.
- **P2-3, a largura com e sem conta: resolvido.** A barra tem a mesma largura e a mesma posição nos quatro casos (PT/EN × sem/com conta), em todas as larguras. O ⟲ fica a 9 px de «Playlists» a partir de 1000 px, mas só a 5 px em 900 px.
- **P2-4, o lado direito: resolvido.** A inicial «T» em laranja, sem imagem; «Sign In» é o botão fantasma da home (fundo transparente, borda branca de 1 px, 44 px de altura) — `p24-*.png`.
- **P2-5, o painel fecha ao desconectar: resolvido.** Depois de confirmar «Disconnect», o painel fica aberto, mostra «Not connected» e o foco vai para «Connect» (`p25-after-disconnect-1280.png`).
- **P2-6, as rotas sem item: resolvido.** `/artists`, `/genres` e `/tracks` acendem Albums, a 1280 e a 393.

## As três mudanças além do pedido
1. **A largura da barra: pior que antes (P1-1).** De 1000 px para cima a barra tem 412 px; a 900, 374. Na v4 aprovada ela tem 620 px de 1100 px para cima e 497–537 px a 1000. Cada parada encolhe de 124 para 82 px, o espaço entre os rótulos de 63 para 21 px (13 px a 900), e o trecho de fogo de cada parada de 21 para 14 barras. Os rótulos em português cabem, «Inventário» incluído, sem corte nem rolagem lateral. Ao lado da v4, a diferença salta aos olhos (`sbs-bar-1280-v4-vs-build.png`, `sbs-bar-1000-v4-vs-build.png`). Abaixo de 1280 px a home também tira «Abrir o app» do cabeçalho, onde a v4 o tinha de 900 a 1279 px; o caminho para o app continua claro na primeira tela, pelo botão laranja grande da abertura (y ≈ 600 de 900 a 1000 e 1100 px, `home-pt-out-1000.png`), mas o cabeçalho fica só com «Entrar».
2. **O corte em 900 px: a troca vale, com um custo (P2-1).** Nada quebrou nem cortou. Nenhuma das 7 telas com dados rola para o lado, e o texto mínimo é de 12 px (antes havia 10 px). Várias telas ficaram melhores no tablet. Na janela do álbum, o antes cortava as faixas para «21_», «I T…», e o depois mostra os títulos inteiros. Nas playlists salvas e no inventário, a lista do celular cabe melhor que os cartões apertados do computador. A barra de ação do Blend continua presa embaixo. Ficou pior a densidade das grades de capas: em Albums e nos resultados da Start, 2 capas por linha de 377–388 px contra 3 de 216–223 px antes, e só uma capa e meia por tela (`sbs-tablet-albums-800.png`, `app-start-results-800.png`). Os filtros do computador viram o botão «Filters». O pulo afetava um momento; o novo desenho afeta toda sessão no tablet, mas sem nada quebrado. Por isso o pulo era o problema maior.
3. **A conta: certo, com um custo (P2-2).** A foto não é mais desenhada (só a inicial). O estado da Apple Music fica neutro até a resposta e depois aparece sem abrir o painel; a primeira pintura não mudou.

## Achados
- **P1-1 · a barra da home ficou um terço mais estreita que a v4 aprovada — volta ao dono.** Com 412 px no lugar de 620, os rótulos ficam juntos (21 px entre eles, 13 px a 900) e o fogo de cada parada fica mais curto (14 barras no lugar de 21). De 900 a 1279 px o cabeçalho da home também perde «Abrir o app». A barra vem do conserto do P2-1 da primeira passada: centrar a barra de 620 px na página bateria nos botões da direita, por isso ela foi cortada. Âncora: `public/splash/bar-menu.css` (`--bar-w: min(412px, calc(100vw - 526px))`) e `public/splash.html` (`.ms-desk`; `@media (max-width:1279px){.top .acct .btn-primary.only-out{display:none}}`). Evidência: `bar2.json`, `sbs-bar-1280-v4-vs-build.png`, `sbs-bar-1000-v4-vs-build.png`, `v4-*.png` e `home-*.png` de 900 a 1600. A mudança: o dono escolhe numa decisão só, com a captura lado a lado: (a) 620 px no vão entre a marca e a direita, como na v4, com a barra andando cerca de 70 px entre sem e com conta; (b) 620 px encostada à esquerda (a primeira construção); (c) 412 px centrada (hoje).
- **P2-1 · no tablet, as grades de capas ficam com 2 colunas enormes; e a regra «768 px para cima não muda» foi trocada sem registro.** Em Albums e nos resultados da Start, a 800–899 px, cabem só 2 capas de cerca de 380 px por linha. Âncora: `tailwind.config.js` (`md: 900px`), `public/css/mobile.css` e `css/mobile/*` (`max-width: 899px`); a regra REQ-12 da F76. Evidência: `tablet.json`, `sbs-tablet-albums-800.png`, `app-start-results-800.png`. A mudança: 3 colunas a partir de cerca de 600 px na grade de capas do celular; e registrar no `prd.md` e na F76 que o corte do celular passou para 899 px.
- **P2-2 · a Apple Music é perguntada em toda visita, a todo visitante.** Depois da carga, toda página do app pede `/api/musickit-token` e baixa o `musickit.js` da Apple, inclusive para quem nunca usou a Apple Music. Onde o script da Apple é bloqueado, o console mostra dois erros («Failed to load MusicKit JS») e o painel mostra «Could not connect». Âncora: `public/js/components/navigation/appleState.js` (`checkAppleWhenIdle`) e `public/js/app.js`. Evidência: `apple2.json` (`visitor-no-musickit-script`). A mudança: perguntar só quando o navegador já guarda sinal de uma autorização anterior (a marca que o MusicKit deixa, ou uma marca do próprio app gravada ao conectar); para os outros, «Not connected» sem pedir nada.
- **P2-3 · a 900 px o ⟲ fica a 5 px de «Playlists».** De 1000 px para cima a folga é de 9 px. Âncora: `public/splash/bar-menu.css` (`.ms .flipmark`) e a barra de 374 px a 900. Evidência: `bar2.json` (`*-900`), `home-pt-out-900.png`. A mudança: entra junto com a decisão do P1-1.

## Não visto
- Uma conta real da Apple Music ou do Spotify, e o tamanho real do `musickit.js` baixado em cada visita.
- Um iPad e um iPhone de verdade: só a emulação (800 × 1100 e 820 × 1180 com toque; 393).
- A Start com resultados no «antes» (o app de `481ec94` precisa do `.env` que a cópia não tem). A comparação com produção a 800 e 820 px é com a biblioteca vazia.
- O leitor de tela além dos nomes e estados lidos no DOM.
