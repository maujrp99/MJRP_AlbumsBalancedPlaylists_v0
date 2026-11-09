---
title: Notas ligadas (o modelo "Obsidian-like") — o conceito
aliases: [linked-notes-concept, obsidian-like, modelo obsidian, notas ligadas, networked notes, networked thought, PKM, evergreen notes, notas atômicas, Zettelkasten, LYT, MOC, map of content, backlink, transclusão, transclusion, embed, wikilink, block reference, digital garden]
summary: o modelo de notas atômicas e densamente ligadas que o Obsidian popularizou — de onde vem, os nomes que ele tem, os mecanismos (wikilink, backlink, embed, block ID, MOC) e como o harness o usa como a leitura humana do grafo
tags: [kernel, conceito, grafo, obsidian, notas]
status: vivo
atualizado: 2026-10-09
fontes: [2020-matuschak-evergreen-notes, 2020-milo-linking-your-thinking-maps-of-content, 2026-obsidian-help-internal-links, 2026-04-04-karpathy-llm-wiki]
---
<!-- kernel do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O modelo **"Obsidian-like"** é organizar conhecimento em **notas atômicas e densamente ligadas**, em arquivos de texto
simples, navegadas pelos links entre elas e não pela hierarquia de pastas. Não tem um nome oficial único: é a tradição
das notas ligadas — wiki, Zettelkasten, *evergreen notes* — com o Obsidian como a ferramenta que a popularizou. No
harness, é a **leitura humana** do mesmo grafo que o agente lê por script ([[knowledge-graph-concept]]).

## What it is

### Os nomes, e o que cada um cobre
| Nome | O que nomeia |
|---|---|
| **Wiki** | uma página por conceito, ligada pelo nome — a origem do `link` |
| **Zettelkasten** (Luhmann) | o método: uma ideia por nota, notas ligadas entre si — a linhagem mais citada *(sem ficha ainda)* |
| **Evergreen notes** (Matuschak) | a formulação moderna: nota atômica, orientada a conceito, densamente ligada |
| **PKM / networked thought** | a categoria de ferramentas (Obsidian, Roam, Logseq) e o campo |
| **LYT e MOC** (Milo) | o framework mais associado ao Obsidian: notas-mapa que organizam por ligação |
| **Digital garden** | o jeito de publicar notas ligadas na web |
| **LLM Wiki** (Karpathy) | a variante para agentes — *"Obsidian is the IDE, the LLM is the programmer, the wiki is the codebase"* — que a wiki do harness segue |

### Os princípios (Matuschak)
*"Evergreen notes are written and organized to evolve, contribute, and accumulate over time, across projects."*
Atômicas; orientadas a conceito; densamente ligadas; *"prefer associative ontologies to hierarchical taxonomies"* —
associação acima de hierarquia, que é a ponte com [[knowledge-graph-concept]].

### Os mecanismos
- **Wikilink** `nota` — a aresta, sem tipo.
- **Backlink** — a aresta de volta, calculada pela ferramenta: escreve-se uma direção, a outra aparece sozinha.
- **Embed (transclusão)** `!nota` — o conteúdo de uma nota mostrado dentro de outra, sem cópia.
- **Link a heading** `nota#Heading` — depende do texto exato do heading; quebra quando ele muda.
- **Block ID** `nota#^id` — âncora estável para um parágrafo ou item; só letras latinas, números e hífen.
- **MOC (map of content)** — *"a cluster of information that maps 'things' in context with other 'things'"*: uma
  nota-índice que organiza por link, não por pasta.
- **Graph view** — o desenho dos nós e links; no Obsidian nativo, as arestas aparecem sem tipo.

### O limite do modelo
Notas ligadas dão navegação e associação, não **verificação**: um wikilink não diz que tipo de relação é nem se ela
é permitida. Por isso o harness soma a ontologia ([[knowledge-graph-concept]]) — o tipo da aresta no frontmatter e
um sensor que confere. Renomear no Obsidian atualiza os links, mas a edição do agente no disco não dispara isso:
para o agente, a âncora tem de ser estável por construção: o nome do arquivo começa pelo ID e o slug é congelado ao
nascer (`S-07-import-the-card-statement.md`). O link leva o nome inteiro, com o ID como texto
(`S-07`), porque o Obsidian resolve nome de arquivo, não alias; renomear é
operação explícita do agente (`req_file_names.py --reslug`), que reescreve os links.

## How MJRP uses it
- A wiki do harness é uma LLM Wiki: página por conceito, `link` entre páginas, `index.md` como MOC.
- O grafo de requisitos ([[requirements-graph]]) aplica o modelo à documentação do PDLC: um arquivo atômico por
  requisito, o `prd.md` como MOC que embute os requisitos por épico, block ID para estados de tela e releases.
- O vault pessoal `MJRPvault` e o site mjrp-lab (digital garden) seguem a mesma família de ideias, fora do harness.

## History
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: a âncora estável passa a ser o nome `<ID>-<slug>.md`, com slug congelado ao nascer, link com o nome inteiro e o ID como texto, e renomear como operação explícita (`req_file_names.py --reslug`).
- **2026-10-04 11:34** · Página criada na S-63 a pedido do MJRP: dar nome e definição ao modelo "Obsidian-like" que o
  grafo de requisitos usa. Fontes fichadas: Matuschak, Milo (LYT), Obsidian Help; Karpathy já estava fichado.
  Zettelkasten (Luhmann/Ahrens), wiki (Cunningham) e transclusão (Nelson) citados sem ficha — candidatos a fichar.
