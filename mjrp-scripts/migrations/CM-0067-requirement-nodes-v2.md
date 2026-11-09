---
id: CM-0067
item: requirement-nodes
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0067 · requirement-nodes@1 → requirement-nodes@2

## Por que

O `fin-control` tinha uma feature de engenharia (a F06, um refactor planejado pela ADR-0004) sem requisito de produto, e criou a story S-66 só para a
feature ter o que importar; a juíza dos requisitos marcou o nó como forçado. O modelo do NFR dizia «nunca importado por uma feature», e o grafo recusava
o `imports` com NFR. A regra da dívida técnica já faz da violação de um NFR um item de Fix; faltava a feature que a paga importar o NFR.

Nasceu de: o feedback do `fin-control` de 2026-10-18 (ponto 3, `docs/wiki/feedback-from-other-projects/2026-10-18-fin-doctor-rejects-slows-and-s-node-coverage.md`).

## O que muda

- O modelo `templates/req-nfr.md` diz que o NFR não é importado por uma feature **de produto**; quem o importa é a feature `track: Fix` que paga uma
  `violates:: [[NFR-xx]]`, sem story inventada. O modelo `spec.md` (`feature-track`) e o `feature-artifacts.md` (`evidence-folder`, CM-0068) dizem o mesmo;
  o `spec.md` é modelo do item `feature-track`, que não sobe de versão.
- O `requirements_graph_check.py` aceita o `imports` só com NFR (ou vazio, com `violates:: [[constitution#N]]` de um artigo que existe) na feature `track: Fix`
  que tem `fixes:` e um `violates::` do mesmo NFR, com o NFR vivo (regra `fix_nfr_import`); fora da Fix o NFR importado segue reprovando. O check do item **não muda**.

## O que o filho faz

Nada obrigatório. Se há uma feature de engenharia, hoje presa a uma story forçada: **primeiro** abra a issue de dívida no `uat.md` (com `violates:: [[NFR-xx]]`); **depois** a
feature vira `track: Fix`, com `fixes: [UAT-nn]` dessa issue, `violates:: [[NFR-xx]]` na spec (fora de bloco de código) e `imports:` o NFR que ela serve; a story forçada
sai (`Cancelled`). A feature Fix tira a release da rodada da issue, por isso o `fixes:` não pode faltar. No `fin-control`: abrir a issue da F06 com `violates:: [[NFR-08]]`,
e a F06 passa a `track: Fix`, `fixes: [UAT-nn]`, importando o NFR-08.
Sem feature assim, só registre a nota: acrescente `CM-0067` a `conformance.applied`, sem rodada.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0067` sai 0 (o mesmo check da v1).

## Quando não se aplica

Projeto sem nós de requisito em `docs/specs/requirements/*/` (`has_path:docs/specs/requirements/*/*.md`).
