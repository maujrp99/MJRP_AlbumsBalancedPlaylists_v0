---
title: Design patterns
aliases: [design-patterns, padrões de projeto, design patterns, patterns, padrões, DP, catálogo de padrões]
summary: os 29 padrões que o agente consulta ao planejar, refatorar e gerar código — cada um com ID estável DP-nn, o problema, o sinal mínimo para entrar, quando NÃO usar, a forma funcional e a OO, o teste S/N, o sensor e o endereço no harness; destilado do guia v1 do MJRP
tags: [harness, engenharia, kernel]
status: vivo
atualizado: 2026-10-25
fontes: [originals/design-patterns-guide/design-patterns-v1.md, reports/audits/2026-10-25-design-patterns-guide-and-doctor-architecture-audit.md, kernel/architecture/engineering-canon, kernel/architecture/architecture-review, wiki/sources/1994-gof-design-patterns.md, wiki/sources/2002-fowler-poeaa.md, wiki/sources/2003-evans-ddd.md, wiki/sources/2003-hohpe-woolf-eip.md, wiki/sources/2007-nygard-release-it.md, wiki/sources/2008-bloch-effective-java.md, wiki/sources/1988-meyer-2011-fowler-cqs-cqrs.md, wiki/sources/1997-beck-smalltalk-best-practice-patterns.md, wiki/sources/2003-alur-crupi-malks-core-j2ee-patterns.md, wiki/sources/2015-brooker-exponential-backoff-and-jitter.md, wiki/sources/2014-sato-parallel-change.md, wiki/sources/1987-garcia-molina-salem-sagas-2018-richardson.md, wiki/sources/2005-cockburn-hexagonal-architecture.md, wiki/sources/2011-seemann-composition-root.md, wiki/sources/2012-bernhardt-boundaries.md, wiki/sources/2004-fowler-presentation-model.md, wiki/sources/2014-wlaschin-railway-oriented-programming.md]
---
<!-- kernel do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

# Design patterns — o catálogo de padrões do harness

> Kernel · página de referência · destila o guia **Quick Reference Guide: Backend Design Patterns for AI Agents (v1)**, do MJRP
> (original intacto em `docs/originals/design-patterns-guide/design-patterns-v1.md`), e o completa com os padrões que o
> `PRINCIPLES.md`, o [[engineering-canon]] e o [[architecture-review]] nomeiam ou supõem e com os que o próprio harness usa ·
> a crítica que pediu a destilação: `reports/audits/2026-10-25-design-patterns-guide-and-doctor-architecture-audit.md`

## Definition

A referência de **padrões de projeto** do harness: para cada padrão, o **problema** que ele resolve, o **sinal
mínimo** que autoriza usá-lo, **quando não usar**, a forma **funcional** e a forma **OO**, o **teste S/N**, o **sensor** que
já o confere e o **endereço** (onde o harness já o usa). Completa o [[engineering-canon]], que dá o porquê dos princípios;
aqui está o *como* recorrente. É a página que o card «Referências Canônicas de Engenharia» do Control Center lê.

**Um padrão serve um problema que existe.** É a regra do cânone (§ *Quando extrair*: não se extrai por especulação; § *Padrões,
com endereço*: o padrão mínimo que resolve o isolamento) e do [[architecture-review]] (**MA-01**: nenhuma estrutura é paga antes
do primeiro usuário dela; **IV-04**: o padrão em uso tem endereço). Por isso cada entrada abre pelo problema e fixa o **sinal
mínimo**: o fato observável no código ou no requisito sem o qual o padrão não entra. Padrão sem o sinal é custo sem retorno, e a
crítica o aponta como MA-01.

O `PRINCIPLES.md` Parte I carrega a regra e o teste; **não descreve nenhum padrão**: quando precisa de um, cita o ID (`DP-nn`)
e aponta para cá.

## Como ler os padrões

- **ID estável.** `DP-nn` (design pattern), nunca renumerado. O padrão novo recebe o próximo número livre, no fim; o retirado
  fica marcado *retirado*, com data e motivo no `## History`, e o número não é reusado: a crítica antiga que o citava continua
  legível (mesma regra do [[architecture-review]]). O prefixo não colide com os do architecture-review (GV, AD, MA, DD, CM, RS,
  IV, VT, SN) nem com os do [[design-canon]] (HI, DE, CO, CP, IN, AH, RC, MP). Cita-se **ID e nome curto** (`DP-04 Strategy`).
- **Os sete campos**, em toda entrada:
  1. **Problema** — o que dói sem o padrão.
  2. **Sinal mínimo para entrar** — o fato observável sem o qual o padrão não entra. Limiar numérico, onde há, é do harness e
     revisável (marcado *decisão do redator*).
  3. **Quando NÃO usar** — onde o padrão vira custo, ou onde há um padrão menor que basta.
  4. **Forma funcional · forma OO** — as duas; a funcional vem primeiro porque é a que o harness (Python, stdlib) e o resto da
     stack usam (§ *O que é opinião de stack*).
  5. **Teste (S = passa)** — pergunta binária **afirmativa**, como as regras do architecture-review: responder «sim» à pergunta
     quer dizer que passa, e «não» é achado. A pergunta nunca descreve o defeito.
  6. **Sensor** — o que já confere o teste por máquina, ou «nenhum» (e então é pergunta de crítica). Sensor novo só nasce com
     incidente ([[doctor]], ADR-0002); até lá, o teste S/N basta.
  7. **Endereço no harness** — onde o padrão já está no código, ou «não usado» (e, quando couber, por que está certo não usar).
- **Origem e regra ligada**, numa linha sob o título: a fonte clássica (fichas em `docs/wiki/sources/`) e o ID da regra do
  architecture-review ou a seção do cânone que o pede.
- **Estado.** *Usado* (tem endereço), *não usado* (o harness não tem o problema ou ainda não o teve) e *evitar* (o padrão do guia
  que o harness proíbe, com o substituto).
- **As âncoras do endereço são arquivo e símbolo**, não número de linha: a linha envelhece no primeiro commit.

### O índice

| ID | Padrão | Estado | Onde mora (resumo) |
|---|---|---|---|
| **DP-01** | Repository | não usado nos scripts · mínimo no app | o app usa Porta + Adapter (`StringsStore`, `BundleSink`) |
| **DP-02** | Factory | não usado | `Context.for_project` é construtor nomeado, não Factory |
| **DP-03** | Singleton | **evitar** | substituto: `_context.Context` passado como parâmetro |
| **DP-04** | Strategy | usado (forma funcional) | `_contract.read_yaml` |
| **DP-05** | Observer (em processo) | não usado | o `Report` tem consumidores síncronos fixos |
| **DP-06** | Builder | não usado | argumento nomeado e `NamedTuple`/`dataclass` |
| **DP-07** | Adapter | usado | `_git`, `_run`, `_contract`; no app, `adapters/` |
| **DP-08** | Decorator (e o interceptador) | usado (forma funcional) | `doctor.run_checks` |
| **DP-09** | CQRS (e o CQS) | não usado | o CQS vale no nível da função |
| **DP-10** | Circuit Breaker | não usado | o processo é de rodada única: o padrão é o `DP-22` |
| **DP-11** | Facade | usado | `doctor.py` |
| **DP-12** | Service | usado no app | `usecases/` e o `build.py` de cada módulo |
| **DP-13** | Composable | não usado (Vue) · hook no app | `web/src/shell/usePalette.ts`, `routes.ts` |
| **DP-14** | Port | usado no app | `ports.py`, `ports_<assunto>.py` |
| **DP-15** | Composition Root | usado no app | `cli.py` |
| **DP-16** | Registry | usado | `doctor.CHECKS`, `KERNEL_PAGES`, `modules/<id>/manifest.json` |
| **DP-17** | Context Object | usado | `_context.Context` |
| **DP-18** | Collecting Parameter | usado | `_report.Report` |
| **DP-19** | Result / erro tipado | usado | `_git.GitResult`, `read_yaml_strict`, `ReadStatus` no app |
| **DP-20** | Núcleo puro, borda com efeito | usado no app | `rules/`, `contract/` × `adapters/` |
| **DP-21** | Presenter | usado no app | `web/src/modules/<id>/presenter.ts` |
| **DP-22** | Timeout | usado | `_git.TIMEOUT`, `_run.sh`, `SENSOR_TIMEOUT`, `daily_backup_run.run_worker` |
| **DP-23** | Retry com recuo exponencial e jitter | não usado | — |
| **DP-24** | Consumidor idempotente com DLQ | não usado | a idempotência sem fila: `daily_checks.report` |
| **DP-25** | Expand and Contract | usado | `sensor_state@1 → @2` |
| **DP-26** | Saga | não usado | — |
| **DP-27** | Lock com prazo | usado | `HomeFiles.locked`, `daily_backup_store.RunLock` |
| **DP-28** | Bloqueio otimista | não usado | — |
| **DP-29** | Correlation ID | não usado | — |

---

## DP-01 a DP-10 · Os dez do guia do MJRP

Mesma ordem do guia v1, com a numeração dele (1 a 10) igual ao `DP-nn`. O Observer do guia fundia dois padrões; o segundo
(a mensageria) é o `DP-24`.

### DP-01 · Repository
*Fowler, PoEAA (2002) e Evans, DDD (2003) · liga: IV-03, cânone § Padrões e a escada de isolamento*

- **Problema:** consulta ao banco (ou a qualquer fonte de dado) escrita dentro da regra de negócio ou do controlador. A regra
  não se testa sem a fonte e não sobrevive a trocar de fonte.
- **Sinal mínimo para entrar:** a regra de negócio chama a fonte de dado **e** uma destas é verdade: a fonte pode mudar ou
  ser trocada, ou a regra precisa ser testada sem ela. O harness também pede **uma fonte que mude por motivos diferentes da
  regra**, não só «a regra toca em dado».
- **Quando NÃO usar:** projeto de uma fonte só, estável, sem regra que dependa dela (o cânone: «Repository com Facade numa
  fonte só é generalidade especulativa»); um script que lê um arquivo e imprime; um `Repository<T>` genérico em volta de um
  ORM que já é um repositório. Antes dele vem o `DP-07` (Adapter), que é o degrau mínimo.
- **Forma funcional · forma OO:** funcional, um módulo de funções `carregar_x(fonte)`/`salvar_x(fonte, x)` que a regra recebe
  como parâmetro (ou uma `Protocol` de duas funções); OO, uma interface com os métodos que a **regra** precisa (não os do banco),
  e uma implementação por fonte. **A interface é da camada de dentro** (DIP, IV-03): quem a possui é o caso de uso, não a
  implementação.
- **Teste (S = passa):** a camada de apresentação e a regra de negócio **não** importam o driver, o ORM nem `open()` da fonte, e
  o teste da regra usa um *fake* da interface (não um *mock* de chamadas)?
- **Sensor:** SN-01 (linter de import): no app, `uv run lint-imports` (`layers` + `forbidden`) confere que `subprocess`, `socket`, `http`,
  `urllib` e `shutil` só entram em `adapters/`. **Não cobre o arquivo:** `open()` é *builtin* e `pathlib` não está na lista, então
  ler arquivo fora do adaptador é pergunta de crítica. Nos scripts: nenhum.
- **Endereço no harness:** o doctor **não usa** e está certo: a fonte é o próprio repositório julgado, que não se troca. O app
  usa a forma mínima, **Porta + Adapter** (`DP-14`, `DP-07`): `StringsStore`, `BundleSink`, `RepoSource` em `ports.py`. Não há
  classe chamada «Repository».

### DP-02 · Factory
*GoF (1994): Factory Method e Abstract Factory; a «Factory» do guia é a variante *parameterized factory method*, popularizada como «Simple Factory» · liga: OCP no cânone*

- **Problema:** o código instancia a classe concreta em vários lugares para suportar mais de uma implementação (o exemplo do
  guia: os provedores de pagamento), e cada provedor novo obriga a mexer em todos.
- **Sinal mínimo para entrar:** **duas ou mais** implementações escolhidas por configuração ou por dado, **e** a escolha
  aparece em **mais de um** ponto de chamada (ou há uma terceira implementação à vista). Com uma implementação, não há o que escolher.
- **Quando NÃO usar:** um construtor com um único `if`; uma implementação só; escolher num lugar só (ali a condicional é a
  própria solução). **A Factory não dá o OCP:** a condicional apenas mudou de lugar e continua mudando a cada provedor novo.
  O OCP vem do **registro** (`DP-16`): o provedor se registra e a escolha é uma consulta à tabela.
- **Forma funcional · forma OO:** funcional, uma função `criar_x(config)` que devolve a implementação, ou uma tabela
  `nome → função` (é o `DP-16`); OO, um *Factory Method* (a subclasse decide) ou uma *Abstract Factory* (uma família de objetos
  que combinam entre si). O guia não distinguia as duas.
- **Teste (S = passa):** o provedor seguinte entra por registro, sem editar condicional? (Se há mais de um ponto de chamada e a
  resposta é não, é achado.)
- **Sensor:** nenhum. Pergunta de crítica (IV-01).
- **Endereço no harness:** não usado. `Context.for_project` (`mjrp-scripts/_context.py`) é um construtor nomeado, não uma Factory.

### DP-03 · Singleton
*GoF (1994) · **evitar** · liga: IV-03 (dependência oculta), o incidente R12 da F73*

- **Problema (do guia):** um recurso compartilhado (configuração, cache, conexão) precisa de uma instância consistente.
- **Sinal mínimo para entrar:** **nenhum.** O harness não usa o Singleton com estado mutável. «Preciso de uma instância só» não é
  sinal: a resposta é **passar a instância como parâmetro**.
- **Quando NÃO usar:** sempre que o estado é mutável. Um Singleton à mão traz estado global, acoplamento e dependência oculta
  (o guia o avisa, e o harness tem o incidente que o prova: o R12, em que os `ROOT` globais faziam a checagem de um filho ler a
  wiki de quem rodava). A saída que o guia dá, o escopo *singleton* de um container de DI, **não existe** na stack do harness
  (Python stdlib, Apps Script).
- **Forma funcional · forma OO:** funcional, o **objeto de contexto passado como parâmetro** com valor padrão (`DP-17`), e a
  **constante imutável de módulo** (o módulo Python já é a instância única); OO, o mesmo, injetado no construtor.
- **Teste (S = passa):** todo estado lido por mais de uma função vem por parâmetro, ou é constante imutável (`TIMEOUT`,
  `CHECKS`)?
- **Sensor:** nenhum geral. A troca do `Context` é coberta por `mjrp-scripts/_context_selftest.py`.
- **Endereço no harness:** o substituto é o `Context` (`_context.py`), usado no `doctor.py`. Não há Singleton no código.

### DP-04 · Strategy
*GoF (1994) · liga: cânone § Sinais e anti-padrões, OCP · MA-01*

- **Problema:** a mesma operação com regras ou algoritmos diferentes, escolhidos por condição, vira `if/else` ou `switch` que cresce.
- **Sinal mínimo para entrar:** **a mesma** condicional encadeada sobre o mesmo tipo em **mais de um lugar**, ou uma **terceira**
  variante chegando. É o sinal do cânone: «várias árvores de `if/else` sobre o mesmo tipo», não uma cadeia só.
- **Quando NÃO usar:** dois ramos estáveis; uma cadeia que existe uma vez; uma escolha feita num lugar só — ali a condicional
  é mais legível que uma família de classes.
- **Forma funcional · forma OO:** funcional, a variante **é uma função** (passada como argumento ou escolhida uma vez numa
  tabela): sem classe e sem interface. OO, uma interface e uma classe por variante. **Em Python e em JS/TS, comece pela função.**
- **Teste (S = passa):** o caso novo entra sem reabrir a função que já passa nos testes (OCP)? **E** não existe estratégia onde
  só há uma variante?
- **Sensor:** nenhum.
- **Endereço no harness:** `mjrp-scripts/_contract.py` — o leitor de YAML é escolhido uma vez, na importação, entre o PyYAML e o
  `_yaml_minimal`; `read_yaml` usa o escolhido. Uma condicional num lugar só, que é a forma funcional. O problema existia: o
  doctor roda sem `pip install` (incidente de 2026-09-08).

### DP-05 · Observer (em processo)
*GoF (1994) · liga: IV-08 · o pub/sub **assíncrono** é outro padrão: `DP-24`*

- **Problema:** uma operação principal dispara várias ações secundárias (atualizar estoque, avisar, registrar) e o emissor fica
  acoplado a todas.
- **Sinal mínimo para entrar:** **duas ou mais** reações independentes ao mesmo evento, que o emissor não deve conhecer, e a
  lista de reações muda sem o emissor mudar.
- **Quando NÃO usar:** uma reação só (chame direto); reações que têm de acontecer **em ordem** ou **na mesma transação** (o fluxo
  escondido é justamente o que o padrão tira da vista de quem lê); quando o consumidor é assíncrono ou entre processos — aí
  é o `DP-24`, com idempotência e DLQ.
- **Forma funcional · forma OO:** funcional, uma lista de funções que o emissor chama; OO, interface *Observer* e um *Subject*
  que os notifica. Em processo, **a chamada é síncrona**.
- **Teste (S = passa):** a falha de um ouvinte tem tratamento escrito — propaga ao emissor, ou é registrada e os demais seguem —
  e **nunca é engolida**? (IV-08)
- **Sensor:** nenhum.
- **Endereço no harness:** não usado. O `Report` tem três consumidores síncronos e fixos (terminal, `--json` e o rastro); um
  barramento de eventos seria prematuro. O que faltou ali foi **uma projeção do relatório**, não um Observer.

### DP-06 · Builder
*Bloch, *Effective Java* (2008, item 2) — não o Builder do GoF · liga: IV-06*

- **Problema:** construtor com muitos parâmetros opcionais (o guia diz 10+), difícil de ler e propenso a erro de posição.
  Essa é a motivação do Builder de **Joshua Bloch**. O Builder do GoF (1994) é outro: separa a construção de um objeto complexo
  da sua representação, com um *Director*. «Fluent interface» é de Fowler e Evans (2005).
- **Sinal mínimo para entrar:** mais de **cinco** parâmetros, vários opcionais, **e** o objeto só é válido depois de montado
  por etapas (*decisão do redator, revisável pelo MJRP*). Só a lista longa não basta nas linguagens com argumento nomeado.
- **Quando NÃO usar:** quando a linguagem tem argumento nomeado com valor padrão (Python, Kotlin, TS com objeto de opções): o
  argumento nomeado já resolve o que o Builder resolve; DTO e *fixture* de teste simples.
- **Forma funcional · forma OO:** funcional, **argumento nomeado** + `dataclass(frozen=True)` ou `NamedTuple`, com o valor
  padrão ao lado do campo; OO, uma classe *Builder* com métodos encadeados e um `build()` que valida.
- **Teste (S = passa):** nenhuma chamada tem mais de cinco argumentos posicionais, e não há Builder onde o argumento nomeado
  basta? (MA-01)
- **Sensor:** nenhum.
- **Endereço no harness:** não usado. `Check` (`doctor.py`) é um `NamedTuple` de quatro campos; o `Report` se acumula por métodos.

### DP-07 · Adapter
*GoF (1994); em PoEAA, o *Gateway* · liga: IV-03, VT-06, SN-02 · PRINCIPLES I.3*

- **Problema:** uma API de terceiro, um sistema legado ou um **processo externo** usa tipos, nomes ou formatos diferentes dos
  do projeto, e o tipo externo vaza para dentro do domínio.
- **Sinal mínimo para entrar:** uma dependência externa (SDK, API, formato de arquivo, **comando que o processo chama**) é usada
  por código que não é a borda, **e** ela pode ser trocada, simulada em teste ou mudar sem aviso. É o primeiro degrau da escada
  do cânone.
- **Quando NÃO usar:** biblioteca de linguagem estável (validação, datas): não é veto (VT-06), é compromisso a custear
  (IV-03); a dependência que nunca se troca e já está num lugar só.
- **Forma funcional · forma OO:** funcional, **uma função (ou um módulo) na borda** que traduz o que vem de fora para o tipo do
  projeto; OO, uma classe que implementa a interface (`DP-14`) que o caso de uso possui. O adaptador de **processo externo** tem
  três propriedades fixas: **prazo** (`DP-22`), **sem shell** (argv, nunca texto interpretado), e **resultado tipado** (`DP-19`).
- **Teste (S = passa):** trocar o provedor ou a fonte muda um arquivo só (o adaptador), e nenhum import de SDK de infraestrutura
  fica fora dos adaptadores?
- **Sensor:** SN-02. No app, `uv run lint-imports` (`forbidden`: `subprocess`, `socket`, `http`, `urllib`, `shutil` fora de
  `adapters/`) e `tests/adapters/test_git_cli_write_surface.py`. Nos scripts: `_git_selftest.py` (prazo, erro tipado).
- **Endereço no harness:** `mjrp-scripts/_git.py` (`run` devolve `GitResult`; `GitError`/`GitTimeout`/`GitNotRun`), `_run.py`
  (`split_command`, `sh`: argv sem shell, prazo), `_contract.py` (`read_yaml` sobre o PyYAML ou o parser mínimo). No app,
  `apps/control-center/src/control_center/adapters/` (`git_cli/reader.py`, `sensor_files/formats.py`, um leitor por formato e versão).

### DP-08 · Decorator (e o interceptador)
*GoF (1994) · liga: IV-01, IV-08, PRINCIPLES I.4 (composição sobre herança) · RS-03 para o cache*

- **Problema:** preocupações transversais (cache, log, métrica, autorização, isolamento de falha) entram dentro do serviço
  principal, que passa a ter várias responsabilidades.
- **Sinal mínimo para entrar:** a **mesma** preocupação transversal é necessária em **duas ou mais** operações e não é a regra
  de negócio delas.
- **Quando NÃO usar:** a preocupação é de **uma** operação só (escreva no corpo dela); um decorador em dezenas de funções onde
  **um laço** em volta de todas resolve; **cache sem a invalidação decidida** (RS-03: TTL, escrita direta ou por evento, e o
  reinício a frio) — um decorador de cache sem isso esconde dado velho.
- **Forma funcional · forma OO:** funcional, a **função de ordem superior** (decorador do Python, *middleware*, ou o
  **interceptador**: um laço que chama cada operação com o tratamento em volta); OO, uma classe que embrulha a mesma interface
  e delega.
- **Teste (S = passa):** o comportamento transversal está num lugar só, em volta, e a regra de negócio não o conhece? E um
  cache tem a invalidação escrita?
- **Sensor:** `mjrp-scripts/doctor_selftest.py` (a checagem que levanta exceção vira «não avaliável»).
- **Endereço no harness:** `mjrp-scripts/doctor.py`, `run_checks`: o isolamento do crash e a conferência da severidade de cada
  checagem estão **uma vez, no laço**, e não como decorador em 34 funções. É o mínimo. No Claude Code, os *hooks*
  (`mjrp-scripts/hooks/`) são o mesmo papel de interceptador em volta da ferramenta.

### DP-09 · CQRS (e o CQS)
*Greg Young (2010), Fowler (2011), Dahan; o CQS é de Meyer, *OOSC* (1988) · liga: MA-01, DD-03*

- **Problema:** o mesmo modelo de dados serve mal a escrita e a leitura quando as duas têm formas, volumes ou consistência
  muito diferentes.
- **Sinal mínimo para entrar:** o modelo único **atrapalha uma das duas** (a leitura pede uma visão desnormalizada, a escrita
  pede regras que a leitura não tem) em **uma parte identificável** do sistema. «Há mais leitura que escrita» **não** é sinal:
  vale para quase todo sistema.
- **Quando NÃO usar:** sistemas que cabem em CRUD; o sistema inteiro (Fowler: o padrão serve a uma parte, e na maioria dos
  sistemas «adiciona complexidade arriscada»); qualquer app local de uma tabela. **CQRS não é CQS:** o CQS de Meyer é separar,
  na **função**, a que muda estado da que responde; o CQRS separa os **modelos**. O guia chamava o CQRS de «padrão de sistemas
  distribuídos» e descrevia o CQS; nenhum dos dois é verdade.
- **Forma funcional · forma OO:** funcional, funções de comando (mudam estado) e funções de consulta (só devolvem), em módulos
  separados quando os modelos divergem; OO, *Command Handlers* e *Query Handlers* com modelos próprios.
- **Teste (S = passa):** cada função ou muda estado ou devolve valor (CQS), e há dois modelos só onde um não serve?
- **Sensor:** nenhum.
- **Endereço no harness:** não usado. O CQS quase vale: as checagens do doctor são consultas que escrevem só no `rep`; as
  exceções são declaradas (o A1 grava o cache de sensores).

### DP-10 · Circuit Breaker
*Nygard, *Release It!* (2007); Fowler (2014) · liga: VT-02, RS-02 · depende de DP-22 e DP-23*

- **Problema:** lentidão ou falha de uma dependência remota bloqueia as requisições, esgota recursos e propaga a falha em cascata.
- **Sinal mínimo para entrar:** processo de **vida longa**, com **chamadas repetidas** à mesma dependência remota, e uma falha
  dela que já se observou (ou que o desenho torna certa) derrubando o resto. E o **timeout** (`DP-22`) e a retentativa com recuo
  (`DP-23`) já existem: o disjuntor vem **depois** deles; o VT-02 pede os três juntos.
- **Quando NÃO usar:** script ou CLI de **rodada única** (o estado do circuito não sobrevive à rodada: o padrão certo é o
  timeout); chamada local; chamada única; dependência sem fallback possível (aí o disjuntor só troca a falha).
- **Forma funcional · forma OO:** funcional, uma função que guarda contagem de falhas e estado (fechado, aberto, semiaberto)
  num valor passado, e envolve a chamada; OO, uma classe com o estado e o método `call`.
- **Teste (S = passa):** toda chamada externa do caminho crítico de um processo longo tem timeout, fallback e degradação
  declarados? (VT-02)
- **Sensor:** SN-08 (chaos / *game day*) quando houver disjuntor. Nenhum hoje.
- **Endereço no harness:** não usado, e está certo: o doctor é um processo curto. O que ele tem é o timeout (VT-02 passa).

---

## DP-11 a DP-21 · Estrutura: fronteira, orquestração e fluxo

Padrões que o `PRINCIPLES.md` I.3/I.4 e o cânone nomeiam (Facade, Service, Composable), e os que o harness e o Control Center usam.

### DP-11 · Facade
*GoF (1994) · liga: PRINCIPLES I.4; cânone § Padrões, o último degrau da escada de isolamento*

- **Problema:** o cliente conhece e orquestra várias dependências para fazer uma coisa só.
- **Sinal mínimo para entrar:** **três ou mais** chamadas (ou dependências) que os clientes sempre fazem **juntas e na mesma
  ordem** (*decisão do redator, revisável*).
- **Quando NÃO usar:** uma dependência só (é um `DP-07`); fachada que só repassa a chamada; fachada que acumula tudo («Deus
  da fachada»): se ela cresce, cada responsabilidade volta a ser um módulo (IV-02).
- **Forma funcional · forma OO:** funcional, **uma função de entrada** (ou um módulo) que chama as demais e devolve um resultado
  só; OO, uma classe com poucos métodos que guarda as dependências.
- **Teste (S = passa):** o cliente fala com uma porta só, e a descrição da fachada cabe numa frase sem «e»?
- **Sensor:** nenhum.
- **Endereço no harness:** `mjrp-scripts/doctor.py`, o «guarda-chuva» do `AGENTS.md`: uma porta para o contrato, as famílias
  `_doctor_*` e os sensores (que as famílias importam sob demanda).

### DP-12 · Service
*Fowler, PoEAA (2002), *Service Layer* · liga: PRINCIPLES I.2/I.3 («serviço orquestra»)*

- **Problema:** o objetivo da aplicação (um caso de uso) precisa de várias fontes e regras, e a orquestração se espalha pela
  tela, pelo controlador ou pela entidade.
- **Sinal mínimo para entrar:** um objetivo da aplicação que usa **duas ou mais** portas (`DP-14`) ou regras, com sequência
  própria, e que nenhuma entidade ou regra pura possui.
- **Quando NÃO usar:** passar adiante a chamada de uma porta (CRUD que só repassa); regra de domínio pura (vai para uma função
  pura ou uma entidade, `DP-20`); um serviço que conhece HTTP, UI ou formato de arquivo.
- **Forma funcional · forma OO:** funcional, uma função `caso_de_uso(portas, entrada)` que **recebe** as portas e devolve o
  resultado; OO, uma classe com as portas no construtor e um método por caso de uso.
- **Teste (S = passa):** o caso de uso roda com *fakes* das portas, sem arquivo, rede nem relógio reais? E ele fala só com as
  portas, nunca com um adaptador?
- **Sensor:** `uv run lint-imports` (`layers`) no app. Nos scripts: nenhum.
- **Endereço no harness:** no app, `apps/control-center/src/control_center/usecases/` e o `build.py` de cada módulo
  (o docstring de `modules/tracking/build.py` diz, em inglês, que ele lê pelas portas que recebe). Os scripts não têm camada de serviço: cada sensor é um
  programa de um passo.

### DP-13 · Composable
*Vue, guia de Composables (função de composição) · o hook do React é o equivalente · liga: cânone § Fluxo de dados e estado*

- **Problema:** lógica com estado e efeito colateral repetida em componentes de tela, ou presa dentro de um deles.
- **Sinal mínimo para entrar:** a mesma lógica **com estado ou efeito** (assinatura, cache, busca) é necessária em **dois ou mais**
  componentes.
- **Quando NÃO usar:** lógica de **um** componente só (fica nele); função pura sem estado (é uma função comum, em `DP-20`);
  quando a lógica é de negócio (vai para a camada de aplicação, não para a tela).
- **Forma funcional · forma OO:** funcional, a função `useX()` que devolve estado e ações (composable no Vue, *hook* no React);
  OO, o equivalente é um serviço injetado — o `DP-12`. É padrão de tela, nativo da forma funcional.
- **Teste (S = passa):** o componente que precisa de um efeito delega a um composable ou hook, e nenhum componente guarda cópia
  do estado compartilhado?
- **Sensor:** nenhum.
- **Endereço no harness:** o harness não tem tela em Vue (não usado). O app, em React, usa hooks:
  `apps/control-center/web/src/shell/usePalette.ts`, `shell/routes.ts` (`useRoute`), `shell/land.ts` (`useLand`).

### DP-14 · Port
*Cockburn, *Hexagonal Architecture* (2005) · liga: IV-03 (DIP), PRINCIPLES I.3, SN-01*

- **Problema:** o caso de uso depende de algo de fora (arquivo, git, relógio, rede) e acaba escrito em torno do detalhe.
- **Sinal mínimo para entrar:** o caso de uso depende de uma capacidade externa **e** ela cruza a fronteira de uma camada, ou
  precisa ser simulada em teste, ou pode ser trocada. A porta nomeia **o que o caso de uso precisa**, não o que o fornecedor oferece.
- **Quando NÃO usar:** interface com uma implementação só que ninguém trocará nem simulará e que não cruza fronteira
  (generalidade especulativa); porta que espelha o SDK método a método (então a dependência não foi invertida, foi renomeada).
- **Forma funcional · forma OO:** funcional, um `Callable` ou uma `Protocol` de uma ou duas funções, passada como parâmetro; OO,
  uma interface abstrata. **A porta é do lado de dentro**, do dono do caso de uso.
- **Teste (S = passa):** o caso de uso não importa o adaptador, e a interface mora na camada de dentro?
- **Sensor:** SN-01 — no app, `uv run lint-imports` (`layers`, `independence`).
- **Endereço no harness:** `apps/control-center/src/control_center/ports.py` e `ports_<assunto>.py` (`Clock`, `RepoSource`,
  `GitSource`, `SensorLedger`, `UsageSource`, `StringsStore`, `BundleSink`). Os scripts do harness usam o adaptador direto
  (`_git`, `_clock`) sem porta: não há camada de domínio por cima deles, e uma porta ali seria especulativa.

### DP-15 · Composition Root
*Seemann, *Dependency Injection* (2011) · liga: IV-03, PRINCIPLES I.3*

- **Problema:** adaptadores concretos construídos em vários pontos do programa; ninguém sabe, num lugar só, o que está ligado a quê.
- **Sinal mínimo para entrar:** **dois ou mais** pontos constroem adaptadores concretos, ou um caso de uso importa um adaptador.
- **Quando NÃO usar:** programa de um arquivo; **container de DI de framework** (não existe na stack do harness — a raiz de
  composição **é** o que ocupa o lugar dele, sem mágica).
- **Forma funcional · forma OO:** funcional, uma função `main()` que constrói os adaptadores e os passa às funções de caso de uso;
  OO, o mesmo, por construtores.
- **Teste (S = passa):** é um lugar só — e só ele importa os adaptadores e os liga às portas?
- **Sensor:** `uv run lint-imports` (`layers`) no app.
- **Endereço no harness:** `apps/control-center/src/control_center/cli.py` («o único lugar que liga adaptador a porta», na
  `constitution.md` do app).

### DP-16 · Registry
*Fowler, PoEAA (2002), *Registry* — aqui, a **tabela declarada** (Command); o *Registry* de PoEAA como localizador global é outra coisa · liga: OCP no cânone, IV-01, GV-06*

- **Problema:** cada caso novo de uma família entra como mais um ramo numa função que já passa nos testes.
- **Sinal mínimo para entrar:** **três ou mais** casos da mesma família já existentes, cada um sendo hoje um ramo (ou um `if`
  a mais) numa função que já passa nos testes (*decisão do redator, revisável*).
- **Quando NÃO usar:** dois casos fixos; um registro **global mutável preenchido por efeito de importação** (é o `DP-03`
  disfarçado); uma tabela cujas entradas têm formas diferentes e precisam de `if` na leitura. **O registro é uma constante
  declarada**, não um estado que se acumula.
- **Forma funcional · forma OO:** funcional, uma **lista ou dict declarado** (`nome → função` ou uma tupla nomeada), lido por
  um laço; OO, um *plugin registry* ou *Command table* com a interface do comando.
- **Teste (S = passa):** o caso novo é **uma linha** na tabela, sem editar a lógica que a lê? E o selftest confere a forma da linha?
- **Sensor:** `mjrp-scripts/doctor_selftest.py` (a forma de cada `Check` e do `needs`); no app, `tests/test_manifests.py`.
- **Endereço no harness:** `mjrp-scripts/doctor.py`, `Check` e `CHECKS` (uma checagem nova é uma linha); `mjrp-scripts/new_project_kernel.py`, `KERNEL_PAGES` (uma página do kernel é um nome na lista); no app, `modules/<id>/manifest.json` lido por
  `adapters/module_manifests/catalog.py` (`ManifestFiles`): o módulo se liga por configuração.

### DP-17 · Context Object
*Alur, Crupi e Malks, *Core J2EE Patterns*, 2ª ed. (2003) · liga: IV-03 (dependência oculta), a F73 R12*

- **Problema:** várias funções precisam saber «qual projeto estou julgando» e «de onde o harness roda» e o descobrem por global,
  ignorando o que lhes foi passado.
- **Sinal mínimo para entrar:** **três ou mais** funções recebem o mesmo grupo de parâmetros de ambiente, **ou** uma função
  consulta um global para saber onde está (*decisão do redator, revisável*).
- **Quando NÃO usar:** um ou dois parâmetros (passe-os); um objeto que junta tudo o que é preciso («bolsa de tudo»), que vira
  Deus e esconde de que cada função depende; contexto **mutável**.
- **Forma funcional · forma OO:** funcional, um `dataclass(frozen=True)` com valor padrão, passado como parâmetro; OO, o mesmo
  como objeto injetado. Imutável e trocável no teste.
- **Teste (S = passa):** o teste passa o próprio contexto e a checagem julga **esse** projeto, sem ler o do ambiente?
- **Sensor:** `mjrp-scripts/_context_selftest.py`.
- **Endereço no harness:** `mjrp-scripts/_context.py`, `Context` (`root`, `harness_root`; `Context.for_project`), passado a cada
  checagem pelo `doctor.py`.

### DP-18 · Collecting Parameter
*Beck, *Smalltalk Best Practice Patterns* (1997) · liga: IV-08*

- **Problema:** várias operações independentes emitem cada uma zero ou mais achados, e o orquestrador precisa juntar tudo sem que
  cada operação conheça o formato nem o consumidor.
- **Sinal mínimo para entrar:** **duas ou mais** funções emitem achados que o chamador hoje consolida.
- **Quando NÃO usar:** uma função que devolve um valor só; quando **devolver a lista** basta (função pura que devolve achados,
  sem mutar nada, é preferível — CQS, `DP-09`); coletor compartilhado entre threads sem proteção.
- **Forma funcional · forma OO:** funcional, o objeto coletor passado como argumento e mutado pelas funções (é o desvio
  declarado do CQS); a alternativa pura é cada função devolver sua lista e o chamador concatenar. OO, o coletor com métodos
  `fail`, `warn`, `note`.
- **Teste (S = passa):** o orquestrador sabe quantos achados cada operação emitiu, e o consumidor (terminal, `--json`, rastro)
  lê o mesmo conjunto, sem filtrar por conta própria?
- **Sensor:** `mjrp-scripts/doctor_selftest.py`.
- **Endereço no harness:** `mjrp-scripts/_report.py`, `Report` (`fail`, `warn`, `unevaluable`, `note`), passado a cada checagem;
  o laço conta o que cada uma emitiu (`rep.findings[before:]`).

### DP-19 · Result / erro tipado
*Wlaschin, *Railway Oriented Programming* (2014); `Result` do Rust; o valor de erro do Go · liga: IV-08, PRINCIPLES I.8; opinião de stack no cânone § Tratamento de erro*

- **Problema:** a operação falha de jeitos diferentes («não respondeu», «não existe», «vazio»), e o chamador só recebe `None`,
  `""`, `0` ou uma exceção genérica — a falha vira «nada».
- **Sinal mínimo para entrar:** o chamador **precisa distinguir** dois ou mais desfechos que não se tratam do mesmo jeito, e o
  mecanismo da linguagem (exceção ou código) os esconde ou mistura.
- **Quando NÃO usar:** falha que ninguém trata ali (deixe a exceção subir); linguagem em que a exceção já é o mecanismo
  idiomático e o projeto decidiu assim na `constitution.md` (o princípio só exige que a falha **apareça**).
- **Forma funcional · forma OO:** funcional, um valor de retorno com campo de estado (`NamedTuple(code, out, err)` com `.ok`) e
  **funções com nomes diferentes** no lugar de uma *flag* (leniente × estrita); OO, uma hierarquia de exceções tipadas
  (`GitTimeout`, `GitNotRun`).
- **Teste (S = passa):** «não respondeu» e «não existe» saem diferentes, e nenhuma leitura que falha vira vazio ou zero (nem há
  `except` vazio)?
- **Sensor:** `mjrp-scripts/_git_selftest.py`, `_contract_selftest.py`; no app, os testes de adaptador com fonte quebrada
  (`tests/adapters/`).
- **Endereço no harness:** `mjrp-scripts/_git.py` (`GitResult`; `text` × `text_or_none`; `GitTimeout`, `GitNotRun`);
  `_contract.py` (`read_yaml_strict` levanta `UnreadableYaml`, `read_yaml` devolve `{}`); no app, `ReadStatus = ok|empty|failed`
  em `contract/common.py`.

### DP-20 · Núcleo puro, borda com efeito
*Bernhardt, «Boundaries» (2012) — *Functional Core, Imperative Shell* · liga: cânone § Fluxo de dados e estado (efeito na borda), IV-09*

- **Problema:** a regra está misturada com a leitura, a escrita, o relógio e a rede, e só se testa com tudo isso montado.
- **Sinal mínimo para entrar:** o teste de uma regra precisa de arquivo, relógio ou rede.
- **Quando NÃO usar:** um script de 20 linhas que só faz I/O; separar sem fronteira clara cria arquivo sem propósito (extrair
  por especulação).
- **Forma funcional · forma OO:** funcional, **funções puras** (entram dados, saem dados) no centro e uma casca fina que lê, chama
  e grava; OO, objetos de valor e serviços de domínio sem dependência de infraestrutura.
- **Teste (S = passa):** a regra roda em teste com valores na mão, sem *fake* de nada?
- **Sensor:** no app, `uv run lint-imports` (`contract/` e `rules/` sem I/O) e `ruff` `TID251` (relógio só pela porta). Nos
  scripts: nenhum.
- **Endereço no harness:** no app, `rules/` e `contract/` (sem I/O) × `adapters/`; `mjrp-scripts/conformance_check.py` (`return_marks(catalog_bytes, batch, landed_sha, now)` é
  função pura dos bytes do `HEAD` e do lote: regerar é idempotente; o app a chama pela porta do kernel em `usecases/catalog_return.py`).
  Nos scripts, a divisão `_clock` × a regra que recebe a data.

### DP-21 · Presenter
*Fowler, *Presentation Model* (2004) · liga: cânone § Fluxo de dados e estado, a regra «nenhuma regra de negócio na tela»*

- **Problema:** o componente de tela faz o recorte, a ordenação, o agrupamento e a contagem dos dados do contrato, e a lógica de
  apresentação só se testa com a tela montada.
- **Sinal mínimo para entrar:** a tela transforma o dado do contrato (recorta, ordena, agrupa, conta) **e** a transformação tem
  mais de uma linha ou se repete em duas telas.
- **Quando NÃO usar:** a tela mostra o campo como veio; **regra de negócio**: o presenter nunca deriva status (a regra mora em
  `rules/`, do lado do contrato).
- **Forma funcional · forma OO:** funcional, uma função `present(dado) → modelo de tela` num arquivo ao lado da vista, pura e
  testável; OO, uma classe *Presentation Model* com o estado da vista.
- **Teste (S = passa):** o presenter roda em teste sem DOM e sem rede, e não calcula status nem regra do domínio?
- **Sensor:** `tsc --noEmit`; «nenhuma regra de negócio na tela» **não é verificada por máquina** (revisão no PR, na
  `constitution.md` do app).
- **Endereço no harness:** `apps/control-center/web/src/modules/<id>/presenter.ts` (por exemplo
  `modules/monitor/presenter.ts`), a vista em `View.tsx`.

---

## DP-22 a DP-29 · Resiliência, dados e comunicação

Os padrões que os vetos e as regras do [[architecture-review]] **supõem** (VT-02, VT-03, VT-04, VT-05, DD-01, DD-02, CM-01, RS-02). Cada
um se liga à regra que o pede, que é o que dá ao ID o «por que a crítica cita».

### DP-22 · Timeout
*Nygard, *Release It!* (2007) · liga: VT-02, RS-02 · PRINCIPLES I.8*

- **Problema:** uma chamada a processo, rede, lock ou disco que trava segura o chamador para sempre (um `git` preso num índice
  travado segurou o hook que o chamou).
- **Sinal mínimo para entrar:** **toda** chamada que cruza uma fronteira de processo ou de máquina. Não há limiar: é o padrão
  que vale sempre que a condição existe.
- **Quando NÃO usar:** cálculo em memória, sem espera externa. Não há exceção para chamada «que sempre responde».
- **Forma funcional · forma OO:** funcional, um argumento `timeout=` com valor padrão e **um erro tipado** (`DP-19`) ou um código
  convencionado quando o prazo estoura; OO, uma política de prazo injetada no adaptador.
- **Teste (S = passa):** toda chamada externa tem prazo (`timeout=`), e o prazo estourado vira falha visível — nunca uma espera
  eterna, nunca vazio?
- **Sensor:** `_git_selftest.py` (o prazo de `1e-6` s vira `GitTimeout`/124); no app, os testes de adaptador com `git` lento
  (`tests/adapters/`). Um *grep* geral de «chamada externa sem `timeout=`» **não existe** — é o sensor candidato do VT-02, que só
  nasce com um incidente (ADR-0002).
- **Endereço no harness:** `mjrp-scripts/_git.py` (`TIMEOUT = 60`, `GitTimeout`), `_run.py` (`sh`, `timeout=30`, exit 124),
  `_doctor_sensors.py` (`SENSOR_TIMEOUT = 300`); `daily_backup_run.py`, `run_worker` (`Settings.unit_timeout`, 45 min por projeto: o grupo de processos do trabalhador, com o `git` que ele abriu, é morto no estouro — o caso mais forte do padrão no harness, porque um `tarfile` no mesmo processo não se interrompe); no app, `adapters/git_cli/reader.py` (5 s).

### DP-23 · Retry com recuo exponencial e jitter
*Brooker, «Exponential Backoff And Jitter» (2015) · liga: RS-02, VT-02 · exige idempotência (CM-01)*

- **Problema:** a dependência falha de modo transitório, e retentativas imediatas e sincronizadas dos clientes formam o efeito manada.
- **Sinal mínimo para entrar:** uma falha **transitória observada** (não suposta) numa dependência remota, **e** a operação é
  idempotente, **e** já existe o timeout (`DP-22`).
- **Quando NÃO usar:** operação **não idempotente** (repetir duplica o efeito); falha permanente (`404`, dado inválido); dependência
  local; retentativa **sem teto** de tentativas e de espera. Esperar um lock até um prazo (`DP-27`) é outra coisa: é polling, não
  retentativa de uma chamada que falhou.
- **Forma funcional · forma OO:** funcional, um laço limitado: espera = `min(teto, base × 2^n)` com o sorteio de *jitter*, e
  levanta o último erro ao esgotar; OO, uma política de retentativa injetada.
- **Teste (S = passa):** toda retentativa tem recuo exponencial, *jitter* e teto? (RS-02)
- **Sensor:** SN-06 (injetar a falha e conferir a retentativa). Nenhum hoje.
- **Endereço no harness:** não usado. O doctor falha na hora e reporta; a recuperação é rodar de novo.

### DP-24 · Consumidor idempotente com fila de mensagens mortas (DLQ)
*Hohpe e Woolf, EIP (2003): *Publish-Subscribe Channel*, *Idempotent Receiver*, *Dead Letter Channel* · liga: CM-01, **VT-03**, SN-06 · é o Observer assíncrono do guia*

- **Problema:** o fan-out assíncrono entrega **pelo menos uma vez**, com reentrega; sem idempotência o consumidor duplica efeitos,
  e sem DLQ a mensagem venenosa trava ou some. É o que o guia deixava de dizer ao mandar usar o Observer em fluxos «assíncronos».
- **Sinal mínimo para entrar:** existe **fila ou mensageria** (mais de um processo trocando mensagem).
- **Quando NÃO usar:** processo único e síncrono (`DP-05`); nenhum caso de uso aceita pub/sub sem os dois requisitos abaixo.
- **Forma funcional · forma OO:** funcional, a função consumidora consulta uma **chave de deduplicação** antes de aplicar o efeito,
  e a falha após N tentativas manda a mensagem à DLQ; OO, um *Idempotent Receiver* e um canal de mensagens mortas.
- **Teste (S = passa):** processar a mesma mensagem duas vezes deixa o mesmo estado (CM-01)? E toda fila tem DLQ e todo consumidor
  tem chave de deduplicação (VT-03, **veto: P0**)?
- **Sensor:** SN-06 (repetir a mensagem; forçar a exceção para ver a DLQ). Nenhum no harness.
- **Endereço no harness:** não usado: não há fila. A **propriedade** sem fila existe: `mjrp-scripts/daily_checks.py` (`report` é
  idempotente, `caso_idempotente` em `daily_checks_selftest.py`) e `mjrp-scripts/conformance_check.py` (`return_marks` é pura, então regerar é idempotente; o
  app a chama em `usecases/catalog_return.py`).

### DP-25 · Expand and Contract
*Sato, «ParallelChange» (2014) · liga: **VT-05**, CM-03, SN-04*

- **Problema:** mudar um schema, contrato ou formato que já tem dados ou consumidores obriga a parar tudo e mudar os dois lados
  ao mesmo tempo.
- **Sinal mínimo para entrar:** um schema, contrato ou formato **lido por mais de uma parte** (inclusive um arquivo JSON entre o
  leitor e a tela) ou com **dados antigos** vai mudar de forma.
- **Quando NÃO usar:** um formato privado de um processo, sem dado antigo e sem outro leitor, mudado e entregue na mesma passada
  (a troca direta é mais simples); aqui, não há *expand* nem *contract* a fazer.
- **Forma funcional · forma OO:** funcional, em **três passos**: expandir (acrescentar o campo/versão novos; o leitor lê os dois),
  migrar (os escritores passam ao novo), contrair (retirar o velho quando ninguém mais o usa); OO, o mesmo, com versão no tipo.
- **Teste (S = passa):** toda mudança de schema passa por expandir → migrar → contrair, sem parada total? (VT-05) O campo novo é
  aditivo? (CM-03)
- **Sensor:** SN-04; no app, `tests/compat/test_bundle_schema.py` e `tests/compat/test_input_formats.py`.
- **Endereço no harness:** `apps/control-center/src/control_center/adapters/sensor_files/formats.py` (`sensor_state@2` acrescentou
  `check_id`, `severity`, `file`, `rule` sobre o `@1`, e o leitor lê os dois); na `constitution.md` do app, «campo novo é
  aditivo; cada formato tem versão e amostra»; as notas de migração `mjrp-scripts/migrations/CM-NNNN-*.md` levam a mudança do
  kernel aos filhos.

### DP-26 · Saga
*Garcia-Molina e Salem, «Sagas» (1987); Richardson, *Microservices Patterns* (2018) · liga: DD-01*

- **Problema:** uma operação de negócio escreve em mais de um armazenamento ou serviço, e não há transação que cubra todos.
- **Sinal mínimo para entrar:** a operação escreve em **dois ou mais** armazenamentos/serviços **sem transação comum**, e uma falha
  no meio deixa o negócio inconsistente.
- **Quando NÃO usar:** um armazenamento só (use a transação dele); a operação pode ser retomada de onde parou (retentativa
  idempotente, `DP-23`/`DP-24`, é mais simples que compensar); transação distribuída (2PC) é o que a Saga substitui, não o que a
  complementa.
- **Forma funcional · forma OO:** funcional, a lista de passos, cada um com a sua **compensação explícita**, executada em ordem
  inversa se algum falhar; OO, um orquestrador de saga ou coreografia por eventos.
- **Teste (S = passa):** cada operação que cruza limites tem a compensação escrita? (DD-01)
- **Sensor:** nenhum.
- **Endereço no harness:** não usado: o harness não escreve em dois armazenamentos transacionais.

### DP-27 · Lock com prazo
*Fowler, PoEAA (2002), *Pessimistic Offline Lock* · liga: DD-02, IV-08 · o aviso (*lease*) não é lock*

- **Problema:** dois escritores (processos, abas, aparelhos) gravam o mesmo recurso ao mesmo tempo e um sobrescreve o outro.
- **Sinal mínimo para entrar:** **mais de um escritor** do mesmo recurso, com janela de conflito curta e custo alto de perder a escrita.
- **Quando NÃO usar:** um escritor só; conflito raro e detectável — o bloqueio otimista (`DP-28`) custa menos; lock **sem prazo**
  (a espera eterna é pior que o conflito: a regra é desistir com erro dito).
- **Forma funcional · forma OO:** funcional, um gerenciador de contexto que tenta o `flock` sem bloquear até um prazo e devolve
  «obtido ou não»; OO, uma classe de lock com `acquire(timeout)`.
- **Teste (S = passa):** o recurso com mais de um escritor tem estratégia de conflito declarada, e o lock tem prazo e dá erro ao
  esgotar, sem espera eterna? (DD-02)
- **Sensor:** `mjrp-scripts/daily_backup_selftest.py` (duas rodadas ao mesmo tempo: a segunda desiste dizendo «outra rodada em andamento»); no app, o estado `lock_busy`. Nenhum geral.
- **Endereço no harness:** `apps/control-center/src/control_center/adapters/files.py`, `HomeFiles.locked` (`flock`, prazo em
  segundos); `mjrp-scripts/daily_backup_store.py`, `RunLock` (`DEFAULT_LOCK_WAIT`; devolve «obtido ou não», e quem não obtém desiste com erro dito). O `mjrp-scripts/session_lease.py`
  é um **aviso** (decisão do MJRP, 2026-09-28: só avisa, não bloqueia), outra coisa.

### DP-28 · Bloqueio otimista
*Fowler, PoEAA (2002), *Optimistic Offline Lock* · liga: DD-02*

- **Problema:** dois escritores, conflito raro, e um trabalho longo entre ler e gravar; um lock seguraria a todos sem necessidade.
- **Sinal mínimo para entrar:** **mais de um escritor**, **conflito raro** e o recurso pode ser **versionado** (versão, etag, hash).
- **Quando NÃO usar:** conflito frequente (o retrabalho custa mais que esperar); recurso sem como versionar; um escritor só.
- **Forma funcional · forma OO:** funcional, ler a versão, trabalhar, gravar **só se a versão ainda é a lida**, e tratar o conflito
  como erro explícito; OO, uma entidade com campo de versão e um repositório que a confere.
- **Teste (S = passa):** a gravação confere a versão lida, e o conflito vira erro visível ao usuário? (DD-02, IV-08)
- **Sensor:** nenhum.
- **Endereço no harness:** não usado nos scripts nem no app.

### DP-29 · Correlation ID
*Hohpe e Woolf, EIP (2003), *Correlation Identifier* · liga: **VT-04***

- **Problema:** um fluxo que passa por mais de um processo em rede não se reconstitui quando algo falha.
- **Sinal mínimo para entrar:** o sistema é **distribuído**: mais de um processo em rede no mesmo fluxo.
- **Quando NÃO usar:** um processo local por vez (o harness).
- **Forma funcional · forma OO:** funcional, o identificador gerado na entrada e **passado em cada chamada e em cada linha de log**;
  OO, um contexto de requisição que o carrega (`DP-17`).
- **Teste (S = passa):** todo salto propaga o Trace-ID e o Span-ID? (VT-04, **veto: P0** quando se aplica)
- **Sensor:** nenhum.
- **Endereço no harness:** não usado: o VT-04 «não se aplica».

---

## A matriz de decisão

A porta de entrada do agente: parte do **problema** que ele achou. As duas colunas do meio são o que torna a matriz uma regra:
sem o **sinal mínimo**, o padrão não entra; com o **não use se**, ele sai.

| Problema encontrado | Padrão | Sinal mínimo (entra se) | Não use se | Use no lugar |
|---|---|---|---|---|
| Regra de negócio acoplada à fonte de dado | `DP-01` Repository | a fonte pode mudar ou a regra precisa de teste sem ela | fonte única, estável, sem regra | `DP-07` Adapter |
| Mais de uma implementação escolhida por config | `DP-02` Factory | duas ou mais, escolha em mais de um lugar | um `if` num lugar só; esperar OCP | `DP-16` Registry |
| Precisa de **uma** instância compartilhada | ~~Singleton~~ `DP-03` | — (não entra) | sempre, com estado mutável | **passe a instância como parâmetro** (`DP-17`) |
| Mesma condicional por tipo em vários lugares | `DP-04` Strategy | em mais de um lugar, ou uma terceira variante | dois ramos estáveis | a condicional |
| Ações secundárias acopladas, no mesmo processo | `DP-05` Observer | duas ou mais reações independentes | uma reação, ordem obrigatória, mesma transação | chamada direta |
| Ações secundárias **assíncronas** ou entre processos | `DP-24` Consumidor idempotente + DLQ | existe fila | processo único e síncrono | `DP-05` |
| Construtor com muitos parâmetros opcionais | `DP-06` Builder | mais de cinco, validação por etapas | argumento nomeado disponível | `dataclass`/`NamedTuple` |
| Contrato diferente de uma API, SDK ou processo externo | `DP-07` Adapter | dependência externa usada fora da borda | biblioteca de linguagem estável | — |
| Preocupação transversal (cache, log, isolamento) | `DP-08` Decorator / interceptador | em duas ou mais operações | uma operação só; cache sem invalidação | no corpo |
| Leitura e escrita pedem modelos diferentes | `DP-09` CQRS | o modelo único atrapalha uma das duas | CRUD; «mais leitura que escrita» | CQS na função |
| Falha em cascata numa dependência remota | `DP-10` Circuit Breaker | processo longo, chamadas repetidas, timeout e retry já existem | script de rodada única | `DP-22` Timeout |
| Cliente orquestra várias dependências | `DP-11` Facade | três ou mais, sempre juntas | uma só; só repassa | `DP-07` |
| Orquestração do caso de uso espalhada | `DP-12` Service | duas ou mais portas, sequência própria | CRUD que só repassa | função pura (`DP-20`) |
| Lógica com estado repetida em telas | `DP-13` Composable | em dois ou mais componentes | um componente só | função comum |
| Caso de uso depende de algo de fora | `DP-14` Port | cruza fronteira, simula-se ou troca-se | uma implementação que ninguém troca | chamar direto |
| Adaptadores construídos em vários lugares | `DP-15` Composition Root | dois ou mais pontos constroem | programa de um arquivo | — |
| Caso novo = mais um ramo | `DP-16` Registry | três ou mais casos já existentes | dois casos fixos; registro global mutável | `if` |
| Várias funções descobrem o ambiente por global | `DP-17` Context Object | três ou mais com o mesmo grupo de parâmetros | um ou dois parâmetros | parâmetros |
| Achados de várias operações a consolidar | `DP-18` Collecting Parameter | duas ou mais emitem, o chamador junta | retorno de lista basta | devolver a lista |
| Falha vira «nada» | `DP-19` Result / erro tipado | o chamador distingue desfechos | falha que ninguém trata ali | exceção |
| Regra misturada com I/O | `DP-20` Núcleo puro | o teste exige I/O | script de 20 linhas | — |
| Lógica de apresentação dentro do componente | `DP-21` Presenter | mais de uma linha ou em duas telas | mostrar o campo como veio | — |
| Chamada externa que pode travar | `DP-22` Timeout | toda chamada que cruza processo | cálculo em memória | — |
| Falha transitória em dependência remota | `DP-23` Retry com recuo | falha observada, operação idempotente | não idempotente; falha permanente | falhar na hora |
| Mudança de contrato com consumidores | `DP-25` Expand and Contract | lido por mais de uma parte ou com dado antigo | formato privado, sem dado antigo | troca direta |
| Escrita em mais de um armazenamento | `DP-26` Saga | sem transação comum | um armazenamento; operação retomável | transação local |
| Dois escritores no mesmo recurso | `DP-27` Lock com prazo / `DP-28` Bloqueio otimista | conflito curto e caro (lock); raro e versionável (otimista) | um escritor | — |
| Fluxo entre processos em rede sem rastro | `DP-29` Correlation ID | sistema distribuído | um processo local | — |

## O que é opinião de stack

> **A regra de leitura**, igual à do [[engineering-canon]]: o `PRINCIPLES.md` vale em Apps Script, Vue, React, Next.js e Python
> igualmente. O **problema** de cada padrão e o **teste S/N** são universais; a **forma** não. O que só vale em algumas
> linguagens é regra de projeto — mora na `constitution.md` dele, como delta ([[base-concept]], `PRINCIPLES.md` Parte III).

| O que o guia ou o padrão clássico supõe | Por que não é universal | O que fazer no harness |
|---|---|---|
| **Uma classe por estratégia** (`DP-04`) | escrito para OO; em Python e JS a variante **é uma função** | a função, escolhida numa tabela |
| **Builder fluente** (`DP-06`) | existe porque a linguagem do livro (Java) não tem argumento nomeado com valor padrão | argumento nomeado + `dataclass`/`NamedTuple` |
| **Container de DI e o escopo *singleton*** (`DP-03`, `DP-15`) | depende de framework (Spring, .NET); não existe em Python stdlib nem em Apps Script | passar o contexto como parâmetro; a raiz de composição à mão |
| **Interface abstrata e herança** (`DP-01`, `DP-14`) | LSP e ISP têm objeto em código OO; não em código funcional (cânone) | uma `Protocol` de uma ou duas funções, ou um `Callable` |
| **Repository genérico `Repository<T>`** (`DP-01`) | só tem sentido sobre um ORM; em arquivo, é generalidade especulativa | o Adapter (`DP-07`) |
| **Decorador de classe, anotação** (`DP-08`) | construção de Java/C#/TS | função de ordem superior, ou o laço que chama cada operação |
| **Composable** (`DP-13`) | é do Vue; no React é o *hook* | o hook ou composable da stack da tela |
| **Exceções em vez de valor de erro** (`DP-19`) | Go e Rust usam valor de erro por design | o que a `constitution.md` do projeto disser; o princípio é que a falha **apareça** |
| **Circuit Breaker, Saga, DLQ, Correlation ID** (`DP-10`, `DP-24`, `DP-26`, `DP-29`) | nascem de sistema distribuído e de processo longo | só quando o elemento existe; o [[architecture-review]] diz «não se aplica» e a crítica não inventa o achado |

## How MJRP uses it

- **Esta página é do kernel** — vai carimbada para todo projeto em `docs/wiki/harness/design-patterns.md`, e o [[doctor]] confere
  que chegou e que o carimbo não envelheceu. (A `constitution.md` de um filho cita os `DP-nn`; ponteiro que não chega junto é
  ponteiro quebrado.)
- **O agente consulta a matriz ao planejar** (`mjrp-designing-architecture`) **e ao implementar** (`mjrp-implementing-tasks`); a
  **crítica** (`mjrp-critiquing-architecture`) cita `DP-nn` e nome curto para dizer que um padrão foi aplicado **sem o sinal mínimo**
  (MA-01) ou que **faltou** o padrão onde o sinal existe, e usa o teste S/N de cada entrada. O que a página manda só vira
  regra operante se tiver sensor (GV-03): o que hoje é só pergunta de crítica está dito no campo **Sensor**.
- **O `PRINCIPLES.md` e o [[engineering-canon]] citam o ID e apontam para cá**; nenhum dos dois descreve mais um padrão.
- **A `constitution.md` de cada projeto declara os padrões em uso com endereço** (IV-04), apontando para o `DP-nn`. A do
  Control Center é o primeiro exemplo.
- **Quando esta página e um projeto discordam, o projeto decide** — desde que a decisão esteja escrita na `constitution.md` ou
  numa ADR `Accepted` dele, e não contrarie a Parte I do `PRINCIPLES.md`.

## History

- **2026-10-26 06:15** · O `DP-22` ganha o endereço `daily_backup_run.run_worker` (o timeout por processo da cópia diária, que mata o grupo de processos), apontado pelo juiz da F75. Só o endereço; o padrão não mudou.
- **2026-10-26 05:33** · O endereço do `DP-27` no harness muda do `backup_repo._Lock` (aposentado com o backup no iCloud, F75 TASK-08, ADR-0024) para o `daily_backup_store.RunLock`, que trava a rodada da cópia diária (`daily/.lock`). Só o endereço e o sensor; o padrão não mudou.
- **2026-10-25 22:06** · A página entra no kernel com o guia `design-patterns-v1` do MJRP, sem mudar o texto (decisão dele: «esse
  é o arquivo esperado, pode colocar no kernel e renomeá-lo»). O contrato esperava a página desde 2026-10-20
  (`control_center.engineering_references.patterns`).
- **2026-10-25 22:26** · **A página é destilada** (decisão do MJRP: a opção (a) da crítica independente de 22:13,
  `reports/audits/2026-10-25-design-patterns-guide-and-doctor-architecture-audit.md`, com todos os ajustes): o guia v1 fica intacto em
  `docs/originals/design-patterns-guide/design-patterns-v1.md`, e a página o destila em **português, numa versão só**, com ID
  `DP-nn`, os sete campos e **todos os padrões do harness**, não só os dez do guia. Feature F77. O que mudou em relação ao v1,
  e por quê: (1) cada padrão ganhou o **sinal mínimo** e o **quando NÃO usar** (P1 MA-01: Strategy, Observer, Builder, Decorator e
  CQRS entravam sem limiar); (2) a matriz **deixou de recomendar o Singleton** que o próprio texto proibia — passa-se a instância
  como parâmetro (P1 IV-03; o container de DI do guia não existe na stack); (3) o Observer foi **partido** em em-processo (`DP-05`)
  e assíncrono com idempotência e DLQ (`DP-24`), porque o guia mandava usar os dois sem dizer o que acontece quando o ouvinte falha
  (P1 IV-08, VT-03); (4) entraram os padrões que o `PRINCIPLES`/cânone nomeiam (Facade, Service, Composable), os que o harness
  usa (Registry, Context Object, Collecting Parameter, Result, Adapter de processo externo, Strategy como função, o
  interceptador) e os que as regras do architecture-review supõem (Timeout, Retry, consumidor idempotente com DLQ, Expand and
  Contract, Saga), mais os que o catálogo pedia e faltavam (Port, Composition Root, Núcleo puro, Presenter, Lock com prazo,
  Bloqueio otimista, Correlation ID); (5) as **atribuições foram corrigidas**: o Builder é o de Bloch, não o do GoF; a «Factory»
  é a *parameterized factory method*; o CQRS não é o CQS de Meyer nem um padrão «de sistemas distribuídos»; o Circuit Breaker
  pressupõe processo longo e vem depois de timeout e retentativa com recuo; (6) cada padrão tem **teste S/N** e **sensor** (ou
  «nenhum»); (7) a seção **o que é opinião de stack**; (8) os emojis e a versão em inglês saíram (a redação em duas línguas
  duplicava o conhecimento numa página que vai para todo filho: P2 IV-05); (9) as fichas das fontes que o frontmatter cita
  existem em `docs/wiki/sources/`. O `PRINCIPLES.md` e o `engineering-canon` pararam de descrever padrões e passaram a citar o ID
  (F77 TASK-03).
- **2026-10-25 23:05** · Segunda passada da crítica (#21, P1 GV-03): nove testes S/N (DP-01, 02, 03, 06, 07, 09, 14, 19, 22) perguntavam pelo defeito sob o rótulo «S = passa», e um «sim» literal aprovava o erro → reescritos na forma afirmativa («sim» passa); a regra do campo 5 diz isso e o `new_project_selftest.py` recusa na página o rótulo de veredito invertido (F77).
- **2026-10-25 23:06** · Segunda passada (#22, P2 MA-01): os sinais mínimos do DP-16, DP-18 e DP-20 perdem a segunda cláusula (o ponto de extensão futuro, «imprimem direto», «mesmo corpo que o I/O»): só entra o fato já observado (F77).
- **2026-10-25 23:07** · Segunda passada (#23, P2 IV-06): âncoras corrigidas — o sensor do DP-01 não cobre arquivo (`open()` e `pathlib` ficam fora do `lint-imports`); o `return_marks` do DP-20 e do DP-24 mora em `mjrp-scripts/conformance_check.py` (o app o chama em `usecases/catalog_return.py`); a frase do DP-12 deixou de ser citação entre aspas (F77).

## Related
[[engineering-canon]] · [[architecture-review]] · [[design-canon]] · [[doctor]] · [[base-concept]]
