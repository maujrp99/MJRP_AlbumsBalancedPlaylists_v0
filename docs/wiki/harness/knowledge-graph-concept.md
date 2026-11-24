---
title: Knowledge graph e ontologia — o conceito
aliases: [knowledge-graph-concept, knowledge graph, grafo de conhecimento, ontologia, ontology, taxonomia, taxonomy, vocabulário controlado, tripla, triple, RDF, grafo de propriedades, property graph, schema, SHACL, aresta tipada, typed edge]
summary: o que é um knowledge graph, o que é ontologia e como ela difere de taxonomia e vocabulário controlado; tripla, RDF × grafo de propriedades, schema × instância, e validação por formas
tags: [kernel, conceito, grafo, dados, ontologia]
status: vivo
atualizado: 2026-10-09
fontes: [2021-hogan-et-al-knowledge-graphs, 1993-gruber-portable-ontology-specifications, 1998-studer-benjamins-fensel-knowledge-engineering, 2017-w3c-shacl]
---
<!-- kernel do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
Um **knowledge graph** é um grafo de dados sobre um domínio: os **nós** são as entidades de interesse e as
**arestas** são as relações entre elas. A **ontologia** é a especificação formal, explícita e compartilhada de como
esse domínio é visto — os tipos de nó, os tipos de aresta e as regras entre eles. O grafo são os dados; a ontologia
é o que diz quais dados podem existir e como se ligam.

## What it is

### Knowledge graph
Hogan et al. (2021), a revisão de referência do campo, adotam uma definição deliberadamente inclusiva: *"a graph of
data intended to accumulate and convey knowledge of the real world, whose nodes represent entities of interest and
whose edges represent relations between these entities."*

- **Nó (entidade):** uma coisa com identidade própria — no harness, um requisito, um épico, uma release, uma task.
- **Aresta (relação):** a ligação entre dois nós. **Aresta tipada** é a que tem nome, direção, tipos de origem e
  destino permitidos e cardinalidade: `TASK-03 —implements→ REQ-01` diz *como* os dois se relacionam e pode ser
  conferida; um link comum diz só que se relacionam.
- **Tripla:** a forma mínima de um fato no grafo — sujeito, predicado, objeto (`S-07 · epic · EP-01`).

### Dois modelos de dados

| | RDF (grafo dirigido rotulado) | Grafo de propriedades |
|---|---|---|
| Unidade | a tripla | nó e aresta com atributos |
| Atributo de um nó | vira outra tripla | fica dentro do nó (`status: Ready`) |
| Onde aparece | web semântica, Wikidata, padrões W3C | bancos de grafo; frontmatter de nota |
| No harness | não usado | **o modelo adotado** — atributos no frontmatter, tipo na aresta |

### Schema × instância
O **schema** diz o que pode existir (todo requisito tem um épico); a **instância** é o que existe (`S-07` pertence ao
`EP-01`). A ontologia é a forma mais rica de schema. A **identidade** é o que faz um nó ser reconhecido sempre igual
— no harness, o ID estável que abre o nome do arquivo (`S-07-import-the-card-statement.md`) e está no `id:` e
no `aliases:` do frontmatter. O slug depois do ID é só para o humano ler; nasce com o nó e não muda sozinho.

### Ontologia
- Gruber (1993): *"An ontology is an explicit specification of a conceptualization"* — e conceitualização é *"an
  abstract, simplified view of the world that we wish to represent for some purpose."*
- Studer, Benjamins e Fensel (1998) refinam: *"a formal and explicit specification of a shared conceptualization."*
  **Formal** — legível por máquina. **Explícita** — tipos e restrições declarados. **Compartilhada** — aceita pelo
  grupo, não de um só.

Não existe ontologia neutra: ela recorta o mundo **para um propósito**. A do harness existe para o PDLC.

### Ontologia × taxonomia × vocabulário controlado
Três vizinhos que se confundem:

| | O que tem | Exemplo no harness |
|---|---|---|
| **Vocabulário controlado** | só termos e definições | `terms.md`, o glossário |
| **Taxonomia** | termos em hierarquia "é um" (is-a) | os arquétipos de skill; as naturezas `docs/ reports/ design/ data/` |
| **Ontologia** | tipos, relações de vários tipos e restrições | [[requirements-graph]]: nós, arestas tipadas, cardinalidade |

Uma taxonomia só sabe "é um"; uma ontologia sabe "implementa", "aponta para", "substitui" — e as regras de cada uma.

### Validação por formas
O padrão do mercado para conferir um grafo contra sua ontologia é o **SHACL** (W3C, 2017): *"a language for validating
RDF graphs against a set of conditions."* Uma *forma* declara que nós de um tipo devem ter certas arestas, com certa
cardinalidade; o validador devolve o que não conforma. O sensor do grafo de requisitos faz o mesmo papel, sem RDF:
regras por tipo de nó, relatório do que não conforma.

### Não confundir
- **Graph engineering** é o grafo de **comportamento** do agente; knowledge graph é o grafo de **dados**
  ([[graph-engineering-concept]]).
- **Graph RAG** é usar um knowledge graph como fonte de recuperação para um modelo — um uso possível do grafo, não o
  grafo.

## How MJRP uses it
- A documentação do PDLC é tratada como knowledge graph: [[requirements-graph]] é a ontologia (tipos de nó, arestas,
  cardinalidade) e os arquivos em `docs/specs/` são a instância.
- Grafo de propriedades em markdown: atributos e arestas no frontmatter, legíveis por script e pelo Obsidian
  ([[linked-notes-concept]]).
- A ontologia mora no kernel porque precisa ser **compartilhada** (Studer et al.): todo projeto recebe a mesma.

## History
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: a identidade do nó é o ID que abre o nome do arquivo (`<ID>-<slug>.md`, com `id:` e `aliases: [<ID>]`), não mais o nome inteiro — a regra nova de nome dos requisitos ([[requirements-graph]]).
- **2026-10-04 11:34** · Página criada na S-63 a pedido do MJRP: o kernel usava "ontologia" e "aresta tipada" sem
  defini-los. Fontes fichadas: Hogan et al. (2021), Gruber (1993), Studer et al. (1998), W3C SHACL (2017).
