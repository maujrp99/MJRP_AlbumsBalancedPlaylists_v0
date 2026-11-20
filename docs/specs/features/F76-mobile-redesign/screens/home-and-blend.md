---
type: screen-note
feature: F76
tasks: [TASK-05, TASK-06]
reqs: [REQ-09, REQ-10]
branch: feat/f76-mobile-home-blend
date: 2026-11-20
---
# Home, edição da série e Blend no celular

O que estas telas são no celular (até 767 px), o que foi decidido e por quê, o que foi medido e o que não foi visto. Tudo o que é desenho aqui foi **decidido pelo agente — revisável** (o MJRP deu liberdade de desenho na F76; julga no iPhone). O computador (768 px ou mais) não muda: provado por comparação antes/depois a 1280x800 (abaixo).

CSS: `public/css/mobile/home.css` (Home e o miolo da janela de edição) e `public/css/mobile/blend.css`, tudo dentro de `@media (max-width: 767px)`. Peças só do celular, montadas só quando `isPhone()`: `components/home/HomePhoneChosen.js` e `components/blend/BlendSeriesPhonePicker.js`.

## Home (`/home`) — criar uma série

### Inventário, de cima para baixo

| Bloco | O que é no celular |
|---|---|
| Cabeçalho «Album Blender V3» | some (a barra do topo já diz «Home»); o fundo decorativo (imagem e véu) também some — ele cobria a grade e escurecia as capas em ~40% |
| 01 // Series Configuration | rótulo de 12 px cinza (#A0A0A8), «Your Albums Series Name» a 14 px, campo de 48 px a 16 px |
| 02a // Artist Filter | painel elevado (#141417), sem a faixa laranja; **Visual \| Bulk Paste** vira controle segmentado de 44 px (o ligado em fundo claro, não laranja); busca de 48 px a 16 px e «Scan» de 48 px |
| Bulk Paste | área de texto a 16 px, altura 30dvh, «Process List» de 48 px logo abaixo; o relatório das linhas puladas a 14 px |
| 02b // Discography Scan + filtros | os seis filtros de tipo em **duas colunas de 44 px**, todos à vista (sem rolagem de lado); ligado = fundo laranja, texto escuro **e** um «✓» (não só cor) |
| Grade | 2 colunas, capa de ~172 px, título 14 px branco, ano 13 px; sem zoom de pairar; toque escurece/encolhe 3% |
| 03 // Selected Albums e «Initialize Load Sequence» | **somem do celular**: o conjunto escolhido vai para a barra de ação e para uma folha |
| Barra de ação (`.phone-action-bar`) | à esquerda, até 3 capas empilhadas + «N albums chosen» / «Tap to review» (toque abre a folha); à direita, **«Create series»** (laranja). Com zero: «No albums chosen · Pick albums to start» e o botão apagado |

### Estados

- **Álbum tocado:** anel laranja de 3 px na capa, a capa a 80% de brilho e um selo redondo com o **número de ordem** (1, 2, 3…) no lugar do «+»; `aria-pressed="true"`. Responde na hora, sobre o próprio álbum, e a barra conta junto.
- **Segundo toque** num álbum escolhido o tira (só no celular; no computador o segundo clique segue sem efeito, como hoje).
- **Folha do conjunto** (`bottom`): título «N albums chosen», uma linha de 64 px por álbum (número, capa 48, título em até 2 linhas, artista), **↑ ↓ ✕ de 44 px** (o ↑ do primeiro e o ↓ do último apagados), rodapé «Create series». Remover mostra «Removed «X» · Undo» no topo da folha; «Undo» devolve o álbum ao mesmo lugar.
- **Criando:** o botão da barra diz «Creating…», apagado, `aria-busy`.
- Varredura: aguardando / vazio / falha com «Try again» seguem os do picker, com texto a #A0A0A8 (4,5:1 ou mais).

### Decisões e fontes

- Barra de seleção fixa com contagem + folha de revisão, ordem com ↑/↓ sem arrastar: benchmark § 5 («Padrão recomendado»), WCAG 2.2 SC 2.5.7 (alternativa sem arrastar, exemplo de subir/descer — o ponto mais firme da conferência do benchmark). A barra aparece já com zero, apagada e dizendo o motivo (desvio do benchmark, que a esconderia com zero): o pedido da tarefa é «a ação sempre à vista».
- Número de ordem no selo, em vez de um visto: diz que está escolhido e em que lugar da série, por forma e texto, não só por cor. Decisão do agente.
- Filtros em duas colunas, não fichas que rolam de lado: com seis filtros cabem em 3 linhas de 44 px; «Compendiums (n)» não cabe em três colunas. Auditoria achado 17.
- Visual/Bulk Paste: o ligado em cinza claro, não laranja — o laranja já marca o filtro ligado e o botão principal (conferência do benchmark: um papel para o laranja).
- Os nomes de código («01 // SERIES CONFIGURATION») ficam como a voz do app; a ação principal diz o que faz: «Create series».

## Edição da série (aberta em Albums)

A casca (tela cheia, título, fechar de 44 px, rodapé fixo com Cancel e Save Changes de 48 px) é da base (`mobile.css` § 8). O miolo:

- campo do nome de 48 px a 16 px;
- a lista dos álbuns da série **sem a caixa de 200 px com rolagem própria**: flui no corpo da folha (o único que rola); cada linha de 56 px com o texto em até 2 linhas e **↑ ↓ ✕ de 44 px** com `aria-label` (↑/↓ só montados no celular);
- o picker de dentro: grade de 2 colunas sem a caixa de 320 px, filtros de 44 px.
- Remover na edição não tem «Undo» próprio: nada é gravado até «Save Changes», e «Cancel» descarta tudo — é o desfazer desta janela.

## Blend (`/blend`)

### Inventário

| Bloco | O que é no celular |
|---|---|
| Título «🍹 The Blending Menu» | 22 px; a frase «Your Music, Your Recipe» some |
| Passos | uma faixa de largura cheia, 4 marcas de 32 px, rótulos de **12 px**; o atual em branco e negrito com a marca laranja e `aria-current="step"`; feitos em verde com ✓ |
| Passo 1 | «Blend your Music by» (seletor de 48 px a 16 px) e **uma linha** de 72 px: capas da série escolhida + nome + «N albums» + «Change ›», ou «Choose a series · 49 series to choose from · Choose ›» |
| Folha «Choose a series» (`full`) | campo «Search series» de 48 px a 16 px preso no topo do corpo, «n of 49 series», linhas de 68 px com as capas em cascata, nome em até 2 linhas e «N albums»; a escolhida com um visto laranja. Um toque escolhe e fecha |
| Passo 2 | receitas em **uma coluna**, ícone à esquerda, nome 17 px, selo, **descrição inteira** a 14 px; a escolhida com anel e um «✓» |
| Passo 3 | controles de 44 px; a barra de duração responde em 44 px (o trilho segue com 8 px de desenho) |
| Passo 4 | o resumo «Using … on …» fica; o botão da página some (está na barra) |
| Barra de ação | nota à esquerda + **«Blend it!»**; apagado com o motivo: «Step 1 of 4: choose a series», «Step 2 of 4: choose a recipe»; pronto: «<receita> · 60 min»; gerando: «Blending…» |

### Decisões e fontes

- **Folha cheia com busca, escolha única**, em vez da lista na página: o fluxo do Blend leva **uma** série (`onSeriesSelect`), então a folha não tem multisseleção nem «Done (n)» — um toque escolhe e fecha. Lista na página com 49 séries empurraria a receita para ~3.500 px abaixo. Benchmark § 7 (busca presa acima da lista, nada de rolagem dentro de rolagem) e auditoria achado 15.
- «Blend it!» apagado com o motivo escrito: benchmark § 7 («apagado até haver escolha, com o motivo escrito»). O fluxo e o que ele chama não mudam: o botão da barra chama o mesmo `handleGenerate`.
- O selo flutuante «★ RECOMMENDED» some no celular: o selo da própria receita já diz «RECOMMENDED».

## UAT-217 — «Blend your Albums» sem a série

Causa: `SeriesComponentFactory.createHeader` mandava para `/blend?seriesId=` só a série ativa do `albumSeriesStore`; ao abrir `/albums/<id>` antes de a lista de séries chegar, `setActiveSeries` não acha a série e fica nula, e o botão abria `/blend` sem nada. Conserto (pequeno e seguro, fora da minha área por uma linha): o link leva a série em que a página está (`controller.getState().targetSeriesId`) e só na falta dela a ativa do store; na página de todas as séries segue `/blend` sem série. Teste: `test/views/helpers/SeriesComponentFactory.test.js`. **Não visto** num navegador com login.

## Medido (Chrome sem cabeça, 393x852, escala 2, toque)

`reports/evidence/F76/home-blend/` — `node reports/evidence/F76/harness/home-blend.mjs after <porta>`: o app de verdade, com os componentes de verdade, preenchidos pela própria página (18 álbuns com títulos longos, 50 séries, uma série de 15 álbuns). Em todas as cenas (Home vazia, com resultados, com 4 escolhidos, folha do conjunto, colar lista, edição da série, Blend no início, folha de séries com busca, receitas, pronto): **largura 393 (sem rolagem de lado), 0 texto abaixo de 12 px, 0 campo abaixo de 16 px, 0 alvo abaixo de 44 px da minha área, 0 caixa com rolagem própria fora das folhas.** (Na cena da edição aparecem `#viewModeGrid/List` de 40 e 38 px: são da tela Albums, atrás da janela.)

Computador, 1280x800: `python3 reports/evidence/F76/harness/home-blend-compare.py` compara cena a cena com a base (`feat/f76-mobile-redesign`) — ver `reports/evidence/F76/home-blend/README.md`.

## O que não pude verificar

- Nada num iPhone de verdade: Safari, teclado sobre a barra de ação, o deslize da folha, a alça.
- Telas com login (séries reais, criar a série de fato, gerar playlists): os dados foram postos pela página.
- O conserto do UAT-217 só em teste de unidade.
- Capas reais (as do teste são SVG em degradê).
