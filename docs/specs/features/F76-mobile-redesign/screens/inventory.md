# Inventário no celular — TASK-07 (REQ-11)

Tela `/inventory` («My Collection») a até 767 px. Ramo `feat/f76-mobile-inventory`. Tudo aqui é **decidido pelo agente — revisável** (o MJRP deu liberdade de desenho no celular em 2026-11-20 e julga no iPhone, TASK-09). O computador não muda: o cartão de cinco linhas da F75, escolhido pelo MJRP, continua lá como era (`InventoryView.renderComputer`).

## O que a tela é no celular

De cima para baixo (`InventoryView.renderPhone`):

1. **Contagem e filtros por status.** «211 albums» (14 px, cinza) e as três contagens da F75 («✓ 160 Owned», «32 Not Owned», «♡ 19 Wishlist»), os mesmos botões de antes, como fichas de 44 px lado a lado; a apertada fica laranja com texto escuro (`aria-pressed`). O título «My Collection» fica só para o leitor de tela: a barra do topo já diz «Inventory».
2. **Faixa dos totais.** Os dois totais lado a lado (rótulo 12 px, número 20/700 branco, «N of M … have a value» 12 px), e a moeda num controle segmentado de 44 px na largura toda (USD · EUR · GBP · BRL; a escolhida em cinza elevado, não laranja). Abaixo, a taxa usada, a falta de câmbio e, com valor do Discogs, **«Data provided by Discogs.»** com link de 44 px — nunca escondido.
3. **Avisos dos valores** (F75): «N albums are waiting for a value…» com «Read them now» à direita; a rodada em curso com «Stop».
4. **Barra presa** sob a barra do topo (`position: sticky`, camada 30, abaixo da 38 do kit): busca (16 px), **A–Z** (salto), **Filtros** (ícone, com o número de ligados num selo) e **⋯** (ações da coleção). Embaixo dela, só quando algo roda, a linha do que a ação está fazendo («Reading ratings… 40 of 211»; para os valores, com «Stop»): à vista o tempo todo, sem cobrir as barras.
5. **As linhas**, 50 de cada vez (`InventoryPhoneRow.js`).
6. Fim: «Showing 50 of 211» e «Show 50 more» (48 px); com a fonte do Discogs ligada, a frase da API do Discogs que no computador mora no rodapé (o rodapé não existe no celular; F75, REQ-06).

### A linha (102 px; 122 com título em duas linhas)

| Lugar | O quê |
|---|---|
| Esquerda | capa 64x64, raio 6, borda interna fina |
| Centro | título 15/20 700 em até duas linhas; artista 14/18 cinza numa linha |
| Direita | valor 15/20 700 tabular («≈ $13.00», ou «—» em cinza) e a origem em 12 px («Discogs», «Yours», ou o motivo: «Waiting for a value», «Discogs did not answer»…) |
| Faixa de baixo | **status** (pílula de 30 px que responde em 44, verde para Owned, rosa para Wishlist, neutra para Not Owned, com ▾), as duas médias em 12 px com os ícones (nota do BestEverAlbums, popularidade do Spotify) e **⋯** de 44 px |

Toque na linha = abre a janela do álbum (o «View» de hoje; botão invisível que cobre a linha, com nome «Open <título>, <artista>»). Status e ⋯ ficam por cima dele.

**O que a linha deixa do cartão do computador, e por quê:** os dois rótulos («In my collection · worth», «Sell, trade or buy») — o status já diz de quem é e a folha ⋯ repete o rótulo; os links das lojas e «Sell»/«Trade» desligados — vão para a folha ⋯, com alvo de 48 px (no cartão eram texto de 12 px); o número de faixas de cada média — fica na janela do álbum; o formato — a origem já diz CD na folha; a borda verde/laranja do valor — o status tem cor e nome. A capa grande (cartão de ~450 px) virou 64 px: 211 álbuns passaram de ~95 000 px a ~23 000 px, e em blocos.

### O que abre como folha (`InventoryPhoneSheets.js`, todas `bottom`)

- **Status**: as três opções em linhas de 48 px, a atual com ✓. Dois toques ao todo; a folha fecha antes de gravar; a lista não volta ao topo (F71: o número de linhas desenhadas e o lugar na página são mantidos).
- **⋯ do álbum**: título do álbum; «artista · status»; «Open album», «Edit»; o valor (rótulo da F75, valor 22 px, a origem; do Discogs: a frase da média dos três estados, «This edition on Discogs ↗» e «Data provided by Discogs.» com link); «Where to buy» com Discogs ↗, Amazon ↗, iMusic ↗ e a frase de que o app não ganha nada; «Sell» e «Trade» desligados com a frase da F75; «Remove from inventory» em vermelho, que abre a confirmação de sempre («Remove from Inventory?»).
- **Filtros e ordem**: formato (All · CD · Vinyl · Digital, segmentado de 44 px) e as dez ordens (artista, médias, valor, data de entrada, nas duas direções) em linhas de 48 px com ✓; aplicam na hora; o rodapé diz «Show N albums» (o único laranja da folha) e fecha. Conta como ligado: formato ≠ All e ordem ≠ Artist (A–Z).
- **Ações da coleção** (⋯ da barra): «Add the albums of my series», «Update ratings» e, com a fonte ligada, «Update values» — os mesmos botões, ids e métodos do computador — cada um com uma frase do que faz (no celular não há `title`). A folha fecha antes da confirmação abrir.
- **Saltar**: na ordem por artista, as letras presentes (grade de 6, botões de 48 px, `aria-label` «S: 12 albums»); em outra ordem, trechos de 25 posições («126–150»). Saltar além do que está desenhado desenha os blocos até lá e põe a primeira linha logo abaixo da barra presa.
- **Edição** (`InventoryEditModal`, já tela cheia pela base): só CSS — campos a 16 px e 44 px, BRL/USD como dois segmentos de 48 px (o círculo de 20 px ocupa o segmento inteiro, invisível; o rótulo mostra a escolha), Save no rodapé fixo da base.

### Estados

- **Carregando**: seis linhas-fantasma do mesmo tamanho (capa e duas barras), pulsando 1,2 s; parado com «reduzir movimento».
- **Inventário vazio**: ícone de 48 px, «Your collection is empty», a frase do que o enche e **um** botão laranja «Add the albums of my series».
- **Filtrado a nada**: «No albums match», a frase e «Clear search and filters» (limpa busca, formato e status).
- **Lendo valores / lendo notas / juntando séries**: a linha sob a busca, presa.

## Decisões (decidido pelo agente — revisável)

1. **Blocos de 50 com «Show 50 more» + salto por letra**, em vez de páginas. Fonte: benchmark § 6 (Baymard, carregar mais em vez de rolagem infinita; «Mostrar mais 30 · vendo 30 de 211»); a medida da F71 é uma passada por desenho — no celular cada passada desenha no máximo 50 linhas, no computador continua a passada única dos 211. O salto resolve o «150º em até 3 gestos»: A–Z, a letra (medido: 2 gestos, o 150º já aparece). Trecho de 25 nas ordens que não são por artista.
2. **Status como pílula que abre folha**, não `select` nativo de 12 px nem segmentado por linha (não cabe com título e valor em 361 px; benchmark § 6).
3. **Laranja só no «ligado»**: a ficha de status apertada, e a ação principal de uma folha ou da tela vazia. Os totais deixaram de ser laranja no celular (eram `text-accent-primary`); a moeda escolhida é cinza elevado. Conferência do benchmark, C1.
4. **Cinza de texto `#a1a1aa`** (≈ 7,8:1 sobre preto), nunca `#6E6E76`.
5. **A grade/lista do computador não existe no celular**: a linha compacta substitui as duas; o botão de alternar não aparece (o modo guardado continua valendo no computador).
6. **Um ⋯ na barra para as ações da coleção** em vez de três botões na tela; o progresso delas fica na linha presa, não no rótulo do botão (que está numa folha fechada).
7. **A frase da API do Discogs** vai para o fim da lista no celular, porque o rodapé some lá.

## O que foi medido

Harness: `reports/evidence/F76/harness/inventory.html` (a `InventoryView` real, com o controlador, os renderizadores, as folhas, a moldura do celular e todas as folhas de estilo; 211 itens: 160 Owned, 32 Not Owned, 19 Wishlist, títulos longos, capas, médias, valores do Discogs, escritos à mão e esperando; só o Firebase e o servidor trocados por dublês). Script: `reports/evidence/F76/inventory/shoot-inventory.mjs`. Capturas e números em `reports/evidence/F76/inventory/` (ver o `.md` de lá).

A 393x852, em 13 estados (lista, vazio, filtrado, carregando, lendo, ficha apertada, BRL, as cinco folhas, a edição): sem rolagem lateral (393/393), nenhum texto abaixo de 12 px, nenhum campo abaixo de 16 px, nenhum alvo abaixo de 44 px (na edição, os círculos de moeda viraram segmentos de 48). Linha de 102 px (122 com título em duas linhas). A primeira linha começa a 547 px: duas linhas acima da dobra com o aviso de valores à espera. Do topo ao 150º álbum: 2 gestos.

A 1280x800, antes (a `InventoryView` de `feat/f76-mobile-redesign`) e depois, mesma harness: ver o `.md` da evidência.

## O que não pude verificar

- Um iPhone de verdade: o arrastar da folha, a barra presa sob a barra do Safari que encolhe, o teclado sobre a busca presa, o `-webkit-line-clamp` e a rolagem até a linha depois do salto no Safari.
- Dados reais do MJRP (só a harness, com dados inventados); a janela do álbum aberta pela linha é da TASK-03.
- Leitor de tela (VoiceOver) nas folhas e no botão que cobre a linha.
