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

Relatório: `reports/audits/2026-11-20-F79-home-ux-audit.md`. Veredito: os três níveis podem ir para a sua escolha; **nenhum P0**, 8 P1, 9 P2. O método (três níveis num eixo nomeado, igualmente acabados) passa; o fogo e os equalizadores são respeitados nos três. O Elevar é o que tem menos P1 próprios (1).

**Consertado nesta rodada:** o contraste dos textos do painel da grade no Consolidar (P1, AH-01); as capas da barra do celular no Elevar cobrindo o texto (P1, AH-11); «Click» virou «Tap» no celular (P2); os wireframes que faltavam (P1).

**Fica, e por quê:**
- Consolidar: no celular a mensagem de erro e «Try again» ficam abaixo da primeira tela; a capa escolhida no computador ainda mostra «+» e a lista mostra 2 de 4 álbuns sem rolar; mudar a ordem só arrastando. São limites do nível (a mesma estrutura de hoje): o Elevar resolve os três.
- Transformar: «change the order» não abre nada e a base não tem ✕ por álbum; um álbum vindo da lista colada não sai. É uma peça não desenhada desta rodada; entra se você escolher o Transformar.
- P2: dois passos «02» no Consolidar; o degradê do fogo em «Scan» e em «Create series» ao mesmo tempo (dois destaques); a margem de 32 px no celular; o laranja claro `#fb923c` em rótulos e links e o terceiro tom `#fdba74` no degradê do equalizador, fora do par declarado (`#f97316 → #dc2626`): você aprova ou corta esse tom; mono a 11 px no Elevar; a base do Transformar corta o nome e cobre a última fileira.
- Não visto em imagem pelo crítico: buscando, discografia, colando e não encontrado (julgados pelo código); a fila da máquina estava ocupada.
