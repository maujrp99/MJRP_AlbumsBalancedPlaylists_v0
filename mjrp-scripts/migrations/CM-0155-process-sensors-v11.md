---
id: CM-0155
item: process-sensors
from: 10
to: 11
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0155 · process-sensors@10 → process-sensors@11

## Por que

O merge da `main` na F304 entrou com os blocos de conflito do git no `uat.md` e no `## Now` do app, e nenhum hook do commit recusou (UAT-617, F305).

## O que muda

- Chega `conflict_marker_check.py`, que o `pre-commit` e o `pre-merge-commit` chamam: recusa, com arquivo e linha, o marcador de conflito nas linhas que o commit traz. Entra em `VENDORED_FILES` e no `process_sensors.json` (`runs`: `pre-commit` e `pre-merge-commit`). O check do item **não muda**.

## O que o filho faz

1. Traz o kernel (`python3 mjrp-scripts/new_project.py <este projeto> --refresh-kernel`): chegam o sensor e os dois hooks de git atualizados.
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0155` e acrescenta `CM-0155` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0155` sai 0; `python3 mjrp-scripts/conflict_marker_check_selftest.py` sai 0.

## Quando não se aplica

Projeto que não é `code-app`.
