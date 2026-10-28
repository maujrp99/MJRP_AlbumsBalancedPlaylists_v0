---
title: Termos
aliases: [termos, glossário, glossario, verbetes, vocabulário, vocabulario, visão, visao, princípio, principio, principles, roadmap, prd, sdd, spec-kit, speckit, openspec, bmad, kiro, ears, delta-spec, steering-files, harness, user-harness, tres-planos, quatro-dominios, donos, instancia, skills, skill, sensores, sensor, contrato, contrato-de-instancia, caminhos-de-adocao, gate, bootstrap, agente, invariante, invariantes, inegociáveis, inegociável, processo, nivel-de-processo]
summary: o glossário do MJRP — todo o vocabulário, agrupado por função no harness e alfabético dentro de cada grupo
tags: [conceitos, glossario]
status: firme
atualizado: 2026-10-09
fontes: []
---
<!-- kernel do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

# Termos — o glossário

**Esta é a única casa do vocabulário.** Até 11/09/2026 metade dele vivia no apêndice do
`VISION.md`, que chegou a ser 73% daquele documento e carregava em toda sessão. O `VISION.md`
ficou com a identidade do projeto; o glossário mora aqui e é carregado **sob demanda**.

Um conceito ganha **página própria** quando o MJRP indica que merece uma — regra de 09/09; a
anterior (*"quando alguém precisou explicá-lo duas vezes"*) era heurística de agente, não decisão
dele. Antes disso, é uma linha aqui.

**Agrupados por função no harness**, e alfabéticos dentro de cada grupo. O que **ainda não existe**
está na última seção, separado de propósito.

## Fundamentos — o que o harness é

| Termo | Definição |
|---|---|
| **Dogfooding** | O harness obedece às próprias regras: mantém a identidade e o histórico de sessão que manda todo projeto manter. |
| **Fábrica de software** | **Metáfora**, não nome de nada (ADR-0004): serve para explicar o método a quem não é de software. O entorno chama-se MJRP Harness; o identificador pro cliente é o MJRP SaaS — ver a entrada própria abaixo. |
| **Harness** | O **entorno do modelo** — as onze peças: loop de execução, ferramentas, guides, context engineering, memória, ambiente de execução, sensores, governança, guardrails, observabilidade e orquestração. Não é o modelo nem o prompt. |
| **Harness engineering** (no mercado, 2026) | Nas fontes de mercado (Garage Labs, IBM), a disciplina que projeta **o sistema inteiro** em volta do modelo — sandbox, permissões, guardrails, observabilidade — e que encapsula a de loops. No MJRP essa camada se divide: o que o fornecedor entrega é a **Plataforma** (*system harness*); o que o MJRP constrói é o *user harness* (kernel, skills, sensores, contrato). Ver [[harness-concept]]. (2026-10-07 18:38) |
| **Jaggedness** | A competência dos modelos é irregular — ótima numa tarefa, ruim na vizinha, sem aviso. Obriga a medir no próprio domínio. *(Karpathy)* |
| **MJRP SaaS** | O **identificador reconhecível pro cliente** do negócio da MJRP — não o produto em si (ADR-0004, resolvido 14/09). O produto real é o que o Harness constrói e entrega caso a caso. Mesmo papel que "Salesforce" faz pro SaaS que a marca nomeia: identifica pra fora, sem ser o nome de nenhum módulo por dentro. |
| **Pedido × regra** | Uma linha no `CLAUDE.md` é pedido; um hook que intercepta a chamada é regra. T4 é sobre regras. *(Karpathy)* |
| **Quatro domínios** (antes *três planos*) | De quem é cada domínio do **entorno** — não do software entregue. **Instância**: muda a cada projeto, o contrato declara. **Harness**: muda quando o método da MJRP muda. **Plataforma**: muda quando o fornecedor quiser. **Usuário**: como o MJRP quer as coisas, fora de repo. |
| **Sandbox** | O ambiente isolado em que o agente executa. Hoje é **system harness** — quem entrega é a Plataforma. O EP-04 do PRD (o Next "o produto sobe por comando do agente" do `ROADMAP.md`) o traz para o lado do MJRP: o agente ganha canteiro, o projeto ganha chão. Alinhado ao [[vision-document]]. |
| **Skill issue** | Vira princípio aqui: toda falha de agente é bug do harness até prova em contrário. *(Karpathy)* |
| **T1–T4** | As quatro condições necessárias para algo ser um harness: loop, interface de ferramenta, gestão de contexto, e mecanismo que não dependa do modelo cooperar. |
| **User harness × system harness** | User: o que você configura e que sobrevive à troca de ferramenta — skills, contrato, sensores, arquivos no repo. System: o que o fornecedor entrega — loop do turno, compactação, memória interna. O MJRP constrói só o primeiro. |

## Contrato e configuração

| Termo | Definição |
|---|---|
| **AI Collab / Autonomous** | Os dois modos de operação (`orchestration:` no contrato). *AI Collab* (assistido por IA, human-in-the-loop): o humano interage com a IA em gates e fluxos padronizados, validando e combinando o próximo passo. *Autonomous*: um agente orquestrador roteia e para só nos gates — que podem ser agente ou humano (judge, validator). Mesmo grafo, roteador diferente. |
| **Bootstrap** | O passo de setup que preenche o contrato de instância do projeto: perfil, nível de processo, gates, stack, ferramentas, ambiente. Decidido ali, nunca em runtime. |
| **Brownfield** | Caminho de adoção sobre codebase existente: documentar o que *é*, evoluir aos poucos. |
| **Caminhos de adoção** | As **duas** portas de entrada de um projeto de código no harness: *greenfield* (do zero) e *brownfield* (codebase existente). **Não vão para o contrato** — convergem no Delivery e depois do retrofit o projeto deixa de ser brownfield. O que o contrato declara é o **perfil** (`profile: code-app \| content \| meta`), que é o que o projeto *entrega*. Ver [[project-profiles]]. |
| **Contrato de instância** | O `.mjrp-project.yml` na raiz do projeto: tudo o que varia entre projetos declarado num lugar só — `profile`, `process_level`, `context`, `gates`, `gate_sla_days`, `gates_open`, `stack`, `models`, `environment`, `sensors`, `tools`, `orchestration`, `source`. É autoritativo: onboarding, lifecycle e `doctor` leem ele primeiro. Validado por schema (checagens I1 e I2). Antes chamava-se *marker*. |
| **Gate** | Ponto onde o fluxo para e alguém aprova — humano, ou agente (judge, validator). Todo gate tem **dono e relógio**: gate sem prazo é beco. Declarados em `gates:` no contrato. |
| **Greenfield** | Caminho de adoção a partir do zero. |
| **Inegociável** | A palavra do MJRP para o mesmo conjunto que *invariante* — e os dois não são sinônimos exatos, são as duas faces da mesma coisa: **invariante** diz *o que a coisa é* (uma verdade que tem de valer sempre); **inegociável** diz *como se trata* (não está em discussão). A postura é consequência da propriedade — como não tem nível, não há o que negociar. |
| **Invariante** | Coisa que **tem que ser verdade**. Não tem nível, custa zero quando está certo, não escala com o projeto, e **não tem campo no contrato**. Oposto de *processo* — mas o nível de processo que a instância declarou vira invariante dela (`PRINCIPLES.md` II.1). |
| **Processo** (*nível de*, `process_level:`) | Trabalho que se escolhe fazer — **quanto do método o projeto roda**. Tem nível, custa token toda vez, escala com o projeto, e é declarado no contrato: `minimal` · `standard` · `full`. *O teste:* complete "esse projeto é pequeno, então pode ficar assim"; se faz sentido é processo, se soa absurdo é *invariante* (verbete acima). **Chamava-se "cerimônia" até 11/09/2026** — trocado porque em ágil *cerimônia* é ritual (daily, planning, review, retro), e não é disso que o campo trata. |
| **Projeto aninhado** | Projeto dentro do repositório de outro (um app em `apps/<app>/`), com contrato e grafo próprios — épicos próprios como qualquer projeto; a ligação com o roadmap de cima é a aresta `contributes_to`, de resultado para resultado ([[requirements-graph]]). Derivado do caminho, sem campo no contrato; leva o `id_prefix` do contrato nas sequências que o projeto de cima também usa. Projeto filho com repositório próprio não é aninhado. |

## Identidade e documentos do projeto

| Termo | Definição |
|---|---|
| **ADR** | *Architecture Decision Record* — um arquivo por decisão em `docs/decisions/NNNN-*.md`, imutável; decisão nova supersede, não edita. É a memória decisória com casa. *(MADR)* |
| **`AGENTS.md`** | Formato aberto de instruções para qualquer agente de código (Linux Foundation; 60+ ferramentas). Canônico no MJRP; `CLAUDE.md` e `GEMINI.md` o importam e acrescentam só o que é da ferramenta. |
| **GVV — Gestão Visual Virtual** (*VVM, virtual visual management*) | A gestão visual levada para uma tela: o estado do trabalho (dos agentes, do roadmap, da saúde do harness) visto e decidido numa aplicação web e mobile, sem abrir a IDE nem o terminal. É a categoria dos dois resultados do Control Center (MJRP, 2026-10-06). |
| **Kernel** (`docs/wiki/harness/`) | As páginas da wiki do harness que **todo projeto carrega** — cópia carimbada (versão + fonte no contrato, campo `kernel:`) do que governa a instância: o que os campos do VISION, a memória, o perfil e os sensores significam. O `new_project.py` copia, `--refresh-kernel` atualiza, o doctor (I5) avisa quando envelhece. O projeto aninhado no repositório do harness não carrega cópia: declara `kernel: {source: in-repo}` e lê o kernel da raiz (ADR-0020), e o `--refresh-kernel` o recusa. Mesmo mecanismo da herança do `PRINCIPLES.md`. |
| **Objetivo** (`VISION.md`) | O **WHAT** da [[base-concept|cadeia de intenção]]: a meta de curto a médio prazo que leva à visão, e o que se entrega para chegar lá. |
| **PRD** (`docs/specs/prd.md`) | *Product Requirements Document* — o que o produto **é**, para quem, com que objetivo, e **o que ele explicitamente não é**. Documento **vivo**, ao contrário do charter, que era um retrato do kickoff. Carrega os **Epics** e, desde 03/10/2026, os **requisitos por épico** (no formato do projeto: user story, caso de uso ou EARS) (as soluções do `ROADMAP.md`), a seção *Entregue* e os *Candidatos* (o intake de achados — Epic *Enhancements*). Pela regra do BMAD: existe quando **mais de um épico não pode divergir** — no MJRP, quando mais de um agente trabalha no mesmo produto. **Dono:** o **gerente de produto** — no MJRP, o humano no papel de PM, com a `mjrp-coaching-pm` (dona do guia e do modelo); os requisitos por épico são da `mjrp-writing-reqs`; a `mjrp-pdlc-bootstrap` só cria o esqueleto (decisão do MJRP, 2026-10-17). *(Atlassian; BMAD)* |
| **Princípio** (`PRINCIPLES.md`) | O **fundamento do agente e do humano** — o que deve ser seguido nos projetos MJRP. Pelo dicionário do próprio arquivo: *a regra que regula a ação e serve de base ao método*. Não é "como se decide": decisão com alternativa e consequência é ADR. |
| **Propósito** (`VISION.md`) | O **WHY** da [[base-concept|cadeia de intenção]]: a razão de ser — a necessidade que se quer resolver. Sem prazo. |
| **Roadmap** (`ROADMAP.md`) | O **HOW** da [[base-concept|cadeia de intenção]]: os **resultados** que o produto persegue, em Now / Next / Later — quem sente, hoje, medida e solução ou opções por item; sem data, sem estado. "Pronto" é a medida mover, não o trabalho terminar (v0 em 17/09/2026). |
| **Tag de categoria** (`tags::`) | A classificação de um **resultado** do `ROADMAP.md` e de um **épico** do PRD: de 1 a 3 tags por resultado (`tags:: #visual-management`), em inglês e kebab-case; o épico herda as do resultado que serve e pode somar até 3 próprias. Vocabulário livre: o sensor do grafo confere formato e quantidade (regra `tags`). Serve para filtrar e agrupar resultados por categoria na gestão visual. Ver [[requirements-graph]]. (MJRP, 2026-10-06) |
| **Visão** (`VISION.md`) | O **WHERE** da [[base-concept|cadeia de intenção]]: o horizonte a alcançar, uma instanciação do propósito. O documento que a carrega é o [[vision-document]]. |
| **Wireframe** (`design/wireframes/`) | A tela de uma versão do protótipo em caixas, com os IDs do inventário: `design/wireframes/<name>-vN-<screen>.png`. Toda versão tem o de todas as telas (hook `commit-msg`, doctor W14). |

## Contexto e memória

| Termo | Definição |
|---|---|
| **Compactação** | A operação *compress*: resumir a conversa perto do limite da janela e reiniciar com o resumo, preservando decisões e pendências. Hoje só o system harness faz. *(Anthropic)* |
| **Context engineering** | A disciplina de decidir o que entra na janela, quando e em que forma — "o menor conjunto possível de tokens de alto sinal". Quatro operações: write, select, compress, isolate. No MJRP, a `onboarding` é a operação *select*. *(Karpathy; Anthropic; LangChain)* |
| **Context rot** | Conforme a janela cresce, a capacidade do modelo de recuperar o que está nela **cai**. Consequência: contexto grande não é só caro, é pior. *(Anthropic)* |
| **Contexto (memória de trabalho)** | O conjunto de tokens na janela do modelo numa chamada. Finito, reconstruído a cada turno, degrada conforme cresce (*context rot*). Distinto de memória, que é o que persiste fora da janela. *(Anthropic; CoALA)* |
| **Custo fixo de sessão** | O que se paga antes de qualquer trabalho começar: o contexto carregado mais as descriptions residentes. É falha de *select*, não de memória — e por *context rot* o excesso é pior que inútil. A medição atual sai do `doctor`, não deste documento. |
| **Memória (longo prazo)** | O que persiste fora da janela — arquivos, banco, pesos — e precisa ser *recuperado* para virar contexto. Memória é fonte de contexto, não a mesma coisa. Tipos: episódica, procedural, semântica *(CoALA)* + decisória, de usuário *(Kipper)*. |
| **Memória aprendida** | O que o **agente** descobriu trabalhando e guardou sem ser mandado — correções do MJRP, decisões de meio de sessão, achados sobre o próprio harness. `MEMORY.md`, **acrescenta** com data e hora (ADR-0005). É o único tipo que o humano não escreve. |
| **Memória ativa** | Onde o trabalho está: foco, próximo passo, bloqueios. Vive na seção `## Now` do `MEMORY.md`, quatro blocos com ponteiros, **sobrescrita** a cada bloco de trabalho (ADR-0006). É o que tem que sobreviver à compactação. *(Cline Memory Bank; Anthropic memory tool)* |
| **Memória de longo prazo** (escolha do MJRP) | As fontes de agentes (IBM) assumem banco vetorial; o MJRP escolheu **arquivos e wiki com recuperação sob demanda** (`MEMORY.md`, `docs/log.md`, páginas com índice) — divergência deliberada, não lacuna. Ver [[memory-architecture]]. (2026-10-07 18:38) |
| **Memória de trabalho** | Sinônimo de contexto — o que está na janela agora. Ver *Contexto*. |
| **Memória de usuário** | Como o MJRP quer as coisas. Casa: `~/.claude/CLAUDE.md`, nível de usuário, fora de qualquer repo. Vazia hoje. |
| **Memória decisória** | Por que decidimos X e o que foi descartado. Casa: `docs/decisions/` — um arquivo por decisão, imutável; decisão nova supersede, não edita. |
| **Memória episódica** | "Experiência de ciclos de decisão anteriores" *(CoALA)* — o que aconteceu. No MJRP, `docs/log.md`, que **acrescenta** por checkpoint. |
| **Memória procedural** | Como se faz. O CoALA distingue a implícita (nos pesos do modelo) da **explícita, escrita no código do agente** — as skills do MJRP são exatamente isso, distribuídas em dois pacotes: o do ciclo de software e o toolkit, que usa o mesmo mecanismo fora dele. |
| **Memória semântica** | "O conhecimento do agente sobre o mundo e sobre si" *(CoALA)* — fatos do domínio. No MJRP, o SpecKit, `docs/diagrams.md` (a fonte Mermaid, não os PNGs), `docs/wiki/sources/` (as fichas de fontes) e **este glossário**. |
| **Modos de falha de contexto** | Poisoning (lixo entra na memória), distraction (janela grande demais), confusion (supérfluo influencia), clash (contradição na janela). Todos os quatro já ocorreram no MJRP. *(Breunig, via LangChain)* |
| **Operações de contexto** | As quatro de context engineering: **write** (mesa → arquivo), **select** (arquivo → mesa), **compress** (encolher a mesa), **isolate** (dividir a mesa entre agentes). No MJRP: handoff/checkpoint, onboarding/progressive disclosure, compactação, e a fábrica. *(LangChain)* |
| **Orçamento de atenção** | O limite real do contexto: o transformer cria n² relações para n tokens, e a atenção se dilui. Por isso a regra é "o menor conjunto possível de tokens de alto sinal". *(Anthropic)* |
| **Progressive disclosure** | Carregar conhecimento no momento em que ele é necessário — a operação *select* feita sob demanda; a Anthropic chama de *recuperação just-in-time*: manter identificadores leves e carregar com ferramenta. As skills do MJRP estão no nível 2: índice residente, corpo sob demanda. |

## Verificação — sensores, guides e prova

| Termo | Definição |
|---|---|
| **Computacional × inferencial** | Eixo de custo de um guide ou sensor. Computacional: determinístico, milissegundos, zero token quando passa. Inferencial: semântico, caro, não determinístico. *(Fowler)* |
| **Escalar pelo diagnóstico** | Falha por falta de informação pede mais contexto; falha por comportamento errado pede mais regra. Eixos diferentes; escalar o errado só encarece. |
| **Guide** | Orienta antes da ação (feedforward): specs, `CLAUDE.md`, regras, skills. É sempre um pedido. *(Fowler)* |
| **`mjrp doctor`** | Comando com contrato de saída **0 / 1 / 2 (não avaliável)** que checa conformidade, integridade e fluxo. O critério do que entra está na ADR-0002. |
| **Rastro** | O que o harness consegue garantir: o lado da **memória de longo prazo** — o decidido está num lugar previsível, e trabalho sem registro, decisão reaberta e saída errada são detectáveis. O que a memória de trabalho *retém* não se garante; o que lhe é *oferecido* e o que *persiste* fora dela, sim. |
| **Sensor** | O que detecta **depois** da ação que algo saiu errado, sem depender do agente cooperar: linter, type checker, teste, CI, `doctor`. Devolve 0 ou 1. Par oposto do *guide*, que orienta antes. |

## Skills e distribuição

| Termo | Definição |
|---|---|
| **Core / Advanced / Toolkit** | As três camadas de skills. Core: sempre ligado. Advanced: puxado por gatilho. Toolkit: domínio e trabalho, fora do loop de código. |
| **Description-as-changelog** | Falha em que publicar uma skill substitui a description de roteamento por um resumo da alteração. A skill para de disparar por intenção — quebrada parecendo saudável. |
| **Drift de três vias** | Uma skill existe instalada na ferramenta, em `mjrp-skills/` e commitada no Git, e nada força concordância — e ninguém sabe quando divergiu. |
| **Earn every skill** | Uma skill só fica se acelera o loop ideia→entregue. |
| **Feedback implícito** | Sinal barato de que uma skill não presta, sem formulário: interrupção precoce, correção do output, reformulação, regeneração, comprimento da conversa. *(Chip Huyen)* |
| **Skill** | Procedimento escrito que o agente carrega quando a tarefa pede. É memória procedural explícita — não é agente, não é ferramenta, não é conhecimento documentado. |

## Método e ciclo — spec-driven development

| Termo | Definição |
|---|---|
| **Agile specking** | Specs pequenas com checkpoints curtos, em vez de uma spec grande antes de tudo. *(Karpathy)* |
| **BMAD** | *Breakthrough Method for Agile AI-Driven Development* — SDD com **agentes por papel** (Analyst, PM, Architect, SM, Dev) e caminhos dimensionados pelo tamanho do trabalho: *trivial · one session · epic-sized · project-sized*. Daí vem a regra da cerimônia do PRD. É o parente mais próximo do que o MJRP constrói. *(bmad-method.org)* |
| **Constitution — duas camadas** | `PRINCIPLES.md` (harness) é **universal** e herdado; `docs/specs/constitution.md` (projeto) o **estende** com o que é específico da stack, nas normas do Spec Kit — nunca reescreve um princípio. O gate que faltava: no Pós-Plan da SDD, `plan.md` é checado contra os dois. |
| **Delta spec** | Especificação escrita como **diferença** do que já existe, não como documento completo: seções `ADDED`, `MODIFIED`, `REMOVED`. Reduz conflito quando várias mudanças tocam a mesma spec — e é o formato natural para brownfield. *(OpenSpec)* |
| **EARS** | *Easy Approach to Requirements Syntax* — requisito escrito em forma restrita e testável ("quando X, o sistema deve Y"), em vez de prosa. Usado pelo Kiro no `requirements.md`. *(proposto no MJRP)* |
| **Etapa** (*stage*, nas skills) | Cada parada de um loop do PDLC, com dono, entrada, saída e critério de saída — Explorar, Enquadrar e Desenhar na Discovery; especificar, planejar, quebrar, executar ⇄ verificar e a reconferência visual independente no Delivery ([[pdlc-loops]]). *Antes: estação* (até 2026-10-12, quando o MJRP preferiu "etapa", mais comum em pt-BR). |
| **Kiro** | O SDD da AWS. Separa **contexto durável do projeto** (`steering/`: product, tech, structure) de **escopo por feature** (`requirements.md` em notação EARS → `design.md` → `tasks.md`). A separação steering × spec é o mesmo eixo do MJRP entre identidade e ciclo. *(AWS)* |
| **OpenSpec** | SDD leve em que o escopo mora **por mudança**, nunca no projeto: cada `proposal.md` declara o que inclui e o que **exclui explicitamente**. Introduz a **delta spec** — `ADDED`/`MODIFIED`/`REMOVED` relativo ao comportamento atual — em vez de reescrever a spec inteira. *(Fission-AI/OpenSpec)* |
| **Pronto para construir** (*Ready to build*) | O portão entre a Discovery e o Delivery: o humano aprova os requisitos Ready, com os critérios apontando para estados de tela julgados. Não é uma etapa de trabalho nem uma caixa do diagrama; a via rápida não passa por ele, porque o MJRP já está olhando a tela. Até 2026-10-24 chamava-se «contrato», nome que sai porque contrato, para o humano, significa muitas outras coisas (o `.mjrp-project.yml` é o *contrato do projeto*, outro assunto). ([[pdlc-loops]] §4; MJRP, 2026-10-24 14:23) |
| **SDD** (*spec-driven development*) | Método em que a **especificação é o artefato primário** e o código é derivado dela, não o contrário. Cada artefato deriva de um pai, e implementar sem spec aprovada quebra a cadeia. É o método do perfil `code-app` do MJRP. |
| **Spec Kit** | O SDD do GitHub: `constitution` → `specify` → `plan` → `tasks` → `implement`. É a base do SpecKit do MJRP. **Não tem documento de escopo**: a fronteira é conceitual (spec = *o quê/por quê*, plan = *como*) e a constitution limita complexidade, não features. *(github/spec-kit)* |
| **SpecKit** | Os documentos vivos em `docs/specs/` do MJRP — **9 artefatos** desde 03/10/2026 ([[spec-kit]]): `prd` (com os requisitos por épico) → `spec` → `plan` → `tasks` → `uat` (a cadeia, cada um derivado do anterior), mais `constitution`, `arch`, `data-model` e `design-system` (o contexto durável que a cadeia consulta). `prd` vem do BMAD, não do Spec Kit; `uat` é extensão do MJRP. `research`, `contracts`, `quickstart` e `checklists` do Spec Kit original **não são arquivos** aqui: vivem como seções opcionais de `plan.md`/`tasks.md` — fusão declarada, não omissão. Arquivo de apoio de um projeto (um diagrama, uma planilha) não entra na lista. |
| **Steering files** | Arquivos de contexto de projeto que valem para **toda** atividade, distintos da spec de uma feature. No Kiro: `product.md`, `tech.md`, `structure.md`. No MJRP o papel é do `VISION.md`, do `constitution.md` e do `.mjrp-project.yml`. *(Kiro)* |
| **UAT / Homologação** (`docs/specs/uat.md`) | O aceite pelo humano (MJRP) **depois** do deploy — o Spec Kit termina no *implement*, o MJRP não. É um rastreador de issues mínimo: cada item tem contexto (release/feature em que foi visto), tipo (*bug* ou *mudança*), status e o **OK do humano** que confirma o fechamento. Sem plano de teste nem casos de teste — os cenários de aceite continuam no `spec.md`. Décimo artefato do [[spec-kit|SpecKit]]. |
| **Via padrão** | Uma das duas vias do Intake ([[pdlc-loops]] §2): resultado novo ou feature nova. A Discovery vem antes, **do tamanho da novidade**, depois o «Pronto para construir» e o Delivery; a documentação completa e o protótipo vêm **antes** da execução. Substitui as quatro trilhas antigas (Full, Standard, Fast track, Fix). (MJRP, 2026-10-24) |
| **Via rápida** | A outra via do Intake: uma mudança, criar ou atualizar, que o MJRP quer ver na hora; o conserto de defeito vai por ela. Brief, issue no board, execução e **validação dele na tela** (ou a reconferência independente, na trilha Agente); a documentação e o protótipo vêm **depois**, e o passo retroativo é obrigatório e cobrado por sensor (`pdlc_vocabulary_check.py`). Quem pede a via é o MJRP, nunca o agente. ([[pdlc-loops]] §2; MJRP, 2026-10-24 11:19) |

## Agentes, orquestração e loop

| Termo | Definição |
|---|---|
| **Agent swarm** | Padrão de orquestração em que cada agente recebe só uma personalidade e o problema é jogado ao grupo, sem caminho definido. Para problemas ambíguos — o oposto do grafo. *(Google Cloud Tech)* |
| **Agente** | Modelo usando ferramentas em loop, de forma autônoma, para agir *(Anthropic)*. Composição: modelo (plataforma) + skill (harness) + ferramentas (contrato) + contexto. A sessão da AI Platform que carrega as skills já é um agente, generalista; o MJRP ainda não tem agente **próprio** — um papel fixo, com skills e ferramentas definidas (ex.: o futuro `mjrp-judge`). |
| **Fan-out / join / router** | Os três padrões de um grafo: disparar n processos em paralelo; esperar o mais lento e sintetizar; rotear condicionalmente conforme o resultado. É a forma das rotinas de manutenção do MJRP — ver `docs/diagrams.md` nº 6. *(Google Cloud Tech)* |
| **Graph engineering** | Fluxo do agente como grafo de nós (agente ou função determinística) e arestas — um "organograma" do trabalho. Enfatiza **comportamento** (o que entra, em que ordem, o que vem depois), ao contrário de *knowledge graph*, que enfatiza **dado**. Padrões: fan-out, join, router. Serve quando o fluxo é conhecido de antemão. *(LangChain; Google Cloud Tech)* No MJRP: entra na manutenção, não na sessão — §3.2 da proposta. |
| **Intake** | A porta de entrada do [[pdlc-loops]]: toda demanda (pedido do MJRP, requisito novo, bug do UAT, achado de sensor, aprendizado do Learn) é recebida, qualificada e posta numa de duas vias — padrão ou rápida — ou rejeitada com motivo. **Hoje** é a triagem; **no sentido amplo**, a pré-venda (captar a oportunidade, estimar, mandar proposta), que vale quando houver cliente. (MJRP, 2026-10-07) |
| **Loop engineering** | "Projetar fluxos agênticos, ou loops, que guiam iterativamente o agente até a conclusão de um objetivo com intervenção humana mínima" *(IBM)*. Está para o harness como uma parte para o todo: o loop é o componente 1 do mapa; o harness é o entorno inteiro. |
| **Orquestrador** | Quem roteia entre as fases do ciclo de vida: o humano (*AI Collab*) ou um agente que lê o contrato (*Autonomous*). Hoje é a `pdlc` em prosa. |

<!-- BEGIN gerado por mjrp-scripts/gen_terms.py — nao edite a mao -->

## Conceitos com página própria

> Gerado de `docs/wiki/*.md` — a primeira frase do `## Definition` de cada página.
> Corrija na página, não aqui; `gen_terms.py --check` reprova se divergirem.

| Termo | Definição |
|---|---|
| **[A prática de ADR](adr-practice.md)** | Uma **ADR** registra uma decisão grande — a que tem alternativas, custos e consequências que sobrevivem a quem a tomou. |
| **[Agente e agêntico — os conceitos](agents-agentic-concepts.md)** | Um **agente** é software que não apenas responde: decide e age. |
| **[Architecture Review — o cânone da crítica de arquitetura](architecture-review.md)** | A **Architecture Review** é a passada que julga uma decisão de arquitetura — uma ADR em `Proposed`, os esqueletos `arch.md` e `data-model.md`, a `constitution.md` — ou o código no portão de um marco, contra um checklist externo. |
| **[Arquitetura de memória](memory-architecture.md)** | A memória do harness é o que persiste **fora da janela** e precisa ser trazido de volta. |
| **[Biblioteca de paletas MJRP](palette-library.md)** | A **MJRP Personal Palette Library** é o conjunto de paletas curadas para output com a identidade visual pessoal do MJRP — infográficos de reunião, dossiês, decks, site pessoal. |
| **Board architecture** | O **board** é o kanban do Control Center: o lugar em que o humano vê o trabalho das features e das issues andar e **decide** arrastando — aceitar, reabrir, ordenar a fila, fechar uma issue. |
| **[Cânone de design](design-canon.md)** | O **cânone de design** é o corpo de referência externo que fundamenta as regras de UX, UI e conteúdo explicativo do MJRP — 41 fontes fichadas em `docs/wiki/sources/`, organizadas em oito disciplinas, cada regra com um **ID estável** que as skills de design citam em vez de recitar. |
| **[Cânone de engenharia](engineering-canon.md)** | O **cânone** é o corpo de referência que fundamenta os princípios de engenharia do MJRP: *The Pragmatic Programmer* (Andrew Hunt e David Thomas), *Clean Code* e *Clean Architecture* (Robert C. Martin) e *Refactoring* (Martin Fowler; ficha em `docs/wiki/sources/1999-fowler-refactoring.md`), que dá nome aos sinais de código ruim e à refatoração que resolve cada um. |
| **Catálogo de ferramentas** | O **catálogo** é a **prateleira**: o registro vivo do que a MJRP já tem à mão, para o agente consultar **antes de pesquisar na web**. |
| **[Conceitos base](base-concept.md)** | A **cadeia de intenção** que ordena todo documento do MJRP que declara para onde se vai: **Propósito → Visão → Objetivo → Roadmap**. |
| **[Contexto e memória](context-vs-memory.md)** | **Contexto** é o conjunto de tokens presentes na janela do modelo **nesta chamada**: estado momentâneo, finito, reconstruído a cada turno. |
| **[Design patterns](design-patterns.md)** | A referência de **padrões de projeto** do harness: para cada padrão, o **problema** que ele resolve, o **sinal mínimo** que autoriza usá-lo, **quando não usar**, a forma **funcional** e a forma **OO**, o **teste S/N**, o **sensor** que já o confere e o **endereço** (onde o harness já o usa). |
| **Distribuição de skills** | Uma skill do MJRP existe em **três lugares ao mesmo tempo**: a fonte em `mjrp-skills/`, o derivado em `dist/` que o `marketplace add` lê, e a **cópia instalada** na ferramenta que a usa. |
| **[Documento de visão](vision-document.md)** | O documento que responde **por que este projeto existe e onde ele quer chegar**. |
| **Dores recorrentes** | As quatro falhas recorrentes do desenvolvimento agêntico que o MJRP Harness existe para atacar: **perda de contexto e memória**, **inconsistência entre projetos**, **a tensão vibe × rigor** e **ausência de verificação independente**. |
| **[Executar uma nota de conformidade](conformance-notes.md)** | Uma **nota de migração** (`mjrp-scripts/migrations/CM-NNNN-*.md`, no projeto) é um passo de versão de um item do **catálogo canônico** (`mjrp-scripts/canonical_catalog.json`): diz o que o projeto precisa ter para ficar conforme, por quê, e os passos — cada um com a skill que o faz. |
| **External locations** | A memória de **referência** (ADR-0008): fato durável sobre **onde algo está**, que o agente não descobre sozinho. |
| **Ferramentas** | Tudo o que um agente ou uma pessoa pode **chamar para agir** — em três camadas (do produto, da construção, do agente) e três estados de operação, sendo que a ferramenta que só o humano opera é um gate não declarado. |
| **[Governança de git](git-governance.md)** | **Governança de git** é o conjunto de regras que faz o histórico de um projeto ser legível por quem vem depois — humano ou agente: cada commit diz o tipo da mudança e o porquê, os estágios do SDD deixam marca no histórico, e o que é estável fica separado do que está em curso. |
| **[Grafo de requisitos — nós, arestas tipadas e releases](requirements-graph.md)** | O **grafo de requisitos** é a documentação do PDLC tratada como grafo de conhecimento: cada requisito, épico, release, feature, REQ do spec, task, estado observável e teste é um **nó com ID estável**, e cada relação entre eles é uma **aresta tipada** — com nome, direção, origem e destino permitidos e cardinalidade. |
| **[Graph engineering — o conceito](graph-engineering-concept.md)** | **Graph engineering** é desenhar o fluxo do agente como um **grafo** — um organograma de nós e arestas — em vez de um loop único. |
| **[Harness — o conceito](harness-concept.md)** | O **harness** é tudo o que envolve o modelo para transformá-lo em agente: as ferramentas, o loop que o executa, e o mecanismo que avalia se ele terminou. |
| **[Harness elements](harness-elements.md)** | Os **sete elementos** que compõem o entorno de um modelo de linguagem para que ele produza trabalho confiável — os mesmos que o diagrama do PDLC em loops nomeia ([[pdlc-loops]]). |
| **[Harness kaizen](harness-kaizen.md)** | O registro do que o harness **não pegou** e do que se aprendeu com isso. |
| **[Hooks — o conceito](hooks-concept.md)** | Um **hook** é um evento que dispara um script: **o evento responde *quando* o código roda; o script responde *o que* ele faz**. |
| **[Knowledge graph e ontologia — o conceito](knowledge-graph-concept.md)** | Um **knowledge graph** é um grafo de dados sobre um domínio: os **nós** são as entidades de interesse e as **arestas** são as relações entre elas. |
| **[Loop engineering — o conceito](loop-engineering-concept.md)** | **Loop engineering** é projetar o ciclo que roda **sem você**: o agente raciocina, age, observa e ajusta até atingir um objetivo. |
| **[Notas ligadas (o modelo "Obsidian-like") — o conceito](linked-notes-concept.md)** | O modelo **"Obsidian-like"** é organizar conhecimento em **notas atômicas e densamente ligadas**, em arquivos de texto simples, navegadas pelos links entre elas e não pela hierarquia de pastas. |
| **[O doctor](doctor.md)** | O **doctor** é o sensor do harness: um script que lê a instância e devolve verde, amarelo ou vermelho por critério nomeado. |
| **O mapa de artefatos do PDLC** | O **mapa de artefatos** diz, para cada arquivo que o PDLC gera, **onde mora**, **quem o cria**, **em que etapa**, **quando a via padrão e a via rápida o atualizam** e **se o passo retroativo da via rápida o cobra** ([[pdlc-loops]] § 2.1): **■ entra**, **◩ só se** a feature mexeu no que ele descreve, ou **□ não entra**. |
| **Opções para construir agentes — as quatro abordagens** | Existem **quatro caminhos** para construir um agente de IA hoje, e eles variam num único eixo central: quanto de infraestrutura, loop de execução e orquestração você **possui** versus quanto o provedor **cuida para você**. |
| **[PDLC em loops — Intake, Discovery, Delivery, Learn](pdlc-loops.md)** | O **PDLC do MJRP** é uma **fundação** e **três loops** — **Discovery** (o que construir), **Delivery** (construir certo) e **Learn** (deu certo?) — alimentados por uma porta de entrada única, o **Intake**, que põe cada demanda numa de duas **vias** (a **padrão** e a **rápida**). |
| **[Perfis de projeto](project-profiles.md)** | **Perfil** é o que o projeto **entrega**, e é o que o campo `profile:` do contrato declara: `code-app` (software), `content` (vault, dossiê, pipeline editorial) ou `meta` (o próprio harness). |
| **[Product Discovery — do problema à decisão (Rapid × Full)](product-discovery.md)** | O **Enquadrar** é a etapa da Discovery ([[pdlc-loops]] §3) em que o responsável pelo produto (o PM), com o agente coach, transforma o que o Explorar mostrou numa decisão: o problema que vale resolver, o resultado que se quer mover e como medi-lo, os quatro riscos do produto convertidos em testes, a premissa mais arriscada e o desenho do teste dela — e então **matar, iterar ou avançar**. |
| **Revisão de essencialidade — o que o harness mantém** | A revisão em que o MJRP decidiu que **o harness entra no próprio SDD**: ganha `docs/specs/prd.md` escrito do zero, o `ROADMAP.md` é reescrito do zero a partir do que o `VISION.md` promete, e o `BACKLOG.md` é arquivado — seu papel de intake passa ao PRD (Epic *Enhancements*), a numeração recomeça do zero. |
| **Skill standard** | A **skill** is a written procedure the agent (LLM/code) loads when the task calls for it — explicit procedural memory ([[terms]]). |
| **Skills map** | O **mapa das skills** diz, para cada skill da fábrica (`mjrp-skills/mjrp-sw-factory/`), **onde ela atua** no PDLC em loops ([[pdlc-loops]]) e **com que papel**: orquestra, produz, julga, corrige ou registra. |
| **[Spec Kit e SpecKit — o SDD do MJRP](spec-kit.md)** | **SpecKit** é a adaptação do MJRP ao Spec Kit do GitHub: os **9 documentos vivos** de `docs/specs/` — a cadeia `prd → spec → plan → tasks → uat`, em que cada um deriva do anterior (os requisitos são nós, um arquivo cada, e o PRD é o mapa deles; spec, plan e tasks moram na pasta de cada feature), mais o contexto durável que a cadeia consulta, `constitution`, `arch`, `data-model` e `design-system`. |
| **Tipos de relatório** | Todo relatório sob `reports/` declara no cabeçalho um `type:` que está na **lista única do harness**, `mjrp-scripts/report_types.json` (formato `report_types@1`, vendorizado para os filhos junto com o kernel). |

<!-- END gerado -->

## Proposto — ainda não existe

⚠️ **Nada nesta seção existe no repositório.** São conceitos com nome reservado e desenho pensado,
que entram quando a fase deles chegar no `ROADMAP.md`. Um agente que os encontre **não deve agir
como se existissem**.

| Termo | Definição |
|---|---|
| **Checkpoint incremental** | Escrever memória durante a sessão, não no fim — a operação *write* feita cedo, quando a janela ainda não está cheia. *(proposto)* |
| **Evaluations** | Caso de teste de uma skill: entrada conhecida e critério de aprovação escrito antes. *(proposto — candidato no PRD, junto do verificador do entregável, EP-02)* |
| **Governança de ferramenta** | Três baldes calibrados pelo custo de errar — Always do / Ask first / Never do — aplicados no nível da chamada da ferramenta. *(proposto)* |
| **Guardrails** | Limite que impede uma ação antes de ela acontecer — distinto de *sensor*, que detecta depois. Uma das onze peças. *(proposto)* |
| **`harness.lock`** | Arquivo na instância declarando o que foi instalado, de qual versão, com quais hashes. *(proposto)* |
| **Manifesto** | `manifest-<versão>.json` publicado pela fonte a cada release: nome, caminho, hash e categoria de cada skill. *(proposto)* |
| **Observabilidade** | Permite diagnosticar sem fazer deploy novo — distinta de monitoring, que só detecta que quebrou. *(proposto)* |
| **Roteamento de modelo** | Tarefa diferente, modelo diferente — declarado no contrato, nunca escolhido em runtime. *(proposto)* |
| **Rubrica** | O critério de avaliação escrito antes do mecanismo, amarrado a um limiar de utilidade. *(proposto)* |
| **Validação por schema** | Tipos na porta, semântica no livro-razão: marker e frontmatter validados contra schema, não lidos com regex. *(proposto)* |

## History

- **2026-10-13 19:00** · **Subprojeto** sai e entra **Projeto aninhado** (ADR-0020): o app dentro do harness é um projeto como os outros, com épicos próprios e `contributes_to`; `parent_epic` sai do contrato.
- **2026-10-12 16:57** · Entra **Etapa** (antes: *estação*), na parte escrita à mão: o MJRP preferiu "etapa", mais comum em pt-BR; o texto em português do kernel troca a palavra, as skills seguem em inglês com *stage* (decisão do MJRP, 2026-10-13), e as entradas antigas de `## History` e do `docs/log.md` ficam como foram escritas.

- **2026-10-09 20:55** · Revisão geral de 2026-10-09: "MJRP", não "Zé", no texto vivo; entram **Subprojeto** (do harness) e **Wireframe**, na parte escrita à mão — não têm página própria, então não saem do bloco do `gen_terms.py`.
