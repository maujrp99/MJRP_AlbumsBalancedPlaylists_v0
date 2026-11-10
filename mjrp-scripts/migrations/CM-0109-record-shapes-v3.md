---
id: CM-0109
item: record-shapes
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0109 · record-shapes@2 → record-shapes@3

## Por que

A skill que julga a tela passou a se chamar **`mjrp-critiquing-ux-ui`** (era `mjrp-critiquing-ux`): o nome antigo escondia que ela julga também cor e tipografia. O MJRP aprovou manter uma skill só e renomeá-la em 2026-11-04 (F176, UAT-484). O molde `ux-audit` e a mensagem do sensor citam a skill dona do relatório.

## O que muda

- O cabeçalho de `review` do molde `ux-audit.md` (`## [<data>] review — mjrp-critiquing-ux-ui: <objeto> · <veredito>`) e a skill dona que o `record_shapes_check.py` cita para o `ux-audit` levam o nome novo.
- O check do item **não muda**.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `record_shapes_check.py` e o molde novos e o `retired_skills.json` com o nome antigo (`mjrp-critiquing-ux` → `mjrp-critiquing-ux-ui`).
2. Nada a reescrever: as entradas de `review` que o filho já tem no log guardam o nome do dia. A próxima passada da skill escreve o nome novo.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0109` e acrescenta `CM-0109` a `conformance.applied`.

Até o refresh nada quebra: o plugin antigo ainda chama a skill pelo nome antigo, e o novo chama pelo nome novo.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0109` sai 0 (o mesmo check da v2).

## Quando não se aplica

Projeto sem relatórios de UX em `reports/audits/`.
