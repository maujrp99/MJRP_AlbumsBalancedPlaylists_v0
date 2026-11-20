# Info-arch — Album Blender V0

> Aprovado por: ainda não aprovado (nasceu em 2026-11-20 00:28, com a rodada 1 da F75) · fonte: design/inception/inventory-value-v1.html
> Página de leitura: design/proposals/info-arch/info-arch.html, gerada deste arquivo (`build_info_arch_page.py`)

## Como este documento está organizado

Este arquivo nasceu com a primeira tela desenhada pela skill de UI neste projeto (F75). **Ele descreve inteira só a tela do inventário com valor estimado.** As outras telas do app existem em produção e estão descritas, por comportamento, em `docs/specs/behavior.md`; aqui elas aparecem só no Sitemap, para situar. Cada tela ganha a sua seção quando for desenhada ou redesenhada.

## Sitemap

- **Home** (`/home`): criar uma série a partir de um artista ou de uma lista colada
- **Music Series** (`/albums`): as séries de álbuns e os álbuns de cada uma
- **The Blending Menu** (`/blend`): escolher série e receita e gerar playlists
- **Playlists** (`/playlists`, `/saved-playlists`): as playlists geradas e os lotes guardados
- **Inventory** (`/inventory`): a coleção da pessoa, com status, notas e (F75) valor estimado
  - a janela de um álbum do inventário

### O esquema de cada nó

| Nó | Esquema de organização |
|---|---|
| Inventory | por artista e título, no padrão; trocável por nota média, popularidade, data de entrada e (F75) valor |
| Janela do álbum | por tarefa: quanto vale, onde comprar, as faixas |
| Os outros nós | a descrever quando a tela for desenhada |

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

## Busca

O inventário tem busca por texto no próprio inventário (`#inventorySearch`), que vale junto com os filtros e a ordem. A F75 não muda a busca.

## Hierarquia de navegação

A barra do topo leva a cada nó do Sitemap. A janela do álbum abre sobre o inventário e fecha com «Close», com o ✕ ou com Esc, voltando ao mesmo ponto da lista.

## Page Templates

### Inventário (lista de cartões com totais)

Cabeçalho com o título, as contagens por status e a caixa do total; avisos; barra de filtros e ações; grade de cartões.

### Janela do álbum do inventário

Cabeçalho do álbum (capa, título, artista, status, formato); «Estimated value»; «Where to buy»; as faixas.

## Fluxos

1. **Primeira leitura:** ligar o Discogs → «Update values» → acompanhar «Reading values… N of M» → ver o total e os cartões.
2. **Álbum novo:** o álbum entra no inventário → «N new albums are waiting for a value» → o valor aparece sozinho, ou «Read them now».
3. **Corrigir um valor:** abrir a janela → escrever o valor → «Save» → a etiqueta vira «Yours».
4. **Comprar:** abrir a janela → «Where to buy» → Discogs, Amazon ou iMusic.

## Template → Épico

| Template | Épico |
|---|---|
| Inventário · Janela do álbum do inventário | EP-07 (inventário de álbuns) |

## Matriz de operações

| Objeto | Ver | Criar | Mudar | Apagar |
|---|---|---|---|---|
| Valor estimado de um item | cartão, janela | leitura do Discogs, ou à mão | à mão; «Read again» | «Use the Discogs value instead» tira o valor escrito à mão |
| Total do inventário | caixa do total | — | muda com a moeda e com o status dos itens | — |

## Estados

### Inventário

- **Discogs não ligado.** Aviso «Values come from Discogs. Connect your Discogs account once to read them.», com «Connect Discogs»; o total mostra «—» e «No value read yet». ^inventory-value-not-connected
- **Lendo os valores.** Aviso «Reading values… 86 of 211. You can keep using the inventory. This takes about 25 minutes for 211 albums.», com «Stop»; o botão «Update values» fica desabilitado e conta o progresso; os cartões ainda sem valor dizem «Reading…». ^inventory-value-reading
- **Valores lidos.** A caixa do total mostra «Estimated value of what I own», «N of M owned albums have a value» e «To buy the rest»; cada cartão mostra o valor e a etiqueta «Discogs» ou «Yours». ^inventory-value-read
- **Álbuns novos esperando valor.** Aviso «2 new albums are waiting for a value. They are read on their own, a few at a time, while the app is open.», com «Read them now»; o cartão diz «Waiting for a value». ^inventory-value-waiting

### Janela do álbum do inventário

- **Valor do Discogs.** «Mint», «Near Mint», «Very Good Plus» e «Mean of the three»; a edição usada e o link para ela; a data da leitura e «Read again»; o campo «Write your own value». ^inventory-item-value-discogs
- **Valor escrito à mão.** «You wrote this value. Reading values from Discogs never changes it.», o valor com a etiqueta «Yours», e «Use the Discogs value instead». ^inventory-item-value-yours
- **Sem valor ainda.** «No value was read for this album yet.», com «Read the value now» e o campo para escrever. ^inventory-item-value-none
- **Edição não achada.** «Discogs has no CD edition under this artist and title, so there is no value to read.», com «Look again» e «Pick an edition on Discogs». ^inventory-item-value-not-found

Estados que o protótipo ainda não mostra: a leitura que falha (Discogs fora do ar, limite atingido, token recusado) e o câmbio do dia que não chega.

## Content Map

| Elemento | O que diz | Como ler | Referência ao lado |
|---|---|---|---|
| «Estimated value of what I own» | a soma do valor dos álbuns «Owned» | uma estimativa, não uma avaliação | «N of M owned albums have a value» |
| «To buy the rest» | a soma do valor dos «Not Owned» e «Wishlist» | quanto custaria comprar o que falta | «N of M albums have a value» |
| moeda | USD, EUR, GBP, BRL | o valor é guardado em dólar e convertido | «Converted from USD at today's rate (1 USD = 5.89 BRL).» |
| três estados e a média | o que o CD vende no Discogs por estado do disco | o valor do álbum é a média dos três | a edição usada e a data da leitura |
| etiqueta «Discogs» / «Yours» | de onde o valor veio | «Yours» nunca é trocado por uma leitura | — |
| «Where to buy» | três links de busca | abrem a loja no álbum, em CD | «The app earns nothing from these links today.» |

## Decisões de IA

- Dois números por item, não um: o que a pessoa pagou e o que o álbum vale (proposta da rodada 1, à espera do MJRP).
- O total separa «o que tenho» de «o que falta comprar» (proposta da rodada 1, à espera do MJRP).

## Protótipos aprovados

Nenhum ainda. A rodada 1 da F75 é de exploração.

## Inventário do protótipo

Fonte: `design/inception/inventory-value-v1.html` · wireframes: `design/wireframes/inventory-value-v1-inventory.png`, `design/wireframes/inventory-value-v1-album-window.png`.

| ID | O que a tela mostra | Função do produto | Destino |
|---|---|---|---|
| INV-V1 | Caixa «Estimated value of what I own», com a contagem | informar | S-57 |
| INV-V2 | «To buy the rest», com a contagem | ajudar a decidir | S-57 |
| INV-V3 | Seletor de moeda e a taxa usada | informar | S-57 |
| INV-V4 | Linha de valor no cartão, com a origem | informar | S-57 |
| INV-V5 | Botão «Update values» e o aviso de leitura | agir | S-57 |
| INV-V6 | Aviso «N new albums are waiting for a value» | informar, agir | S-57 |
| INV-V7 | «Sort by»: «Value (↓)», «Value (↑)» | ajudar a decidir | S-57 |
| INV-V8 | Janela: três estados e a média, a edição, a data | informar | S-57 |
| INV-V9 | Janela: campo para escrever o valor | agir | S-57 |
| INV-V10 | Janela: «Where to buy», três links | agir | S-57 |
| INV-V11 | Aviso «Connect Discogs» | agir | S-57 |
