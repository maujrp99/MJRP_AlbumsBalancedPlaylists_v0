---
title: Graph engineering — o conceito
aliases: [graph-engineering-concept, graph engineering, grafo, fan-out, join, router, swarm, agent swarm, loop engineering, nó, node, aresta, edge, estado compartilhado, shared state]
summary: o fluxo do agente como grafo — os três padrões, a comparação loop × graph × swarm, e a pergunta única que escolhe entre eles
tags: [harness, orquestracao, fundamento, conceito]
status: firme
atualizado: 2026-09-11
fontes: [google-cloud-tech-graph-engineering-101, ibm-agentic-ai-frameworks-explained, google-cloud-tech-ai-agents-explained]
---
<!-- kernel do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
**Graph engineering** é desenhar o fluxo do agente como um **grafo** — um organograma de nós e
arestas — em vez de um loop único. Cada nó pode ser um agente ou uma **função determinística**, e o
engenheiro define de antemão o que acontece em cada passo. Enfatiza **comportamento**: o que entra,
em que ordem, e o que vem depois.

## What it is

### A definição canônica

Google Cloud Tech, *Graph Engineering 101*:

> "Graph engineering is you're creating a graph workflow in the system. The graph can be something
> like an organizational chart. And inside of this graph, **each node can be an agent node, it can
> be a function node — which can be deterministic logic** — and then you're basically creating this
> graph in the system to solve the problem."

A mesma fonte encaixa os três termos que vivem juntos e se confundem:

| | O que é |
|---|---|
| **Harness** | *"everything around the model, including its tools, memory, and guardrails"* |
| **Loop** | *"the cycle that agent is running inside that harness"* — o LLM raciocina, decide, escolhe ferramenta, até bater a meta |
| **Graph** | *"the organization chart"* — contém nó-agente, nó-função, e mais |

### Não confundir com knowledge graph

A desambiguação é explícita e vale o verbete inteiro:

> "A lot of terminology has 'graph': graph engineering, Graph RAG, knowledge graph. But **knowledge
> graph emphasizes the data, and graph engineering emphasizes the behavior** — basically what goes
> in, in what order, and then what happens next."

E o enquadramento que a própria fonte aceita: *"it sounds like we're taking basic principles of
control flow and applying them to AI engineering."*

### Os três padrões — e eles são um fluxo, não um catálogo

A fonte não apresenta os três em abstrato: apresenta **um exemplo real — o PR review automatizado**
— e os três são as três partes dele, nessa ordem. A condição de entrada é a chave:

> "because you already know exactly how to do the PR review, **you know the workflow ahead of
> time**."

| Padrão | O que é | No exemplo |
|---|---|---|
| **Fan-out** | dispara N processos **em paralelo** | cinco coletas paralelas das informações do PR. Justificado por **latência**: *"much faster than running them one after another"* |
| **Join** | nó que **espera o mais lento** e **sintetiza** os resultados | *"it's waiting for the slowest of processing and then synthesizes the results"* — é o ponto de sincronização, e o gargalo |
| **Router** | roteia **por condição** para sub-agentes, especialistas ou outros workflows | *"if the code fails, we go to the specialized fixer agent; if the code passes, we go to the **human approval** processing"* |

Duas coisas a notar no router do exemplo: a **aprovação humana é um nó do grafo**, não algo fora
dele; e a analogia que a fonte usa é o router de servidor — URL casa com página.

Forma canônica: `fan-out → join → router`.

### Loop × graph × swarm — dois eixos diferentes

**Não colapse os dois.** O eixo loop × graph é **complexidade**; o eixo graph × swarm é
**definibilidade do problema**.

| | **Loop** | **Graph** | **Swarm** |
|---|---|---|---|
| Forma | um ciclo rodando até bater a meta | nós e arestas definidos pelo engenheiro | agentes com personalidade própria, sem estrutura |
| Quem define o caminho | o próprio loop, a cada volta | **o engenheiro, de antemão** | ninguém — *"you just throw the problem to them"* |
| Pré-condição | objetivo simples e verificável | **você já conhece o workflow** | problema **ambíguo** |
| Ganho | simplicidade | **previsibilidade, depurabilidade, controle** | flexibilidade |
| Exemplo da fonte | *"um resumo de um parágrafo"* | o PR review | — (nenhum exemplo concreto é dado) |

A passagem mais densa, sobre por que o grafo dá controle:

> "In graph engineering, **you as the engineer define each node**, what happens at each step, how
> the data looks. And also, **an agent that is at a certain node doesn't need to know what happened
> before**. This whole thing gives you really good predictability, debuggability, and control **for
> problems that can be strictly defined**."

Essa **localidade de contexto** — o nó não precisa saber o que veio antes — é o que torna cada nó
testável e substituível. É o mesmo mecanismo que o vídeo *AI agents explained* usa ao expor cada
loop como **tool** do agente-raiz: *"this is what lets the root agent call them directly without
worrying about what's happening inside"*.

**A pergunta única de decisão:** *você conhece o workflow de antemão?* Sim e complexo → grafo. Sim
e simples → loop. Não → swarm.

### O que o estado compartilhado faz

O que atravessa o grafo é **estado**, não mensagem:

> "if you build a multi-agent system, we have **shared state** among different agents. If you build
> a workflow, we have shared state among nodes in this workflow as well."

Na prática (ADK): um nó grava sob uma chave (`output_key`), o próximo lê por essa chave. *"Whatever
this agent writes will be stored in shared state under that name, so that the next agent can pick
it up automatically."*

### O que o campo NÃO diz — lacunas registradas

Para não virar invenção depois:

- **Não existe contraindicação explícita ao grafo.** Nenhuma fonte diz *"não use grafo quando…"*,
  nem discute custo de construção, overhead ou rigidez como problema. Os critérios negativos são
  só a contrapositiva dos positivos: problema ambíguo, workflow desconhecido, ou simples demais.
- **Aresta não é definida.** A fonte cita *"different nodes and different edges"* uma vez e não
  desenvolve. Tipos de aresta, condicionais, pesos: nada.
- **Ciclo dentro de grafo não é tratado.** Loop e graph aparecem como abordagens **paralelas e
  contrastantes**, nunca como composição — apesar de o exemplo do ADK ser exatamente um loop
  encapsulado num nó.
- **A IBM não usa o termo.** Ela posiciona LangGraph como o degrau acima do LangChain e como opção
  de produção *"for well-structured, multilayered applications"*, e para por aí — não fala de nós,
  arestas, estado nem ciclos.
- **Nenhum número.** Nenhuma fonte apresenta métrica, benchmark ou latência medida.
- **Falha parcial no fan-out** — o que acontece se um dos cinco ramos morre — não é abordado.

## How MJRP uses it

- **Os três padrões já estão no vocabulário do MJRP** como *fan-out / join / router*, e a forma
  deles é a das **rotinas de manutenção** — ver o diagrama nº 6 em `docs/diagrams.md`.
- **Grafo entra na manutenção, não na sessão.** A decisão do MJRP é que o fluxo da sessão é humano
  ou orquestrador (`orchestration:` no contrato); o grafo serve o que roda sozinho e repetido.
- **A pergunta de decisão da fonte é a mesma do contrato.** *"Você conhece o workflow de antemão?"*
  é o que o campo `orchestration:` responde: `assisted` quando o humano roteia porque o caminho
  ainda não é conhecido; `autonomous` quando ele é.
- **A localidade de contexto valida a arquitetura de memória.** *"O agente no nó não precisa saber
  o que aconteceu antes"* é a justificativa técnica do progressive disclosure do MJRP
  ([[context-vs-memory]]): cada etapa carrega o mínimo, e o estado atravessa por ponteiro.

**Onde o MJRP diverge:** a fonte trata o **nó-função determinístico** como uma opção entre outras.
No MJRP é o contrário — é a peça que resolve o T4, *o mecanismo que não depende do modelo cooperar*.
Um grafo cujos nós são todos agentes não tem determinismo nenhum; é swarm com desenho.

## History

- **2026-09-11** · Página criada a partir da mineração do acervo — *Graph Engineering 101* (Google
  Cloud Tech) como fonte canônica, mais IBM Think e *AI agents explained*. O corpus vive fora deste
  repositório, em external-locations.
