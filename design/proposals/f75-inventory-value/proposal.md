---
type: proposal
subject: "F75: valor estimado dos CDs do inventário e onde comprar"
project: mjrpalbumblender-v0
feature: F75
requirement: S-57
prototype: design/inception/inventory-value-v1.html
status: para o MJRP julgar
written: "2026-11-20"
---
# Proposta — valor estimado do inventário e onde comprar (F75)

**Para quem:** MJRP. **O que decidir:** se o desenho abaixo serve para a primeira versão, e as seis perguntas do fim.

**O protótipo:** `design/inception/inventory-value-v1.html` (rodada 1, modo explorar). Os valores nele são ilustrativos: nada foi lido do Discogs. Com o servidor local ligado, abre em `http://127.0.0.1:5010/_prototype-inventory-value.html`.

## A ideia em uma frase

O inventário passa a dizer quanto vale cada CD, lendo o valor do Discogs sozinho; você corrige à mão quando quiser, e o que você escreve nunca é trocado por uma leitura automática.

## O que você respondeu e virou desenho

| Você disse | No desenho |
|---|---|
| Tem conta no Discogs e aceita ligar um token | O valor é a sugestão de preço do Discogs, lida com o seu token, guardado no servidor |
| Guardar o valor de três estados e mostrar os três e a média | A janela do álbum mostra «Mint», «Near Mint», «Very Good Plus» e «Mean of the three»; o cartão e os totais usam a média |
| Começar pela edição mais comum | O app escolhe a edição em CD que mais gente tem no Discogs; a janela diz qual foi |
| USD, EUR, GBP e BRL, com o câmbio do dia | Um seletor de moeda no total; o valor é guardado em dólar e convertido na hora |
| O valor é para estimar a coleção, editável como hoje | Cada valor diz de onde veio («Discogs» ou «Yours»); o total diz quantos álbuns entraram na soma |

## O que muda na tela

### No cabeçalho do inventário

O «Total Owned: $0.00» de hoje dá lugar a uma caixa com:

- **«Estimated value of what I own»**: a soma dos álbuns «Owned», e ao lado «3 of 14 owned albums have a value».
- **«To buy the rest»**: a soma dos «Not Owned» e «Wishlist», com a mesma contagem.
- **O seletor de moeda:** USD, EUR, GBP, BRL. Fora do dólar, uma linha diz a taxa usada.

### No cartão

Uma linha a mais, sob as médias: o valor e uma etiqueta com a origem («Discogs» ou «Yours»). Sem valor, o cartão diz por quê: «No value yet», «Waiting for a value», «Reading…» ou «No CD edition found».

### Na barra de filtros

- Um botão **«Update values»**, ao lado de «Update ratings».
- Duas opções a mais no «Sort by»: «Value (↓)» e «Value (↑)».

### Na janela do álbum

- **«Estimated value»:** os três estados e a média, a edição usada com o link para ela no Discogs, a data da leitura, «Read again», e um campo para escrever o seu valor.
- **«Where to buy»:** três links, Discogs, Amazon e iMusic, cada um numa busca pronta com o artista, o título e «CD».
- As faixas continuam como hoje.

## Como um álbum entra no inventário, e como ganha valor

Hoje há duas portas de entrada, e a proposta acrescenta uma regra só para todas: **todo item que entra sem valor vai para uma fila de leitura.**

| Como o álbum entra | Status com que entra | O que acontece com o valor |
|---|---|---|
| «Add to Inventory» no cartão de um álbum, na tela de séries | o que você escolher na janela (formato, moeda, preço, notas) | Se você escreveu um preço, ele é o valor («Yours») e não é trocado. Se não escreveu, o item entra na fila |
| «Add the albums of my series», no inventário | «Not Owned» | Todos entram na fila; o aviso diz quantos esperam |
| Um álbum novo numa série (hoje ele **não** entra sozinho no inventário) | não entra | Nada, até você apertar «Add the albums of my series» de novo. Ver a pergunta 5 |

**A fila de leitura:**

- Lê poucos álbuns por vez, enquanto o app está aberto, respeitando o limite do Discogs. Não trava a tela.
- Um aviso no topo diz «2 new albums are waiting for a value», com «Read them now».
- «Update values» lê tudo de novo de uma vez, menos os valores que você escreveu.
- Um valor lido há muito tempo é lido de novo sozinho. Proponho 30 dias.

## O que acontece quando o status muda

O valor é do álbum, não do status. O que muda é **em qual total ele entra** e **o que o app pergunta**.

| Mudança | O total | O que o app faz |
|---|---|---|
| «Not Owned» ou «Wishlist» → «Owned» | sai de «To buy the rest» e entra em «Estimated value of what I own» | Pergunta, sem obrigar, quanto você pagou e em que estado está o disco. O valor estimado continua sendo a estimativa; o que você pagou é outro campo |
| «Owned» → «Not Owned» ou «Wishlist» | faz o caminho contrário | Guarda o que você tinha escrito (preço pago, notas); nada é apagado |
| «Not Owned» → «Wishlist» | continua em «To buy the rest» | Nada |

**Dois números, não um.** Hoje o item tem um só campo de preço, o que você pagou. A proposta separa:

- **Quanto paguei** (`purchasePrice`, já existe): só você escreve.
- **Quanto vale** (novo): lido do Discogs ou escrito por você.

Com os dois, o app pode mostrar depois quanto a coleção valorizou. Isso não está nesta versão.

**O estado do disco, quando você o informar:** se o item diz «Near Mint», o valor do álbum passa a ser o desse estado, e não a média dos três. Sem estado informado, vale a média, como você pediu.

## O que não entra nesta versão

- **Preço da Amazon e da iMusic.** A Amazon só abre preços para afiliado com vendas recentes; a iMusic não tem interface pública e recusou o pedido automático. Entram só os links.
- **Marca de afiliado nos links.** Os links saem de um lugar só no código, onde a marca entra quando você tiver as contas.
- **Vinil e fita.** A leitura é só de CD. A edição mais comum é procurada entre os CDs.
- **Escolher a edição exata.** Fica para a próxima iteração, como você disse. A janela já mostra qual edição foi usada.
- **Histórico de valor** e quanto a coleção valorizou.

## Como seria construído

- **Uma fonte de valor no servidor**, no molde das fontes de notas: o servidor acha a edição no Discogs, pede a sugestão de preço com o seu token e devolve os três estados. O token nunca vai para o navegador nem para o repositório.
- **O valor fica no item**, com a origem, a edição, a data e os três estados, em dólar. A conversão é feita na tela.
- **O câmbio do dia** vem de uma fonte pública sem chave (conferi que `api.frankfurter.app` responde com USD para BRL, EUR e GBP), lido uma vez por dia.
- **A fila** é a mesma ideia do «Update ratings», com o limite do Discogs: cerca de 25 minutos para 211 álbuns na primeira leitura.

## Fatias

1. **Links de compra** na janela do álbum. Não depende de conta nenhuma.
2. **Valor do Discogs**: ligar a conta, a fila, os três estados, o total, a moeda, a ordenação, o valor à mão.
3. **Status e valor**: as perguntas ao virar «Owned» e o estado do disco.
4. **Depois, fora desta feature:** preço da Amazon e da iMusic, marca de afiliado, escolha da edição, vinil.

## O que eu não sei

- **Os termos de uso da API do Discogs.** A página oficial recusa leitura automática. Preciso que você a abra, ou que me deixe ler no seu navegador, para confirmar que o app pode guardar e mostrar a sugestão de preço. Sem isso, a fatia 2 não começa.
- **Se a sugestão de preço exige as configurações de vendedor preenchidas** na sua conta. Li isso em documentação de terceiros, não na oficial.
- **Quantos dos seus 211 álbuns têm edição em CD no Discogs.** Só a primeira leitura diz.
- **O token antigo do Discogs** que ficou no histórico do git (UAT-17) precisa ser trocado antes de ligar um novo.

## Perguntas para você

1. **Os três estados são «Mint», «Near Mint» e «Very Good Plus»?** São os três mais altos; o Discogs tem oito.
2. **O total do topo separa «o que tenho» de «o que falta comprar»**, como no protótipo? Ou você quer um total só?
3. **Ao virar «Owned», o app pergunta quanto você pagou e o estado do disco?** Ou muda o status sem perguntar nada, como hoje?
4. **30 dias para ler um valor de novo** está bom?
5. **Um álbum novo numa série deve entrar sozinho no inventário**, como «Not Owned»? Hoje não entra; ficou como pergunta aberta na F71.
6. **A iMusic é a brasileira** (`imusic.br.com`)? O link do protótipo aponta para ela.

## Inventário da tela (rodada 1)

O `docs/specs/info-arch.md` do projeto nasceu com esta rodada e guarda este inventário e os estados; esta é a cópia para leitura.

| ID | O que a tela mostra | Para que serve |
|---|---|---|
| INV-V1 | Caixa «Estimated value of what I own», com a contagem | informar |
| INV-V2 | «To buy the rest», com a contagem | ajudar a decidir |
| INV-V3 | Seletor de moeda e a taxa usada | informar |
| INV-V4 | Linha de valor no cartão, com a origem | informar |
| INV-V5 | Botão «Update values» e o aviso de leitura | agir |
| INV-V6 | Aviso «N new albums are waiting for a value» | informar, agir |
| INV-V7 | «Sort by»: «Value (↓)», «Value (↑)» | ajudar a decidir |
| INV-V8 | Janela: três estados e a média, a edição, a data | informar |
| INV-V9 | Janela: campo para escrever o valor | agir |
| INV-V10 | Janela: «Where to buy», três links | agir |
| INV-V11 | Aviso «Connect Discogs» | agir |

## Estados da tela

| ID | Estado | O que a pessoa lê |
|---|---|---|
| `^inventory-value-not-connected` | o Discogs não está ligado | «Values come from Discogs. Connect your Discogs account once to read them.» |
| `^inventory-value-reading` | leitura em andamento | «Reading values… 86 of 211. You can keep using the inventory.» |
| `^inventory-value-read` | valores lidos | o total, a contagem, o valor em cada cartão |
| `^inventory-value-waiting` | álbuns novos na fila | «2 new albums are waiting for a value.» |
| `^inventory-item-value-discogs` | janela, valor do Discogs | os três estados, a média, a edição, a data |
| `^inventory-item-value-yours` | janela, valor escrito à mão | «You wrote this value. Reading values from Discogs never changes it.» |
| `^inventory-item-value-none` | janela, sem valor ainda | «No value was read for this album yet.» e «Read the value now» |
| `^inventory-item-value-not-found` | janela, edição não achada | «Discogs has no CD edition under this artist and title, so there is no value to read.» |

Estados que o protótipo ainda não mostra: a leitura que falha (Discogs fora do ar, limite atingido, token recusado) e o câmbio do dia que não chega.

## Referências

- Viabilidade: `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`.
- Benchmark de apps de controle de coleção: não feito nesta rodada. Você pediu para depois; está como candidato no PRD.
- Tokens visuais: os do app (fundo escuro, laranja `#f97316`), copiados do protótipo anterior (`design/inception/albums-paging-v1.html`). O projeto não tem `docs/specs/design-system.md`.
