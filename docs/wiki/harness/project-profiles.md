---
title: Perfis de projeto
aliases: [project-profiles, perfis, perfil, greenfield, brownfield, content, caminhos de adoção, três modos de uso, path a, path b, path c]
summary: os três perfis que o harness atende — e a distinção que o README apagava, entre PERFIL (o que o projeto entrega) e CAMINHO DE ADOÇÃO (por que porta ele entra)
tags: [harness, fundamento]
status: firme
atualizado: 2026-10-09
fontes: []
---
<!-- kernel do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
**Perfil** é o que o projeto **entrega**, e é o que o campo `profile:` do contrato declara:
`code-app` (software), `content` (vault, dossiê, pipeline editorial) ou `meta` (o próprio
harness). **Caminho de adoção** é por qual porta o projeto entra — *greenfield* do zero,
*brownfield* sobre código que já existe. **Não são a mesma coisa**, e tratá-los como se fossem é
o que fez o `README.md` ensinar um schema que o `doctor.py` não valida.

## What it is

### A distinção que faltava

O README § 2 chamava Greenfield, Brownfield e Content de "os três modos de uso", lado a lado. Mas
eles não são do mesmo tipo:

```
PERFIL              o que o projeto entrega       vira o campo profile: do contrato
  code-app            software
  content             conteúdo
  meta                o próprio harness (a fonte das skills)

CAMINHO DE ADOÇÃO   por qual porta se entra       não vai para o contrato — some depois
  greenfield          do zero
  brownfield          sobre o que já existe
```

Greenfield e brownfield são **duas portas para o mesmo perfil**. Elas divergem só na entrada e
**convergem no Delivery** ([[pdlc-loops]]) — dali em diante, o fluxo é idêntico. Um projeto brownfield deixa
de ser brownfield assim que termina o retrofit; um projeto `content` nunca deixa de ser `content`.

> **Consequência prática.** O contrato declara `profile:`, não o caminho. Depois do bootstrap,
> "este projeto é brownfield" é fato histórico, não configuração — vive no `log.md`, não no
> `.mjrp-project.yml`.

### `code-app` — o perfil de software

A cadeia de derivação é a espinha: **todo artefato deriva de um pai**, e é isso que impede buraco,
duplicação e drift.

```
VISION.md → ROADMAP.md (resultados) → prd.md (épicos; requisitos em requirements/) → protótipo + info-arch (+ wireframes)
          → arch.md / data-model.md (ADR + crítica) → design-system.md
                                                                                    │
                     os requisitos Ready («Pronto para construir») entram no Delivery, feature a feature ↓
                        spec.md → plan.md → tasks.md → src/ + tests/
```

O ciclo é o [[pdlc-loops]]: Fundação → Intake (via padrão · via rápida) → Discovery (Explorar · Enquadrar ·
Desenhar) → «Pronto para construir» → Delivery → UAT → Learn; os gates opcionais moram em `gates:` do contrato do projeto.

**O processo escala; o invariante não.** O caminho mínimo é Fundação → constitution → um requisito SDD
enxuto → loop de build → handoff. As fases avançadas entram quando o projeto as merece — trabalho
multiagente, complexidade de UI, feature de risco.

### A porta *brownfield* — refletir a realidade, não o ideal

A diferença que define: em vez de criar artefato do zero, começa **entendendo e documentando o que
já existe**.

> **Regra de ouro:** documente o projeto como ele **é** — stack atual, padrões em uso, dívida
> conhecida — não como **deveria ser**. Um agente que lê uma `constitution.md` idealizada e
> encontra outra coisa no código produz lixo. Inconsistência vai para `## Legacy Notes`.
> **Acrescentar sem quebrar:** nunca reorganizar código que funciona só para caber na estrutura.

Quatro fases antecedem o ciclo normal: **0 Audit** (inventário + gaps) → **0.5 Extract Foundation**
(identidade extraída do que existe) → **1B Retrofitting** (documentar features no nível certo) →
**2B Ativar** (configs de IA apontando para os artefatos novos). Depois disso, entra nos loops: toda demanda nova
passa pelo Intake, e requisito já Ready vai direto ao Delivery.

O esforço do retrofit escala com o projeto: **mínimo** (constitution + lista de features, 1–2h) ·
**padrão** (+ spec, arch, data-model, 4–6h) · **completo** (tudo + design-system, 1–2 dias).

> **Spec retrofitada imprecisa é pior que spec nenhuma** — ela engana todo agente que a lê. É por
> isso que o gate ⛔ Retrofit valida contra o código, não contra a intenção.

E o histórico: **nunca reescrever o que já foi commitado.** Conventional Commits valem daqui para
frente; a adoção ganha uma tag (`v0-harness-adoption`); branches existentes ficam até o merge
natural.

### `content` — o processo mora no TIPO, nunca no item

É a única ideia estrutural que separa este perfil do outro:

```
code-app    uma feature  → spec → plan → tasks → src/        (repete por FEATURE)
content     um tipo      → content-spec → uma SKILL produtora (repete por ITEM, sem processo)
```

Você especifica **uma vez** o que um dossiê de música sempre contém — seções, política de fontes,
barra de qualidade, formatos, destinos. Essa especificação é **compilada numa skill**. Todo dossiê
depois disso é uma **execução**, não um projeto.

> **Corolário:** num projeto de conteúdo, **as skills do `mjrp-personal/` são o código-fonte**. Mudar
> como um dossiê se parece é trabalho de `mjrp-crafting-skills` — não de reescrever os dossiês
> antigos.

Três gates, **todos no nível do tipo**: ⛔ **Identity** (o que entra e o que não entra no projeto)
· ⛔ **Map** (taxonomia e frontmatter — renomear pasta é barato hoje e caro com 200 arquivos)
· ⛔ **Spec** (a spec vira skill; um defeito nela se multiplica por N itens).

**Produzir um item não tem gate.** Se você se pegar aprovando cada dossiê, ou a spec está
incompleta ou o tipo está errado — conserte lá, não aqui. Aprovar item a item é a *build trap*,
um álbum por vez.

## How MJRP uses it

- **O contrato declara o perfil.** `profile: code-app | content | meta` no `.mjrp-project.yml`, e o
  `doctor.py` valida contra esse domínio (I1). O caminho de adoção não entra no contrato.
- **A `mjrp-pdlc` orquestra**, e é a fonte operacional: esta página é o mapa
  conceitual, ela é o passo a passo. Onde as duas divergirem, a skill vence.
- **A `mjrp-pdlc-onboarding` ramifica por perfil** na Phase −1 — Modo Código × Modo Conteúdo.
- **⚠️ O que ainda não bate.** O `README.md` § 2 ensina `mjrp_project:` com `type:` e `path:`; o
  contrato real deste repositório é `mjrp_harness:` com `profile:`. **Dois schemas com o mesmo
  nome de arquivo** — está entre os *Candidatos* do `docs/specs/prd.md` e é decisão do MJRP. Enquanto não se resolve, o que o
  `doctor.py` valida é o `profile:`.

## History
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: a cadeia do `code-app` segue a ordem de hoje (ROADMAP antes do PRD, protótipo e info-arch, arquitetura com ADR e crítica, design system); a tabela de fases 0–6 deu lugar ao [[pdlc-loops]]; a tag de adoção é `v0-harness-adoption`; a ADR citada passa a dizer "do harness".
- **2026-10-07 20:29** · Onda E do PDLC em loops (`design/proposals/pdlc-loops-migration-plan.md`): a numeração antiga de fases deu lugar às estações e ao contrato de [[pdlc-loops]] §11.
- **2026-10-04 00:00** — MJRP (S-62): os requisitos passam para o PRD, por épico, em qualquer formato; o `story.md` sai da cadeia.

> A decisão mora na página do assunto que ela muda, com data (ADR-0008). As entradas abaixo
> vieram **inteiras** do `MEMORY.md` na migração do BACKLOG #28a (09/09/2026) — nada foi
> condensado na mudança.
- **2026-09-09 18:40** · **Perfil ≠ caminho de adoção.** `code-app | content | meta` é o que o
  projeto **entrega** e vai para o `profile:` do contrato; *greenfield* e *brownfield* são as duas
  **portas** para o mesmo perfil e convergem na FASE 3 — depois do retrofit o projeto deixa de ser
  brownfield. O README chamava os três de "modos de uso", lado a lado, e era essa confusão que
  fazia ele ensinar um schema (`type:`/`path:`) que o `doctor.py` não valida.
- **2026-09-10 19:13** · **`mjrp-project-lifecycle` tinha o mesmo bug que esta página já
  documentava no README.** Step 0 ensinava `mjrp_project: type/path` — schema que o `doctor.py`
  nunca validou. Corrigido para `mjrp_harness: profile:`, com nota explícita de que o caminho de
  adoção não é campo do contrato. Junto: refs a `README.md §2.1-2.3` (condensadas nesta página em
  09/09) trocadas por um ponteiro pra cá; nomes de AI Platform (Stitch/Cowork/Claude Code) na
  FASE 2c viraram termo agnóstico.

## Related
[[harness-elements]] · [[terms]] · [[vision-document]] · [[pdlc-loops]] · ADR-0002 do harness (`docs/decisions/`)
