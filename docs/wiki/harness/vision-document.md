---
title: Documento de visão
aliases: [documento-de-visao, VISION.md, vision]
summary: o que entra num documento de visão, o que não entra, e o teste que separa os dois
tags: [harness, documentacao, memoria]
status: firme
atualizado: 2026-10-09
fontes: [productplan-vision-vs-strategy, productcompass-vision-strategy-goals]
---
<!-- kernel do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O documento que responde **por que este projeto existe e onde ele quer chegar**. Estado, medição, configuração e ordem de execução moram em outros lugares e são apontados daqui.

## What it is

O mercado separa quatro coisas que costumam virar um documento só:

| | Responde | Horizonte | Onde mora no MJRP |
|---|---|---|---|
| **Propósito** | por quê — a razão de ser | sem prazo | `VISION.md` |
| **Visão** | onde se quer chegar | anos; pode nunca ser atingida | `VISION.md` |
| **Estratégia** | onde jogar e como ganhar | meses a um ano | `VISION.md` (escopo, princípios) |
| **Roadmap** | em que ordem, com que prova | meses | `ROADMAP.md` |
| **Estado** | onde estamos agora | dias | `MEMORY.md` |

A visão é **deliberadamente vaga em tática** — é isso que permite pivotar sem reescrever a
identidade. Uma visão que nomeia ferramenta, número ou fase envelhece na velocidade da tática, e
aí ninguém confia nela para decidir nada.


## O template

Quatro campos, nesta ordem, em **todo** `VISION.md` do MJRP — declarado no topo do próprio
documento e ensinado pela `mjrp-coaching-pm` (dona do modelo e do guia; a `mjrp-pdlc-bootstrap` só cria o esqueleto):

| Campo | Responde | Horizonte | Tamanho |
|---|---|---|---|
| **Propósito (WHY)** | a razão de ser — a necessidade que se quer resolver | sem prazo | **concisa e clara**, sem limite de frases |
| **Visão (WHERE)** | o horizonte a alcançar — uma instanciação do propósito | longo prazo | **concisa e clara**, sem limite de frases |
| **Objetivo (WHAT)** | a meta que leva à visão, e **o que se entrega** para chegar lá — o único lugar onde stack pode aparecer; inclui **as funções do produto** (ex.: informar, ajudar a decidir, agir), a que cada item do inventário do protótipo se liga | curto a médio prazo | o corpo do documento, conciso e claro |
| **Como (HOW)** | o plano e a estratégia que sustentam o objetivo | curto a médio prazo | ponteiro + estratégia, concisa e clara |

Os quatro campos são os quatro elos da **cadeia de intenção** ([[base-concept]]). **O plano não é
resumido aqui:** o `Como (HOW)` aponta para o `ROADMAP.md` e carrega a estratégia — no MJRP, os
dois modelos de negócio.

Projetos com UI acrescentam `Vibe` e `Design DNA` **depois** do `Como`. Eles complementam a
visão; não a substituem.

**A regra que dá sentido ao template:** *Propósito*, *Visão* e *Objetivo* são **citados como
estão**, não resumidos. São os três campos que um agente reproduz quando perguntam "por que este
projeto existe, onde ele quer chegar e qual a meta?", e o *Propósito* é a primeira frase de toda
síntese de `mjrp-pdlc-onboarding` — quem mexe no específico sem saber para que o todo serve quebra
invariante sem perceber. Um campo que precisa de paráfrase para fazer sentido sozinho não está pronto.

## How MJRP uses it

O `VISION.md` guarda: identidade e nome · objetivo último · os dois modelos de negócio ·
definição do que o harness é ·. E aponta para: `ROADMAP.md` (ordem),
`docs/wiki/` (termos), `MEMORY.md` (estado),
`docs/decisions/` (por que se decidiu).

**Sensor possível, ainda sem incidente:** uma checagem que reprova número absoluto e nome de
ferramenta no `VISION.md`. Fica candidata pelo critério da ADR-0002 do harness — entra quando o drift
custar uma sessão.

## History

- **2026-10-29 19:10** · **Nenhum dos quatro campos tem limite de frase.** O MJRP: «não tem essa constraint de uma frase e uma sentença, isso é bem ruim e limitante. Ser conciso e claro é importante, mas regra especifica de uma frase nao» e «isso serve para tudo, proposito, visao, objetivo, como». A coluna *Tamanho* passa a dizer o critério único — conciso e claro, do tamanho que a ideia pedir. O limite de «1 frase» veio com o modelo que o agente escreveu, não de decisão dele (UAT-408, F126).
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: o *Objetivo* do template passa a incluir as funções do produto (informar, ajudar a decidir, agir), onde cada item do inventário do protótipo termina; o link quebrado do `MEMORY.md` foi corrigido; as ADRs citadas passam a dizer "do harness", em texto.

> A decisão mora na página do assunto que ela muda, com data (ADR-0008). As entradas abaixo
> vieram **inteiras** do `MEMORY.md` na migração do BACKLOG #28a (09/09/2026) — nada foi
> condensado na mudança.
- **2026-09-14 17:52** · **O template passou a seguir a cadeia de intenção** ([[base-concept]]), declarada
  pelo MJRP. Inverte o que valia desde 08/09: o **WHY é o Propósito**, e a **Visão** passa a ser
  uma instanciação dele — o ONDE. O que era `Propósito` ("o que muda no dia a dia") era, pela
  cadeia, um **Objetivo**; e o horizonte que morava dentro do `Objetivo (WHAT)` era a **Visão**.
  `Como (HOW)` fica, com conteúdo novo — plano e estratégia; o que ele descrevia (o que o projeto
  é) subiu para o **Objetivo**, por correção do MJRP no mesmo dia. Com isso, a
  síntese do onboarding deixa de abrir pela Visão e passa a abrir pelo **Propósito**. O `VISION.md`
  do harness foi recolocado na hora (o anterior está em `_archive/VISION-2026-09-14-pre-cadeia.md`);
  a propagação para `mjrp-project-bootstrap`, `mjrp-onboarding` e `new_project.py` ficou pendente.
  O campo `Definição (O QUE É)`, que cheguei a criar, foi descartado por ele: produto e solução
  são **Objetivo**, não campo próprio.

- **2026-09-11 10:45** · **O documento de visão passou a declarar o próprio template**, e o
  template chegou à `mjrp-project-bootstrap`. O gatilho foi um teste de onboarding: o MJRP
  perguntou *"qual a visão e qual o objetivo?"*, o agente respondeu com dois campos rotulados
  — *Visão (WHY)* e *Objetivo (WHAT)* — e ele reconheceu ali **exatamente** o que queria que
  fosse carregado. Uma saída só é reproduzível se a fonte tiver a forma dela: os quatro campos
  viraram o esqueleto, com a regra de que Visão e Objetivo se citam como estão. Achado junto: o
  guia da `bootstrap` ensinava `Core Objective / The Vibe / User Empathy / Design DNA` — **sem
  nenhum campo de visão**. Todo `VISION.md` nascido dele começava sem propósito declarado, e foi
  de lá que saiu o *"Vibe:"* que abriu a síntese do Album Blender V1. Vibe e Design DNA
  continuam, como seção opcional depois do `Como`.

- **2026-09-07** · Documento de visão **não carrega explicação, definição nem governança**.
  Foi o critério da revisão à mão; gerou 8 recortes.
- **2026-09-07** · Os princípios saíram do VISION para o **`PRINCIPLES.md`**.
- **2026-09-07** · O glossário **fica** no VISION por ora; só o aviso meta saiu.
- **2026-09-08 17:57** · O Zé escreveu a **Visão MJRP** de verdade — *"a família MJRP com a vida facilitada e
  sustentada financeiramente por um sistema agêntico"* — e um **Propósito** (retomar sem atrito,
  finalizar com critérios de saída, erro pego e corrigido por mecanismo). O purpose que estava
  "para depois" chegou.
- **2026-09-08 16:55** · **O Zé reestruturou o VISION à mão: WHY → WHAT → HOW** (Visão · Objetivo · Como). O
  "O que muda quando existe" subiu e virou Objetivo; a Definição desceu e virou Como. O teste de
  fronteira que eu tinha escrito **saiu** — com esses títulos, ele era redundante e meta.
- **2026-09-08 15:43** · **Purpose não é lista de dores.** Propósito é singular e olha para frente; dor é
  plural e olha para trás. As quatro dores viraram `docs/wiki/recurring-pains.md`; o VISION
  fica sem seção Purpose até escrevermos uma de verdade. *(Observação minha: depois da unificação,
  o §"O que muda quando existe" já ocupa o lugar funcional do purpose.)*
- **2026-09-08 14:53** · O **"Pré-requisito de modelo"** (capacidade serrilhada) sai do VISION e vai para os
  **riscos do CHARTER**: é dependência externa fora do nosso controle.
- **2026-09-08 14:53** · **"Ele decide por você" sai sem substituto.** O harness não decide *por* ninguém —
  ele **é** o que foi decidido; e "obedecido", na frase anterior, já carrega o inegociável.
  Minha substituição de "opinado" ficou pior que o problema.
- **2026-09-08 14:24** · "Opinado" sai: dizer *o que* a opinião é vale mais que declarar que ela existe —
  "decide por você onde cada coisa mora e o que não é negociável".
- **2026-09-08 14:24** · "As onze peças" no VISION vira **ponteiro** para `docs/wiki/`.
- **2026-09-08** · O **charter saiu do VISION** e foi para `_initial-brainstorm/CHARTER.md` — não
  a raiz. Não é documento vivo: é o que estava na visão e não era visão. VISION ficou com 174
  linhas. *(Padrão: o que sai do VISION vai para o brainstorm, salvo ordem em contrário — os
  princípios foram a exceção, viraram `PRINCIPLES.md` porque ele mandou.)*

## Related
[[base-concept]] · contrato · tools · inegociáveis · ADR-0003 do harness (`docs/decisions/`)
