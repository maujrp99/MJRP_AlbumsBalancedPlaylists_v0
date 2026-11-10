---
title: Spec Kit e SpecKit — o SDD do MJRP
aliases: [spec-kit, speckit, SpecKit, artefatos do speckit, uat, homologacao, homologação, constitution duas camadas]
summary: as três camadas com o mesmo nome (Spec Kit do GitHub, SpecKit do MJRP, uso real por projeto), a lista única de 9 artefatos e onde cada um mora no grafo de requisitos, o que foi fundido de propósito, e as duas extensões do MJRP — PRD com o mapa dos requisitos (do BMAD) e uat.md
tags: [kernel, sdd, speckit, metodo]
status: firme
atualizado: 2026-10-09
fontes: [github/spec-kit, BMAD, feedback-from-other-projects/spec-kit, feedback-from-other-projects/speckit-artifact-reconciliation]
---
<!-- kernel do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
**SpecKit** é a adaptação do MJRP ao Spec Kit do GitHub: os **9 documentos vivos** de `docs/specs/` — a cadeia `prd → spec → plan → tasks → uat`, em que cada um deriva do anterior (os requisitos são nós, um arquivo cada, e o PRD é o mapa deles; spec, plan e tasks moram na pasta de cada feature), mais o contexto durável que a cadeia consulta, `constitution`, `arch`, `data-model` e `design-system`. Três coisas têm o mesmo nome e confundi-las gera achado errado: **Spec Kit** (com espaço) é o método original do GitHub, `constitution → specify → plan → tasks → implement`; **SpecKit** (sem espaço) é esta adaptação; e o **uso real de cada projeto**, que pode acrescentar arquivos de apoio (um diagrama, uma planilha) sem que isso mude a lista.

## Details

### 1. A lista única — decidida em 17/09/2026
Até 16/09 o glossário dizia 6 artefatos e a skill `mjrp-sdd-speckit` (hoje `mjrp-specifying-sdd-artifacts`) dizia 7, e nenhum dos dois citava `prd.md`, que os projetos usavam. A reconciliação:

| Artefato | Papel | Origem |
|---|---|---|
| `prd.md` | o que o produto é, para quem, e o que **não** é; carrega os épicos (cada um serve a um resultado do ROADMAP) e o **mapa dos requisitos**: um embed por nó de `requirements/<ID>-<slug>.md` (`!S-07-import-the-card-statement`), no formato do projeto (story, caso de uso ou EARS) | BMAD (não existe no Spec Kit; ver §3) |
| `spec.md` | o quê e por quê de uma feature, em `features/Fxx-slug/`: importa os nós que entrega (`imports`), REQ locais, critérios de sucesso | Spec Kit (`/specify`) |
| `plan.md` | o como: arquitetura, componentes, dependências | Spec Kit (`/plan`) |
| `tasks.md` | a ordem de execução, tarefa a tarefa, verificável — cada TASK implementa um REQ (`implements`) | Spec Kit (`/tasks`) |
| `uat.md` | o aceite pelo humano depois do deploy — issues, status, OK de fechamento | **extensão do MJRP** (ver §4) |
| `constitution.md` | o delta de stack do projeto sobre o `PRINCIPLES.md` herdado (ver §5) | Spec Kit, com escopo estreitado |
| `arch.md` | a arquitetura real (não a aspiracional) | MJRP |
| `data-model.md` | entidades, relações, persistência | Spec Kit (fase 1 do `/plan`) |
| `design-system.md` | tokens e componentes — a fonte de verdade visual | MJRP (dono: skill `mjrp-defining-design-systems`) |

Os cinco primeiros são **a cadeia**: desde a S-63 ela é um grafo — nós com ID estável e arestas tipadas (página [[requirements-graph]]) — e o sensor do grafo (`requirements_graph_check.py`) confere órfão, aresta quebrada e cardinalidade; o `SDD_chain_artifacts_check.py` foi aposentado em 05/10 (S-77). Os quatro últimos são **contexto durável**: a cadeia os consulta, não deriva deles. Os estados observáveis que os requisitos apontam (`info-arch.md`, `behavior.md`) são do design e do grafo, não desta lista.

**No PDLC em loops** ([[pdlc-loops]] §5), `spec.md`, `plan.md` e `tasks.md` são etapas do Delivery: cada uma avança
quando a sua checagem passa (o cruzamento, a cobertura, o sensor do grafo). A aprovação do humano em cada uma só vale onde
o contrato do projeto a liga (`gates:`); o padrão é aprovar só o «Pronto para construir» — os requisitos Ready.

### 2. O que foi fundido, de propósito
`research.md`, `contracts/`, `quickstart.md` e `checklists/` do Spec Kit oficial **não são arquivos** no MJRP. O conteúdo vive como **seções opcionais e recomendadas** nos templates: *Research* e *Contracts* em `plan.md`; *Quickstart* (validação manual logo após implementar) e *Checklist de requisitos* em `tasks.md`. Cada projeto usa se precisar. Isto é decisão, não omissão — antes de 17/09 a fusão existia na prática e não estava escrita em lugar nenhum.

### 3. PRD e requisitos — o que veio do BMAD
O Spec Kit trata `spec.md` como o PRD ("*the source that generates implementation*") e não tem documento de produto nem de backlog. O MJRP fundiu o Spec Kit com a regra do BMAD: o PRD existe quando mais de um Epic — no MJRP, mais de um agente — não pode divergir; desde 03/10/2026 ele também **carrega os requisitos**, no formato declarado no contrato (`requirements.format`) — o `story.md` saiu da cadeia; desde 04/10/2026 cada requisito é um nó em `docs/specs/requirements/` (desde 09/10, `<ID>-<slug>.md` — [[requirements-graph]]) e o PRD guarda o mapa (um embed por nó, sob o épico). Quando o produto muda, o PRD muda junto — PRD com data velha é charter.

### 4. UAT / Homologação — a extensão do MJRP
O Spec Kit termina no *implement*: os *Acceptance Scenarios* do `spec.md` são pré-implementação e o `quickstart.md` é validação logo depois, não aceite continuado. O mercado resolve isso com plano de UAT, casos de teste, log de defeitos e termo de aceite com "aceite condicional" (disposição por defeito: corrigir antes, adiar, aceitar como está). O MJRP começa pela **versão mínima**: `uat.md` é um rastreador das issues da **etapa Homologação** da fase Release — as que o humano (MJRP) acha usando o produto e as que juízes e agentes abrem, cada uma na sua trilha (Humano · Agente) —, cada item com contexto (a versão, a feature), tipo (*Bug*, *Melhoria* ou *Tech debt*), status e o **OK do humano** (ou, na trilha do agente, a reconferência) que confirma o fechamento. A cadeia inteira está na figura !A cadeia do Spec Kit. Sem plano nem casos de teste. É o sexto elo da cadeia e pode ser declarado como gate no contrato.

### 5. Constitution — duas camadas
`PRINCIPLES.md` do harness é **universal** e herdado por todo projeto; `docs/specs/constitution.md` do projeto o **estende** com o que é específico da stack (padrões a seguir e evitar, versões, débito técnico conhecido), nas normas do Spec Kit — e **nunca reescreve** um princípio. O gate que faltava, e passou a existir em 17/09: no Gate 2 da skill `mjrp-ensuring-sdd` (antes `mjrp-sdd`), `plan.md` é checado contra os dois — o "Constitution Check" do Spec Kit original, que o MJRP não tinha.

### 6. O que não muda a lista
Arquivo de apoio que um projeto cria para si (`roadmap-diagrams.md`, uma planilha de dados de referência) é do projeto, não do SpecKit: não entra na lista, não entra na cadeia, não precisa ser mencionado no harness.

## History
- **2026-10-30 20:44** · O `uat.md` descrito como a etapa Homologação da fase Release, com as duas trilhas e os tipos Bug, Melhoria e Tech debt; a figura `spec-kit.png` citada (P1-1 do juiz da F63).
- **2026-10-13 19:00** · O `prd.md` não tem mais o caso do subprojeto do harness (ADR-0020): todo projeto carrega os épicos dele.
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: nome do nó `<ID>-<slug>.md` e o embed com o nome inteiro; no subprojeto do harness o `prd.md` traz as stories por release (o épico é o `parent_epic`); o `SDD_chain_artifacts_check.py` aparece como aposentado (05/10, S-77), não como em uso.
- **2026-10-07 20:29** · Onda E do PDLC em loops: spec, plan e tasks são estações do Delivery; aprovação do humano só onde o `gates:` do contrato liga — o padrão é aprovar só o contrato.
- **2026-10-04 17:38** — MJRP (S-63, passo 11): a lista não muda; muda onde cada artefato mora — requisitos como nós em `requirements/`, o PRD como mapa, spec/plan/tasks em `features/Fxx-slug/` ligados por `imports`, `implements` e `verified_by`; o sensor do grafo confere a cadeia; o `SDD_chain_artifacts_check.py` fica para os filhos não migrados (S-77).
- **2026-10-04 00:00** — MJRP (S-62): os requisitos passam para o PRD, por épico, em qualquer formato (user story, caso de uso, EARS); o `story.md` sai — a lista vai de 10 para 9 artefatos e a cadeia fica `prd → spec → plan → tasks → uat`. Projetos ainda não migrados seguem com o `story.md` até o kernel ser atualizado em cada um.
- **2026-09-17 14:32** — Reconciliação do BACKLOG #59, decidida pelo MJRP item a item: lista de 10 (9 + `uat.md`); fusão de research/contracts/quickstart/checklists declarada como seções opcionais; duas camadas da constitution nomeadas e o gate criado; `uat.md` como issue tracker mínimo com OK humano; arquivo de apoio de projeto fora da lista. Página promovida ao kernel a partir do rascunho `feedback-from-other-projects/spec-kit.md` (16/09).
- **2026-09-16 19:39** — Rascunho criado no `mjrp-fin-control-2026-27` a pedido do MJRP, com a pesquisa em fontes primárias do Spec Kit; movido para o harness às 20:14 com os 5 achados de divergência.

## Fontes
- [github/spec-kit — README](https://github.com/github/spec-kit) · [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md) · [github.github.io/spec-kit — Concepts](https://github.github.io/spec-kit/concepts/sdd.html)
- [Issue #1527 — pedido de `/speckit.prd`](https://github.com/github/spec-kit/issues/1527)
- UAT no mercado: [Marker.io — UAT templates](https://marker.io/blog/user-acceptance-testing-template) · [Bestest — UAT sign-off](https://getbestest.com/blog/uat-sign-off-checklist/) · [BMAD — test completed work](https://docs.bmad-method.org/build/test-completed-work/)
