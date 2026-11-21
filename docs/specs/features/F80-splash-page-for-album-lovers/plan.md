# Plan — Feature F80: Página de entrada para quem ama álbuns · Spec: [[spec]]
**Approved**: decidido pelo agente — revisável (dispensa de 2026-11-19). As decisões abaixo marcadas «decidido pelo agente — revisável» esperam o julgamento do MJRP.

## Architecture Approach
A página de entrada é um **segundo HTML do mesmo build do Vite**, estático, que não importa nada do app. Ela é servida na raiz; o app continua servido em todos os outros endereços. Quem já entrou com conta é mandado ao app por um script curto no `<head>` da página, antes de qualquer pintura.

### Onde a página mora e como a raiz decide — as opções (decidido pelo agente — revisável)

| Opção | Como | Ganha | Perde |
|---|---|---|---|
| A. A página dentro do `index.html` do app | o HTML da página no mesmo arquivo do app, escondido quando o app sobe | um arquivo só | a página carrega o app inteiro (≈1 MB de script) e pisca para quem entrou; o texto disputa o `#app` |
| B. Redirecionamento do Firebase (`/` → `/welcome`) | `redirects` no `firebase.json` | nada no build | a página não fica na raiz (o buscador lê `/welcome`); quem entrou com conta passa pela página |
| C. O app decide e desenha a página | uma rota `/` no roteador | sem arquivo novo | sem script não há página; o app inteiro é baixado antes; mexe no roteador que a F79 também mexe |
| **D. Dois HTML, a raiz é a página** (escolhida) | o build gera `dist/index.html` = a página e `dist/app.html` = o app; o Firebase serve a página na raiz (arquivo exato) e reescreve todo o resto para `/app.html`; um script de 1 KB no `<head>` da página manda quem entrou com conta a `/home` antes de pintar | a página é HTML puro, lida sem script, leve; o roteador e o app não mudam; nenhum endereço do app muda | um passo a mais para quem entrou e abre a raiz (a página de ~50 KB começa a chegar, o script do `<head>` troca para `/home`); o nome do arquivo de origem do app (`public/index.html`) não é o nome dele no `dist/` (`app.html`) |

**Por que D:** é a única em que a raiz é uma página estática legível sem script (o que o buscador e o assistente leem) e em que nada do roteador muda. O arquivo de origem do app **não é renomeado** (`public/index.html` continua o app): a F79 mexe no app em paralelo, e um `index.html` reescrito no lugar viraria conflito no merge; a troca de nome acontece só na saída do build, num plugin pequeno do `vite.config.js`.

**Como quem entrou nunca vê a página.** O Firebase guarda quem entrou no IndexedDB do navegador (`firebaseLocalStorageDb`, objeto `firebaseLocalStorage`, um registro por app com `isAnonymous`), ou, sem IndexedDB, no `localStorage` (`firebase:authUser:…`). O script do `<head>`:
1. com `?entry` na URL, não faz nada (a página aparece para quem pediu);
2. procura no `localStorage`; achando conta (`isAnonymous: false`), `location.replace('/home')`;
3. senão, esconde a página (`visibility: hidden` no `<html>`, o fundo escuro continua) e lê o IndexedDB **sem criá-lo**: consulta `indexedDB.databases()` quando existe e, ao abrir, aborta a criação se o banco não existir (assim o Firebase nunca encontra um banco vazio criado por outro); achando conta, `location.replace('/home')`; senão mostra a página;
4. se nada responder em 600 ms, mostra a página (falha aberta: quem não tem conta nunca fica sem página).
O `replace` tira a raiz do histórico: o «voltar» do app não cai na página. Sem JavaScript não há decisão: a página aparece (sem script o app também não funcionaria).

**O convidado vê a página na raiz.** A sessão anônima é criada pelo app para todo visitante; tratá-la como «entrou» faria a página sumir para quem abriu o app uma vez. O atalho instalado na tela de início abre `/home` (`start_url` do manifesto), então quem usa o app como app não passa pela página.

### As capas: um arquivo, dois conjuntos (decidido pelo agente — revisável)
`public/splash/covers.js` guarda os dois conjuntos — `real` (os 14 discos do protótipo, a imagem no CDN da Apple, `is1-ssl.mzstatic.com`, 360 px WebP, e o link do Apple Music) e `fictional` (14 capas inventadas no desenho da v1, desenhadas em SVG pelo próprio arquivo) — e as funções que escrevem o HTML delas. O plugin do Vite escolhe o conjunto por `VITE_SPLASH_COVERS` (`real` ou `fictional`; vazio, ou qualquer outro valor, é `fictional`) e o escreve na página na hora do build e do servidor de desenvolvimento. **Nenhuma imagem de capa real entra no repositório por este trabalho**: as reais ficam no CDN da Apple, citadas por endereço; a única cópia no repositório é a que a proposta já pôs dentro do protótipo (`design/inception/splash-crate-v2.html`).

### O three.js (decidido pelo agente — revisável)
Do CDN jsDelivr, versão fixa `three@0.185.0` (`three.module.min.js` + `three.core.min.js`), por endereço completo no `import()` — como o protótipo, que foi o que a proposta mediu (≈155 KB comprimido). Pedido só no computador, com WebGL, sem pedido de menos movimento, depois do `load`. Não entra no `package.json` (nada no `package-lock.json` para o merge com a F79). Se o CDN falhar, fica o caixote em CSS.

## Technical Design
- `public/splash.html` — a página (REQ-01, REQ-05, REQ-07): o HTML e o CSS do protótipo (`design/proposals/f80-splash/build/splash-v2.tpl.html`) sem a faixa e as notas do protótipo, com as chamadas apontando para o app, os metadados (título, descrição, `canonical`, Open Graph, dados estruturados `WebApplication`) e o CSP da página. Lugares marcados (`<!--splash:…-->`) recebem as capas, a legenda e o crédito no build.
- `public/splash/gate.js` — a decisão da raiz (REQ-02): `accountInStorage`, `accountInIndexedDb`, `runGate`. O plugin a escreve dentro do `<head>` como script clássico, antes do CSS.
- `public/splash/covers.js` — os dois conjuntos e o interruptor (REQ-06): `COVER_SETS`, `chooseCoverSet`, `coverImagesHtml`, `captionHtml`, `creditHtml`, `fictionalCoverSvg`.
- `public/splash/splash.js` — a página viva (REQ-01, REQ-04, REQ-07): as faixas e o ponto de cada uma (`TRACKS`, `trackAt`, `flipProgress`), o caixote em CSS (`cssCrateLayout`), a legenda, o fio, o disco de cada faixa no celular, o leito de brasas, a janela de movimento de 10 s e «Pause motion»; `shouldLoad3d` decide se o 3D vem.
- `public/splash/crate3d.js` — o caixote em 3D (REQ-04): a cena do protótipo, com as capas da página como textura; desenha só quando algo muda; perde o contexto → volta ao caixote em CSS.
- `public/splash/main.js` — liga as duas peças: `startSplash(window)`.
- `public/splash/wordmark.jpg` — o logotipo do protótipo (o das letras em fogo), tirado do protótipo v1 para um arquivo.
- `vite.config.js` — o plugin `entryPage` (REQ-01, REQ-02, REQ-06): segunda entrada do build (`splash.html`); escreve as capas e o script da raiz na página; no `dist/`, troca os nomes (`index.html` do app → `app.html`, `splash.html` → `index.html`); no servidor de desenvolvimento serve a página na raiz; no `vite preview`, manda todo endereço sem extensão, menos a raiz, para `/app.html` (o que o Firebase faz em produção).
- `firebase.json` — a reescrita final passa de `/index.html` para `/app.html`; `/app.html` sem cache, como `/index.html` (REQ-02).
- `scripts/deploy-site.sh` — o script principal lido de `dist/app.html`; os arquivos citados pelas duas páginas conferidos no `dist/` (REQ-02).
- `public/js/components/navigation/signInFromLink.js` + uma linha no `public/js/app.js` — `/home?signin` abre a janela de entrar para quem não entrou com conta e tira o `signin` do endereço (REQ-03).
- Nenhuma mudança em `router.js`, `HomeView`, `HomeController`, no seletor de álbuns nem em `public/css/mobile/home*.css`.

## Dependencies
- three.js 0.185.0 no CDN jsDelivr (só no computador com WebGL).
- Fonte Syne 700 e 800 do Google Fonts (como o app).
- As capas reais (só com `VITE_SPLASH_COVERS=real`): `is1-ssl.mzstatic.com`, que responde com `access-control-allow-origin: *` (conferido em 2026-11-20), o que a textura do WebGL pede.
- O registro do Firebase Auth no navegador (o formato do IndexedDB do Firebase JS SDK 10).

## Documents Consulted
- `design/inception/splash-crate-v2.html` e o gerador `design/proposals/f80-splash/build/`; `design/inception/splash-crate-v1.html` (as capas fictícias).
- `design/proposals/f80-splash/proposal.md` (as duas rodadas: «Onde a página mora», «As capas», «A exigência da Apple», «O que um buscador ou um assistente lê», «As medidas»).
- `design/proposals/2026-11-20-splash-copy-proposal.md`; `reports/audits/2026-11-20-f80-splash-round2-ux-audit.md`.
- `docs/specs/info-arch.md` (estados ^splash-v2-*), `docs/specs/design-system.md` § Página de entrada, `docs/specs/arch.md`, `firebase.json`, `vite.config.js`, `public/js/app.js`, `public/js/router.js`, `public/js/services/AuthService.js`.

## Risks & Considerations
- **O formato do registro do Firebase** pode mudar numa versão maior do SDK: o script da raiz falha aberto (mostra a página), nunca prende ninguém; o teste `test/splash/gate.test.js` fixa o formato lido.
- **Um passo a mais para quem entrou** e abre a raiz: a página começa a chegar e o script troca para `/home` antes de pintar. Medido no navegador (evidência).
- **Os termos da Apple** para as capas reais: o padrão é o fictício; publicar com as reais é decisão do MJRP.
- **CDN de terceiros** (jsDelivr, Google Fonts, e o CDN da Apple com as reais): sem eles, o caixote em CSS e a fonte do sistema.
- **Merge com a F79**: o arquivo do app (`public/index.html`), o roteador e a Home não mudam; mudam `app.js` (uma importação e uma linha), `vite.config.js`, `firebase.json` e `scripts/deploy-site.sh`.
- **O sensor visual** (`sensors.visual` no `.mjrp-project.yml`) não está configurado neste projeto: a paridade com o protótipo foi conferida por capturas lado a lado (evidência), não pelo kit.
