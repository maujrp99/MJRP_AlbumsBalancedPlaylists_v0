---
id: CM-0121
item: process-sensors
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0121 · process-sensors@1 → process-sensors@2

## Por que

A F200 (todo projeto tem o seu design system no Claude, S-215) trouxe um sensor novo, o `design_system_mirror_check.py`: o juiz que confere, antes de publicar, se o espelho do design system no Claude bate com o `docs/specs/design-system.md` e veio da `main`. Nenhum hook o chama: quem o roda é a `mjrp-defining-design-systems`, logo antes de publicar. O manifesto dos sensores (`mjrp-scripts/process_sensors.json`) ganha esse lugar, `skill`, para o sensor que a skill dona roda à mão.

## O que muda

- O `process_sensors.json` ganha o sensor `design_system_mirror_check.py`, com `runs: [skill]` e `skill: mjrp-defining-design-systems`, e o valor `skill` em `runs_values`.
- O script chega ao filho com o kernel. O contrato não precisa declarar nada: o check do item não muda.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` uma vez, para trazer o manifesto novo e o script.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0121`, e acrescenta `CM-0121` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0121` sai 0, e `mjrp-scripts/design_system_mirror_check.py` existe no filho (o I5 do doctor, herança do `PRINCIPLES.md`, reprova o sensor do manifesto que falta no disco).

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele). O script chega com o refresh do mesmo jeito.
