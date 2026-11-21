# Tasks — Feature F88: O menu do topo do app redesenhado na linguagem da nova home · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [x] TASK-00 rodada de desenho: protótipo do menu no comparador (artefato do Claude), no celular e no computador, e aprovação do MJRP · implements:: REQ-01, REQ-04, REQ-05 · model:: opus — protótipo e comparador em `design/proposals/f88-top-menu/`; o MJRP escolheu em 2026-11-21: «Elevar no cel e transformar na web», e «2.sim» à Apple Music no menu (entrada de 2026-11-21 no `docs/log.md`)
- [ ] o MJRP põe a F88 na «Priorizada»

## Implementation
- [x] TASK-01 construir o menu no código de hoje, sem React (REQ-03 e a decisão «A)» do MJRP): Transformar no computador, Elevar no celular, sobre a barra da home · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: sonnet — `components/TopNav.js`, `components/navigation/{barMenu,bars,subRow,connections,menuText,wordmark,clearCache}.js`, `public/splash/bar-menu.css` (partilhado com a home), `public/css/top-menu.css`, `public/css/mobile.css`; provado por `test/components/TopNav.test.js`, `test/components/navigation/{barMenu,subRow,connections,PhoneShell,PhoneMenu}.test.js` e `reports/evidence/F88/`
- [x] TASK-02 conferir que a conta, a conexão com Spotify e Apple Music e o menu do celular seguem funcionando · implements:: REQ-02 · model:: sonnet — `test/components/AuthNav.menu.test.js`, `AuthNav.signout.test.js`, `navigation/connections.test.js`, `test/services/musickit/MusicKitAuth.connection.test.js`, `test/services/spotify/SpotifyAuthSignal.test.js`; no navegador, o painel aberto com e sem conta (`reports/evidence/F88/panel-out-1280.png`, `panel-in-1280.png`, `phone-menu-out-393.png` e `phone-menu-in-393.png`). Não conferido: um login de verdade, o Spotify e o Apple Music de verdade (só o fluxo até o serviço, com os serviços bloqueados)

## Verification
- [x] TASK-03 verificar num navegador real, no celular e no computador, indo da home ao app · implements:: REQ-01, REQ-04 · model:: sonnet — Chrome a 1280 e 393, sem conta e com a conta de teste do harness: `reports/evidence/F88/` (capturas e `measures.json`: a altura, a marca e a posição da barra da home e do app)
- [ ] TASK-04 garantir que o menu novo e a home nova vão à produção juntos, e só depois do «publica» do MJRP (REQ-06; era «antes do fim da migração», trocado pela decisão «A)» do MJRP) · implements:: REQ-06 · model:: sonnet — pendente: o ramo `feat/f88-top-menu-build` empilha sobre `wip/f80-home-bar-is-the-menu-build`, e nada foi à `main` nem à produção

## Documentation
- [x] `design-system.md`, `info-arch.md` e `behavior.md` em dia (o que está pendente de aceite vem marcado «pendente»)
