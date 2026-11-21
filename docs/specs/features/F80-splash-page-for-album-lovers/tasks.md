# Tasks — Feature F80: Página de entrada para quem ama álbuns · Plan: [[plan]]
**Approved**: decidido pelo agente — revisável (dispensa de 2026-11-19)

## Pre-Implementation
- [x] pesquisa de referências de páginas imersivas (com fonte): `design/references/f80-splash/references.md`
- [x] rodadas de desenho com `mjrp-designing-ui`: três direções (rodada 1) e o Caixote v2 (rodada 2), no comparador
- [x] texto com `mjrp-copywriting`: `design/proposals/2026-11-20-splash-copy-proposal.md`
- [x] crítica de UX por agente separado: `reports/audits/2026-11-20-mjrpalbumblender-v0-f80-splash-round2-ux-audit.md`
- [x] o MJRP aprovou o Caixote v2 no fogo brando (2026-11-20 22:15) e a F80 está na «Priorizada»; o registro da aprovação no `info-arch.md`
- [x] o ramo `feat/f80-splash-page-for-album-lovers` criado da `main` local (`d75f984`)

## Implementation
- [x] TASK-01 as capas num arquivo só, com os dois conjuntos e o interruptor (`public/splash/covers.js`); teste `test/splash/covers.test.js` · implements:: REQ-06 · model:: opus · rounds:: 2
- [x] TASK-02 a página estática (`public/splash.html`, `public/splash/wordmark.jpg`) e o plugin `entryPage` (`scripts/entryPage.mjs`, ligado no `vite.config.js`) (segunda entrada, capas escritas no build, nomes trocados no `dist/`, a raiz no servidor de desenvolvimento e no `vite preview`); `firebase.json` reescrevendo para `/app.html`; `scripts/deploy-site.sh` lendo `app.html`; testes `test/splash/entryPage.test.js` e `test/architecture/hostingServesFreshPage.test.js` · implements:: REQ-01, REQ-02, REQ-05, REQ-07 · model:: opus · rounds:: 2
- [x] TASK-03 a decisão da raiz no `<head>` (`public/splash/gate.js`); teste `test/splash/gate.test.js` · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-04 a página viva: faixas, fio, caixote em CSS, legenda, disco por faixa no celular, brasas, janela de movimento e «Pause motion» (`public/splash/splash.js`, `main.js`); teste `test/splash/splash.test.js` · implements:: REQ-01, REQ-04, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-05 o caixote em 3D, carregado só quando cabe (`public/splash/crate3d.js`; `shouldLoad3d` em `splash.js`) · implements:: REQ-04, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-06 «Sign in» da página abre a janela de entrar no app (`public/js/components/navigation/signInFromLink.js`, uma linha no `app.js`); teste `test/components/navigation/signInFromLink.test.js` · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-09 (UAT-240, UAT-241) o texto todo num dicionário só, em português e inglês (`public/splash/copy.js`), escrito na página pelo plugin `entryPage` (`fillCopy`) e trocado no navegador pela chave PT · EN (`public/splash/lang.js`: idioma do navegador, escolha no `localStorage`); testes `test/splash/copy.test.js`, `lang.test.js` · implements:: REQ-01 · model:: sonnet · rounds:: 1
- [x] TASK-10 (UAT-240) a barra é o menu: a barra contínua com as cinco paradas e uma história por item, a flip como faixa curta, o ícone de pausa, o ponto de ambiente de cada história (`public/splash/menu.js`, `public/splash.html`, `splash.js`); teste `test/splash/menu.test.js` · implements:: REQ-01, REQ-04 · model:: sonnet · rounds:: 1
- [x] TASK-11 (UAT-241) com conta: o menu e só o «Inicie»; um item do menu vai à tela do app (`hasAccount` de `gate.js` em `splash.js`, `applyAccount` em `menu.js`); testes em `test/splash/menu.test.js` e `splash.test.js` · implements:: REQ-03 · model:: sonnet · rounds:: 1
- [x] TASK-12 (UAT-240) a v4, o ritmo da página: uma vinheta por história (`public/splash/ambient.js` e o CSS da `public/splash.html`), as alturas da tabela de entrega, a abertura do celular só com o título e a linha; teste `test/splash/ambient.test.js` · implements:: REQ-01, REQ-04 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-07 suíte, lint e build verdes; o roteamento do Firebase conferido no emulador de Hosting (raiz = página, `/home` e `/albums/<id>` = app) · implements:: REQ-02, REQ-05 · model:: opus · rounds:: 2
- [x] TASK-08 no navegador, no servidor de desenvolvimento e no `vite preview` deste ramo: sem conta a raiz mostra a página; «Open the app» chega ao app; um endereço fundo abre; com uma conta gravada a raiz vai a `/home` sem pintar; capturas a 1280 e a 393 ao lado das do protótipo; sem JavaScript, sem WebGL e com movimento reduzido; o peso medido; evidência em `reports/evidence/F80/` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-07, REQ-08 · model:: opus · rounds:: 1

## Results
- TASK-07: `npx eslint . --quiet` sem erro; `npx vitest run` 284 arquivos, 3663 testes, todos passando; `npx vite build` verde (a segunda rodada consertou a pasta de saída do plugin). Emulador do Hosting: a raiz é a página, `/home`, `/albums/abc123`, `/inventory`, `/callback`, `/app.html` são o app, todos sem cache.
- TASK-08: `reports/evidence/F80/2026-11-20-entry-page-proof.md` (capturas, medidas e o que não foi conferido). No caminho, a capa fictícia saía quebrada (aspas dentro do SVG): consertada em `covers.js`, com um teste que lê cada SVG.

- TASK-09 a 11: `npx vitest run test/architecture test/splash` 37 arquivos, 359 testes, verdes; `npx eslint public/splash scripts/entryPage.mjs test/splash` sem erro; nenhuma função acima de complexidade 10 em `public/splash`. Navegador (Chrome sem interface, servidor de desenvolvimento, capas reais), 1280 e 393, sem conta e com conta (pela chave do `gate.js` no `localStorage`), PT e EN: sem rolagem lateral, sem erro no console, nenhum rótulo do menu cortado; evidência em `reports/evidence/F80/home-bar-is-the-menu/` (`measures.json`).

## Documentation
- [x] `docs/specs/behavior.md`: a seção «A raiz do site e a página de entrada (F80)»
- [x] `docs/specs/arch.md`: as duas páginas do build e a decisão da raiz
- [x] `docs/specs/info-arch.md`: o registro da aprovação, o sitemap e o fluxo com o endereço; a página `design/proposals/info-arch/info-arch.html` gerada de novo
- [x] `docs/specs/design-system.md`: os padrões da v2 aprovados com o protótipo; o conjunto fictício
- [x] `docs/manual/00_Deployment_and_Setup.md` § 2.4d e § 3: a página de entrada e o interruptor das capas; `.env.example` com `VITE_SPLASH_COVERS`

## For the owner at UAT
- julgar as decisões «decidido pelo agente — revisável» do `plan.md` e do `spec.md`: a raiz só para quem não entrou, o convidado vê a página, `/?entry`, o three.js do CDN, o link «Privacy» fora
- decidir as capas reais em público (`VITE_SPLASH_COVERS=real` no `.env` do build) depois de resolver os termos da Apple
