---
title: Conceitos base
aliases: [base-concept, conceitos-base, fundamental-concepts, conceitos-fundamentais, propósito, visão, objetivo, a cadeia, propósito-visão-objetivo-roadmap]
summary: a cadeia propósito → visão → objetivo → roadmap — o que cada elo responde, com que horizonte, e por que a ordem entre eles não é estilo
tags: [harness, fundamento, estrategia]
status: em formação
atualizado: 2026-09-14
fontes: []
---
<!-- kernel do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
A **cadeia de intenção** que ordena todo documento do MJRP que declara para onde se vai:
**Propósito → Visão → Objetivo → Roadmap**. Cada elo responde uma pergunta diferente, com um
horizonte diferente, e **só existe a partir do anterior** — a ordem é derivação, não estilo.

## What it is

A definição, como o MJRP a declarou:

| Elo | Responde | O que é | Horizonte |
|---|---|---|---|
| **Propósito** | o **WHY** | a razão de ser — a necessidade que se quer resolver | sem prazo |
| **Visão** | o **WHERE** | o horizonte a alcançar; uma **instanciação** do porquê | longo prazo |
| **Objetivo** | o **WHAT** | uma meta clara para alcançar a visão | curto a médio prazo |
| **Roadmap / Plan** | o **HOW** | como atingir o objetivo para alcançar a visão | curto a médio prazo |

**O HOW tem duas metades** (emenda de 14/09/2026): o **plano** — o `ROADMAP.md` — e a
**estratégia**, que no MJRP são os dois modelos de negócio. Estratégia não é elo próprio: é o que
sustenta o plano.

**No mundo da administração, o propósito vem primeiro** porque ele define a razão de ser da
organização e a necessidade que ela deseja solucionar, enquanto a visão representa onde ela quer
chegar no futuro.

### O Propósito — o Porquê

- **Essência.** É a causa fundamental, ou o motivo pelo qual a empresa existe.
- **Função.** Serve como uma bússola que energiza e dá sentido a todas as ações.
- **Momento.** Surge **antes** de qualquer planejamento, nascendo da identificação de um problema
  real a ser resolvido no mundo.

### A Visão — o Onde

- **Essência.** É o objetivo de longo prazo, o retrato do futuro que a organização deseja construir.
- **Função.** Mostra o tamanho do impacto e o patamar que a empresa pretende alcançar a partir do
  seu alicerce.
- **Momento.** É construída **com base no propósito**; afinal, você só sabe para onde ir (visão)
  se souber quem você é e por que existe (propósito).

### Por que a ordem importa

Três consequências que só aparecem quando a cadeia está na ordem certa:

- **A durabilidade é decrescente.** Propósito não muda; visão se substitui quando é alcançada ou
  quando o mundo muda; objetivo se refaz a cada ciclo; roadmap muda toda semana. Um documento que
  inverte a ordem envelhece **pelo topo** — e topo envelhecido é o que ninguém mais usa para decidir.
- **Visão é instanciação, não sinônimo de propósito.** Um mesmo propósito comporta mais de uma
  visão ao longo do tempo. Trocar de visão não é perder identidade: é o mecanismo previsto.
- **Cada elo se justifica pelo anterior.** Objetivo sem visão é meta solta; visão sem propósito é
  ambição sem razão; roadmap sem objetivo é atividade sem prova.

### As duas coisas que invadem a Visão — e onde elas moram

Nenhuma das duas merece campo próprio. Ambas já têm elo; o erro é só de endereço:

| | Responde | Mora em |
|---|---|---|
| **Produto / solução** | o que se constrói e o que ele entrega | o **Objetivo (WHAT)** — produto é o que se entrega para alcançar a meta, não um quinto campo |
| **Estratégia / modelo de negócio** | onde jogar e como ganhar — foco primário e secundário, monetização | o **Como (HOW)**, ao lado do plano |

### Os dois "comos" que se confundem

A palavra *como* nomeia duas coisas diferentes, e é a confusão mais fácil de cometer na cadeia:

| | Pergunta que responde | Elo |
|---|---|---|
| **O como do plano** | como **chegamos lá** — em que ordem se constrói, com que prova, sustentado por qual estratégia | **Como (HOW)** |
| **O como do produto** | como a coisa entregue **funciona por dentro** — o ciclo, os modos, a arquitetura | **Objetivo (WHAT)** |

**O teste:** se a frase deixa de ser verdadeira quando o projeto termina, é plano. Se continua
verdadeira depois de pronto — porque descreve o que existe —, é produto, e produto é WHAT.

Por isso um cabeçalho de seção **não deve começar com "Como"** dentro do Objetivo: o nome atrai o
conteúdo para o campo errado. *(Foi o que aconteceu em 14/09: uma seção chamada "Como o ciclo roda"
pareceu HOW por causa do título, estando no lugar certo. Virou "O ciclo de entrega".)*

### O que a Visão não é

Três modos de falha, todos encontrados no próprio `VISION.md` do harness na revisão de 14/09/2026:

- **Visão ≠ produto.** *"Um sistema agêntico que entrega software"* diz o que se vai construir.
  Descrição de produto é **Objetivo**, não horizonte.
- **Visão ≠ arquitetura ou fluxo operacional.** O ciclo discovery → entrega e o human-in-the-loop
  descrevem **como o sistema funciona**. É mecânica do que se entrega; mora no **Objetivo**.
- **Visão ≠ modelo de negócio.** Primário e secundário, fábrica, monetização — é estratégia, e
  estratégia é metade do **Como (HOW)**.

### O teste de uma visão pronta

Quatro perguntas. Falhar em qualquer uma significa que o que está escrito é outro elo:

1. **É inspiradora?** Diz o estado futuro e o **tamanho do impacto** — não a implementação.
2. **É concisa e clara, lida em voz alta, sem paráfrase?** Sem limite de frases: o tamanho é o que a
   ideia pede. Texto que precisa de fôlego no meio ou de paráfrase para fazer sentido sozinho
   ainda não está pronto.
3. **Sobrevive à troca de stack?** Se trocar a tecnologia invalida a frase, era arquitetura.
4. **É desta organização?** Se trocar o nome por qualquer outra empresa e a frase continuar
   verdadeira, é slogan — não visão. É o teste que mais reprova, porque linguagem inspiradora
   genérica passa fácil nos três primeiros.

## How MJRP uses it

A cadeia é o contrato de qualquer documento de intenção do MJRP. **O `VISION.md` de hoje não a
segue** — e a boa notícia do diagnóstico é que o conteúdo certo já está escrito; o que está errado
são os rótulos e a ordem.

| O que o `VISION.md` rotula hoje | O que o texto realmente é, pela cadeia |
|---|---|
| `Visão (WHY)` — *"a família MJRP com a vida facilitada e sustentada financeiramente por um sistema agêntico"* | **Propósito.** Razão de ser, sem prazo. Não é um lugar aonde se chega |
| `Propósito` — *"começar ou retomar qualquer projeto sem atrito… zero re-explicação"* | **Objetivo.** Meta clara, de curto a médio prazo, verificável |
| dentro do `Objetivo (WHAT)` — *"o horizonte é um sistema agêntico que entrega software — o MJRP SaaS"* | **Visão.** É o ONDE: o patamar a alcançar |
| `Como (HOW)` — *"o que o projeto é, na prática"* | **Objetivo.** O que o harness é e entrega faz parte do WHAT. O campo `Como (HOW)` passa a carregar o que é de fato HOW: o ponteiro para o `ROADMAP.md` e a estratégia |
| `ROADMAP.md`, abertura — *"~20 intervenções → 1"* | **Objetivo.** O roadmap é o que vem depois disso — desde 17/09, os resultados em Now / Next / Later (a métrica saiu) |

**Consequência para o [BACKLOG #25].** O item pedia confirmar o Propósito e nunca fechava porque
o campo estava errado, não o texto: o parágrafo escrito é um bom Objetivo posto no lugar do WHY.
O item deixa de ser *"confirmar um parágrafo"* e passa a ser *recolocar os quatro campos na
cadeia*.

**Decidido em 14/09.** O quarto campo continua sendo `Como (HOW)` — o que mudou é o conteúdo: ele
deixa de descrever o que o projeto é (isso subiu para o **Objetivo**) e passa a carregar o plano
(ponteiro para o `ROADMAP.md`) e a estratégia. Não existe quinto campo: `Definição` e
`Produto / Solução` foram propostas descartadas.

**Onde a mudança bate.** A cadeia é declarada aqui, mas o template do `VISION.md` é reproduzido em
outros cinco lugares: [[vision-document]] (a página que declara o template), `VISION.md`, a
`mjrp-pdlc-bootstrap` (que cria o esqueleto do VISION de todo projeto novo, do modelo da `mjrp-coaching-pm`, dona do conteúdo), a `mjrp-pdlc-onboarding` (que abre
toda síntese de sessão pelo campo do WHY) e o `new_project.py`. Enquanto a propagação não acontece,
esta página e o template divergem — por isso o status é *em formação*.

## History

> A decisão mora na página do assunto que ela muda, com data (ADR-0008).
- **2026-10-29 19:10** · **O teste 2 da visão pronta não conta frases.** O MJRP: «não tem essa constraint de uma frase e uma sentença, isso é bem ruim e limitante. Ser conciso e claro é importante, mas regra especifica de uma frase nao». O teste passa de «cabe em uma frase» para «é concisa e clara, lida em voz alta, sem paráfrase». Ver [[vision-document]] (UAT-408, F126).
- **2026-09-14 20:51** · **O MJRP cortou uma regra que eu tinha deduzido e usado como bloqueio.** Na entrada
  de 18:36 eu escrevi que *"a cadeia exige que a visão instancie o propósito, não que o exceda"* e
  abri o BACKLOG #48 ("decidir o nível org × projeto") como pré-condição de propagar o template.
  Ele: *"o vision está fechado, não tem nada mais bloqueando isso… o 48 nem deveria existir"*.
  Está certo: um propósito é satisfeito por uma visão que faz **mais** — a família MJRP está
  entre as "diversas famílias". E o Propósito ser da organização e aparecer igual em todo
  `VISION.md` não é mistura de níveis: é o elo sem prazo se repetindo, como deve. **A regra
  vigente é só a dele: visão é instanciação do propósito.** Sem cláusula de "não exceder".

- **2026-09-14 18:53** · **Entrou a distinção entre os dois "comos"**, provocada por uma pergunta do MJRP
  (*"o 'como o ciclo roda' não deveria estar em HOW?"*). Não deveria: o ciclo descreve como o
  produto **funciona**, e isso é WHAT; o `Como (HOW)` responde como se **chega lá** — plano e
  estratégia. O erro estava no nome da seção, que eu tinha escrito como "Como o ciclo roda" e
  puxava o conteúdo para o campo errado; virou "O ciclo de entrega". Junto: o horizonte do
  Propósito perdeu o *"não muda"* e ficou só **"sem prazo"** — decisão do MJRP, que reservou para
  si o direito de mudá-lo.

- **2026-09-14 18:36** · **A Visão foi reescrita pelo MJRP e ampliou o alcance**: de *"sustenta a família"*
  para *"sustenta diversas famílias"*, e de *produtos de software* para *produtos digitais*.
  Redação final: *"A organização MJRP sustenta diversas famílias com um portfólio de produtos
  digitais concebidos por gente e construídos, operados e mantidos por agentes."* **Consequência
  em aberto:** a Visão passou a ser mais larga que o Propósito, que ainda fala de uma família só —
  e a cadeia exige que a visão instancie o propósito, não que o exceda. Junto, o rótulo do campo
  foi corrigido de `(ONDE)` para `(WHERE)`: rótulo é identificador, e identificador é em inglês.

- **2026-09-14 18:14** · **A Visão do harness ganhou redação nova**, escolhida pelo MJRP entre três
  candidatas avaliadas contra o teste de quatro perguntas desta página: *"Uma MJRP que sustenta a
  família com um portfólio de produtos de software concebidos por gente e construídos, operados e
  mantidos por agentes."* Substitui *"um sistema agêntico que entrega software — o MJRP SaaS"*,
  que era descrição de produto e migrou para o Objetivo. O que decidiu foi o teste 4 (*é desta
  organização?*): a nova nomeia MJRP e a família, amarrando no Propósito — trocar o nome quebra a
  frase, que é o que o teste pede.

- **2026-09-14 18:08** · **Correção do MJRP, e ela desfaz um erro meu:** eu tinha criado um campo
  `Definição (O QUE É)` para abrigar "o que o projeto é". Errado — *"é objetivo! é o what!"*.
  Produto e solução são **o que se entrega para alcançar a meta**, então moram no **Objetivo**;
  e o quarto campo volta a ser `Como (HOW)`, com o conteúdo que é de fato HOW: **o plano
  (`ROADMAP.md`) e a estratégia** — no MJRP, os dois modelos de negócio. A cadeia fecha em quatro
  elos sem campo extra: WHY · ONDE · WHAT · HOW.

- **2026-09-14 18:01** · **Entraram os dois vizinhos, os três modos de falha e o teste da visão**, a partir
  de uma crítica que o MJRP trouxe à revisão do `VISION.md`: a Visão estava misturada com produto
  (o MJRP SaaS), com fluxo operacional (o ciclo discovery → entrega) e com modelo de negócio
  (primário/secundário). A crítica acertou o diagnóstico da mistura; as duas primeiras correções
  foram aplicadas no `VISION.md` na hora. O **quarto teste** — *"é desta organização?"* — é
  acréscimo meu, e existe porque a redação inspiradora proposta junto com a crítica passava nos
  três primeiros e falhava nele.

- **2026-09-14 17:47** · **A cadeia foi declarada pelo MJRP** e ganhou página própria por
  indicação dele. Ela **inverte a hierarquia vigente**: até aqui o `VISION.md` tratava
  `Visão (WHY)` como raiz e `Propósito` como campo subordinado ("o que muda no dia a dia");
  a partir daqui o **Propósito é o WHY** e a **Visão é uma instanciação dele**. O gatilho foi o
  [BACKLOG #25], que pedia confirmar o Propósito do `VISION.md` e não fechava — a redefinição
  mostrou por quê.

## Related
[[vision-document]] · [[terms]] · [[project-profiles]]
