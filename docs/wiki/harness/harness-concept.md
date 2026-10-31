---
title: Harness — o conceito
aliases: [harness-concept, harness engineering, agentic harness, o que é harness, user harness, system harness, anatomia do harness]
summary: o que o campo chama de harness — cinco fontes, onde elas convergem, onde discordam, e a posição que o MJRP adota
tags: [harness, fundamento, conceito]
status: firme
atualizado: 2026-09-11
fontes: [google-cloud-tech-what-is-an-agentic-harness, cloud-x-berry-agent-harness-6min, don-woodlock-what-is-harness-engineering, fernanda-kipper-harness-alem-do-claude-md, quintanilha-o-que-e-harness]
---
<!-- kernel do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O **harness** é tudo o que envolve o modelo para transformá-lo em agente: as ferramentas, o loop
que o executa, e o mecanismo que avalia se ele terminou. Não é o modelo, não é o prompt, e —
segundo a fonte canônica — **não é a interface**.

## What it is

### A definição canônica

Google Cloud Tech, *"What is an Agentic Harness?"*, é a formulação mais enxuta do campo:

> "the harness is everything after the LLM — the harness is how do you give it tools, the harness
> is what programming do you have that's running it in the loop, what programming do you have that
> is evaluating the output of the LLM to determine if it completed its task or not."

E o fecho, que é o verbete: **"all that stuff you put around an LLM to turn it into an agent"** —
com a ressalva explícita **"which doesn't have to be a lot"**. O harness não se define por tamanho.

A definição de agente que ela pressupõe é a do Simon Willison: *um LLM com ferramentas rodando num
loop para atingir um objetivo*.

### A tese que separa harness de interface

É a contribuição mais distintiva da fonte canônica, e **nenhuma das outras quatro a formula**:

> "if you decouple the harness from the interface — the important piece here is how we control the
> logic and the behavior of the LLM, and then you can swap in what interface the user prefers."

Consequência: Claude Code, Antigravity e Codex são harnesses; suas UIs são intercambiáveis. E
existem casos de uso sem interface nenhuma — só uma interface programática para um agente autônomo,
com o mesmo harness por trás.

### Quatro definições complementares

| Fonte | A formulação | O que ela acrescenta |
|---|---|---|
| **Cloud X Berry**, *Agent Harness Explained in 6 Minutes* | *"the software system built around the AI model — tools, prompts, context management, memory, execution environments, safety rules, and orchestration logic"* | O loop em quatro tempos: **think, act, observe, adjust**. E a **governança** como peça nomeada — a única fonte que usa a palavra: o harness define o que o agente pode fazer sozinho, o que exige aprovação humana, e a que recursos tem acesso |
| **Don Woodlock**, *What Is Harness Engineering?* | *"providing an environment for an agentic AI experience to work"* | A **genealogia** do termo (abaixo) e as **skills** como peça estrutural: em vez de explicar todo cenário no prompt, *"I have a directory of skill files — check the skill files, read the relevant skill and use that as part of your agentic loop"* |
| **Fernanda Kipper**, *Harness Engineering é muito mais que CLAUDE.MD* | *"toda a camada de aparatos, de ferramentas, de framework, de técnicas que eu vou colocar em volta desse modelo"* | A distinção **user harness × harness da ferramenta** (abaixo) e a anatomia de um *agent run* como pipeline sequencial, não como lista de peças |
| **Rafael Quintanilha**, *O que é Harness e por que ele muda tudo* | *"a infraestrutura onde o seu modelo vai operar"* · **Agente = Modelo + Harness** | A frase-limite — **"se você não é o modelo, então você é o harness"** — e o dado: *"o agente de programação saiu do top 30 para o top 5 no benchmark mudando apenas o harness"* |

### User harness × harness da ferramenta

A distinção é de **propriedade e visibilidade**, não de natureza — as duas camadas são igualmente
harness. Fernanda Kipper:

> "todas essas estratégias — skills, agents.md, rules, hooks — na verdade vão compor **somente a
> parcela do que a gente chama de user harness**, que é o harness que nós usuários conseguimos
> manipular. Mas o harness vai muito além disso: também tem **essa camadinha que a gente acaba não
> enxergando, que é o harness feito pelas ferramentas** de agentic coding."

E a consequência prática: **controle é um espectro, não um binário.** Ela escalona três níveis —
controle alto (OpenCode, onde você escolhe a observabilidade e injeta a própria memória episódica),
controle baixo (Cursor: *"eu vou ser só o usuário final e vou ter controle só sobre essa parte de
user harness"*), e o meio-termo (Codex, Claude Code: *"eu não sou responsável por tudo, mas tenho
flexibilidade para adicionar guardrails, policies"*).

**Escolher a ferramenta é, em si, uma decisão de harness engineering** — porque é ela que move a
linha entre o que você escreve e o que você herda.

### A genealogia — Prompt → Context → Harness

Don Woodlock traça em três fases, datadas por duração relativa ao lançamento do ChatGPT:

| Fase | Duração que ele dá | Objeto de trabalho |
|---|---|---|
| **Prompt Engineering** | *"the first year"* | user prompt + system prompt; checklists de como pedir |
| **Context Engineering** | *"about a year"* | RAG, dados privados, o que cabe na janela |
| **Harness Engineering** | *"finally, we're in a phase"* — em curso | tool loop, tools/MCP, skills, memória, hooks |

O fio condutor, na frase dele: *"the purpose of all this is getting the most out of an LLM."*

### Onde as fontes discordam

- **Infraestrutura ou lógica de controle?** Quintanilha traduz harness como **infraestrutura** — o
  que dá sustentação. Google Cloud Tech insiste em **lógica de controle**: *"how we control the
  logic and the behavior of the LLM"*. Não é contradição, mas aponta projetos opostos: um leva a
  "dê melhores recursos ao modelo", o outro a "controle programaticamente quando ele para".
- **Harness inclui a interface?** Google Cloud Tech diz **não**, categoricamente. Kipper diz **sim,
  na prática** — para ela, Claude Code, Cursor e Codex *são* harnesses, produto inteiro. Se harness
  é produto, trocar de Cursor para Claude Code é trocar de harness; se é a lógica sob a interface,
  o mesmo harness serve CLI, IDE e agente autônomo.
- **Harness × context engineering.** Três topologias incompatíveis: **sucessão temporal** (Woodlock
  — context engineering é a fase anterior, encerrada), **contenção** (Kipper — o context assemble é
  a primeira etapa *dentro* do harness) e **vizinhança disputada** (Quintanilha — *"compactação faz
  parte do harness, isso não é context engineering"*).
- **Onde começa o harness?** Quintanilha põe o piso baixíssimo: uma interface de chat que anexa a
  mensagem anterior *"já é uma espécie de harness"*. Cloud X Berry põe alto: o produto que só manda
  o prompt e devolve a resposta é o contraexemplo, o produto *sem* harness.
- **Modelo e harness são independentes?** Woodlock afirma que sim — *"the LLM is still the same in
  all these cases"*. Quintanilha nega: Claude Code e Codex são **pós-treinados com o harness onde
  vão rodar**. E complica o próprio ponto ao citar que *"Opus no Claude Code tem resultado bem
  abaixo do que o mesmo Opus em outros harnesses"*.

## How MJRP uses it

O MJRP adota a definição canônica — **harness é o entorno do modelo, não o modelo nem o prompt** —
e estende com três posições próprias:

1. **As onze peças** ([[harness-elements]]) são a enumeração do MJRP: loop, ferramentas, guides,
   context engineering, memória, ambiente de execução, sensores, governança, guardrails,
   observabilidade e orquestração. Nenhuma fonte lista as onze; a lista é a síntese delas.
2. **O MJRP constrói só o user harness.** O system harness — loop do turno, compactação, sistema de
   permissão, memória interna — pertence à Plataforma. É uma das linhas dos [[project-profiles|
   quatro domínios]], e a consequência prática está no `VISION.md`: a memória tem que viver em
   arquivos no repositório, ou deixa de ser portátil entre ferramentas.
3. **T1–T4** — as quatro condições necessárias para algo ser harness são critério do MJRP, não
   do campo. O T4 é o que a literatura não formula: *pedido não é regra*. **A régua mora no
   `PRINCIPLES.md`**, no preâmbulo da Parte II — ela não envelhece. O que envelhece é a nota do
   MJRP contra ela, e é esta:

| | Condição | Onde o MJRP está — **2026-09-16** |
|---|---|---|
| **T1** | Loop de execução | **Emprestado**, por decisão declarada. O loop do turno é da Plataforma (system harness); o `loop.py` é o loop **da tarefa**, e esse é do MJRP |
| **T2** | Interface de ferramenta | **Parcial.** Os MCP conectados dão chamada real (tools-catalog); as skills continuam sendo guia, não interface. JIRA e ClickUp esperam credencial |
| **T3** | Gestão ativa de contexto | **Parcial, mas com mecanismo.** Deixou de ser só prosa: `layer0_budget_chars` e `now_max_lines` no contrato, F1 medindo, kernel carimbado. Falta descarte automático |
| **T4** | Mecanismo que não dependa do modelo cooperar | **Existe.** Era *"ausente — 9 gates em markdown, zero CI"* em 11/09. Hoje: `doctor` com 20 checks, hooks `SessionStart`/`Stop`, `loop.py` que **recusa** começar sem `--until` |

> **A avaliação anterior vivia na `harness-evolution-proposal.md` § 4**, documento de *plano*. Ficou
> um mês desatualizada sem que nada acusasse — o T4 já existia e a régua ainda o dava como ausente.
> Por isso ela passou a morar aqui, na página do assunto, com data (ADR-0008).

**Onde o MJRP diverge do campo:** as fontes descrevem harness como aquilo que **aumenta a
capacidade** do modelo. O MJRP acrescenta o eixo que falta — o harness também **restringe**: é o
que garante que o erro seja pego por mecanismo, não pela sorte de alguém reparar. Sensor e
guardrail não aparecem em três das cinco fontes, e são metade do que o `doctor` faz.

## History

- **2026-09-11** · Página criada a partir da mineração do acervo de transcrições, a pedido do
  MJRP. Cinco fontes: a canônica da Google Cloud Tech e as quatro da série *Harness and agentic
  AI*. O corpus vive fora deste repositório — ver external-locations.
