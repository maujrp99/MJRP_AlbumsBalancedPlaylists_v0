---
id: CM-0157
item: process-sensors
from: 12
to: 13
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0157 · process-sensors@12 → process-sensors@13

## Por que

A trava `adr_on_main.py` (F300) roda no pre-commit e não declarava no `process_sensors.json` a skill que ensina o passo que ela cobra, e o autoteste do kernel (`new_project_selftest`) reprovava (decisão do MJRP, D-03, em 2026-11-19).

## O que muda

- O `taught_by` do `process_sensors.json` ganha `adr_on_main.py: mjrp-recording-decisions` (a skill já nomeia o script ao lado do passo). O check do item **não muda**.

## O que o filho faz

1. Traz o kernel (`python3 mjrp-scripts/new_project.py <este projeto> --refresh-kernel`).
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0157` e acrescenta `CM-0157` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0157` sai 0; `python3 mjrp-scripts/new_project_selftest.py` sai 0.

## Quando não se aplica

Projeto que não é `code-app`.
