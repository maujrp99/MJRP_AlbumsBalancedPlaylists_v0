---
title: Loop engineering — o conceito
aliases: [loop-engineering-concept, loop engineering, loop, agent loop, ralph loop, loop fixo, loop criador, critério de saída, stop condition, erros compostos, autoresearch, turn-based, goal-based, time-based, proactive]
summary: o loop como o que roda sem você — os 4 níveis, a matemática dos erros compostos, loop fixo × criador, e por que o gargalo é o verificador, não o modelo
tags: [harness, orquestracao, verificacao, fundamento, conceito]
status: firme
atualizado: 2026-10-07
fontes: [wiki/sources/2026-10-07-mjrp-loop-engineering-handbook.md, pasquadev-harness-e-loop-engineering, waldemar-neto-loop-engineering-500k-linhas, google-cloud-tech-graph-engineering-101, google-cloud-tech-ai-agents-explained, karpathy-no-priors-skill-issue, austin-marchese-karpathy-method]
---
<!-- kernel do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
**Loop engineering** é projetar o ciclo que roda **sem você**: o agente raciocina, age, observa e
ajusta até atingir um objetivo. Dentro de cada volta, o modelo escolhe a próxima ação; **se o loop
continua, para ou escala quem decide é o harness** — o verificador e as regras de parada, nunca o
auto-relato do agente (`PRINCIPLES.md` II.3). O harness é o carro; o loop é o piloto automático. E o
gargalo do loop **não é o modelo, é o verificador**.

## What it is

### As definições

> "harness engineering é o que você constrói ao redor do modelo, e loop engineering é **como isso
> roda sem você**. O harness é o carro e o loop é o piloto automático."
> — pasquadev, *Harness e loop engineering: por que importam mais que o modelo*

> "num cron job ou num `while` tu vai ter um **`if`** que decide se continua ou não. Num loop
> agêntico tu tem **o próprio modelo decidindo** se vai continuar — não é um `if`, é um modelo que
> interpreta e decide se segue ou não aquele passo."
> — Waldemar Neto, *Loop Engineering: 500 mil linhas migradas por IA. Deu certo?*

> "loop engineering, basically you have this **one running loop that keeps running until it's
> reaching the goal**."
> — Google Cloud Tech, *Graph Engineering 101*

A frase que abriu a moda, de Peter Steinberger (OpenClaw), citada por pasquadev: *"você não devia
mais estar promptando agentes de código — você devia estar **desenhando loops que promptam seus
agentes**."*

### A matemática dos erros compostos

É o argumento que justifica o campo inteiro. pasquadev:

> "imagina um processo com 10 etapas, e cada etapa tem 99% de chance de sucesso — é quase perfeito.
> Só que a probabilidade de todas as 10 darem certo é **90,4%**. Com 20 etapas, **81,8%**. Com 50
> etapas, **60%**. E os agentes são processos de muitas etapas — os erros **se compõem**."

E a consequência para o loop: *"se você tira o humano da frente e deixa isso rodando a noite
inteira, e o loop não tem um critério de sucesso objetivo — teste, build, benchmark — você não
construiu um Ralph loop, você construiu um Opala queimando gasolina, que é o agente queimando
token."*

As quatro formas de o harness atacar os erros compostos, segundo ele: **verificação** (o agente
checa o próprio trabalho antes de avançar — *"melhora o output de duas a três vezes"*, citando
Boris Cherny) · **checkpoints** (pontos onde um humano ou sistema verifica antes de continuar) ·
**menos ferramentas** (contraintuitivo: a Vercel *"removeu 80% das ferramentas e a performance
melhorou"*) · **contexto limpo**.

### O Ralph loop — a origem

> "em julho de 2025 o engenheiro australiano Geoffrey Huntley publicou uma técnica tão burra que
> parecia piada: **uma linha de bash** — pegar o prompt, mandar pro agente, e rodar em loop para
> sempre; se ele não terminou, roda de novo. Batizou de **Ralph loop**, em homenagem ao Ralph
> Wiggum dos Simpsons. E um ano depois a piada virou uma disciplina."
> — pasquadev

### Os quatro níveis — a escada da Anthropic

A cada nível, *"você entrega uma coisa a mais para o agente"* (pasquadev, sobre o guia *Getting
Started with Loops*):

| Nível | O que você entrega | Como roda |
|---|---|---|
| **1 · Turn-based** | cada prompt | o agente coleta contexto, age, checa, repete e responde — **você dirige cada turno**; é o que se faz hoje |
| **2 · Goal-based** | **a condição de parada** — *"roda até esses testes passarem, até o build compilar"* | *"o agente **não para quando ele acha que terminou** — para quando o critério objetivo é atingido"* |
| **3 · Time-based** | o **trigger** | roda no intervalo ou agendado, sem você presente |
| **4 · Proactive** | até o prompt | o sistema observa e decide o que fazer e quando |

O pré-requisito do nível 2, na letra dele: *"os testes escritos antes não são só a verificação —
também são a condição de parada. **Quem faz TDD já tem o pré-requisito; só falta apertar o
play**."*

### Loop fixo × loop criador

A distinção do Waldemar — *"a indústria ainda não tem nome para esses loops"*:

| | **Loop fixo** | **Loop criador** |
|---|---|---|
| O que é | loop **sem side effect** — *"a segunda execução não vai ficar pior por causa do resultado da primeira"* | loop que **gera coisa a partir do que gerou** — roadmap → implementação → novo roadmap, até construir uma aplicação inteira |
| Risco | baixo — *"esses nós são normalmente seguros"* | alto — *"quando tu gera algo com bug e gera coisas em cima, vai perpetuando o bug"* |
| Exemplo dele | benchmark de frameworks: planner → implementer → evaluator, *"ele sozinho controla todo o loop"* | o jogo MMO num fim de semana; a migração do Bun para Rust |
| Quando usar | **automações** | **migrações e construção** — *"para software enterprise com features, na maioria dos casos não vai ser necessário"* |

**O ciclo do loop criador:** *"pega uma tarefa, planeja, implementa, verifica (no meu caso, até
três vezes), atualiza o roadmap e pega o próximo item."*

**Por que o Bun→Rust funcionou:** *"esses loops funcionam bem porque têm uma **referência
sólida** — o Bun já tinha 1,3 milhão de asserções de teste; eles conseguiam migrar e validar."* E
por que Rust: *"o compilador não deixa compilar se tiver problema de memória. **Não tem harness
melhor, não tem sensor melhor.** A própria linguagem é harness, tipagem é harness, compilador é
harness."*

### O que sustenta um loop de dias

Waldemar, sobre o loop criador que rodou um fim de semana:

- **`roadmap`** — fases de alto nível, *"porque como eu tô criando algo, não tenho como planejar
  todas as fases sendo que a anterior tem que estar pronta"*. **O loop não cria o roadmap**; o
  humano cria — *"quem fala que o loop roda para sempre, não roda: ele roda **até que tenha uma
  próxima coisa para fazer**. Chega um momento que esgota, e aí o humano entra."*
- **`lessons.md`** — *"cada vez que ele passa por algo, toma uma decisão e aprende, ele coloca ali
  — assim **os próximos agentes não vão passar por esse problema**."*
- **`state`** e **`handoff`** — o que foi feito na fase e o que o próximo precisa saber: *"o loop
  autônomo tem que ter o contexto do que aconteceu, para onde as coisas estão indo, e as decisões
  que foram tomadas."*

### O loop de validação com retry

O mecanismo concreto, no *AI agents explained* (Google Cloud Tech): um **planner** gera; um
**checker** *"doesn't write anything new — it just checks"*, e responde **OK** ou **retry** com o
que falta; o **loop agent** roda planner → checker *"up to three times. This gives us a safety
net."* O checker não é o mesmo agente que escreveu — é o **verificador separado**.

### Karpathy — sair do loop

> "to get the most out of the tools you have to **remove yourself as the bottleneck**. You can't be
> there to prompt the next thing. How can you maximize your token throughput and **not be in the
> loop**? This is the goal."

O AutoResearch dele é um loop de nível 2 puro: *"here's an objective, here's a metric, here's your
boundaries of what you can and cannot do — and go."* Com o limite explícito: *"**if you can't
evaluate, then you can't auto-research it**."* E o aviso sobre loops autônomos sobre métricas:
*"there's going to be a lot of Goodharting — the system will overfit to those metrics."*

### O gargalo é o verificador

pasquadev: *"no loop, **o gargalo não é o modelo, é o verificador**."* E a tarefa candidata ao
primeiro loop: *"qual tarefa sua tem critério de sucesso **100% objetivo** — testes que passam,
build que compila, lint que zera?"*

Austin Marchese, sobre o método Karpathy: *"the only lever you have is the **verification lever**"*
— e três passos: critério de avaliação **antes**, um **segundo modelo como crítico**, e **sinal
externo** (o sistema de deploy). *"The verifier is the quality check station by the door."*

### Cuidados que as fontes registram

- **Teto de iterações**: três, em duas fontes independentes (Google ADK, Waldemar). O MJRP adotou três por task em 2026-10-13 (tinha cinco).
- **Loop que não converge, drift, custo** (Frank Coyle): *"loops can break, loops can drift as
  agents start talking to each other, and loops can cost you money — token counts crank up."*
- **Sem critério objetivo, não é loop** — é o Opala.
- **Suite de testes fraca perpetua erro** (Waldemar): *"se todo pull request tem que corrigir
  coisas, teu harness ainda não tá bom, e cada loop vai perpetuar erros."*
- **Antes de acelerar o loop, invista no verificador** (pasquadev): *"antes de trocar o modelo,
  investe no harness; antes de acelerar o loop, investe nos mecanismos de verificação."*

### As quatro perguntas antes de deixar rodar (Waldemar)

1. **O harness é bom?** — *"praticamente não revisa mais pull request; se tem problemas, use spec-driven até o harness ficar bom"*
2. **O feedback é rápido?** — *"se for lento, vai gastar um monte de token nos loops"*
3. **Tem stop condition confiável?** — *"algo que ele bata e diga: tem que parar e chamar o humano"*
4. **Tem backlog suficiente** para valer a pena deixar rodando em vez de você mesmo planejar e fazer?

### As cinco peças e as regras de parada (Garage Labs, IBM)

O handbook MJRP de Loop Engineering (ficha) fecha a anatomia:
**contrato** com "pronto" verificável por máquina · **ferramentas** do ambiente real · **estado externo** fora da janela ·
**verificador inviolável** e determinístico · **regras de parada e escalonamento**. As regras de parada são quatro, e o
teto de voltas é só uma: **teto de iterações**, **orçamento de tokens**, **detecção de falta de progresso** (o diff zerou por
N voltas) e **rota clara para o humano**. O ciclo da IBM — objetivo → ação → observação → ajuste — e o da Garage Labs —
*act → observe → decide → repeat* — diferem num ponto: no segundo, o *decide* é do harness.

**LLM como juiz:** evitar um segundo modelo como **juiz único** — modelos compartilham pontos cegos. Onde não existe
verificador determinístico (UX, conteúdo), o juiz é o humano, com o LLM de apoio (o juiz de UX do MJRP é isso).

## How MJRP uses it

- **O `loop.py` é um loop de nível 2** — goal-based: roda até o critério de saída (`--until`, um
  comando com exit code) passar, ou até o teto. E ele **nasceu com memória entre iterações**: a
  iteração que falha escreve a lição em [[harness-kaizen]] — é o `lessons.md` do Waldemar, com
  outro nome e antes de o vídeo dele sair.
- **O critério de saída do MJRP é a stop condition da escada.** O princípio II.4 — nenhuma tarefa
  começa sem critério de saída — é o pré-requisito do nível 2, escrito como invariante. E o hook
  `Stop` que bloqueia o fim do turno sem critério é a *"stop condition confiável"* da terceira
  pergunta do Waldemar.
- **A matemática dos erros compostos é a justificativa do `doctor`.** Cinquenta etapas a 99% dão
  60%; o sensor que roda em `SessionStart` é o *checkpoint* de pasquadev — o ponto onde um sistema
  verifica antes de o agente continuar.
- **Loop fixo × criador é a distinção que o candidato do PRD (ex-BACKLOG #21) pede** para o EP-05 (Autonomous): *"a fase H não
  distingue; muda o teto de iterações e o gate."* O Waldemar deu o vocabulário.

**Onde o kernel errava (corrigido em 2026-10-07 18:38):** a definição dizia, com Waldemar, que *o próprio modelo* decide se o loop continua. Contradizia o II.3 do `PRINCIPLES.md` e as fontes de 2026: o modelo decide a próxima ação; continuar, parar ou escalar é do harness. O `loop.py` tem as quatro regras de parada: o critério de saída (exit 0), o teto (exit 1), a falta de progresso — o que `--progress-cmd` mede, por padrão o `git diff`, não mudou em `--stale` passadas seguidas (exit 3) — e o orçamento de tokens (`--budget-tokens`; o uso que o agente relata em JSON, ou a estimativa de 4 caracteres por token, dita como estimada — exit 4). Parada por regra vira lição no kaizen.

**Onde o MJRP diverge:** as fontes tratam o roadmap como algo que **o humano regenera quando o
loop esgota**. O MJRP tem o roadmap como documento de fases com prova — e a prova de cada fase **é**
a stop condition do loop daquela fase. O roadmap não é insumo do loop; é o mapa dos loops.

## History

- **2026-10-13 09:58** · O teto do `loop.py` passa de 5 para 3 rodadas por task, alinhado às fontes; cada task registra `rounds::` e `model::` no `tasks.md` (ver [[pdlc-loops]]).

- **2026-10-07 20:37** · Onda F do PDLC em loops: o `loop.py` ganhou a falta de progresso (exit 3) e o orçamento de tokens (exit 4); a lacuna de 18:38 fechou. Selftest com os casos 6 a 7c.
- **2026-10-07 18:38** · Correção pela proposta do PDLC em loops: a decisão de continuar é do harness, não do modelo; as cinco peças e as quatro regras de parada (handbook de Loop Engineering: Garage Labs, IBM); LLM nunca como juiz único. Lacuna: o `loop.py` sem orçamento de tokens nem detecção de falta de progresso. Ver [[pdlc-loops]].

- **2026-09-11** · Página criada a partir da mineração do acervo, a pedido do MJRP, durante o
  brief do playbook. Fontes centrais: pasquadev e Waldemar Neto; complementos de Google Cloud
  Tech, Karpathy (No Priors) e Marchese. **Lacuna registrada:** a definição da IBM de loop
  engineering, que o glossário cita, **não está no corpus** — o vídeo *AI in the SDLC* não menciona
  loop. O corpus vive fora deste repositório — external-locations.
