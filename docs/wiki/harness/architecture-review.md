---
title: Architecture Review — o cânone da crítica de arquitetura
aliases: [architecture-review, architecture review, revisão de arquitetura, crítica de ADR, handbook de arquitetura, vetos de arquitetura, hard stop gates, fitness functions]
summary: as regras com ID estável que a crítica de arquitetura cita — governança, anatomia da ADR, macroarquitetura, dados, comunicação, resiliência, invariantes com teste binário, vetos imediatos e sensores — destiladas do Handbook MJRP de Architecture Review (v0)
tags: [harness, arquitetura, revisao, kernel]
status: em formação
atualizado: 2026-10-09
fontes: [originals/architecture-review-handbook/2026-10-09-handbook-v0.md, wiki/sources/2026-10-09-mjrp-architecture-review-handbook.md, kernel/architecture/engineering-canon]
---
<!-- kernel do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

# Architecture Review — o cânone da crítica de arquitetura

> Kernel · página de referência · criada 2026-10-09 · destila o **Handbook MJRP: Architecture Review, Crítica a ADRs e
> Verificação Contínua (v0)** (original em `docs/originals/architecture-review-handbook/`) em regras com ID estável ·
> fontes de fundo: Nygard, Fowler, Hunt & Thomas, Martin, Beck, Richards & Ford, Kleppmann, AWS e Google Cloud
> Well-Architected (ficha em `docs/wiki/sources/2026-10-09-mjrp-architecture-review-handbook.md`)

## Definition

A **Architecture Review** é a passada que julga uma decisão de arquitetura — uma ADR em `Proposed`, os esqueletos
`arch.md` e `data-model.md`, a `constitution.md` — ou o código no portão de um marco, contra um checklist externo. Esta
página é esse checklist: cada regra tem um **ID estável**, o enunciado em uma ou duas frases e um **teste binário**.
É para a `mjrp-critiquing-architecture` o que o [[design-canon]] é para a `mjrp-critiquing-ux`: a skill **cita o ID**,
nunca recita a regra; quem quer o porquê abre esta página, e quem quer o porquê de cada princípio de engenharia abre o
[[engineering-canon]].

## Como ler as regras

- **ID estável.** Prefixo da disciplina + número. Nunca se renumera; regra retirada fica marcada *retirada*, com data e
  motivo no `## History`, e o número não é reusado — a auditoria antiga que o citava continua legível.
- **Teste binário.** Escrito como pergunta em que **S = passa** e **N = achado**. Onde o handbook pergunta pelo defeito
  ("existe em dois lugares?"), a pergunta foi virada, mantendo as palavras dele.
- **Aplica-se quando.** Várias regras do handbook nascem de sistema distribuído (fila, réplica, microsserviço). Elas
  trazem a condição: se o elemento não existe na arquitetura julgada, a regra **não se aplica** — e a auditoria diz isso,
  em vez de inventar o achado ou calar.
- **Dois eixos** (decisão do MJRP, 2026-10-09 22:30). **Técnico** — as regras do handbook: AD-01…05, MA, DD, CM, RS,
  IV, VT, SN, mais GV-03 e GV-06; só ele dá o veredito e só ele tem P0. **Higiene da decisão** — AD-06…AD-14 e GV-05,
  regras de processo (premissas, evidência, alternativas, aplicado antes do aceite, arquivos impactados, restrições
  escritas): viram notas curtas no fim da auditoria, sem severidade, e nunca bloqueiam o aceite.
- **Cita-se ID e nome curto** (`IV-03 Dependency Rule`), nunca o ID sozinho.
- **Origem.** Sem marca, a regra é do handbook. Marcada *(crítica 2026-10-09)*, veio do que a primeira passada real da
  crítica (ADR-0002 do Control Center) precisou e o handbook não tinha.

| Prefixo | Disciplina | Seção do handbook | Regras |
|---|---|---|---|
| **GV** | Governança da revisão | §1 | 6 |
| **AD** | Anatomia da ADR | §2 + crítica 2026-10-09 | 14 |
| **MA** | Macroarquitetura | §3, nível 1 | 6 |
| **DD** | Consistência e modelagem de dados | §3, nível 2 A | 3 |
| **CM** | Comunicação e protocolos | §3, nível 2 B | 3 |
| **RS** | Modos de falha, resiliência e recursos | §3, nível 2 C | 4 |
| **IV** | Invariantes de engenharia, com teste binário | §4 | 11 |
| **VT** | Vetos imediatos (*hard stop gates*) | §5 | 6 |
| **SN** | Sensores e verificação contínua | §6 | 8 |

Os prefixos não colidem com os do [[design-canon]] (HI, DE, CO, CP, IN, AH, RC, MP).

## GV · Governança da revisão

| ID | Regra | Teste (S = passa) |
|---|---|---|
| **GV-01** | **Blameless.** A revisão é consultiva e mentora; não é porta de aprovação punitiva. O achado aponta o artefato e a âncora, nunca a pessoa. | Todo achado nomeia artefato, âncora e custo — e nenhum julga quem fez? |
| **GV-02** | **Enxuta e assíncrona.** A ADR e o desenho são avaliados antes, por escrito; a conversa síncrona com o humano fica só para as divergências de trade-off. | A auditoria chegou escrita antes da conversa, e o que vai ao humano é só divergência de trade-off e aceite? |
| **GV-03** | **Guias são caros, sensores são baratos** (`PRINCIPLES.md` II.2). Checklist e auditoria manual custam atenção a cada vez; o papel da revisão é transformar decisões em sensores determinísticos e testes automatizados. | Cada regra que a decisão impõe tem um sensor (teste, lint, erro de build, check do doctor) — ou a auditoria a nomeia como não verificada? |
| **GV-04** | **O autor não é o juiz** (`PRINCIPLES.md` II.3). Auto-relato de quem projetou ou implementou não é prova de conformidade; a verificação devolve 0 ou 1 por mecanismo objetivo. A passada de julgamento nunca se mistura com a de produção: roda como **troca de chapéu declarada** (mesmo agente) ou num **agente separado** que recebe só a skill e os artefatos. | A auditoria declara quem julgou e como a passada se separou da produção? |
| **GV-05** | **Critério de saída declarado e verificável** (`PRINCIPLES.md` II.4). Nenhuma ADR ou desenho é aprovado sem critérios de aceite binários, metas numéricas e testes de carga ou de contrato definidos antes. | A decisão traz os critérios S/N e as metas numéricas que dirão se ela funcionou? |
| **GV-06** | **ETC (Easier to Change).** Entre duas opções técnicas válidas, a melhor é a que torna a próxima mudança mais barata e segura. | O critério que decidiu é o custo da próxima mudança — e não gosto, hábito ou "o mais robusto" em abstrato? |

## AD · Anatomia da ADR

As cinco primeiras são o §2 do handbook: a ADR se escreve com clareza matemática e contratual — eixo técnico. As
outras nove são o que a crítica de 2026-10-09 precisou para julgar uma ADR real — **higiene da decisão**: notas, nunca
P0, nunca bloqueiam o aceite. No marco, o AD-14 (o código contra as ADRs `Accepted` e a `constitution.md`) é deriva de
arquitetura, e aí é técnico.

| ID | Regra | Teste (S = passa) |
|---|---|---|
| **AD-01** | **Invariantes quantificados.** Termo vago ("alta performance", "baixa latência") vira meta mensurável de SLO/SLI — latência por percentil, vazão sustentada e de pico, tamanho médio e teto da carga útil. Os números do handbook (P95 ≤ 40 ms, 3.500 req/s) são de sistema distribuído; o princípio vale em qualquer escala (num app local: "a tela abre em menos de 1 s com 20 projetos"). | Todo atributo de qualidade que a decisão promete tem número e medida? |
| **AD-02** | **Contratos e fronteiras explícitos.** Os limites de cada contexto, o esquema da comunicação e o transporte (síncrono × assíncrono, binário × texto) estão declarados. | Cada fronteira da decisão tem contrato com esquema e transporte escritos? |
| **AD-03** | **SPOFs mapeados.** Todo nó, broker, cache, partição ou processo cuja falha interrompe o fluxo principal está listado, com mitigação ou com a aceitação do risco. | Há um componente cuja falha para o fluxo principal e não está na lista? (S = a lista está completa) |
| **AD-04** | **Ciclo de vida do dado.** Para cada dado persistido: mutabilidade, concorrência (otimista × pessimista), indexação, particionamento e a estratégia de purga e retenção. | Para cada dado que a decisão grava, a ADR diz quem escreve, como conflitos se resolvem e quanto tempo ele vive? |
| **AD-05** | **Escrutínio das consequências.** Decisão sem lado negativo documentado indica análise falha. As consequências expõem complexidade operacional, curva de aprendizado e custo financeiro. | As consequências trazem os negativos nas três dimensões? |
| **AD-06** | **Premissas verdadeiras** *(crítica 2026-10-09)*. Todo fato que a ADR declara como contexto (o que o código, o protótipo, um documento ou um arquivo contém) é verdadeiro no artefato hoje. | Cada fato do contexto foi conferido no artefato e confere? |
| **AD-07** | **Evidência bem aplicada** *(crítica 2026-10-09)*. Um fato verdadeiro sustenta a conclusão que a ADR tira dele — sem trocar o objeto medido (medir o protótipo e concluir sobre a opção, medir um caso e concluir sobre todos). | Cada conclusão segue do fato que a sustenta, sobre o mesmo objeto? |
| **AD-08** | **Alternativas genuínas** *(crítica 2026-10-09)*. Ao menos duas opções reais, cada uma com contras honestos e avaliada pelo próprio desenho; nenhuma é espantalho montado para perder. | Há duas opções que alguém sensato escolheria, cada uma julgada pelo que ela é? |
| **AD-09** | **Critério de custo de mudança** *(crítica 2026-10-09)*. A decisão declara o critério da escolha, e ele fala do que muda com frequência e do que muda pouco (GV-06 aplicado ao texto da ADR). | A seção de decisão diz o critério, e ele é sobre o custo de mudar? |
| **AD-10** | **Premissa mais arriscada** *(crítica 2026-10-09)*. A premissa que, se falsa, derruba a decisão está nomeada, com um teste cedo e barato. | A ADR nomeia a premissa mais arriscada e como testá-la antes de pagar caro? |
| **AD-11** | **Premissas verificáveis** *(crítica 2026-10-09)*. Cada premissa da decisão vem com o sinal observável que diria que ela falhou, e com o gatilho que reabre a decisão. | Para cada premissa há um sinal que a desmente e um gatilho de revisão? |
| **AD-12** | **Nada aplicado antes do aceite** *(crítica 2026-10-09)*. Uma ADR `Proposed` não muda specs, não marca a ADR anterior como substituída e não move código; tudo isso espera o `Accepted` do humano. | Nenhum arquivo reflete a decisão antes do aceite? |
| **AD-13** | **Arquivos impactados** *(crítica 2026-10-09)*. A lista de arquivos que a decisão muda está completa e bate com o que ela muda — inclusive memória, visão e ponteiros. | A lista de arquivos impactados bate com o que a decisão muda? |
| **AD-14** | **Restrições respeitadas** *(crítica 2026-10-09)*. Nenhuma restrição declarada é quebrada: `VISION.md`, `PRINCIPLES.md`, `constitution.md`, o contrato (`.mjrp-project.yml`), uma ADR `Accepted` e as restrições permanentes do dono do produto no `MEMORY.md` (*Do Not Forget*). Na decisão, é nota de higiene; o conteúdo técnico da contradição, se houver, é julgado pela regra técnica que ela toca. | A decisão (ou o código) respeita cada restrição declarada — ou nomeia a exceção para o humano aceitar? |

## MA · Macroarquitetura (nível 1)

| ID | Regra | Teste (S = passa) |
|---|---|---|
| **MA-01** | **Simplicidade e prontidão (anti-overengineering).** A solução mais simples para o problema de hoje; nenhuma generalidade especulativa (desenhar para problemas que não virão nos próximos 12 meses); stack dominada por quem vai mantê-la. | Nenhuma estrutura é paga antes do primeiro usuário dela, e a stack é dominada pelo time? |
| **MA-02** | **Acoplamento e autonomia de deploy.** Alterar um contrato não obriga mudar e entregar outros módulos ao mesmo tempo (*lockstep*). | Um módulo muda o próprio contrato sem obrigar outro a mudar junto? |
| **MA-03** | **Evolução e reversibilidade.** Porta de uma via × duas vias: o irreversível está nomeado; o adiado tem a porta pronta e um gatilho que diz quando decidir; nenhum fornecedor aprisiona sem camada de isolamento. | Reverter a decisão, se a premissa falhar, custa uma troca de adaptador — ou o custo maior está nomeado e aceito? |
| **MA-04** | **FinOps e economia unitária.** O custo marginal por transação e os custos ocultos (tráfego entre zonas, NAT, indexação de NoSQL, cobrança por uso) estão previstos. *Aplica-se quando* a decisão tem custo variável: infraestrutura paga, API cobrada por chamada, tokens. | O custo por unidade de uso está estimado, com os custos ocultos? |
| **MA-05** | **Modelagem de ameaças (Zero Trust).** A superfície está explícita — onde escuta, o que grava, o que lê; a comunicação interna se autentica ponta a ponta (mTLS, *aplica-se quando* há mais de um serviço em rede); segredos são injetados sem nunca residir em código ou repositório. | A superfície está escrita e nenhum segredo passa por código ou repositório? |
| **MA-06** | **A estrutura grita o propósito** *(crítica 2026-10-09; [[engineering-canon]] § Componentização)*. A árvore de pastas fala do domínio, não do framework. | Quem lê a árvore entende o que o sistema faz antes de saber com que foi feito? |

## DD · Consistência e modelagem de dados (nível 2 A)

| ID | Regra | Aplica-se quando | Teste (S = passa) |
|---|---|---|---|
| **DD-01** | **Transacionalidade entre limites.** Operações entre serviços usam Saga com compensação explícita, não transação distribuída (2PC). | uma operação escreve em mais de um serviço ou armazenamento | Cada operação que cruza limites tem compensação escrita? |
| **DD-02** | **Concorrência e conflitos.** O acesso simultâneo ao mesmo recurso tem estratégia declarada: bloqueio otimista (versão, etag) ou pessimista (*row lock*). | há mais de um escritor do mesmo recurso — inclusive dois aparelhos ou duas abas | A estratégia de conflito está declarada para cada recurso com mais de um escritor? |
| **DD-03** | **Volume e particionamento.** As consultas novas respeitam os índices; a chave de particionamento distribui a carga sem *hot partitions*. | há banco indexado ou particionado, ou volume que não cabe numa leitura inteira | As consultas e a chave de partição foram conferidas contra o volume esperado? |

## CM · Comunicação e protocolos (nível 2 B)

| ID | Regra | Aplica-se quando | Teste (S = passa) |
|---|---|---|---|
| **CM-01** | **Semântica de entrega e idempotência.** Consumo *at-least-once* tem idempotência na camada de aplicação. | há mensageria, fila ou retentativa | Processar a mesma mensagem duas vezes deixa o mesmo estado? |
| **CM-02** | **Latência em cascata.** As chamadas síncronas encadeadas no caminho crítico estão contadas e justificadas; o desenho assíncrono foi considerado. | há chamadas síncronas encadeadas no caminho crítico | O número de saltos síncronos do caminho crítico está contado e cabe na meta de latência (AD-01)? |
| **CM-03** | **Evolução de schemas.** Campo novo é retro e pró-compatível, sem migração coordenada: o contrato é versionado, tem regra de compatibilidade e teste. | há contrato ou schema lido por mais de uma parte (inclui um arquivo JSON entre o leitor e a tela) | O contrato tem versão, regra de compatibilidade e um teste que a confere? |

## RS · Modos de falha, resiliência e recursos (nível 2 C)

| ID | Regra | Aplica-se quando | Teste (S = passa) |
|---|---|---|---|
| **RS-01** | **Contrapressão (*backpressure*).** Se o produtor for mais rápido que o consumidor, o que falha primeiro é escolhido: descarte controlado, *rate limiting* (HTTP 429) — nunca estouro de memória. | produtor e consumidor têm ritmos independentes | O comportamento sob sobrecarga está declarado? |
| **RS-02** | **Retries e proteção a jusante.** Retentativas usam recuo exponencial com *jitter* para não criar efeito manada. | há retentativa contra uma dependência | Toda retentativa tem recuo exponencial, *jitter* e teto? |
| **RS-03** | **Comportamento de caches.** A invalidação está declarada (TTL, *write-through*, por evento); a avalanche de requisições frias (*cache stampede*) depois de um reinício está prevista. | há cache | A invalidação e o reinício a frio estão desenhados? |
| **RS-04** | **Runtime e conexões.** O modelo de concorrência (event loop × thread pool) combina com o perfil da carga (I/O × CPU); os pools respeitam os limites de sockets e descritores; o runtime permite o que a decisão faz (ex.: disco efêmero e somente leitura em serverless). | sempre que há runtime escolhido; os pools, quando há conexões | O runtime escolhido suporta a carga e as operações que a decisão pede? |

## IV · Invariantes de engenharia, com teste binário

Os onze princípios de engenharia do cânone, cada um com o teste do handbook (§4). O número entre parênteses é o item
da Parte I do `PRINCIPLES.md`; o porquê de cada um mora no [[engineering-canon]].

| ID | Princípio | Regra | Teste binário (S = passa) |
|---|---|---|---|
| **IV-01** | **Modularização** (I.1) | Todo código é componentizado para permitir substituição sem reabertura. | Um módulo que fazia duas coisas que mudam por motivos diferentes virou dois? |
| **IV-02** | **SRP e módulo pequeno** (I.2) | Uma responsabilidade por módulo (responde a um único ator); previne *God Files*. | O módulo se descreve numa frase sem a conjunção "e"? |
| **IV-03** | **Dependency Rule e DIP** (I.3) | Dependências apontam estritamente para dentro; o domínio não conhece banco, framework ou UI. | Trocar a fonte de dados ou o provedor externo exige mudar exatamente um arquivo (o Adapter)? |
| **IV-04** | **Padrões com endereço** (I.4) | Padrões (*Repository*, *Adapter*, *Strategy*, *Facade*) são declarados com onde moram e para quê. | O padrão está no desenho com endereço — ou o próximo engenheiro vai reinventá-lo? (S = com endereço) |
| **IV-05** | **ETC e DRY** (I.5) | O conhecimento tem representação única e inequívoca no sistema. | Cada regra de negócio existe num lugar só? (o handbook: "existe em dois lugares? Se sim, vão divergir") |
| **IV-06** | **Intenção explícita** (I.6) | O código expressa a intenção sem comentário que justifique má estrutura. | Lendo a assinatura e o cabeçalho, entende-se o que a função faz sem ler o corpo? |
| **IV-07** | **Sem janela quebrada** (I.7) | Entropia não se tolera; código e design ruins se corrigem quando são descobertos. | Nenhum atalho técnico ficou com a resposta "depois" sem custo estimado e dono? (o handbook: "se foi 'depois', já é janela quebrada") |
| **IV-08** | **Sem falha silenciosa** (I.8) | Todo erro é sinalizado explicitamente; promessa sem *catch*, bloco vazio, leitura que falha e vira "vazio" ou "zero" são inaceitáveis. | Se uma falha ocorrer em qualquer etapa (inclusive a assíncrona e a leitura de fonte), alguém — usuário, log ou sensor — fica sabendo na hora? |
| **IV-09** | **Testabilidade F.I.R.S.T.** (I.9) | O sistema é testável; a suíte é rápida, independente, repetível e automatizada. | A suíte inteira roda em ambiente limpo sem intervenção manual? |
| **IV-10** | **Spec aprovada** (I.10) | Specify → Plan → Tasks → Implement, sem pular etapa. | Existe especificação aprovada antes da primeira linha de código? |
| **IV-11** | **Segredo zero no código** (I.14) | Chaves, senhas e tokens vêm só do ambiente ou de um *Secret Manager*. | O repositório inteiro poderia ficar público amanhã sem revogar nenhuma credencial? |

## VT · Vetos imediatos (*hard stop gates*)

Uma ADR ou desenho que contém um destes padrões é rejeitado sumariamente. **Veto quando se aplica:** se a arquitetura
tem o elemento e viola a regra, o achado é **P0, sem discussão** — não cai de severidade por argumento de ninguém; a
saída é a correção ou uma exceção que **só o humano** aceita, explícita e registrada na ADR. Se o elemento não existe,
a auditoria registra **"não se aplica"** — os seis vetos aparecem sempre, cada um com a sua resposta.

| ID | Veto | O elemento (aplica-se quando) | Teste (S = passa) |
|---|---|---|---|
| **VT-01** | **Banco de dados compartilhado** — serviços de domínios distintos escrevendo nas mesmas tabelas sem isolamento. | mais de um serviço ou módulo de domínio distinto grava no mesmo armazenamento | Cada armazenamento tem um único dono de escrita por domínio? |
| **VT-02** | **Cadeia síncrona sem timeout e fallback** — API externa no caminho crítico sem *circuit breaker* e degradação graciosa. | uma dependência externa é chamada no caminho crítico | Toda chamada externa do caminho crítico tem timeout, fallback e degradação definidos? |
| **VT-03** | **Mensageria sem DLQ e sem idempotência** — supor entrega *exactly-once* sem fila de mensagens mortas e sem chave de deduplicação. | há mensageria ou fila | Toda fila tem DLQ e todo consumidor, chave de deduplicação? |
| **VT-04** | **Sem correlação de traces** — microsserviços ou sistema distribuído sem propagação obrigatória de Trace-ID e Span-ID. | o sistema é distribuído (mais de um processo em rede no mesmo fluxo) | Todo salto propaga Trace-ID e Span-ID? |
| **VT-05** | **Mutação destrutiva de schema** — deploy que exige parar tudo para renomear coluna ou mudar contrato, sem coexistência em duas fases (*Expand and Contract*). | um schema ou contrato com dados ou consumidores existentes muda | Toda mudança de schema passa por *expand and contract*, sem parada total? |
| **VT-06** | **SDK de terceiro no domínio** — biblioteca de infraestrutura (AWS SDK, Firebase, Stripe, cliente de rede ou de armazenamento) importada em Entidades ou Casos de Uso. Biblioteca de linguagem (validação, datas) não é veto: é IV-03, compromisso a custear. | o sistema usa SDK de infraestrutura | Nenhum SDK de infraestrutura é importado fora dos Adaptadores? |

## SN · Sensores e verificação contínua

Para evitar a erosão arquitetural (*architecture drift*), a conformidade é garantida por sensores no ciclo de
integração. Na decisão, cada regra que a ADR impõe nomeia o seu sensor (GV-03); no marco, o sensor existe e está verde.

| ID | Sensor | Aplica-se quando | Teste (S = passa) |
|---|---|---|---|
| **SN-01** | **Dependency Rule automatizada** — linter arquitetural (ArchUnit, dependency-cruiser, ts-arch, import-linter) falha o build se Entidades ou Casos de Uso importam Frameworks & Drivers ou Adaptadores, ou se o grafo tem ciclo (ADP). | sempre que há camadas declaradas | A regra de dependência quebra o build quando é violada? |
| **SN-02** | **Escada de isolamento de SDKs** — o sensor bloqueia chamada direta a provedor externo fora da pasta de Adaptadores. | há SDK de infraestrutura | Um import de SDK fora dos Adaptadores é bloqueado antes do merge? |
| **SN-03** | **Detecção de segredos** — scanner estático (TruffleHog, Gitleaks) bloqueia credencial antes do merge. | sempre | Um segredo commitado é barrado antes do merge? |
| **SN-04** | **Compatibilidade de schemas** — teste no CI compara o contrato contra o registro (ou as amostras de cada versão) e barra *breaking change*. | há contrato versionado (CM-03) | Uma mudança incompatível no contrato quebra o build? |
| **SN-05** | **Consumer-driven contracts** — validação automática entre provedor e consumidor (Pact) antes de promover o ambiente. | provedor e consumidor são entregues separadamente | O contrato de cada consumidor é verificado contra o provedor antes da promoção? |
| **SN-06** | **Testes de idempotência e resiliência** — injetar a mesma mensagem várias vezes; forçar exceção para conferir o roteamento à DLQ. | há mensageria ou retentativa (CM-01, VT-03) | Há teste que repete a mensagem e teste que força a DLQ? |
| **SN-07** | **Sensores de invariantes (SLO/SLI)** — telemetria e alerta conferem, em operação, os limites prometidos na ADR (AD-01). | há meta numérica em operação | Cada meta da ADR tem uma medida que alerta quando é rompida? |
| **SN-08** | **Chaos engineering e game days** — desligar réplicas e injetar latência em homologação para ver o *circuit breaker* e a degradação graciosa atuarem. | há réplicas, *circuit breakers* ou degradação declarada | A degradação declarada foi exercitada de propósito pelo menos uma vez? |

## Como a crítica usa esta página

**Quem julga.** A `mjrp-critiquing-architecture`, sempre separada da produção (GV-04): troca de chapéu declarada no
mesmo agente, ou agente separado que recebe só a skill e os artefatos. A auditoria diz qual das duas. A mesma regra vale
para a `mjrp-critiquing-ux`.

**Os momentos.**

| Momento | O objeto |
|---|---|
| **Decisão** — ADR `Proposed`, primeiro esqueleto de `arch.md` / `data-model.md`, troca de stack | a ADR e os arquivos que o *Files impacted* dela lista; o resto é o estabelecido |
| **Marco** — antes do Specify de um marco novo, implementação grande, builder novo | o código contra a arquitetura |
| **Deriva / Brownfield** — código suspeito de desvio, produto sem arquitetura escrita | o código e o que estiver escrito — em vez de passa/não passa, um recorte em ordem: vetos e P0 estruturais primeiro, depois por custo de mudança |

Que regras cada momento roda está num lugar só: `reference/moment-checks.md` da `mjrp-critiquing-architecture`.

**Severidades.**

- **P0 — estrutural, só do eixo técnico:** veto aplicável violado; Dependency Rule quebrada no núcleo (IV-03 — o
  domínio depende de framework, de detalhe de I/O ou, no código, de conceito de tela); compromisso irreversível sem
  necessidade (MA-03). O contrato com forma de tela é P1 na decisão (sem código, barato de mover) e P0 no marco quando o
  domínio importa a tela. Na decisão, a ADR não vai ao aceite com P0 aberto: o designer
  corrige, ou o P0 vira **exceção que o humano aceita explicitamente**, registrada na ADR e na auditoria. No marco, o P0
  se resolve do mesmo jeito antes do Specify.
- **P1 — caro depois:** funciona, mas falta uma costura, uma regra não tem sensor, um risco não tem nome, um custo está
  subestimado. Corrige-se, ou o humano o aceita como compromisso custeado.
- **P2 — acabamento:** clareza, nomes, lista desatualizada. Registra-se; não se agenda.
- **Higiene da decisão — sem severidade:** AD-06…AD-14 e GV-05, como notas no fim da auditoria; dizem o que se achou e
  quem age. Quando uma nota muda uma conclusão técnica (o desenho se apoia numa premissa falsa), o achado técnico a cita
  e leva a severidade.

**Onde a crítica aparece.** Toda passada grava o relatório em `reports/audits/`, com um frontmatter que o Control
Center lê (System Monitor · Health Check), e uma entrada `review` no log do projeto que aponta para ele — a crítica nunca
fica só num arquivo.

Um compromisso que a decisão já nomeia e custeia não é achado, salvo se o custo estiver subestimado. Uma decisão já
escrita (ADR `Accepted`, regra da `constitution.md`) não é achado contra si mesma — a contradição com ela é.

**Quando o projeto e esta página discordam,** o projeto decide — desde que a decisão esteja escrita na `constitution.md`
ou numa ADR `Accepted` dele, e não contrarie a Parte I do `PRINCIPLES.md`.

## How MJRP uses it

- **Esta página é do kernel** — vai carimbada para todo projeto em `docs/wiki/harness/architecture-review.md`, e o
  [[doctor]] confere que chegou e que o carimbo não envelheceu.
- **Lê-se sob demanda.** Quem vai julgar uma ADR ou um marco abre; a `mjrp-critiquing-architecture` cita o ID e manda
  ler daqui. O arquiteto (`mjrp-designing-architecture`) a usa como lista do que a ADR precisa ter antes da crítica; a
  ADR em si segue a [[adr-practice]].
- **Onde mora no ciclo:** a crítica antes do aceite da ADR e no portão do marco ([[pdlc-loops]]).

## History

- **2026-10-09 20:55** · Página criada a partir do handbook do MJRP (*Handbook MJRP: Architecture Review, Crítica a ADRs e Verificação Contínua (v0)*, original em `docs/originals/architecture-review-handbook/`). Decisões dele na revisão geral de 2026-10-09: o handbook vira página do kernel com ID estável por regra, como o [[design-canon]] para a crítica de UX; os vetos valem quando se aplicam ("não se aplica" quando o elemento não existe); a separação da crítica é troca de chapéu declarada ou agente separado. As regras marcadas *(crítica 2026-10-09)* vêm das 12 lacunas que a primeira passada real da `mjrp-critiquing-architecture` (ADR-0002 do Control Center, 20:05) encontrou.

- **2026-10-09 22:55** · **O veredito é técnico** (MJRP, 22:30: o foco da crítica é técnico, não processual; os P0 de processo da ADR-0002 não são P0). Dois eixos: o técnico (as regras do handbook, mais GV-03 e GV-06) dá o veredito e só ele tem P0; AD-06…AD-14 e GV-05 viram *higiene da decisão*, notas sem severidade. O AD-12 e o AD-14 saem dos gatilhos de P0; o contrato com forma de tela é P1 na decisão. A tabela dos momentos perde a coluna "o que roda" (a fonte única é a skill); cita-se ID e nome curto; a crítica aparece no log (entrada `review`) e no Control Center. Proposta e diagramas: `design/proposals/2026-10-09-2234-critiquing-architecture-refocus-proposal.md`.

## Related
[[engineering-canon]] · [[adr-practice]] · [[design-canon]] · [[pdlc-loops]] · [[doctor]]
