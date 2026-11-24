---
id: CM-0148
item: process-sensors
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0148 · process-sensors@6 → process-sensors@7

## Por que

A F271 subiu o `state` do Control Center à v8 e trouxe três arquivos de schema novos sem tocar os testes de compatibilidade: a `main` ficou com quatro testes vermelhos e o commit não mostrou nada (UAT-599, F289). Nada cobrava, no commit, que a subida de versão de um schema levasse os testes junto.

## O que muda

- O `process_sensors.json` ganha `schema_bump_check.py`, que roda no pre-commit: o commit que muda a `schema_version` de um `schemas/*.schema.json`, ou traz um schema novo, sem um arquivo de `tests/compat/` do mesmo app no mesmo commit, é recusado. Chega ao filho com o kernel; num filho sem `schemas/` ele não julga nada.
- O check do item não muda.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o sensor e o hook pre-commit novo.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0148` e acrescenta `CM-0148` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0148` sai 0; `python3 mjrp-scripts/schema_bump_check_selftest.py` sai 0 no harness.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
