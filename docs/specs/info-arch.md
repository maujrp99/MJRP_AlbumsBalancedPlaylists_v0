# Info-arch — Album Blender V0

> Aprovado por: ainda não aprovado (nasceu em 2026-11-20 00:28, com a rodada 1 da F75) · fonte: design/inception/inventory-value-v5.1.html · a Home (F79): rodada 1, três níveis (design/inception/home-consolidar-v1.html, design/inception/home-elevar-v1.html, design/inception/home-transformar-v1.html); o MJRP escolheu a direção Transformar; rodada 2: design/inception/home-transformar-v2.html (**aprovada pelo MJRP em 2026-11-20, por volta das 22:15** — registro em § Protótipos aprovados)
> Página de entrada (F80), rodada 1 de exploração, 2026-11-20: três direções, design/inception/splash-ember-v1.html, design/inception/splash-sides-v1.html e design/inception/splash-crate-v1.html (nenhuma aprovada; comparador em design/proposals/f80-splash/comparator.html)
> Página de entrada (F80), rodada 2 de desenho, 2026-11-20: a direção escolhida pelo MJRP, design/inception/splash-crate-v2.html («Caixote · v2, o fogo e o fio»: o caixote 3D com o fio do Lado A, lado B e o fogo da Brasa, capas reais do Apple Music); aprovada pelo MJRP em 2026-11-20 22:15 no fogo brando (§ Protótipos aprovados); comparador https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e (cópia local design/proposals/f80-splash/comparator.html)
> Página de entrada (F80), rodada 3, 2026-11-21 (UAT-239, UAT-240): a home com o menu na barra — três prévias num eixo, «quanto o menu e a barra se juntam»: design/inception/splash-menu-stops-v1.html (A, fio com paradas), design/inception/splash-menu-bar-v1.html (B, o menu é a barra; recomendada) e design/inception/splash-menu-deck-v1.html (C, barra embaixo); nenhuma aprovada; a página de hoje como referência em design/proposals/f80-splash/home-menu/today.html; gerador design/proposals/f80-splash/home-menu/build.mjs; mesmo comparador
> Página de leitura: design/proposals/info-arch/info-arch.html, gerada deste arquivo (`build_info_arch_page.py`)

## Como este documento está organizado

Este arquivo nasceu com a primeira tela desenhada pela skill de UI neste projeto (F75). **Ele descreve inteira só a tela do inventário com valor estimado.** As outras telas do app existem em produção e estão descritas, por comportamento, em `docs/specs/behavior.md`; aqui elas aparecem só no Sitemap, para situar. Cada tela ganha a sua seção quando for desenhada ou redesenhada.

Desde a F76 o arquivo descreve também **o celular** (até 767 px), em duas seções: «O celular (F76)» e «Estados no celular». O que está escrito fora delas vale para o computador.

## Sitemap

- **Start** (`/start`; «Home» até a F85; `/home` agora é a página de entrada): criar uma série a partir de um artista ou de uma lista colada
- **Music Series** (`/albums`): as séries de álbuns e os álbuns de cada uma
- **The Blending Menu** (`/blend`): escolher série e receita e gerar playlists
- **Playlists** (`/playlists`, `/saved-playlists`): as playlists geradas e os lotes guardados
- **Inventory** (`/inventory`): a coleção da pessoa, com status, notas e (F75) valor estimado
  - a janela de um álbum do inventário
- **Página de entrada** (F80, aprovada na v2; mora na raiz `/` só para quem não entrou com conta — quem entrou vai direto a `/start`, e `/home`, a home do site, mostra a página a todos, com ou sem conta; o logotipo do app leva a `/home` (F85); decidido pelo agente — revisável; o comportamento está no `behavior.md` § A raiz do site e a página de entrada): o que o produto é, os três momentos, por que álbuns inteiros, «Open the app» e «Sign in». Pública, legível sem JavaScript. **Decisão do MJRP de 2026-11-21, ainda não construída:** «conta aberta sempre home qdo vc acessa o link principal do site, aí vc teria o botao para start» — o endereço principal mostra a home a todos, e ninguém é levado direto a `/start`; com conta, a home tem o menu e «Start» (rodada 3, UAT-239).

### O esquema de cada nó

| Nó | Esquema de organização |
|---|---|
| Inventory | por artista e título, no padrão; trocável por nota média, popularidade, data de entrada e (F75) valor |
| Janela do álbum | por tarefa: quanto vale, onde comprar, as faixas |
| Home (F79, proposta) | por tarefa, em três passos: achar álbuns (por artista ou lista colada), escolher, criar a série; a discografia do mais novo ao mais antigo, filtrável por tipo |
| Os outros nós | a descrever quando a tela for desenhada |
| Página de entrada (F80) | narrativa, de cima para baixo: o que é → os três momentos na ordem do uso (série, ranking e mistura, coleção) → por que álbuns inteiros → o convite; na direção «Lado A, lado B» a mesma ordem vira faixas de um disco (A1 a B2); **na v2 (Caixote, rodada 2)** a ordem é o disco tocando: lado A em cinco faixas (o que é, série, ranking, mistura, coleção), «Flip the record», lado B em duas (por que álbuns inteiros, o convite) |

## Rótulos

| Conceito | Rótulo na tela | Onde |
|---|---|---|
| quanto o CD vale | «Estimated value» | janela do álbum, caixa do total |
| o valor que a pessoa escreveu | «Yours» | etiqueta no cartão e na janela |
| o valor lido | «Discogs» | etiqueta no cartão e na janela |
| a soma do que a pessoa tem | «Estimated value of what I own» | caixa do total |
| a soma do que falta | «To buy the rest» | caixa do total |
| ler os valores de novo | «Update values» | barra de filtros |
| os links das lojas | «Where to buy» | janela do álbum |
| o que a pessoa pagou | «Purchase price» (já existe na janela de edição) | janela de edição |
| filtros e ordem no celular | «Filters» (com «· 2 on» quando há filtros ligados) | Albums e Playlists gravadas (folha) |
| ver o resto da lista no celular | «Show 50 more» | fim da lista do Inventário |
| criar a série no celular | «Create series» | barra de ação da Home |
| misturar no celular | «Blend it!» | barra de ação do Blend |
| entrar no app sem conta (página de entrada) | «Open the app» (proposta) | topo, primeira tela e fecho da página de entrada |
| entrar com a conta (página de entrada) | «Sign in» (a mesma palavra do menu do app) | topo, primeira tela e fecho da página de entrada |
| um álbum com as faixas ordenadas, de exemplo | «Illustrative · fictional album» | bloco de prova da página de entrada |

## Busca

O inventário tem busca por texto no próprio inventário (`#inventorySearch`), que vale junto com os filtros e a ordem. A F75 não muda a busca.

## Hierarquia de navegação

A barra do topo leva a cada nó do Sitemap. A janela do álbum abre sobre o inventário e fecha com «Close», com o ✕ ou com Esc, voltando ao mesmo ponto da lista. No celular a navegação é outra: ver «Navegação no celular».

## Page Templates

### Inventário (lista de cartões com totais)

Cabeçalho com o título, as contagens por status e a caixa do total; avisos; barra de filtros e ações; grade de cartões.

### Janela do álbum do inventário

Cabeçalho do álbum (capa, título, artista, status, formato); «Estimated value»; «Where to buy»; as faixas.

### Página de entrada (F80, exploração)

Uma página pública, de uma coluna de leitura, na ordem: faixa do protótipo (só no protótipo) → topo (logotipo, «Sign in», «Open the app») → primeira tela (sobretítulo, título, a frase que diz o que o produto é, as duas chamadas, e a imagem da direção) → os três momentos → por que álbuns inteiros, com um exemplo ilustrativo → o fecho com as chamadas → rodapé com o aviso das capas. Todo o texto está no HTML: a página diz a mesma coisa sem JavaScript (buscadores e assistentes de IA). As três direções da rodada 1 mudam a imagem e o movimento (o eixo «quanto 3D, e de onde vem a profundidade»); a ordem, os três momentos, a prova e as chamadas são os mesmos. O título, o subtítulo e o fecho acompanham a imagem de cada direção: é um segundo eixo, declarado (a proposta de copy dá opções por direção, e qualquer título serve em qualquer direção):

- **Brasa** (`splash-ember-v1.html`, Consolidar): o tipo grande é a imagem; um leito de fogo em canvas 2D e um equalizador em CSS embaixo do texto são o único movimento.
- **Lado A, lado B** (`splash-sides-v1.html`, Elevar): a página é um disco ouvido inteiro; capa e vinil em CSS 3D, o vinil gira com a rolagem; um fio de equalizador preso no topo mostra a faixa em que a pessoa está.
- **Caixote** (`splash-crate-v1.html`, Transformar): um caixote de nove capas fictícias em 3D real (WebGL, three.js), que se gira arrastando, pelos botões ou pelas setas; luz de fogo que tremula, vinil saindo da capa da frente, equalizador 3D.

#### Rodada 2 · Caixote v2, o fogo e o fio (`splash-crate-v2.html`)

A direção escolhida pelo MJRP em 2026-11-20 (o Caixote, mais a progressão do Lado A, lado B e o fogo da Brasa, com capas reais). Cada elemento tem um trabalho só:
- **O caixote é o palco** — o único objeto 3D, preso à direita durante toda a leitura no computador; 14 capas reais do Apple Music de pé num caixote de madeira escura.
- **A rolagem é o disco tocando** — a rolagem do navegador, nunca sequestrada; cada faixa puxa um disco do caixote e diz uma coisa que o produto faz; «Flip the record» gira o caixote para o outro lado, o lado B.
- **O fio do equalizador é o progresso** — preso sob o topo no computador (um grupo de barras por faixa, cada grupo um link; o da faixa atual respira); no celular desce para a barra de baixo, junto de «Open the app», como progresso sem toque.
- **O fogo é a luz** — um leito de brasas baixo no palco e a luz que vem de baixo nas capas; forte na primeira tela e no convite final, brando nas faixas do meio; nunca atrás de texto.
- **No celular:** uma coluna; o título e a frase primeiro; o caixote em CSS logo abaixo; cada faixa traz o seu disco (capa, crédito e link) acima do título.

#### Rodada 3 · a home com o menu na barra (prévias, 2026-11-21)

Pedido do MJRP (UAT-239, UAT-240): com conta, a home com o menu e «Start», sem «Sign in» e «Open the app»; a barra contínua como na «Elevar»; a barra é o menu, e a página conta a história de cada item. Mudam só o topo, a barra e a ordem das histórias; o caixote, o fogo, o palco em diagonal e a capa da banana ficam.
- **As histórias são o menu**, na ordem do app (`phoneTabs.js`): a abertura; Lado A, o que se faz — Start, Albums, Blend; «Flip the record»; Lado B, o que se guarda — Playlists, Inventory; o convite. Saem «Ranking» (entra em Albums), «Your shelf» (vira Inventory) e «Why whole albums».
- **A barra-menu**: uma fila contínua de barras, cinco partes iguais, uma por item; o fogo enche conforme a leitura; clicar num item leva à história dele. Três lugares, o eixo: **A** sob o topo (fio com paradas); **B** no próprio topo (o menu é a barra); **C** numa barra de baixo com agulha, igual no computador e no celular.
- **No celular** não há 3D, e as três viram a barra de baixo com os cinco rótulos (em C, com a agulha): no celular o eixo quase some.
- **Com conta**: o topo leva «Start» com o fogo; a primeira tela é «Back to the crate. Start a new series.» com «Start» e «Your playlists»; cada história ganha o link para a tela do app («Open Albums →»); o rodapé lista o menu.
- **Pausar**: um ícone discreto de 44 px no canto do palco.

## Fluxos

1. **Primeira leitura:** ligar o Discogs → «Update values» → acompanhar «Reading values… N of M» → ver o total e os cartões.
2. **Álbum novo:** o álbum entra no inventário → «N new albums are waiting for a value» → o valor aparece sozinho, ou «Read them now».
3. **Corrigir um valor:** abrir a janela → escrever o valor → «Save» → a etiqueta vira «Yours».
4. **Comprar:** abrir a janela → «Where to buy» → Discogs, Amazon ou iMusic.

5. **Página de entrada (F80):** chegar pela busca ou por um link à raiz `/` → ler o que é na primeira tela → (rolar pelas faixas do lado A, «Flip the record», o lado B) → «Open the app» leva ao Start do app (`/start`); «Sign in» leva ao app com a janela de entrar aberta (`/start?signin`). Quem entrou com conta e abre a raiz cai direto em `/start`; `/home` mostra a página a todos.

## Template → Épico

| Template | Épico |
|---|---|
| Inventário · Janela do álbum do inventário | EP-07 (inventário de álbuns) |
| O celular: moldura, Albums, janela do álbum, ranking, Playlists, Home, Blend, Inventário | EP-06 (usar o app no celular), estória S-58 |
| Página de entrada (F80, proposta) | EP-10 (levar o Album Blender às lojas e ao público), estória S-62 |

## Matriz de operações

| Objeto | Ver | Criar | Mudar | Apagar |
|---|---|---|---|---|
| Valor estimado de um item | cartão, janela | leitura do Discogs, ou à mão | à mão; «Read again» | «Use the Discogs value instead» tira o valor escrito à mão |
| Total do inventário | caixa do total | — | muda com a moeda e com o status dos itens | — |

## Estados

### Inventário

- **Discogs não ligado (não construído).** O protótipo mostrava o aviso «Values come from Discogs. Connect your Discogs account once to read them.», com «Connect Discogs». Não foi construído: a ligação com o Discogs é o token no servidor, que a pessoa não liga pela tela. O que existe no lugar é a fonte desligada, abaixo. ^inventory-value-not-connected
- **Fonte do Discogs desligada.** O servidor disse que a fonte está desligada (ou a pessoa é visitante, ou o servidor não respondeu): não há botão «Update values», aviso, valor nem menção ao Discogs; o cartão sem valor escrito diz «No value yet» e «—»; os totais somam só o que a pessoa escreveu; o rodapé não mostra a frase sobre a API do Discogs. A moeda, a ordem por valor e «Where to buy» seguem. ^inventory-value-source-off
- **Lendo os valores.** Aviso «Reading values… 86 of 211. You can keep using the inventory. This takes about 13 minutes for 211 albums.», com «Stop»; o botão «Update values» fica desabilitado e conta o progresso («Reading values… 86 of 211»); o cartão do álbum que está sendo lido diz «Reading…», e os que ainda esperam, «Waiting for a value». Cada cartão muda no lugar quando o seu valor chega. ^inventory-value-reading
- **Valores lidos.** Uma faixa sob o título, no lugar do «Total Owned», mostra «Estimated value of what I own:», «N of M owned albums have a value», «To buy the rest:» e «N of M albums have a value», com os quatro botões de moeda; fora do dólar, «Converted from USD at today's rate (1 USD = 5.89 BRL).»; com valor do Discogs em algum cartão, «Data provided by Discogs.», uma vez, com link. Cada cartão é uma superfície com cinco linhas iguais em todo cartão: «In my collection · worth» no que é dele, «Not mine yet · costs» no que falta; a origem («CD · Discogs», com «Discogs» levando à página da edição, ou «CD · written by you») e o valor («≈ $12.93»); as duas médias com os seus ícones; «Sell, trade or buy» ou «Where to buy»; e as ações: no que falta, «Discogs ↗ · Amazon ↗ · iMusic ↗»; no que é dele, «Sell» e «Trade» desligados e «Where to buy» abrindo a janela. ^inventory-value-read
- **Álbuns esperando valor.** Aviso «2 albums are waiting for a value. Reading them takes about a minute.», com «Read them now»; o cartão diz «Waiting for a value». Nada é lido sozinho: a leitura começa quando a pessoa aperta «Read them now» ou «Update values» (o protótipo dizia «They are read on their own, a few at a time, while the app is open.»; decidido pelo agente — revisável, porque o limite de pedidos é da conta do MJRP). ^inventory-value-waiting
- **O câmbio não chegou.** Sob os totais, «Exchange rates are not available: values are shown in USD.»; os botões EUR, GBP e BRL ficam desabilitados, com a mesma frase no `title`; os valores aparecem em dólar. Um valor lido numa moeda sem taxa aparece na própria moeda e não entra nos totais. ^inventory-value-rates-missing
- **A rodada terminou com falhas, ou parou.** Um aviso do app (toast) diz o que houve, por exemplo «Values read for 180 of 211 albums. 12 albums have no CD edition on Discogs. Discogs suggests no price for 4 albums. 15 albums could not be read: Discogs did not answer (10), Discogs limit reached (5).». Se parou: «Stopped by you after 86 of 211.», «Discogs refused the token of the app, so the reading stopped. The token on the server has to be replaced.», «Reading values needs you signed in with an account, so the reading stopped.», «The limit of requests was reached and asks for a long wait, so the reading stopped. Try again later.» ou «Discogs values were turned off on the server, so the reading stopped.». No cartão do álbum que falhou: «Discogs did not answer», «Discogs limit reached», «Discogs refused the token», «Sign in to read values» ou «The value could not be read», com «—». ^inventory-value-run-ended
- **O Discogs só sugere preço a conta com configurações de vendedor.** Um aviso, uma vez: «Discogs suggests prices only to accounts with seller settings filled in. Until then, the values here are the lowest price each CD is for sale at. Fill the settings in at discogs.com/settings/seller: the suggestions are tried again the next time values are read.», com link para `https://www.discogs.com/settings/seller`. O cartão diz «CD · Discogs · lowest for sale» e o valor com «≈»; a faixa dos totais acrescenta «Discogs values are lowest asking prices for now.»; o cartão da edição que ninguém vende diz «None for sale on Discogs now» e «—». ^inventory-value-seller-settings-missing

### Janela do álbum do inventário

- **Valor do Discogs.** «What this CD sells for on Discogs, by the condition of the disc. The value of the album is the mean of the three.»; «Mint», «Near Mint», «Very Good Plus» e «Mean of the three»; «Edition: Harvest 1984, Europe (CD), the most common CD edition on Discogs.» com «See it on Discogs»; «Read on 20 Nov 2026, 14:05.» (e «, converted from EUR at today's rate» quando a leitura veio noutra moeda) com «Read again»; «Data provided by Discogs.», com link para a página da edição; o campo «Write your own value». ^inventory-item-value-discogs
- **Valor escrito à mão.** «You wrote this value. Reading values from Discogs never changes it.», o valor com a etiqueta «Yours», o campo «Change it», «Written by you on 12 Oct 2026.» e «Use the Discogs value instead». Com a fonte desligada, a primeira frase é só «You wrote this value.» e o link é «Remove my value». ^inventory-item-value-yours
- **Sem valor ainda.** «No value was read for this album yet.», com «Read the value now» e o campo «Or write it yourself»; enquanto lê, «Reading the value from Discogs…» e o botão «Reading…» desabilitado. Com a fonte desligada: «No value was written for this album yet.» e o campo «Write the value yourself». Enquanto «Update values» roda, o botão de ler fica desabilitado, com o `title` «Update values is running: this album is read in its turn». ^inventory-item-value-none
- **Edição não achada.** «Discogs has no CD edition under this artist and title, so there is no value to read.», «No CD edition found on Discogs», o campo «Write the value yourself», «Looked for on 20 Nov 2026, 14:05.» e «Look again». («Pick an edition on Discogs», do protótipo, não foi construído: escolher a edição ficou fora desta iteração.) ^inventory-item-value-not-found
- **Edição sem sugestão de preço.** «Discogs has this CD edition and suggests no price for it, so there is no value to read.», «No price suggested on Discogs», a edição com «See it on Discogs», «Data provided by Discogs.», o campo «Write the value yourself» e «Look again». ^inventory-item-value-no-suggestion
- **Menor preço à venda.** «The lowest price this CD is for sale at on Discogs now. It is an asking price, not what the disc usually sells for.»; «Lowest price for sale on Discogs: $12.93 (37 for sale)»; a edição com «See it on Discogs»; «Read on 20 Nov 2026, 14:05.» com «Read again»; «Data provided by Discogs.», com link; «Discogs gives a suggestion by the condition of the disc (Mint, Near Mint, Very Good Plus) only to accounts with seller settings filled in.»; o campo «Write your own value». ^inventory-item-value-lowest-for-sale
- **Nenhum à venda.** «Nobody sells this CD edition on Discogs now, so there is no price to read.», «None for sale on Discogs now», a edição, «Data provided by Discogs.», o campo «Write the value yourself» e «Look again». ^inventory-item-value-none-for-sale
- **A leitura falhou.** O que houve e «The value was not read.»: «Discogs did not answer. The value was not read.», «Discogs limit reached. The value was not read.», «Discogs refused the token. The value was not read.», «Sign in to read values. The value was not read.» ou «The value could not be read. The value was not read.»; com «Try again» e o campo «Or write it yourself». O mesmo texto aparece num aviso do app. ^inventory-item-value-failed
- **Escrever um valor que não vale, ou que não grava.** Um texto que não é um número maior que zero: aviso «Write the value as a number above zero, for example 12.50.», e nada é gravado. A gravação que falha: «The value could not be saved. Your inventory is as it was.». Fora do dólar, sob o campo: «Written in BRL and kept in USD, at today's rate.». ^inventory-item-value-write-refused
- **Onde comprar.** «Where to buy», «Each link opens the store on this album, on CD. The app earns nothing from these links today.» e os três botões «Discogs ↗», «Amazon ↗», «iMusic ↗». ^inventory-item-where-to-buy

- **Filtrado por status.** Clicar numa contagem do topo («✓ 22 Owned», «182 Not Owned», «♡ 7 Wishlist») mostra só os álbuns daquele status e marca o botão; clicar de novo mostra todos. ^inventory-filtered-by-status-count

Estados que o protótipo não mostrava e que o texto acima passou a descrever (escritos pelo agente em 2026-11-20, à espera do julgamento do MJRP): a fonte desligada, o câmbio que não chega, a rodada que termina com falhas ou para, a edição sem sugestão de preço, a leitura que falha (o Discogs não respondeu, o limite foi atingido, o token foi recusado) e o valor escrito que não vale. No rodapé do app, com a fonte ligada: «This application uses Discogs' API but is not affiliated with, sponsored or endorsed by Discogs. 'Discogs' is a trademark of Zink Media, LLC.». ^inventory-value-states-added

### Página de entrada (F80, exploração)

Estados que as três direções da rodada 1 mostram (escritos pelo agente em 2026-11-20, à espera da escolha do MJRP; nenhum requisito aponta para eles ainda):

- **Página no ar, com movimento.** Título, a frase que diz o que o produto é, «Open the app» e «Sign in» na primeira tela; a imagem da direção se move (Brasa: o fogo e o equalizador; Lado A, lado B: o vinil gira e o fio acende com a rolagem; Caixote: as capas giram sozinhas três vezes, uma a cada 5 s, e param; a luz tremula, o equalizador respira). Um botão «Pause motion» (preso no canto no computador; sob as chamadas no celular) para todo movimento que não vem da rolagem. ^splash-default
- **Antes do script pesado.** O texto, as chamadas e uma imagem parada já aparecem; no Caixote é o leque de cinco capas em CSS, que some quando o 3D desenha o primeiro quadro. Nada do texto espera o script. ^splash-before-script
- **Sem WebGL, ou o three.js não carregou** (aparelho sem WebGL, contexto lento recusado, rede sem acesso ao CDN). O Caixote fica com o leque de capas em CSS, parado, sem os botões ‹ ›; as outras duas direções não usam WebGL e não mudam. ^splash-no-webgl
- **Movimento reduzido** (o sistema pede menos movimento). Brasa: o fogo desenha um quadro parado e o equalizador fica em alturas fixas; Lado A, lado B: o disco não gira, as seções não sobem, o fio mostra a faixa sem pulsar; Caixote: o 3D nem é baixado, fica o leque em CSS. A página continua inteira e acabada. ^splash-reduced-motion
- **Sem JavaScript.** Todo o texto, as chamadas e as imagens em CSS aparecem; somem o fogo e os equalizadores (Brasa; o cartão do momento 2 no Caixote), o fio do equalizador inteiro (Lado A, lado B: ele só aparece com JavaScript) e o 3D (Caixote); o botão «Pause motion» não aparece. ^splash-no-js
- **Movimento pausado.** Depois de «Pause motion», o botão diz «Play motion»; o fogo, os equalizadores, a luz e o giro automático param no quadro em que estavam; arrastar e os botões ‹ › do Caixote seguem funcionando. ^splash-motion-paused
- **No celular (até 767 px).** Uma coluna; as duas chamadas ocupam a largura, uma sobre a outra; no topo fica só «Open the app». Lado A, lado B e Caixote põem a imagem acima do título; a Brasa, o título primeiro. ^splash-phone
- **Caixote, um álbum na frente.** Sob o caixote, «‹ · nome do álbum · artista · ›»; um leitor de tela ouve o álbum («Lantern Hymnal by The Hollow Lanterns, fictional album, 3 of 9») só quando a pessoa gira; os giros automáticos não são anunciados. No canto do caixote, «Fictional albums · original art». ^splash-crate-album-in-front

#### Rodada 2 · Caixote v2 (`splash-crate-v2.html`)
Os estados da rodada 1 acima ficam como estão (nenhum requisito aponta para eles ainda; os IDs não mudam). Os da v2:
- **Primeira tela (lado A · 1).** Título, a frase «The Album Blender is a web app for people who listen to whole albums.» e as duas chamadas à esquerda; à direita o caixote com a capa da frente («In the Court of the Crimson King») e a legenda com «Listen on Apple Music»; o fogo forte; o fio com o primeiro grupo aceso. ^splash-v2-hero
- **Uma faixa do lado A tocando** (Series, Ranking, Blend, Your shelf). O disco da faixa sobe do caixote, os da frente se inclinam para a frente; a legenda troca para ele; o fio acende até essa faixa e o grupo dela respira; o fogo brando. ^splash-v2-track
- **Virando o disco.** Na seção «Flip the record» o caixote gira com a rolagem, de um lado ao outro; nenhum disco puxado; a meio do giro a rolagem pode parar e o caixote fica onde está. ^splash-v2-flip
- **Lado B.** O caixote mostra o outro lado (a capa da frente é «To Pimp a Butterfly»); B1 puxa «In the Aeroplane Over the Sea»; B2, o convite, com o fogo forte de novo e as duas chamadas. ^splash-v2-side-b
- **Antes do 3D, sem WebGL ou no celular.** O caixote em CSS com as mesmas capas: a da faixa sobe, as da frente se inclinam; no FLIP ele troca para o lado B sem girar. O 3D aparece por cima quando desenha o primeiro quadro (computador, com WebGL, sem pedido de menos movimento). ^splash-v2-css-crate
- **Movimento reduzido.** Sem three.js, sem animação: o caixote em CSS parado na faixa atual, o fogo num quadro parado, o equalizador em alturas fixas; nenhum botão «Pause motion». A página parece acabada. ^splash-v2-reduced-motion
- **O movimento que para sozinho.** Dez segundos depois de carregar ou da última rolagem, o fogo e o equalizador param num quadro; o 3D só desenha quando algo muda. «Pause motion» (no fim do fio no computador, sob as chamadas no celular) para tudo; vira «Play motion». ^splash-v2-motion-rest
- **Sem JavaScript.** Todo o texto e as chamadas; o caixote em CSS parado com as sete capas do lado A, a da frente à vista; o fio aparece sem nada aceso, rotulado na primeira faixa; os discos de cada faixa no celular não aparecem (a legenda e o link do disco da frente ficam). ^splash-v2-no-js
- **Celular (até 899 px).** Uma coluna; topo com o logotipo e «Sign in»; o caixote em CSS sob a primeira tela; cada faixa abre com o seu disco, a capa com o crédito e o link «Listen on Apple Music»; a barra de baixo presa leva o fio (só progresso) e «Open the app». ^splash-v2-phone

#### Rodada 3 · a home com o menu na barra (`splash-menu-{stops,bar,deck}-v1.html`, prévias)

- **Sem conta, primeira tela.** Topo com o logotipo, a barra-menu (em B, no próprio topo) e «Sign in» e «Open the app»; o título, a frase do que o produto é e as duas chamadas; a barra vazia, nenhum item atual. ^home-menu-out
- **Com conta, primeira tela.** Topo com o logotipo, a barra-menu e só «Start» com o fogo; «Welcome back», «Back to the crate. Start a new series.», «Start» e «Your playlists». É o que quem tem conta vê toda vez que abre o site. ^home-menu-in
- **Lendo uma história.** A parte da barra do item enche de fogo conforme a leitura avança; o item fica laranja com `aria-current="step"`, os já lidos em branco; o caixote puxa o disco da história e a legenda troca. ^home-menu-reading
- **Clicar num item.** A página rola até a história do item (`#start`, `#albums`, `#blend`, `#playlists`, `#inventory`); com conta, a história tem «Open <item> →», que abre a tela do app. ^home-menu-jump
- **Virando o disco.** Entre Blend e Playlists, o ⟲ acende e o caixote gira para o lado B. ^home-menu-flip
- **Celular (393).** Sem 3D; a barra-menu é a barra de baixo, presa, com os cinco rótulos de 12 px sob as barras (C mostra também a agulha), alvos de 72 × 56 px; o topo leva «Sign in» sem conta e «Start» com conta; o ícone de pausa de 44 px no canto do caixote. ^home-menu-phone
- **Movimento pausado ou reduzido.** O ícone alterna pausa e play (`aria-pressed`, nome «Pause motion» / «Play motion»); com movimento reduzido o ícone some e nada se move sozinho; a barra-menu continua enchendo com a rolagem, sem pulsar. ^home-menu-motion

## O celular (F76)

«Celular» é a tela de até 767 px de largura. O aparelho de referência é o iPhone 15 Pro (393x852 px). De 768 px para cima o app é o de sempre: nada abaixo muda o desenho do computador. Tudo o que o celular mostra foi decidido pelo agente e espera o juízo do MJRP no iPhone (TASK-09). Fonte: `docs/specs/features/F76-mobile-redesign/screens/` e `mobile-kit.md`; as medidas estão em `docs/specs/design-system.md` § Celular.

### Navegação no celular

- **Barra do topo** (48 px, fixa): o logotipo como enfeite, o nome da tela e um botão só: a inicial de quem está com conta, ou o ícone de menu («Menu and account»). O nome sai do endereço; uma série aberta dá o nome dela. A barra de computador e o rodapé ficam na página e são escondidos no celular.
- **Barra de baixo** (56 px, fixa, com a área segura): cinco destinos, cada um com ícone e rótulo; o atual é marcado em laranja e com `aria-current="page"`. Tocar no atual leva ao topo da tela.

| Destino | Endereço que abre | Fica marcado também em |
|---|---|---|
| Start (era Home, F85) | `/start` | `/start` |
| Albums | `/albums` | `/albums`, `/album-series`, `/series` |
| Blend | `/blend` | `/blend` |
| Playlists | `/saved-playlists` | `/saved-playlists`, `/playlist-series`, `/playlists` |
| Inventory | `/inventory` | `/inventory` |

- **Nome na barra do topo:** Start, Albums, Blend, «New Playlists» (`/playlists`), «Edit Playlists» (`/playlists/edit`), Playlists (`/saved-playlists`), Inventory; as telas «em breve» dizem «Series by Artist», «Series by Genre» e «Series by Track».
- **Menu** (folha de baixo, aberta pelo botão da barra do topo): a conta (ou «Sign In»); «New playlists» (as recém-geradas); «Series by artist», «Series by genre» e «Series by track», cada uma com «Soon»; a ligação com o Spotify; «Clear album cache», que pede confirmação («Clear the album cache?»); «Sign Out».
- **Voltar ao topo** («Back to top»): botão redondo de 44 px que aparece depois de duas telas de rolagem e some enquanto há janela aberta.
- **A gaveta ☰ e a barra do computador** só valem de 768 px para cima.

### As janelas no celular

- **Folha de baixo** (escolha curta, filtros, menu de ações, confirmação, entrar, exportar para o Spotify): alça, fecha por toque fora, arrastando para baixo, por Esc ou pelo botão de fechar de 44 px.
- **Folha de tela cheia** (ler ou editar: o álbum, o ranking, a edição da série e a do item do inventário): título inteiro, fechar sempre à vista, o corpo é a única parte que rola.
- **A página de trás fica presa** enquanto houver janela aberta, e volta ao mesmo lugar quando a última fecha.

### O que cada tela mostra no celular

**Albums** (`/albums`, `/albums?seriesId=…`), de cima para baixo: o cabeçalho da série (só numa série: nome inteiro, «⋯» e «Blend your Albums»); a busca com o botão «Filters» (com quantos filtros estão ligados) e as fichas dos filtros ligados, com «Clear all»; o pager de cima, uma linha; cada série com o cabeçalho preso sob a barra do topo; os álbuns em grade de duas colunas (capa, título, «artista · ano», selos, «⋯») ou em lista (uma linha por álbum); «Load N more albums»; o pager de baixo («Page n of m», «Series per page», Pages/Scroll).
- Abre como folha: **Filters** (View: Grid ou List; Sort series by; Series; Artist; Year; Source; «Reload albums from the sources»; «Clear filters» e «Show albums»), a **folha do álbum** (View album and tracks, Rank the tracks ou Edit my ranking, Add to inventory, Fetch the details again, Open in Spotify, See on BestEverAlbums, «Remove from this series») e a **folha da série** («Edit series», «Delete series»). Tocar no álbum abre a janela do álbum.

**Janela do álbum** (de Albums e do Inventário), tela cheia, uma rolagem só: a barra presa (o título aparece nela quando o do cabeçalho sai da vista; fechar à direita); o cabeçalho com a capa de 112 px, o título inteiro, o artista, o ano e o formato; as três fontes num controle de três rótulos curtos, «Original», «BEA» e «Spotify»; as faixas, cada uma com número, título, artista da faixa quando difere, as referências («BEA #4», «Spotify 61%») e a duração. Aberta pelo Inventário, antes das faixas vêm as notas, o valor e «Where to buy», cada um numa linha (o valor abre a seção inteira).

**Meu ranking** (tela cheia): a barra («‹ Back», «My ranking», «↶ Reset»); o álbum, o artista e a dica «Tap a track to move it with the buttons below, or drag it by its handle.»; as faixas (posição, título inteiro, «BEA #4 · Spotify #3 · 5:12», alça de arrastar); no pé, «Save ranking» sempre à vista e, com uma faixa escolhida, «Up», «Down», «Move to…» e «Done».
- Abre como folha: **«Move to…»** (os números de 1 a n) e **«Discard changes?»** (de baixo).

**Playlists recém-geradas** (`/playlists`): o nome do lote com Undo e Redo; as fichas, uma por playlist («n · Nome», «14 tracks · 58 min»); o cabeçalho da playlist aberta com o «⋯»; as faixas (posição que arrasta, título, artista · álbum, duração, «⋯»); a barra de ação com «Export» e «Save»; o painel «Reconfigure your Music Playlist Blend», fora da página enquanto fechado.
- Abre como folha: **faixa** (Move up, Move down, Move to the top, Move to the end, «Move to another playlist», «Remove from this playlist»), **playlist** (Rename, Reconfigure and regenerate, «Delete this playlist», que pede confirmação) e **Export** (Export to Spotify, Export to Apple Music, Download JSON).

**Playlists gravadas** (`/saved-playlists`): a busca com «Filters»; as fichas dos filtros ligados; a lista de séries, cada uma com as capas em cascata, o nome, «n batches · n playlists» e o «⋯», fechada por padrão; abertas, os lotes (nome legível, fatos, «⋯»); aberto o lote, as playlists (nome, «n tracks · duração»).
- Abre como folha: **Filters** (a mesma de Albums, com «Show series»), **série** (Add playlists, Open the album series, «Delete all playlists of this series»), **lote** (Edit batch, «Delete batch») e a **janela da playlist** com as faixas.

**Home** (`/home`): o campo do nome da série; o artista (Visual ou Bulk Paste), a busca e «Scan»; os seis filtros de tipo em duas colunas; a grade de capas em duas colunas; a barra de ação com as capas escolhidas, «N albums chosen» e «Create series».
- Abre como folha: **os escolhidos** (o nome da série, uma linha por álbum com ↑ ↓ ✕, «Create series») e, na edição de uma série, a janela de tela cheia com o nome, a lista dos álbuns e o seletor de álbuns, e «Cancel» e «Save Changes» no pé.

**Blend** (`/blend`): o título e a faixa dos quatro passos; o passo 1 com «Blend your Music by» e uma linha da série escolhida; as receitas em uma coluna; a duração; a barra de ação com a nota e «Blend it!».
- Abre como folha: **«Choose a series»** (tela cheia, com a busca «Search series»; um toque escolhe e fecha).

**Inventory** (`/inventory`): «N albums» e as três contagens de status como botões; os totais em duas linhas, a moeda e «Data provided by Discogs.»; os avisos dos valores; a barra presa (busca, «A–Z», «Filters», «⋯»); as linhas de 50 em 50 (capa, título, artista, valor com a origem, status, as duas médias, «⋯»); no fim, «Showing 50 of 211» e «Show 50 more».
- Abre como folha: **Status**, **«⋯» do álbum** (Open album, Edit, o valor, «Where to buy», «Remove from inventory»), **«Filters and order»**, **«Collection actions»**, **a folha do salto** («Jump to an artist» ou «Jump to a position») e **os valores** («About the values» ou «Why lowest asking prices?»); a edição do item é janela de tela cheia.

## Estados no celular

### Navegação

- **Moldura do celular.** Barra do topo com o nome da tela, barra de baixo com os cinco destinos e o atual marcado; nenhuma delas existe de 768 px para cima. ^phone-shell-bars
- **Menu aberto.** Folha de baixo «Menu» com a conta, «New playlists», os três «Soon», o Spotify, «Clear album cache» e «Sign Out» (este só com conta). «Clear album cache» abre a pergunta «Clear the album cache?» antes de limpar. ^phone-menu-open
- **Voltar ao topo.** Depois de duas telas de rolagem aparece «Back to top»; fica escondido com janela aberta. ^phone-back-to-top

### Albums

- **Albums no celular.** Busca, «Filters» e a grade de duas colunas; o primeiro álbum aparece acima da dobra (a capa termina em 436 px a 393x852). ^albums-phone-default
- **Folha de filtros aberta.** «Filters» (ou «Filters · 2 on»), com «Clear filters» e «Show albums» no pé; a folha segue as mudanças enquanto está aberta. ^albums-phone-filters-open
- **Com filtros ligados.** O botão «Filters» mostra quantos estão ligados; cada filtro vira uma ficha («Artist: Rush ✕») e, com dois ou mais, aparece «Clear all». ^albums-phone-filters-on
- **Em lista.** Uma linha por álbum: capa de 56 px, título, «artista · ano», selos e «⋯»; sem a tabela de faixas, que está na janela do álbum. ^albums-phone-list-view
- **Folha do álbum aberta.** Título do álbum e as ações com nome; «Remove from this series» por último, em vermelho, separado, e pede confirmação. ^albums-phone-album-sheet-open
- **Folha da série aberta.** «Edit series» e, em vermelho, «Delete series», que pede confirmação. ^albums-phone-series-sheet-open
- **Carregando.** Esqueleto da série em duas colunas. ^albums-phone-loading
- **Biblioteca vazia.** Ícone, uma frase e um botão, «Go to Start». ^albums-phone-empty
- **Série que falhou.** Aviso com «Try again». ^albums-phone-series-failed
- **Nenhum álbum nos filtros.** A frase do pager diz que nada combina; a lista fica vazia. ^albums-phone-no-match

### Janela do álbum e ranking

- **Janela do álbum no celular.** Tela cheia: capa de 112 px, título inteiro, as três fontes e as faixas; 8 faixas inteiras à vista a 393x852. ^album-window-phone-default
- **Janela rolada.** A barra fica opaca com o título do álbum e o fio de baixo. ^album-window-phone-scrolled
- **Janela aberta pelo Inventário.** O valor vira uma linha («Estimated value», «≈ $30.75 Discogs») que abre a seção inteira; «Where to buy» vira uma linha de três lojas. ^album-window-phone-inventory
- **Ranking no celular.** Barra, faixas com o título em linha própria, «Save ranking» sempre à vista; nenhuma faixa escolhida. ^ranking-phone-default
- **Faixa escolhida.** Anel laranja na faixa; no pé, «Up» (apagado na primeira), «Down» (apagado na última), «Move to…» e «Done». Um leitor de tela ouve «Money is now number 3». ^ranking-phone-track-chosen
- **«Move to…» aberta.** Folha de baixo com os números de 1 a n; o lugar atual vem marcado e apagado. ^ranking-phone-move-to-open
- **Depois de «Reset».** O aviso «Back to the order of the album.» com «Undo» por 5 s. ^ranking-phone-reset-undo
- **«Discard changes?».** Com a ordem mudada e não salva, «Back» ou Esc abrem a folha «Your new order has not been saved.» com «Keep editing» e «Discard». Sem mudança, sai direto. ^ranking-phone-discard-open
- **Ranking gravado.** O aviso «Ranking saved!» e a janela fecha em meio segundo. ^ranking-phone-saved

### Playlists

- **Playlists novas no celular.** Nome do lote com Undo e Redo, fichas, uma playlist aberta por vez, faixas e a barra de ação «Export» e «Save». ^playlists-phone-default
- **Sem playlists.** O estado vazio de sempre, que leva ao Blend; sem fichas e sem barra de ação. ^playlists-phone-empty
- **Folha da faixa aberta.** As quatro formas de mover, «Move to another playlist» e «Remove from this playlist» em vermelho. ^playlists-phone-track-sheet-open
- **Faixa removida ou movida.** Aviso de baixo «Removed "…" · Undo» (ou «Moved "…" to number 2 · Undo»), por 6 s, acima da barra de ação; a linha onde a faixa caiu acende por 1,2 s. ^playlists-phone-track-removed
- **Folha da playlist aberta.** «Rename», «Reconfigure and regenerate» e «Delete this playlist», que pede confirmação. ^playlists-phone-playlist-sheet-open
- **Folha de exportar aberta.** «Export to Spotify», «Export to Apple Music» e «Download JSON». ^playlists-phone-export-open
- **Gravadas no celular.** Busca com «Filters», séries fechadas por padrão, cada uma com o resumo na linha. ^saved-playlists-phone-default
- **Folha de filtros das gravadas.** A mesma de Albums, com «Show series». ^saved-playlists-phone-filters-open
- **Série aberta.** Os lotes aparecem com nome legível; a tela lembra quais séries estavam abertas depois de uma atualização da lista. ^saved-playlists-phone-series-open
- **Folha da série gravada.** «Add playlists», «Open the album series» e, em vermelho, «Delete all playlists of this series» (pede confirmação). ^saved-playlists-phone-series-sheet-open
- **Folha do lote.** «Edit batch» e, em vermelho, «Delete batch» (pede confirmação); um nome reescrito mostra o nome salvo inteiro. ^saved-playlists-phone-batch-sheet-open

### Home e Blend

- **Home no celular.** Campo do nome, filtros em duas colunas, grade de duas colunas e a barra de ação «No albums chosen · Pick albums to start» com «Create series» apagado. ^home-phone-default
- **Álbum escolhido.** Anel laranja e o número de ordem na capa; um segundo toque o tira; a barra diz «N albums chosen · Tap to review». ^home-phone-album-chosen
- **Folha dos escolhidos aberta.** «N albums chosen», o nome da série, uma linha por álbum com ↑ ↓ ✕ e «Create series»; ao remover, «Removed «X» · Undo». ^home-phone-chosen-sheet-open
- **Nome faltando.** Com o campo do nome vazio, «Create series» não cria: abre a folha, diz «Give the series a name first.» e põe o cursor no campo. ^home-phone-name-required
- **Criando.** O botão da barra diz «Creating…», apagado. ^home-phone-creating
- **Edição da série.** Janela de tela cheia com «Cancel» e «Save Changes» no pé; a lista dos álbuns flui no corpo, com ↑ ↓ ✕ em cada linha; remover aqui não tem «Undo» (nada é gravado até «Save Changes»). ^series-edit-phone-default
- **Blend sem série.** Passo 1 com «Choose a series» e a contagem de séries; «Blend it!» apagado, com «Step 1 of 4: choose a series». ^blend-phone-step1-empty
- **Folha «Choose a series» aberta.** Tela cheia com a busca, «n of 49 series» e uma linha por série; um toque escolhe e fecha. ^blend-phone-series-sheet-open
- **Pronto para misturar.** Série e receita escolhidas: a nota diz «receita · 60 min» e «Blend it!» está ativo; sem receita, «Step 2 of 4: choose a recipe». ^blend-phone-ready
- **Misturando.** O botão da barra diz «Blending…», apagado. ^blend-phone-blending

### Inventário

- **Inventário no celular.** Contagem e fichas de status, os totais em duas linhas, a barra presa e as linhas de 102 px, 50 por vez. ^inventory-phone-default
- **Carregando.** Seis linhas-fantasma do tamanho das de verdade. ^inventory-phone-loading
- **Inventário vazio.** «Your collection is empty», a frase do que o enche e um botão, «Add the albums of my series». ^inventory-phone-empty
- **Filtrado a nada.** «No albums match» e «Clear search and filters». ^inventory-phone-no-match
- **Mais linhas.** No fim, «Showing 50 of 211» e «Show 50 more» (no último bloco, o número que falta); a página não se mexe e o foco vai à primeira linha nova. ^inventory-phone-show-more
- **Folha Status aberta.** «Owned», «Not Owned» e «Wishlist» em linhas de 48 px; só o ✓ da direita marca o atual. ^inventory-phone-status-sheet-open
- **Folha do «⋯» aberta.** Título do álbum, «Open album», «Edit», o valor, «Where to buy», «Sell» e «Trade» desligados e, em vermelho, «Remove from inventory», que abre a confirmação de sempre. ^inventory-phone-item-sheet-open
- **Folha «Filters and order» aberta.** O formato (All, CD, Vinyl, Digital) e as dez ordens, aplicados na hora; o rodapé diz «Show N albums». ^inventory-phone-filters-open
- **Folha «Collection actions» aberta.** «Add the albums of my series», «Update ratings» e, com a fonte do Discogs ligada, «Update values», cada um com o que faz. ^inventory-phone-actions-open
- **Folha do salto aberta.** Na ordem por artista, as letras («S: 12 albums»); em outra ordem, trechos de 25 posições. Saltar desenha os blocos até lá. ^inventory-phone-jump-open
- **Folha dos valores aberta.** «About the values» (ou «Why lowest asking prices?» quando a conta não tem as configurações de vendedor): cada total com «n of m albums have a value», a taxa de câmbio e o crédito do Discogs. ^inventory-phone-values-sheet-open
- **Uma ação em andamento.** Sob a barra presa, uma linha diz o que roda («Reading ratings… 40 of 211»; nos valores, com «Stop»). ^inventory-phone-working

## Content Map

| Elemento | O que diz | Como ler | Referência ao lado |
|---|---|---|---|
| «Estimated value of what I own» | a soma do valor dos álbuns «Owned» | uma estimativa, não uma avaliação | «N of M owned albums have a value» |
| «To buy the rest» | a soma do valor dos «Not Owned» e «Wishlist» | quanto custaria comprar o que falta | «N of M albums have a value» |
| moeda | USD, EUR, GBP, BRL | o valor é guardado em dólar e convertido | «Converted from USD at today's rate (1 USD = 5.89 BRL).» |
| três estados e a média | o que o CD vende no Discogs por estado do disco | o valor do álbum é a média dos três | a edição usada e a data da leitura |
| etiqueta «Discogs» / «Yours» | de onde o valor veio | «Yours» nunca é trocado por uma leitura | — |
| «Where to buy» | três links de busca | abrem a loja no álbum, em CD | «The app earns nothing from these links today.» |

### Página de entrada (F80, exploração)

| Elemento | O que diz | Como ler | Referência ao lado |
|---|---|---|---|
| título e subtítulo | o que o produto é, para quem, e os três gestos (série, ranking, mistura) | o subtítulo começa pelo nome do produto: é a definição que buscador e assistente leem | — (sem número) |
| os três momentos | o que a pessoa faz em cada etapa | na ordem do uso | — |
| exemplo de faixas ordenadas | um álbum fictício, quatro faixas, uma barra por faixa | «Bar length = the track's place in the ranking you choose.» | «Illustrative · fictional album» e «Example data, not real scores.» |
| aviso das capas | as capas e os discos da página são inventados | — | «original artwork made for this page» |
| legenda do disco (v2) | o disco puxado: título, artista, ano | «Artwork from Apple Music» | «Listen on Apple Music», que abre o álbum no Apple Music |
| fio (v2) | a faixa em que a pessoa está, «Side A · 2 — Series» | um grupo de barras por faixa; aceso até onde a pessoa leu | — |
| crédito das capas (v2) | as capas vêm do Apple Music e são dos artistas e gravadoras; a linha de marca da Apple | — | o link de cada disco mostrado inteiro |

## Decisões de IA

- Dois números por item, não um: o que a pessoa pagou e o que o álbum vale (proposta da rodada 1, à espera do MJRP).
- O total separa «o que tenho» de «o que falta comprar» (proposta da rodada 1, à espera do MJRP).
- O cartão é o nível «Transformar», com «Where to buy» em links (escolha do MJRP em 2026-11-20; os outros dois níveis ficam em `design/proposals/inventory-card-proposal.html`).
- **O cartão é uma superfície** (escolha do MJRP em 2026-11-20 01:20: «a v5.1 é minha preferida tb!»): fundo próprio, borda bem fraca, a capa indo até as bordas do cartão; o bloco de valor não tem caixa própria. A alternativa recusada, a v5, usava uma borda em volta do cartão no lugar do fundo. Consequência a decidir: os cartões da tela de séries não têm fundo; para as duas telas terem o mesmo cartão, o das séries segue este depois.
- Antes da v5.1, a v4 e a v5 usaram uma borda em volta do cartão inteiro para ligar a capa, o título e o bloco de valor (pedido do MJRP em 2026-11-20: «a borda conectando a capa com as infos»; era a opção B de `design/proposals/inventory-card-border-proposal.html`).
- **O padrão das seções do cartão** (pedido do MJRP em 2026-11-20: «deveríamos ter um padrao e alinhamento entre seções»): todo cartão tem as mesmas seções, cada uma com o mesmo número de linhas, na mesma ordem: (1) o rótulo do valor, uma linha; (2) a origem à esquerda e o valor à direita, uma linha; (3) as duas médias, uma linha; (4) o rótulo das ações, uma linha; (5) as ações como links, uma linha. Nenhum texto dessas seções quebra de linha: o que não cabe é cortado com reticências e fica inteiro no `title`. Assim os cartões de uma fileira têm a mesma altura e as seções ficam alinhadas entre vizinhos.
- As contagens por status viram o filtro, e o seletor de status sai da barra; os seletores que ficam são o de formato e o de ordem (decisão do MJRP em 2026-11-20).

- **Página de entrada (F80), rodada 1:** as três direções têm a mesma ordem, os mesmos três momentos, a mesma prova e as mesmas chamadas, e diferem no eixo «quanto 3D, e de onde vem a profundidade»; o título, o subtítulo e o fecho acompanham a imagem (segundo eixo, declarado depois da crítica de UX; decidido pelo agente). O texto é proposta (`design/proposals/2026-11-20-splash-copy-proposal.md`).
- **Página de entrada:** o texto inteiro fica no HTML e a primeira tela diz o que o produto é antes de qualquer imagem (candidato de GEO e AEO do PRD; NN/g, rolagem e atenção).
- **Página de entrada:** capas fictícias, desenhadas na página (gradientes e tipo nas cores da marca), nenhuma capa real; os direitos das capas para uma página pública são pergunta ao MJRP.
- **Página de entrada, rodada 2 (2026-11-20):** o MJRP escolheu capas reais, as do Apple Music que o app já mostra, com crédito e link; a v2 as usa. Os termos da Apple pesquisados nesta rodada só preveem a capa junto da reprodução ou da playlist e pedem autorização dos donos dos direitos para marketing: **a confirmar antes de publicar** (`design/proposals/f80-splash/proposal.md` § Rodada 2).
- **Página de entrada, rodada 2:** cada elemento visual tem um trabalho (caixote = palco, rolagem = disco, fio = progresso e navegação, fogo = luz); os botões ‹ ›, o arrastar, o giro automático, o vinil e o equalizador 3D da v1 saíram para dar lugar à progressão (decisão do agente, a julgar pelo MJRP).
- **Página de entrada, rodada 3 (2026-11-21):** o menu do app vira o índice da página, e as histórias seguem os rótulos do celular (Start, Albums, Blend, Playlists, Inventory), os mais curtos do app; o Lado A é o que se faz e o Lado B o que se guarda (decisão do agente, a julgar pelo MJRP). Pausar é um ícone (o MJRP: «nao sabia da acessabilidade, coloque um icone discreto entao»). Com conta, a home é a casa de quem volta (o MJRP: «conta aberta sempre home qdo vc acessa o link principal do site, aí vc teria o botao para start»). Em aberto para ele: clicar num item, com conta, leva à história ou à tela do app.

## Protótipos aprovados

A rodada 1 da F75 é de exploração (nenhum protótipo dela aprovado).

### Página de entrada (F80) v2 — Caixote v2, o fogo e o fio
- Ferramenta: HTML à mão, gerado por `design/proposals/f80-splash/build/build_v2.py` · Referência: comparador https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e · Cópia: design/inception/splash-crate-v2.html
- reference_kind:: live
- reference_path:: design/inception/splash-crate-v2.html
- Níveis propostos (MP-01): eixo "quanto 3D, e de onde vem a profundidade" · Consolidar (Brasa) / Elevar (Lado A, lado B) / Transformar (Caixote) · escolhido: Transformar, com a progressão do Elevar e o fogo do Consolidar (pedido do MJRP de 2026-11-20 19:49)
- Auditoria: reports/audits/2026-11-20-f80-splash-round2-ux-audit.md — veredito: passa, sem P0 (2026-11-20 20:10)
- Aprovado por: MJRP em 2026-11-20 22:15
- Palavras do humano: «aprovado a home v2, fogo vivo na página de entrada, ficou sensacional! bora implementar» e, logo depois, «fogo brando na verdade»
- Como foi entendido: aprovada para construir a página de entrada «Caixote v2» (`design/inception/splash-crate-v2.html`) na prévia **fogo brando** (`?fire=soft`, o padrão do protótipo): a segunda mensagem corrige a primeira só no fogo. Cobre a página nas duas larguras (computador e celular até 899 px) e os nove estados abaixo. A «home v2» da mesma frase é a Home da F79 (registro dela, à parte).
- Ressalvas: o fogo vivo (`?fire=bright`) fica de fora, pela correção dele. Ele não respondeu, e seguem abertos: as capas reais em público (os termos da Apple — a página é construída com as capas num arquivo trocável, o padrão fictício); o texto em inglês (proposta do agente, não copy deck); o texto preto no botão de fogo (fica como o protótipo mostra, decidido pelo agente — revisável); onde a página mora (a raiz só para quem não entrou, decidido pelo agente — revisável).
- shows:: [[#^splash-v2-hero]], [[#^splash-v2-track]], [[#^splash-v2-flip]], [[#^splash-v2-side-b]], [[#^splash-v2-css-crate]], [[#^splash-v2-reduced-motion]], [[#^splash-v2-motion-rest]], [[#^splash-v2-no-js]], [[#^splash-v2-phone]]
- Mudou em relação à versão anterior: primeira versão aprovada da página de entrada (a v1 e as outras direções da rodada 1 ficam como registro, não aprovadas)

### Home (F79) · Transformar v2
- Ferramenta: HTML gerado (`design/proposals/f79-home/build/build.py --round2`, a Home real capturada mais `core-v2.js`, `transformar-v2.js` e `transformar-v2.css`) · Referência: comparador https://claude.ai/artifact/AsiVV2i3595LqpLEadm61h · Cópia: design/inception/home-transformar-v2.html
- reference_kind:: live
- reference_path:: design/inception/home-transformar-v2.html
- Níveis propostos (MP-01): eixo "a ambição" · Consolidar / Elevar / Transformar · escolhido: Transformar (MJRP, 2026-11-20 19:19, «home 3 niveis transformar»); a rodada 2 é a versão nova do Transformar
- Auditoria: reports/audits/2026-11-20-F79-home-r2-ux-audit.md — veredito: passa (2026-11-20 19:47), 0 P0, os 6 P1 consertados na rodada
- Aprovado por: MJRP em 2026-11-20, por volta das 22:15 (registrado às 22:27)
- Palavras do humano: «aprovado a home v2, fogo vivo na página de entrada, ficou sensacional! bora implementar»
- Como foi entendido: aprova o protótipo `design/inception/home-transformar-v2.html` («Transformar · v2», a versão nova no comparador) como a referência julgada da F79, nas duas larguras (1280 e 393), com os 18 estados do seletor listados em `shows::` abaixo; «bora implementar» pede a construção. «fogo vivo na página de entrada» é da F80 (corrigido por ele logo depois: «fogo brando na verdade») e não toca este registro.
- Ressalvas: nenhuma dita por ele. **O que ele não respondeu, decidido pelo agente — revisável (dispensa de 2026-11-19):** a cor A (o degradê declarado `#f97316 → #dc2626`, sem a terceira parada; a prévia B não foi escolhida e fica fora); os padrões D1 a D9 como a v2 mostra; «Compendiums» mantido; o texto sobre o fogo como a v2 mostra (branco a 19 px, peso 800); o texto em inglês é proposta do agente, não copy deck. Arrastar para mudar a ordem fica fora (↑ ↓ basta).
- shows:: [[#^home-empty]], [[#^home-typing]], [[#^home-searching]], [[#^home-discography]], [[#^home-dock-one]], [[#^home-albums-chosen]], [[#^home-dock-many]], [[#^home-dock-reorder]], [[#^home-dock-removed-undo]], [[#^home-paste-list]], [[#^home-paste-report]], [[#^home-artist-not-found]], [[#^home-catalog-error]], [[#^home-name-missing]], [[#^home-creating]], [[#^home-created]], [[#^home-create-failed]], [[#^home-guest]]
- Mudou em relação à versão anterior: primeira versão aprovada da Home. Nenhum requisito apontava para os estados da Home antes deste registro; a S-61 passa a apontar (Pronto para construir).

## Inventário do protótipo

Fonte: `design/inception/inventory-value-v5.1.html`, escolhida pelo MJRP em 2026-11-20 01:20 entre ela e a v5 (a v5, com borda no lugar do fundo, fica como registro) (a tela real do inventário, capturada como o app a desenha, com o que a F75 propõe; as versões anteriores ficam para comparar) · wireframes: `design/wireframes/inventory-value-v5.1-inventory.png`, `design/wireframes/inventory-value-v5.1-album-window.png` · prévia de como o cartão se segura: `design/proposals/inventory-card-border-proposal.html` · prévia do cartão em três níveis: `design/proposals/inventory-card-proposal.html` · comparador: https://claude.ai/artifact/R6r5dLJ48JXJZDSRy6T5Ck (Artifact do Claude, privado; a cópia local é `design/proposals/inventory/comparator.html`).

| ID | O que a tela mostra | Função do produto | Destino |
|---|---|---|---|
| INV-V1 | Caixa «Estimated value of what I own», com a contagem | informar | S-57 |
| INV-V2 | «To buy the rest», com a contagem | ajudar a decidir | S-57 |
| INV-V3 | Seletor de moeda e a taxa usada | informar | S-57 |
| INV-V4 | Bloco do cartão: o que o valor é conforme o status («In my collection · worth about» ou «Not mine yet · costs about»), o valor, a origem, as duas médias | informar | S-57 |
| INV-V5 | Botão «Update values» e o aviso de leitura | agir | S-57 |
| INV-V6 | Aviso «N new albums are waiting for a value» | informar, agir | S-57 |
| INV-V7 | «Sort by»: «Value (↓)», «Value (↑)» | ajudar a decidir | S-57 |
| INV-V8 | Janela: três estados e a média, a edição, a data | informar | S-57 |
| INV-V9 | Janela: campo para escrever o valor | agir | S-57 |
| INV-V10 | «Where to buy», três links: no cartão do que não é dele, e na janela | agir | S-57 |
| INV-V11 | Aviso «Connect Discogs» | agir | S-57 |
| INV-V12 | As contagens por status como botões que filtram; o seletor de status sai da barra | agir | S-57 (decisão do MJRP na rodada 3) |
| INV-V14 | No cartão do que é dele: «Where to buy», que abre a janela do álbum, onde estão os links | agir | S-57 (pedido do MJRP na rodada 4) |
| INV-V13 | No cartão do que é dele: «Sell» e «Trade», apagados, com «not in the app yet» | informar | candidato «rede de colecionadores» do PRD; sem requisito ainda |

## A Home (F79) · rodada 1 de desenho

Rodada de desenho pedida pelo MJRP em 2026-11-20 (estória S-61): três níveis de ambição para a mesma tela, num eixo só, **a ambição** — Consolidar (a mesma estrutura, limpa), Elevar (o sistema evoluído) e Transformar (uma abordagem nova, ainda deste produto) —, ao lado da tela de hoje, «Referência». **Nenhum foi escolhido**: esta seção descreve os três e o que eles têm em comum; o que é de um nível só diz qual. O texto da tela é proposta do agente (`design/proposals/2026-11-20-home-copy-proposal.md`), não do copy deck.

> **Rodada 2 (2026-11-20), a direção escolhida: Transformar.** O MJRP escolheu em 2026-11-20 19:19 («home 3 niveis transformar»): escolha de direção, não a aprovação. A rodada 2 desenha só o Transformar, numa versão nova: `design/inception/home-transformar-v2.html` (a v1 fica intacta) · prévias da cor `#fdba74`: `design/proposals/f79-home/previews/home-transformar-v2-flame-2stops.html` (A, sem) e `-flame-3stops.html` (B, com) · comparador no mesmo endereço · wireframes: `design/wireframes/home-transformar-v2-desktop.png` e `-phone.png` · a proposta: `design/proposals/f79-home/proposal.md` § Rodada 2. **Daqui para baixo, os estados, o inventário e o Content Map descrevem o Transformar v2**; o que é só da rodada 1 diz «rodada 1». Consolidar e Elevar ficam como registro (o template acima e o inventário).

Protótipos: `design/inception/home-consolidar-v1.html`, `design/inception/home-elevar-v1.html`, `design/inception/home-transformar-v1.html` · Referência: `design/proposals/f79-home/reference.html` · comparador: https://claude.ai/artifact/AsiVV2i3595LqpLEadm61h (Artifact do Claude, privado; a cópia local é `design/proposals/f79-home/comparator.html`) · a proposta: `design/proposals/f79-home/proposal.md` · wireframes: `design/wireframes/home-<nível>-v1-desktop.png` e `-phone.png`. Os três são a tela real da Home capturada no site local (o HTML e os estilos do app, a busca «Pink Floyd» com as capas de verdade), com o que cada nível muda.

### Template da Home (proposto)

| Zona | Consolidar | Elevar | Transformar |
|---|---|---|---|
| O que é a tela | título «Build a series» e a frase da série no topo do painel da esquerda | a frase da série na bandeja (computador) ou no topo (celular) | título grande com o degradê «flame» e a frase da série, só antes da primeira busca |
| Achar álbuns | painel «02 // Find albums», «By artist» / «Paste a list» | cartão de busca com seletor de dois botões, acima da discografia | um campo só, no centro, que aceita artista ou lista; o equalizador vivo embaixo |
| A discografia | à direita, como hoje | à direita, com o nome do artista grande, os tipos em fichas e as capas numeradas ao escolher | o palco inteiro, seis colunas, capas numeradas |
| A série | lista «03 // Your series» à esquerda, como hoje | bandeja à esquerda: nome, contagem com equalizador, linhas com ↑ ↓ ✕, «Create series» | a «base» presa embaixo: pilha de capas, nome escrito no lugar, «Create series» |
| No celular | a tela da F76 com o texto novo, a faixa de filtros sem flutuar (N1) e o nome na barra (N10) | busca em cima, fichas em três colunas, a barra de ação com nome e capas que abre a bandeja como folha | o mesmo palco numa coluna; a base vira a barra acima das abas |

### Estados da Home (F79)

Desde a rodada 2, os estados do **Transformar v2**, no computador (1280 px) e no celular (393 px); cada um está no seletor do protótipo e do comparador. Os IDs da rodada 1 ficam (nenhum requisito aponta para eles ainda); o texto de cada linha mudou para a direção escolhida. No celular, a base da série **é** a barra de ação da F76 (`.phone-action-bar`), e a série abre na folha `full`: valem também os estados `^home-phone-*` da seção «Home e Blend» acima, com o texto novo.

- **Primeira visita, nada buscado.** O título «Pick the albums. We blend the playlists.» (a segunda linha com o fogo), a frase do que é uma série e para que serve, o campo único com «Search» (o único botão com o fogo), os três passos; a base vazia embaixo: «Your series is empty», «Search an artist, then click a cover to add it. You name the series at the end.» (no celular, uma linha: «No albums yet · Search, then tap a cover») e «Create series» apagado com «Add one album to create the series». O equalizador parado. ^home-empty
- **Buscando um artista.** «Searching…» no botão, ocupado; «Looking for «Pink Floyd» in the catalog… the covers appear as soon as it answers.»; capas vazias piscando; o equalizador em movimento (esperando a resposta); com menos movimento, parado e as palavras dizem. ^home-searching
- **Discografia na tela.** O artista grande, «17 studio albums · newest first», as fichas de tipo com a contagem (Studio, EPs, Singles, Live, **Compendiums**, Other), «Add all 17 studio albums» e a grade de seis colunas (duas no celular); cada capa com «+». ^home-discography
- **Vários álbuns escolhidos.** Cada capa escolhida com o anel e o número da ordem; a base com as capas numeradas, o nome sugerido «Pink Floyd selection» (texto de verdade, com «suggested · edit it»), «4 albums from 1 artist · the order counts», «Edit order» e «Create series» com o fogo; embaixo, «Next: the Blend turns the series into playlists.». No celular, a barra: a capa com a contagem, o nome com reticências, «Tap to edit or reorder» e «Create series». ^home-albums-chosen
- **Colando uma lista.** O campo vira a lista: cada linha numerada, «ready» em verde ou «add « - » between artist and album» na linha marcada; «4 lines: 3 ready, 1 to fix. Lines to fix are skipped; the rest go in.» e «Add 3 albums». ^home-paste-list
- **O catálogo não respondeu.** «The catalog did not answer in 15 seconds.», «Your series still has its 4 albums. Try again in a moment.» e «Try again»; o equalizador cai (barras baixas): a resposta não veio. A base continua com a série. ^home-catalog-error
- **Artista não encontrado.** «No albums found for «nome».», «Check the spelling, or paste the albums as a list: one per line, Artist - Album.» e «Paste a list». ^home-artist-not-found
- **Digitando um artista.** O campo com o foco (borda laranja) e o texto pela metade; a ajuda muda para «Press Enter or Search to see their albums. A list with one album per line works too.». Sem sugestões automáticas (o app não tem). ^home-typing
- **Um álbum escolhido.** A primeira capa numerada «1»; a base com uma capa, o nome sugerido e «1 album from 1 artist · the order counts»; «Create series» já ativo: um álbum basta. ^home-dock-one
- **Muitos álbuns (13).** A base mostra as sete primeiras capas e «+6» (no celular, uma capa e a contagem), o nome editado com reticências; depois de «Add all», a faixa «Added 13 albums. Undo». ^home-dock-many
- **Mudando a ordem.** «Edit order» abre o painel acima da base (no celular, a folha `full` com o nome no topo e «Create series» no pé): «Your series · 4 albums», «The order counts: the Blend reads the albums in this order when it spreads their tracks over the playlists. Use ↑ ↓ to change it.» e uma linha por álbum com o número, a capa, o título e o ano, e ↑ ↓ ✕ de 44 px; a linha movida fica marcada («moved up»); ↑ do primeiro e ↓ do último apagados. ^home-dock-reorder
- **Removido, com Undo.** Depois de ✕ (ou de tocar de novo numa capa escolhida), a linha sai, os números se refazem e a faixa «Removed «Pink Floyd at Pompeii…». Undo» fica 8 segundos acima da base (no celular, no pé da folha). ^home-dock-removed-undo
- **Lista adicionada, uma linha pulada.** «Added 2 albums. 1 line was skipped and is still here to fix.»; a linha que ficou diz o motivo («not found in the catalog: fix the spelling here») e vira um campo para corrigir ali mesmo; «Add this line» manda o que estiver nele; os dois álbuns da lista estão na base, com o nome sugerido «Joni Mitchell and Yes» e «2 albums from 2 artists». ^home-paste-report
- **Nome faltando ao criar.** Com o nome apagado, «Create series» não cria: o campo fica com o filete vermelho, «Give the series a name first.» e «Use «Pink Floyd selection»»; no celular abre a folha com o cursor no nome (como `^home-phone-name-required`). Nunca «New Album Series» em silêncio. ^home-name-missing
- **Criando.** «Creating…» apagado e ocupado; na base, o equalizador pequeno em movimento e «Saving your series…». ^home-creating
- **Criada: o que vem depois.** A base diz «✓ «Pink Floyd selection» is saved» e «4 albums · find it any time in Music Series.», com «Blend it now» (o fogo, abre o Blend com a série escolhida, `/blend?seriesId=`) e «Open the series» (o que acontece hoje, `/albums/<id>`); «Start another series» limpa a base (no celular, só o nome, «Open the series» e «Blend it now», numa linha). As capas perdem os números, e uma faixa verde acima delas diz ««Pink Floyd selection» is saved and won't change here. Click a cover to start another series.»: um clique começa outra série, a gravada não muda. ^home-created
- **Não deu para gravar.** «The series was not saved: the connection dropped. Your albums are still here.» e o botão vira «Try again». ^home-create-failed
- **Visitante (sem conta).** A mesma tela, com uma linha na base: «You're not signed in: the series is saved to this browser only. Sign in to keep it on every device.» (o app entra como visitante anônimo, `services/AuthService.js` linha 58); a barra do topo mostra «Sign In»; no celular o aviso fica sob o campo, fora da barra de ação. ^home-guest

### Inventário do protótipo · Home (F79)

Fonte: os três protótipos acima; cada item tem a mesma etiqueta nos wireframes dos três níveis (o nível que não tem o item diz «—»). O destino de cada item é proposta do agente; o MJRP decide.

| ID | O que a tela mostra | Consolidar | Elevar | Transformar | Função do produto | Destino |
|---|---|---|---|---|---|---|
| HOME-01 | O que é uma série e para que serve, numa frase | sim | sim | sim | informar | S-61 |
| HOME-02 | O nome da série | primeiro passo | na bandeja, sugerido pelo artista | na base, depois de escolher | agir | S-61 |
| HOME-03 | Os dois jeitos de achar álbuns: por artista, lista colada | dois botões | seletor | um campo e um link | agir | S-61 |
| HOME-04 | Campo do artista e «Scan» | sim | sim | «Search» | agir | S-61 |
| HOME-05 | A lista colada, com a linha que não entra | aviso depois | cada linha marcada ao digitar | idem, no campo único | agir | S-61 |
| HOME-06 | Filtros por tipo, com a contagem | sim | fichas | fichas | ajudar a decidir | S-61 |
| HOME-07 | A grade de capas da discografia | sim | capas numeradas | capas numeradas | agir | S-61 |
| HOME-08 | O artista achado, ou o que a busca está fazendo | linha de status | título do artista | título do artista | informar | S-61 |
| HOME-09 | A série sendo montada | lista à esquerda | bandeja | base presa embaixo | informar | S-61 |
| HOME-10 | Quantos álbuns a série tem | sim | com o equalizador | sim | informar | S-61 |
| HOME-11 | «Create series» | sim | sim | sim | agir | S-61 |
| HOME-12 | O próximo passo, ou por que o botão está apagado | sim | sim | sim | informar | S-61 |
| HOME-13 | O vazio que aponta a ação | sim | sim | os três passos | informar | S-61 |
| HOME-14 | Erro e «não encontrado», com o que ainda vale | sim | sim | sim | informar | S-61 |
| HOME-15 | Os três passos, acesos como um equalizador | — | sim | — | informar | S-61 |
| HOME-16 | O equalizador vivo sob a busca | — | — | sim | informar (identidade) | S-61 |
| HOME-17 | A barra de ação do celular | a da F76, com o nome | com nome e capas | a base | agir | S-58 (F76) e S-61 |
| HOME-18 | «Add all 17»: pôr na série todos os álbuns mostrados | — | sim | sim na v2 (só o que o filtro mostra, com Undo) | agir | pendente: função nova, o MJRP decide (decidido pelo agente na v2 — revisável) |
| HOME-19 | Mudar a ordem sem arrastar (↑ ↓) | arrastar, como hoje | ↑ ↓ ✕ | v2: «Edit order» abre o painel com ↑ ↓ ✕ (v1: «change the order», sem destino) | agir | S-61 |
| HOME-20 | O painel da série (computador) ou a folha da série (celular), com as linhas ↑ ↓ ✕ | — | — | v2 | agir | S-61 |
| HOME-21 | A faixa «Undo» depois de tirar um álbum ou de «Add all» | — | — | v2 | agir | S-61 |
| HOME-22 | Depois de criar: «Blend it now» e «Open the series» | — | — | v2 | agir | S-61 |
| HOME-23 | O aviso de visitante na base | — | — | v2 | informar | S-61 |

#### Lacunas

- Rodada 1: criar, «Creating…», a falha ao gravar e o depois de criar não estavam desenhados. **Rodada 2 (Transformar v2): desenhados** (`^home-creating`, `^home-created`, `^home-create-failed`, `^home-name-missing`).
- O nome vazio: hoje o computador cria «New Album Series» sem avisar. Na v2 o nome é sugerido pelo artista como texto de verdade, e o nome apagado pede o nome (decidido pelo agente — revisável).
- Depois de criar: hoje o site abre a série na tela de séries (`controllers/HomeController.js` linha 235). Na v2 a Home fica e oferece «Blend it now» primeiro e «Open the series» (decidido pelo agente — revisável; a rota `/blend?seriesId=` já existe, `views/BlendingMenuView.js` linha 306).
- Arrastar para mudar a ordem: fora da v2 (↑ ↓ basta e funciona igual no toque).
- As capas dos álbuns que vêm de uma lista colada são marcadores no protótipo (só as capas de Pink Floyd foram capturadas).

- **Construção (F79, ramo `feat/f79-home-that-explains-itself`):** os 18 estados foram construídos nas duas larguras e capturados ao lado do protótipo (`reports/evidence/F79/`). O que a construção decidiu onde o protótipo não dizia (decidido pelo agente — revisável): a lista colada é editável linha a linha (um campo por linha); a folha da série no celular fecha pelo botão da própria Folha (✕, «Done» para o leitor de tela); a falha ao gravar só diz «the connection dropped» quando a falha é de rede. Os estados de hoje que a v2 não desenhava ficam com o texto novo, em `behavior.md` § Tela inicial: campo vazio (`^home-scan-empty-field`), tipos sendo confirmados (`^home-scan-classifying`), filtro sem álbum (`^home-discography-filter-empty`), lista sem nenhum álbum (`^home-bulk-nothing-found`), linha já na série (`^home-bulk-skipped`).

### Content Map · Home (F79)

Desde a rodada 2, o texto do **Transformar v2** (proposta do agente, em inglês; a tabela completa, linha a linha com o porquê, está em `design/proposals/f79-home/proposal.md` § Rodada 2). O texto da rodada 1 dos três níveis segue em `design/proposals/2026-11-20-home-copy-proposal.md`.

| Elemento | O que diz | Como ler | Referência ao lado |
|---|---|---|---|
| o título e a frase da série (HOME-01) | «Pick the albums. We blend the playlists.» «A series is the set of albums you want to hear together, from one artist or many: the Blend turns it into balanced playlists.» | — | — |
| o campo único (HOME-04, HOME-05) | «An artist, or paste a list of albums»; na lista, «ready» ou o motivo por linha | uma linha com « - » é um álbum | «N lines: N ready, N to fix» |
| a contagem e a ordem (HOME-10, HOME-19) | «4 albums from 1 artist · the order counts»; no painel, «The order counts: the Blend reads the albums in this order when it spreads their tracks over the playlists.» | a posição pesa na mistura (`algorithms/MJRPBalancedCascadeAlgorithm.js` linhas 77, 134, 141) | o número de cada capa |
| o próximo passo (HOME-12) | «Next: the Blend turns the series into playlists.» / «Add one album to create the series» | por que o botão está apagado | — |
| o nome (HOME-02) | «Pink Floyd selection» + «suggested · edit it»; vazio: «Give the series a name first.» | sugerido, não definitivo | «Use «Pink Floyd selection»» |
| o depois de criar (HOME-22) | ««Pink Floyd selection» is saved» «4 albums · find it any time in Music Series.» | onde a série fica | «Blend it now», «Open the series» |
| o erro (HOME-14) | «The catalog did not answer in 15 seconds.» «Your series still has its 4 albums. Try again in a moment.» | o que ainda vale | «Try again» |

### Rótulos propostos (F79, pendentes)

| Conceito | Hoje | Proposto | Onde |
|---|---|---|---|
| criar a série | «Initialize Load Sequence» (computador), «Create series» (celular) | «Create series» nos dois | ação principal |
| achar por artista / colar | «Visual» / «Bulk Paste» | «By artist» / «Paste a list» | modo de busca |
| a série sendo montada | «Selected Albums», «Stack» | «Your series» | lista, bandeja ou base |
| tipo não classificado | «?» (computador), «Other» (celular) | «Other» nos dois | filtros da Home e da edição de série |
| coletânea | «Compendiums» | rodada 1 (Elevar, Transformar v1): «Compilations». **Rodada 2: fica «Compendiums»**, a palavra de hoje do produto (`models/albumPicker.js` linha 18), até o MJRP dizer outra | filtros da Home e da edição de série |

### Página de entrada (F80, rodada 1 de exploração)

Fonte: `design/inception/splash-ember-v1.html`, `design/inception/splash-sides-v1.html`, `design/inception/splash-crate-v1.html` (2026-11-20; nenhuma escolhida) · wireframes: `design/wireframes/splash-<direção>-v1-desktop.png` e `-phone.png`.

| ID | O que a tela mostra | Função do produto | Destino |
|---|---|---|---|
| SPL-01 | Topo: logotipo, «Sign in», «Open the app» | agir | S-62 |
| SPL-02 | Sobretítulo e título principal | informar | S-62 |
| SPL-03 | Subtítulo que diz o que o produto é, com o nome | informar | S-62 (e o candidato de GEO e AEO) |
| SPL-04 | As duas chamadas da primeira tela | agir | S-62 |
| SPL-05 | A imagem da direção: leito de fogo e equalizador (Brasa); capa e vinil em CSS 3D (Lado A, lado B); caixote 3D em WebGL (Caixote) | informar (a identidade) | S-62 |
| SPL-06 | Momento 1, série | informar | S-62 |
| SPL-07 | Momento 2, ranking e mistura | informar | S-62 |
| SPL-08 | Momento 3, coleção | informar | S-62 |
| SPL-09 | Por que álbuns inteiros: a frase e o exemplo ilustrativo de faixas ordenadas | ajudar a decidir | S-62 |
| SPL-10 | Fecho com as chamadas | agir | S-62 |
| SPL-11 | Rodapé: links e o aviso das capas originais | informar | S-62 |
| SPL-12 | Faixa e notas do protótipo | — | cortado do site: só existe no protótipo, para o MJRP |
| SPL-13 | Fio do equalizador preso no topo, com a faixa atual (só Lado A, lado B) | informar (onde a pessoa está) | S-62 |
| SPL-14 | Botões ‹ › e o nome do álbum da frente (só Caixote) | agir | S-62 |

Rodada 2 (`design/inception/splash-crate-v2.html`; wireframes `design/wireframes/splash-crate-v2-desktop.png` e `-phone.png`): SPL-01 a SPL-13 seguem com o mesmo sentido; na v2 a SPL-05 é o caixote 3D com 14 capas reais e a SPL-13 é o fio de todas as larguras (no celular, na barra de baixo). A SPL-14 sai na v2 (o giro é a rolagem). Novos:

| ID | O que a tela mostra | Função do produto | Destino |
|---|---|---|---|
| SPL-15 | Legenda do disco puxado: título, artista, ano, «Artwork from Apple Music» e «Listen on Apple Music» | informar, agir | S-62 (e a condição da Apple, a confirmar) |
| SPL-16 | Faixa A4, mistura (separada da A3, ranking) | informar | S-62 |
| SPL-17 | «Flip the record»: a seção que gira o caixote | informar (a identidade) | S-62 |
| SPL-18 | Leito de brasas e a luz de baixo, forte em duas faixas | informar (a identidade) | S-62 |
| SPL-19 | No celular, o disco de cada faixa com crédito e link | informar, agir | S-62 |

Rodada 3, prévias (`design/inception/splash-menu-{stops,bar,deck}-v1.html`; wireframes `design/wireframes/splash-menu-{stops,bar,deck}-v1-desktop.png` e `-phone.png`): as histórias seguem o menu. A SPL-06 passa a ser Albums (a série e o ranking, com o exemplo ilustrativo); a SPL-07 entra nela; a SPL-16 é Blend; a SPL-08 é Inventory; a SPL-09 («Why whole albums») sai — proposta do agente, pergunta 4 ao MJRP; a SPL-13 dá lugar à SPL-20; a SPL-01 e a SPL-02 a SPL-04 ganham o estado com conta. Novos:

| ID | O que a tela mostra | Função do produto | Destino |
|---|---|---|---|
| SPL-20 | Barra-menu: uma fila contínua de barras, cinco partes, uma por item do menu; o fogo enche com a leitura; clicar leva à história (A sob o topo, B no topo, C embaixo) | informar (onde a pessoa está), agir (ir à história) | UAT-240 |
| SPL-21 | Com conta, o topo só com «Start» com o fogo | agir | UAT-239 |
| SPL-22 | Com conta, a primeira tela: «Welcome back», «Back to the crate. Start a new series.», «Start» e «Your playlists» | agir | UAT-239 |
| SPL-23 | Side A · 1 — Start: a história do Start | informar | UAT-240 |
| SPL-24 | Side B · 1 — Playlists: a história das playlists guardadas | informar | UAT-240 |
| SPL-25 | Com conta, em cada história, «Open <item> →», que abre a tela do app | agir | UAT-239 (pergunta 2 ao MJRP) |
| SPL-26 | Pausar o movimento: ícone de 44 px no canto do palco | agir (WCAG 2.2.2) | UAT-240 (decisão do MJRP, 2026-11-21) |

