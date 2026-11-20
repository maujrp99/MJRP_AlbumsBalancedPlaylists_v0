# Design system — Album Blender V0

O que as telas compartilham: medidas, tipo, cores e componentes. Este documento nasceu com a F76 (achado 24 da crítica de UX de 2026-11-20: não havia escala declarada, e por isso 9, 10, 12, 14 e 16 px conviviam, e alvos de 24 a 48 px). Hoje ele declara o **celular**; o que é da tela de computador ainda vive só no código (`tailwind.config.js`, `public/css/tailwind.css`, `public/css/tech-theme.css`) e entra aqui quando for mexido.

## Identidade (não muda no celular)

| O quê | Valor | Onde está |
|---|---|---|
| Fonte | Syne (400, 700, 800), sem serifa de reserva | `public/index.html`, `tailwind.config.js` |
| Fundo | preto `#000000`; painel `#101014` (folhas do celular) | `body.bg-black`; `--phone-sheet-bg` |
| Destaque | laranja `#f97316`; degradê «flame» `#f97316 → #dc2626` | `brand.orange`, `bg-flame-gradient` |
| Perigo | vermelho `#dc2626` / `#f87171` em texto | `.btn-danger` |
| Texto | branco; secundário branco a 60% ou mais | — |

## Celular

«Celular» é a tela de **até 767 px de largura** (`@media (max-width: 767px)`); em JavaScript, `isPhone()` de `public/js/utils/isPhone.js`, que lê a mesma consulta por `matchMedia` e avisa na rotação e no redimensionamento. O aparelho de referência é o iPhone 15 Pro (393x852 px, Safari, ilha no topo, barra de início embaixo). Deitado ele tem 852 px de largura: recebe o desenho de computador, só com as áreas seguras laterais respeitadas (`public/css/safe-area.css`).

Tudo aqui foi **decidido pelo agente — revisável** (o MJRP deu liberdade de desenho na F76 e julga no aparelho, TASK-09).

### Medidas mínimas (REQ-02)

| Medida | Valor | Por quê | Fonte |
|---|---|---|---|
| Alvo de toque | **44x44 px** | o dedo erra abaixo disso; vale a área que responde, não o desenho | Apple HIG, Accessibility («44x44 pt»); WCAG 2.2, 2.5.5 Target Size (Enhanced): 44x44 CSS px, e a área pode ser maior que o ícone |
| Distância entre alvos pequenos | **8 px** | duas áreas de 44 px que se sobrepõem dão o toque à de cima | regra do kit (`.tap-44`) |
| Texto | **12 px** no mínimo | 9 a 11 px não se leem a 40 cm | a HIG usa 11 pt como menor estilo (Caption 2); o piso daqui é o do REQ-02 |
| Campo, seletor e área de texto | **16 px** | abaixo disso o Safari do iPhone dá zoom na página ao focar | WebKit/Safari (comportamento conhecido; ver CSS-Tricks «16px or Larger Text Prevents iOS Form Zoom») |
| Margem lateral da página | **16 px** (ou a área segura, se maior) | alinhamento único; a Home não tinha margem | margem padrão de layout da HIG no iPhone |
| Altura de botão de ação principal | **48 px** | a ação que conclui a tarefa pede mais que o mínimo | decisão do kit |

### Escala de tipo no celular

| Papel | Tamanho / linha | Peso | Uso |
|---|---|---|---|
| Título de tela (barra do topo) e de folha | 17 / 22 px | 700 | um por tela; quebra de linha na folha, reticências na barra |
| Título dentro da tela | 20 / 24 px | 700 | nome do álbum, da série |
| Corpo | 16 / 22 px | 400 | texto de folha, linhas de menu |
| Secundário | 14 / 18 px | 400 | artista, contagens, avisos |
| Rótulo pequeno | 12 / 16 px | 700 | abas da barra de baixo, selos, anos: **o piso** |

As classes `text-[9px]`, `text-[10px]` e `text-[11px]` em uso sobem para 12/16 px no celular (`mobile.css` § 3.1). Tamanhos escritos em `style=""` ou em CSS de tela ficam com a tela.

### Família de fonte no celular (recheck N4, 2026-11-20)

Duas famílias, uma regra (decidido pelo agente — revisável; pedido do MJRP: «título de linha em Syne, o resto na fonte de texto»):

- **Syne** (`--phone-font-title`, a fonte de exibição do app): o **título de uma linha** — nome de álbum, de faixa, de playlist, de série —, o nome da tela na barra do topo, o título de uma folha e o título dentro da tela (nome do álbum na janela). Peso 700 (o 600 não é carregado).
- **Fonte de texto** (`--phone-font-text`: `-apple-system`, SF Pro no iPhone, Inter e `system-ui` de reserva): todo o resto — artista, contagens, valores, selos, botões, campos, segmentados, avisos, o corpo das folhas. A 12–16 px a Syne perde leitura (benchmark § 9.2).
- As variáveis vivem em `mobile.css` § 1; cada tela aplica a regra no seu CSS (Albums, Inventário, janela do álbum e ranking já aplicam; Home e Playlists, o outro agente).

### Controle segmentado no celular (recheck N9, 2026-11-20)

Um só desenho para toda escolha «um destes» (Grid/List, Pages/Scroll, Original/BEA/Spotify, a moeda, Visual/Bulk): `.phone-segmented` com `.phone-segmented__option` e `.is-on` (ou `aria-pressed="true"`), em `mobile.css` § 11, com as cores em variáveis (`--phone-seg-*`) para as telas que ainda desenham o seu.

- 44 px de altura; as opções lado a lado, de largura igual, texto 14 px peso 600 na fonte de texto.
- **O escolhido é a superfície clara elevada** (`#2a2a30`, texto branco, contorno de 1 px a 14 % de branco); as outras, texto `#a0a0a8` sobre o trilho `#0a0a0c`. **Nunca laranja** (decidido pelo agente — revisável): o laranja é a ação principal da tela, a aba atual da barra de baixo e o item escolhido; um segmentado é um ajuste de vista, e em Albums e na janela do álbum ele aparece junto de uma ação laranja. Assim a regra é uma só, sem exceção por tela.

### Cores das fontes no celular (UAT-228, 2026-11-20)

As referências de uma faixa usam a cor da sua fonte, as mesmas da tabela do computador: **BestEverAlbums em laranja** (`#fb923c`, um tom acima do laranja da marca para ler bem em texto de 12 px: 8,0:1 sobre o fundo da janela; 5,3:1 apagada) e **Spotify em verde** (`#1ed760`: 9,4:1; 6,1:1 apagada). É a exceção pedida pelo MJRP à regra «laranja só na ação principal e no estado ligado»: aqui o laranja nomeia uma fonte, não uma ação. Usada só nas referências das faixas (janela do álbum); não vale para botões.

### Áreas seguras e altura

- `viewport-fit=cover` no `index.html`: a página vai até as bordas; as barras se afastam da ilha e da barra de início com `env(safe-area-inset-*)`, e a margem lateral é `max(16px, env(safe-area-inset-left))`. Fonte: WebKit, «Designing Websites for iPhone X» (`viewport-fit=cover`, `env()`, `max()` para somar margem e área segura); MDN, `env()`.
- Altura de tela cheia em **`100dvh`**, nunca `100vh` (a barra do Safari encolhe e `100vh` estoura). Fonte: web.dev, «The large, small, and dynamic viewport units» (Safari 15.4+).
- A página atrás de uma janela é **presa** por `position: fixed` no `body` e devolvida ao lugar ao fechar (`utils/pageScrollLock.js`); `overscroll-behavior: contain` no corpo da folha impede a rolagem de passar adiante. Fonte: MDN, `overscroll-behavior`.
- `touch-action: manipulation` em links, botões e seletores; sem realce de toque do sistema (`-webkit-tap-highlight-color: transparent`), o estado `:active` é do app.

### Barra do topo (REQ-03)

48 px de altura mais a área segura do topo, fixa, translúcida (fundo `rgba(8,8,10,.78)` com desfoque de 16 px, como a barra de vidro do app). Da esquerda para a direita: o logotipo (28 px, enfeite), o **nome da tela** (17/22 px; uma tela pode dar um nome mais exato com `nameThisScreen()`), e um só botão de 44 px que abre o menu. Quem está com conta aparece pela inicial do nome sobre o degradê do app (a pessoa, não o serviço: achado 18).

### Barra de baixo (REQ-03)

Cinco destinos, com ícone de 24 px e rótulo de 12 px: **Home, Albums, Blend, Playlists, Inventory**. 56 px de altura mais a área segura de baixo, fixa, translúcida como a do topo. O destino atual fica laranja, com `aria-current="page"`. Tocar no destino em que se está leva ao topo da tela. A página ganha o espaço da barra (nada fica atrás dela). Fonte: Apple HIG, Tab bars (até cinco abas no iPhone, rótulo curto em toda aba, a barra é para destinos e não para ações, fica sempre à vista); o mesmo arranjo no Spotify, no Apple Music e no Discogs (destinos embaixo, ações da tela acima deles).

«Playlists» leva às playlists gravadas (`/saved-playlists`, o que a barra de computador chama «Playlists») e fica marcado também nas playlists recém-geradas (`/playlists`), que se alcançam pelo menu («New playlists»).

### Menu (REQ-03)

Uma folha de baixo aberta pela barra do topo: a conta (ou «Sign In»), o que a gaveta tinha e a barra de baixo não tem (playlists recém-geradas, os outros tipos de série, a ligação com o Spotify, «Sign Out») e «Clear album cache», que saiu do rodapé e agora pede confirmação (achado 20). O «Playlists» repetido da gaveta acabou. O rodapé não aparece no celular.

### Folha (REQ-04)

Uma janela no celular é uma folha (`components/ui/Sheet.js`):

| Forma | Quando | Como |
|---|---|---|
| `full` | algo para ler ou editar (álbum, ranking, edição) | a tela inteira; cabeçalho com título que quebra a linha e botão de fechar de 44 px sempre à vista; só o corpo rola; rodapé opcional fixo para a ação principal |
| `bottom` | uma escolha curta (confirmação, menu, filtros, ordenação) | sobe de baixo até, no máximo, a tela menos 24 px; alça de arrastar; fecha por toque fora, por Escape, pelo botão e arrastando para baixo |

As duas prendem a página de trás, prendem o foco, são `role="dialog"` com `aria-modal`, respeitam as áreas seguras e deslizam em 200 ms (sem deslize para quem pediu menos movimento ao sistema). Fonte: Apple HIG, Sheets (folha para uma tarefa curta e focada, alça quando se arrasta, botão de fechar visível; tela cheia quando a tarefa pede o espaço todo).

As janelas que já existiam viram folha só pela casca (`mobile.css` § 8): tela cheia para a janela do álbum, a de ranking e as de edição; de baixo para confirmações, entrar e exportar para o Spotify. Um campo de texto pede a folha `full` (o teclado cobre uma folha de baixo).

### Barra de ação e voltar ao topo

- `.phone-action-bar`: a ação principal da tela, fixa logo acima da barra de baixo, 64 px, botões de 48 px. A tela ganha o espaço dela sozinha. No máximo dois botões e uma nota curta.
- «Voltar ao topo»: botão redondo de 44 px, à direita, que aparece depois de duas telas de rolagem (achado 23).

### Regras

1. Toda regra de CSS do celular vive dentro de `@media (max-width: 767px)`, em `public/css/mobile.css` (a base) ou em `public/css/mobile/<tela>.css`. O teste `test/architecture/phoneStylesStayOnThePhone.test.js` recusa o que estiver fora.
2. A tela de 768 px para cima não muda: marcação compartilhada só muda se desenhar igual lá.
3. Sem rolagem dentro de rolagem: no celular uma lista não tem altura máxima com rolagem própria dentro de uma página que rola. O corpo de uma folha é a única exceção.
4. Ação só com ícone tem nome (`aria-label`) e alvo de 44 px; a dica ao pairar não existe no toque.
5. Avisos aparecem abaixo da barra do topo e nunca cobrem as barras.

## Página de entrada (F80) — padrões propostos, pendentes de aprovação do MJRP

Nasceram na rodada 1 de exploração da página de entrada (2026-11-20, `design/inception/splash-*-v1.html`). **Tudo aqui está pendente de aprovação do MJRP**; nada vale para as telas do app enquanto ele não decidir. A identidade é o piso (decisão dele, 2026-11-20 17:12: «o elemento do fogo, de equalizadores, fazem parte da identidade do site»): as três direções usam o preto, o laranja `#f97316`, o degradê «flame», a Syne e o logotipo; o que muda está dito abaixo, com o porquê.

| Padrão | Como é | Por quê | Muda o quê |
|---|---|---|---|
| Botão principal da página pública | degradê «flame», **texto preto** `#0b0b0b`, Syne 800 a 18 px, 48 px de altura, brilho laranja | branco sobre o degradê dá 2,8:1 na ponta laranja `#f97316` e 4,8:1 na vermelha; preto dá 7,5:1 e 4,35:1, e a 18 px peso 800 o texto conta como grande (3:1) | **diverge** do `.btn-primary` do app (texto branco); pendente de aprovação do MJRP. Se aprovado, vale rever o botão do app também |
| Fonte do texto corrido no computador | Syne só nos títulos; o corpo na fonte de texto do sistema (`-apple-system`, Inter, `system-ui`) | a regra do celular («título em Syne, o resto na fonte de texto») estendida ao computador numa página de leitura longa | **diverge** do app no computador (tudo em Syne); pendente de aprovação do MJRP |
| Equalizador | barras de 5 a 8 px, cantos de 3 px no topo, degradê de baixo para cima `#dc2626 → #f97316 → #fbbf24`, cada barra com altura, duração (0,6 a 1,5 s) e atraso próprios, nunca em uníssono; com movimento reduzido, alturas fixas e variadas | o equalizador é elemento da identidade (palavras do MJRP); é o primeiro desenho declarado dele | novo; pendente de aprovação do MJRP |
| Fogo em movimento | leito de fogo em canvas 2D (partículas aditivas de três cores: âmbar, `#f97316`, `#dc2626`), sempre abaixo do texto, nunca atrás dele; no 3D, luz de fogo laranja e vermelha que tremula por senos sobrepostos | o fogo do logotipo e da imagem de herói (`public/assets/herobanne-for-reference.png`) como movimento; atrás do texto ele derruba o contraste | novo; pendente de aprovação do MJRP |
| Capa fictícia | quadrado com gradientes, faixas, anéis ou leque nas cores da marca, título em Syne 800 e artista em caixa alta; selo «Fictional» | capas reais são de terceiros e a página é pública | novo; pendente de aprovação do MJRP |
| Exemplo ilustrativo | caixa com o rótulo «Illustrative · fictional album» no topo e «Example data, not real scores.» embaixo | dado de exemplo nunca se apresenta como real | novo; pendente de aprovação do MJRP |
| Pausar o movimento | botão «Pause motion» / «Play motion» (`aria-pressed`), 44 px, preso no canto de baixo à direita no computador e sob as chamadas no celular; para fogo, equalizadores, luz e giro automático; some com movimento reduzido | movimento sem fim ao lado do texto pede um jeito de parar (crítica de UX da rodada, WCAG 2.2.2) | novo; pendente de aprovação do MJRP |
| Aviso de capas fictícias | junto de todo grupo de capas inventadas, «Fictional albums · original art» em 12 a 13 px, legível (não só dentro da arte) | quem vê a página não pode tomar a capa inventada por um disco real | novo; pendente de aprovação do MJRP |

## Fontes consultadas (2026-11-20)

- Apple, Human Interface Guidelines: Tab bars, Sheets, Accessibility, Layout, Typography — <https://developer.apple.com/design/human-interface-guidelines/>. As páginas não abriram na ferramenta de leitura (são montadas por script); os valores acima (44 pt, cinco abas, alça e fechar da folha) são os conhecidos da HIG e ficam a conferir pelo MJRP se algum pesar numa decisão.
- WebKit, «Designing Websites for iPhone X» — <https://webkit.org/blog/7929/designing-websites-for-iphone-x/> (lida).
- Apple, «Configuring Web Applications» (ícone, `apple-mobile-web-app-capable`, estilo da barra de status, título) — <https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html> (lida).
- MDN, `env()` e `overscroll-behavior` — <https://developer.mozilla.org/en-US/docs/Web/CSS/env>, <https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior> (lidas).
- web.dev, «The large, small, and dynamic viewport units» — <https://web.dev/blog/viewport-units> (lida).
- W3C, WCAG 2.2, Understanding 2.5.5 Target Size (Enhanced) — <https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html> (lida).
- CSS-Tricks, «16px or Larger Text Prevents iOS Form Zoom» — <https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/> (resultado de busca; não aberta).
- Spotify, Apple Music e Discogs no iPhone: o arranjo (barra de destinos embaixo, linhas compactas com capa de cerca de 56 px, folha de baixo para as ações de um item, ação principal presa acima da barra) é o conhecido desses apps; não foram abertos nesta passada.
