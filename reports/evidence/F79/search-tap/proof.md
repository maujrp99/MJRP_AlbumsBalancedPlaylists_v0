# F79 · Tocar em «Search» não iniciava a busca no WebKit (UAT-282) — prova no site construído

**Como:** `vite build` + `vite preview` de `main` (b8947e0) e do ramo `fix/f79-search-tap-starts-the-search`; Playwright 1.56 com WebKit (perfil iPhone 14, e 1280 × 800) e Chromium. Firebase bloqueado (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`), catálogo um fixture (nove capas), nenhuma senha.

**Causa (reproduzida):** apertar o botão tira o foco do campo; o `focusout` redesenha o palco (`HomeView.drawStage`) entre o apertar e o soltar; o redesenho reescrevia `search.textContent = 'Search'` mesmo sendo o mesmo texto, o que troca o nó de texto dentro do botão. O botão em si não é trocado (registro com `mousedown`/`blur`/`focusout`/`mouseup`/`click` e observador de mutações: `pointerdown`, `mousedown`, `blur`, `focusout`, mutação `childList:btnScanArtist`, `pointerup`, `mouseup`, e nenhum `click` no WebKit; no Chromium o `click` chega). O WebKit descarta o clique quando o nó apertado é substituído. O Enter não passa por isso.

**Conserto:** `public/js/views/HomeView.js`, `drawStage`: o texto do botão só é escrito quando muda. Nada mais.

**Antes → depois (capas após digitar «Radiohead» e tocar/clicar em «Search»)**, `tap-base.txt` → `tap-fix.txt`: WebKit iPhone 14 clique 0 → 9; WebKit iPhone 14 `tap()` com `hasTouch` 0 → 9; WebKit 1280 clique 0 → 9; Chromium 1280 clique 9 → 9.

**Depois, tudo o mais** (`func-fix.txt`, 28 linhas, todas boas): em WebKit iPhone 14 (clique e `tap`), WebKit 1280, Chromium 1280 e Chromium Pixel 7 (`tap`): digitar + Search = 9 capas; Enter = 9 capas; «or paste a list» abre a lista, «Add albums» habilita ao digitar uma linha, «Search an artist instead» volta ao campo; «What is a series?» abre a folha (nos perfis de celular).

**Pixels contra `main`** (primeira visita, digitando, resultados; iPhone 14 e 1280 em WebKit, 1280 em Chromium; equalizador do palco parado): `diff-fix.txt` contra o controle `main` contra `main` (`diff-control.txt`). Só diferem 0 a 23 pixels, sempre na fileira animada do topo (computador) e na faixa de barras animadas da barra de baixo e do aviso do Firebase (celular), que o controle também mostra (1 a 8 pixels). Nenhuma diferença no palco. `fix-webkit-iphone14_typing.png` é o estado «digitando» do ramo.

**Testes:** `test/components/home/HomeSearchTap.test.js` (jsdom, celular e computador): o botão e o nó de texto são os mesmos depois de o campo perder o foco; falha em `main` (2 de 4), passa com o conserto. Suíte completa: 325 arquivos, 4138 testes, verde; `eslint .`: 0 erros (76 avisos que já existiam).

**Não provado:** iPhone de verdade (Safari no aparelho, teclado na tela, toque real com o dedo). O WebKit do Playwright reproduz o defeito e o conserto, mas não é o Safari do aparelho.
