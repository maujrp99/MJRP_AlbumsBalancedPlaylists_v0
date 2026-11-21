---
title: Cânone de engenharia
aliases: [engineering-canon, canone, cânone, clean code, clean architecture, pragmatic programmer, refactoring, code smells]
summary: os quatro livros que fundamentam a Parte I do PRINCIPLES — destilados, com o que é universal separado do que é opinião de stack
tags: [harness, engenharia, kernel]
status: vivo
atualizado: 2026-10-25
fontes: [pragmatic-programmer, clean-code, clean-architecture, refactoring]
---
<!-- kernel do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O **cânone** é o corpo de referência que fundamenta os princípios de engenharia do MJRP: *The
Pragmatic Programmer* (Andrew Hunt e David Thomas), *Clean Code* e *Clean Architecture* (Robert
C. Martin) e *Refactoring* (Martin Fowler; ficha em `docs/wiki/sources/1999-fowler-refactoring.md`), que dá nome aos sinais de
código ruim e à refatoração que resolve cada um. O `PRINCIPLES.md` carrega **a regra e o teste**; esta página carrega **o porquê e o
detalhe**, lida por quem vai desenhar — não por toda sessão. Nem tudo aqui é universal, e o que
não é está marcado: ver § *O que é opinião de stack*.

## What it is

### Componentização

Modularizar não é estética: é o que permite trocar uma parte sem reabrir as outras. O design
pattern escolhido tem que **levar** a isso — se o padrão está no código e as partes continuam
grudadas, o padrão virou decoração.

- **REP — Reuse/Release Equivalence:** a granularidade do reúso é a granularidade do release.
- **CCP — Common Closure:** junte no mesmo componente o que muda pelos mesmos motivos e ao mesmo
  tempo. É o SRP no nível de componente.
- **CRP — Common Reuse:** não obrigue quem usa o componente a depender do que ele não usa.

**Quando extrair.** Um módulo ou componente novo se justifica quando **um** destes é verdade:

- a unidade tem **uma responsabilidade que dá para nomear** e testar sozinha;
- a mesma lógica aparece, ou vai aparecer, em **mais de um lugar** — o mesmo conhecimento, não só
  o mesmo texto (ver § ETC e DRY);
- o arquivo cresceu além do limite que a `constitution.md` do projeto fixa — é **sinal**, não
  regra: investigue qual responsabilidade sobrou (ver § Sinais e anti-padrões);
- quem lê o código ganharia com uma abstração com nome.

**Não extraia por especulação.** Espere o segundo uso ou uma fronteira clara. Abstração criada
para uma necessidade hipotética é *generalidade especulativa*, um dos sinais do Fowler.

### SRP e o Stepdown Rule

**Single Responsibility:** um módulo tem **uma razão para mudar** — ou seja, responde a **um
ator**. Não é "faz uma coisa só"; é "muda por causa de uma pessoa só".

**Stepdown Rule:** as instruções de uma função estão todas no mesmo nível de abstração. Misturar
"calcular o imposto" com "abrir o arquivo" na mesma função é o sintoma mais comum de God File em
formação.

### OCP — aberto para extensão, fechado para modificação

Comportamento novo **estende por composição**, não edita o que já funciona: um caso novo entra
como uma estratégia (`DP-04`), um adaptador (`DP-07`) ou um item de registro (`DP-16`) a mais, ligado à estrutura existente, em vez de
mais um ramo dentro da função que já passa nos testes. Não quer dizer "arquivo novo por padrão"
— criar arquivo sem fronteira clara é extrair por especulação. Quer dizer que o código que
funciona não precisa ser reaberto para o sistema crescer. Mexer no que existe continua certo
quando o comportamento é de fato daquela unidade, ou quando é bug.

### Dependency Rule e DIP

**A regra primária do Clean Architecture:** dependências de código-fonte apontam **estritamente
para dentro**, na direção das políticas de alto nível e da regra de negócio. O círculo interno
não sabe nada do externo — nada de framework, banco ou UI vazando para dentro.

**DIP:** política de alto nível não depende de detalhe; o código depende de **abstração**, não de
implementação concreta.

**Os três princípios de acoplamento entre componentes:**

- **ADP — Acyclic Dependencies:** nenhum ciclo no grafo de dependência entre componentes.
- **SDP — Stable Dependencies:** dependa na direção da estabilidade — o menos estável depende do
  mais estável, nunca o contrário.
- **SAP — Stable Abstractions:** um componente deve ser tão abstrato quanto é estável.

### Camadas concêntricas

| Camada | O que é dela |
|---|---|
| **Entities** | regra de negócio crítica da empresa, e os dados dela |
| **Use Cases** | regra de negócio da aplicação — orquestra as entidades para cumprir um objetivo |
| **Interface Adapters** | converte entre o formato do Use Case e o do agente externo |
| **Frameworks & Drivers** | UI, framework web, banco, dispositivo — o anel externo, isolado do núcleo |

### Padrões, com endereço

O padrão só serve se o próximo agente o reconhecer. Cada um em uso é declarado na
`constitution.md` do projeto com **onde mora** e **para quê**, citando o ID `DP-nn` do catálogo
em [[design-patterns]] — que descreve cada padrão, o sinal mínimo para usá-lo e quando não usar.
Padrão sem endereço é padrão que será reinventado.

**Isole o que pode mudar, na medida do problema.** Se uma dependência externa pode ser trocada,
simulada em teste ou substituída, ela fica encapsulada, e o padrão cresce com a complexidade:

```
separação simples em módulo
  → Adapter, DP-07 (embrulha uma preocupação externa)
    → Repository + Adapter, DP-01 (o acesso a dado fica atrás de uma interface)
      → Repository + Adapter + Facade, DP-11 (esconde várias dependências atrás de uma porta)
```

Use o **padrão mínimo que resolve o isolamento**. Repository com Facade num projeto de uma fonte de
dado só, estável, é generalidade especulativa.

**Exemplo — o SDK de terceiro.** Nenhuma chamada direta a SDK de fornecedor (Firebase, Stripe, a
API do Google) sai da camada de domínio ou de aplicação. O SDK mora num adaptador na borda, e a
aplicação o consome por uma interface dela. Trocar de fornecedor vira a mudança de **um arquivo**
— que é o teste do PRINCIPLES I.3.

### ETC e DRY

**ETC — Easier to Change:** o critério único de bom design. Diante de duas opções, a melhor é a
que deixa a mudança seguinte mais barata.

**DRY:** *"every piece of knowledge must have a single, unambiguous, authoritative representation
within a system"*. Note que é sobre **conhecimento**, não sobre texto: duas funções parecidas que
representam regras diferentes não são DRY violado.

### Nomes e funções

- **Nome revela intenção**, é buscável e pronunciável. Nada de desinformação nem de encoding
  ultrapassado (notação húngara, `m_`) — *isto é opinião de stack, ver abaixo*.
- **Funções pequenas**, que fazem **uma coisa**, bem, e só ela.
- **Comentário não compensa código ruim.** A intenção mora no próprio código. O comentário que
  vale é o que explica o **porquê** de uma escolha que surpreenderia quem lê — a restrição
  externa, o atalho deliberado, o bug do fornecedor contornado. Decisão estrutural não cabe em
  comentário: vira ADR.
- **Lei de Demeter:** fale com amigos, não com estranhos — um módulo não conhece o interior dos
  objetos que manipula.

### Regras de Kent Beck — design simples, em ordem de prioridade

1. **Passa todos os testes** — o sistema é testável.
2. **Sem duplicação.**
3. **Expressa a intenção.**
4. **Minimiza o número de elementos** (classes, métodos) — sem violar as três acima.

A ordem importa: quando duas brigam, a de cima ganha.

### Tratamento de erro

**O que é universal:** falha não é silenciosa. Todo erro é sinalizado por algum mecanismo, e
quem chama consegue distinguir sucesso de falha. Daí saem duas consequências que valem no front e
no back:

- **toda operação assíncrona tem o tratamento de erro escrito** — a promessa sem `catch`, o
  callback sem ramo de falha e o `catch` vazio são a mesma falha silenciosa;
- **quem usa recebe uma mensagem útil**, que diz o que aconteceu e o que fazer — nunca o stack
  trace, que é para o log.

**O que é opinião de stack:** *"use exceções em vez de códigos de retorno"* e *"não retorne
null"*. Valem em Java, C# e TypeScript; **não** valem em Go (que usa valores de erro por design)
nem em Rust (`Result`/`Option`), e em Apps Script `null` é idiomático. O projeto decide na
`constitution.md` dele — o princípio só exige que a falha **apareça**.

### Testes e TDD

**As três leis do TDD:** não escrever código de produção sem um teste falhando; escrever só o
suficiente do teste para falhar; escrever só o código necessário para passar.

**F.I.R.S.T.:** Fast · Independent · Repeatable · Self-Validating · Timely.

### Entropia e a regra do escoteiro

**Software Entropy / No Broken Windows:** código ruim, decisão ruim e design ruim se consertam
**na hora em que são descobertos**. Uma janela quebrada não consertada autoriza a segunda.

**Boy Scout Rule:** deixe o acampamento mais limpo do que o encontrou.

**Boiled Frogs:** mantenha consciência situacional — a mudança que mata é a gradual, a que não
dispara alarme em nenhum dia isolado.

**Stone Soup:** seja catalisador — comece pequeno e mostre, em vez de pedir permissão para o todo.

### The Cat Ate My Source Code

Responsabilidade plena pelas próprias ações, aprendizado e código. Quando o erro acontece, se
assume com honestidade e **no lugar da desculpa vem a opção acionável**. É o princípio mais fácil
de citar e o mais difícil de cumprir na hora.

### Good-Enough Software

Qualidade é **requisito**, e portanto é negociação com quem recebe: escopo, qualidade e prazo se
decidem juntos, e saber parar de refinar é parte do ofício. Não é desculpa para entregar torto —
é a recusa de refinar o que ninguém pediu enquanto o valor não chega.

### Fluxo de dados e estado

**O fluxo é unidirecional, explícito e está escrito no `arch.md`.** O dado sai da interação, passa
por cada camada na ordem do mapa, chega à fonte e volta pelo mesmo caminho. Atalho entre camadas
que o `arch.md` não mostra é camada improvisada — se o mapa não cobre o caso, o mapa muda antes, e
a mudança é uma decisão consciente.

- **Estado em fonte única.** O estado compartilhado mora num lugar só (store, contexto ou gerente
  de estado do servidor). Quem exibe **consome** o estado; não guarda cópia que ninguém vai
  sincronizar.
- **O derivado se calcula, não se guarda.** Total, filtro e contagem são calculados a partir da
  fonte (computed, memo), para não haver duas verdades.
- **Efeito colateral é explícito e mora na borda.** Chamada de API, log e escrita de cache ficam
  na camada de aplicação ou no adaptador — nunca na entidade de domínio nem no componente de
  apresentação. O componente que precisa de um efeito delega a um serviço (`DP-12`), hook ou composable (`DP-13`).

É a mesma ideia da Dependency Rule aplicada ao dado em movimento: quem lê o `arch.md` consegue
prever por onde uma mudança vai passar.

### Desempenho e custo

**Meça antes de otimizar.** Otimização sem medição troca clareza por um ganho que ninguém viu; o
Knuth chamou isso de raiz de todo mal, e o *Refactoring* insiste no mesmo — primeiro o código claro,
depois o perfil, depois o ajuste no ponto que o perfil mostrou.

**O custo de infraestrutura faz parte do design.** Consulta, chamada de API, armazenamento e token
de modelo custam dinheiro por uso. Quem constrói sabe quanto o que construiu vai custar para rodar,
e uma decisão que multiplica esse custo é tratada como decisão de arquitetura — escrita no
`arch.md`, com o motivo.

### Sinais e anti-padrões

**Um sinal é uma indicação na superfície que costuma corresponder a um problema mais fundo** — e
nem sempre é problema (Fowler, *Refactoring*). Por isso o sinal pede investigação, não
correção automática. O arquivo grande é o exemplo clássico: o limite da `constitution.md` é o
alarme, e a pergunta é qual responsabilidade sobrou ali.

| Sinal | Refatoração que costuma resolver |
|---|---|
| Várias árvores de `if/else` ou `switch` sobre o mesmo tipo | **Strategy** (`DP-04`) — cada ramo vira uma estratégia |
| Métodos sem relação entre si no mesmo módulo | **separar por responsabilidade** (SRP) |
| Lógica aninhada em vários níveis | **extrair funções com nome** (Stepdown Rule) |
| Setup repetido em testes ou em chamadas | **fixture ou factory** compartilhada |

**Anti-padrões universais** — valem em qualquer stack; a coluna da direita é o caminho de saída:

| Anti-padrão | Por que faz mal | Caminho |
|---|---|---|
| **God module / God component** | um arquivo faz tudo; impossível testar ou mudar com segurança | extrair por responsabilidade (SRP) |
| **Número ou texto mágico** | constante sem nome escondida na lógica | constante nomeada, num lugar só |
| **Framework na camada errada** | prende a regra de negócio a um fornecedor | mover para o adaptador; o domínio fica puro |
| **Efeito colateral implícito** | estado mudado às escondidas quebra a previsibilidade | tornar explícito e levar para a borda |
| **Herança por copiar e colar** | lógica duplicada que diverge com o tempo | extrair a abstração comum (DRY) |
| **Generalidade especulativa** | abstração para uma necessidade que não existe | construir para o que se precisa agora |
| **Shotgun surgery** | uma mudança obriga a mexer em N arquivos sem relação | juntar o comportamento num módulo coeso (CCP) |
| **Testar a implementação** | o teste quebra em refatoração que não mudou comportamento | testar o contrato público, não o interior |

A maior parte está também no capítulo 17 do *Clean Code* (*Smells and Heuristics*); os nomes
*shotgun surgery* e *speculative generality* são do Fowler.

### Comunicação e conhecimento — o que fica de fora do PRINCIPLES

*Knowledge Portfolio* (conhecimento é ativo que expira; invista, diversifique, questione com os
Cinco Porquês) e *Communicate!* (trate linguagem natural como código: conheça a audiência, escolha
o momento, ouça) são princípios do **profissional**, não do software. Ficam registrados aqui
porque fazem parte do cânone, mas não regulam ação sobre código — e por isso não subiram para o
`PRINCIPLES.md`.

## O que é opinião de stack

> **A regra de leitura:** o `PRINCIPLES.md` vale em Apps Script, Vue e Next.js igualmente. O que
> só vale em algumas linguagens é regra de projeto — mora na `constitution.md` dele, como delta
> ([[base-concept]], `PRINCIPLES.md` Parte III).

| O que o cânone diz | Por que não é universal |
|---|---|
| **Exceções em vez de códigos de retorno** | Go usa valores de erro por design; Rust usa `Result` |
| **Nunca retorne `null`** | em Apps Script é idiomático; em Kotlin e TS o tipo já resolve |
| **LSP e ISP** | pressupõem subtipo e interface — não têm objeto em código funcional (React, Composition API) |
| **Minimize classes e métodos** | escrito para OO; num projeto funcional a unidade não é a classe |
| **Notação húngara, `m_`** | datado, específico de C++/Java antigo |
| **Limite de 300 linhas por arquivo** | número é da `constitution.md` do projeto, não do harness |
| **Um export por arquivo** | convenção de módulo de JS/TS; em Apps Script tudo é global, em Go o pacote é a unidade |
| **Tipar tudo, sem `any`** | vale onde há tipagem opcional (TS); em JS puro ou Apps Script a regra é outra — a `constitution.md` do projeto diz qual |

## How MJRP uses it

- **Esta página é do kernel** — vai carimbada para dentro de todo projeto em
  `docs/wiki/harness/`, junto com as outras do pacote básico, e o I5 do `doctor` confere que
  chegou e que o carimbo não envelheceu.
- **Lê-se sob demanda, não por sessão.** Quem vai desenhar arquitetura ou revisar um PR abre;
  quem vai corrigir um texto, não. É o `PRINCIPLES.md` que toda sessão carrega.
- **Quando o cânone e o projeto discordarem, o projeto decide** — desde que a decisão esteja
  escrita na `constitution.md` dele, e desde que ela não contrarie um princípio da Parte I.

## History

> A decisão mora na página do assunto que ela muda, com data (ADR-0008).
- **2026-10-25 22:41** · **O cânone deixa de descrever padrões; a página [[design-patterns]] os descreve.** A lista de padrões do
  § *Padrões, com endereço*, a escada de isolamento, o OCP, o § *Fluxo de dados e estado* e a tabela de sinais nomeavam e explicavam
  Repository, Service, Strategy, Adapter, Facade e Composable → citam o ID `DP-nn` e apontam para a página (decisão do MJRP,
  22:26: a página foi destilada com problema, sinal mínimo, quando não usar, teste e endereço; o sentido de nenhum princípio
  mudou, saiu só a repetição; F77 TASK-03).
- **2026-09-27** · **O conteúdo de engenharia da `mjrp-dev` vem para cá, e o *Refactoring* entra
  como quarta fonte.** Ao avaliar a `mjrp-dev`, o MJRP pediu para não perder o conteúdo de
  engenharia dela e para não repeti-lo. O que era **conhecimento** subiu para o cânone: *Quando
  extrair*, OCP, a escada de isolamento com o exemplo do SDK, a nuance do comentário, erro em
  operação assíncrona e mensagem ao usuário, e três seções novas — *Fluxo de dados e estado*,
  *Desempenho e custo* e *Sinais e anti-padrões*. Duas linhas foram para a opinião de stack. A
  skill ficou com o procedimento e aponta para cá. **Decisões dele:** o *Refactoring* (Fowler)
  vira a quarta fonte, com ficha em `docs/sources/`; segredo no código vira o princípio I.14.
  Proposta em `design/proposals/dev-skill-content-reorg-proposal.md`.
- **2026-09-16** · **A página nasce do desmembramento do `PRINCIPLES.md`.** O MJRP reescreveu a
  parte de engenharia trazendo os três livros por inteiro — o arquivo foi de 117 para 172 linhas
  e de 6.960 para 12.895 caracteres. O conteúdo era bom; o lugar, não: o `PRINCIPLES.md` é
  herdado por todo projeto e lido em toda sessão. **A decisão dele:** os princípios ficam lá, com
  o teste de cada um, e o cânone vem para cá — *"progressive disclosure aplicado ao próprio
  harness"*. Junto veio a marcação do que é **opinião de stack**, que a versão anterior misturava
  com o universal. Entra no **kernel**, por decisão dele no mesmo turno.

## Related
[[base-concept]] · [[terms]] · [[doctor]] · [[harness-elements]] · [[adr-practice]] · [[design-patterns]]
