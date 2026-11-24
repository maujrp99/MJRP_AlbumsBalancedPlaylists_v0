---
title: Loop engineering — o conceito
aliases: [loop-engineering-concept, loop engineering, loop, agent loop, ralph loop, loop fixo, loop criador, critério de saída, stop condition, erros compostos, autoresearch, turn-based, goal-based, time-based, proactive]
summary: o loop como o que roda sem você — os 4 níveis, a matemática dos erros compostos, loop fixo × criador, e por que o gargalo é o verificador, não o modelo
tags: [harness, orquestracao, verificacao, fundamento, conceito]
status: firme
atualizado: 2026-10-30
fontes: [wiki/sources/2026-10-07-mjrp-loop-engineering-handbook.md, pasquadev-harness-e-loop-engineering, waldemar-neto-loop-engineering-500k-linhas, google-cloud-tech-graph-engineering-101, google-cloud-tech-ai-agents-explained, karpathy-no-priors-skill-issue, austin-marchese-karpathy-method]
---
<!-- kernel do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

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

### O desenho do ciclo: cinco loops (v14)

!O PDLC do MJRP em cinco loops: Discovery, Design, Delivery, Release e Learn

O ciclo do produto é **cinco loops** dentro da moldura do harness (o desenho aprovado pelo MJRP em 2026-11-08; a fonte é
`design/diagrams/ways-of-working/2026-11-08-1135-pdlc-loops-v14.svg`, e o mesmo desenho é o card «O ciclo de vida» do Overview do Control
Center). O **Intake** põe cada demanda numa via — a padrão passa pela Discovery e pelo Design, a rápida comprime os dois, não os pula —; **Discovery**
(Explorar ⇄ Enquadrar, ↻ pivotar · iterar · avançar) e **Design** (Desenhar → Criticar → Ver na tela, ↻ uma volta por versão do protótipo)
terminam no portão «Pronto para construir»; o **Delivery** (Spec, Plano, Tasks, Executar/QA, com executor → juiz → integrador, ↻ falhou:
corrige) entrega ao **Release** (Homologação → Aceito → Deploy, ↻ a issue volta ao Intake · sem nada a ver: Fechado), de onde sai o
software pronto para usar; o **Learn** devolve o aprendizado ao harness. Discovery, Design e Delivery **andam ao mesmo tempo, em itens
diferentes** (a trilha dupla), e setas finas e tracejadas voltam um loop quando se aprende algo (do Delivery ao Design, do Design à
Discovery). As regras de cada loop estão no [[pdlc-loops]].

### Todos os loops do harness, e a eval de cada um

Cada loop tem o que gira, o critério em que **sai**, quem **julga** (o harness, nunca o auto-relato do agente: II.3) e a **eval** — o jeito
de avaliar que o julgamento usa. A coluna diz o que **há hoje**; onde a eval é só o olho do humano, ou ainda não existe, está escrito.
Os tipos de eval têm os nomes da seção «Evals» logo abaixo: **regras** (nota por código), **LLM como juiz**, **execução**, **humano** e
**red teaming**; as lacunas de cada um estão lá, «a revisar».

**Os loops do produto** (o que o harness constrói para o humano):

| Loop | O que gira | Quando sai | Quem julga | A eval |
|---|---|---|---|---|
| **Intake** | a demanda → a triagem: serve a qual resultado? qual via? | a demanda numa via, ou rejeitada com motivo | o humano aprova o brief (`mjrp-structuring-requests`) | **humano**: o brief reconhecido antes de qualquer trabalho; o retrabalho depois da entrega é o sinal de que a triagem errou. Não há eval automática da triagem |
| **Discovery** | Explorar ⇄ Enquadrar | a premissa mais arriscada decidida: avançar, iterar ou pivotar; a arquitetura enquadrada | o humano, com o crítico de arquitetura (LLM de apoio, nunca juiz único) | **LLM como juiz** (os quatro riscos como teste; a crítica da ADR por regra, P0/P1/P2) + **regras** (o sensor do grafo de requisitos) |
| **Design** | Desenhar → Criticar → Ver na tela, a cada versão do protótipo | o protótipo julgado sem P0 e aprovado, os requisitos Ready; sai pelo «Pronto para construir» | o juiz de UX (`mjrp-critiquing-ux-ui`) e o humano, que vê a tela | **LLM como juiz** (o cânone de design, por id) + **regras** (os sensores do inventário, W11, e do protótipo × info-arch × wireframes, W14) + **humano** (o olho na tela) |
| **Delivery** | Spec → Plano → Tasks → Executar/QA; executor → juiz → integrador | o verificador passa, o juiz (um por lote) sem P0, o integrador junta | o juiz, que não fez (`mjrp-ensuring-quality`, `mjrp-ensuring-sdd`, `mjrp-assessing-code-quality`) | **regras** (o `doctor` e os sensores, que dão 0 ou 1) + **execução** (os testes; a reconferência visual, que captura os dois lados e dá 0 ou 1 por regra) + **LLM como juiz** (a rubrica de qualidade); cada critério aponta o teste que o prova (`verified_by`) |
| **↳ Executar ⇄ Verificar** (aninhado no Delivery) | uma task: implementar ⇄ rodar o verificador | o `--until` dá exit 0, ou o teto de 3 rodadas, a falta de progresso ou o orçamento de tokens | o verificador, uma máquina (`loop.py`) | **regras** e **execução**: o código de saída do comando declarado; sem critério, o loop recusa começar (II.4) |
| **Release** | Homologação → Aceito → Deploy | Aceito (o OK do humano), ou Fechado pela reconferência independente; a issue achada volta ao Intake | o humano, no que há para ele ver, decidir ou de segurança; senão a reconferência independente | **humano** (ele usa o entregue) ou **LLM como juiz** (a reconferência independente: outro agente confere o entregue contra a evidência) |
| **Learn** | operar → medir → kaizen | a medida do resultado atingida (só o MJRP marca «alcançado») ou a lição na fundação | os sensores diários, o auditor e o humano | **regras** (o portão do Learn, `conformance_check.py --learn-gate`, e os sensores diários) + a **medida de produto** do `ROADMAP.md` |

**Os loops do harness** (o que o harness roda sobre si mesmo):

| Loop | O que gira | Quando sai | Quem julga | A eval |
|---|---|---|---|---|
| **O turno do agente** | um turno: `SessionStart` roda o `doctor` → o trabalho → o hook `Stop` | o critério de saída declarado e o `doctor` verde | o `doctor` e o `stop_gate.py`, que dão 0, 1 ou 2 | **regras**: os sensores do contrato; exit 2 diz que a medida não rodou, não que passou |
| **Juiz ⇄ conserto** | o juiz acha uma issue → o implementador a conserta → a conferência | a reconferência sem P0 (ou os testes e sensores verdes, se o conserto não toca trava, hook nem sensor) | a reconferência independente: um agente que não corrigiu | **LLM como juiz**, contra a evidência da issue, mais **regras**; o loop só fecha com o registro da reconferência |
| **O trem de integração** | um lote de ramos → o merge no trem → o juiz do lote | o trem verde na `main`, com o relatório do juiz | o juiz do lote e as travas do merge (`merge_train.py`, o `pre-merge-commit`) | **regras** (as travas: a visual, a «Priorizada», a UAT) + **LLM como juiz** (o relatório do lote) |
| **Kaizen** | o achado de um projeto → a lição → a regra, a skill ou o sensor | a lição virou mecanismo (um sensor ou uma regra), com o incidente nomeado | o humano; a regra do ADR-0002 (checagem nova exige incidente) | **regras** no fim (o sensor tem selftest) e **humano** na escolha; não há eval de quanto o kaizen melhora o harness |
| **Cascade e conform** | o kernel muda → o cascade leva ao filho → o conform confere | o `conformance_check.py` do filho verde, sem nota de migração pendente | o sensor de conformidade | **regras**: cada item do conform dá passou ou não passou |
| **A sincronia das skills** | a skill editada em `mjrp-skills/` → o `build_plugin.py` → o plugin → o `/reload-plugins` | `build_plugin.py --check` verde: o distribuído é o da fonte | o sensor do build | **regras**: a fonte e o derivado conferem |
| **O loop da skill** (`mjrp-crafting-skills`) | escrever a skill ⇄ rodar os cenários de eval dela | os cenários (`evals/scenarios.md`, ao menos três por skill) passam | a skill que a julga e, no fim, o humano | **execução** de cenários por skill, hoje à mão; **não rodam sozinhos nem trazem taxa de acerto** (a lacuna 2 da seção «Evals») |

**Onde o kernel errava (corrigido em 2026-10-07 18:38):** a definição dizia, com Waldemar, que *o próprio modelo* decide se o loop continua. Contradizia o II.3 do `PRINCIPLES.md` e as fontes de 2026: o modelo decide a próxima ação; continuar, parar ou escalar é do harness. O `loop.py` tem as quatro regras de parada: o critério de saída (exit 0), o teto (exit 1), a falta de progresso — o que `--progress-cmd` mede, por padrão o `git diff`, não mudou em `--stale` passadas seguidas (exit 3) — e o orçamento de tokens (`--budget-tokens`; o uso que o agente relata em JSON, ou a estimativa de 4 caracteres por token, dita como estimada — exit 4). Parada por regra vira lição no kaizen.

**Onde o MJRP diverge:** as fontes tratam o roadmap como algo que **o humano regenera quando o
loop esgota**. O MJRP tem o roadmap como documento de fases com prova — e a prova de cada fase **é**
a stop condition do loop daquela fase. O roadmap não é insumo do loop; é o mapa dos loops.

## Evals

> A pesquisa de 2026-10-30 por trás desta seção — `reports/research/2026-10-30-evals-for-agents.md`, 36 fontes acessadas nesse dia — foi pedida
> pelo MJRP («não coloque só o que eu passei»). Os rótulos entre colchetes, como `[anthropic-demystifying]`, são os do relatório; a lista
> com a URL e a marca de confiança de cada fonte (lida, busca, não confirmado) está no § 7 dele. O que é conta ou recomendação do agente que
> pesquisou diz «(do relatório)». Os fatos sobre o harness foram lidos no repositório em 2026-10-30.

### A definição

**Eval** é um teste de um sistema de IA: dá-se uma entrada e aplica-se uma lógica de nota, o *grader* `[anthropic-demystifying]`. Em agente, o que se
nota é o **estado final do ambiente** (a reserva existe no banco?), não a frase «reservado!». O vocabulário do campo:

| Termo | O que é |
|---|---|
| **Tarefa** (*task*) e **tentativa** (*trial*) | um teste com entrada e critério de sucesso; a tentativa é uma execução, e repete-se porque a saída varia |
| **Grader** | a lógica que dá a nota; uma tarefa pode ter vários |
| **Transcrição** (*trace*) | o registro completo: saídas, chamadas de ferramenta, raciocínio |
| **Resultado** (*outcome*) | o estado final do ambiente |
| **Eval suite** | o conjunto de tarefas que mede uma capacidade |
| **Eval harness** × **agent harness** | quem roda as evals × o andaime que faz do modelo um agente; avaliar um agente é avaliar os dois juntos |

No loop engineering, **a eval é o verificador**, e o verificador é o gargalo do loop `[loop-concept]`: o nível 2 (*goal-based*) é uma eval rodando em
laço, e o `doctor` e os demais sensores são eval de código. Karpathy dá a regra — «se você não consegue avaliar, não consegue fazer
auto-research» — e o aviso: o sistema sobreajusta à métrica (*Goodharting*); o análogo é o *grader* hackeável, que a Anthropic pede para blindar
`[anthropic-tools]`. Sem eval o time «voa às cegas»; a OpenAI chama a prática de *eval-driven development* e lista os anti-padrões: métrica
genérica, dado que não reflete o uso real, avaliação «por vibe», testar só depois do lançamento `[openai-best]`.

### Os tipos de eval

A ordem que as fontes recomendam: **regras primeiro, LLM onde precisar, humano para validar** `[anthropic-demystifying][openai-best]`.

| Tipo | O que é | Força e cuidado |
|---|---|---|
| **Regras** (nota por código) | casamento de texto ou regex, teste que falha antes e passa depois, análise estática, verificação do resultado e das chamadas de ferramenta | rápida, barata, objetiva, reproduzível; **frágil** a variação válida e sem nuance. Prefira formato que se corrige sozinho; **volume sobre qualidade** `[anthropic-demystifying][anthropic-docs-evals]`. Em classificação, precisão e revocação separadas, não acurácia `[yan-evals]` |
| **LLM como juiz** | um modelo dá a nota por uma rubrica | concorda com humano em **mais de 80%** dos casos, o nível de humano com humano `[zheng]`, mas o resultado é misto fora do chat, e a concordância costuma ser menor que a humano-humano `[yan-judges]`. Tem **vieses medidos** (abaixo) |
| **Execução** | rodar e olhar o estado: o teste passa? o arquivo existe? o banco mudou? | a nota mais forte para agente; **cada tentativa começa limpa**, ou o estado compartilhado correlaciona as falhas (um Claude leu o histórico do git das tentativas anteriores) `[anthropic-demystifying][anthropic-baa]` |
| **Humano** | especialista com rubrica, amostragem, A/B, concordância entre anotadores | o padrão-ouro e o que calibra o resto; caro e lento. «**Leia as transcrições**» `[anthropic-demystifying]`; remova o atrito de olhar os dados, com uma tela só e rótulo binário `[hamel-evals][hamel-field]` |
| **Red teaming e injeção de prompt** | o teste adversarial: entrada que muda o comportamento do modelo, **direta** (do usuário) ou **indireta** (em página, arquivo, e-mail, saída de ferramenta) `[owasp-llm01][greshake]` | é o item 1 (LLM01 *Prompt Injection*) e o item 6 (LLM06 *Excessive Agency*) do OWASP Top 10 for LLM 2025 `[owasp-top10]`; técnica própria no MITRE ATLAS, a AML.T0051, com as sub-técnicas direta, indireta e acionada `[d3fend-atlas]`; prática de medição no NIST AI 600-1 (MS-2.7-007) `[nist-genai]`. Mede-se utilidade e segurança juntas (AgentDojo: 97 tarefas e 629 casos de segurança) `[agentdojo]`. **Nenhuma defesa é à prova de falha**: o teste adversarial é parte da defesa `[owasp-llm01][anthropic-pi]` |

**Os vieses do LLM como juiz, e a mitigação.** As magnitudes vêm da síntese de Eugene Yan sobre os papers originais, não da leitura integral do paper
de Zheng (do relatório, § 6):

| Viés | O que é | Mitigação |
|---|---|---|
| **Posição** | favorece uma posição na comparação em pares (GPT-3.5 em ~50% dos casos, Claude-v1 em ~70% `[yan-judges]`; o Vicuna-13B «venceu» o ChatGPT em 66 de 80 consultas só pela ordem `[wang-position]`) | trocar a ordem e agregar; chamar o humano onde as ordens discordam `[wang-position]` |
| **Verbosidade** | prefere a resposta mais longa (mais de 90% nos modelos testados `[yan-judges]`) | controlar o tamanho; formato de par ou aprovado/reprovado, com rubrica clara `[openai-best][yan-judges]` |
| **Autopreferência** | nota maior para a própria saída ou a da sua família (GPT-4 ~10%, Claude-v1 ~25% `[yan-judges]`) | **juiz de outra família que o gerador** `[anthropic-docs-evals]`; **painel de juízes** (um painel de modelos menores superou o GPT-4 sozinho, a ~1/7 do custo `[yan-judges]`) |
| **Raciocínio limitado** | erra a matemática e a lógica que ele mesmo não resolveria `[zheng]` | nota por execução ou por regra onde houver resposta objetiva |

E, acima de tudo, **medir o juiz contra rótulos humanos**: juízo binário com crítica escrita do especialista, a concordância pela taxa de verdadeiro
positivo e de verdadeiro negativo **separadas** (a % bruta engana em classe desbalanceada), treino/desenvolvimento/teste, o juiz congelado rodado
uma vez no teste, e refazer quando o modelo mudar `[hamel-judge]`. O NIST pede o mesmo no nível do processo: avaliadores independentes de quem
desenvolveu (MEASURE 1.3) e a eficácia das próprias métricas avaliada e documentada (MEASURE 2.13) `[nist-rmf]`.

### As evals de agente

O que muda em relação à eval de modelo `[anthropic-demystifying][openai-best]`:

- **Resultado, não caminho.** Nota-se o que o agente produziu; checar a sequência exata de passos pune solução válida e criativa. **Trajetória e uso de ferramenta** ainda
  contam, como diagnóstico e nota parcial: casamento exato, em ordem ou em qualquer ordem, seleção de ferramenta e precisão dos argumentos `[google-adk][openai-best]`.
- **O erro se compõe pelas voltas:** 50 etapas a 99% dão ~60% `[loop-concept]`. Por isso a tarefa se repete, e há duas notas: **`pass@k`** (basta um
  acerto em k) e **`pass^k`** (os k acertam), a que importa quando se espera consistência. A 75% por tentativa, três tentativas todas certas dão ~42%
  `[anthropic-demystifying]`; no τ-bench, o GPT-4o teve menos de 50% de sucesso e `pass^8` abaixo de 25% no varejo `[taubench]`.
- **Por tipo de agente:** o de código, testes e análise estática; o conversacional, estado final mais rubrica de tom, com um LLM simulando o usuário
  (τ-bench); o de pesquisa, ancoragem e cobertura; o de uso de computador, o estado do ambiente isolado `[anthropic-demystifying]`.
- **Tarefa de longo prazo:** uma lista de funcionalidades em JSON com o campo `passes`, que só o agente de código vira, e o teste de ponta a ponta;
  a falha típica é marcar como pronto cedo demais `[anthropic-harnesses]`. O METR mede o horizonte de tempo a 50% `[metr]`.
- **Capacidade × regressão:** a eval de capacidade começa em taxa baixa («uma colina para subir»); a de regressão fica perto de 100% e pergunta «o agente
  ainda faz tudo o que fazia?». Quando uma de capacidade satura, **gradua-se para regressão** `[anthropic-demystifying]`.
- **As ferramentas do agente também se avaliam**, com verificador por resultado e um conjunto de retenção contra o sobreajuste `[anthropic-tools]`.

Os benchmarks de referência medem coisas diferentes — HELM, o amplo `[helm]`; MT-Bench, o próprio juiz `[zheng]`; SWE-bench e Terminal-Bench, o código com testes
`[swebench][terminalbench]`; τ-bench, ferramenta com usuário e política `[taubench]`; AgentBench, ambientes variados `[agentbench]`; AgentDojo, a injeção `[agentdojo]` —,
e nenhum substitui a eval da própria tarefa `[yan-evals][anthropic-challenges]`.

### A prática

- **O golden set.** Comece cedo, com **20 a 50 tarefas tiradas de falhas reais** (checagens de pré-lançamento, o bug tracker, o suporte), priorizadas pelo impacto: a
  amostra pequena basta enquanto o efeito de cada mudança é grande `[anthropic-demystifying]`. O *golden set* é o subconjunto com **resposta de referência
  validada por humano**, a verdade que calibra os *graders* e os juízes (do relatório). Uma boa tarefa é uma que **dois especialistas julgariam igual**, que tem
  **solução de referência** que prova que é resolvível, e que 0% de acerto de modelos de ponta em muitas tentativas indica tarefa quebrada, não agente incapaz
  `[anthropic-demystifying]`. O conjunto é **equilibrado**: testa quando o comportamento deve ocorrer e quando não deve `[anthropic-demystifying]`.
- **O *grader* resistente a trapaça e consertado antes de culpar o agente:** passar deve exigir resolver, não explorar brecha; o Opus 4.5 marcou 42% no CORE-Bench por
  casamento rígido de número e foi a 95% depois da correção `[anthropic-demystifying]`.
- **O CI.** As evals automatizadas são a «primeira linha de defesa», rodadas a cada mudança do agente e a cada troca de modelo; a Anthropic as pensa como
  uma camada do «modelo do queijo suíço», ao lado do monitoramento, do A/B, do feedback e da leitura de transcrição `[anthropic-demystifying]`. Asserções rápidas e baratas
  a cada mudança de código; a eval cara (LLM, k tentativas) na troca de modelo `[hamel-evals]`. Acompanham-se custo, tokens e taxa de erro num conjunto fixo, e a
  taxa de aprovação é decisão de produto, não precisa ser 100% `[anthropic-demystifying][hamel-evals]`.
- **A barra de erro.** Trate a eval como experimento `[miller]`: erro padrão da média abaixo de cada média, erro agrupado quando as perguntas vêm em grupos,
  variância reduzida por reamostragem (e não por baixar a temperatura), comparação por diferença pareada e **análise de poder** para saber se a eval enxerga a diferença
  que importa. A conta do relatório: com 80% de acerto verdadeiro, 50 tarefas dão ±11 pontos, 100 dão ±8 e 200 dão ±5,5 (intervalo de 95%); «subiu 5 pontos»
  numa eval de 50 tarefas é ruído — serve para saber se algo quebrou, não para ranquear variantes próximas.

### O que o harness tem, e o que falta — a revisar

O mapa do relatório (§ 5.3), do tipo de eval ao que já existe e à lacuna. **As lacunas não são plano nem decisão:** estão no «Do Not Forget» do `MEMORY.md`
para o MJRP revisar em breve, e a prática que o relatório recomenda para cada uma é recomendação do agente que pesquisou, não escolha do produto. Um sensor novo
ainda esbarra no teto de 12 do ADR-0002 e na regra «checagem nova exige incidente».

| Tipo de eval | Onde o harness já tem | Lacuna a revisar |
|---|---|---|
| **Regras** | o `doctor`, o `check_docs`, o `build_plugin --check`, o grafo de requisitos, os hooks, 74 autotestes e o `verify.yml` em todo PR | os sensores testam o repositório e a si mesmos; nenhum testa o **comportamento de uma skill** nem o resultado de uma sessão de agente: falta um *grader* de resultado `[anthropic-demystifying]` |
| **LLM como juiz** | juízes Sonnet independentes com `p0/p1/p2`, a reconferência e o teste de mutação do sensor | sem calibração contra rótulos humanos (TPR/TNR), sem controle de viés (autopreferência quando juiz e implementador são da mesma família), sem repetição da nota nem tendência entre rodadas `[zheng][yan-judges][hamel-judge]` |
| **Execução** | um worktree por feature, o `loop.py` com critério de saída e teto, o Playwright, o `deletion_guard` | não há tentativa limpa e repetida de uma skill num ambiente descartável; a memória e o git compartilhado podem vazar entre tentativas `[anthropic-demystifying]` |
| **Humano** | o OK por feature, o UAT, as válvulas do MJRP | o que o humano acha **depois** do juiz não vira medida (a taxa de escape do juiz) nem alimenta um golden set `[hamel-field][hamel-judge]` |
| **Red teaming e injeção de prompt** | só mitigações: privilégio mínimo pelos hooks, humano no circuito pelas válvulas | **nenhum teste adversarial**, nem de injeção indireta (em arquivo, página, nota de filho, saída de ferramenta) `[owasp-llm01][owasp-llm06][greshake][agentdojo][nist-genai]` |
| **Trajetória e uso de ferramenta** | os hooks `PreToolUse` veem cada chamada; o `skill-usage.csv` | nenhuma eval de trajetória nem de seleção de skill; não se mede o disparo de menos ou de mais de uma skill `[openai-best][google-adk][anthropic-demystifying]` |
| **Tarefa de longo prazo** | o `loop.py` (critério, teto de 3, falta de progresso, orçamento) | só o critério de saída; sem taxa de sucesso por tamanho de tarefa nem `pass^k` de loops longos `[metr][anthropic-harnesses]` |
| **Regressão e taxa ao longo do tempo** | o `verify.yml` (a regressão dos sensores) | skills e juízes **sem regressão**: um cenário que passava e quebrou não aparece; sem série histórica nem gatilho na troca de modelo `[anthropic-demystifying]` |
| **Confiabilidade estatística** | — | sem k tentativas, sem erro padrão, sem análise de poder `[miller][taubench]` |

As três de maior peso, na ordem do relatório (§ 5.4): **(1)** nenhum red teaming nem teste de injeção de prompt contra as próprias travas, num harness que lê
conteúdo que o MJRP não escreveu e tem agentes que escrevem no repositório — o cenário da injeção indireta com agência alta `[d3fend-atlas][owasp-llm06]`;
**(2)** as evals das skills são 48 arquivos de cenário escritos à mão que não rodam sozinhos (39 sem tabela de resultado, 7 com tudo «not run», 2 com algum resultado), sem
taxa de acerto no tempo; **(3)** o juiz LLM não é calibrado contra o MJRP nem tem tendência entre rodadas. As práticas que o relatório recomenda para cada uma estão no § 5.4 dele.

**O que a pesquisa não confirmou** (do relatório, § 6): a página principal do MITRE ATLAS (os ids das técnicas vêm do espelho no D3FEND), os 500 problemas do SWE-bench
Verified, o URL de WebArena, OSWorld e BrowseComp, e a magnitude exata dos vieses do juiz (que vem da síntese de Yan).

## History

- **2026-10-30 23:43** · **O Release passa a Homologação → Aceito → Deploy** (ADR-0029; decisão do MJRP de 2026-10-30 23:40): o OK do humano autoriza a publicação. O desenho do ciclo (v13) e a linha «Release» da tabela dos loops trocam a ordem. Antes: «Homologação → Deploy → Aceito».
- **2026-10-30 21:59** · **A seção «Evals»** (UAT-421; o MJRP, 2026-10-30 21:15, sobre a pesquisa `reports/research/2026-10-30-evals-for-agents.md`): a definição, os tipos (regras, LLM como juiz com os vieses e a mitigação, execução, humano, red teaming e injeção de prompt), as evals de agente (resultado, trajetória, `pass@k` e `pass^k`), a prática (o golden set, o CI, a barra de erro) e a tabela «tipo de eval → onde o harness já tem → lacuna», com as lacunas **a revisar**, não como plano. A coluna «a eval» da tabela dos loops passa a usar os mesmos nomes de tipo; antes dizia «determinística», «rubrica com juiz separado», «mista» e «pelo humano».
- **2026-10-30 21:38** · **«How MJRP uses it» ganha o desenho do ciclo (v13) e a tabela de todos os loops, com a eval de cada um** (UAT-421; o MJRP, 2026-10-30 21:15: «cinco loops» e a coluna «a eval»). A seção «Evals» — os tipos, as fontes e as lacunas — espera o relatório de pesquisa `reports/research/2026-10-30-evals-for-agents.md` e **não foi escrita só com o que o MJRP passou**. Até aqui a página tinha só os quatro bullets de como o MJRP usa o conceito (o `loop.py`, o critério de saída, o `doctor`, a distinção loop fixo × criador) e não dizia quais são os loops do harness.
- **2026-10-13 09:58** · O teto do `loop.py` passa de 5 para 3 rodadas por task, alinhado às fontes; cada task registra `rounds::` e `model::` no `tasks.md` (ver [[pdlc-loops]]).

- **2026-10-07 20:37** · Onda F do PDLC em loops: o `loop.py` ganhou a falta de progresso (exit 3) e o orçamento de tokens (exit 4); a lacuna de 18:38 fechou. Selftest com os casos 6 a 7c.
- **2026-10-07 18:38** · Correção pela proposta do PDLC em loops: a decisão de continuar é do harness, não do modelo; as cinco peças e as quatro regras de parada (handbook de Loop Engineering: Garage Labs, IBM); LLM nunca como juiz único. Lacuna: o `loop.py` sem orçamento de tokens nem detecção de falta de progresso. Ver [[pdlc-loops]].

- **2026-09-11** · Página criada a partir da mineração do acervo, a pedido do MJRP, durante o
  brief do playbook. Fontes centrais: pasquadev e Waldemar Neto; complementos de Google Cloud
  Tech, Karpathy (No Priors) e Marchese. **Lacuna registrada:** a definição da IBM de loop
  engineering, que o glossário cita, **não está no corpus** — o vídeo *AI in the SDLC* não menciona
  loop. O corpus vive fora deste repositório — external-locations.
