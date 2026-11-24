---
id: CM-0153
item: process-sensors
from: 8
to: 9
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0153 · process-sensors@8 → process-sensors@9

## Por que

O modelo novo de uma skill entrou na `main` sem o catálogo canônico acompanhar e o learn-gate ficou vermelho para toda sessão (UAT-603, F297). A trava nova é só do harness: o filho não tem a árvore de skills nem o catálogo.

## O que muda

- O `process_sensors.json` declara `template_catalog_check.py` em `harness_only`, com o motivo. Nenhum sensor novo chega ao filho; o check do item **não muda**.

## O que o filho faz

1. Nada: não há arquivo novo para trazer. O manifesto muda só pelo registro do que é do harness.
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0153` e acrescenta `CM-0153` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0153` sai 0; `python3 mjrp-scripts/template_catalog_check_selftest.py` sai 0 no harness.

## Quando não se aplica

Projeto que não é `code-app`.
