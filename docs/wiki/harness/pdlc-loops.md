---
title: PDLC em loops — Intake, Discovery, Design, Delivery, Release, Learn
aliases: [pdlc-loops, PDLC, ciclo de vida, lifecycle, loops do PDLC, Intake, triagem, vias, via padrão, via rápida, standard lane, fast lane, Discovery loop, Design loop, Delivery loop, Release loop, Learn loop, Pronto para construir, Ready to build, escalada, integrador, Aceite]
summary: o ciclo de vida do produto no MJRP como uma fundação e cinco loops — Intake com duas vias (padrão e rápida), Discovery (o que construir), Design (a tela e a descrição dela, com o portão Pronto para construir como saída), Delivery em SDD com executor, juiz e integrador (construir certo), Release (Homologação, Aceito e Deploy) e Learn (deu certo?) —, cada um com critério de saída, verificador e regras de parada; o humano na intenção, no aceite do que há para ele ver, decidir ou de segurança e no risco de negócio
tags: [kernel, pdlc, loop, discovery, delivery, processo]
status: em formação
atualizado: 2026-11-01
fontes: [kernel/ways-of-working/product-discovery, kernel/ways-of-working/loop-engineering-concept, kernel/design/sketch-vs-prototype, kernel/roadmap/requirements-graph, wiki/sources/2026-10-07-mjrp-product-discovery-handbook.md, wiki/sources/2026-10-07-mjrp-loop-engineering-handbook.md, wiki/sources/2026-10-07-mjrp-agentic-ai-handbook.md]
---
<!-- kernel do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

# PDLC em loops — Intake, Discovery, Design, Delivery, Release, Learn

> Kernel · página de processo · criada 2026-10-07 · nasce da proposta `design/proposals/pdlc-loop-engineering-proposal.md`
> (decisões do MJRP de 2026-10-07, 18:02 a 18:30) · **o diagrama é um só, o do card «O ciclo de vida» do Overview do Control Center**
> (fonte: `design/diagrams/ways-of-working/2026-11-08-1135-pdlc-loops-v14.svg`, aprovado pelo MJRP em 2026-11-08; o v13, de 2026-10-30, dizia que a via rápida pula as fases) — esta página tem as regras;
> o desenho, as etapas e os papéis no card · substitui a numeração de fases (0 · 1a · 1b · 2 · 2→3 · 3 · 4 · 5), que as skills ainda
> usam até migrarem — a §11 traduz.

## Definition

O **PDLC do MJRP** é uma **fundação** e **cinco loops** — **Discovery** (o que construir), **Design** (como a tela e a descrição dela
ficam), **Delivery** (construir certo), **Release** (a versão chega a quem usa) e **Learn** (deu certo?) — alimentados por uma porta de
entrada única, o **Intake**, que põe cada demanda numa de duas **vias** (a **padrão** e a **rápida**, que comprime a Discovery e o Design, não os pula). A
saída do Design é um portão, o **Pronto para construir**. Cada loop tem um critério de saída, um verificador e regras de parada; o humano
entra onde a intenção é definida, no aceite do que há para ele ver, decidir ou de segurança e onde há risco de impacto financeiro ou de
negócio. Discovery, Design e Delivery andam **ao mesmo tempo, em itens diferentes** (a trilha dupla), e uma volta fina leva o trabalho
ao loop anterior quando se aprende algo. Cada papel é uma vaga: hoje uma skill, amanhã um agente.

## 0. Como ler

- **Fase não é portão definitivo; é uma volta** (`PRINCIPLES.md` II.10). Qualquer loop pode devolver trabalho a outro.
- **Toda demanda entra pelo Intake** — inclusive o que volta da Homologação, dos sensores e do Learn. Nenhum loop recebe
  trabalho por fora.
- **O que decide se um loop continua é o harness, não o auto-relato do agente** (II.3): o verificador passa ou não, e as
  regras de parada cortam o resto.
- **Os loops andam juntos, em itens diferentes.** Um item está em um loop de cada vez, mas Discovery, Design e Delivery rodam ao mesmo
  tempo (a trilha dupla); a seta fina de volta leva ao loop anterior quando o item aprende algo («aprendeu algo? volta»).
- **"A maioria das tarefas ainda não precisa de um loop"** (Garage Labs): o Discovery e o Design são interativos; o Delivery é
  goal-based; o Learn roda agendado. O processo não força autonomia onde não há verificador.

## 1. Fundação — o ambiente dos loops

Não é fase: é onde os loops rodam, montada uma vez (`mjrp-pdlc-bootstrap`) e revista quando muda.

| Peça | Onde mora |
|---|---|
| Contrato | `.mjrp-project.yml` (formato dos requisitos, `gates:`, sensores, stack) |
| Intenção | `VISION.md`, `PRINCIPLES.md`, `constitution.md` |
| Guias | kernel e skills |
| Sensores | `doctor.py`, sensores do contrato, `daily-checks/` |
| Arquitetura | `arch.md`, `data-model.md` (ADR aceita pelo humano depois da crítica sem P0), `design-system.md` — quando prontos, a via rápida pode confiar neles |

A fundação não produz a arquitetura: o esqueleto (`arch.md`, `data-model.md`) nasce no fim do Discovery · Enquadrar
(§3), e o `design-system.md` no Desenhar. Daí em diante eles moram aqui, e cada Plan os refina.

## 2. Intake — a porta de entrada e as duas vias

**Intake** é a triagem: receber a demanda, qualificar (vale a pena? serve a qual resultado do `ROADMAP.md`?), escolher a
via — ou rejeitar com motivo. Entra: pedido ou mudança do humano, requisito novo, issue da Homologação (Bug, Melhoria ou Tech debt), achado de sensor,
aprendizado do Learn. Mora no `prd.md` de cada projeto (§ *Candidatos*) e na entrada do log da triagem. No sentido amplo,
Intake é a pré-venda (captar a oportunidade, estimar, mandar proposta) — vale quando houver cliente; hoje é a triagem.

| Via | Quando | Caminho |
|---|---|---|
| **Padrão** | resultado novo ou feature nova | a Discovery antes, **do tamanho da novidade** (explorar, enquadrar e desenhar, ou só o que falta) → Pronto para construir → Delivery |
| **Rápida** | mudança, criar ou atualizar, que o humano quer ver na hora; inclui o conserto de defeito | brief → (**Quick Prototype**, só se o humano pedir) → issue no board → execução → **o humano valida olhando** → documentos depois |

Não há mais quatro trilhas, Fast track, quick fix nem a distinção Full × Standard (decisão do MJRP, 2026-10-24: «fundir a fix
com fast lane» e dois caminhos). Não confundir com as duas **trilhas de issue**, Humano e Agente (§6).

**A via rápida não pula a Discovery e o Design: comprime os dois e agiliza o processo completo, eliminando etapas** (decisão do MJRP,
2026-11-08 10:57, que reescreve a de 2026-10-24 11:19 e 11:23). O pedido vira um brief e vai à Delivery. Quando o humano pede, antes vem um
**Quick Prototype** direto, sem rodada de perguntas e sem juiz agente: ele julga olhando. Depois vêm os documentos. O Quick Prototype é
decisão dele: pede ou não pede, e o brief registra a resposta. Serve para fazer uma mudança de forma ágil, e o humano a valida olhando a tela. **O juiz é o humano** na trilha Humano, ou a reconferência independente na trilha Agente — a via não tem juiz
agente próprio. Os cinco passos: (1) o brief, o da `mjrp-structuring-requests`; (2) a issue no board — uma task ou feature
quando o pedido é melhoria, uma issue do `uat.md` só quando é defeito ou mudança achada ao usar — a feature **nasce do molde, por
`new_feature.py`**, nunca à mão; (3) a execução, precedida do Quick Prototype quando o humano o pediu; (4) a validação dele olhando; (5) os documentos, atualizados
**retroativamente**, e a `mjrp-ensuring-sdd` **chamada no fecho**. O protótipo não é passo retroativo: quando existe, vem antes da Delivery.
**O OK dele é o veredito visual do merge** (F61): o ramo cujas features mudadas são todas `lane: fast` e que mudou tela sem
relatório de reconferência faz o próprio `pre-merge-commit` pedir o **Touch ID dele** — a mesma prova de presença do Aceite
(`~/.mjrp/control-center/bin/presence`, CC-ADR-0031), num diálogo que nomeia as features, o ramo e o tip. Com o dedo o merge entra;
cancelado, expirado (35 s, dentro do prazo do `merge_train.py`) ou sem Touch ID na máquina, não entra. Ninguém escreve o OK: o portão o pede ao vivo e só depois o
anota para auditoria (`git notes --ref=mjrp-visual-ok show <tip>`), sem nunca ler essa nota (quem a lê é a trava do passo retroativo, para dar por cumprida a linha da reconferência visual: F154; e o board, para pôr em «Feito» a feature da via rápida da trilha Humano com a construção feita: F151). O relatório `who_judged: human` — o OK do
chat que um agente transcrevia (2026-10-26 a 29) — não vale mais como veredito. Na trilha Agente, a reconferência independente escreve
o relatório e o dedo não é pedido; o ramo que também leva feature da via padrão segue pedindo o relatório.

**O humano é o juiz final** (decisão do MJRP de 2026-11-03 23:42: «só se eu pedir juiz sobre minha aprovação»; a feature F171, a do humano como juiz final, e a issue UAT-477 a levam ao kernel). Uma aprovação dele — protótipo, documento, tela ou texto — fecha o julgamento do que ele aprovou: nenhum juiz ou auditor roda sobre ela, e o agente nem a oferece, a não ser que ele peça. Vale em toda via e em todo juiz; as skills de juiz e a do integrador repetem a regra na seção de restrições. Continuam valendo os testes, os sensores, o Touch ID do merge, o passo retroativo, e o juiz do lote e a reconferência visual, que julgam o build contra o que ele aprovou, não a aprovação dele. Por isso o portão visual da via rápida não pede relatório de juiz: o veredito visual já é o Touch ID dele; o relatório só é pedido na trilha Agente e na via padrão.

**Três salvaguardas** (aceitas por ele): o passo retroativo é **obrigatório e cobrado por sensor** — o `sdd_shape_check.py` recusa, no
`pre-commit`, a feature que vai a `Done` sem as seções obrigatórias dos moldes do SDD (a aberta só avisa; F95); os testes e os sensores
valem, sem exceção; **quem pede a via rápida é ele** — nunca o agente, para poupar os portões. A diferença para a padrão é a
ordem: na padrão a documentação completa e o protótipo vêm **antes**; na rápida o Quick Prototype, se ele pediu, vem antes da Delivery, e **só os documentos vêm depois**.

**A pequena mudança de texto não entra em via nenhuma** (decisão do MJRP, 2026-11-01; F158, S-208). Ela é uma issue de `Tipo` `copy` no `uat.md`: sem feature, sem brief e sem a «Priorizada», vai direto a «Em andamento» (`fixing`, sem feature, só nesse tipo), e o integrador a faz direto na `main`. Feita, vai à coluna de pronto, e só o OK do humano a fecha, mesmo a que um agente abriu. O juiz do atalho é a trava `copy_change_check.py` no `pre-commit`: na `main`, o commit dessa issue só toca `content/copy/*.json`, o `uat.md` e o log, e dentro do JSON só o texto de entradas que existem, com os mesmos marcadores e até 10 entradas. Só uma linha nova nasce `copy`. O que não couber nisso segue por um ramo, na via que lhe cabe.

### 2.1 O passo retroativo da via rápida — o que atualiza e como fecha

Na via rápida o código vem antes dos documentos (o Quick Prototype, quando o humano o pediu, vem antes de tudo e não faz parte deste passo); o passo retroativo os traz ao que foi construído **depois do aceite do juiz e antes
de o ramo ir ao integrador**, no próprio ramo. Sem ele a próxima sessão julga a tela contra a regra antiga e desfaz o que o humano
aprovou. O dono é a `mjrp-syncing-docs` (§ *the fast lane's retroactive step*); a feature só fecha com ele feito.

**O que ele atualiza** está num lugar só: o registro `mjrp-scripts/artifacts.json` — o campo `retro` de cada artefato, `always`,
`if` (com a condição em `retro_text`) ou `never` — e a página gerada dele, pdlc-artifact-map, na coluna «Retroativo» («■ entra»,
«◩ só se <condição>», «□ não entra»). Esta página não repete a lista: uma fonte só. **Como se aplica:** percorrer o mapa linha a linha,
fazer toda linha «entra» e toda «só se» cuja condição vale para a feature; os documentos que descrevem o sistema (`arch.md`,
`data-model.md`, `tech-stack.md`, `constitution.md`, `design-system.md`, `behavior.md`, a página da wiki do assunto) se declaram um a um no
`plan.md` § Documents Consulted — «atualizado» ou «sem mudança» —, porque é a declaração que a máquina confere.

**Quem cobra: a máquina** (F101, S-186). Cada linha do registro que o passo toca diz em `retro_check` como se confere — a marca de
esboço (`sketch`), a forma dos moldes (`sdd`, `tasks`), o nó do requisito (`requirement`: `delivered_by`, `points_to`, os critérios),
um caminho tocado por commit da feature (`touched`: o log do projeto dono, o `## Now` do app), a declaração no `plan.md`
(`declared`), a tela (`screen`: protótipo, wireframes, info-arch, reconferência), a issue (`fixes`: a `uat.md` tocada; num conserto,
a issue `fixed (Fxx: …)` com a evidência). Um conserto sem nó importado (`solution_type: fix`, `imports: []`) entrega a issue, não uma
story: as linhas do requisito não se aplicam a ele e saem como «não se aplica» (F111, UAT-385); o que nenhuma máquina sabe se
valeu fica `judgement`, e o que outro sensor confere, `sensor`. O `mjrp-scripts/retro_step_check.py` lê isso e **recusa no
`pre-commit`** o commit que leva a feature `lane: fast` a `Done` sem uma linha, com o que falta e como sanar, e o
`merge_train.py merge` **recusa o ramo** com a mesma regra antes de o merge começar. O registro vale o da cópia de antes (HEAD, a
`main`): um commit não afrouxa a própria trava. O `artifact_map.py --check` recusa a linha «entra» sem `retro_check` e roda, com o
mapa das skills, no `pre-commit` e no doctor (o sensor do catálogo). Seguem valendo o `sdd_shape_check.py` (a forma, F95) e o
`pdlc_vocabulary_check.py` (no doctor e no CI, depois do merge). **Não conferir não é aprovar** (F182, UAT-489): se uma feature da via rápida vai a Done e a trava não consegue julgar
(sem o `artifacts.json`, sem os moldes do SDD, ou sem o próprio script), o `retro_step_check.py` e o `sdd_shape_check.py` saem 2, o
`pre-commit` e o `merge_train.py merge` recusam, e o refresh do kernel entrega ao filho o registro e os moldes.

**O fechamento da sessão.** O passo retroativo fecha a **feature**; o save context (`mjrp-saving-context`) fecha a **sessão de
página**: nada sem commit, a entrada de fechamento no log do projeto dono com `Session:` e o `Branch: <ramo>` da sessão, o lease liberado, o `## Now` do app em dia,
nada em segundo plano. O integrador só arquiva uma sessão de página com os dois feitos (o MJRP, 2026-10-27 09:52), e a máquina
confere: `merge_train.py session-check <worktree>` sai 0 «pode arquivar» ou 1 com a lista; vermelho, não arquiva
(F101). A sessão roda o mesmo antes de dizer que o ramo está pronto, sem esperar mensagem do integrador.

## 3. Os loops Discovery e Design — o que construir e como fica

Interativos; o avaliador é o humano, com o juiz de UX. Pelas fontes de produto (Cagan, Torres, Perri, Olsen), descobrir e desenhar são
da mesma família, mas **cada um é um loop**, com a sua volta e o seu critério de saída (decisão do MJRP, 2026-10-30; antes, o
Desenhar era a terceira etapa da Discovery).

### 3.1 Loop Discovery — Explorar ⇄ Enquadrar

1. **Explorar** — prototipação rápida, ligada por padrão, pode pular ([[sketch-vs-prototype]]). Saída: `design/inception/`
   vN, `inception-notes.md` e, na mesma rodada, a descrição da tela (texto, inventário com o wireframe em
   `design/wireframes/`, `info-arch.md`). **A tela e a descrição dela são uma atividade só**, de uma dona só
   (`mjrp-designing-ui`) — não etapas em sequência. Todo commit que traz versão nova em `design/inception/` traz junto o
   `info-arch.md` e os wireframes de todas as telas da versão (hook `commit-msg`, doctor W14).
2. **Enquadrar** — Rapid × Full ([[product-discovery]]): problema, resultado e medida, os quatro riscos como teste, a
   premissa mais arriscada, **pivotar** · iterar · avançar. **A entrada principal é o protótipo aprovado e o seu inventário**; cada item termina numa **função do produto**
   (declarada no `VISION.md`: informar, ajudar a decidir, agir…) ou num **resultado** — informação é produto mesmo sem
   mover resultado —, ou é cortado com motivo. **No fim do Enquadrar, a arquitetura:** ADR `Proposed` + esqueletos
   (`arch.md`, `data-model.md`) por `mjrp-designing-architecture` → crítica (`mjrp-critiquing-architecture`, troca de
   chapéu declarada ou agente separado; critérios em [[architecture-review]]; relatório em `reports/audits/`) → sem P0, o
   tech lead aceita a ADR técnica; a que decide produto, dinheiro ou segurança vai ao humano.

O Explorar e o Enquadrar giram juntos até a ideia estar pronta: o rodapé do loop é **↻ pivotar · iterar · avançar**.

**Saída:** o problema, o resultado e a medida, a premissa mais arriscada decidida (avançar, iterar ou pivotar) e a arquitetura
enquadrada e julgada. **Verificador:** o humano e o crítico de arquitetura (LLM de apoio, nunca juiz único) + o sensor do grafo.

### 3.2 Loop Design — Desenhar → Criticar → Ver na tela

3. **Desenhar** — a tela e a descrição dela convergem juntas (`info-arch.md`, com o inventário completo e as lacunas) ·
   o sistema visual (`design-system.md`), aplicado quando a estrutura assentou · o protótipo (`design/prototypes/`).
4. **Criticar** — a auditoria de UX sem P0 (`mjrp-critiquing-ux-ui`, passada separada da que desenhou): o protótipo julgado.
5. **Ver na tela** — o humano vê o protótipo rodando e reage; o que ele acha volta ao Desenhar.

**Uma volta por versão do protótipo:** o Design gira Desenhar → Criticar → Ver na tela a cada versão, até o humano aprovar. Se o
que se aprende pede outro problema ou outra arquitetura, a seta fina volta à Discovery.

O Discovery e o Design são **do tamanho da novidade** na via padrão: um resultado novo percorre os dois loops inteiros; uma feature
nova num resultado que já existe faz só o que falta (explorar liga por padrão e pode pular).

**Saída:** requisitos Ready que cobrem o inventário do protótipo — todo item com destino (coberto, evoluído, cortado com
motivo) — e, quando há UI, o `design-system.md` com a identidade que o protótipo aprovado usa; a saída passa pelo portão
**Pronto para construir** (§4). **Verificador:** o humano, o juiz de UX (LLM de apoio, nunca juiz único) + os sensores do
inventário (W11), do protótipo × info-arch × wireframes (W14, `commit-msg`), do grafo e do sistema visual.

## 4. O portão «Pronto para construir» — a saída do Design

Entre o Design e o Delivery há um **portão, não uma etapa de trabalho**, e ele é a **saída do Design** (decisão do MJRP, 2026-10-24: o nome «Pronto para
construir» substitui «contrato»): a aprovação dos requisitos Ready, com os critérios apontando para estados julgados. É a
decisão de intenção do humano — um erro aqui o loop repete dezenas de vezes antes de alguém ver. Aprovar a spec e as tasks é
**opção do contrato do projeto** (o `.mjrp-project.yml`, `gates:`), não padrão. A via rápida não passa por ele: o humano já
está olhando a tela.

**O portão Design → Delivery, por story.** Uma story Ready só entra em Delivery se o Control Center consegue
colocá-la: o `epic:` dela é um épico do PRD e o `planned_for:` **dela** é uma release do `ROADMAP.md` (o atalho do épico
não chega ao Board). O juiz é o `product_structure_check.py --story <arquivo>` (o comando está na `mjrp-pdlc`; seleciona as lacunas por `code`, caminho que não existe é exit 2); com
lacuna, a story volta à dona — e qual release é decisão do humano, na aprovação. Num `code-app`, a release é parte do
contrato do projeto: o Ready já nasce com ela (`mjrp-writing-reqs`).

## 5. Loop Delivery — construir certo, por feature

Goal-based (nível 2 da escada da Anthropic); o verificador é determinístico. É o **SDD** (spec → plan → tasks → executar ⇄
verificar), com três papéis de agente: o **executor** faz a task (`mjrp-implementing-tasks`, `mjrp-debugging`), o **juiz** confere
sem ter feito (`mjrp-ensuring-quality`, `mjrp-ensuring-sdd`, e o crítico no portão do marco) e o **integrador** junta o ramo na
`main`. Os papéis e as skills de cada um estão no card do Overview e na §8.

- **O que é uma feature** (decisão do MJRP, 2026-10-17, depois de a F01 do fin-control sair com o MVP inteiro: 39
  stories): **a menor fatia vertical que entrega valor observável a quem usa, cabe numa rodada de execução e verificação
  e se confirma com uma verificação só.** *Vertical* corta todas as camadas que a pessoa atravessa (não "o banco" nem "a
  tela"); *observável* é algo que ela vê ou faz; *uma rodada* é o que o laço fecha dentro do teto de rodadas por task; *uma
  verificação só* é um aceite que diz sim ou não ao todo. **Três sinais de tamanho — avisos, nunca reprovam** (o
  `product_structure_check.py` os imprime; a decisão de partir é do humano): mais de ~8 stories importadas, stories de
  3 ou mais épicos, mais de ~12 tasks. Quem passa de um sinal explica por que mantém ou parte; quem parte a feature
  grande depois de começada registra a divisão no log (a F01 do fin-control foi partida por épico em F01 e F10..F15).
- **Uma feature não cruza release** (a release é da story; a feature herda a das stories que importa — [[requirements-graph]]).
  Quando cruza: **a story entregue fica com a feature que a entregou**; o `planned_for` de uma story Done é a release em que
  ela saiu (corrigi-lo costuma desfazer o cruzamento); se a feature saiu mesmo em releases diferentes, **fica inteira**, com o
  motivo no log; só a story ainda não entregue pode sair, e isso o humano decide. **Nunca uma feature por release, nunca
  feature aberta para release futura**: ela nasce quando o trabalho entra em Delivery, do tamanho de uma fatia.
- **Etapas:** especificar (`spec.md`) → planejar (`plan.md`) → quebrar (`tasks.md`) → executar ⇄ verificar (testes,
  sensores, grafo) → **reconferência visual independente** (só em feature que toca tela; o juiz avalia, não barra; **no brownfield, só na tela nova ou alterada depois do harness** — a já fechada e em produção não se compara, a não ser que o humano peça; o portão de merge não muda — ramo que toca arquivo de tela ainda pede a reconferência, e a tela legada alterada tem como base a tela em produção antes da mudança)
  → **ramo entregue ao integrador** (a 1ª rodada vai para a `main` pelo trem) → **Release** (§6): homologação, aceito e deploy.
- **Tela se compara com a referência visual aprovada, não se "vê rodando"** (`PRINCIPLES.md` I.12). Referência visual
  aprovada é qualquer ferramenta que dê o visual da tela aprovada — o protótipo em HTML (viva) ou as exportações do
  Figma ou de outra ferramenta de design (estática) —, registrada no `info-arch.md` com o tipo e onde mora. No executar ⇄
  verificar, a verificação de tela é o sensor de paridade visual do projeto (`sensors.visual`, o kit
  `mjrp-scripts/visual_parity/`) **e** os pares lado a lado olhados nas condições do projeto (larguras, paletas,
  navegadores). Ler o DOM, ou conferir só os critérios do spec, não conta. Toda feature de tela importa a camada
  transversal da referência (tokens e fontes, componentes compartilhados, casca, responsividade) e a primeira feature de
  tela de um produto porta o CSS e as fontes do design system.
- **Reconferência visual independente** — a etapa depois da **primeira rodada** de executar ⇄ verificar de uma feature
  de tela, antes do merge. Um agente que **não implementou** roda a `mjrp-ensuring-quality` no modo *visual parity*: o
  sensor e os olhos nos pares. **O juiz avalia, não barra** (decisão do MJRP, 2026-10-17): o veredito, `pass` ou
  `fail`, entra na `main` junto com a feature; o que a etapa exige é que o juiz **tenha avaliado**. O **exit 2** do
  sensor (não avaliável: sem Node ou Playwright, sem fatos, zero cenários) é `verdict: incomplete` — nada foi
  comparado, e esse barra; projeto com tela e sem Node instala o Node. Cada linha P0/P1 do juiz se julga com o par: o
  que é dado, não forma, é falso positivo dito com a evidência; o que o juiz lê errado vira proposta de regra testada,
  nunca valor aceito calado. Cada divergência confirmada vira, na hora, **issue no `uat.md` reportada por `juiz`** (§ 6).
  O relatório (`reports/audits/<data>-<produto>-visual-parity-recheck[-n].md`, com `verdict: pass | fail | incomplete`
  e `p0: <n>` no frontmatter, em inglês — os únicos campos que o hook lê; a prosa pode dizer "Veredito: passa" para o
  humano) vai no ramo, depois do último commit de tela. **No conserto de bug** (todas as specs de feature mudadas com
  `solution_type: fix`), vale no lugar o relatório do teste de navegador do próprio bug, rodado no site compilado
  (`…-bug-browser-test[-n].md`, com `site: compiled` e `test:` apontando o arquivo do teste no ramo); a mesma tabela decide.
  Em toda reconferência, o juiz também **usa a tela** (clica, troca aba e idioma, salva), além de comparar: todo
  requisito de tela tem teste de interação do fluxo no navegador.
- **A 1ª rodada vai para a `main`; o humano também julga.** Feita a primeira rodada de executar ⇄ verificar e o juiz, a
  feature é entregue ao integrador e integrada — mesmo com o juiz achando o que corrigir —, porque a liberação ajuda o humano a ser juiz também: ele
  vê a tela rodando, acha o que o juiz não achou, ou decide que está ok do jeito que está. Cada achado do juiz é uma
  issue do `uat.md` (`uat@3`) **reportada por `juiz`**, com `Status` `fixing (<Fxx>)` da **mesma feature** (o achado volta à feature dona: o fechar-antes-de-abrir segue) e o
  relatório na `Evidência`. A coluna `Reportado por` (`MJRP` · `juiz` · `agente`) diz de quem é — §6. A feature na `main` está **em homologação** e fecha quando cada issue dela está fechada. Quem
  fecha depende de quem reportou (§ 6): o achado do juiz é de agente, então um agente que não o corrigiu o
  confere contra a evidência e o fecha; a issue que o humano abrir ao olhar a feature espera o aceite dele, o pedido de
  correção (uma rodada nova da mesma feature) ou o «fica como está». **P0:** o agente traz ao MJRP o que é, e ele decide
  se entra na `main` mesmo assim — o hook segura o relatório com `p0` > 0, e a saída é a válvula dele, nunca do agente.
- **O hook `pre-merge-commit` segura a etapa.** Ele recusa o merge de um ramo que mudou arquivo de tela (o `screen:` do
  contrato) sem relatório de reconferência commitado depois do último commit de tela do ramo, e recusa o relatório que
  barra: `p0` maior que 0, `verdict: incomplete` (o juiz não avaliou), `fail` sem o campo `p0` ou sem veredito. O mais
  novo decide. Um `fail` com `p0: 0` entra, com o aviso de que os achados são issues. Na via rápida, sem relatório, o
  veredito é o Touch ID do humano, pedido pelo próprio hook (§ 2, F61). A saída é do humano, nunca do
  agente (`VISUAL_RECHECK_SKIP="<motivo>"` ou `git merge --no-verify`), como o trailer `Prototype-sync: skip` — é a
  saída do P0. Só o sensor visual pode ser de etapa (`when: pre-merge`); o doctor reprova qualquer outro.
- **Pronto** = o verificador passa (exit 0); nunca o auto-relato do agente. Na feature de tela, o juiz também avaliou e não achou P0; o que ele achou vira issue da feature, não bloqueio.
- **Parada:** o harness corta o loop, nunca o modelo; parou, escala ao MJRP:
  - teto de **3 rodadas por task**;
  - **2 passadas sem mudança** (o diff zerou por duas voltas seguidas);
  - **tokens sem teto**, só registrados: o custo se mede, não corta o loop;
  - um **P0** confirmado pelo juiz, ou um juiz que **não conseguiu avaliar** (`incomplete`): a feature não vai sozinha
    para a `main` — o agente traz ao MJRP o que é, e é ele quem decide.
- **Modelo por task:** toda task do `tasks.md` leva `model:: sonnet` (mecânica: textos e chaves de registro, resumos, amostras e testes de formato, derivados, renomeações) ou `model:: opus` (desenho de código, arquitetura, crítica, reconferência visual). Quem escreve as tasks decide; não há padrão — task sem marca reprova no cross-check.
- **Medida:** a task fechada leva `rounds:: N` (rodadas gastas); o `loop.py --check-tasks` lê as duas marcas.
- **Escalada em três níveis:**
  - o código falhou → corrige e verifica de novo;
  - a spec está errada → para e volta ao portão «Pronto para construir» (emenda com o humano; requisito entregue não se edita — nó novo com
    `supersedes`);
  - a premissa caiu → volta à Discovery.
- **Ramo por feature; a integração é do integrador.** A sessão que implementa trabalha no ramo e no worktree próprios, termina
  com o relatório do juiz independente e **não mergeia**. Só uma sessão integradora escreve na `main`: junta os ramos em
  **trens**, com **um juiz por lote** e o hook `pre-merge-commit` no portão — as regras e a mecânica estão em
  [[git-governance]] («A integração»). O que a integração quebrar, o integrador devolve à sessão dona. O humano decide — não
  executa — só quando pede ou quando há risco de impacto financeiro ou de negócio.
- **Isolamento:** um worktree por sessão de página; a trava de sessão avisa quando há outra no repositório.

## 6. Release — Homologação, Aceito e Deploy

A quarta fase do ciclo (ADR-0027): Discovery · Design · Delivery · **Release**.
É quando a versão do produto chega a quem usa, em três etapas, **nesta ordem** (ADR-0029) —
**Homologação** (o UAT: o humano usa o entregue rodando e registra no `uat.md` o que acha — Bug, Melhoria, Tech debt), **Aceito**
(o aceite do humano: aceito → nó Accepted; **o aceite dele autoriza a publicação**) e **Deploy** (a fronteira irreversível: publicar; só
depois do aceito, e o projeto sem deploy omite a etapa). O que a homologação acha volta pelo Intake (via
rápida ou padrão); a melhoria percebida aqui é issue de UAT do tipo Melhoria, e fora daqui é feature (a regra da fase de
origem). A **versão do produto** (1.0, 1.1) é o conjunto que passa junto por esta fase; «release» é o nome da fase, não do
conjunto (ADR-0028).

**O aceite é por feature** (CC-ADR-0024): o humano aceita a feature inteira num só aceite; o Control Center prepara o commit e
**ele** o roda e assina — o agente nunca escreve `Human-accepted:` nem `Human-reopened:` (o `commit-msg` e o hook recusam). **Mas nem toda
feature pede o OK** (MJRP, 2026-10-30 20:22): só a que tem algo para ele ver, decidir ou de segurança, ou que conserta issue dele; a outra
**fecha pela reconferência independente** e termina em **Fechado**, nunca em Aceito — fechar não é aceitar (`AGENTS.md` § Duas
trilhas; o fechamento no board é a F139). Se a issue achada na Homologação não tem nada a ver com a feature, ela volta ao Intake e a
feature fecha: «↻ a issue volta ao Intake · sem nada a ver: Fechado».

**A feature fecha de dois jeitos** (F139, S-206; o MJRP, 2026-10-30): a que tem algo para o humano **ver** (uma story que ela
importa aponta para um estado de **tela**; o comportamento que ele usa leva a marca `needs_human: "ver: …"`), **decidir** ou **segurança**, ou que **conserta uma issue dele**, espera o «Aceite»
dele — estado **Aceito**. A que não tem nada disso (engenharia, modelo, núcleo, skill, sensor sem efeito que ele veja) **fecha pela
reconferência independente**, como a issue de agente: a spec `Done` declara `closed_by: "recheck independente: <relatório>,
<AAAA-MM-DD HH:MM>"` e o estado é **Fechado**, nunca «Aceito» — o aceite (`Human-accepted:`) continua só dele; o Fechado também vem **antes do Deploy**, como o Aceito. A marca `needs_human:
"<decidir|ver|segurança>: <motivo>"` na spec manda ao aceite o que o grafo não vê, e o sensor recusa o `closed_by` numa feature
assim. A regra é um arquivo só (`mjrp-scripts/feature_closure.py`), lido pelo grafo, pelo board e pela trava do aceite.

**As duas trilhas de issue** (`uat@3`, F48): a coluna `Reportado por` — `MJRP` · `juiz` · `agente` — diz em qual a issue está.
- **Humano:** os requisitos do PRD e as issues que o humano abriu; é a prioridade, e ele aceita a feature quando há o que ver ou decidir.
- **Agente:** as issues que juízes e agentes abrem. Quem acha registra o conserto no board (`solution_type: fix`) e delega na hora, sem esperar o humano; **a
  reconferência independente fecha** (um agente que não a corrigiu a confere contra a evidência).
- **O que sobe:** só o que pede o humano — **decidir**, **ver** (defeito visível usando o produto) ou **segurança** —, marcado na célula
  (`agente · prioridade: humano — decidir|ver|segurança: <motivo>`). Um P0 técnico, sem nada para ele ver nem decidir, fica na trilha Agente,
  fecha com a reconferência e vira aviso. O MJRP continua podendo fechar qualquer uma.

As classes (a)/(b)/(c) — o que o agente decide sozinho, o que é só dele e o que é escolha de produto — e a regra «a regra antes
do código» estão no `AGENTS.md`. Esta página não as repete.

## 7. Loop Learn — deu certo?

Agendado ou por evento; roda sem o humano. Operar e observar (sensores diários, Control Center) → medir o resultado (a
medida do `ROADMAP.md` mexeu?) → kaizen ([[harness-kaizen]]: a lição vai para a fundação). O que aprende volta pelo Intake.

- **O produto na tela:** o Learn roda o `product_structure_check.py` inteiro, todas as vistas; cada lacuna é uma demanda
  com a dona na linha. Um projeto longe do verde (um filho antigo) se arruma de uma vez pelo modo *conform* da
  `mjrp-pdlc-bootstrap`, a nota `product-structure` (CM-0019).

- **O ciclo do resultado** (decisão do MJRP, 2026-10-16 19:24; checagem desde 2026-10-17): um resultado do `ROADMAP.md`
  anda **Later → Next → Now → Now «em monitoramento» → Alcançados**, e o que muda de lugar é a medida, não o código.
  *Later* é direção sem solução; *Next* é problema claro com a solução por descobrir (Discovery); *Now* é o resultado em
  curso, com os épicos dele sendo entregues; **«em monitoramento»** é um estado **derivado** — todas as stories dos épicos
  que o servem estão feitas e o resultado segue em Now — e **nunca se escreve à mão**: o time para de construir e o Learn
  mede; **Alcançados** é a seção `## Alcançados` do `ROADMAP.md`, para onde vai o resultado cuja medida foi atingida e
  estável, com `achieved:: AAAA-MM-DD` na seção dele e as linhas `- **Valor medido:**` e `- **Aprendizado:**`. **Só o humano
  marca «alcançado»** (`achieved::`); o agente não propõe. Resultado `sem medida` (a medida é opcional, 2026-10-29): não há alvo para
  atingir, então o alcançado é o julgamento dele, `achieved::` com a frase dele, sem `- **Valor medido:**`. Impacto parcial ou nulo: o resultado fica no Now e volta à
  Discovery. Liberou o Now, o Next sobe e o Later é reavaliado. O **foco** é um aviso: mais de 5 resultados **em curso** em
  Now (o «em monitoramento» não conta). A checagem é o `product_structure_check.py` e é **aviso, não reprova**: resultado
  com as stories todas feitas que segue em Now sem `achieved::` (`outcome_done_not_achieved`), com `achieved::` mas ainda em
  Now (`outcome_achieved_in_now`), alcançado sem a data, o valor medido ou o aprendizado (`outcome_achieved_incomplete`), e
  `now_too_many`. Nasceu da OUT-02 do fin-control: 6 de 6 stories feitas, parada em Now sem resultado registrado.
- **Documento que envelheceu:** a auditoria (`mjrp-auditing-docs`) marca quem decide cada achado. O agente aplica
  (`mjrp-syncing-docs`) o que a evidência prova e está fora do que o humano aprovou; o humano decide só o que é dele — o que ele aprovou
  (PRD, `ROADMAP.md`, escopo ou critério de um requisito), o que pode ser defeito (o código talvez seja o lado errado) e
  o que não dá para decidir. Tudo fica no log e no Control Center.

## 8. Papéis — as vagas de agente

| Loop | Papéis (skill de hoje) |
|---|---|
| Intake | triador (`mjrp-structuring-requests`, `mjrp-pdlc`) — escolhe a via; o brief da via rápida é da `mjrp-structuring-requests` |
| Discovery | designer de UI — o protótipo rápido do Explorar (`mjrp-designing-ui`) · coach de produto (`mjrp-coaching-pm`) · analista (`mjrp-writing-reqs`) · arquiteto (`mjrp-designing-architecture`) · crítico de arquitetura (`mjrp-critiquing-architecture`, troca de chapéu declarada ou agente separado) · registro (`mjrp-recording-decisions`, ADR `Proposed`) |
| Design | designer de UI — a tela e a descrição dela, numa atividade só (`mjrp-designing-ui`) · designer de identidade (`mjrp-defining-design-systems`) · juiz de UX (`mjrp-critiquing-ux-ui`) · analista (`mjrp-writing-reqs`, os requisitos Ready) |
| Pronto para construir | analista (`mjrp-writing-reqs`, Ready) · registro (`mjrp-recording-decisions`) · gate (`mjrp-ensuring-sdd`) |
| Delivery | especificador (`mjrp-specifying-sdd-artifacts`) · arquiteto (`mjrp-designing-architecture`, escolha arquitetural no Plan, com a crítica antes do aceite) · executor (`mjrp-implementing-tasks`, `mjrp-debugging`) · juiz (`mjrp-ensuring-quality`, `mjrp-ensuring-sdd`, `mjrp-assessing-code-quality`; `mjrp-critiquing-architecture` no portão do marco) · integrador (`mjrp-integrating-branches`, o único que escreve na `main`) |
| Release | QA (`mjrp-ensuring-quality`, a Homologação) · documentador (`mjrp-syncing-docs`) |
| Learn | auditor (`mjrp-auditing-docs`) · documentador (`mjrp-syncing-docs`, achado com evidência fora do que o humano aprovou) · crítico de arquitetura (`mjrp-critiquing-architecture`, deriva) · kaizen (`mjrp-crafting-skills`, `mjrp-recording-decisions`) |
| Sempre | orquestrador (`mjrp-pdlc`) · `mjrp-pdlc-onboarding` (lê o estado) · `mjrp-saving-context` (grava o estado) |

Os dois críticos — o juiz de UX e o crítico de arquitetura — seguem a mesma regra de separação: a passada que julga
nunca se mistura com a que produz. Roda por troca de chapéu declarada (mesmo agente) ou num agente separado, que
recebe só a skill e os artefatos; a auditoria diz qual das duas.

Plugar um agente é preencher a vaga, com a governança da IA agêntica:
identificador por agente, log de atividade, interrupção sem corromper o estado, humano no alto impacto.

## 9. Artefatos — o que cada etapa lê e escreve

| Etapa | Lê | Escreve |
|---|---|---|
| Intake | pedido do MJRP, `uat.md`, `daily-checks/`, lição do Learn | item triado com a via, `prd.md` § Candidatos, `docs/log.md` |
| Discovery | `VISION.md`, `PRINCIPLES.md`, `ROADMAP.md`, `prd.md`, `constitution.md`, `arch.md`, o item | `design/inception/`, `design/wireframes/`, `inception-notes.md`, `ROADMAP.md` (^OUT, medida, tags), `prd.md` (épicos; fora de escopo), `docs/decisions/NNNN-*.md` (`Proposed`), `arch.md` + `data-model.md`, `reports/audits/` (arquitetura) |
| Design | `design/inception/`, `inception-notes.md`, `design-system.md`, o item | `info-arch.md` (inventário, ^estados), `design-system.md`, `design/prototypes/` + auditoria de UX, `requirements/` (Backlog → Ready) |
| Pronto para construir | `requirements/` Ready, `info-arch.md`, inventário com destino | decisão no `docs/log.md`, `gates:` opcionais |
| Delivery | `requirements/` Ready, `arch.md`, `data-model.md`, `design-system.md`, `constitution.md` | `features/F-xx/spec.md`, `plan.md`, `tasks.md`, `src/` + `tests/`, evidência no nó (`delivered_by`), o ramo entregue |
| Release | o entregue rodando, `requirements/` | `uat.md` (Bug, Melhoria, Tech debt), nó Accepted (o aceite do humano) |
| Learn | `daily-checks/`, `doctor`, `uat.md`, `ROADMAP.md`, `docs/log.md` | `ROADMAP.md` (medida atual), [[harness-kaizen]], kernel · skills · sensores, item novo no Intake |

**Sempre:** `MEMORY.md ## Now` (o bastão), `docs/log.md` (uma entrada por decisão), o grafo de requisitos
([[requirements-graph]]). **Artefato por artefato** — o caminho, quem cria, quando cada via o atualiza e o que o passo retroativo
cobra: pdlc-artifact-map.

## 10. Estado externo, Control Center e métricas

Os arquivos são o estado externo dos loops: nenhum passo depende da memória da conversa. O Control Center é a
observabilidade dos loops — o humano lê pouco e vê tudo. Métricas dos loops: **taxa de intervenção** (toques do humano por
unidade entregue), **captura do verificador** (falhas pegas por máquina × pelo humano), **retrabalho**, **custo por unidade
concluída**.

## 11. Da numeração antiga para os loops

| Antes | Agora |
|---|---|
| FASE 0 · Setup & bootstrap | Fundação |
| FASE 1a · Inception | Discovery · Explorar |
| FASE 1b · Discovery (ou "Consolidate") | Discovery · Enquadrar |
| FASE 2 · Design (2a · 2b · 2c) | o loop Design (Desenhar · Criticar · Ver na tela) |
| FASE 2→3 · Promote to Ready | o portão Pronto para construir |
| FASE 3 · SDD | Delivery |
| FASE 4 · Quality | Delivery (verificador) + Release (Homologação) |
| FASE 5 · Documentation & closure | Release (documentador) + Learn |
| EP-90 · Intake (triagem do harness) | Intake, em todo projeto |

## History

- **2026-11-17 16:21** · **No conserto de bug, o teste de navegador do bug vale como reconferência; a reconferência usa a tela** (F273, UAT-589; decisão do MJRP de 2026-11-17 14:57, proposta do MJRP Personal): a trava visual (`visual_gate.py`) aceita o relatório `…-bug-browser-test` no branch só de conserto, e as skills de qualidade e de design pedem o teste de interação de todo requisito de tela.
- **2026-11-05 18:55** · **A conferência de fecho casa a sessão pelo ramo** (§ «O fechamento da sessão»; F198, UAT-516): o `session-check` pedia o id do app (`local_<id>`), que a sessão não conhece, e reprovava sempre. Agora a entrada de fechamento vale se traz `Session:` e o `Branch: <ramo>` do worktree; o `--session` fica opcional. Decidido pelo agente, revisável pelo MJRP.
- **2026-11-02 00:24** · **A dispensa do aceite sai** (`acceptance_waived:`, a linha de 2026-11-01 23:02): a reconferência a reprovou com um P1, porque é uma válvula do humano que um agente escreve numa linha (`apps/control-center/reports/audits/2026-11-02-recheck-f159-closures.md`). O humano decide de manhã.
- **2026-11-02 00:20** · **«Pequena» ganha teto na issue de tipo `copy`: até 10 entradas por commit** (§ 2; F158; a reconferência `apps/control-center/reports/audits/2026-11-02-recheck-f158.md`, P2-2; o número é decisão do orquestrador, revisável pelo MJRP, que disse «pequenas mudanças»). A linha que já existe não vira `copy`. O salvar da tela só muda o texto, que continua texto; marcador e texto vazio não se conferem nele, para um salvar recusado não travar o Admin (decisão do orquestrador, revisável pelo MJRP; `2026-11-02-recheck-f158.md`, P2-B).
- **2026-11-01 23:02** · **A issue de tipo `copy` vai direto a «Em andamento», sem feature e sem a «Priorizada»** (§ 2; F158, S-208; a regra é do MJRP, 2026-11-01: «o tipo copy deve liberar o agente pra colocar direto em andamento»). O integrador a faz direto na `main`, a trava `copy_change_check.py` só deixa passar o texto de entradas que existem, com o `uat.md` e o log, e o OK é sempre do humano. Decidido pelo agente, revisável pelo MJRP: a página de texto mudada na `main` sem uma linha `copy` também é recusada, menos o salvar da tela do Admin.
- **2026-11-01 23:02** · **O humano pode dispensar o próprio aceite, feature por feature** (§ «A feature fecha de dois jeitos»; o MJRP, 2026-11-01 22:34, sobre a F127, a F132 e a F137): a spec `acceptance_waived: "MJRP, <AAAA-MM-DD HH:MM>"` tira só o motivo «conserta uma issue dele». Antes a feature que conserta uma issue dele só fechava pelo aceite. Nome e forma do campo decididos pelo agente, revisáveis pelo MJRP.
- **2026-11-01 22:57** · **O board também lê a nota do Touch ID** (§ 2; F151, UAT-449): a frase dizia que só a trava do passo retroativo a lê. A nota põe um card em «Feito», não abre merge nem aceite, e o portão continua sem lê-la. A feature da via rápida que não mudou tela não recebe o dedo e segue «aguardando o juiz».
- **2026-11-01 20:28** · **Na via rápida da trilha Humano, a feature que não muda tela fecha pela reconferência independente** (MJRP, resposta de 2026-11-01): o Touch ID só é pedido quando o merge muda tela, e sem tela não há o que ele julgue. O estado é Fechado, nunca Aceito; quem pede o olho dele continua com `needs_human`.
- **2026-11-01 12:25** · **Na via rápida da trilha Humano, o Touch ID no merge cumpre a linha da reconferência visual do passo retroativo** (§ 2; F154, UAT-454). A trava pedia um relatório que essa via não tem, e parou o passo retroativo de cinco features. A regra fica, e a trava era o defeito. A via padrão e a trilha Agente seguem com o relatório. Decidido pelo agente, revisável pelo MJRP: a nota vale se está num commit que o ramo alcança e nomeia a feature e a tela do projeto; ela tem a mesma confiança de um relatório que um agente commita, e não abre merge nem aceite.
- **2026-10-31 09:11** · **A página passa a «Aceite» e «o humano»** (F105, S-190; o MJRP, 2026-10-27 12:54): o aceite da feature se chama «Aceite» (antes «Dar o OK») e o MJRP como papel de um processo é «o humano»; a atribuição datada e a marca ficam. O diagrama vigente (v13) e os textos da tela seguem a mesma linguagem; a skill se cita sempre com o prefixo `mjrp-`.
- **2026-10-30 23:41** · **Na fase Release, a ordem passa a Homologação → Aceito → Deploy** (ADR-0029, emenda de ordem da ADR-0027; decisão do MJRP de 2026-10-30 23:40): o OK dele autoriza a publicação, e o Deploy é a fronteira irreversível — por isso o aceite vem antes; a feature que fecha pela reconferência (Fechado) também fecha antes do Deploy. O § 6 (título e texto), o resumo, o § 5 e a linha do ciclo seguem. O texto anterior dizia «Homologação, Deploy e Aceito» e punha o aceite depois da publicação. O § 8 e o § 9 não citam a ordem das etapas, e ficam.
- **2026-11-08 11:23** · **A via rápida comprime a Discovery e o Design, não os pula** (§ 1, § 2, § 2.1; S-235, F235; decisão do MJRP de 2026-11-08 10:57). O Quick Prototype, quando o humano pede, vem antes da Delivery, sem rodada de perguntas e sem juiz agente; só os documentos ficam no passo retroativo. Supera, quanto ao protótipo, as de 2026-10-24 e 2026-10-27.
- **2026-11-04 21:30** · **A trava que não consegue julgar o fecho o recusa, em vez de sair 0** (§ 2.1, F182, UAT-489; decidido pelo agente, revisável pelo MJRP). Num filho, o `retro_step_check.py` e o `sdd_shape_check.py` vinham sem o registro e sem os moldes, diziam «NÃO foi conferido» e saíam 0, e cinco features de via rápida entraram na `main` do `MJRPpersonal` sem o passo. Agora o registro e os moldes viajam no refresh, e, sem eles, o fecho sai 2 e é recusado (o commit que não fecha nada segue passando). O `pre-commit` recusa também o fecho quando o script falta, e o `merge_train.py` quando o ramo fecha sem poder ser julgado.
- **2026-10-30 21:37** · **O ciclo passa a cinco loops: o Design deixa de ser etapa da Discovery** (UAT-421, o desenho v13 aprovado pelo MJRP em 2026-10-30; o card «O ciclo de vida», o mapa das skills e o `pdlc-artifact-map` seguem). O § 3 se divide em 3.1 (Discovery: Explorar ⇄ Enquadrar, ↻ pivotar · iterar · avançar) e 3.2 (Design: Desenhar → Criticar → Ver na tela, uma volta por versão do protótipo); o portão «Pronto para construir» do § 4 é a **saída do Design**; as tabelas dos §§ 8, 9 e 11 ganham a linha do Design e chamam o UAT de Release; a Definition, o título e o resumo dizem cinco loops; os loops andam ao mesmo tempo, em itens diferentes (a trilha dupla). O § 6 diz que nem toda feature pede o OK (fecha pela reconferência, Fechado). O texto anterior dizia: «design é Discovery: as três etapas são uma só volta», «uma fundação e três loops», «matar · iterar · avançar», «Dar o OK» por feature em toda parte, e chamava a quarta etapa de UAT. O mesmo passo fecha o P2-2 do juiz da F63 (`reports/audits/2026-10-30-f63-pdlc-docs-judge.md`: o título, a Definition, o § 0 e as linhas «UAT» dos §§ 8, 9 e 11 no vocabulário de 24/10).
- **2026-10-30 21:17** · **A feature sem nada para o MJRP ver ou decidir fecha pela reconferência, no estado Fechado** (§ 6; F139, S-206; o pedido do MJRP em 2026-10-30, sobre a F57). Estende à feature o critério da issue de agente: sobe ao «Dar o OK» só a que tem tela, decisão, segurança ou issue dele; a outra declara `closed_by` na spec e o board a põe em «Fechado», nunca «Aceito». A regra mora em `mjrp-scripts/feature_closure.py`.
- **2026-10-30 18:48** · **O § 6 vira a fase Release** (ADR-0027, ADR-0028; decisões do MJRP de 2026-10-30): as fases são Discovery, Design, Delivery e Release; a Release tem as etapas Homologação (o UAT), Deploy e Aceito; o conjunto que passa junto por ela é a versão do produto, não «a release». O Learn (§ 7) não é fase.
- **2026-10-30 11:24** · **Na via rápida, o OK do MJRP na tela é o Touch ID que o merge pede, não um relatório escrito por agente** (§ 2, § 5; F61 TASK-03). Supera o *formato* de 2026-10-26 11:28 — a decisão dele («meu ok no chat deveria valer como evidência, é fast lane») fica: o OK dele continua sendo o veredito, sem juiz agente. Por quê: o relatório `who_judged: human` era escrito pela integradora a cada tela (os -26 e -27 de 27/10), e o portão aceitava qualquer `verdict: pass` — um agente podia escrever o OK por ele. Agora o `visual_gate.py` reconhece a via rápida (todas as specs de feature mudadas no ramo dizem `lane: fast`) e, sem relatório depois do último commit de tela, pede o Touch ID dele no próprio `git merge` (o mesmo `presence` do Aceite, CC-ADR-0031); o relatório `who_judged: human` deixa de valer. Limites honestos, os do Aceite: quem troca o binário `presence` ou o próprio portão forja o dedo (e aparece no diff); o diálogo espera 35 s (cabe nos 60 s que o `merge_train.py` dá a cada git) e pede que o MJRP esteja no Mac. Na mesma entrega, pelo juiz independente (`reports/audits/2026-10-30-f61-visual-gate-recheck.md`): o diálogo cabe no prazo do trem (o `merge_train.py` mata o `git merge` aos 60 s; o autoteste prende a relação), não é pedido quando o merge já é recusado ou o humano já o liberou, e um buraco antigo fechou — `GIT_REFLOG_ACTION=x git merge …` pulava a trava inteira; agora a tela que nenhuma revisão nomeada mudou é recusada. Decidido pelo agente a partir do pedido da integradora, revisável pelo MJRP.
- **2026-10-29 20:19** · O resultado `sem medida` é dado como alcançado pelo julgamento do MJRP (`achieved::` com a frase dele, sem `- **Valor medido:**`); com medida segue o hoje → alvo (ordem dele, UAT-409, F127; [[conformance-notes]]).
- **2026-10-27 17:53** · **A reconferência independente não confere wireframes nem protótipo** (decisão do MJRP, pelo custo de uso). Julga a tela construída, o código, os testes e os sensores. A conversa sobre os wireframes no passo retroativo da via rápida segue em aberto com ele.
- **2026-10-27 17:43** · **Na trilha Agente, a reconferência independente só para o conserto que toca trava, hook ou sensor, e por lote** (decisão do MJRP, pelo custo de uso: limite semanal a 76 % e R$ 638 de uso extra em 27/10). O resto fecha com os testes e os sensores verdes. A reconferência roda num modelo menor (Sonnet). Até a renovação do limite (30/10): termina-se o que está aberto, sem frente nova e sem doctor completo a cada turno. A regra mudou no `AGENTS.md` § Duas trilhas.
- **2026-10-27 17:23** · **Uma issue consertada se marca de um jeito só** (§ 2.1, F117, UAT-393; decidido pelo agente, revisável pelo MJRP). O `retro_step_check` cobrava `fixed (<Fxx>: …)` e o molde do `uat.md`, o cabeçalho do arquivo e as skills (`mjrp-debugging`, `mjrp-syncing-docs`, `mjrp-specifying-sdd-artifacts`, `mjrp-ensuring-quality`, `mjrp-ensuring-sdd`) ensinavam `fixed (<commit> · <teste>)`; 130 das 303 células `fixed` do `uat.md` real não seguiam o cobrado. O formato é `fixed (<Fxx>: <commit> · <teste ou passos → resultado>)`: o `Fxx` é o que liga a issue ao conserto (o grafo e o `fixed_in` do leitor do Control Center o leem), e o molde e as skills passam a ensinar esse. As células antigas não foram reescritas.
- **2026-10-27 16:10** · **O conserto sem story fecha pela issue** (§ 2.1, F111, UAT-385; decidido pelo agente, revisável pelo MJRP). A trava do passo retroativo (F101) tratava a falta de nó importado como story faltando, e nenhum conserto da trilha Agente fechava (a F110 ficou `In progress`). O conserto sem nó importado (`solution_type: fix`, `imports: []`) é julgado pelo que lhe cabe: a issue de `fixes:` `fixed (Fxx: …)` com a evidência, os moldes fora do esboço e as linhas «só se» cuja condição valeu; as do requisito saem «não se aplica». A feature e o conserto que importa um nó seguem cobrados pelo nó.
- **2026-10-27 14:42** · **O passo retroativo e o fechamento da sessão passam a ser cobrados pela máquina** (§ 2.1, F101, S-186; escolhas do MJRP de 2026-10-27 10:32): o `pre-commit` e o `merge_train.py merge` leem o registro de artefatos (o campo novo `retro_check` diz como cada linha se confere) e recusam a feature da via rápida que vai a `Done` sem o passo; o `session-check` bloqueia o arquivamento; os `--check` dos mapas entram no `pre-commit` e no doctor, dentro do sensor do catálogo. Decidido pelo agente, revisável pelo MJRP: o «protótipo julgado» é `judgement` (o app não tem `design/prototypes/`), o documento declarado «atualizado» vale no projeto ou na raiz, e o registro se lê da cópia de antes. Contra a história, a F100 passava e a F58, F98, F90, F93, F82 e F87 teriam sido recusadas.
- **2026-10-27 13:56** · **A § 2.1 deixa de ter tabela própria** (pedido do integrador, 2026-10-27): o que o passo retroativo atualiza mora no registro
  `mjrp-scripts/artifacts.json` e na pdlc-artifact-map, gerada dele; aqui ficam quando o passo roda, como se aplica (linha a linha,
  com a declaração dos documentos no `plan.md`), quem cobra e como a sessão fecha.
- **2026-10-27 11:29** · **Os mapas de artefatos e de skills são gerados de uma fonte, com `--check`** (decisão do MJRP). A fonte é o registro de artefatos (F100) e o frontmatter das skills (F102, a etapa e o `calls`; a ligação skill → artefato pelo `created_by` do registro); wiki, SVG, `skill-map.md` e cards saem gerados ou leem ao vivo; o `--check` recusa a declaração faltando, a referência para o que não existe, o artefato novo fora do registro e o gerado diferente da fonte; a F101 o liga no `pre-commit`, no doctor e no merge; a `mjrp-crafting-skills` ensina a declaração.
- **2026-10-27 11:05** · **O passo retroativo deixa de ter célula sem regra** (§ 2.1; decisões do MJRP sobre o wireframe da F100): os documentos
  que descrevem o sistema entram se a feature mexeu no que descrevem, e o `plan.md` § Documents Consulted declara cada um («atualizado» ou «sem
  mudança»), para a F101 conferir a declaração; os critérios de aceite da story entram sempre, do que ele aprovou na tela; a ADR nasce antes do
  código, também na via rápida, e o retroativo só aponta. O mapa de todos os artefatos vira página própria, pdlc-artifact-map, ligada daqui e
  da § 9. Achado: a tabela do Update da `mjrp-syncing-docs` já mandava esses documentos à casa, mas esta página dizia «sem regra».
- **2026-10-27 10:46** · **A política da via rápida ganha o passo retroativo por escrito** (§ 2.1; o MJRP: «essa política do fast lane com a verificação retroativa precisa ser descrita na wiki»). O que cada artefato recebe, o que fica de fora (o épico, o escopo do PRD, o «Dar o OK»), o que ainda espera a decisão dele no mapa de artefatos (F100), quem cobra hoje (F95 no `pre-commit`; `pdlc_vocabulary_check` só depois do merge) e amanhã (F101), e o fechamento da sessão de página (retroativo + save context antes de arquivar, decisão de 2026-10-27 09:52). Incidente: a F83 fechou com o retroativo pela metade, e o próprio integrador o resumiu a «plan, info-arch e protótipo» (log 2026-10-27 10:41).
- **2026-10-26 22:49** · **A via rápida nasce do molde e fecha na forma** (F95). Incidente: de F43 a F94 nenhuma feature seguiu o molde do SDD e nada cobrou; as 22 de um dia foram criadas copiando a forma mínima da F78. O passo (2) passa a criar a feature por `new_feature.py` (as três peças nos moldes, o que só o autor sabe marcado «a escrever») e o passo (5) chama a `mjrp-ensuring-sdd` no fecho; o `sdd_shape_check.py` é o sensor que cobra a forma (recusa o `Done` fora do molde; a aberta só avisa). Os moldes não mudaram.
- **2026-10-26 11:28** · **Na via rápida da trilha Humano, o OK do MJRP no chat é a evidência do portão visual** (decisão do MJRP: «meu ok no chat deveria valer como evidência, é fast lane»). O `pre-merge-commit` (`visual_gate.py`) pede um relatório de reconferência visual para ramo que mudou tela; na via rápida não há juiz agente, então a sessão registra o OK dele no relatório que o portão lê (`reports/audits/<data>-<produto>-visual-parity-recheck.md`, frontmatter `verdict: pass`, `p0: 0`, `judged_by: MJRP no chat (via rápida)`, a frase dele e a hora), commitado depois do último commit de tela. Não é juiz: é o registro do OK dele. Decidido pelo agente, revisável pelo MJRP: o formato, reaproveitando o portão sem mudá-lo.
- **2026-10-25 21:55** · **O que sobe para o MJRP deixa de ser a gravidade e passa a ser o que ele tem a fazer** (decisão do MJRP): decidir, ver ou segurança. Gatilho: as UAT-313 a 318, P0 técnicos dos scripts, chegaram à fila dele sem nada para ver nem decidir, e já reconferidas por uma validação independente; ele perguntou como faria o UAT delas. A marca `— P0:` fica só nas linhas antigas.
- **2026-10-24 14:33** · **A página passa ao processo do v12** (F63 TASK-02; decisões do MJRP de 2026-10-24): duas vias no Intake — a **padrão** (Discovery antes, do tamanho da novidade) e a **rápida** (direto ao Delivery, documentação e protótipo depois; juiz: o MJRP ou a reconferência independente; três salvaguardas) — no lugar das quatro trilhas, do Fast track e do quick fix (§ 2); o «contrato» vira o portão **Pronto para construir**, que é aprovação e não etapa (§ 4); o Delivery é SDD com executor, juiz e integrador, e a integração é do integrador, em trens (§ 5, [[git-governance]]); o «Dar o OK» por feature e as trilhas Humano e Agente (§ 6). O diagrama é um só, o do card do Overview; os PNGs v0–v5 foram para `_archive/`. Os registros abaixo ficam como foram escritos.
- **2026-10-17 20:39** · **Uma feature não cruza release — e o remédio não reescreve o passado** (§ 5; decisão do MJRP): a story entregue fica com a feature que a entregou; o `planned_for` de uma Done é a release em que saiu; se a feature saiu mesmo em releases diferentes, fica inteira com o motivo; só a não entregue sai, por decisão do humano; nunca uma feature por release, nunca feature aberta para release futura. Origem: o conform do `pedroso-construction-sw` propôs fatiar a F01 "uma por release" e depois achou Done as stories que ia mover.
- **2026-10-17 17:58** · **O quick fix é a quinta fila do Intake** (§ 2; decisão do MJRP de 2026-10-17 16:40, formalizada na `mjrp-pdlc`): pedido dele, pequeno, a issue no `uat.md` e o fix direto na `main`, sem juiz e sem rodada de protótipo; a issue espera o OK dele. Só o humano escolhe a fila; deixa de ser quick fix quando a mudança não é pequena. Já praticada na UAT-243 e na UAT-244 do Control Center.
- **2026-10-17 17:54** · O **ciclo do resultado** (§ 7) e a **definição de feature** com os três sinais de tamanho (§ 5) entram na página, como aviso do `product_structure_check.py` (`product-structure@5`, CM-0027) — retorno da auditoria do conform do fin-control: a OUT-02 com 6 de 6 stories feitas parada em Now, a F01 com 39 stories. Decisões do MJRP de 2026-10-16 19:24 (o ciclo; só ele marca `achieved::`; aviso acima de 5 no Now) e 2026-10-17 15:11 (a definição de feature e as duas frentes).
- **2026-10-17 10:12** · Decisão do MJRP (pedido direto, sem ADR): **a primeira rodada de execução e verificação vai para a `main`, mesmo com o juiz achando o que corrigir** — «a liberação vai ajudar eu também ser juiz e já ir encontrando coisas, ou até decidir que está ok do jeito que está». O §5 passa a dizer: o **juiz avalia, não barra** (o relatório entra com a feature, `pass` ou `fail`); cada achado vira issue do `uat.md` **da mesma feature** (`fixing (<Fxx>)` — fechar antes de abrir segue) e a feature na `main` fica em homologação até as issues dela fecharem; **P0** o agente traz ao MJRP, que decide pela válvula dele (`VISUAL_RECHECK_SKIP`); o juiz que **não conseguiu avaliar** (exit 2 → `verdict: incomplete`) continua barrando. Por quê: o juiz barrando segurava a tela longe dos olhos do MJRP, e era ele quem achava, no UAT, o que o juiz não viu (o Control Center 1.0, 2026-10-11); com a tela na `main` cedo, o ciclo achar → corrigir roda com ele dentro. O hook (`visual_gate.py`, `visual-sensor@2`, CM-0023) e o selftest mudaram junto. Mais, no mesmo dia (10:09): **só a issue que o MJRP abriu espera o OK dele; a aberta por agente é conferida e fechada por agente** — o §6 e a parte `**Aberta por:** agente (…)` da `Descrição` (e `(conferida por agente)` no `OK do humano`) levam isso para a linha da issue. Este kernel chega aos filhos pelo `--refresh-kernel`; a mudança do script do hook anda pela nota `CM-0023` (ver [[conformance-notes]]).
- **2026-10-15 18:30** · A seção Loop Delivery (§5) vira a **fonte do texto** que o Control Center desenha na cabeça do quadro de Delivery (UAT-200, F26; formato `delivery-loop@1`): os itens **Pronto**, **Parada** e **Escalada** ficam como estão, com a Parada e a Escalada em lista aninhada — quem lê a página lê as mesmas regras que a tela mostra. E a Parada diz o que o MJRP pediu na UAT-200: o loop corta por 3 rodadas por task e por 2 passadas sem mudança; **tokens não têm teto, só registro** (o `loop.py` já tinha o orçamento desligado por padrão; a menção a "orçamento de tokens" sai da regra).
- **2026-10-14 22:08** · O portão Discovery → Delivery deixa de ser um filtro de texto na `mjrp-pdlc` e vira o `--story` do `product_structure_check.py`: escolhe as lacunas pelo `code` (nunca pela palavra da mensagem — uma lacuna de formato de resultado não trava mais a story boa), normaliza o caminho e sai 2 quando a story não existe (verificação dos donos, P1-1 e P1-2). E a release só é cobrada de `Ready` em diante (`product-structure@2`, CM-0020; ver [[requirements-graph]]).

- **2026-10-14 21:21** · Decisão do MJRP: a estrutura de produto que o Control Center mostra deixa de ter uma skill própria e é desmontada nos donos — **portão Discovery → Delivery por story** (§4: `epic:` e o `planned_for:` da própria story resolvendo, juiz `product_structure_check.py` filtrado), o check inteiro no **Learn** (§7), a exigência **na criação** (`mjrp-writing-reqs`, `mjrp-coaching-pm`, `mjrp-specifying-sdd-artifacts`) e o laço de arrumar um filho antigo no modo *conform* da `mjrp-pdlc-bootstrap` (CM-0019). A tela v4.6 é a vista humana do mesmo sensor.
- **2026-10-13 19:00** · O Discovery perde a exceção do subprojeto do harness (ADR-0020): o `prd.md` carrega os épicos em todo projeto.
- **2026-10-13 09:58** · Decisão do MJRP: o teto do Execute ⇄ Verify cai de 5 para **3 rodadas por task** (a parada por 2 passadas sem progresso segue); toda task do `tasks.md` leva `model:: sonnet|opus` (mecânica em Sonnet, sem padrão); a task fechada leva `rounds:: N`, para medir em vez de estimar. `loop.py` com `--max` 3, `--check-tasks` e `--task/--tasks-file`.

- **2026-10-12 16:57** · "Estação" vira **etapa** no texto em português (preferência do MJRP, mais comum em pt-BR); *stage* nas skills, em inglês (decisão do MJRP, 2026-10-13); as entradas antigas desta seção ficam como foram escritas. O relatório de reconferência passa a ser lido pelo hook só no frontmatter, em inglês: `verdict: pass | fail`.

- **2026-10-12 16:34** · Revisão do Learn depois da crítica da ADR-0017 (decisões do MJRP): a etapa ganhou mecanismo —
  o hook `pre-merge-commit` recusa o merge de ramo que mudou tela sem relatório com veredito de passa depois do último
  commit de tela; o exit 2 do sensor é **não passa**; só `sensors.visual` pode ser de etapa; "protótipo aprovado" passa
  a "referência visual aprovada" (viva ou estática — Figma e outras ferramentas de design), como o `PRINCIPLES.md` I.12
  emendado.

- **2026-10-12 15:55** · Learn do Control Center 1.0 (a UI chegou ao UAT longe do protótipo v4.1, com todos os sensores verdes —
  [[harness-kaizen]] 2026-10-11 12:09): o Delivery ganhou a etapa **reconferência visual independente**, antes do merge
  de feature de tela (agente separado, sensor + olhos, passa só sem P0/P1 real); a verificação de tela no executar ⇄
  verificar passou a ser a comparação com o protótipo aprovado, pelo kit de paridade visual do kernel; o doctor cobra a
  declaração do sensor (A2, ADR-0017 do harness, *Proposed*). Decisão do MJRP em 2026-10-12 15:41.

- **2026-10-09 21:23** · Diagrama oficial passa à v5 (`2026-10-09-2121-pdlc-loops-v5`): a v4 com a revisão geral — a ADR passa pelo crítico de arquitetura antes do aceite, todo protótipo vem com info-arch e wireframes (guarda), `design-system.md` sai do Desenhar e entra no Contrato, requisito `<ID>-<slug>.md`. A v4 fica como histórico.
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: o esqueleto da arquitetura nasce no fim do Enquadrar (não na fundação), com ADR `Proposed` e a crítica (troca de chapéu declarada ou agente separado) antes do aceite; o Fast track pede ADR `Accepted`; a saída da Discovery inclui o `design-system.md` quando há UI (a lacuna do Control Center); o guarda protótipo × info-arch × wireframes (W14); papéis e artefatos acertados.
- **2026-10-09 19:58** · O arquiteto ganhou um crítico: `mjrp-critiquing-architecture` (Reviewer) julga a ADR em `Proposed` e os esqueletos antes do aceite do humano, e o código no portão do marco — sempre num agente que não desenhou (pedido do MJRP; a Architecture Review saiu da `mjrp-designing-architecture`).
- **2026-10-09 13:23** · Diagrama oficial passa à v4 (`2026-10-09-1318-pdlc-loops-v4`): a v3 com o kaizen do design — Desenhar = a tela e a descrição dela,
  `designing-ui` no lugar das quatro skills de tela, `design/wireframes/` entre o que a Discovery escreve. A v3 fica como histórico.
- **2026-10-09 13:04** · Kaizen do design (decisões do MJRP, 2026-10-09): a tela e a descrição dela (texto, inventário com wireframe,
  `info-arch.md`) são uma atividade só, de uma dona só — as quatro skills de tela se juntaram na `mjrp-designing-ui`;
  cada item do inventário termina numa função do produto ou num resultado; o wireframe mora em `design/wireframes/`.
- **2026-10-07 20:09** · Onda C (decisão do MJRP): no Learn, achado de documentação com evidência e fora do contrato é aplicado pelo
  agente sem esperar; o humano decide contrato, possível defeito e o indecidível (II.10).
- **2026-10-07 18:31** · Página criada a partir da proposta do PDLC em loops (#harness-kaizen). Origem: na saída da
  Discovery do Control Center o agente não usou o protótipo aprovado nem o inventário para os requisitos; o MJRP pediu um
  PDLC coerente, coeso e consistente, e depois redesenhado com loop engineering e agentic workflows. Decisões do MJRP: a
  v1 é a "v0 de loop engineering do PDLC"; escalada do Delivery ao contrato e à Discovery; UAT como fronteira; Intake com
  trilhas Full · Standard · Fast track · Fix; nomes Discovery · Delivery · Learn; prototipação rápida ligada por padrão e
  pode pular; aprovar spec e tasks vira opção do contrato; PR por feature com merge do agente, humano opcional no risco
  financeiro ou de negócio, com backup e rollback como pré-condição; Intake com dois sentidos (triagem agora, pré-venda
  depois).

## Related

[[product-discovery]] · [[sketch-vs-prototype]] · [[loop-engineering-concept]] · [[requirements-graph]] ·
[[harness-elements]] · [[harness-kaizen]] · [[git-governance]] · [[architecture-review]] · [[adr-practice]]
