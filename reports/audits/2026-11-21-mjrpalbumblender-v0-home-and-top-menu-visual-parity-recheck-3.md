---
type: ux-audit
subject: "Terceira reconferência visual pré-merge do ramo feat/f88-top-menu-build, no site CONSTRUÍDO (vite build) e no WebKit com perfis de iPhone: os rótulos da barra de baixo sobre as barras (achado do dono no iPhone), a barra de 620 px centrada que o dono escolheu, e os três P2 da segunda passada"
project: mjrpalbumblender-v0
features: [F80, F88]
moment: delivery
date: "2026-11-21 19:28"
judged: "2026-11-21 19:28"
judged_commit: 6d518c2
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 3
duration_s: 2400
status: open
---

# Terceira reconferência visual — o site construído no WebKit

**Veredito: passa (`pass`), sem P0 e sem P1; 3 P2.** O defeito que o dono viu no iPhone está consertado no site construído: em 80 medidas no WebKit, com iPhone 14 e iPhone SE, na home e no app, sem e com conta, em PT e EN, também com texto maior, nenhum rótulo encosta nas barras. A barra de 620 px está centrada com os números do construtor, igual na home e no app, e a primeira tela da home voltou à v4 aprovada, com as escolhas do dono. Os três P2 da segunda passada foram respondidos. Ficam três P2 que só aparecem em telas de 320 px, com texto maior, ou só no WebKit.

## Como foi feito
- **Quem julgou:** o mesmo agente juiz (Opus) das duas passadas anteriores; não construiu o ramo.
- **Objeto:** `6d518c2`, construído com `vite build` (pela fila da máquina, `machine_load.py`, rótulo `judge-f88-build-3`) para a pasta de rascunho `dist3/` e servido com `vite preview` em `127.0.0.1:5493`, que reescreve as rotas como o Firebase Hosting. No `index.html` construído, `menu-*.css` (o `bar-menu.css`) vem depois dos `<style>` da própria página, que é a causa que o construtor descreveu.
- **Navegadores:** Playwright 1.56 (de outro projeto do MJRP na máquina), com o WebKit e os perfis `iPhone 14` (390 × 664) e `iPhone SE` (320 × 568), mais o `iPhone SE (3rd gen)` (375 × 667) para a rolagem lateral. O Chromium foi usado no computador (900–1600 px) e para comparar com o WebKit.
- **Costuras:** as mesmas de antes. Todo pedido para fora foi recusado, menos as fontes do Google; a consulta e a renovação da conta foram respondidas localmente com um token de teste; o MusicKit é um substituto. Nada foi escrito no Firebase Auth nem no Firestore. **Texto maior:** os rótulos foram forçados a 18 px / 21 px e `-webkit-text-size-adjust: 150%` (uma simulação do aA do Safari, não o ajuste do sistema).
- **Capturas e medidas:** `captures-3/` (128 PNG; `sbs-phone-bars-webkit-built.png`, `grid-webkit-phone-3.png`, `sbs-home-1280-v4-vs-build-3.png`), `webkit3.json`, `wk-extra.json`, `bar3.json`, `apple3.json`; roteiros `webkit3.mjs`, `wk-extra.mjs`, `bar3.mjs`, `apple3.mjs`. O servidor foi parado. Um Chromium que ficou rodando é de outra sessão (`F83/wave-4/browser-proof.mjs`) e não foi tocado.

## O que foi conferido
1. **Os rótulos e as barras no celular (o achado do dono):** em todas as combinações, nenhum rótulo divide pixels com as barras (`anyOverlap: false`).
   - **Folga:** na home, 9 px do fim das barras ao rótulo (10 px com texto maior, e a barra cresce de 65 para 72 px); no app, 10,5 px até o ícone (7 px com texto maior).
   - **Alvos e rolagem:** nenhum alvo da barra abaixo de 44 px (paradas da home de 72–78 × 65; abas 78 × 64). O rótulo fica sempre dentro da parada, e a barra de baixo não rola para o lado.
   - **Altura das barras:** não é igual — 17,3 px na home e 7,7 px no app. Isso é o desenho aprovado (no Elevar, a «fila fina de barras» sobre os ícones), não um defeito.
   - **Outras diferenças entre dev/Chromium e o construído/WebKit:** a mesma causa não pega outra regra. Os seletores que a home divide com o `bar-menu.css` (`.ms`, `.stop`, `.eqbar`, `.flipmark`) estão agora todos presos em `.thread` no celular. Apareceram dois achados (P2-1 e P2-3).
2. **A barra de 620 px:** x e largura iguais na home e no app, sem e com conta, em PT e EN — 900: 251 e 398; 1000: 251 e 498; 1100: 251 e 598; 1280: 330 e 620; 1600: 490 e 620. Batem com o construtor.
   - **Rótulos a 900–1100 px:** nenhum quebra linha em PT («Inventário» incluído). O espaço entre os rótulos é de 18 px a 900, 38 a 1000 e 58 a 1100. O ⟲ tem 10, 21 e 32 px de folga até «Playlists».
   - **A primeira tela a 1280 px contra a v4:** a mesma barra de 620 px, a mesma abertura e o mesmo botão «Abrir o app» no meio. As diferenças são as escolhas do dono (no cabeçalho, sem conta, só «Entrar»; PT/EN), a barra a x = 330 (a v4 tinha 288 sem conta e 358 com conta) e as capas fictícias do servidor local.
3. **Os três P2 da segunda passada:**
   - **Apple Music em segundo plano:** sem a marca no navegador, nada é pedido à Apple e o botão fica neutro («Account and connections», `pending`). Ao abrir o painel, o estado é perguntado e a marca `albumBlender.appleMusic.authorized` é gravada. Na carga seguinte, o ponto e «Apple Music connected» aparecem sem abrir o painel (`apple3.json`).
   - **Quem autorizou antes da marca existir:** se o nome da chave do MusicKit estiver errado, essa pessoa só fica sem o ponto até abrir o painel uma vez. Nada falso é dito.
   - **O nome da chave do MusicKit (`music.*.media-user-token`):** não consegui confirmar na documentação da Apple nem nos fóruns de desenvolvedores; ver «Não visto».
   - **Grades no tablet:** a 800 e 820 px, 3 colunas na grade de Albums e na da Start; a 600 px, 2.
   - **O ⟲ a partir de 900 px:** 10 px de folga (antes 5).

## Achados
- **P2-1 · a 320 px o cabeçalho da home passa da tela (rolagem lateral).** No iPhone SE de 1ª geração, PT/EN + «Entrar» terminam em x = 346 (sem conta) e x = 380 (com conta, «Inicie»); «Entrar» aparece cortado. Acontece também no Chromium, então não é do WebKit; a 375 e 390 px não acontece. Âncora: `public/splash.html` (`header.top .acct`, `.lang` no celular). Evidência: `wk-extra.json` (`webkit-iPhoneSE-*`), `webkit3.json` (`home-*-iPhoneSE-*` `sw`), `home-webkit-iPhoneSE-pt.png`. A mudança: abaixo de cerca de 360 px, esconder PT/EN do cabeçalho (o idioma pode ir ao rodapé) ou reduzir o «Entrar».
- **P2-2 · com texto maior, os rótulos da barra de baixo da home se tocam.** Com 18 px, «Playlists» e «Inventory» se juntam («PlaylistsInventory»), e a 320 px «Playlists Inventário» já se encostam no tamanho normal de 12 px. O app corta com reticências («Playlis…», «Invent…») e não se encosta. Âncora: `public/splash.html` (`.thread .ms .stop`, sem `overflow` nem `text-overflow`). Evidência: `sbs-phone-bars-webkit-built.png` (linhas 2 e 4). A mudança: o mesmo corte do app (`overflow:hidden; text-overflow:ellipsis; max-width:100%`), ou permitir duas linhas.
- **P2-3 · só no WebKit: ao abrir a folha «Menu», a primeira linha ganha o anel de foco azul padrão do navegador.** «New playlists» aparece com o contorno azul do WebKit, não o âmbar do design system; no Chromium não aparece. Âncora: `public/js/components/ui/Sheet.js` (o foco vai ao primeiro controle) e `public/css/mobile.css` (falta `:focus-visible` âmbar em `.phone-menu__row`). Evidência: `app-menu-iPhone14-in.png`, `grid-webkit-phone-3.png`. A mudança: o anel âmbar em `:focus-visible` nas linhas da folha, e conferir no iPhone de verdade se o Safari mostra o anel num toque.

## Não visto
- **O nome real da chave do MusicKit** (`music.*.media-user-token`): nem a documentação da Apple nem os fóruns que encontrei o confirmam (fontes: [User authentication for MusicKit](https://developer.apple.com/tutorials/data/documentation/applemusicapi/user-authentication-for-musickit.md), [MusicKit JS v1 token not set in storage](https://developer.apple.com/forums/thread/722080), [How to store the Music User Token?](https://developer.apple.com/forums/thread/109061)). O substituto do teste não grava essa chave, então o caminho «autorizou antes da marca» foi conferido pelo lado seguro: o botão fica neutro até a primeira abertura do painel. Confirmar no iPhone do dono, olhando o localStorage depois de autorizar.
- **Um iPhone de verdade:** só o WebKit do Playwright com os perfis. O Safari do iOS, o ajuste de texto do sistema (Dynamic Type) e a área segura de verdade não foram vistos.
- **Contas reais da Apple Music e do Spotify.**
- **Os erros de console que vêm só do ambiente de teste, não do menu:** `Worker Error … did not match the expected pattern` porque `/assets/data/albums-autocomplete.json` não está no `dist/` construído e o `vite preview` responde com o `app.html`; os 500 do `/api` sem o serviço local; e o Firestore e o cadastro anônimo recusados pela costura.
