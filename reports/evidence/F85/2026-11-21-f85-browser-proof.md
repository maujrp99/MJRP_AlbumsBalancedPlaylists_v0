# F85 · «Start» no menu e o logotipo para a página de entrada — prova no navegador (2026-11-21)

Ramo `claude/f85-start-in-the-menu`. Nada publicado, nada gravado no Firestore de produção, nenhuma senha digitada.

## Onde rodou
Servidor de desenvolvimento do Vite desta pasta de trabalho, `http://127.0.0.1:5191` (porta livre; não a 5010). Chrome sem interface, dirigido por um roteiro (protocolo de depuração do Chrome); janelas de 1280 x 800 e 393 x 852. Com conta: um registro de conta de teste escrito à mão no IndexedDB local do Firebase (`isAnonymous: false`, uid de teste), só nesta origem. O log completo: `dev-log.json`.

## O que foi provado (1280 e 393, sem conta e com conta)
- **O rótulo:** o menu do computador e a gaveta dizem «Start» (nenhum «Home» na barra); no celular, a aba e o nome na barra do topo dizem «Start». A tela tem o mesmo desenho de antes (`dev-393-in-start.png`, `dev-1280-in-start.png`).
- **`/home` e `/home?signin` levam a `/start`** (endereço trocado no lugar, consulta mantida); com `?signin`, sem conta, a janela de entrar abriu e o `signin` saiu do endereço. Com conta, a janela não abre.
- **O logotipo** (`a.nav-logo` no computador, `a.phone-topbar__logo-link` no celular) aponta para `/?entry`; o clique faz carga inteira e termina na página de entrada, sem conta e com conta (`*-after-logo.png`).
- **A raiz:** sem conta, `/` mostra a página de entrada; com conta, `/` termina em `/start`; `/?entry` mostra a página de entrada mesmo com conta.
- **Os botões da página de entrada:** «Open the app» → `/start`; «Sign in» → `/start?signin` (todos, na página inteira).
- **Links antigos e diretos:** `/albums/abc123` (vira `/albums?seriesId=abc123`, como antes), `/inventory` e `/app.html` abrem o app; `/app.html` termina em `/start`. Sem rolagem lateral (`scrollWidth` = largura da janela).

## NÃO foi provado
- **O build de produção sob `vite preview`:** o build ficou na fila de trabalhos pesados da máquina por mais de uma hora e o orquestrador mandou entregar sem ele. Logo, `dist/index.html` e `dist/app.html`, as reescritas do `firebase.json` e o `/app.html` do build não foram vistos.
- **A bateria completa de testes e o doctor neste ramo.** Rodaram só os arquivos tocados (555 testes, todos verdes).
- O painel do Claude (só uma olhada rápida no desktop a 800 px) e o navegador real do celular; o Safari; o gesto de tocar (os cliques são do roteiro).
- A conferência visual independente (relatório de reconferência) — a faz o orquestrador.

## Arquivos que nomeiam a rota ou o rótulo (para a migração para React)
Código: `public/js/app.js`, `router.js`, `components/navigation/{startRoute,phoneTabs,PhoneShell,signInFromLink}.js`, `components/{TopNav,Footer,Breadcrumb}.js`, `components/series/SeriesEmptyState.js`, `views/SavedPlaylistsView.js`, `views/helpers/SeriesViewUpdater.js`, `utils/reloadApp.js`, `services/usage/usageWiring.js`, `public/splash.html`, `public/splash/gate.js`, `scripts/deploy-site.sh` (um comentário).
Testes: `test/components/navigation/{startRoute,PhoneShell,signInFromLink}.test.js`, `test/router{,.history,.links}.test.js`, `test/architecture/historyOwnedByRouter.test.js`, `test/services/usage/usageWiring.test.js`, `test/splash/{entryPage,gate}.test.js`.
