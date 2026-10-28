---
title: Arquitetura de memória
aliases: [memory-architecture, solução de memória, memória do harness, MEMORY.md]
summary: onde cada coisa que persiste mora e quando entra na janela — a arquitetura da ADR-0008, o que as referências fazem, e de onde veio a escolha
tags: [harness, memoria, fundamento]
status: firme
atualizado: 2026-10-11
fontes: [2026-claude-code-auto-memory, 2026-04-04-karpathy-llm-wiki, 2023-10-memgpt-virtual-context, 2025-cline-memory-bank, 2023-09-coala-cognitive-architectures-language-agents, 2025-anthropic-effective-context-engineering]
---
<!-- kernel do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
A memória do harness é o que persiste **fora da janela** e precisa ser trazido de volta. Esta
página responde **onde cada coisa mora e quando ela entra na janela** — o mapa que o `AGENTS.md`
aplica em forma de tabela e que as duas skills de contexto operam. A fronteira entre os dois eixos
(o que persiste × o que está na janela agora) é [[context-vs-memory]].

## What it is

### A arquitetura, hoje

Decidida pela ADR-0008 (`Accepted`, 08/09) e **implementada** entre 09 e 10/09. Três lugares,
com papéis que não se sobrepõem:

| Onde | O que guarda | Entra na janela |
|---|---|---|
| `MEMORY.md` | **estado** — `## Now` (quatro blocos, sobrescreve) e `## Ways of Working` (preferências e correções do MJRP) | **sempre** |
| `docs/wiki/<assunto>.md` | **semântica** — o que é verdade sobre o assunto, e a decisão que o mudou, na seção `## History`, com data | sob demanda, pelo `index.md` |
| `docs/log.md` | **episódica** — uma linha datada por decisão ou bloco de trabalho; *append-only* | **nunca inteiro**; por data ou `grep` |

Mais a ADR para decisão grande com alternativas e consequências ([[adr-practice]]), e o
[[harness-kaizen]] para achado sobre o próprio harness — onde o erro e a lição moram juntos.

**O que fecha o ciclo são as skills.** A `mjrp-pdlc-onboarding` é o *select*: lê `## Now` +
`## Ways of Working` + `wiki/index.md` (camada 1, sempre), abre a página do assunto sob demanda, e
nunca lê o log inteiro. A `mjrp-saving-context` é o *write*, e escreve **nesta ordem**: o
`## Now`, a decisão na página, a linha datada no log — a memória antes do log, porque um save que
só escreve no log deixa a próxima sessão sem estado.

**O que mantém curto não é contagem de linha, é forma.** O sensor **F1** (`doctor.now_shape`, a
mesma implementação usada pelo `memory_check --forma`) verifica: os quatro blocos presentes e na
ordem; bloco com mais de três linhas **sem ponteiro** reprova — o que não cabe em duas linhas vira
`página` ou data do log; `ponteiro` que não resolve reprova; os dois *Pending* levam data e
avisam ao passar de `memory.pending_expiry_days`; linha repetida do `AGENTS.md` avisa; camada 0
acima de `memory.layer0_budget_chars` avisa. Os limiares moram no contrato (`.mjrp-project.yml`,
blocos `locale:` e `memory:`).

**A regra do que não entra:** o que se deduz do repositório (estrutura, caminhos, o que o
`git log` conta) e o que o `AGENTS.md` já diz. Memória que repete o que se pode ler é custo fixo
sem informação — e foi por violá-la que o próprio header do `MEMORY.md` caiu em 10/09.

### O que as referências fazem

Seis fontes primárias, lidas pelo mesmo crivo: o que fica **sempre em contexto**, o que vem **sob
demanda**, **quem escreve**, como **consolida**, e se há **teto**.

| | Sempre em contexto | Sob demanda | Quem escreve | Consolida como | Teto |
|---|---|---|---|---|---|
| **Claude Code auto memory** | `MEMORY.md` = **índice**, uma linha por memória | um arquivo por tema (`feedback_*.md`, `user_*.md`) | o agente; o humano escreve `CLAUDE.md` à parte | produto avisa perto do limite: "one line per entry, move detail into topic files, merge or drop stale"; *auto-dream* periódico | **200 linhas / 25 KB do índice** — o que passa não carrega |
| **Karpathy LLM Wiki** | o schema (`CLAUDE.md`) + `index.md` | páginas da `wiki/`; `log.md` **nunca inteiro** | o agente escreve a wiki; o humano traz fontes e faz perguntas | *lint*: contradição, afirmação velha, órfã; *ingest* atualiza 10–15 páginas por fonte | nenhum |
| **MemGPT / Letta** | *memory blocks* rotulados, *pinned* ao system prompt | *recall* (histórico integral, pesquisável) e *archival* | o agente, por função (`core_memory_replace/append`) | aviso de pressão de memória → o agente descarrega antes do descarte | **por bloco, em caracteres** |
| **Anthropic memory tool** | nada fixo — o protocolo manda `view /memories` antes de tudo | tudo: arquivos que o agente cria e lê quando precisa | o agente | instrução: "keep it up-to-date, coherent and organized… rename or delete files no longer relevant" | nenhum |
| **Cline Memory Bank** | **todos os seis arquivos** ("read ALL… not optional") | nada | o agente, por comando do humano ("update memory bank") | revisão completa a cada marco | nenhum |
| **CoALA** | memória de trabalho = o contexto | as três de longo prazo, via *retrieval* | *learning* escreve trabalho → longo prazo | — (é taxonomia, não produto) | — |

O que converge, e é o que vale copiar:

1. **O que fica em contexto é pequeno e tem forma fixa** — índice (Claude Code), blocos com
   limite (Letta), `index.md` + schema (Karpathy). O Cline é a exceção — e é exatamente o custo
   que o nosso harness existe para reduzir.
2. **O histórico completo existe, mas não carrega** — `recall` no Letta, `log.md` no Karpathy,
   arquivos por tema no Claude Code. Ninguém lê 46 decisões para começar a trabalhar.
3. **O agente escreve e o agente poda** — em todos, menos no Cline. E a poda tem gatilho: aviso
   de limite (Claude Code, Letta) ou operação de lint (Karpathy).
4. **O que se deduz do repositório não entra na memória** — Claude Code é explícito; Karpathy
   também (a wiki resume as fontes, não as copia).

E o que o nosso arquivo faz de diferente de todos: **carrega inteiro, acrescenta sempre, e não
tem gatilho de poda** — a ADR-0005 disse "condensar faz parte da escrita", mas nada dispara.

## De onde veio a escolha

> **Proveniência, não estado.** O que segue é a comparação que levou à ADR-0008, escrita
> quando nada disto existia. Fica porque explica **por que** a arquitetura é esta — não porque
> descreve o repositório de hoje. **Os números desta seção são de 08/09** e não foram atualizados
> de propósito: são o retrato do problema que motivou a mudança. Onde o registro diz *ADR-0007*,
> leia **ADR-0008**: era o número previsto no plano, e a decisão saiu com o seguinte — a 0007 é
> outra coisa (as duas checagens que entraram depois).

### O problema que existia, em números


O `MEMORY.md` nasceu em 07/09 (ADR-0005) e absorveu o `CURRENT.md` em 08/09 (ADR-0006). Um dia
e meio depois:

| Seção | Linhas | Entradas | O que é, pelos três tipos |
|---|---|---|---|
| `## Now` | 18 | — | **estado** (memória de trabalho persistida — não é tipo de longo prazo) |
| `## Ways of Working` | 14 | 7 | **procedural** — correções e preferências dele |
| `## Decidido` | 140 | 46 | **semântica** — decisões; 65 % do arquivo |
| `## Sobre o próprio harness` | 23 | 7 | **semântica** (achados) + **episódica** (incidentes) |
| total | **217** | 60 | ≈ 2.700 palavras, **≈ 4.300 tokens** em toda sessão |

Somado ao `AGENTS.md` + `CLAUDE.md` (≈ 2.800 tokens) e às 51 descriptions (≈ 8.000), o custo fixo
de abrir uma sessão passa de **15 mil tokens** — e o `MEMORY.md` é a parte que cresce a cada
troca. O diagnóstico não é "está grande": é que **um arquivo faz três papéis** — bloco de estado,
livro de decisões e registro de aprendizado — e só o primeiro precisa estar em contexto sempre.

### Candidata A — índice + arquivos por tema (a forma do Claude Code)

O `MEMORY.md` vira **índice**: o `## Now` (bloco de estado, sobrescreve; quatro blocos, detalhe vira ponteiro) mais
**uma linha por memória**, apontando para o arquivo onde o detalhe mora. O detalhe vai para
`docs/memory/` — um arquivo por tema, no formato que o Claude Code usa (`type:` no frontmatter:
`feedback`, `project`, `reference`, `user`).

```
MEMORY.md                     índice: ## Now + uma linha por tema → carrega sempre (≤ 60 linhas)
docs/memory/
  feedback-brief.md           correções sobre brief e aprovação           type: feedback
  feedback-arquivos.md        nomes em inglês, backup antes de sobrescrever, ponteiro só com destino
  project-revisao-geral.md    decisões da revisão geral (o Decidido de hoje, por assunto)
  project-vision.md           decisões sobre o VISION (07–08/09)
  harness-incidentes.md       o que o harness não pegou, com data                type: project
```

- **Quem escreve:** o agente, na hora, como hoje — mas escreve no arquivo do tema e **uma linha**
  no índice. Decisão que vira regra permanente continua migrando para `AGENTS.md`; decisão grande
  continua virando ADR.
- **Consolida:** quando o índice passa de N linhas (o número é a decisão), o agente funde ou
  aposenta entradas — o gatilho é o **F1** avisando, não a memória dele.
- **Sensor:** F1 mede a forma do `## Now` (quatro blocos, ponteiros, Pending datado) — não linhas — e todo ponteiro do
  índice resolve (o I3 já sabe fazer isso).
- **O que muda:** `mjrp-onboarding` lê o índice e abre o tema só se a tarefa pedir; o handoff
  escreve nos dois. `structure.yml` declara `docs/memory/`. Bootstrap copia o índice vazio.
- **Custo por sessão:** índice de 40–60 linhas ≈ **700–1.000 tokens** (hoje: 4.300).
- **Risco:** é um segundo lugar para decisões — `docs/memory/project-*.md` e `docs/decisions/`
  passam a disputar. A regra tem que ser nítida: ADR é imutável e tem consequências; o arquivo de
  tema é o que ainda não mereceu ADR.

### Candidata B — a wiki é a memória, o log é a história (a forma do Karpathy)

O `MEMORY.md` encolhe para o que **só ele** pode ser: `## Now` + `## Ways of Working`
(≤ 40 linhas, carrega sempre). Tudo o que é **semântico** — decisões, achados sobre o harness —
vai para a **wiki** (`docs/wiki/`), na página do assunto: uma decisão sobre o VISION vive em
`vision-document.md`, uma sobre memória vive nesta página, uma sobre o doctor vive na página
do doctor. O que é **episódico** — "em tal dia decidimos X" — vai para o **`log.md`**, uma linha
por evento, com data, *append-only*, que ninguém carrega inteiro.

```
MEMORY.md                     ## Now + ## Ways of Working → carrega sempre (≤ 40 linhas)
docs/log.md                   uma linha por decisão/incidente, com data — histórico, não contexto
docs/wiki/<assunto>.md        a decisão vive na página do assunto, seção ## History (com data)
docs/decisions/NNNN-*.md      ADR, como hoje — decisão grande, imutável
```

- **Quem escreve:** o agente, na hora — **duas linhas**: uma na página do assunto (a decisão, com
  data) e uma no `log.md` (o evento). Correção sobre como o Zé trabalha continua no `MEMORY.md`.
- **Consolida:** é a operação *lint* do Karpathy, que o `check_docs` já começa a fazer: página
  órfã, wikilink quebrado, `## Definition` ausente. Entram duas checagens: decisão no `log.md` sem
  página correspondente; página sem `atualizado:` há mais de N dias com decisão nova no log.
- **Sensor:** F1 vira "`MEMORY.md` ≤ 40 linhas e não mais velho que o commit"; o teto passa a ser
  viável porque o arquivo só tem estado e preferências.
- **O que muda:** `mjrp-onboarding` lê `MEMORY.md` e, pela tarefa, a página da wiki (é o *query*);
  o handoff escreve `log.md` + página; o `SESSION_HISTORY.md` **vira** o `log.md` (BACKLOG #26) — a
  entrada de sessão vira um bloco `## [data] session` no mesmo arquivo, e o "Decidido" de hoje vira
  linhas `## [data] decision`. Bootstrap cria `MEMORY.md` mínimo e `log.md` vazio.
- **Custo por sessão:** `MEMORY.md` de 30–40 linhas ≈ **500–700 tokens**; a página da wiki entra
  só quando a tarefa é daquele assunto.
- **Risco:** exige que **exista página** para o assunto da decisão — hoje a wiki tem 6 páginas;
  uma decisão sobre "push" ou "PDF" não tem onde morar e vai forçar página nova (ou `terms.md`).
  E a decisão fica espalhada por assunto: "o que decidimos ontem?" é `grep` no `log.md`, não uma
  seção.

### Onde as duas coincidem

- O `## Now` fica onde está, pequeno e sobrescrito — é o *memory block* de todo mundo.
- O `## Decidido` **sai do `MEMORY.md`** nas duas. A diferença é para onde: arquivo por tema (A)
  ou página do assunto + log (B).
- O teto deixa de ser sobre "a memória" e passa a ser sobre **o que carrega sempre** — e aí 200
  linhas é generoso, não pouco.
- Nas duas, o `mjrp-onboarding` muda: hoje ela não lê o `MEMORY.md` (BACKLOG #13).

### A diferença que decide

**A** cria uma casa nova (`docs/memory/`) e mantém a memória do agente separada da semântica do
projeto — é mais simples de explicar, e é literalmente o que o Claude Code faz, então um agente
de lá se sente em casa. **B** não cria casa: reaproveita a wiki e o log que o BACKLOG #26 já vai
criar, e faz a decisão morar **ao lado da definição** que ela muda — o que é o argumento inteiro
da ADR-0003 (o verbete e a explicação não podem divergir porque são o mesmo arquivo). O preço
de B é precisar de página para cada assunto; o preço de A é ter dois lugares para decisão.

### O caminho da decisão, dia a dia

- **2026-09-08 20:50** · **Memória: três tipos, oito casas.** Tipos = CoALA (procedural, semântica, episódica);
  casas = a tabela do AGENTS, que ganha coluna *Tipo*; a aprendida é a casa que o agente escreve e cruza
  os três. Fontes: CoALA, LangChain *Memory for agents*, docs do Claude Code (auto memory), Karpathy *LLM Wiki*.
- **2026-09-08 20:50** · **Nomenclatura do Karpathy:** `log.md` → **`docs/log.md`** (pasta `sessions/` some);
  `docs/wiki/` → **`docs/wiki/`**; `docs/sources/` **fica** (não vira `raw/`). Renomeação toca skills
  (onboarding, handoff), contrato (`session_history`), AGENTS/HOWTO/README, wiki, glossário, sensores.
- **2026-09-08 20:50** · **Teto de 200 linhas:** o `MEMORY.md` é **exceção** — recebe ingestão a cada troca. O Zé duvida
  que o modelo atual de memória (um arquivo, acrescenta sempre) esteja certo: **pesquisar a solução de
  memória** antes de fixar teto ou checagem. Origem do número: limite real do auto memory do Claude Code
  (200 linhas/25 KB do índice); para CLAUDE.md é recomendação sem fonte primária; estudo arXiv 2605.10039
  (1.650 sessões) não achou efeito de tamanho na adesão — o custo é token por sessão, não obediência.
- **2026-09-08 20:59** · **Brief #28 (pesquisa de memória) aprovado** ("sim. vamos pesquisar"). Candidatas: wiki +
  `log.md` (Karpathy) e índice + arquivos por tema (Claude Code). Só fontes primárias. Checkpoint = ficha
  comparativa + PDF Kindle; ADR-0007 só depois da escolha; nada se implementa antes.
- **2026-09-08 21:08** · **ADR-0007 vai carregar a regra de conteúdo:** "o que se deduz do repositório e o que o
  `AGENTS.md` já diz não entra na memória aprendida" (emprestada do Claude Code). A candidata (A × B) o
  Zé escolhe depois de ler o PDF — parado até lá.
- **2026-09-08 21:34** · **Arquitetura de memória: candidata B (Karpathy).** Decisão vai para a **página da wiki do
  assunto** + linha datada no `log.md`; assunto sem página fica inteiro no log até ganhar uma. `MEMORY.md`
  guarda só `## Now` + `## Ways of Working`. **Achado sobre o harness + lição-aprendizado fundem em
  `harness-kaizen.md`** — o que falhou e o que se aprendeu ficam no mesmo lugar. Vira a ADR-0008.
- **2026-09-08 21:49** · **Referência mora numa página própria, sob demanda** (o nome saiu como `external-locations.md`); o `AGENTS.md` fica só com o
  caminho canônico. **`context-vs-memory.md`** vira página de conceito. Tudo na **ADR-0008** (`Proposed`).
- **2026-09-08 21:53** · **A implementação da ADR-0008 se divide:** #26a (`log.md`) **bloqueia**; #26b (`wiki/`) não.
  Depois, 28a (destinos existem + 46 decisões migram) → 28b (MEMORY encolhe, AGENTS remapeado) →
  28c (F1 e as duas skills). O **#13 é absorvido pelo 28c** e o **#27 pelo 28b** — a tabela das oito
  casas foi redesenhada pela 0008 depois de o #27 nascer; fazer antes seria escrever para apagar.
- **2026-09-08 22:12** · **#26b passou a vir primeiro** — o loop escreve em `wiki/harness-kaizen.md`; a pasta não pode
  ser renomeada debaixo dele. E o `memory_check` usa **assinatura (data + primeiras palavras)**: pega
  perda, tolera reescrita — contagem não pegaria troca, texto idêntico proibiria condensar.
- **2026-09-08 22:19** · **ADR-0008 aceita pelo Zé.** Primeira ADR a passar pelo gate novo (`Proposed` → ele lê →
  `Accepted`). Ponteiros de supersessão entraram na 0005 e na 0006 — "uma memória só" durou dois dias.
- **2026-09-08 22:19** · **As skills viram item próprio: 28d.** Estavam escondidas dentro do 28c e o Zé pegou.
  `mjrp-onboarding` (o *select*: lê o MEMORY, que hoje não lê; página conforme a tarefa) e
  `mjrp-saving-context` (o *write*: decisão na página + linha no log). **É o item que fecha** —
  sem ele a arquitetura existe no disco e ninguém a opera.
- **2026-09-07** · O `MEMORY.md` nasce **por projeto**; este é o primeiro e vira o modelo do
  bootstrap.
- **2026-09-09 16:40** · **O harness tem *write* e *storage*, e não tem *select*.** Nada lê o
  `MEMORY.md` no início da sessão, nada carrega o índice da wiki, nada mapeia tarefa → página.
  Hoje a memória volta ao contexto por **força bruta** — os 8.558 tokens do `MEMORY.md` entram em
  toda sessão pela cadeia de import. Consequência que eu não tinha visto ao montar o plano de
  migração: **28a e 28b, sozinhos, pioram a memória** — tiram a força bruta antes de existir o
  caminho de volta. O Zé pegou perguntando "como esse log vai ajudar o agente?".
  **A fazer quando o 28d chegar a vez dele** (não antes — one-piece flow): a `mjrp-onboarding`
  passa a ler `MEMORY.md` + `docs/wiki/index.md` (~400 tokens, e o índice já tem a coluna *"O que
  responde"*, que é o roteador); a página abre sob demanda. E o critério de migração ganha a
  coluna que faltava — **por onde isto volta?** — com quatro respostas: carrega sempre · sob
  demanda pelo índice · grep deliberado · **não migra, aposenta** (a pergunta que eu não fiz uma
  vez nas 100).

## How MJRP uses it

- **`MEMORY.md`** é a primeira leitura de toda sessão, e só tem duas seções. Estado sobrescreve;
  histórico não mora ali.
- **A decisão vai para a página do assunto**, com data, na `## History` — ao lado da definição que
  ela muda. Assunto **sem página** fica inteiro no `log.md` até o MJRP indicar que merece uma:
  não se cria página por conta própria.
- **O `log.md` responde *quando***, e só. Consulta-se por data ou `grep`; ninguém o lê inteiro.
- **Documento vivo diz só o que é verdade agora** (PRD, spec, página da wiki). Explicação — o porquê, o contexto, como se chegou ali — vai para uma seção `## Notas` antes da `## History`, apontada de onde é necessária; o que mudou vira uma linha datada e condensada na `## History` no fim; um parágrafo por linha (o editor quebra na janela; `unwrap_md.py --check`). Estado de trabalho não se digita em documento: vem dos nós (`gen_prd_status.py`). Quem confere é a `mjrp-auditing-docs`; quem conserta, a `mjrp-syncing-docs`.
- **Correção sobre como o MJRP trabalha** vai para `## Ways of Working`, na hora, com data e hora
  de Brasília — não no fim da sessão.
- **O que só está na conversa não está na memória** (S-61). A compactação de contexto apaga o que
  não foi escrito no repositório; por isso cada decisão do MJRP vai para o log assim que ele responde,
  e o `## Now` acompanha. Quatro mecanismos guardam isso:
  - o hook git `commit-msg` (`log_entry_check.py`) recusa commit sem entrada nova no log do projeto que
    ele toca — roda em toda sessão, local ou remota, porque o git roda onde o repositório está; o commit
    que toca mais de um projeto deve a entrada só ao log do projeto dono (`log_owner.root_paths` do contrato da
    raiz; senão a maioria dos arquivos; empate, a raiz — ADR-0020);
    a isenção por arquivo que carrega o próprio histórico: o contrato declara `mjrp_harness.self_logged`, e o
    commit que toca, naquele projeto, só esses arquivos, cada um com item novo na lista de histórico dentro
    dele, passa sem entrada — a edição à mão, sem linha de histórico, segue exigindo a entrada;
  - o F1 do doctor e o `check_docs` comparam a hora mais recente escrita no `## Now` com a da última
    entrada do log, e não a data do arquivo;
  - nas sessões que carregam os hooks do projeto, o `session_journal.py` grava o diário da sessão antes
    da compactação (`.mjrp/diary/`), devolve `## Now`, log e diário depois dela, bloqueia o fim do turno
    com resposta do MJRP sem registro e conta o uso de cada skill em `data/raw/skill-usage.csv`;
  - na sessão que não carrega esses hooks (a remota, que alcança o repo por ponte), a regra mora na
    `mjrp-pdlc-onboarding`: registrar cada decisão antes de seguir.

## History

> A decisão mora na página do assunto que ela muda, com data — é o modelo que esta própria página
> propôs, aplicado a ela mesma. O eixo do tempo fica no `log.md`.

- **2026-09-08** · **Candidata B, com escape.** Decisão vai para a página da wiki do assunto +
  linha datada no log; assunto sem página fica inteiro no log até ganhar uma (regra das duas
  explicações, ADR-0003). O `MEMORY.md` guarda só `## Now` e `## Ways of Working`.
  *Motivo:* reaproveita `wiki/` e `log.md` (BACKLOG #26) sem criar casa nova, e põe a decisão ao
  lado da definição que ela alterou.
- **2026-09-08** · **Achado sobre o harness e lição aprendida fundem em `harness-kaizen.md`** — o
  erro e o que se aprendeu com ele são o mesmo movimento; separados, viram duas metades inúteis.
- **2026-09-08** · **Referência mora numa página própria, sob demanda** (o nome saiu como `external-locations.md`). O `AGENTS.md` fica
  só com o caminho canônico — a única referência que muda a resposta de qualquer tarefa.
- **2026-09-08** · **A regra do que não entra:** o que se deduz do repositório e o que o
  `AGENTS.md` já diz ficam fora da memória aprendida. *(emprestada do auto memory do Claude Code)*
- **2026-09-09** · **O *select* e o *write* passam a existir nas skills (BACKLOG #28d).** A
  `mjrp-onboarding` abre a sessão pelo `MEMORY.md → ## Now`, **antes do log**, em três camadas
  (*progressive disclosure*): sempre `## Now` + `## Ways of Working` + `wiki/index.md` como
  roteador; sob demanda a página do assunto; deliberado o `log.md`, que **nunca se lê inteiro**.
  A `mjrp-saving-context` escreve as três: `## Now` (sobrescreve, ≤ 20 linhas), a decisão
  na página `## History` do assunto, e a linha datada no `log.md` — nesta ordem, com a memória
  **antes** da entrada de sessão. *Motivo:* até aqui a arquitetura existia no disco e nenhuma
  skill a operava — a volta `contexto → memória → contexto` não acontecia, e um save que só
  escreve no log deixa a próxima sessão sem estado.
- **2026-09-10** · **O `MEMORY.md` perde o header.** As cinco linhas de abertura ("Duas seções, e
  só elas... ADR-0008") repetiam, quase frase a frase, a tabela que o `AGENTS.md` já tem (linhas
  137–151) — e o `AGENTS.md` carrega toda sessão pela cadeia de import, igual ao `MEMORY.md`. O
  header violava a própria regra que enunciava ("não entra o que o `AGENTS.md` já diz"). O Zé
  pegou revisando o arquivo. *Motivo:* citação de ADR é proveniência, não estado — não muda
  sessão a sessão, e o arquivo que carrega sempre é o lugar mais caro para pagar por ela de novo.
- **2026-09-10 17:58** · **Headers são identificadores — inglês; e a seção pessoal perde o nome de
  pessoa.** `## Agora` → `## Now`, `## Como o Zé trabalha` → `## Ways of Working` (MJRP: seção com
  nome no título é anti-profissional), `## Decisões` → `## History` (o que mora ali é a linha do
  tempo do assunto — decisões, achados, auditorias — não só decisões). Os cinco headers estruturais
  da wiki seguiram. Renomeação mecânica em 41 arquivos, `doctor`/`memory_check`/`check_docs` e
  selftests ajustados e verdes. MJRP também decidiu: nenhuma skill cita ADR (o porquê mora na wiki),
  skills são agnósticas de plataforma ("AI Platform"), e o backlog não vai continuar em `.md` — vai
  ter ferramenta; portanto nada de ponteiro para o backlog no `## Now` (o `BACKLOG.md` foi arquivado em 17/09; os Epics vivem no `docs/specs/prd.md`). Em aberto: o teto de 20
  linhas (sensor de forma/ponteiros, ou expiração por período) — MJRP pediu um exemplo prático de
  `MEMORY.md` antes de decidir.
- **2026-09-10 18:32** · **O teto de 20 linhas do `## Now` caiu; o F1 mede a forma.** MJRP
  questionou o número: 20 linhas ≈ 400 tokens, irrelevante no orçamento — e como *erro* a contagem
  fazia o agente cortar justamente `Pending` e `Do Not Forget`, as linhas que evitam a próxima
  sessão errar. O sensor novo (`doctor.now_shape`, uma implementação, usada pelo F1 e pelo
  `memory_check --forma`) checa: os quatro blocos — renomeados por MJRP para `Where the Work
  Stopped`, `Pending on Agent`, `Pending on Human`, `Do Not Forget` —; bloco com mais de três linhas
  sem ponteiro reprova (o que não cabe em duas linhas vira `página` ou data do log);
  `ponteiro` que não resolve reprova; os dois *Pending* levam data e avisam ao passar de
  `memory.pending_expiry_days` (expiração **por bloco**, ideia do MJRP — `Where` e `Do Not Forget`
  não expiram); linha repetida do `AGENTS.md` avisa; camada 0 acima de `memory.layer0_budget_chars`
  avisa. Contagem de linhas virou nota. Ponteiro para backlog **não** existe — o backlog virou o PRD (17/09) e, depois, ferramenta. Os limiares moram no contrato `.mjrp-project.yml`, que ganhou `locale:`
  (timezone, idioma de rótulo e de conteúdo) e `memory:` — resposta parcial à pergunta do MJRP sobre
  um arquivo de config do harness: o contrato já é esse arquivo. Termo agnóstico para a ferramenta
  que hospeda o agente: **AI Platform** (escolha do MJRP; "LLM/harness" saiu).
- **2026-09-10 21:59** · **A página parou de descrever a pesquisa e passou a descrever a
  arquitetura.** Revisão minuciosa achou 13 incoerências, três delas capazes de fazer um agente
  agir errado: o callout do topo dizia que a ADR-0008 estava `Proposed` (está `Accepted` desde
  08/09 — a própria `## History` desta página registrava isso) e que **nada estava implementado**
  (tudo está, desde 10/09); o `## How MJRP uses it` descrevia como "hoje" o `MEMORY.md` de três
  seções que a ADR-0008 aposentou; e a página citava **ADR-0007** como sendo a decisão de memória
  — a 0007 é outra coisa (I3 ampliada e W4), inclusive no `summary:` do frontmatter, que é o texto
  que aparece no índice da wiki. Mais: `where-things-live.md` citado duas vezes e nunca existiu
  (é o `external-locations.md`); números velhos que eram o argumento da página (oito casas → 13,
  6 páginas na wiki → 13, 51 descriptions → 53, os 8.558 tokens do `MEMORY.md` → 45 linhas); dez
  entradas datadas soltas dentro do `## What it is`, criando uma segunda cronologia; e
  *"o `log.md` **é** o `log.md`"*, tautologia que a renomeação mecânica de 09/09 produziu a partir
  de *"o `SESSION_HISTORY.md` vira o `log.md`"*. **A reestruturação:** a página abre com a
  arquitetura implementada — três lugares, quem escreve, o que o F1 mede — e a comparação das duas
  candidatas desceu inteira para `## De onde veio a escolha`, marcada como proveniência, com os
  números de 08/09 preservados de propósito. **A lição:** página de pesquisa que vira página de
  verdade não se atualiza sozinha — enquanto o desenho estava sendo decidido, "em formação" era
  honesto; depois de implementado, a mesma frase virou desinformação com carimbo de wiki.
- **2026-10-05 11:54** · **Documento vivo diz só o que é verdade agora** (S-124; MJRP, 2026-10-05, a partir da auditoria do PRD: 25 afirmações desatualizadas, a maioria status digitado à mão e explicação no corpo). Explicação em `## Notas`, passado em `## History`, um parágrafo por linha, estado gerado dos nós. Regra permanente; os outros documentos entram quando cada um for auditado.
- **2026-10-04 14:21** · **A memória passa a ser cobrada por mecanismo, não por hábito (S-61).** Em 04/10 uma
  compactação de contexto achou as últimas respostas do MJRP só no resumo da AI Platform: não estavam
  no log nem no `MEMORY.md`, e o `## Now` dava como pendente um passo já commitado — o F1 passava
  porque media a data do arquivo, não o que ele dizia. Decisões do MJRP (2026-10-04 14:11): todo commit
  traz entrada nova no log, menos o que só toca derivado; o `## Now` é julgado pelo conteúdo; a sessão
  remota não carrega os hooks do projeto, então nela valem o `commit-msg` e a regra da onboarding; o uso
  de skill é contado num arquivo versionado. O mecanismo está em *How MJRP uses it*.
- **2026-10-11 06:39** · **Isenção `self_logged` no `commit-msg`** (ADR-0004 do Control Center, aceita pelo MJRP em 2026-10-11 06:28): o commit da edição pela tela levava a entrada não commitada do agente, e o commit seguinte do agente era recusado por "sem entrada nova" (auditoria de 2026-10-10, achado #6); cada edição pela tela pintaria também o F1 de vermelho. O rastro de um arquivo `self_logged` é a linha de histórico dentro dele, e o `log_entry_check.py` a confere: só isenta o commit que toca, no projeto, só os caminhos declarados (lidos do contrato no `HEAD`), cada um com item novo no histórico. Decisão grande em `apps/control-center/docs/decisions/0004-screen-edit-commit-single-writer-and-safe-timeout.md`.

- **2026-10-13 17:58** · **Um commit, uma entrada: no log do projeto dono** (ADR-0020 D.1, aceita pelo MJRP; T4.1). O `log_entry_check.py` exigia entrada em cada log tocado, e o log da raiz carregava ponteiros ("detalhe no log do Control Center") só para o hook passar. Agora o dono é decidido no contrato, não na hora do commit: `mjrp_harness.log_owner.root_paths` (kernel, scripts, skills, decisões, `PRINCIPLES.md`, `AGENTS.md`) torna o dono a raiz; senão vale o projeto com mais arquivos tocados (os logs não contam), e o empate é da raiz. Entrada a mais no outro log é permitida, nunca exigida. Dois logs continuam; fundir a memória (`MEMORY.md` único) segue adiado.

## Related
[[context-vs-memory]] · [[terms]] · [[harness-elements]] · recurring-pains · ADR-0001 · ADR-0005 · ADR-0006 · ADR-0008
