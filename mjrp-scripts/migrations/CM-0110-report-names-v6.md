---
id: CM-0110
item: report-names
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0110 · report-names@5 → report-names@6

## Por que

A skill que julga a tela passou a se chamar **`mjrp-critiquing-ux-ui`** (era `mjrp-critiquing-ux`): o nome antigo escondia que ela julga também cor e tipografia. O MJRP aprovou manter uma skill só e renomeá-la em 2026-11-04 (F176, UAT-484). A lista dos tipos de relatório nomeia a skill dona de cada tipo.

## O que muda

- `mjrp-scripts/report_types.json`: o `owner_skill` do tipo **`ux-audit`** passa a ser `mjrp-critiquing-ux-ui`.
- O check do item **não muda**.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `report_types.json` novo e o `retired_skills.json` com o nome antigo (`mjrp-critiquing-ux` → `mjrp-critiquing-ux-ui`).
2. Nada a reescrever nos relatórios: o tipo e o nome do relatório não mudam, só a skill que o `report_types_check` aponta como dona.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0110` e acrescenta `CM-0110` a `conformance.applied`.

Até o refresh nada quebra: o plugin antigo ainda chama a skill pelo nome antigo, e o novo chama pelo nome novo.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0110` sai 0 (o mesmo check da v5).

## Quando não se aplica

Projeto sem `reports/` (`has_path:reports`).
