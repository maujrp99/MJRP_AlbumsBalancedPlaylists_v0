# Design system — Album Blender V0

**Status: Draft** — os padrões da Home (F79) e da página de entrada (F80) aprovados pelo MJRP com os protótipos em 2026-11-20; o resto é o que o código usa, decidido pelo agente — revisável; as perguntas abertas estão em § Pendentes.
> **Página do design system:** https://claude.ai/artifact/RHR5zAhDUhQowiEn5BeCgj (F86, rascunho) — gerada deste documento por `design/proposals/design-system/build-design-system.mjs`, nunca editada à mão.

O que as telas do site compartilham: cores, tipo, medidas e componentes. Este documento nasceu com a F76 (o celular) e foi refeito na F86 (2026-11-21) a partir de um levantamento do código (`public/css/`, `tailwind.config.js`, `public/splash.html`, as views e os componentes): o que está aqui é o que o site **usa**, não o que deveria usar. Onde o código tem dois valores para a mesma coisa, § Conflitos no código diz quais e propõe um; nada foi mudado no código. A migração para React (F83) vai consumir os tokens daqui. O app nativo (`app/`, em pausa) fica fora.

Ordem em que o site carrega o CSS (decide quem ganha num conflito): `public/css/modals.css` (no `<head>`), `public/css/index.css` (`animations.css`, `neon.css`, `tech-theme.css`, `views/home.css`), o Tailwind (`public/css/tailwind.css`, gerado com o site), `public/css/mobile.css` e `public/css/mobile/*.css` (só até 767 px), `public/css/safe-area.css`. A página de entrada (`public/splash.html`) é outro documento, com o seu próprio CSS, e não carrega nenhum desses.

## Conceito e DNA

Uma loja de discos à noite: tela preta, o fogo (o logotipo da chama sobre o vinil, o degradê laranja-vermelho) e os equalizadores como as duas marcas da casa, títulos em Syne. Decisão do MJRP (2026-11-20 17:12): «o elemento do fogo, de equalizadores, fazem parte da identidade do site». O fogo é a ação: um botão de fogo por tela (HI-05). O equalizador quer dizer som e espera: parado é pronto, em movimento é esperando uma resposta, baixo é que a resposta não veio.

## Paleta

Um tema só, escuro. O laranja é a ação principal, a aba atual e o item escolhido; o vermelho é a outra ponta do fogo e o perigo. As cores de estado (verde, rosa, vermelho claro) não vêm da marca (AH-08). Contraste medido (WCAG) sobre o preto e, entre parênteses, sobre o painel `#101014`: branco 21:1 (19,0:1); `#a0a0a8` 8,1:1 (7,3:1); branco a 72 % 10,5:1 (10,0:1); branco a 64 % 8,3:1 (8,1:1); `#fb923c` 9,3:1 (8,4:1); `#4ade80` 12,1:1 (10,9:1); `#fca5a5` 11,1:1 (10,0:1); `#f87171` 7,6:1 (6,9:1). Branco sobre o fogo: 2,8:1 na ponta laranja, 4,8:1 na vermelha — só passa como texto grande (19 px, peso 800); ver § Pendentes, P1. Os números do painel (19,0, 10,0 e 8,1; antes 18,6, 9,6 e 7,5) e o 10,5 do branco a 72 % (antes 10,6) foram medidos de novo com o branco apagado composto sobre o próprio painel. *(corrigido na F86, 2026-11-21, conferido no CSS — pendente de aprovação do MJRP)*

### Cores

| Nome | Valor | Para quê | Onde no código | Estado | Na abertura |
|---|---|---|---|---|---|
| preto | `#000000` | o fundo de toda tela do app | `body.bg-black` (`public/index.html`), `--albums-page` | em uso | Preto |
| painel | `#101014` | folhas do celular, painel da série, a caixa do campo da Home | `--phone-sheet-bg`, `--home-panel` | em uso | Painel |
| superfície | `#1c1c22` | botão neutro, capa vazia, botões das linhas | `.home-btn`, `.home-dcv`, `.home-rbtn button` | em uso | Superfície |
| escolhido neutro | `#2a2a30` | a opção escolhida do controle segmentado | `--phone-seg-on` | em uso | |
| laranja | `#f97316` | a ação principal, a aba atual, o item escolhido, o anel da capa escolhida | `brand.orange` (Tailwind), `--home-flame-a`, `--phone-accent`, `--orange` (página de entrada) | em uso | Laranja |
| vermelho | `#dc2626` | a outra ponta do fogo; o sublinhado do «Undo» | `brand.red`, `--home-flame-b`, `--red` | em uso | Vermelho |
| fogo | `linear-gradient(135deg, #f97316 0%, #dc2626 100%)` | um botão por tela; o número da capa escolhida; a inicial da conta | `bg-flame-gradient`, `--home-flame`, `--flame`, `.phone-avatar` | em uso | Fogo |
| fogo no texto | `linear-gradient(90deg, #f97316, #dc2626)` | a segunda linha do título da Home | `--home-flame-text` | em uso | |
| texto | `#ffffff` | todo texto principal | `text-white`, `#fff` | em uso | Texto |
| texto apagado | `rgba(255, 255, 255, 0.72)` · `0.64` | frases de apoio, contagens | `--home-muted`, `--home-soft` | em uso | |
| cinza | `#a0a0a8` | ano, dica dentro do campo, opção não escolhida | `--phone-seg-text`, `--albums-text-2` | em uso | |
| linha | `rgba(255, 255, 255, 0.12)` | bordas de painel e de campo | `--home-line`, `--line` (página de entrada) | em uso | |
| laranja de texto | `#fb923c` | a fonte BestEverAlbums nas faixas; rótulos da página de entrada | `.tracks-tabs__ref--bea`, `--orange-text` | em uso — conflito C2 | |
| âmbar | `#fbbf24` | a ponta clara do equalizador e o anel de foco da página de entrada | `--amber` (página de entrada) | pendente (P2) | |
| verde | `#4ade80` | pronto, salvo | `.home-line.is-ok`, `.home-saved__ico` | em uso | |
| rosa | `#fca5a5` | o motivo de uma linha que não entrou; tirar da série | `.home-line__tag`, `.home-rbtn__remove` | em uso | |
| vermelho claro | `#f87171` | perigo em texto; a linha de erro | `.phone-menu__row--danger`, `--albums-danger` | em uso | |
| claro | `#f4f4f5` | a faixa do «Undo» da Home | `.home-undo` | em uso — conflito C9 | |
| Spotify | `#1db954` · `#1ed760` | só o que é do Spotify | `SpotifyExportModal.js`, `.tracks-tabs__ref--spotify` | em uso — conflito C8 | |

### O fogo

| Onde | Como | Estado |
|---|---|---|
| logotipo | `public/assets/images/logo.png` (a chama sobre o vinil): barra do computador, rodapé, barra do topo do celular (28 px) | em uso |
| nome do site | `public/assets/images/TheAlbumBlender.png` no app; `public/splash/wordmark.jpg` na página de entrada (dois arquivos para a mesma marca, C10) | em uso |
| botão de fogo | o degradê fogo num botão por estado da tela; brilho `0 0 24px rgba(249, 115, 22, 0.3)` | em uso |
| fogo vivo | só na página de entrada: brasas em canvas abaixo do texto (46 partículas no computador, 26 no celular), força 0,72 no pico e 0,28 no meio («fogo brando»), para 10 s depois da última rolagem, «Pause motion» | aprovado com o protótipo da F80 |
| brilho do palco | `radial-gradient` laranja e vermelho atrás do título da Home | em uso |

### O equalizador

| Onde | Barras | Cores | Estados | Estado |
|---|---|---|---|---|
| Home, sob o campo | 48 (32 no celular), até 8 px, 4 px entre elas | `#dc2626` embaixo → `#f97316` em cima | parado (50 % de opacidade): pronto · em movimento (0,7 s): esperando · baixo (35 %, 10 % de altura): não respondeu · menos movimento: paradas na altura cheia | aprovado com o protótipo da F79 |
| Home, «Saving your series…» | 5, em 30 x 14 px | as mesmas | só em movimento | aprovado com o protótipo da F79 |
| Página de entrada, o fio | 5 por faixa (3 no celular), de 2 a 7 px | `#dc2626` → `#f97316` → `#fbbf24` nas faixas lidas; branco a 20 % nas outras | a faixa atual respira (0,55 a 1,35 s) enquanto há movimento | aprovado com o protótipo da F80 |
| Página de entrada, dentro de «Open the app» | 4 pretas de 3 px | `#0b0b0b` | respiram enquanto há movimento | aprovado com o protótipo da F80 |

## Tipografia

Só a Syne é carregada (400, 700 e 800 no app; 700 e 800 na página de entrada). No computador o app é todo em Syne; no celular, títulos de uma linha em Syne e o resto na fonte de texto do sistema (SF Pro no iPhone) — regra da F76 (§ Celular). Os pesos 500 e 600, pedidos em muitos lugares (`font-medium`, `font-semibold`), não são carregados e caem para 400 ou 700 (C11).

### Tipo

| Papel | Família | Tamanho | Peso | Onde |
|---|---|---|---|---|
| Título da Home | Syne | 52/55 px | 800 | `.home-hero h1` (38 a 48 px na página de entrada) |
| Título de seção | Syne | 32 px | 800 | `.home-artist h2` |
| Nome da série | Syne | 20 px | 800 | `.home-name` |
| Botão de fogo | Syne | 19 px | 800 | `.home-btn.is-flame` |
| Título da barra e da folha (celular) | Syne | 17/22 px | 700 | `.phone-topbar__title`, `.sheet__title` |
| Corpo | Syne no computador · texto do sistema no celular | 16/24 px no computador · 15/22 no celular | 400 | `.home-hero p` (antes «16/22» e `.sheet__body`, que não declara tamanho) *(corrigido na F86, 2026-11-21, conferido no CSS — pendente de aprovação do MJRP)* |
| Botão | Syne | 15 px | 700 | `.home-btn` |
| Secundário | texto do sistema | 14/18 px | 400 | `.home-hint`, `.phone-action-bar__note` |
| Rótulo pequeno | texto do sistema | 12/16 px | 700 | abas da barra de baixo (12/14), selos, anos: o piso |

## Espaço, forma e sombra

### Medidas

| Medida | Valor | Onde |
|---|---|---|
| alvo de toque | 44 x 44 px | `--phone-target`; `.home-btn`, `.home-chip`, as linhas do painel |
| botão principal | 48 px (56 px o grande) | `.home-btn`, `.home-btn.is-big`, `.phone-action-bar > .btn` |
| margem lateral | 16 px (24 px na Home do computador) | `--phone-gutter`, `.home-page` |
| entre peças | 8 px (o mais comum); 4 a 16 px | `gap-2`, `gap` das barras |
| canto de capa e cartão | 10 px (6 px nas capas pequenas) | `.home-card__cover`, `.home-dcv` |
| canto de botão e campo | 12 px | `.home-btn`, `rounded-xl`, `.phone-segmented` |
| canto de folha e painel | 16 a 20 px | `.sheet--bottom` (16), `.home-panel` (18), `.home-dock` (20) |
| ficha | redonda (999 px) | `.home-chip`, `.badge` |
| sombra de capa | `0 8px 24px rgba(0, 0, 0, 0.6)` | `.home-card__cover` |
| sombra da base | `0 -10px 40px rgba(0, 0, 0, 0.6)` | `.home-dock`, `.sheet--bottom` |
| brilho do fogo | `0 0 24px rgba(249, 115, 22, 0.3)` | `.home-btn.is-flame` |
| vidro | `blur(16px)` sobre `rgba(8, 8, 10, 0.78)` (`--phone-bar-bg`); a base da série da Home, `blur(16px)` sobre `rgba(12, 12, 15, 0.94)` | `.phone-topbar`, `.phone-tabbar`; `.home-dock` *(corrigido na F86, 2026-11-21, conferido no CSS — pendente de aprovação do MJRP)* |
| barras do celular | topo 48 px · ação 64 px · abas 56 px, mais as áreas seguras | `--phone-topbar-h`, `--phone-action-bar-h`, `--phone-tabbar-h` |
| movimento | 200 ms (folha), 0,7 s (equalizador); nada se mexe com menos movimento | `--phone-slide`, `.home-eq` |

## Componentes

Cada padrão que se repete, com o arquivo que o desenha. A página do design system mostra cada família viva, com o CSS do site, a 960 px e a 390 px.

| Família | Peça | Como é | Classes | Arquivo | Estado |
|---|---|---|---|---|---|
| Botões | botão de fogo | degradê fogo, branco 19/800, 48 px (56 o grande), brilho laranja; um por estado da tela | `.home-btn.is-flame` | `public/css/views/home.css` | aprovado com o protótipo da F79 |
| Botões | botão neutro | `#1c1c22`, borda branca a 14 %, Syne 700 15 px, 48 px | `.home-btn` | `public/css/views/home.css` | em uso |
| Botões | botão sem fundo | transparente, 44 px | `.home-btn.is-ghost` | `public/css/views/home.css` | em uso |
| Botões | botão principal do resto do app | degradê fogo, branco, cantos de 12 px, cresce ao passar o mouse | `.btn.btn-primary` | `public/css/tailwind.css` (e `modals.css`, C3) | em uso — conflito C3 |
| Botões | secundário e perigo | branco a 5 % com borda; vermelho `#dc2626 → #ef4444` | `.btn-secondary`, `.btn-danger` | `public/css/tailwind.css` | em uso |
| Botões | botão da página de entrada | degradê fogo, **texto preto** `#0b0b0b`, Syne 800 18 px, 48 px, equalizador dentro | `.btn-primary` | `public/splash.html` | aprovado com o protótipo da F80 — texto preto pendente (P1) |
| Campos | campo único da Home | 64 px (56 no celular), cantos de 18 px, `rgba(16, 16, 20, 0.94)`, borda laranja e anel ao focar | `.home-field` | `public/css/views/home.css` | aprovado com o protótipo da F79 |
| Campos | campo de formulário | branco a 5 %, cantos de 12 px, borda laranja ao focar; 16 px no celular | `.form-control` | `public/css/tailwind.css` (e `modals.css`, C3) | em uso |
| Campos | controle segmentado | 44 px, trilho `#0a0a0c`, escolhido `#2a2a30` (nunca laranja) | `.phone-segmented` | `public/css/mobile.css` § 11 | em uso (só no celular) |
| Fichas | ficha de tipo | 44 px, redonda, borda branca a 14 %; ligada = branca com texto preto | `.home-chip`, `.is-on` | `public/css/views/home.css` | aprovado com o protótipo da F79 |
| Fichas | selo | redondo, 12 px em caixa alta, verde ou âmbar a 20 % | `.badge`, `.badge-success` | `public/css/tailwind.css` | em uso |
| Cartões | capa da Home | quadrada, cantos de 10 px, sombra; escolhida = anel laranja de 3 px e o número no fogo | `.home-card`, `.is-in` | `public/css/views/home.css` | aprovado com o protótipo da F79 |
| Cartões | álbum no celular | capa quadrada, título Syne 15/20 em duas linhas, artista 13/18 `#a0a0a8`, «⋯» de 44 px | `.album-tile` | `public/js/components/ui/AlbumPhoneCard.js`, `public/css/mobile/albums.css` | em uso |
| Base da série | base do computador | presa embaixo, cantos de 20 px, vidro; até 7 capas numeradas, o nome, «Edit order» e «Create series»; borda laranja quando tem álbum | `.home-dock`, `.is-full`, `.is-done` | `public/js/components/home/HomeDock.js` | aprovado com o protótipo da F79 |
| Base da série | base do celular | é a barra de ação, acima das abas: uma capa, a nota e um botão de 48 px | `.home-dock.phone-action-bar` | `public/css/mobile/home.css` | aprovado com o protótipo da F79 |
| Barras do celular | barra do topo | 48 px, vidro, logotipo de 28 px, nome da tela 17/22, menu de 44 px | `.phone-topbar` | `public/css/mobile.css` § 4 | em uso |
| Barras do celular | barra de abas | cinco destinos, ícone de 24 px e rótulo de 12 px; a atual em laranja com brilho | `.phone-tabbar` | `public/js/shell/phoneTabs.ts` | em uso |
| Barras do celular | barra de ação e voltar ao topo | 64 px acima das abas, botões de 48 px; botão redondo de 44 px | `.phone-action-bar`, `.phone-to-top` | `public/css/mobile.css` § 6 | em uso |
| Folhas | folha | `#101014`; de baixo com alça e cantos de 16 px, ou a tela inteira; fechar de 44 px | `.sheet--bottom`, `.sheet--full` | `public/js/components/ui/Sheet.js` | em uso (só no celular; no computador, janela) |
| Avisos | aviso rápido | no alto à direita, cantos de 8 px; verde, vermelho, âmbar ou escuro | `#toast-container` | `public/js/shell/Toasts.tsx` (a lista e os relógios em `public/js/stores/toasts.js`) | em uso — defeito D3 |
| Avisos | faixa de desfazer | clara `#f4f4f5`, texto preto, «Undo» de 44 px sublinhado em vermelho, por 8 s | `.home-undo` | `public/js/components/home/HomeDock.js` | aprovado com o protótipo da F79 |
| Fogo e equalizador | equalizador da Home | três estados: parado, em movimento, baixo | `.home-eq`, `.is-still`, `.is-live`, `.is-flat` | `public/js/components/home/HomeEqualizer.js` | aprovado com o protótipo da F79 |
| Página de entrada | barra do topo, fio e primeira tela | o nome do site, «Sign in» e «Open the app»; o fio do equalizador com uma faixa por parte; o título e as chamadas | `header.top`, `.thread`, `.hero` | `public/splash.html` | aprovado com o protótipo da F80 |

### Famílias

| Família | Uma linha |
|---|---|
| Tipo | Syne nos títulos; no celular, o resto na fonte do sistema. |
| Botões | Um botão de fogo por tela; o resto neutro. |
| Campos | Campo grande na Home; segmentado para «um destes». |
| Fichas | Ligada é branca, nunca laranja. |
| Cartões | A capa manda; escolhida ganha anel e número. |
| Base da série | A série sempre à vista, com a ação que conclui. |
| Barras do celular | Topo, ação e abas, de vidro. |
| Folhas | No celular toda janela é uma folha. |
| Avisos | Avisos curtos; tirar se desfaz depois. |
| Fogo e equalizador | Parado é pronto; mexendo é esperando; baixo é falha. |
| Página de entrada | A mesma identidade, numa página para quem chega. |

## Pendentes

Padrões que o site já usa, decididos pelo agente, que pedem a palavra do MJRP. Ficam como estão até ele decidir.

| # | Padrão | Pergunta | Mostra | Hoje no código |
|---|---|---|---|---|
| P1 | Texto sobre o fogo | No botão de fogo, o texto fica branco (como no app) ou preto (como na página de entrada)? | texto-no-fogo | Branco no app (`.btn-primary`, `.home-btn.is-flame`: 2,8:1 na ponta laranja, passa só como texto grande, 19 px peso 800); preto na página de entrada (`#0b0b0b`: 7,0:1 na ponta laranja e 4,1:1 na vermelha). Recomendação do agente: preto nos dois, porque passa em qualquer tamanho. |
| P2 | Ponta amarela do fogo | O equalizador termina em amarelo (página de entrada) ou só laranja e vermelho (Home)? | ponta-amarela | Home: duas cores (`#dc2626 → #f97316`, a cor A, decidida pelo agente na F79). Página de entrada: três (`… → #fbbf24`). `#fdba74`, a ponta clara da prévia da F79, não está no código. Uma só para as duas telas. Recomendação do agente (F86, revisável): duas cores nas duas telas, só com as cores já declaradas; custa tirar o amarelo da página de entrada. |
| P3 | Fonte do texto corrido no computador | No computador, o texto corrido fica em Syne (app) ou na fonte do sistema (página de entrada e celular)? | fonte-do-corpo | App no computador: tudo em Syne. Página de entrada e celular: títulos em Syne, o resto na fonte do sistema. Recomendação do agente: a fonte do sistema, que a 14–16 px lê melhor. |

## Textos do inventário (F75) pendentes de aprovação do MJRP

Propostos pelo agente em 2026-11-21, com a leitura do Discogs guardada no banco (F75, REQ-16); as telas do app estão em inglês. Valem no código até o MJRP decidir.

| Onde | Texto | Dito para |
|---|---|---|
| Origem do cartão (valor do Discogs), duas linhas de 11px que não encolhem | «Discogs · 21 Nov» sobre «CD · suggested» (sugestão) ou «CD · lowest» (menor preço); o momento inteiro e o que o valor é, uma vez, no `title` (texto pendente da aprovação do MJRP) | dizer de onde vem, de que tipo é e quando foi lido, sem nada cortado a 900, 1280, 1440 e 1920 px em USD, EUR, GBP e BRL, com 99,999.99 de valor; duas linhas de 11px têm a altura do valor ao lado, o cartão não cresce |
| Origem na lista do computador | «CD · Discogs · suggested · 21 Nov» (ou «lowest») | o mesmo, numa linha, onde há largura |
| Linha de origem no celular | «Discogs · 21 Nov» (o dia e o mês numa peça só, sem quebra) | o mesmo, mais curto, na mesma forma do cartão |
| Janela do álbum, menor preço à venda | «The lowest price this CD was listed at on Discogs when it was read. It is an asking price, not what the disc usually sells for.» (antes: «… is for sale at on Discogs now») | a frase não pode afirmar o presente de uma leitura guardada |
| `title` do cartão, menor preço | «Lowest asking price for this CD edition on Discogs, read on 21 Nov 2026, 14:05.» (a sugestão: «Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition, read on 21 Nov 2026, 14:05.») | quando foi lido, dito uma vez |
| Folha «⋯» do celular, nota do valor | «Lowest asking price for this CD edition on Discogs.» (a sugestão: «Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition.») | o menor preço nunca é chamado de média |
| Aviso da rodada | «3 values could not be saved to your inventory. This browser keeps them for six hours; Update values tries to save them again.» («1 value … keeps it … save it again.») | dizer quanto tempo o navegador guarda e o que fazer (verdade no código: `READING_TTL_MS` e o começo de «Update values») |
| Aviso ao ler um álbum | «The value was read but not saved to your inventory. This browser keeps it for six hours; Update values tries to save it again.» | o mesmo, para uma leitura só |
| Janela do álbum, seção «Estimated value» | «Read on 21 Nov 2026, 14:05.» (já era assim; agora vale para o valor guardado, de qualquer idade) e, no painel do celular, a mesma frase como nota | quando o valor foi lido |
| Aviso de espera | «N albums are waiting for a value.» (mesmo texto; passa a contar só os que nunca foram lidos) | não mudou |

## Conflitos no código

O que o levantamento de 2026-11-21 achou com dois ou mais valores para a mesma coisa. A proposta é do agente; nada foi mudado (a F86 não mexe no código do site). Cada linha vira uma correção quando o MJRP priorizar.

| # | O quê | Valores no código | Proposta |
|---|---|---|---|
| C1 | Laranja | `#f97316` (marca) e `#ff8800`, `#ff4d00`, `#ea580c` (`neon.css`, `tech-theme.css`, `animations.css`, `Icons.js`, `modals.css`) | um só: `#f97316`; o logotipo guarda as suas cores |
| C2 | Laranja de texto | `#fb923c` reservado à fonte BestEverAlbums, mas usado como laranja comum (`text-orange-400`, 19 usos; `--orange-text` na página de entrada) | decidir se é o laranja de texto da casa ou só da fonte |
| C3 | Botão principal e regras repetidas | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.badge`, `.form-control` em `tailwind.css` e `modals.css`; `.glass-panel` em três arquivos; o primário tem quatro aparências | uma definição só, a do Tailwind |
| C4 | Pretos e superfícies | uns 20 tons: `#101014`, `#121216`, `#0a0a0c`, `#0b0b0e`, `#0a0a0a`, `#17171a`, `#15151a`, `#1c1c22`, `#1f1f23`, `#1f1f24`, `rgba(26, 26, 46, 0.95)` nas janelas do computador | três degraus: preto, painel `#101014`, superfície `#1c1c22` |
| C5 | Cinza e texto | `#a0a0a8`, `#a8a8b0`, `#a1a1aa`, `#9a9aa4`, `#b9b9c2`, `text-gray-400`; texto `#fff` e `#f2f2f4` | `#a0a0a8` e `#fff` |
| C6 | Corte do celular | 899 px (CSS, `isPhone.js`, `UserRankModal.js` e a página de entrada), `md` do Tailwind em 900 px, 640 px (`modals.css`), 1024 px (menu do computador) | 899 px, o mesmo no app e na página de entrada: de 768 a 899 px a passagem não muda de forma (F88, P2 do juiz; antes 767 px no app). **Mudança feita pela F88, pendente do aceite do dono**; a regra «768 px para cima não muda» (F76 REQ-12) passa a valer de 900 px para cima |
| C7 | Equalizador | Home: duas cores, até 8 px, 0,7 s; página de entrada: três cores, 2 a 7 px, 0,55 a 1,35 s | a cor decide-se em P2; a medida fica com cada tela |
| C8 | Verdes | Spotify `#1db954` (38 usos) e `#1ed760`; pronto `#4ade80`; Tailwind `green-500`/`green-600` nos selos e avisos | Spotify só no que é do Spotify; pronto `#4ade80` |
| C9 | Faixa de desfazer | Home `#f4f4f5` com sublinhado vermelho; Playlists `#f2f2f4` com botão `#b45309`; ranking `#26262c` escura | a da Home |
| C10 | Nome do site | `TheAlbumBlender.png` (app) e `wordmark.jpg` (página de entrada); vários arquivos de logo sem uso | um arquivo |
| C11 | Pesos da Syne | 500 e 600 pedidos (`font-medium` 41, `font-semibold` 17, 31 regras), não carregados | usar 400, 700 e 800 |
| C12 | Escolhido | segmentado cinza; fichas brancas; filtro do Inventário laranja; aba atual laranja | laranja só na aba atual e na ação |
| C13 | Anel de foco | branco 2 px (app); âmbar 3 px (página de entrada); laranja (`.form-control`) | branco 2 px no app |

## Declarado e não usado

| Declarado | No código |
|---|---|
| `.tap-44`, `.tap-44-box` («regra do kit», § Celular) | definidas em `mobile.css` § 3.3, nenhum uso |
| `#fdba74` (a ponta clara da prévia da F79) | em nenhum lugar |
| `brand.yellow`, `brand.red`, `flame-gradient-hover` (`tailwind.config.js`) | nenhum uso |
| `hero_bg.svg` (o equalizador de fundo antigo) | nenhum uso |
| «Secundário branco a 60 % ou mais» | no computador há `text-white/50`, `/40`, `/30` e `text-gray-500` |
| `.phone-segmented` para toda escolha «um destes» | usada em 2 arquivos; o filtro de Albums e as abas da janela do álbum desenham o seu |

## Defeitos do CSS

Listados pela F86, não consertados (a feature não muda o código do site).

| # | Onde | O quê |
|---|---|---|
| D1 | `public/css/modals.css:25` | `border: 1px rgba(…)` sem o estilo: a borda da janela não aparece |
| D2 | `public/css/tech-theme.css:44` | `var(--tech-blue)` nunca definida |
| D3 | `public/js/shell/Toasts.tsx` (`INFO_STYLE`; era `components/Toast.js:113`) | o aviso «info» pede `bg-surface-dark/95`, que não existe: sem fundo no computador |
| D4 | JavaScript | classes sem regra: `.btn-ghost` (11 usos), `.text-muted` (76), `.dark-glow`, `bg-surface-lighter`, `animate-fade-in-up`, `animate-progress-indeterminate`, `.fade-in` e outras |
| D5 | `neon.css`, `tech-theme.css`, `animations.css` | regras sem uso (`.neon-*`, `.tech-panel`, `.badge-warning`, `.progress-bar`…); `.custom-scrollbar` e `@keyframes fadeIn` definidos duas vezes |
| D6 | contraste | `text-white/30` (2,5:1), `text-white/40` (3,7:1), aviso âmbar com texto branco (3,0:1) |
| D7 | `public/css/mobile/blend.css:242` | `var(--phone-accent, #ff8800)`: a reserva é o laranja antigo |

## Voz e tom

Os textos do site são em inglês, curtos, no imperativo nos botões («Create series», «Blend it now»); o que é dado de exemplo diz que é («Illustrative · fictional album»). A revisão dos textos e o português são da F81 (`design/copy/album-blender-copy.md`, a página de revisão de texto).

## Temas

Um tema só, escuro, sem seletor: o preto e as cores de § Cores. As cores de estado não vêm da marca. O contraste foi medido sobre o preto e o painel (§ Paleta).

## Referência visual

Os protótipos aprovados: a Home `design/inception/home-transformar-v2.html` (F79) e a página de entrada `design/inception/splash-crate-v2.html` no fogo brando (F80). A página do design system (§ topo) mostra cada peça viva.

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
| Botão principal da página pública | degradê «flame», **texto preto** `#0b0b0b`, Syne 800 a 18 px, 48 px de altura, brilho laranja | branco sobre o degradê dá 2,8:1 na ponta laranja `#f97316` e 4,8:1 na vermelha; preto `#0b0b0b` dá 7,0:1 e 4,1:1 (antes «7,5:1 e 4,35:1») *(corrigido na F86, 2026-11-21, conferido no CSS — pendente de aprovação do MJRP)*, e a 18 px peso 800 o texto conta como grande (3:1) | **diverge** do `.btn-primary` do app (texto branco); pendente de aprovação do MJRP. Se aprovado, vale rever o botão do app também |
| Fonte do texto corrido no computador | Syne só nos títulos; o corpo na fonte de texto do sistema (`-apple-system`, Inter, `system-ui`) | a regra do celular («título em Syne, o resto na fonte de texto») estendida ao computador numa página de leitura longa | **diverge** do app no computador (tudo em Syne); pendente de aprovação do MJRP |
| Equalizador | barras de 5 a 8 px, cantos de 3 px no topo, degradê de baixo para cima `#dc2626 → #f97316 → #fbbf24`, cada barra com altura, duração (0,6 a 1,5 s) e atraso próprios, nunca em uníssono; com movimento reduzido, alturas fixas e variadas | o equalizador é elemento da identidade (palavras do MJRP); é o primeiro desenho declarado dele | novo; pendente de aprovação do MJRP |
| Fogo em movimento | leito de fogo em canvas 2D (partículas aditivas de três cores: âmbar, `#f97316`, `#dc2626`), sempre abaixo do texto, nunca atrás dele; no 3D, luz de fogo laranja e vermelha que tremula por senos sobrepostos | o fogo do logotipo e da imagem de herói (`public/assets/herobanne-for-reference.png`) como movimento; atrás do texto ele derruba o contraste | novo; pendente de aprovação do MJRP |
| Capa fictícia | quadrado com gradientes, faixas, anéis ou leque nas cores da marca, título em Syne 800 e artista em caixa alta; selo «Fictional» | capas reais são de terceiros e a página é pública | novo; pendente de aprovação do MJRP |
| Exemplo ilustrativo | caixa com o rótulo «Illustrative · fictional album» no topo e «Example data, not real scores.» embaixo | dado de exemplo nunca se apresenta como real | novo; pendente de aprovação do MJRP |
| Pausar o movimento | botão «Pause motion» / «Play motion» (`aria-pressed`), 44 px, preso no canto de baixo à direita no computador e sob as chamadas no celular; para fogo, equalizadores, luz e giro automático; some com movimento reduzido | movimento sem fim ao lado do texto pede um jeito de parar (crítica de UX da rodada, WCAG 2.2.2) | novo; pendente de aprovação do MJRP |
| Aviso de capas fictícias | junto de todo grupo de capas inventadas, «Fictional albums · original art» em 12 a 13 px, legível (não só dentro da arte) | quem vê a página não pode tomar a capa inventada por um disco real | novo; pendente de aprovação do MJRP |

### Página de entrada · rodada 2 (Caixote v2) — aprovados com o protótipo

Da `design/inception/splash-crate-v2.html` (2026-11-20). **Aprovados pelo MJRP com o protótipo em 2026-11-20 22:15, no fogo brando** (`info-arch.md` § Protótipos aprovados); valem **só nesta página** e substituem nela as linhas acima que a v2 contraria. Ficam fora da aprovação, decididos pelo agente — revisáveis: o **texto preto** no botão de fogo (linha «Botão principal da página pública» acima; como o protótipo mostra) e o **corpo na fonte do sistema** no computador. Na construção (F80), com o interruptor das capas em `fictional` (o padrão), a página usa as linhas «Capa fictícia» e «Aviso de capas fictícias» acima no lugar de «Capa real com crédito»: a legenda diz «Fictional album · original art» e não há link do Apple Music.

| Padrão | Como é | Por quê | Muda o quê |
|---|---|---|---|
| Fio do equalizador (progresso) | um grupo de 5 barras por faixa da página (3 a 7 px no computador, até 4 px e 3 barras por grupo no celular), degradê do fogo nos grupos lidos, cinza a 20 % nos outros; o grupo da faixa atual respira, cada barra com altura, duração e atraso próprios; no computador cada grupo é um link de 44 px de altura; no celular fica na barra de baixo, só progresso, sem toque | o equalizador quer dizer som e progresso: é o fio e mais nada | **diverge** das barras de 5 a 8 px do «Equalizador» acima (o fio é mais fino para caber sete grupos); novo |
| Equalizador na ação principal | 4 barras pretas de 3 px dentro do «Open the app», que respiram enquanto há movimento | o único outro lugar do equalizador: a ação principal | novo |
| Capa real com crédito | capa do Apple Music; ao lado de toda capa mostrada inteira, título, artista, ano, «Artwork from Apple Music» e «Listen on Apple Music» (link de 44 px); no rodapé, a linha de direitos e a marca da Apple | o MJRP escolheu capas reais (2026-11-20); a Apple pede o link e a marca; **o uso numa página pública está a confirmar** | substitui «Capa fictícia» e «Aviso de capas fictícias» nesta página |
| Fogo como luz | leito de brasas em canvas 2D baixo no palco e luz de fogo de baixo na cena 3D; forte na primeira tela e no convite final, brando no meio; **o fogo brando** (pico 0,72, meio 0,28 da força do vivo), a escolha do MJRP de 2026-11-20 | o fogo ilumina as capas sem disputar com elas nem ficar atrás de texto | refina «Fogo em movimento» |
| Movimento que para sozinho | fogo e equalizador param 10 s depois de carregar ou da última rolagem; o 3D desenha só quando algo muda | movimento automático tem de terminar parado | novo |
| «Pause motion» no fio | no computador, no fim do fio preso; no celular, sob as chamadas da primeira tela | o canto de baixo cobria o link do Apple Music | **diverge** da posição do «Pausar o movimento» acima |
| Celular até 899 px | uma coluna abaixo de 900 px (a página tem duas colunas, texto e palco, que não cabem em 768) | o palco preso precisa de ~700 px ao lado do texto | **diverge** do corte de 767 px; só nesta página |

### Página de entrada · rodada 3 (a home com o menu na barra) — propostos, pendentes de aprovação do MJRP

(As três linhas «v4» abaixo vêm de `design/inception/splash-menu-bar-v4.html`, 2026-11-21; pendentes de aprovação do MJRP como as outras.)

Das prévias de 2026-11-21 (`design/inception/splash-menu-{stops,bar,deck}-v1.html`; UAT-241, UAT-240). **Pendentes de aprovação do MJRP**; só uma das três formas da barra-menu fica, a que ele escolher.

| Padrão | Como é | Por quê | Muda o quê |
|---|---|---|---|
| Barra-menu (o fio que é o menu) | UMA fila contínua de barras de equalizador, sem vãos (como a «Elevar», `splash-sides-v1.html`), dividida em cinco partes iguais, uma por item do menu do app (Start, Albums, Blend, Playlists, Inventory, os rótulos de `phoneTabs.js`); o fogo enche da esquerda para a direita conforme a leitura passa por cada história; o item atual em `#fb923c` com `aria-current="step"`, os já lidos em branco, os outros `#b9b9c2`; clicar num item leva à história dele na página; ⟲ marca a virada do disco entre Blend e Playlists. No celular, a barra de baixo: cinco rótulos de 12 px sob as barras, alvos de 72 × 56 px | o MJRP: «o slider deveria ser continuo como era na elevar» e «o slider do menu e a landing page contar a story de cada item do menu» | **diverge** do «Fio do equalizador» aprovado na rodada 2 (um grupo por faixa, com vãos pretos; só progresso no celular) |
| Onde a barra-menu mora | três prévias num eixo: A sob o topo (fio com paradas); B no próprio topo, os itens sobre as barras (o menu é a barra; **recomendada**); C numa barra de baixo com agulha, igual no computador e no celular | o eixo é quanto o menu e a barra se juntam | novo; uma só fica |
| Topo com conta | logotipo, a barra-menu (B) e «Start» com o fogo, sem «Sign in» nem «Open the app»; sem conta, «Sign in» e «Open the app» como hoje | o MJRP: «nao faz sentido ter sign in e open the app pra que está signed, mas sim um Start button que vai pra Start» | **diverge** do topo aprovado (sempre «Sign in» e «Open the app») |
| Virada como faixa curta (v2) | entre Blend e Playlists, uma faixa de ~90 px com «⟲ Vire o disco» em Syne 22 px laranja e uma linha sobre o lado B, filetes em cima e embaixo; no computador o caixote gira enquanto ela passa; no celular, um filete de uma ou duas linhas, 13 a 14 px | o MJRP sobre a tela inteira da virada: «faz sentido isso aqui ?» | **diverge** de «Flip the record» como seção de uma tela (rodada 2) |
| Cartão do ranking com disco real (v2) | o cartão «ranked» com um disco de verdade e as faixas reais; uma faixa no topo marcada «você subiu» em `#fb923c`, as outras como estavam, «+ N faixas»; uma nota curta «Exemplo: …»; nada de notas de terceiros | o MJRP: «isso aqui tb nao deve ser ilustrativo, vamos colocar dados rais de album pls» | **diverge** do «Exemplo ilustrativo» (álbum fictício, «Example data, not real scores») |
| Pausar o movimento como ícone | botão redondo de 44 px no canto de cima à direita do palco, ícone de pausa / play de 16 px em `#d6d6dc`, contorno a 28 %, `aria-label` e `title` «Pause motion» / «Play motion», `aria-pressed`; some com movimento reduzido | o MJRP, 2026-11-21: «nao sabia da acessabilidade, coloque um icone discreto entao» (WCAG 2.2.2); o canto do palco é onde está o movimento e longe da barra-menu | **diverge** de «"Pause motion" no fio» (botão com texto) |
| Vinheta da história (v4) | sob o texto de cada história no computador (420 × 200 px), ao lado da capa no celular (o resto da largura × 172 px): um painel `#0f0f13`, contorno branco a 8 %, cantos de 14 px, brasa embaixo (`#f97316` a 13 %); dentro, um motivo que diz a história, sem texto (só os nomes Spotify e Apple Music) e decorativo (`aria-hidden`): Inicie, um campo que digita um artista e três resultados; Álbuns, uma faixa que sobe ao topo; Blend, três discos alimentando uma lista, um de cada vez; Playlists, duas playlists salvas, ▶ na que toca, ✓ nos serviços; Inventário, uma prateleira com vinil, CD e fita | o MJRP, 2026-11-21: «o espçamento aqui tem um vázio muito grande, ou reduzimos ou colocamos animacoes ligadas a fogo e musica...motions fading in e fading out»; tamanho fixo, nada salta | novo; o equalizador continua só no fio e no botão principal (a vinheta usa ▶, ✓, discos e brasa) |
| Vinheta: movimento ligado à rolagem (v4) | aparece enquanto a história entra e some enquanto sai: opacidade 1 no meio da tela, cai a 0 no quinto de fora, e 10 px de deslocamento; os laços (girar, digitar, subir) só com a vinheta na tela e a página em movimento; em repouso (10 s sem rolar), no pausar e com movimento reduzido, cada vinheta mostra a sua imagem parada, composta; só `transform` e `opacity` | o mesmo do fogo brando: movimento só perto da leitura, nunca atrás do texto | novo |
| Ritmo das histórias (v4) | computador: cada história com `clamp(540px, 70dvh, 680px)` (antes 88dvh), o convite com `clamp(440px, 56dvh, 560px)`; celular: sem altura mínima, 36 px em cima e embaixo; a abertura com título curto e a linha menor «Seus álbuns do momento…» em Syne 700 laranja | o maior trecho vazio caiu de 308–468 px para 125–173 px no computador (medido a 1280 × 900) | muda a altura da v3 |

## O menu do topo do app (F88) · construído — pendente de aceite do MJRP

O MJRP escolheu em 2026-11-21 («Elevar no cel e transformar na web»): **Transformar no computador, Elevar no celular.** Em uso (construído, ainda sem aceite): a barra do topo de 72 px com a marca em fogo e a barra-menu da home (`public/splash/bar-menu.css`, o mesmo arquivo da home), a linha de baixo de 44 px, o botão da conta com pontos de conexão e o painel de 344 px com Spotify e Apple Music (`public/css/top-menu.css`); no celular, o topo de 56 px com a marca em fogo (22 px), a barra de baixo de 64 px (+ 1 px de linha, igual à da home: 65) **com ícones** e a fila de barras da home no alto, a aba atual em `#fb923c`, e a folha «Menu» com as duas conexões (`public/css/mobile.css`). **Não em uso, ficam só como registro:** a barra de baixo sem ícones e a folha «Conta e conexões» do Transformar no celular, a pílula do Spotify do Elevar no computador, a chave PT · EN no app (a F81 trará). Valores medidos contra a home em 1280 px: barra, marca (181 × 30 px a 16 px da borda) e fila de barras na mesma posição e no mesmo tamanho (`reports/evidence/F88/measures.json`).

## O menu do topo do app (F88) · rodada 1 — propostos, pendentes de aprovação do MJRP

Da rodada 1 de desenho do menu do app (2026-11-21, `design/inception/f88-top-menu-{elevar,transformar}-v1.html`, comparador `design/proposals/f88-top-menu/comparator.html`). **Tudo pendente de aprovação do MJRP**; só as linhas do nível que ele escolher entram em uso, as do outro ficam aqui como registro. Reusados sem mudança: o degradê «flame», o botão principal com texto preto, o botão fantasma, o equalizador (alturas e tempos próprios), a barra-menu da home (SPL-20), a folha de baixo (§ Folha), o contorno de foco âmbar, os alvos de 44 px.

| Padrão | Nível | Como é | Por quê | Muda o quê |
|---|---|---|---|---|
| Barra do topo do app no estilo da home | os dois | 72 px no computador, 56 px no celular, fundo `rgba(10,10,12,.92)` com desfoque de 12 px, a marca em fogo da home (30 px; 22 px no celular) levando à home | a passagem da home para o app sem troca de moldura (o MJRP: «aí a transicao fica mais suave») | **diverge** da barra de vidro flutuante do app (`.top-nav glass-panel`) e da § Barra do topo (48 px, logotipo de 28 px) |
| Trecho de barras sob o item | Elevar | sob cada item do menu, 14 barras do equalizador (12 px); cinza a 20 % de branco; o item atual em `#fb923c` com o seu trecho em fogo, as 4 barras se mexendo; no celular, uma fila fina (8 px) no alto da barra de baixo, aceso no trecho da aba atual | marca o item atual como a home marca a história lida | novo |
| Barra-menu no app | Transformar | a barra-menu da home (cinco partes iguais sobre uma fila contínua de barras, ⟲ entre Blend e Playlists) mantida no app; o fogo acende **só o trecho da tela atual**, o rótulo dela em `#fb923c` com `aria-current="page"`; no lado B (Playlists, Inventário) o ⟲ também acende | a mesma barra da home, agora dizendo onde você está; um sentido só para o fogo nos dois lados (crítica da rodada, AH-08) | **diverge** da SPL-20 (lá o fogo enche com a leitura; cada item rola até a sua história) |
| Barra de baixo sem ícones | Transformar | a barra de baixo da home: rótulos de 12 px sob as barras, 64 px de altura (+ 1 px de linha, igual à da home), alvos de 72 × 56 px | ser a mesma barra da home; pergunta 3 ao MJRP | **diverge** da § Barra de baixo (ícone de 24 px e rótulo) |
| Linha de baixo da barra | Transformar | 44 px sob a barra, só nas telas com lugares dentro: Álbuns (computador) e Playlists (Salvas · Novas · Séries de playlists); o lugar atual em branco com filete laranja de 2 px | os lugares do «Music Series» e o «New playlists» sem um menu suspenso | novo; substitui o menu suspenso «Music Series» |
| Botão da conta com conexões | Transformar | redondo de 44 px: o avatar (inicial sobre o fogo) com conta; sem conta, a pessoa (celular) ou a tomada (computador, só conexões); pontos de 12 px com aro escuro e branco: verde Spotify, rosa Apple Music, quando conectados; o estado por extenso no `aria-label` e no painel | conta e conexões num lugar só | novo |
| Painel de conta e conexões | Transformar | computador: painel de 344 px sob o botão; celular: folha de baixo «Conta e conexões»; dentro: a conta ou «Entrar» (botão principal), «Conexões» (Spotify, Apple Music, cada um com o estado em texto e «Conectar» / «Desconectar»), o idioma (celular), os tipos de série «em breve» (celular), limpar o cache, sair | reúne o que hoje está na barra, no menu da conta, no rodapé e no menu do celular | novo; a Apple Music no menu é nova (pergunta 2) |
| Pílula do Spotify no estilo da home | Elevar | 44 px, cantos de 12 px, contorno verde a 60 %; «Conectar» ou «Spotify ✓» com «×» de 44 × 44 px | o botão de hoje no desenho dos botões da home | ajusta o `SpotifyConnectButton` (30 px de altura hoje) |
| Idioma no app | os dois | a chave PT · EN da home (44 px por lado): na barra do computador; no menu (Elevar) ou no painel (Transformar) do celular | a home tem a chave; o app sem ela seria um corte na passagem | novo no app; a escolha e o dicionário são da F81 |

## Fontes consultadas (2026-11-20)

- Apple, Human Interface Guidelines: Tab bars, Sheets, Accessibility, Layout, Typography — <https://developer.apple.com/design/human-interface-guidelines/>. As páginas não abriram na ferramenta de leitura (são montadas por script); os valores acima (44 pt, cinco abas, alça e fechar da folha) são os conhecidos da HIG e ficam a conferir pelo MJRP se algum pesar numa decisão.
- WebKit, «Designing Websites for iPhone X» — <https://webkit.org/blog/7929/designing-websites-for-iphone-x/> (lida).
- Apple, «Configuring Web Applications» (ícone, `apple-mobile-web-app-capable`, estilo da barra de status, título) — <https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html> (lida).
- MDN, `env()` e `overscroll-behavior` — <https://developer.mozilla.org/en-US/docs/Web/CSS/env>, <https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior> (lidas).
- web.dev, «The large, small, and dynamic viewport units» — <https://web.dev/blog/viewport-units> (lida).
- W3C, WCAG 2.2, Understanding 2.5.5 Target Size (Enhanced) — <https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html> (lida).
- CSS-Tricks, «16px or Larger Text Prevents iOS Form Zoom» — <https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/> (resultado de busca; não aberta).
- Spotify, Apple Music e Discogs no iPhone: o arranjo (barra de destinos embaixo, linhas compactas com capa de cerca de 56 px, folha de baixo para as ações de um item, ação principal presa acima da barra) é o conhecido desses apps; não foram abertos nesta passada.

## Home · padrões propostos na F79 (pendente de aprovação do MJRP)

Rodada 1 de desenho da Home (2026-11-20), três níveis lado a lado (`design/proposals/f79-home/`). **Nada daqui está em vigor**: cada linha é *pendente de aprovação do MJRP* e entra, ou sai, quando ele escolher o nível. O nível que ele não escolher fica aqui como registro. **Desfecho (2026-11-20):** ele escolheu o Transformar, e a v2 foi aprovada (seção seguinte): as linhas do Transformar abaixo («Capa escolhida numerada», «Fichas de tipo», «Base da série», «Equalizador vivo», «Título com o degradê do fogo») valem com o detalhe da v2; as só do Consolidar e do Elevar ficam como registro, fora de uso. O piso é a identidade acima e a decisão dele de 2026-11-20 (`docs/log.md`): o fogo (o logotipo, o degradê «flame») e os equalizadores são do site.

| Padrão | Nível | O que é | O que muda no sistema e por quê |
|---|---|---|---|
| Rótulo de passo legível | Consolidar | os rótulos «01 // …» a 12 px, branco a 85 %, o número do passo ativo em laranja; o texto de ajuda sem caixa alta | hoje 10–12 px em cinza e caixa alta; o rótulo é o título do passo, não nota de rodapé (CO-08, CP-03) |
| Seletor «By artist / Paste a list» | Consolidar, Elevar | dois botões de 32 px (computador) e 44 px (celular); no Elevar, o segmentado do celular (`.phone-segmented`) também no computador | hoje 23 px com texto de 10 px e o escolhido em laranja; o segmentado não é laranja (regra já declarada para o celular, estendida) |
| Bandeja da série | Elevar | painel de vidro à esquerda: rótulo «// Your series» em mono laranja, o nome (campo de 48 px, Syne 18 px), a frase da série, a contagem, as linhas (capa de 44 px, número de ordem em laranja, ↑ ↓ ✕ de 32 px) e «Create series» de 52 px no pé | substitui «03 // Selected Albums» e o cabeçalho que repetia a marca; a ação principal fica sempre à vista (IN-04, CP-03) |
| Medidor equalizador | Elevar | cinco barras de 3 px com o degradê do fogo (`#dc2626 → #f97316 → #fdba74`); acesas conforme a contagem (até cinco) e nos passos «Find · Pick · Create» | o equalizador, hoje só no fundo (`hero_bg.svg`), vira um elemento que diz algo; a quantidade continua escrita ao lado (HI-04: a barra é cue, não o único canal) |
| Capa escolhida numerada | Elevar, Transformar | anel laranja de 2 px e o número da ordem num círculo com o degradê do fogo; leva para o computador o que o celular já faz (F76) | hoje no computador clicar na capa não muda a capa; o retorno fica onde o olho está (IN-04) |
| Fichas de tipo | Elevar, Transformar | fichas redondas de 36 px (44 px no celular) com a contagem; a ligada em superfície clara (Elevar) ou branca (Transformar) | hoje a ligada é laranja como a ação principal (HI-05: um destaque só) |
| Base da série | Transformar | barra presa embaixo com a pilha de capas, o nome escrito no lugar e «Create series» de 56 px; no celular vira a barra de ação acima das abas | uma forma nova da série; desvia da bandeja (Elevar) e da lista (hoje) |
| Equalizador vivo | Transformar | 48 barras com o degradê do fogo sob o campo de busca; paradas em 55 % de opacidade, em movimento enquanto o catálogo responde; sem movimento com `prefers-reduced-motion` | o equalizador como indicador de atividade (IN-04) |
| Título com o degradê do fogo | Transformar | a segunda linha do título em texto com o degradê «flame» | hoje o degradê só pinta botões; aqui ele pinta texto grande uma vez por tela (HI-06) |

### Home · rodada 2 da F79 · a direção Transformar (aprovada pelo MJRP em 2026-11-20 com o protótipo v2)

O MJRP escolheu a direção **Transformar** em 2026-11-20 19:19 («home 3 niveis transformar»): escolha de direção, não a aprovação do protótipo. A rodada 2 (`design/inception/home-transformar-v2.html`) detalha os padrões do Transformar acima e acrescenta os que faltavam. **Aprovada:** o MJRP aprovou o protótipo em 2026-11-20, por volta das 22:15 («aprovado a home v2 … bora implementar»; registro em `info-arch.md` § Protótipos aprovados). Os padrões abaixo valem para a Home desde a F79. O que era decisão dele e ficou sem resposta está marcado *decidido pelo agente — revisável*: a cor (A, sem a terceira parada) e o texto sobre o fogo. Cada linha diz se reusa um padrão declarado ou se é nova. Consolidar e Elevar ficam na tabela acima como registro dos níveis não escolhidos.

| Padrão | Como é (v2) | Reusa / novo | Por quê |
|---|---|---|---|
| Campo único | um campo de 64 px (56 no celular) que aceita um artista ou, com quebras de linha, uma lista; ao virar lista, cada linha mostra «ready» (verde `#4ade80`) ou o motivo (rosa `#fca5a5` sobre fundo vermelho a 14 %, com filete à esquerda); o rodapé diz «N lines: N ready, N to fix» e o botão «Add N albums» | novo (aprovado com a v2) | um lugar só para achar álbuns; a regra da lista é a de hoje (F63, `^home-bulk-skipped`), só mostrada antes do clique |
| Base da série (dock) | barra presa embaixo: até 7 capas de 52 px numeradas (3 no celular, sobrepostas), «+N» depois disso; o nome da série escrito no lugar; «Edit order» (44 px, neutro) e «Create series» (56 px, fogo); a frase «Next: the Blend turns the series into playlists.» embaixo; a página reserva a altura da base (nada fica atrás dela) | detalha a «Base da série» acima (aprovado com a v2) | a série à vista o tempo todo, com a ação que conclui |
| A base é a barra de ação do celular | no celular a base **é** a `.phone-action-bar` da F76: logo acima da barra de baixo, capas + nota + um botão de 48 px; tocar nas capas ou na nota abre a série numa folha `full` | reusa `.phone-action-bar` e a Folha `full` | um só lugar para a ação no celular, como a F76 decidiu; a folha é `full` porque tem o campo do nome (regra da Folha) |
| Painel da série | no computador abre **acima da base** (até 440 px, o corpo rola); no celular é a folha `full`. Cabeçalho «Your series · N albums» e «Done»/«Close»; a frase da ordem; uma linha por álbum: número, capa de 44 px, título e ano, **↑ ↓ ✕ de 44 x 44 px** com `aria-label`; ↑ do primeiro e ↓ do último apagados; a linha movida fica marcada; arrastar fica fora desta versão (↑ ↓ basta e funciona igual no toque; se o MJRP quiser arrastar, entra com o vão marcado e Esc, IN-16) | novo (aprovado com a v2); as linhas seguem a folha dos escolhidos da F76 (`^home-phone-chosen-sheet-open`) | mudar a ordem e tirar um álbum sem arrastar (IN-16, achado 7 da crítica da rodada 1) |
| Desfazer (Undo) | faixa clara `#f4f4f5`, texto preto, «Removed «X».» / «Added N albums.» e «Undo» (44 px), presa logo acima da base, por 8 segundos | reusa o «Removed «X» · Undo» da F76 (`^home-phone-chosen-sheet-open`), agora também no computador | tirar e «Add all» não perguntam antes: desfazem depois |
| Nome sugerido | ao entrar o primeiro álbum, o nome vira texto de verdade (não `placeholder`): «Pink Floyd selection» com a etiqueta «suggested · edit it»; com dois artistas, «Joni Mitchell and Yes», com três ou mais, «Joni Mitchell, Yes and more»; editar tira a etiqueta | novo (aprovado com a v2) | nunca «New Album Series» em silêncio; o `placeholder` some ao focar e se lê como vazio (crítica da rodada 1) |
| Equalizador: o que cada estado quer dizer | **parado** (50 % de opacidade, alturas variadas): pronto, nada sendo pedido; **em movimento**: esperando uma resposta (o catálogo, a gravação da série); **baixo** (barras a 10 %, 35 % de opacidade): a resposta não veio. As palavras dizem o mesmo («Searching…», «Saving your series…», «The catalog did not answer…»). Com `prefers-reduced-motion`, nada se mexe: as barras ficam paradas em altura cheia durante a espera | detalha o «Equalizador vivo» acima (aprovado com a v2) | o equalizador é da identidade e passa a significar algo (pedido do MJRP: «fazem parte da identidade do site») |
| Um fogo por vez | o degradê «flame» preenche **um** botão por estado: «Search» enquanto nada foi achado nem escolhido; depois, «Create series»; depois de criar, «Blend it now». O número da capa escolhida também usa o fogo | regra nova (aprovada com a v2) | HI-05: um destaque só (achado 10 da crítica) |
| Texto sobre o fogo | rótulo branco a **19 px, peso 800** (texto grande): branco sobre o degradê mede 2,8:1 na ponta laranja, 3,4–4,2:1 onde o rótulo fica e 4,8:1 na ponta vermelha; como texto grande, o piso é 3:1 | ajusta o `.btn-primary` só na Home; decidido pelo agente — revisável (o MJRP não respondeu entre branco e preto) | o branco a 15–17 px não passa; a F80 propõe texto preto no botão da página pública (pendente) — as duas pedem a mesma decisão do MJRP |
| Links | branco, peso 700, sublinhado laranja `#f97316` de 2 px | novo (aprovado com a v2) | `#fb923c` é declarado só para a fonte BestEverAlbums (achado 13 da crítica) |
| Degradê do título e das barras | duas paradas, `#f97316 → #dc2626` (as declaradas). A terceira parada `#fdba74` da v1 está numa **prévia** (A sem, B com) para o MJRP escolher | reusa o «flame»; a cor A decidida pelo agente — revisável (o MJRP não escolheu entre A e B) | a crítica apontou `#fdba74` fora das cores declaradas; a F80 usa outra terceira parada (`#fbbf24`): se ele quiser uma ponta clara, uma só para as duas telas |

#### Home · o que a construção da F79 acrescentou (decidido pelo agente — revisável)

A construção (`public/css/views/home.css`, `public/css/mobile/home.css`, `public/js/components/home/`) segue a tabela acima. Onde o protótipo não dizia como se faz, o agente decidiu, e cada linha fica pendente de o MJRP olhar:

| Padrão | Como é | Reusa / novo | Por quê |
|---|---|---|---|
| A lista colada, editável | cada linha da lista é um campo próprio (o número, o texto, «ready» ou o motivo ao lado, embaixo no celular); colar várias linhas abre várias; Enter abre uma linha; apagar uma linha vazia a fecha | novo (decidido pelo agente — revisável) | o protótipo mostra as linhas prontas, mas não diz como se digita nelas; um campo por linha mantém o número e o motivo presos à linha. A tipografia é a do protótipo (reconferência de 2026-11-21): linha em Syne 15/400 (texto 16/400 no celular); a linha pulada em Syne 18/600 sobre a faixa vermelha, sem caixa |
| O fechar da folha da série | a Folha `full` do celular usa o botão de fechar dela (✕, com o nome «Done» para o leitor de tela) no lugar do «Done» em texto do protótipo | reusa a Folha (`components/ui/Sheet.js`) | a Folha `full` tem o fechar sempre à vista, de 44 px; dois fechar na mesma folha seriam dois rótulos para uma ação (IA-02) |
| Os números na fonte de texto | o número da capa, da linha do painel, da base e dos passos na fonte de texto do sistema, também no computador | ajusta a regra de fonte do computador (só nos números) | o «1» da Syne se lê como «ı» justamente no número da ordem (achado 18 da crítica) |
| Os tokens da Home | `--home-flame`, `--home-flame-text`, `--home-eq-grad`, `--home-panel`, `--home-muted`, `--home-soft`, `--home-line` em `:root` (`css/views/home.css`) | traduz o protótipo; as cores são as declaradas | uma fonte só para as cores da Home no computador, no celular e na folha |

## Portes para React (F83) — peça de hoje → peça em `ui/`

Nenhuma peça é redesenhada: o mesmo HTML, as mesmas classes e as mesmas folhas de estilo (o Tailwind lê `.tsx`; nada de CSS por componente, `oneStyleSystem.test.js`). A prova de cada porte é o teste da tela que o levou.

| Peça de hoje | Peça em React | Onda | Nota |
|---|---|---|---|
| `components/Icons.js` `getIcon()` | `ui/Icon.tsx` (lê os mesmos desenhos, `utils/iconShapes.js`) | 0 | HTML igual provado para todo ícone usado |
| `components/common/AlbumCascade.js` | `ui/AlbumCascade.tsx` | 1 | duas escritas das mesmas poucas linhas até a Blend migrar (onda 7); `test/ui/AlbumCascade.test.tsx` as mantém iguais |
| `components/ui/coverImage.js` | `ui/CoverImage.tsx` | 1 | a imagem de capa com a reserva; a escuta do erro e o endereço da reserva moram em `ui/coverStandIn.ts` (8b; o módulo à mão saiu) |
| `components/ui/Sheet.js` (a Folha) | `ui/SheetWindow.tsx` (`useSheetWindow`) | 1 | o motor fica; o conteúdo da Folha é React, por um portal |
| `components/ui/BaseModal.js` (a janela) | `ui/ModalShell.tsx` (`useModalWindow` a usa) | 1, 5b, 8b | a casca é React desde a 5b e a à mão saiu na 8b; o retrato da casca à mão, em 30 tamanhos, é `test/fixtures/windowShellBeforeF83.json` |
| `components/Toast.js` (os avisos) | `stores/toasts.js` (a API, sem React) + `shell/Toasts.tsx` | 8b | a mesma API `toast.success/error/warning/info(texto, ms)`; o dourado de 13 cenários com tempo falso é `test/fixtures/enginesBeforeF83.json` |
| `components/GlobalProgress.js` (a barra fina) | `stores/progress.js` + `shell/GlobalProgress.tsx` | 8b | o mesmo `#globalProgress` e as mesmas classes |
| `services/DialogService.js` + `ConfirmModal.js` + `InputModal.js` (as perguntas) | `ui/dialogs/` (`dialogs.ts`, `ConfirmWindow.tsx`, `InputWindow.tsx`) | 8b | a mesma API `dialogService.confirm/prompt/alert/dismiss`; uma pergunta fica quando a tela sai |
| `components/ui/FilterToolbar.js` e `FilterSheet.js` | **ainda a antiga**, por `react-bridge/legacy/FilterToolbar.tsx` | 5 | a tela dos álbuns, antiga, também a usa e carrega no script principal; um porte para React lá faria o script principal chamar o React |
| `components/ui/TrackRow.js` | `ui/TrackRow.tsx` | 2 | porte único: as telas das playlists guardadas e das playlists o usam; mesmo HTML e mesmas classes (a prova é a página das duas telas), os rótulos dos selos vêm do dicionário (`ui.trackRow.*`); o invólucro `TrackRows` saiu |
| `components/Breadcrumb.js` | `ui/Breadcrumb.tsx` | 2 | a trilha da tela das playlists; a antiga fica para as telas de séries e de inventário até elas migrarem (ondas 5 e 6) |
| `components/playlists/RegeneratePanel.js` | `screens/playlists/RegeneratePanel.tsx` (a memória do que se mudou em `regenerateMemory.ts`) | 7a | o painel de gerar de novo da tela de playlists; o invólucro `react-bridge/legacy/RegeneratePanel.tsx` saiu; a prova é o dourado do painel à mão (`regenerateBeforeF83.json`) e o da tela inteira |
| `components/blend/BlendRecipeCard.js` | `ui/recipe/RecipeCards.tsx` (ícone, cores e classes em `models/recipeLooks.js`, escritas inteiras: o Tailwind as acha no código) | 7a | os cartões de receita, sem loja e sem serviço; **duas escritas** (a à mão fica com a tela Blend à mão até a 7b), mantidas iguais por `test/ui/recipe/RecipePieces.sameAsHandMade.test.tsx`; os nomes vêm do dicionário pelo id da receita (`blend.recipes.<id>.*`) |
| `components/blend/BlendIngredientsPanel.js` | `ui/recipe/Ingredients.tsx` (as regras em `models/recipeIngredients.js`) | 7a | as cinco seções de ingredientes (Top #, agrupamento, estrutura, duração, fonte); o deslizador é ouvido por `input`; **duas escritas** até a 7b, pelo mesmo teste |
| `shell/TopNav.tsx`, `navigation/SeriesDropdown.js`, `shell/Account.tsx` | `shell/TopNav.tsx`, `SeriesDropdown.tsx`, `Account.tsx` | 3 | a barra do topo do computador e a gaveta da tela média: mesmo HTML e mesmas classes (a prova é a página de cada estado contra a antiga, `test/shell/Shell.sameAsBefore.test.tsx`); a barra segue o endereço e o chevron da gaveta gira (a antiga girava a nota): únicas diferenças |
| `components/Footer.js` | `shell/Footer.tsx` | 3 | o rodapé; a frase do Discogs liga e desliga por `stores/discogsNotice.js` |
| `components/SpotifyConnectButton.js` | `shell/SpotifyConnect.tsx` | 3 | os três botões (barra, gaveta, menu do celular), cada um com o seu estado |
| `shell/PhoneShell.tsx`, `PhoneMenu.js`, `phoneTabs.js` | `shell/PhoneShell.tsx`, `PhoneMenu.tsx`, `phoneTabs.ts` | 3 | a moldura do celular escreve no `body` por um portal; o menu e a pergunta de limpar o cache são `ui/SheetWindow` (que ganhou `id` e rodapé) |
| `components/LoginModal.js` | `shell/LoginWindow.tsx` | 3 | a janela de entrar, aberta por `stores/loginWindow.js` (qualquer tela chama `openLoginWindow()`) |

## Arquivo

Texto substituído na F86 (2026-11-21), guardado palavra por palavra para as referências antigas (UAT, log). O que vale está nas seções acima.

O que as telas compartilham: medidas, tipo, cores e componentes. Este documento nasceu com a F76 (achado 24 da crítica de UX de 2026-11-20: não havia escala declarada, e por isso 9, 10, 12, 14 e 16 px conviviam, e alvos de 24 a 48 px). Hoje ele declara o **celular**; o que é da tela de computador ainda vive só no código (`tailwind.config.js`, `public/css/tailwind.css`, `public/css/tech-theme.css`) e entra aqui quando for mexido.

## Identidade (não muda no celular)

| O quê | Valor | Onde está |
|---|---|---|
| Fonte | Syne (400, 700, 800), sem serifa de reserva | `public/index.html`, `tailwind.config.js` |
| Fundo | preto `#000000`; painel `#101014` (folhas do celular) | `body.bg-black`; `--phone-sheet-bg` |
| Destaque | laranja `#f97316`; degradê «flame» `#f97316 → #dc2626` | `brand.orange`, `bg-flame-gradient` |
| Perigo | vermelho `#dc2626` / `#f87171` em texto | `.btn-danger` |
| Texto | branco; secundário branco a 60% ou mais | — |
