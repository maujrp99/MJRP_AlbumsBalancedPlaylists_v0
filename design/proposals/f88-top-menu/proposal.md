# F88 · O menu do topo do app na linguagem da home — rodada 1 de desenho

**Data:** 2026-11-21 · **Feature:** `docs/specs/features/F88-top-menu-redesigned-like-the-home/` · **Pedido do MJRP:** «já fazer o redesign completo do top nave, aí a transicao fica mais suave» · **Ramo:** `wip/f88-top-menu-design-round-1` (desenho; não é construção)

**Arquivos:** comparador https://claude.ai/artifact/AtUiGYy1YAL9iLd58yJ3aF (cópia local `design/proposals/f88-top-menu/comparator.html`) · protótipos `design/inception/f88-top-menu-elevar-v1.html` e `design/inception/f88-top-menu-transformar-v1.html` (`?w=393` ou `?w=1280`) · gerador `design/proposals/f88-top-menu/build/` (`crop.py` corta as capturas, `build.py` monta as páginas a partir de `proto.tpl.html` e `notes.html`) · capturas da rodada `reports/evidence/F88/round-1/` · crítica `reports/audits/2026-11-21-f88-top-menu-round-1-ux-audit.md`.

## O que foi feito

- **Inventário primeiro:** tudo o que o menu faz hoje, lido do código (`TopNav.js`, `navigation/*`, `SpotifyConnectButton.js`, `Footer.js`), em `docs/specs/info-arch.md` § *O menu do topo (F88)* (MENU-01 a MENU-11), com o lugar de cada item nos dois níveis. Nada se perde.
- **Dois níveis** (o eixo é a ambição; o Consolidar não entrou porque o MJRP pediu o redesenho completo, e apertar o menu de hoje não muda a passagem), cada um como moldura viva e clicável sobre as **telas reais** do app (capturas de 2026-11-21: produção sem conta e servidor de desenvolvimento com a conta de teste, `reports/evidence/visual-recheck-batch/2026-11-21/`), a 393 e a 1280, em PT e EN.
- **A passagem:** no comparador, «A passagem da home para o app» mostra a home v4 aprovada (capturas do ramo `wip/f80-home-bar-is-the-menu-build`) com a sua barra; clicar «Inicie» (com conta) ou «Abrir o app» (sem conta) chega ao app em cada nível, e na «Referência» (hoje).
- **Crítica separada** (agente Opus com a skill de crítica): passou, sem P0; 7 P1 e 8 P2. Os 7 P1 e 6 P2 consertados antes de mostrar (abaixo).

## Os dois níveis

| | Elevar | Transformar — **recomendado** |
|---|---|---|
| A ideia | o menu de hoje, com a cara da barra da home | a barra da home continua no app |
| Computador | marca em fogo · Inicie · Álbuns ▾ · Blend · Playlists · Inventário, cada um com um trecho de barras, o atual aceso · PT/EN · pílula do Spotify · conta | a barra-menu da home, igual: cinco partes sobre a fila de barras, ⟲ entre os lados; o fogo acende o trecho da tela atual · PT/EN · conta e conexões num botão; uma linha de baixo em Álbuns e Playlists |
| Celular | topo com a marca e o nome da tela; barra de baixo com ícones e a fila fina de barras; a folha «Menu» de hoje no estilo novo | topo com a marca e o nome da tela; a barra de baixo da home (rótulos sob as barras, sem ícones); a folha «Conta e conexões» |
| Conta e conexões | como hoje (Spotify na barra, Apple Music só na exportação) | um painel: conta, Spotify e Apple Music com o estado em texto, idioma (celular), limpar o cache, sair |
| Toca | a aparência de todos os itens; a pílula do Spotify sobe para 44 px | a estrutura: o menu suspenso vira linha de baixo; a conta junta o que estava em quatro lugares; a Apple Music entra no menu |
| Preserva | a estrutura e os lugares de hoje | os cinco destinos, todas as funções, o nome da tela no celular |
| Arrisca | a passagem ainda troca a barra (a forma muda) | a barra de baixo sem ícones; o sentido da barra muda entre a home (rola até a história) e o app (vai à tela) |

## Minha recomendação: Transformar

A barra é a mesma da home, então clicar «Inicie» não troca de site: só o trecho de Inicie acende. É o que o MJRP pediu («a transicao fica mais suave»). O custo de construir no código de hoje é um pouco maior que o do Elevar: os mesmos arquivos, mais o painel de conexões (a Apple Music no menu) e a linha de baixo; a barra-menu já existe construída na home e é reaproveitada.

## Para construir no código de hoje (decisão do MJRP: «A)»)

O menu novo é construído **primeiro no código de hoje** (JavaScript sem React, `public/js/components/navigation/`), para a home nova e o menu novo irem juntos à produção; é refeito em React depois, na onda da moldura da F83. **Atenção do orquestrador:** o REQ-03 («construído em React») e o REQ-06 («nada chega à produção antes de a migração terminar») da `spec.md` da F88 dizem o contrário dessa decisão e precisam ser reescritos; não mexi na spec (rodada de desenho).

**Os arquivos que mudam** (Transformar; o Elevar muda os mesmos, menos o painel e a linha de baixo):

| Arquivo | O que muda |
|---|---|
| `public/js/components/TopNav.js` | o `render()` da barra do computador: a marca da home (`/splash/wordmark.jpg`, 30 px) no lugar das duas imagens; a barra-menu (`nav.ms` com cinco `a.stop`, o `⟲` e o `.eqbar`) no lugar dos links e do «Music Series»; à direita a chave PT/EN, «Entrar» (sem conta) e o botão da conta. A gaveta antiga do celular (`#mobileMenu`, já sem uso no celular desde a F76) sai. |
| `public/js/components/navigation/barMenu.js` (novo) | a barra-menu do app: os cinco itens de `PHONE_TABS`, as barras (a mesma função de alturas, tempos e atrasos da home, `barStyle`), o trecho aceso da tela de `currentTab(path)`, `aria-current="page"`, o `⟲` aceso no lado B; um laço de 10 s que tira o movimento, e nenhum com movimento reduzido. Uma função pura para desenhar (testável) e uma para ligar ao roteador. |
| `public/js/components/navigation/phoneTabs.js` | os rótulos passam a vir do idioma (Inicie/Start, Álbuns/Albums, Blend, Playlists, Inventário/Inventory) — a chave é da F81; `renderTabBar` passa a desenhar a barra de baixo da home (rótulos sob as barras, sem ícones) chamando `barMenu.js`. |
| `public/js/components/navigation/PhoneShell.js` | o topo do celular: a marca da home (22 px), o nome da tela (`screenName`, como hoje) e o botão da conta; a altura sobe de 48 para 56 px e a barra de baixo de 56 para 68 px (`--phone-topbar-h`, `--phone-tabbar-h` em `public/css/mobile.css`). |
| `public/js/components/navigation/PhoneMenu.js` | vira o painel «Conta e conexões» na Folha de hoje (`components/ui/Sheet.js`, forma `bottom`: trava, foco preso, Esc e arrastar já vêm prontos): a conta ou «Entrar»; Spotify e Apple Music com o estado em texto; o idioma; «Séries por artista, gênero ou faixa · em breve»; limpar o cache (com a pergunta de hoje, `askToClearCache`); sair. «Novas playlists» sai daqui e vai à linha de Playlists. |
| `public/js/components/navigation/AuthNav.js` | o menu da conta do computador vira o mesmo painel, preso sob o botão da conta (o conteúdo é uma função só, usada pela Folha e pelo painel). |
| `public/js/components/navigation/SeriesDropdown.js` | sai; os lugares dele vão para a linha de baixo (`navigation/subRow.js`, novo, 44 px, só em Álbuns no computador e em Playlists). |
| `public/js/components/SpotifyConnectButton.js` | o estado e as ações ficam; o desenho vai para a linha «Spotify» do painel. |
| Apple Music (se a pergunta 2 for «sim») | ler o estado em `MusicKitService` e chamar `authorize()` (hoje só em `AppleMusicExportService.js:85`); desconectar pela API do MusicKit (`unauthorize`, a conferir). |
| `public/css/` | um arquivo novo `public/css/top-menu.css` com as regras da barra (as do computador fora de `@media`); as do celular em `public/css/mobile.css` (regra 1 da § Celular do design system, e o teste `phoneStylesStayOnThePhone`). |

**O que vem da home (`public/splash.html`, CSS escrito dentro da página; `public/splash/menu.js`):** as regras `header.top`, `.home`, `.logo`, `nav.ms`, `.ms .stop` (`.on`, `.cur`), `.ms .flipmark`, `.eqbar` e `.eqbar i` (`.on`, `.cur`), `@keyframes eqb`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.lang`, `:focus-visible`; e de `menu.js` a lista `MENU` e o desenho das barras. Hoje esse CSS vive só dentro da `splash.html`: o certo é tirá-lo para um arquivo partilhado (por exemplo `public/css/bar-menu.css`) que a home e o app carregam, e `menu.js` exportar a peça que o app importa; assim as duas barras não derivam. A diferença entre as duas fica num modo: na home o fogo segue a leitura (`barProgress`), no app marca a tela.

**O protótipo como base:** as classes do protótipo são as da home (`.ms`, `.stop`, `.cur`, `.eqbar`, `.flipmark`, `.btn-*`, `.lang`) e as novas têm nome próprio (`.t-top`, `.t-bottom`, `.t-sub`, `.t-acct`, `.dots`, `.panel`, `.conn`); o CSS de `design/proposals/f88-top-menu/build/proto.tpl.html` pode ser levado quase como está, trocando os valores pelas variáveis do app.

**O que o menu do celular precisa:** 56 px no topo e 68 px embaixo mais as áreas seguras; alvos de 44 px (o botão da conta, as linhas do painel, «Conectar», a chave PT/EN de 44 × 44 por lado); as cinco paradas de 72 × 56 px; o rótulo de 12 px (o piso); a Folha com `role="dialog"` e o foco voltando ao botão; tocar no item atual leva ao topo da tela (como hoje); o laço das barras para com o pausar do sistema e em 10 s.

**Medidas:** barra 72 px (computador) e 56 px (celular); barra de baixo 68 px; linha de baixo 44 px; rótulos 14 px (computador) e 12 px (celular); atual `#fb923c` (8,7:1 sobre o preto), os outros `#b9b9c2` (10,2:1); foco âmbar de 3 px.

**Depois, em React** (onda da moldura da F83, `public/js/shell/`): a mesma peça vira componente com os dois modos; o painel usa o invólucro da Folha que a F83 prevê (seção 4.4). Nada do desenho muda.

## O que a crítica pediu e o que foi feito

Consertados antes de mostrar: (1) o fogo tem um sentido só nos dois lados, o trecho da tela atual (antes o lado A acendia como «feito» o que veio antes); (2) na prévia da passagem, os itens da barra da home fazem o que a home construída faz (`public/splash/menu.js`): sem conta levam à história; com conta, à tela do app; (3) o nome da tela volta ao topo do celular no Transformar (o idioma vai para o painel); (4) no celular o comparador mostra o aparelho em tamanho real, sem a margem do cartão; (5) as barras param em 10 s sem interação; (6) o Consolidar fica fora com o porquê escrito aqui e no `info-arch.md`; (7) o foco volta ao controle depois de conectar, limpar, entrar ou sair. P2 consertados: a linha de Álbuns some no celular (o «em breve» foi ao painel), os pontos de conexão com aro, o «×» do Spotify com 44 × 44 px, «Álbuns ▾» sem o papel de menu (é uma lista de links), uma porta só para entrar no computador, o ⟲ com dica, a recomendação na primeira tela do comparador. **Fica:** a Referência no computador com conta só tem a captura de Inicie (as outras caem na captura sem conta, com aviso).

## Perguntas para o MJRP

1. **Qual caminho?** Elevar ou Transformar. **Recomendo o Transformar:** a barra é a mesma da home e a passagem não tem corte.
2. **A Apple Music no menu?** (a) em «Conexões», ao lado do Spotify; (b) como hoje, só na hora de exportar. **Recomendo (a):** a home já mostra «Spotify ✓ · Apple Music ✓», e o app deve cumprir isso.
3. **A barra de baixo do celular, com ou sem ícones?** (a) só rótulos e barras, como na home; (b) ícones pequenos sobre os rótulos. **Recomendo (a)**, para ser a mesma barra; se no iPhone ficar difícil achar, voltamos aos ícones.

## O que não pude conferir

- O iPhone de verdade (Safari, toque, área segura, desfoque): só o Chrome a 393 × 852 e a 375 × 812.
- O leitor de tela além da árvore de acessibilidade; larguras de 768 a 1100 px.
- Uma conta de verdade: a conta é de teste; as telas são as capturas de 2026-11-21 (com conta, o servidor de desenvolvimento com dados de exemplo).
- As telas «Novas playlists» e «Séries de playlists» não têm captura: o protótipo avisa ao tocar.
- O texto da tela embaixo do menu está em inglês (o app de hoje); só o menu está em português.
