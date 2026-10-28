---
id: CM-0051
item: prd
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0051 · prd@0 → prd@1

## Por que

O `docs/specs/prd.md` é o que o produto é, para quem, e o que ele **não** é; é onde cada épico liga a um resultado do `ROADMAP.md` e onde os requisitos têm o mapa. Todo code-app em `process_level` `standard` ou `full` o tem (o guia do PRD da `mjrp-coaching-pm`, § *When to write one*) — e, até aqui, nada no catálogo o cobrava: o fin-control e o pedroso-incorp passaram por todos os juízes com um PRD sem as seções de épicos, entregue e candidatos.

Nasceu de: decisão do MJRP de 2026-10-17 23:02 (a pergunta «desde quando bootstrap é dono de artefato de produto, do conteúdo dele?»): quem cria o esqueleto (`mjrp-pdlc-bootstrap`) não é dono do conteúdo; o dono é a skill do papel, e o modelo e o guia moram com o dono. O `prd.md` passa a ser item do catálogo, com a `mjrp-coaching-pm` por dona do topo (os requisitos seguem da `mjrp-writing-reqs`).

## O que muda

- `docs/specs/prd.md` com as seções do guia, pelos títulos do modelo `templates/prd.md` da `mjrp-coaching-pm`: `## Objetivo e métricas`, `## Contexto e encaixe estratégico`, `## Personas e cenários`, `## Regras de negócio e restrições`, `## Fora de escopo`, `## Epics` (ou `## Épicos`), `## Entregue`, `## Candidatos`, `## Premissas e questões em aberto` e `## Requisitos por épico`. O check confere **os títulos**; o que está sob eles é do MJRP.

## O que o filho faz

1. `mjrp-coaching-pm`: para cada seção que falta, leia o que o projeto **já** diz (o `VISION.md`, o `ROADMAP.md`, o log, o README, os requisitos, o código) e traga ao MJRP, **um campo por vez, com a fonte**, o que a seção diria; ele responde com as palavras dele. O agente nunca escreve o texto de produto para o MJRP aprovar clicando em «(Recomendado)».
2. Seção que o MJRP diz que ainda não tem conteúdo (nada entregue, nenhum candidato): ponha o título e **uma linha honesta** que diga isso, com a data da resposta dele. Um título sem nada, ou um «a definir» no lugar do que o projeto já sabe, não vale.
3. Um PRD que já tem a seção sob outro título (`## Epics e entregas`, `## Épicos`): ajuste só o título; o conteúdo fica. As seções que existem e os requisitos embutidos não se tocam. **Épico que já está declarado em outro lugar do PRD (os `### EP-xx` com `serves::` sob `## Requisitos por épico`, por exemplo) não se copia:** a seção `## Epics` passa a ser a lista curta que aponta para eles (`[[EP-01]]`, estado e critério de saída), ou o título sobe para onde os épicos já estão — nunca duas fontes do mesmo épico.
4. Os requisitos sob cada épico seguem da `mjrp-writing-reqs`; este passo não os reescreve.
5. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0051` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `prd`; `conformance_check.py . --check-note CM-0051` sai 0.

## Quando não se aplica

Projeto `content` ou `meta`; code-app em `process_level: minimal` (o PRD dele é só a seção de requisitos, o guia do PRD § *When to write one*).
