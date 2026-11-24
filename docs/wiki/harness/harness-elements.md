---
title: Harness elements
aliases: [os sete elementos, sete elementos, as onze peças, onze elementos, componentes do harness, harness-elements]
summary: os harness elements — os sete elementos de um sistema agêntico, na ordem do diagrama do PDLC (os loops no núcleo), o domínio de cada um, e onde o MJRP está
tags: [harness, fundamento, mapa]
status: firme
atualizado: 2026-10-27
fontes: [pasquadev-loop-engineering, anthropic-context-engineering, ibm-skills-mcp-rag-memory, fowler-guides-sensors]
---
<!-- kernel do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
Os **sete elementos** que compõem o entorno de um modelo de linguagem para que ele produza trabalho confiável — os
mesmos que o diagrama do PDLC em loops nomeia ([[pdlc-loops]]). **Os loops são o núcleo**: o harness se constrói à
volta deles. Nem tudo é nosso: cada elemento tem um [[terms|domínio]] (Plataforma, Harness, Instância), e o domínio
muda o que dá para fazer com ele.

> **Validado pelo MJRP em 2026-09-14** (as onze peças) — *"por ora, se precisar evoluímos e modificamos no futuro"*.
> **Reorganizado pelo MJRP em 2026-10-27**: as onze peças viram os sete elementos do diagrama, nesta ordem. A versão
> anterior está em `_archive/2026-10-27-harness-elements/`. Mudança de elemento, domínio ou estado entra datada no `## History`.

- **2026-11-17 14:12** · O HE-5 dizia «26 guias de procedimento … e mais de 150 ferramentas» → diz o que são, sem o número que envelhece (havia 28 skills da fábrica e 224 scripts) (UAT-548)
## What it is

Uma tabela para ver de relance, e depois cada elemento com detalhe. A coluna «Junta» diz quais das onze peças de antes
cada elemento absorveu.

| Id | Elemento | Junta | Domínio hoje | Estado no MJRP |
|---|---|---|---|---|
| HE-1 | Loops | loop de execução | Plataforma + Harness | o do turno, emprestado; o da tarefa: `loop.py`, nível 2; os loops do PDLC — Intake, Discovery, Delivery, Learn — com critério de saída |
| HE-2 | Orchestration & Evals (Human and/or Agentic) | orquestração; os juízes | Harness | a `mjrp-pdlc` roteia; executor, juiz independente e integrador; os evals são os juízes humanos e agênticos |
| HE-3 | Governance (Human & Agentic) & Observability (Human) | governança, sensores, observabilidade | Harness | hooks que recusam; o aceite do que o humano vê ou decide; o `doctor` e os sensores; o Control Center |
| HE-4 | Context Engineering | context engineering, memória | Harness + Instância | a `mjrp-pdlc-onboarding` faz o *select*; seis tipos de memória, com casa |
| HE-5 | Tools & Guides | ferramentas, guides | Harness + Instância | as skills da fábrica (guias procedurais) e o catálogo de scripts; `tools:` no contrato, pendente |
| HE-6 | Security & Sandbox | ambiente de execução; os limites da Plataforma | Plataforma → Harness | as proteções que já rodam; o sandbox do agente no roadmap (EP-04) |
| HE-7 | Guardrails & Foundation | guardrails; a fundação | Harness | o contrato `.mjrp-project.yml`, os `PRINCIPLES.md`, a constitution e o PDLC |

### Como distinguir — os pares que confundem

*(Proposto pelo agente em 2026-10-27, à pergunta do MJRP sobre as ambiguidades; ele revisa em outra iteração.)*

- **Orchestration × Governance.** A orquestração decide **o próximo passo e quem o faz**: roteia entre as etapas, passa o
  estado, chama o juiz. A governança decide **se o passo é permitido e quem assina**: as aprovações, as válvulas do
  humano, os hooks que recusam, as classes de decisão (a)(b)(c). Os **evals** ficam com a orquestração: são o juiz dentro
  do loop dizendo se o passo serve. A observabilidade fica com a governança: é o que deixa o humano ver para decidir.
- **Guides × Guardrails.** O guide diz **como fazer** e orienta antes da ação — é pedido, o agente pode não seguir (as
  skills, os moldes). O guardrail diz **o que tem de valer ou não pode acontecer** — é a regra declarada (o contrato, os
  princípios, a constitution, o PDLC). O sensor confere **depois** e mora na governança e observabilidade.

---

### HE-1 · Loops
**O que é.** O ciclo que faz o agente avançar sozinho: observa, decide o próximo passo, age, lê o resultado, repete.
Sem ele não há agente — há chat. É o núcleo: os outros seis elementos existem para que o loop produza trabalho confiável. ^he-1

**A divisão que importa.** O **loop do turno** é da Plataforma: o modelo chama uma ferramenta, lê o resultado, chama de
novo, e para quando *ele mesmo* emite texto sem chamar nada. A condição de parada padrão é uma **opinião do modelo**, não
um fato verificado. O **loop da tarefa** é nosso: repetir o turno até um critério verificável passar, com o estado
viajando por arquivo.

**No MJRP.** O primeiro é emprestado. O segundo é o `loop.py`: nível 2 (goal-based), com as quatro regras de parada —
critério de saída, teto, falta de progresso e orçamento de tokens ([[loop-engineering-concept]]). É o que o invariante
nº 12 exige — nenhum loop começa sem critério de saída declarado e verificável. Acima dele, os loops do produto:
Intake, Discovery, Delivery e Learn ([[pdlc-loops]]).

### HE-2 · Orchestration & Evals (Human and/or Agentic)
**O que é.** Quem roteia entre as fases — passa o estado, escolhe o próximo papel, para nos portões — e quem **avalia**
o que cada passo entregou. O avaliador pode ser humano, agente, ou os dois. ^he-2

**No MJRP.** A orquestração é a `mjrp-pdlc`, um orquestrador executado por leitura, não por código: **entre fases,
grafo** (o fluxo é conhecido de antemão); **dentro de cada fase, loop** (o trabalho do papel é exploratório). No
Delivery, três papéis: o **executor** faz, o **juiz** confere sem ter feito (um por lote) e o **integrador** é o único
que escreve na `main`. Os **evals** são esses juízes: a reconferência visual, as críticas de UX e de arquitetura, a
reconferência independente da trilha Agente, os cenários de eval de cada skill — e o humano, que dá o aceite do que há
para ele ver ou decidir. Falta o agente por papel (EP-03) e os evals das skills rodando sozinhos.

### HE-3 · Governance (Human & Agentic) & Observability (Human)
**Governança — o que é.** Quem pode fazer o quê, e o que exige aprovação. No nível da chamada de ferramenta: *always do
/ ask first / never do*. ^he-3

**No MJRP.** **Mecanizada onde dói.** Hooks que recusam: o `path_guard` (arquivo novo fora da sua natureza), o
`pre-commit`, o `commit-msg`, o `pre-merge-commit` (a trava visual), o `Stop` e os `PreToolUse` que barram as válvulas do
humano ([[hooks-concept]]). O aceite do que o humano vê ou decide é dele, com carimbo que o agente não escreve; o resto fecha pela reconferência independente (Fechado). O resto segue
escrito — as classes de decisão (a)(b)(c) no `AGENTS.md`.

**Sensores — o que é.** O que detecta **depois** da ação que algo saiu errado, sem depender do agente cooperar.
Devolve 0 ou 1. **A hierarquia de força:** compilador e sistema de tipos > teste e CI > linter e schema > segundo modelo
revisando > auto-relato do agente (que não é sensor nenhum). **A linguagem é um sensor**: escolher stack tipada é
escolher um verificador de força máxima que roda de graça. No MJRP: o `doctor` com contrato 0/1/2 ([[doctor]]), mais os
sensores que o contrato declara. **O furo:** ele verifica a conformidade da instância, não o trabalho entregue.

**Observabilidade — o que é.** Conseguir diagnosticar **sem fazer deploy novo** — distinta de monitoring, que só avisa
que quebrou. É **do humano**: o que deixa quem decide ver o que aconteceu. No MJRP: o Harness Control Center (EP-08) — o
veredito dos sensores, o rastro datado de `daily-checks/`, o custo em tokens, o board. Falta o rastro de cada agente.

### HE-4 · Context Engineering
**O que é.** Decidir o que entra na janela, quando e em que forma. Quatro operações: *write* (mesa → arquivo), *select*
(arquivo → mesa), *compress* (encolher), *isolate* (dividir entre agentes). A **memória** é o que persiste fora da
janela e precisa ser recuperado para virar contexto — fonte de contexto, não a mesma coisa. ^he-4

**No MJRP.** A `mjrp-pdlc-onboarding` é o *select*; o save context é o *write*; o *compress* é da Plataforma; o
*isolate* é a fábrica de sessões. Seis tipos de memória com casa: instruções (`AGENTS.md`), contrato, semântica,
decisória (`docs/decisions/`), episódica (`log.md`) e **aprendida + ativa** (`MEMORY.md`). O custo fixo de cada sessão é
medido no Token/Cost; falta medir o que o agente lê — e por *context rot*, excesso não é só caro, é pior.

### HE-5 · Tools & Guides
**Ferramentas — o que é.** Tudo o que o agente pode **chamar para agir**. Ver tools para os três sentidos da palavra
e as três camadas. **Cuidado documentado:** a Vercel removeu 80% das ferramentas de um agente e a performance
**melhorou**. Ferramenta não usada não é neutra: come contexto e cria caminho errado. ^he-5

**Guides — o que é.** O que orienta **antes** da ação (feedforward): specs, regras, skills, `AGENTS.md`. É sempre um
**pedido** — o agente pode não seguir.

**No MJRP.** Os guias procedurais são as skills da fábrica — cada uma com a etapa e o papel no PDLC, no mapa das skills —;
as ferramentas, os scripts do catálogo, os MCPs e as CLIs. Guide é inferencial e custa token a cada sessão: trocar guide
por sensor é o que baixa a conta. Falta o campo `tools:` do contrato.

### HE-6 · Security & Sandbox
**O que é.** Onde o agente roda, com que raio de explosão, e o que o impede de causar dano. Duas metades: o **sandbox**
(o ambiente do agente) e o **provisionamento** (o ambiente do produto); e os limites que a Plataforma já impõe
(permissão negada, caminho fora do permitido). ^he-6

**No MJRP.** O que já protege: os hooks recusam apagar o que não se recupera e descartar edição sem commit (o
`deletion_guard`, com a classificação de cada caminho por máquina); nenhum segredo fica em disco; o Control Center só
responde em 127.0.0.1, com token em arquivo 0600 e proteção contra *DNS rebinding*; as permissões da Plataforma. O
próximo passo é o sandbox do agente (EP-04), pré-requisito da autonomia: agente autônomo sem isolamento tem a máquina
inteira como raio de explosão.

### HE-7 · Guardrails & Foundation
**O que é.** O limite que **impede** a ação errada antes de acontecer, escrito como regra — e a base sobre a qual os
loops rodam. ^he-7

**No MJRP.** O contrato `.mjrp-project.yml` (o que o projeto declara sobre si: sensores, portões, tela, stack), os
`PRINCIPLES.md`, a constitution de cada projeto e o próprio PDLC, com os portões e as regras de parada. O `doctor` confere
o contrato; os hooks seguram o que o contrato declara.

## Capabilities

Os sete elementos, vistos pelo que **entregam juntos** (o card «Entenda o Harness» do Control Center, a faixa «O que as
camadas entregam juntas»). Cada um com o que existe hoje, o que falta e um status em cinco níveis (o MJRP, 2026-10-27; cada um com cor e ícone próprios no card) — 1 `rodando`, 2 `rodando e
evoluindo`, 3 `rodando e em construção`, 4 `em construção`, 5 `a fazer` (ou `por construir`); o antigo `parcial` vale como o 3; «—» quando nada falta. O texto é escrito para quem não conhece o harness — um cliente — (o MJRP, 2026-10-27);
o card chama «O que falta» de «próximo passo». **Esta tabela é a fonte do card**: o Control Center a lê (formato `capabilities@1`:
estas seis colunas, nesta ordem; a página é o nome de uma página da wiki; a capacidade abre com o link para a âncora do
elemento, `[[harness-elements#^he-n|HE-n]]`, e o card mostra só «[HE-n]») e não inventa status. Mudou o estado de um
elemento, mude aqui, com data no `## History`.

| Capacidade | Lente | Status | O que existe | O que falta | Página |
|---|---|---|---|---|---|
| [[harness-elements#^he-1\|HE-1]] Loops | O coração: tudo se organiza em volta dele | rodando | Cada trabalho passa por loops com começo, meio e fim: entender o pedido, descobrir a solução, construir e aprender com o resultado. Nenhum loop começa sem saber quando termina. | loops que rodam sozinhos do começo ao fim | [[pdlc-loops]] |
| [[harness-elements#^he-2\|HE-2]] Orchestration & Evals | Quem faz o quê, e quem confere | rodando e evoluindo | Cada etapa tem um responsável. Quem constrói nunca é quem confere: um avaliador independente revisa o trabalho, e o que a pessoa vê ou decide só vale com o aceite dela; o resto fecha pela reconferência independente. | um agente especializado para cada papel; as avaliações rodando sozinhas | [[agents-agentic-concepts]] |
| [[harness-elements#^he-3\|HE-3]] Governance & Observability | Regras claras e tudo à vista | rodando e evoluindo | O sistema recusa sozinho o que viola as regras. O que a pessoa precisa ver, decidir ou é de segurança pede a aprovação dela. Um painel mostra o estado de cada projeto, os alertas e o custo. | o registro detalhado do que cada agente fez | [[doctor]] |
| [[harness-elements#^he-4\|HE-4]] Context Engineering | A memória certa na hora certa | rodando | O sistema lembra onde o trabalho parou, as decisões tomadas e o que foi aprendido. Carrega só o que a tarefa pede, e o custo disso é medido. | medir o que cada agente realmente lê | [[context-vs-memory]] |
| [[harness-elements#^he-5\|HE-5]] Tools & Guides | Os procedimentos e as ferramentas | rodando e em construção | Um guia de procedimento (skill) para cada tipo de trabalho, e as ferramentas automáticas catalogadas; os números ficam no inventário, que se conta sozinho. | o inventário de ferramentas declarado em cada projeto | tools |
| [[harness-elements#^he-6\|HE-6]] Security & Sandbox | O ambiente e a segurança | rodando e em construção | Tudo é recuperável. Nenhuma senha ou segredo fica guardado em arquivo. Acessos protegidos. | um ambiente isolado para cada agente trabalhar | [[hooks-concept]] |
| [[harness-elements#^he-7\|HE-7]] Guardrails & Foundation | As regras que sempre valem | rodando | Cada projeto declara suas regras, seus princípios e seu jeito de trabalhar, e o sistema confere tudo automaticamente. | — | [[project-profiles]] |

## How MJRP uses it

- **O domínio de cada peça é campo do contrato**, não linha do documento de visão: num stack que
  entrega o loop, o loop passa a ser seu.
- **Os elementos computacionais** (sensores, hooks, o loop da tarefa) custam ~zero quando passam; os inferenciais (guides,
  juízes agênticos) são o caro. Trocar conselho por mecanismo é o que baixa a conta.
- **O que mais falta:** o rastro de cada agente (Governance & Observability), as ferramentas declaradas no contrato (Tools &
  Guides) e o sandbox do agente (Security & Sandbox, EP-04).

## History

- **2026-10-30 21:25** · **O OK de uma pessoa deixou de ser de toda entrega** (UAT-421, auditoria do Overview, achados 16 e 17): as linhas do HE-2 e do HE-3 (a faixa do card «Entenda o Harness») diziam «a entrega só vale com o aceite de uma pessoa» e «cada entrega pede a aprovação de uma pessoa». Pela regra de 2026-10-30 20:22 (`AGENTS.md` § Duas trilhas), só o que há para a pessoa ver, decidir ou de segurança pede o OK; o resto fecha pela reconferência independente, em Fechado. O mesmo nas linhas da tabela, do «Como se divide» e das hooks. E o HE-5 passou de 25 para 26 guias (a `mjrp-configuring-boards`, F136), o número que o mapa das skills do mesmo card já mostrava.
- **2026-10-27 13:42** · as onze peças, e as cinco capacidades do card → os sete elementos do diagrama do PDLC em loops, na ordem do
  MJRP (HE-1 Loops, o núcleo; HE-2 Orchestration & Evals; HE-3 Governance & Observability; HE-4 Context Engineering; HE-5 Tools &
  Guides; HE-6 Security & Sandbox; HE-7 Guardrails & Foundation), cada um com o id `^he-n` que o card mostra entre colchetes, e
  as sete capacidades escritas para um cliente, com o status em cinco níveis (o MJRP, F102: «Guardrails» é a fundação declarada,
  como no diagrama; Security & Sandbox sem «falta», para não passar «a impressao que nao temos seguranca nenhuma no produto»; a
  seção «Como distinguir» é proposta do agente; a versão anterior em `_archive/2026-10-27-harness-elements/`).
- **2026-10-14 19:52** · Seção `## Capabilities`: as cinco capacidades com status, transcritas do protótipo aprovado
  pelo MJRP (v3.5, 2026-10-09 16:19; o mesmo texto no v4.5), para o Control Center lê-las em vez de deixá-las de fora
  (UAT-140, F21). Única mudança: o "custo fixo medido: 16.348 tokens" virou "custo fixo medido no Token/Cost" — um
  número fixo numa tabela envelhece; o medido de hoje está na aba. Os status são os de 2026-10-09: o MJRP revisa.
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: o loop da tarefa existe (`loop.py`, nível 2, quatro regras de parada); os sensores são as checagens do `doctor` (C1, I1–I5, F1–F3, A1, W1–W14) mais as do contrato; a governança ficou parcialmente mecanizada pelos hooks que recusam. A tabela dizia o estado de setembro.

> A decisão mora na página do assunto que ela muda, com data (ADR-0008). As entradas abaixo
> vieram **inteiras** do `MEMORY.md` na migração do BACKLOG #28a (09/09/2026) — nada foi
> condensado na mudança.
- **2026-09-07** · As peças passaram a ser **onze** — entrou `guardrails` ao lado de governança.
- **2026-09-14 20:57** · **Os onze validados pelo MJRP** — *"validado por ora, se precisar evoluímos e
  modificamos no futuro"*. A página passa de *em formação* a **firme**; foi a última pendência de
  dono MJRP no fio da cadeia de intenção (BACKLOG #7). A página viaja no kernel de todo projeto.
- **2026-09-08 14:53** · As **onze peças** viram `docs/wiki/harness-elements.md`, com cada elemento
  detalhado — o Zé valida depois. Não é ponteiro para o nada.
- **2026-09-21 16:51** · **A peça #10 (Observabilidade) ganha corpo: o Harness Control Center (EP-08).** Brief
  aprovado pelo MJRP — escopo discovery + prototipação (entrega um protótipo das informações do
  cockpit, não o app). Casa: projeto aninhado `apps/control-center/`, porque o cockpit lê os
  arquivos do próprio harness e pertence ao repo. A seção "resultado dos sensores" do cockpit é a
  #10 de verdade; o resto (diagrama, docs por fase, Kernel, memory/log, roadmap) é um Docs Plane.
  Detalhe: `docs/log.md` [2026-09-21 16:51].

## Related
tools · [[terms]] · [[vision-document]] · ADR-0005 · ADR-0006
