---
title: Agente e agêntico — os conceitos
aliases: [agents-agentic-concepts, agente, agentes, agentic, agêntico, agentico, o que é um agente, subagente, agent team, react, skills vs mcp vs rag vs memory]
summary: o que o campo chama de agente, os padrões agênticos, os cinco tipos de sistema, a taxonomia skills/MCP/RAG/memória — e onde as fontes discordam
tags: [harness, agentes, fundamento, conceito]
status: firme
atualizado: 2026-09-11
fontes: [google-cloud-tech-ai-agents-explained, ibm-agentic-ai-frameworks-explained, ibm-skills-vs-mcp-vs-rag-vs-memory, ai-agent-building-series]
---
<!-- kernel do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
Um **agente** é software que não apenas responde: decide e age. Formalmente, na definição que a
Google Cloud Tech adota — *"sistemas com raciocínio, planejamento e memória, com autonomia
suficiente para adaptar-se e decidir em nome do usuário"*. **Agêntico** é o adjetivo do
comportamento: processo em estágios, decisão sob observação, ação sobre o mundo.

## What it is

### As definições, por fonte

> "At the simplest level, an agent is software that doesn't just answer, it can decide and take
> action. Instead of generating a single response like a traditional chatbot, it looks at your
> request, figures out what steps need to be taken, maybe calls an API, runs code, looks at the
> results, and then decides what to do next."
> — Google Cloud Tech, *AI agents explained*

A ancoragem é o paper **ReAct** (*Synergizing Reasoning and Acting in Language Models*): o ciclo
**reason → act → observe → adjust** é *"the foundation of how modern AI agents work"*.

A série *AI Agent building* converge, independentemente, em **três critérios**:

1. **Segue um processo, não responde a uma mensagem.** *"A chatbot gives you one reply per message.
   An agent moves through stages: it gathers context, forms a plan, executes step by step, reviews
   its own output, and adjusts."*
2. **Decide sob incerteza.** *"A chatbot will guess if it doesn't understand. A real agent stops
   and asks. That ability to reason through ambiguity, rather than just pattern matching to the
   most probable answer, is what separates an agent from a fancy autocomplete."*
3. **Pergunta antes de assumir.** *"A well-designed agent asks before it acts. It treats your
   initial request as a starting point for a brief conversation, not as a complete specification."*

### Os três níveis de uso de IA

Dois vídeos da série constroem a mesma escada, independentemente:

| Nível | O que é | O que marca a passagem |
|---|---|---|
| **1 · Chat** | pergunta e resposta, um turno | — |
| **2 · Builder** | você pede **artefato**, não informação; guia passo a passo | *"you stop asking questions and start asking Claude to make things"* — mas você continua sendo o diretor |
| **3 · Agêntico** | você entrega o **objetivo**, não os passos | *"you describe the goal and the AI figures out the steps on its own"* · *"You set the destination and the agent drives"* |

A metáfora: *"é a diferença entre microgerenciar um funcionário novo e confiar num experiente."*

### Os três padrões agênticos (Google Cloud Tech)

| Padrão | Como funciona | Trade-off |
|---|---|---|
| **Sequencial** | passo a passo, linha de montagem | *"predictable but rigid"* |
| **Reativo (ReAct)** | olha o estado atual e decide o próximo passo | *"flexible, but they don't plan ahead"* |
| **Deliberativo / planner** | pausa, esboça o plano, executa | para objetivos multi-passo com dependências |

O critério: *"It depends on the problem. For simple, predictable flows, sequential is fine. For
dynamic, reactive works better. And for multi-step goals with dependencies you want planning."*

### Os cinco tipos de sistema agêntico (IBM)

| Tipo | Natureza | Frameworks que a IBM associa |
|---|---|---|
| **Linear workflow** | sequência fixa, previsível; *"there isn't a need for multiple agents to collaborate"* | LangChain, LlamaIndex; LangGraph para setups complexos |
| **Autônomo / multi-agente** | dá-se o objetivo, o sistema descobre como; problema **aberto** | AutoGen, BabyAGI, CrewAI |
| **Baseado em papéis** | multi-agente, mas cada um **confinado ao seu papel** — *"working together, but with clear boundaries"* | CrewAI; AutoGen com estrutura |
| **Orquestração em produção** | integração profunda com APIs, bancos, workflows de negócio | Agent Framework (Semantic Kernel + AutoGen), LangGraph |
| **Prototipagem rápida** | validar a ideia, canvas drag-and-drop | LangFlow, Flowise |

E o critério que inverte a pergunta:

> "**Do not ask which framework is the best. Instead ask what kind of system am I trying to build?**
> If it's predictable, use a workflow approach. If it is exploratory, use the autonomous agents. If
> it needs teamwork, use role-based. If it's going into production, use production orchestration.
> And if you are testing ideas, use rapid prototyping tools."

### Skills × MCP × RAG × Memory — a taxonomia do conhecimento agêntico

A IBM abre negando a solução ingênua: *"just throwing context into the fire might not be the best
way to go"* — jogar tudo na janela deixa o agente *"get lost or go down dead ends"*.

| | O que é | Limite |
|---|---|---|
| **Agent Skill** | *"a set of instructions for doing one particular kind of task"* — procedimento **e julgamento** (inclusive quando parar e escalar para um humano), puxado por **progressive disclosure** | *"the skill can tell the agent to check the error rate, but the agent still can't reach the dashboard"* |
| **MCP** | conecta o agente **ao mundo externo**; o agente é o *host*, cada sistema fica atrás de um *server* | resolve acesso, não conhecimento |
| **RAG** | recupera de documentos, por busca semântica, **quando precisa** em vez de pré-carregar | os documentos foram postos lá **por uma pessoa** |
| **Memory** | o que o agente **aprendeu sozinho** e guardou; escreve de volta o que funcionou | a diferença para RAG é **de onde vem o conhecimento** |

E a regra de bolso, literal:

> "If it's knowledge that somebody has written down, that's **RAG**. If it's knowledge the agent
> picked up from experience, that's **memory**. If it's a procedure to follow, something repeatable,
> that is an **agent skill**. And if an agent needs to go look something up in the world, that can
> be **MCP**."

Os quatro não são exclusivos — *"maybe all of the above"*.

### Subagente × agent team

A única fonte que separa os dois conceitos é a série *AI Agent building*:

> "**Sub agents work independently and then send their individual result back to the main agent.
> Agent teams have a team lead** — maybe like a project manager — and it creates all of these
> different agents **and a shared task list**. The huge unlock is that individual teammates can talk
> to each other."

Três atributos definem um agent team: falam entre si · **sem o intermediário da sessão principal** ·
trabalham **em paralelo**. Se o processo é sequencial e cada passo depende do anterior, *"that
honestly might not even call for an agent team — maybe that's just sub agents"*.

As regras práticas que a fonte dá: **cada agente dono dos seus arquivos** (senão sobrescrevem o
trabalho um do outro) · **defina o entregável**, nada de vago · **nomeie o destinatário** da
mensagem · **3 a 5 teammates, não enxames de 10+** (é 10× mais caro) · **dê contexto completo**,
porque *"when the agents wake up, they have no context"*.

### Onde as fontes discordam

- **Autonomia é decisória ou arquitetural?** Google, Teacher's Tech e AI Master definem agente pelo
  **comportamento** — decide o próximo passo. Mikey Vibe exige **persistência**: *"an actual AI
  agent is a persistent system — it needs memory, tool access, automation, integrations"*. Pelo
  critério dele, um agente que roda, entrega e morre numa sessão não é agente.
- **O sequencial é agente?** Google diz sim (*"sequential agents"* é um dos três padrões). A IBM o
  aceita como o mais simples dos cinco tipos (*linear workflow*). A série de agent teams usa a
  sequencialidade como sinal de que **não** é caso de time.
- **"Agentic" qualifica o sistema ou o workflow?** Teacher's Tech desloca o substantivo: o agente é
  uma camada fixa (*"Layer two, the agent — this is just Claude Code itself. You don't program the
  agent"*), e o que merece o adjetivo é o **workflow**. Google e IBM aplicam ao sistema.
- **"Perguntar antes de agir" é constitutivo?** Duas fontes o põem entre os três traços
  definidores; Google não o menciona. A IBM o trata como **conteúdo de skill**, isto é,
  configurável — não como propriedade do agente.
- **Onde mora a inteligência?** *"The intelligence is in the instructions, not the technology
  stack"* (duas fontes, independentemente) × o peso no harness e no loop (Claude Managed Agents:
  compactação, caching, **verificador independente com janela de contexto limpa**).

**Nota de leitura:** dois vídeos da série *AI Agent building* são peças patrocinadas, e a definição
de agente neles é construída para justificar o produto do patrocinador. Vale ler sabendo disso.

## How MJRP uses it

- **O MJRP não tem nenhum agente ainda.** O verbete de *Agente* diz isso, e o **BACKLOG #20** é
  onde ele nasce. As skills que descrevem papéis são candidatas, não agentes: falta a composição
  modelo + ferramentas + contexto próprio.
- **Os padrões do campo mapeiam nos modos do contrato.** `orchestration: assisted` é o humano como
  roteador; `autonomous` é o agente orquestrador que lê o contrato e para nos gates. O grafo — o
  *como* rotear — é [[graph-engineering-concept]].
- **A taxonomia Skills/MCP/RAG/Memory já é a arquitetura do MJRP**, com outros nomes: skill é o
  procedimento (o `mjrp-skills/`), memória é o que o agente aprendeu e escreveu
  ([[memory-architecture]]), e a wiki é o RAG deliberado — documentos que **uma pessoa** pôs lá.
  O MCP é o que ainda não existe: o **#45** é a primeira conexão.
- **A regra dos 3 a 5 teammates e "cada agente dono dos seus arquivos"** é insumo direto para o
  #20, e a única do campo que já tem número.

**Onde o MJRP diverge:** nenhuma fonte trata **verificação por mecanismo** como parte da definição
de agente. Para o MJRP é o II.3 — *o agente não é o juiz; quem julga devolve 0 ou 1*. O mais perto
que o campo chega é o verificador independente dos Managed Agents, e ele é produto, não princípio.

## History

- **2026-09-11** · Página criada a partir da mineração do acervo — Google Cloud Tech, IBM Think e
  os 7 vídeos da série *AI Agent building*. O corpus vive fora deste repositório, em
  external-locations.
