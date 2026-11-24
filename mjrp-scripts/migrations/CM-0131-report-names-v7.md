---
id: CM-0131
item: report-names
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0131 · report-names@6 → report-names@7

## Por que

O MJRP pediu uma skill que julgue uma skill antes do uso, separada da que a escreve (S-224, F216, 2026-11-07): a `mjrp-critiquing-skills`. O relatório dela não cabia em nenhum tipo da lista — o `skill-verification` é a verificação de skills mudadas contra os cenários, sem skill dona —, e a revisão real de 7/11 já tinha saído com um tipo que não existia.

## O que muda

- `mjrp-scripts/report_types.json`: o tipo novo **`skill-critique`** — tema `harness`, pasta `audits`, dona a `mjrp-critiquing-skills`, dica de nome `skill-critique`.
- O modelo do relatório, `mjrp-skills/mjrp-sw-factory/reviewer/mjrp-critiquing-skills/templates/skill-critique.md`, entra nas fontes do padrão do item (ele declara o `type:` que o item cobra).
- O check do item **não muda**.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `report_types.json` novo.
2. Nada a reescrever: um relatório que já é a crítica de uma skill pode declarar `type: skill-critique`; o que declara outro tipo da lista continua valendo.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0131` e acrescenta `CM-0131` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0131` sai 0 (o mesmo check da v6).

## Quando não se aplica

Projeto sem `reports/` (`has_path:reports`).
