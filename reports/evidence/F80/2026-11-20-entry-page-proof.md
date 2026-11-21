# F80 · A página de entrada — prova no navegador (2026-11-20)

Ramo `feat/f80-splash-page-for-album-lovers`, nesta pasta de trabalho. Nada publicado, nada gravado no Firestore de produção.

## Onde rodou

| Servidor | Endereço | O que serve |
|---|---|---|
| Vite de desenvolvimento | `http://127.0.0.1:5182` | `public/` (a raiz é a página pelo plugin `entryPage`) |
| `vite preview` (build de produção) | `http://127.0.0.1:5183` | `dist/` (raiz = página; o resto, `app.html`) |
| Emulador do Firebase Hosting (`firebase emulators:start --only hosting --project demo-f80`) | `http://127.0.0.1:5002` | `dist/` com o `firebase.json` do ramo |

Navegador: o painel do Claude (Chromium) a 1280 x 800 e a 393 x 852; Chrome sem interface (`--headless=new`) para as capturas em arquivo.

## O que foi provado

**A raiz e os endereços (emulador do Hosting, `hosting-routes.txt` abaixo).**

```
/                  200 Cache-Control: no-cache data-page="entry"
/?entry            200 Cache-Control: no-cache data-page="entry"
/index.html        200 Cache-Control: no-cache data-page="entry"
/home              200 Cache-Control: no-cache /assets/main-C3SNKRCy.js
/albums/abc123     200 Cache-Control: no-cache /assets/main-C3SNKRCy.js
/inventory         200 Cache-Control: no-cache /assets/main-C3SNKRCy.js
/home?signin       200 Cache-Control: no-cache /assets/main-C3SNKRCy.js
/callback          200 Cache-Control: no-cache /assets/main-C3SNKRCy.js
/app.html          200 Cache-Control: no-cache /assets/main-C3SNKRCy.js
```

A raiz é a página (`data-page="entry"`); todo outro endereço é o app (o `app.html`, que nomeia o script principal). O `vite preview` responde igual (conferido com `curl` nos mesmos endereços).

**Sem conta, a raiz mostra a página; «Open the app» chega ao app.** No `vite preview`, a 1280: a página na raiz, o caixote 3D desenhado (`stage live`, three.js 0.185.0 baixado do jsDelivr só depois do `load`); o clique em «Open the app» (o da primeira tela) levou a `/home`, título «MJRP The Album Blender - Playlist Generator» (`pane-preview-1280-home-after-cta.jpg`).

**«Sign in» abre a janela de entrar.** `/home?signin` → o endereço ficou `/home` e a janela «Welcome Back» abriu (sem conta).

**Um endereço fundo abre.** `/albums/someSeriesId123` abriu o app na tela de álbuns (o app o reescreve para `/albums?seriesId=…`, como antes).

**Com conta, a raiz vai ao app sem pintar a página.** Com um registro de conta escrito à mão no IndexedDB do Firebase da origem local (`firebaseLocalStorageDb` / `firebaseLocalStorage`, `isAnonymous: false`, uid de teste, só em `127.0.0.1:5183`), abrir `/`:
- no painel, terminou em `/home`;
- num `iframe` amostrado a cada milissegundo: três amostras na raiz, todas com `html.gate` (a página escondida); em `/home` aos 14 ms; **nenhuma amostra da página visível**.
Com o mesmo registro como convidado (`isAnonymous: true`), a raiz mostrou a página. Sem banco nenhum, a página apareceu aos ~8 ms e **o banco não foi criado** (`indexedDB.databases()` igual antes e depois). `/?entry` mostrou a página com a conta gravada. O registro de teste foi apagado depois.

**As faixas, no 3D (servidor de desenvolvimento, 1280).** A3 «Side A · 3 — Ranking», legenda «Glass Orchard / Velvet Meridian · fictional album»; FLIP com o giro em 0,61; B1 «Harbour Static»; B2 «Midnight Orchard», o fogo forte de novo (`pane-dev-1280-3d-a3.jpg`, `pane-dev-1280-3d-b2.jpg`). Fontes carregadas: Syne 700 e 800.

**Celular, 393 (painel, `vite preview`).** Uma coluna; o caixote em CSS sob a primeira tela; cada faixa com o seu disco e o crédito («Ember Suite · Kofi Arden Trio — fictional album»); a barra de baixo com o fio e «Open the app»; `scrollWidth` = 393 (sem rolagem lateral); **o three.js não é pedido** (recursos: a fonte, `splash-*.js`, `preload-helper-*.js`, o logotipo) (`pane-preview-393-hero.jpg`, `pane-preview-393-a4.jpg`).

## Ao lado do protótipo

O build foi feito também com `VITE_SPLASH_COVERS=real`, para comparar com as mesmas capas do protótipo aprovado. As capturas do Chrome sem interface rodam sem placa de vídeo, então os dois lados mostram o caixote em CSS (o mesmo plano B).

- `compare-1280-prototype-vs-built-real.png` — à esquerda o protótipo (`design/inception/splash-crate-v2.html`, fogo brando), à direita o build. **Iguais**, menos a faixa do protótipo (36 px no topo, «Protótipo F80 · …»), que não vai para o site, e a linha «Artwork from Apple Music» sob a legenda, que no protótipo fica abaixo da dobra pela faixa.
- `compare-393-prototype-vs-built-real.png` — o mesmo a 393. **Atenção:** as duas capturas sem interface a 393 saem cortadas à direita (o Chrome sem interface não abre uma janela tão estreita); o corte é igual nos dois lados e não acontece no painel (`scrollWidth` = 393 lá). A prova do celular é a do painel, acima.
- O padrão do build é o fictício: `built-fictional-1280.png`, `built-fictional-393.png`.

## Os planos B

| Caso | Captura | O que se vê |
|---|---|---|
| Movimento reduzido (`--force-prefers-reduced-motion`) | `built-fictional-1280-reduced.png`, `built-real-1280-reduced.png`, `prototype-1280-reduced.png` | o caixote em CSS parado, sem «Pause motion»; o three.js não é pedido (`shouldLoad3d`, teste) |
| Sem WebGL (`--disable-webgl`, `?nogl`) | `built-fictional-1280-nowebgl.png`, `built-real-1280-nowebgl.png` | o caixote em CSS com as mesmas capas |
| Sem JavaScript | `built-fictional-1280-nojs.png`, `built-fictional-393-nojs.png`, `built-real-1280-nojs.png`, `built-real-393-nojs.png` | todo o texto, as chamadas, o caixote parado com as sete capas do lado A, o fio rotulado na primeira faixa sem barras; no celular, os discos de cada faixa não ocupam espaço |

As capturas sem JavaScript são da página construída **com todos os `<script>` tirados** (`dist/nojs-check.html`, feito do `dist/index.html`, só para a captura): o Chrome sem interface não salva captura com `scriptEnabled=false`.

## O que um buscador ou um assistente lê

`machine-reading-fictional.txt`: o texto do HTML servido na raiz pelo emulador, sem script — o título, a descrição, os dados estruturados `WebApplication`, a frase «The Album Blender is a web app for people who listen to whole albums.» logo depois do título, os oito títulos das faixas na ordem, o crédito das capas e o texto alternativo das 14 capas.

## As medidas (2026-11-20)

| Peça | Fictícias (o padrão) | Reais |
|---|---|---|
| A página (`dist/index.html`) | 59,9 KB, **13,0 KB gzip** | 33,9 KB, **10,5 KB gzip** |
| O script da página (`splash-*.js` + `preload-helper-*.js`) | 4,4 KB gzip | igual |
| O logotipo (`wordmark-*.jpg`, o do protótipo) | 25,2 KB | igual |
| A fonte Syne (o arquivo latino que a página usa) | 34,6 KB | igual |
| As capas | dentro da página (SVG) | 210,5 KB, do CDN da Apple (14 WebP de 360 px) |
| O 3D, só no computador com WebGL (`crate3d-*.js` + three.js 0.185.0 em brotli, 72,4 + 82,3 KB) | 156,8 KB | igual |
| **Primeira visita no celular** | **≈ 77 KB** | **≈ 285 KB** |
| **Primeira visita no computador** | **≈ 234 KB** | **≈ 442 KB** |

A proposta mediu ≈ 250 KB no celular e ≈ 405 KB no computador, com as capas reais **dentro** da página (213 KB gzip de página). Com o padrão fictício, a página fica bem abaixo. Com as reais, fica ≈ 35 KB acima: aqui as capas e o logotipo são contados como arquivos (WebP e JPEG não encolhem com gzip), na proposta dentro do gzip da página.

O app (`dist/app.html` e o `main-*.js`) não mudou de tamanho por esta feature, a não ser pelo `signInFromLink.js` (menos de 1 KB).

## O que não foi conferido

- **Um iPhone de verdade e o Safari** (nem o WebKit): só o Chromium do painel e o Chrome sem interface. O caixote 3D, o desempenho e a bateria num iPhone ficam por ver.
- **A primeira pintura e os quadros por segundo:** o painel do navegador estava oculto (o Chromium não registra pintura nem roda `requestAnimationFrame` numa aba de fundo: o 3D só desenhou quando a aba foi capturada). O tempo até a página aparecer foi medido só pelo `iframe` (≈ 8 ms local, sem rede).
- **O caminho com uma conta de verdade:** não entrei com conta (nenhuma senha digitada); a conta foi simulada com um registro no formato do Firebase JS SDK 10 no IndexedDB da origem local.
- **O Firebase Hosting de produção:** a regra foi provada no emulador oficial (`firebase-tools` 15.36.0), não no ar.
- **O selo oficial do Apple Music** e o uso público das capas reais: decisão do MJRP.
- **O logotipo quebrado no app em `vite preview`** (`/assets/images/logo.png`): o `vite preview` não tem o que o `deploy-site.sh` copia para o `dist/` (`css/`, `assets/`, `js/firebase-config.js`); não é desta feature.
