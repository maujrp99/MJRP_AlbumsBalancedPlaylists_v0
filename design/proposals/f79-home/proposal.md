# F79 · a Home que se explica · rodada 1 de desenho

> **Escolha do MJRP em 2026-11-20 19:19:** «home 3 niveis transformar». Entendido assim: dos três níveis da rodada 1, ele escolhe **Transformar** (um palco só, um campo que aceita artista ou lista, a série como base de capas presa embaixo, fogo e equalizador no centro, voz direta). É a escolha da direção, não a aprovação final do protótipo: a crítica deixou abertos, no Transformar, reordenar e remover álbuns (não desenhados) e a cor `#fdba74` fora das cores de fogo declaradas; e as perguntas do § 4 seguem sem resposta. A rodada 2 fecha esses pontos numa versão nova (a v1 que ele viu fica intacta).

Pedido do MJRP em 2026-11-20 (estória S-61): «uma proposta consolidar, elevar, transformar, considerando copy, elementos de UI e UX e usabilidade», respeitando o fogo e os equalizadores como identidade do site. Esta é a rodada 1: três níveis, num eixo só, **a ambição**, ao lado da tela de hoje. Nada de código do produto foi tocado.

**Onde ver:** o comparador, https://claude.ai/artifact/AsiVV2i3595LqpLEadm61h (Artifact do Claude, privado; cópia local `design/proposals/f79-home/comparator.html`), que abre nos três níveis e liga a «Referência» com um botão; computador (1280 px) e celular (393 px); sete estados. Cada protótipo abre sozinho e responde a cliques (escolher capas, buscar, colar). O texto de cada linha da tela, nos três níveis, com o porquê: `design/proposals/2026-11-20-home-copy-proposal.md`.

**Como foram feitos:** a partir da tela real. A Home do site local foi capturada (o HTML e os estilos do app, a busca «Pink Floyd» e as capas de verdade) em seis estados, nas duas larguras; cada nível é essa captura mais um script que a muda. Consolidar mexe só no que existe; Elevar e Transformar desenham a Home de novo dentro da moldura real (barra do topo, barras do celular), com as cores, a fonte e os botões do app.

## 1. Diagnóstico da tela de hoje

Medido no navegador (Chrome sem janela, site local, 2026-11-20):

| O quê | Medida |
|---|---|
| A ação que conclui a tarefa, no computador (1280 x 900) | «Initialize Load Sequence» começa em y = 878: aparecem 22 px dele com a série vazia; **com 4 álbuns escolhidos ele desce para y = 976, fora da tela** |
| Onde a primeira capa aparece, no celular (393 x 852) | y = 561, dois terços da tela abaixo; com a discografia a página tem 2.976 px |
| Passos para criar uma série de 4 álbuns de um artista | 7 cliques e 2 textos digitados: o nome (clicar, digitar), o artista (clicar, digitar), «Scan», 4 capas, «Initialize Load Sequence» |
| A tela diz o que é uma série, ou o que acontece depois? | Não. Nenhuma frase. O cabeçalho do painel repete a marca da barra do topo («Album Blender V3 · BALANCED PLAYLIST GENERATOR») |
| Palavras que ninguém de fora entende | 11: «01 // SERIES CONFIGURATION», «02A // ARTIST FILTER», «02B // DISCOGRAPHY SCAN», «03 // SELECTED ALBUMS», «Visual», «Bulk Paste», «Filtering by artist unlocks the verified discography grid.», «Stack Empty», «Initialize Load Sequence», «Compendiums», «?» |
| O mesmo tipo com dois nomes | «?» no computador, «Other» no celular (IA-02) |
| Tamanhos | «Visual» e «Bulk Paste» com 23 px de altura e texto de 10 px; «Your Albums Series Name» a 10 px em caixa alta (IN-03, CO-08) |
| Clicar numa capa, no computador | a capa não muda; a resposta aparece na lista da esquerda, longe do olho (IN-04; no celular a F76 já resolveu com o anel e o número) |
| A ordem dos passos | pede o nome antes de saber o que vai dentro; com o nome vazio o computador cria «New Album Series» sem avisar |
| Depois de criar | a tela abre a série na tela de séries, não no Blend, e nada diz isso (IN-08) |
| Do celular, ainda abertos | a faixa de filtros flutua sobre as capas ao rolar (recheck N1); a folha dos escolhidos não mostra o nome (N10) |

O que está bom e fica nos três níveis: a grade de capas grande, os filtros por tipo com a contagem, a lista colada com o relatório das linhas puladas (F63), os estados de busca com texto (F67), a barra de ação do celular (F76), o degradê do fogo na ação principal, o equalizador do fundo.

## 2. Os três níveis

**O eixo:** quanto a tela muda para que quem nunca a viu monte uma série sem ajuda. Consolidar muda as palavras; Elevar muda o fluxo dentro da mesma forma; Transformar muda a forma.

| | Consolidar | Elevar (recomendado) | Transformar |
|---|---|---|---|
| **Ideia** | a mesma tela, limpa | o sistema de hoje, evoluído | um palco só, a série como uma base de capas |
| **Texto** | a voz de console fica e fica clara: «01 // NAME YOUR SERIES», «02 // FIND ALBUMS», «03 // YOUR SERIES», «Create series»; a frase do que é uma série no topo | equilibrada: um rótulo curto de console («// Your series») e frases diretas; o nome do artista grande na discografia | direta, sem console: «Pick the albums. We blend the playlists.»; «Search» |
| **Elementos** | os mesmos; rótulos de passo a 12 px; «By artist / Paste a list» de 32 px; «Other» no lugar de «?»; o botão apagado com o porquê | bandeja da série à esquerda (nome, contagem com equalizador, linhas com ↑ ↓ ✕, «Create series» sempre à vista); cartão de busca com seletor; fichas de tipo; capa escolhida com anel e número; três passos acesos como equalizador; «Add all 17» | um campo grande que aceita artista ou lista colada; o equalizador vivo sob ele; capas em seis colunas; a base presa embaixo com a pilha de capas, o nome escrito no lugar e «Create series» |
| **Fluxo** | igual ao de hoje (nome, artista, capas, criar) | artista, capas, criar; o nome sugerido pelo artista, ajustável na bandeja | artista ou lista, capas, criar; o nome no fim, na base |
| **Usabilidade** | a ação principal à vista em 1280 x 900; vazios e erros dizem o que fazer e o que ainda vale; no celular, N1 e N10 | 6 cliques e 1 texto para a mesma série; o retorno do clique na própria capa; mudar a ordem sem arrastar; a linha errada da lista marcada antes de enviar | 6 cliques e 1 texto; a mesma série em menos lugares para olhar; uma lista de vários artistas sem trocar de modo |
| **No celular** | a tela da F76 com o texto novo, a faixa de filtros parada, o nome na barra | busca em cima, fichas em três colunas, barra de ação com capas e nome que abre a bandeja como folha | o mesmo palco numa coluna; a base vira a barra acima das abas |
| **Identidade** | igual à de hoje | o equalizador vira medidor (contagem e passos); o fogo na ação principal e na capa escolhida | o fogo no título (texto com o degradê) e no brilho atrás do campo; o equalizador vivo como sinal de busca |
| **Sai do design system?** | não | sim, com quatro padrões novos, marcados como pendentes (bandeja, medidor equalizador, capa numerada no computador, fichas) | sim, mais longe: base da série, equalizador vivo, título com degradê |
| **Custo para construir** | pequeno: texto e CSS da Home e dos estados da busca, o filtro «Other» também na edição de série; os testes que leem os textos mudam | médio: o painel da esquerda vira a bandeja (novo componente), o estado escolhido da capa no computador (o do celular já existe), o nome sugerido; a peça de escolher álbuns é a mesma da edição de série e não muda | grande: novo leiaute nas duas larguras, o campo que reconhece lista colada, a base em computador e celular, o título; mais testes e uma verificação de que a edição de série não quebra |
| **Risco** | quase nenhum; não resolve o fluxo (nome primeiro) | baixo: o fluxo muda, a forma é conhecida; «Add all» pode encher a série demais (é um botão a decidir) | médio: o campo que adivinha entre artista e lista pode errar; perde a voz de console, que é parte da marca; a base cobre parte da grade no computador baixo |

## 3. Recomendação

**Elevar.** É o nível que resolve o que a tela tem de errado sem trocar o que ela tem de certo: a ação principal sempre à vista, o retorno do clique na capa, o nome no fim e sugerido, as palavras claras, e a identidade (o fogo, o equalizador, a voz de console num rótulo) mantida e usada com um papel. Custa um componente novo e reaproveita o padrão que o celular já tem desde a F76, então computador e celular passam a se comportar igual. Do Transformar vale trazer, se você quiser, duas peças baratas: o equalizador vivo enquanto busca e a linha da lista colada marcada ao digitar (o Elevar já tem a segunda).

O texto do Consolidar pode entrar antes de tudo, sozinho, como um conserto pequeno: ele não briga com nenhum dos outros dois níveis.

## 4. Perguntas para você

1. Qual nível, ou que mistura? (Recomendo Elevar.)
2. A voz de console («01 //», «Scan»): fica como está (Consolidar), vira só rótulo pequeno (Elevar) ou sai (Transformar)?
3. «Compendiums» é palavra sua? Se for, fica, e só o «?» vira «Other»; se não, «Compilations». O nome muda também na janela de edição de série.
4. Depois de «Create series», abrir direto o Blend com a série escolhida, ou continuar abrindo a série na tela de séries?
5. A ordem dos álbuns na série pesa na mistura? A frase do vazio do Elevar diz «numbered in the order the Blend reads them»; se não pesa, ela muda.
6. O nome sugerido a partir do artista («Pink Floyd selection») no lugar do «New Album Series» silencioso: vale?
7. «Add all 17» (pôr todos os álbuns mostrados na série) no Elevar: quer essa função?

## 5. O que foi decidido pelo agente (revisável) e o que não foi visto

- **Decidido pelo agente:** o eixo (ambição) e o que cada nível muda; todo o texto da tela (proposta, não copy deck); os padrões novos, todos marcados como pendentes em `docs/specs/design-system.md`; os sete estados mostrados; a recomendação.
- **Desvio do pedido:** o ramo pedido era `feat/f79-home-design-round`; foi criado como `wip/f79-home-design-round`, porque um ramo com `feat/f79-` faz o board contar a F79 como começada e você não conseguiria arrastá-la para «Priorizada» (já aconteceu com a F72). Para voltar ao nome do pedido depois de priorizar: `git branch -m wip/f79-home-design-round feat/f79-home-design-round`.
- **Não visto:** um aparelho de verdade (só larguras emuladas no Chrome), o Safari, o toque, a página publicada. A captura foi feita como visitante, sem a sua conta (a barra do topo mostra «Sign In»). Os estados «buscando» no celular e «erro» da Referência foram montados a partir de outra captura com os textos que o app mostra (dito no código do protótipo). Criar a série, «Creating…» e a falha ao gravar não foram desenhados nesta rodada.

## 6. A crítica (agente separado, `mjrp-critiquing-ux-ui`)

Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-f79-home-ux-audit.md`. Veredito: os três níveis podem ir para a sua escolha; **nenhum P0**, 8 P1, 9 P2. O método (três níveis num eixo nomeado, igualmente acabados) passa; o fogo e os equalizadores são respeitados nos três. O Elevar é o que tem menos P1 próprios (1).

**Consertado nesta rodada:** o contraste dos textos do painel da grade no Consolidar (P1, AH-01); as capas da barra do celular no Elevar cobrindo o texto (P1, AH-11); «Click» virou «Tap» no celular (P2); os wireframes que faltavam (P1).

**Fica, e por quê:**
- Consolidar: no celular a mensagem de erro e «Try again» ficam abaixo da primeira tela; a capa escolhida no computador ainda mostra «+» e a lista mostra 2 de 4 álbuns sem rolar; mudar a ordem só arrastando. São limites do nível (a mesma estrutura de hoje): o Elevar resolve os três.
- Transformar: «change the order» não abre nada e a base não tem ✕ por álbum; um álbum vindo da lista colada não sai. É uma peça não desenhada desta rodada; entra se você escolher o Transformar.
- P2: dois passos «02» no Consolidar; o degradê do fogo em «Scan» e em «Create series» ao mesmo tempo (dois destaques); a margem de 32 px no celular; o laranja claro `#fb923c` em rótulos e links e o terceiro tom `#fdba74` no degradê do equalizador, fora do par declarado (`#f97316 → #dc2626`): você aprova ou corta esse tom; mono a 11 px no Elevar; a base do Transformar corta o nome e cobre a última fileira.
- Não visto em imagem pelo crítico: buscando, discografia, colando e não encontrado (julgados pelo código); a fila da máquina estava ocupada.

## Rodada 2 · Transformar v2 (2026-11-20)

**Onde ver:** o mesmo comparador, https://claude.ai/artifact/AsiVV2i3595LqpLEadm61h (cópia local `design/proposals/f79-home/comparator.html`). Ele abre agora em **«Transformar · v2»** ao lado de **«Transformar · v1 · a que você escolheu»**, no estado «Mudando a ordem»; os 18 estados num seletor; computador (1280) e celular (393); a «Referência» (a Home de hoje) num botão; Consolidar e Elevar dobrados em «Decididos na rodada 1»; logo abaixo, a **prévia de cor** A e B. O botão «Marcar decisões do agente» pinta de amarelo, na própria tela, cada escolha que o agente fez sozinho («decidido pelo agente — revisável · D1…D9»). Arquivos: `design/inception/home-transformar-v2.html` (a v1 fica intacta), `design/proposals/f79-home/previews/home-transformar-v2-flame-2stops.html` e `-flame-3stops.html`, gerados por `build/build.py --round2` (o pipeline da rodada 1, estendido: `core-v2.js`, `transformar-v2.js`, `transformar-v2.css`; as páginas v1 saem idênticas). Capturas, medidas e wireframes numa ida só à fila da máquina: `build/check-v2.sh`.

### O que mudou da v1, e por quê

| Na v1 | Na v2 | Por quê |
|---|---|---|
| «change the order» sem destino; a base sem ✕; um álbum vindo da lista não saía | «Edit order» abre o **painel da série** acima da base (no celular, a folha `full`): uma linha por álbum com **↑ ↓ ✕ de 44 x 44 px**, a linha movida marcada; tirar mostra **«Removed «X». Undo»** por 8 s; tocar de novo numa capa escolhida também tira, com o mesmo Undo | achado 7 da crítica (P1, IN-16): mudar a ordem e tirar sem arrastar, no computador e no toque |
| o nome como `placeholder` («Pink Floyd selection» some ao focar) | o nome sugerido entra como **texto de verdade** com a etiqueta «suggested · edit it»; apagado, «Create series» pede o nome e oferece «Use «Pink Floyd selection»» | a pergunta (c); a crítica lia o `placeholder` como campo vazio |
| «Search» e «Create series» os dois com o fogo | **um fogo por vez**: «Search» só enquanto nada foi achado nem escolhido; depois «Create series»; depois de criar, «Blend it now» | achado 10 (HI-05) |
| links e motivos em `#fb923c` | links brancos com sublinhado laranja de 2 px; motivos em rosa `#fca5a5` | achado 13: `#fb923c` é declarado só para a fonte BestEverAlbums |
| o degradê do título e das barras com `#fdba74` | as duas paradas declaradas, `#f97316 → #dc2626`; `#fdba74` virou a **prévia B**, para você escolher | achado 13 e o pedido desta rodada |
| a base cobria a última fileira; o nome cortava seco | a página reserva a altura da base; o nome com reticências; no celular, uma capa com a contagem em vez da pilha | achado 15 |
| «Compilations» | **«Compendiums»**, a palavra de hoje do produto | pergunta (d) |
| 7 estados | **18 estados**, nas duas larguras | o pedido desta rodada |
| rótulos brancos sobre o fogo a 15–17 px | 19 px, peso 800 (texto grande) | branco sobre o degradê mede 2,8–4,8:1; só passa como texto grande (3:1) |

### As perguntas da rodada 1, respondidas

- **(a) A ordem dos álbuns pesa no Blend? Sim**, na receita recomendada (MJRP Balanced Cascade). A posição do álbum na série vira `_albumIndex` (`public/js/algorithms/MJRPBalancedCascadeAlgorithm.js`, linha 77); a linha 134 decide por ela o sentido da serpentina (o 1.º, 3.º, 5.º álbum enchem os «Deep Cuts» do último volume para o primeiro; o 2.º, 4.º, do primeiro para o último); e a ordem das faixas no «Greatest Hits» segue a dos álbuns (linha 141). A ordem chega intacta: a Home grava os álbuns na ordem em que foram escolhidos (`public/js/controllers/HomeController.js`, linha 217: `albums.map(toAlbumQuery)`) e o Blend os pede «in the order they were asked for» (`public/js/models/albumAsk.js`, linha 8). Por isso a tela diz «the order counts» e, no painel, «The order counts: the Blend reads the albums in this order when it spreads their tracks over the playlists.».
- **(b) Depois de «Create series».** Hoje abre a série na tela de séries (`HomeController.js` linha 235, `/albums/<id>`). Na v2 a Home fica, e a base diz «✓ «Pink Floyd selection» is saved · 4 albums · find it any time in Music Series.», com **«Blend it now»** (o fogo; a rota `/blend?seriesId=` já existe e já chega com a série escolhida, `public/js/views/BlendingMenuView.js` linhas 306–307) e **«Open the series»** (o caminho de hoje), mais «Start another series». *Decidido pelo agente — revisável (D2).*
- **(c) O nome.** Sugerido a partir do artista («Pink Floyd selection»; vários artistas: «Joni Mitchell and Yes», três ou mais: «Joni Mitchell, Yes and more»), editável, texto de verdade; nunca «New Album Series» em silêncio: com o campo vazio, a tela pede o nome. *Decidido pelo agente — revisável (D1).*
- **(d) «Compendiums».** Fica: é a palavra atual do produto (`public/js/models/albumPicker.js`, linha 18), e a regra é manter a sua palavra até você dizer outra. **Sinalizado:** se preferir «Compilations», muda também na janela de edição de série. *(D4)*
- **(e) «Add all N».** Sim, no Transformar: um botão neutro sob as fichas, «Add all 17 studio albums» (com alguns escolhidos, «Add the other 13»); põe só o que o filtro mostra e deixa **«Added 13 albums. Undo»**. É o caminho rápido para a discografia inteira, e o Undo cobre o risco de encher demais. *Decidido pelo agente — revisável (D3).*

### Os padrões que o agente escolheu sozinho (todos revisáveis, marcados na tela)

| | Decisão | Alternativa, se você preferir |
|---|---|---|
| D1 | nome sugerido pelo artista, texto de verdade, com «suggested · edit it» | campo vazio até a pessoa escrever |
| D2 | depois de criar, ficar na Home com «Blend it now» primeiro | abrir direto o Blend; ou continuar abrindo a série (hoje) |
| D3 | «Add all» existe, só o que o filtro mostra, com Undo | sem «Add all» |
| D4 | «Compendiums» (a sua palavra) | «Compilations» |
| D6 | o equalizador: parado = pronto; em movimento = esperando uma resposta (catálogo, gravação); baixo = a resposta não veio | só enfeite parado |
| D7 | o aviso de visitante na base | nenhum aviso |
| D8 | um fogo por vez (o botão que é o próximo passo) | os dois botões com fogo, como na v1 |
| D9 | Undo por 8 segundos, preso acima da base (no celular, no pé da folha) | perguntar antes de tirar |

(D5 não existe: a frase da ordem não é escolha, vem do código, pergunta a.) Arrastar para mudar a ordem ficou **fora** da v2: ↑ ↓ resolve no computador e no toque; se você quiser arrastar também, entra com o vão marcado e Esc (IN-16).

### A cor `#fdba74` (decisão sua)

Prévia **A**: o degradê declarado, `#f97316 → #dc2626` (é o da v2). Prévia **B**: com a terceira parada `#fdba74` (laranja claro) no começo do título e no topo das barras, como na v1. Só a cor muda; veja em «Vazio» e «Buscando». **Recomendo A:** fica dentro da identidade declarada, e o título continua legível em toda a extensão (7,5:1 no laranja, 4,35:1 no vermelho; é texto de 52 px, o piso é 3:1). B dá um brilho a mais na ponta, que lembra a chama do logotipo; se você escolher B, a terceira parada entra no design system e vale também para a página de entrada (F80), que hoje propõe outra, `#fbbf24`: uma ponta clara só, para as duas telas.

### Fogo e equalizador: o que cada um faz

- **Fogo:** a segunda linha do título (uma vez por tela, só antes da primeira busca), o brilho atrás do campo, **um** botão preenchido por estado (o próximo passo) e o número na capa escolhida. Nada mais é laranja: fichas e «Edit order» ficam neutros.
- **Equalizador:** 48 barras sob o campo (32 no celular), só com as cores do fogo. **Parado** (meia luz, alturas variadas): pronto, nada sendo pedido. **Em movimento:** esperando uma resposta: buscando no catálogo e, em miniatura de 5 barras ao lado de «Saving your series…», gravando a série. **Baixo** (barras a 10 %): o catálogo não respondeu. As palavras dizem sempre o mesmo, então a barra nunca é o único sinal (HI-04). Com `prefers-reduced-motion`, nada se mexe: na espera as barras ficam paradas em altura cheia e as palavras carregam o estado.

### O celular: a base e a barra de ação são uma coisa só

No celular a base **é** a barra de ação da F76 (`.phone-action-bar`): presa logo acima da barra de baixo, com a capa e a contagem, o nome (com reticências), «Tap to edit or reorder» e «Create series» de 48 px. Tocar na capa ou na nota abre a série na folha `full` (ela tem o campo do nome, e a regra da Folha pede `full` com teclado): nome no topo, a frase da ordem, as linhas ↑ ↓ ✕ e «Create series» preso no pé. É o que a F76 já faz (`^home-phone-chosen-sheet-open`, `^home-phone-name-required`), com o texto e os estados novos. A ação está sempre à vista; a barra de abas fica embaixo, intacta.

### Os estados (cada um no seletor, nas duas larguras)

Primeira visita · Digitando · Buscando · Discografia com filtros · Um álbum · Vários · Muitos (13) · Mudando a ordem · Removido com Undo · Colando uma lista (linhas reconhecidas e não) · Lista adicionada com uma linha pulada · Artista não encontrado · O catálogo não respondeu · Nome faltando ao criar · Criando · Criada (o que vem depois) · Não deu para gravar · Visitante. Os IDs de bloco estão em `docs/specs/info-arch.md` § A Home (F79) → Estados (os sete da rodada 1 mantidos, onze novos).

### Contraste (WCAG, medido nas cores da v2)

| Texto | Fundo | Razão |
|---|---|---|
| título, linha do fogo, ponta laranja / ponta vermelha (52 px) | preto | 7,5:1 / 4,35:1 (texto grande, piso 3:1) |
| prévia B, a ponta `#fdba74` | preto | 12,5:1 |
| frase da série, branco 72 % | preto | 10,6:1 |
| ajuda sob o campo, branco 64 % | preto | 8,3:1 |
| `placeholder` do campo `#a0a0a8` | `#101014` | 7,3:1 |
| nota da base, rótulo do nome, branco 64 % | base `#0c0c0f` | 8,2:1 |
| motivo da linha, erro do nome `#fca5a5` | base / fundo vermelho 14 % | 10,3:1 / 9,1:1 |
| «ready» `#4ade80` | `#101014` | 10,9:1 |
| ano, número da linha `#a0a0a8` | preto / `#101014` | 8,1:1 / 7,3:1 |
| fichas `#d4d4d8`; ficha ligada preto sobre branco | preto | 14,2:1; 21:1 |
| frase da ordem e linhas do painel (72 % / 64 %) | `#101014` | 10,0:1 / 8,1:1 |
| faixa Undo, preto | `#f4f4f5` | 19,1:1 |
| ✕ `#fca5a5` | botão `#1c1c22` | 8,9:1 |
| número na capa, branco sobre preto 66 % (capa branca, o pior caso) | — | 7,2:1 |
| **branco sobre o fogo** (botões, número da capa escolhida) | `#f97316 → #dc2626` | **2,8:1** na ponta laranja, 3,4–4,2:1 onde o rótulo fica, 4,8:1 na ponta vermelha: passa só como texto grande (19 px, peso 800). É o `.btn-primary` do app inteiro; a F80 propõe texto preto (7,5:1), pendente com você |

### O texto da tela (proposta do agente, em inglês)

| Elemento | Texto | Por quê |
|---|---|---|
| título | «Pick the albums. We blend the playlists.» | diz a tarefa e o que o app faz por ela, antes de qualquer controle |
| a frase da série (HOME-01) | «A series is the set of albums you want to hear together, from one artist or many: the Blend turns it into balanced playlists.» | o que é uma série e para que serve, numa frase |
| o campo | «An artist, or paste a list of albums» | os dois jeitos de achar, no mesmo lugar |
| botão do campo | «Search» / «Searching…» | verbo simples; «Scan» era voz de console |
| ajuda | «Type an artist to see their albums, or paste a list of albums from many artists.»; digitando: «Press Enter or Search to see their albums. A list with one album per line works too.» | aponta o próximo gesto |
| os três passos | «Find an artist, or paste a list» · «Add the albums you want, in the order you want» · «Create the series, then blend it» | o vazio ensina o fluxo e já avisa da ordem |
| buscando | «Looking for «Pink Floyd» in the catalog… the covers appear as soon as it answers.» | diz o que está acontecendo e o que vem |
| discografia | «Pink Floyd» · «17 studio albums · newest first» | quantos e em que ordem |
| fichas | «Studio · 17», «EPs», «Singles · 15», «Live · 5», «Compendiums · 15», «Other» | a contagem ao lado; «Compendiums», a sua palavra; «Other» no lugar de «?» |
| «Add all» | «Add all 17 studio albums» / «Add the other 13» | diz quantos e quais entram |
| capa | (sem texto visível); para leitor de tela: «Animals 50, 2027. Click to add it» / «…number 1 in your series. Click to take it out» («Tap» no celular) | o estado e o gesto |
| lista colada | «Your list · one album per line, as Artist - Album»; por linha «ready» / «add « - » between artist and album»; «4 lines: 3 ready, 1 to fix. Lines to fix are skipped; the rest go in.»; «Add 3 albums» | a regra de hoje (F63) mostrada antes do clique |
| lista adicionada | «Added 2 albums. 1 line was skipped and is still here to fix.»; a linha vira um campo: «not found in the catalog: fix the spelling here»; «Add this line» | o que entrou, o que não, e onde corrigir |
| não encontrado | «No albums found for «Pink Floydd Qxz».» «Check the spelling, or paste the albums as a list: one per line, Artist - Album.» «Paste a list» | a saída, não só o erro |
| catálogo não respondeu | «The catalog did not answer in 15 seconds.» «Your series still has its 4 albums. Try again in a moment.» «Try again» | o que ainda vale |
| base vazia | «Your series is empty» «Search an artist, then click a cover to add it. You name the series at the end.» (com capas na tela: «Click a cover to add it.»; no celular: «No albums yet · Search, then tap a cover»); ao lado do botão apagado: «Add one album to create the series» | por que o botão está apagado |
| o nome | «Series name» + «suggested · edit it»; vazio: «Give the series a name first.» «Use «Pink Floyd selection»» | sugerido, não imposto; nunca «New Album Series» |
| contagem | «4 albums from 1 artist · the order counts» | quanto, de quem, e que a ordem pesa (pergunta a) |
| ações da base | «Edit order» / «Done», «Create series» | verbos do que acontece |
| próximo passo | «Next: the Blend turns the series into playlists.» | o que vem depois de criar |
| painel | «Your series · 4 albums», «The order counts: the Blend reads the albums in this order when it spreads their tracks over the playlists. Use ↑ ↓ to change it.», «Done» | o porquê da ordem, com a verdade do código |
| linhas | «Move «X» up», «Move «X» down», «Remove «X» from the series» (nomes dos botões) | cada ícone com nome |
| Undo | «Removed «X».» / «Added 13 albums.» «Undo» | desfazer em vez de perguntar |
| criando | «Creating…», «Saving your series…» | o estado em palavras |
| criada | ««Pink Floyd selection» is saved» «4 albums · find it any time in Music Series.» «Blend it now» «Open the series» «Start another series»; acima das capas: ««Pink Floyd selection» is saved and won't change here. Click a cover to start another series.» | onde a série fica, o próximo passo (pergunta b) e o que um clique faz agora |
| não gravou | «The series was not saved: the connection dropped. Your albums are still here.» «Try again» | o que ainda vale |
| visitante | «You're not signed in: the series is saved to this browser only. Sign in to keep it on every device.» | o app entra como visitante anônimo (`services/AuthService.js` linha 58): a série fica presa a este navegador |

### A crítica da rodada 2 (agente separado, `mjrp-critiquing-ux-ui`)

Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-f79-home-r2-ux-audit.md`. O crítico recebeu só a skill, o protótipo, as prévias e os documentos do produto, e tirou as próprias capturas pela fila da máquina. Veredito: **passa para a sua aprovação**; nenhum P0, 6 P1, 13 P2, 3 decisões suas.

**Consertado nesta rodada (recapturado e medido depois):**
- P1 · a base do celular passava da barra de ação de 64 px (100–150 px): agora mede 62–67 px em todos os estados, exceto «Não deu para gravar» (80 px, a frase do erro em duas linhas) e «Muitos» com a faixa Undo em cima (122 px, a faixa é à parte); o aviso de visitante saiu da barra e foi para baixo do campo; «Criada» cabe numa linha (o nome, «Open the series», «Blend it now»).
- P1 · «Add 3 albums» meio coberto pela base no celular: colando, o título dá lugar à lista, e o botão fica inteiro acima da base.
- P1 · a folha da série desalinhada: tudo na mesma margem de 16 px, «Create series» na largura toda.
- P1 · a fonte no celular: números, contagens, passos e notas na fonte de texto; o artista a 20 px. Fica o título grande de 30 px (é o título de exibição da Home, que o design system ainda não declara: pendente com você).
- P1 · a grade viva depois de criar: uma faixa verde diz ««Pink Floyd selection» is saved and won't change here. Click a cover to start another series.», e um clique começa outra série; a gravada nunca muda.
- P1 · a linha pulada da lista: vira um campo para corrigir ali mesmo, com «Add this line».
- P2 · uma palavra só para fechar a lista («Done»); «in Albums» no celular, «Music Series» no computador (os nomes do menu de cada um); a base vazia diz «Search an artist, then click a cover» quando não há capa na tela; «Joni Mitchell and Yes» com dois artistas; a margem de 16 px no celular (medida: o campo começa em x = 16); o campo do nome com 44 px.

**Fica, e por quê:**
- Estados que o app tem hoje e a v2 não desenha (confirmar tipos de álbum, filtro sem álbum, campo vazio, lista sem nada adicionado, «already in the selection»): valem os de hoje (`behavior.md`), com o texto novo na construção.
- O «Sign In» da barra do topo também é fogo: é a barra do app, fora da Home; um fogo por vez vale dentro da tela.
- Capas não quadradas (Animals 50, The Division Bell) desalinham a fileira: é dado do catálogo; a construção deve forçar o quadrado.
- O nome longo corta com reticências (no celular, em «Criada», sobra pouco): a faixa verde acima repete o nome inteiro.
- O equalizador «baixo» (sem resposta) quase não se vê: as palavras carregam o estado, como pede HI-04.
- O equalizador tem duas definições pendentes (F80 e F79) e a ponta clara é diferente (`#fdba74` aqui, `#fbbf24` na F80): decisão sua, junto com a cor A/B.
- O «1» da Syne em contagens no computador: fica a Syne no computador até a regra de fonte do computador ser decidida (a da F80 está pendente).

### Entregar para construir (quando você aprovar)

- **Componentes:** o campo único (artista ou lista, com a leitura linha a linha de `models/albumQuery.js` `parsePastedAlbumLine`, que já existe); a base (computador) que é a `.phone-action-bar` no celular; o painel da série, que no celular é a Folha `full` (`components/ui/Sheet.js`); a capa numerada no computador (o celular já tem); o equalizador com três estados; a faixa Undo; o depois de criar. A peça de escolher álbuns é a mesma da edição de série: a edição não pode quebrar.
- **Estados para capturar** (o sensor visual): os 18, pelo `#s=<id>` do protótipo; a tela com `prefers-reduced-motion` mostra tudo parado.
- **O que decidir antes do código:** a cor (A ou B); os defaults D1–D9; o texto (vira copy deck com o seu aval); se a Home fica depois de criar (D2) ou abre o Blend direto; o texto sobre o fogo (branco grande ou preto, junto com a F80); «Compendiums» ou «Compilations».
- **Testes que leem o texto de hoje** («Initialize Load Sequence», «Scan», «New Album Series») mudam; o comportamento «clicar de novo não tira» (`behavior.md` `^home-album-added-to-stack`) vira «clicar de novo tira, com Undo».
- **Ramo:** quando a F79 estiver em «Priorizada», `git branch -m wip/f79-home-design-round-2 feat/f79-home-design-round-2` (o nome `wip/` existe para não marcar a F79 como começada no seu board).

### O que ainda precisa de você

A cor (A, recomendada, ou B, e uma ponta clara só com a F80); os defaults D1–D9; o texto (proposta, não copy deck); texto branco grande ou preto sobre o fogo (com a F80); «Compendiums» ou «Compilations»; se a base pode passar de 64 px no celular nos dois casos medidos; a aprovação da v2, que fecha a crítica. O ramo não foi enviado ao remoto.

### O que não foi visto

Um aparelho de verdade (só larguras emuladas no Chrome sem janela), o Safari, o toque, o Artifact publicado aberto no celular. A captura da tela de hoje é a da rodada 1, como visitante: a barra do topo mostra «Sign In» em todos os estados, também nos de quem tem conta. As capas dos álbuns que vêm de uma lista colada são marcadores (o protótipo só tem as capas de Pink Floyd). O tempo real de cada espera (busca, gravação) não foi medido.
