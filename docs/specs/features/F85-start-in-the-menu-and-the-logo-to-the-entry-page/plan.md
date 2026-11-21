# Plan — Feature F85: «Start» no menu, e o logotipo leva à página de entrada · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Via rápida. Rótulo e rota em `public/js/components/navigation/phoneTabs.js`, no menu do computador e no roteador (`/start`, com `/home` redirecionando); o destino do logotipo; a decisão da raiz e os botões da página de entrada (`scripts/entryPage.mjs`, `public/splash.html`, `signInFromLink.js`). Teste primeiro.

## Technical Design
- **Rota.** `public/js/components/navigation/startRoute.js` guarda `START_PATH = '/start'`, `ENTRY_PATH = '/?entry'` e `oldHomeTarget(search)`. `app.js` registra `/start` (a `HomeView`) e `/home`, que só redireciona para `/start` mantendo a consulta (`/home?signin` continua abrindo a janela de entrar). O id de uso `home` da medição não muda (decidido pelo agente — revisável).
- **Rótulo.** `phoneTabs.js` (aba e nome na barra do topo), `TopNav.js` (barra e gaveta), `Footer.js`, `Breadcrumb.js`, os botões «Go to Start» das telas vazias.
- **Logotipo.** Link `/?entry` com `data-full-page` no `TopNav.js` (computador) e no `PhoneShell.js` (celular, `a.phone-topbar__logo-link`); o roteador deixa ao navegador o link com `data-full-page` (carga inteira, saída aceita do app).
- **Raiz.** `public/splash/gate.js` (`APP_PATH = '/start'`, que o plugin `entryPage` escreve no `<head>`) e os botões de `public/splash.html` (`/start`, `/start?signin`).

## Dependencies
F79 e F80, entregues.

## Documents Consulted
`docs/specs/behavior.md` (a raiz do site e a página de entrada), `docs/specs/arch.md` (a raiz: duas páginas no build).

## Risks & Considerations
Um link salvo para `/home` quebrar; um piscar da página de entrada para quem tem conta.
