# Plan — Feature F76: O app no celular, redesenhado · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
O celular é uma camada por cima do app, que não toca a tela de computador (REQ-12). Três peças, cada uma num lugar só:

1. **Uma linha, escrita duas vezes e conferida por teste.** «Celular» é `@media (max-width: 767px)` nas folhas de estilo e `isPhone()` (`public/js/utils/isPhone.js`, por `matchMedia`) no código. Toda regra de CSS do celular vive dentro dessa consulta, em `public/css/mobile.css` (a base) e em `public/css/mobile/<tela>.css` (um arquivo por tela), carregados depois de todos os outros estilos. O teste `test/architecture/phoneStylesStayOnThePhone.test.js` recusa uma regra fora dela.
2. **Uma moldura só do celular** (`components/navigation/PhoneShell.js`): barra do topo baixa com o nome da tela, barra de baixo com os cinco destinos, um menu em folha e o «voltar ao topo». Os elementos são postos na página quando a tela é celular e tirados quando deixa de ser; a barra e o rodapé de computador continuam na página e são escondidos no celular pelo CSS. No computador nada da moldura existe.
3. **Uma folha** (`components/ui/Sheet.js`) para toda janela do celular, de tela cheia ou de baixo. As janelas que já existiam viram folha pela casca: classes novas na marcação (sem regra fora da consulta de mídia, logo iguais no computador) e CSS em `mobile.css` § 8; a página de trás é presa por um observador (`components/ui/windowsHoldThePage.js`) em vez de mudar cada janela.

Ordem: a base (TASK-01, este plano), depois as telas em paralelo, cada uma no seu arquivo de CSS, o inventário por último, depois da F75. O guia de quem faz as telas é `mobile-kit.md`.

Decisões de desenho, todas **decididas pelo agente — revisáveis** (o MJRP deu liberdade de desenho e julga no iPhone, TASK-09):

- **Barra de baixo com cinco destinos** (Home, Albums, Blend, Playlists, Inventory), ícone e rótulo, o atual em laranja; tocar no atual leva ao topo. A gaveta sai do celular.
- **«Playlists» leva às gravadas** (`/saved-playlists`, o «Playlists» da barra de computador) e fica marcado também nas recém-geradas (`/playlists`), que vão para o menu como «New playlists». O pedido citava as gravadas no menu; ficaram na barra porque é lá que há sempre conteúdo, e `/playlists` é vazia fora de uma mistura em andamento.
- **Barra do topo de 48 px** com o nome da tela pelo endereço (uma tela pode dar um nome mais exato, `nameThisScreen`), o logotipo como enfeite e um só botão: a inicial de quem está com conta, ou o ícone de menu.
- **O menu é uma folha de baixo**: conta ou «Sign In», playlists recém-geradas, os três tipos de série ainda por vir (com «Soon»), a ligação com o Spotify, «Clear album cache» com confirmação, «Sign Out».
- **Confirmações, entrar e exportar para o Spotify** são folha de baixo; **álbum, ranking, edição e a caixa de texto** (`InputModal`) são tela cheia (o teclado cobriria uma folha de baixo).
- **Alvos de 44 px por regra geral só onde é seguro**: `.btn`, `.btn-sm`, `.btn-icon`, seletores e campos. Um botão sem classe não ganha largura mínima por regra geral (quatro botões de 25 px num cartão de 131 px estourariam); a tela dona usa `.tap-44` ou `.tap-44-box`.
- **Ícone do app**: o logotipo centrado em quadrado preto (180, 192 e 512 px), gerado por `scripts/make-app-icons.py`; o ícone antigo (180x163, sem fundo) fica no lugar e deixa de ser apontado.
- **Deitado, o iPhone 15 Pro tem 852 px**: recebe o desenho de computador. Para a página não ficar sob a ilha (consequência de `viewport-fit=cover`), `public/css/safe-area.css` tem a única regra da F76 fora de `mobile.css`: só em tela de toque de até 500 px de altura, só o tamanho das áreas seguras (zero num computador).
- **Uma tela nova começa no topo** ao trocar de destino no celular; a mesma tela redesenhada mantém o lugar.

## Technical Design
- `public/js/utils/isPhone.js` — `PHONE_QUERY`, `isPhone(win)`, `onPhoneChange(listener, win)` (devolve quem para de ouvir). (REQ-12)
- `public/js/utils/pageScrollLock.js` — `lockPageScroll`/`unlockPageScroll`, contados: o `body` fica `position: fixed` deslocado pela rolagem e a rolagem volta ao fechar a última janela. (REQ-04)
- `public/js/components/ui/Sheet.js` — `openSheet({ variant, title, content, footer, onClose, id })` devolve `{ element, body, footer, isOpen, setTitle, close }`. `full` e `bottom`; prende a página e o foco, `role="dialog"`, `aria-modal`, Escape, fechar de 44 px, alça, toque fora e arrastar na de baixo, 200 ms de deslize ou nenhum com «reduzir movimento», fecha se a tela deixar de ser celular. (REQ-04)
- `public/js/components/ui/windowsHoldThePage.js` — `holdPageBehindWindows(win)`: observa os filhos do `body` e prende a página enquanto houver uma janela antiga aberta (`APP_WINDOWS`). Ligado pela moldura, só no celular. (REQ-04)
- `public/js/components/navigation/phoneTabs.js` — `PHONE_TABS`, `currentTab(path)`, `screenName(path)`, `renderTabBar(path)` com `aria-current="page"`. (REQ-03)
- `public/js/components/navigation/PhoneShell.js` — `PhoneShell` (monta e desmonta a barra do topo, a barra de baixo e o «voltar ao topo»; ouve o roteador por `afterNavigate` e a loja de usuário), `startPhoneShell(deps)` chamado em `app.js`, `nameThisScreen(text)` para as telas. (REQ-03; achados 10 e 23)
- `public/js/components/navigation/PhoneMenu.js` — `openPhoneMenu({ user, clearCaches })`, `askToClearCache(...)` (confirmação antes de limpar, achado 20), `accountInitial(user)`. (REQ-03; achado 18)
- `public/js/components/navigation/AuthNav.js` — `signOut()` e `isSignedIn(user)` exportados (o mesmo código de antes, num lugar só, para o menu do celular usar). (REQ-03)
- `public/js/components/ui/BaseModal.js` — classes `app-modal*` e a opção `sheet: 'full' | 'bottom'`; `role="dialog"`, `aria-modal` e nome no botão de fechar. `ui/modals/ConfirmModal.js` pede `bottom`. `ViewAlbumModal.js`, `LoginModal.js` e `ranking/UserRankModal.js` ganham uma classe de fora cada (`album-window`, `login-window`, `rank-window`). (REQ-04)
- `public/css/mobile.css` — dez seções: medidas, a página (margens, áreas seguras, sem rolagem lateral), texto/campos/alvos, barra do topo, barra de baixo, barra de ação e voltar ao topo, folha, as janelas antigas como folha, avisos, menu. (REQ-01, REQ-02, REQ-03, REQ-04)
- `public/css/mobile/screens.css` e sete arquivos de tela vazios, já carregados (TASK-02 a TASK-07). `public/css/safe-area.css` — o celular deitado. (REQ-12, REQ-13)
- `public/index.html` — `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-*`, o manifesto (`public/assets/manifest.webmanifest`) e o ícone (`public/assets/images/app-icon-*.png`). Sem service worker. (REQ-13)
- `public/js/app.js` — carrega as folhas de estilo do celular depois das outras e liga a moldura. `components/Icons.js` — cinco ícones novos (`Home`, `Blend`, `ArrowUp`, `ChevronRight`, `SignOut`), com nomes que nenhuma tela de computador pedia.
- `test/architecture/phoneStylesStayOnThePhone.test.js` — o portão do REQ-12 para o CSS. Testes dos módulos: `test/utils/isPhone.test.js`, `test/components/ui/Sheet.test.js`, `test/components/ui/windowsHoldThePage.test.js`, `test/components/navigation/PhoneShell.test.js`, `test/components/navigation/PhoneMenu.test.js`.
- `docs/specs/design-system.md` § Celular — as medidas, a escala de tipo, as barras, a folha, com as fontes (achado 24).

## Dependencies
- A crítica de UX (`reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-audit.md`).
- Nenhuma biblioteca nova. `:has()`, `100dvh`, `env()` e `overflow: clip` pedem Safari 16 ou mais novo (o iPhone 15 Pro nasceu com o iOS 17).
- A F75 mexe em `components/Footer.js` e no cartão do inventário: a base não tocou no rodapé (só o esconde no celular, por CSS) e a TASK-07 espera a F75.
- `scripts/deploy-site.sh` copia `public/assets/` para o site: é por isso que o manifesto e os ícones moram lá.

## Documents Consulted
`AGENTS.md`, `docs/specs/features/F76-mobile-redesign/spec.md`, `reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-audit.md`, `docs/specs/features/F73-screens-keep-the-field-and-let-go/plan.md`, `public/index.html`, `public/css/modals.css`, `public/css/tailwind.css`, `public/js/app.js`, `public/js/router.js`, `public/js/components/TopNav.js`, `public/js/components/navigation/AuthNav.js`, `public/js/components/Footer.js` (só leitura), `public/js/components/ui/BaseModal.js`, `public/js/components/ViewAlbumModal.js`, `public/js/components/ranking/UserRankModal.js`, `public/js/components/LoginModal.js`, `public/js/components/Toast.js`, `public/js/utils/keepField.js`, `scripts/deploy-site.sh`, os testes de `test/architecture/`. Fontes de fora: em `docs/specs/design-system.md` § Fontes consultadas.

Declarações:
- `docs/specs/constitution.md` — sem mudança nesta fatia: nenhuma dependência nova; a regra «o CSS do celular fica dentro da consulta de mídia» está no teste e no `design-system.md` (a levar à constituição no fecho da feature, se o MJRP quiser)
- `docs/specs/arch.md` — a atualizar no fecho da feature (a moldura do celular e a folha são componentes novos); item aberto em `tasks.md` § Documentation
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — criado (§ Celular)
- `docs/specs/behavior.md` e `docs/specs/info-arch.md` — a atualizar no fecho da feature, com as telas; item aberto em `tasks.md` § Documentation
- `docs/wiki/` — sem mudança: nenhuma página descreve uma regra do app que esta fatia mudou

## Risks & Considerations
- **Nada disto foi visto num iPhone.** A prova é o Chrome sem cabeça emulando 393x852 com toque. As áreas seguras (`env()` vale zero no Chrome), o zoom ao focar um campo, a barra do Safari que encolhe, o modo de tela cheia pelo ícone e o arrastar da folha só se veem no aparelho (TASK-09).
- **Prender a página com `position: fixed`** é o que segura o Safari, mas a página pisca se algo ler `scrollY` com a janela aberta (vale 0 nesse intervalo). O «voltar ao topo» some enquanto há janela aberta, de propósito.
- **`black-translucent`** põe o relógio do iPhone por cima da barra do topo no modo de tela cheia; a barra reserva `env(safe-area-inset-top)` para isso. Se sobrar ou faltar altura no aparelho, é ali que se ajusta.
- **A regra geral de margem** (`#app > *` com 16 px) vale para toda tela; uma tela cuja raiz já tinha margem própria agora tem 16 px, não 24. A Home ganhou margem; os painéis dela ficaram recuados (a TASK-05 decide o desenho final).
- **A regra de 16 px nos seletores** usa `:root select` para ganhar das classes `text-sm` e `text-xs`; um seletor com `!important` próprio escaparia (nenhum foi achado).
- **Ícone do app e manifesto ficam em cache no iPhone**: quem já pôs o app na tela de início precisa remover e pôr de novo para ver o ícone novo.
- **Entre 768 e 1023 px** (iPad em pé, iPhone deitado) continua a gaveta antiga, sem mudança. Se o celular deitado merecer o desenho de celular, a linha passa a ser outra consulta (por exemplo, altura até 500 px em tela de toque) e isso é decisão do MJRP: muda o REQ-12.
- **Sem login, só as telas vazias foram medidas.** O que aparece com dados (cabeçalhos de série, cartões, playlists, inventário) é das telas e da prova do integrador.
