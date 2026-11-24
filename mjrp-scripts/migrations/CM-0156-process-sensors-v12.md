---
id: CM-0156
item: process-sensors
from: 11
to: 12
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0156 · process-sensors@11 → process-sensors@12

## Por que

O orquestrador delegava sessões sem mandar marcar o estado, e o board mostrava «Priorizada» para trabalho que rodava; o brief escrito à mão esquecia, a cada vez, um passo do fecho (regras 39 e 40 do orquestrador, F295).

## O que muda

- Chega `state_first_check.py`, que o `pre-commit` chama: recusa o commit num worktree de feature cujo card não está em «Em andamento» (ou em «Esperando…»), e dá o comando que move o card. Entra em `VENDORED_FILES` e no `process_sensors.json` (`runs`: `pre-commit`; `taught_by`: `mjrp-implementing-tasks`). O hook `PreToolUse` `hooks/state_first_guard.py` o usa para recusar a primeira escrita (entra em `PLATFORM_HOOKS` e em `.claude/settings.json`).
- Chega `delegation_brief.py`, que gera o brief de delegação de uma feature. O check do item **não muda**.

## O que o filho faz

1. Traz o kernel (`python3 mjrp-scripts/new_project.py <este projeto> --refresh-kernel`): chegam o juiz, o hook, o autoteste, o gerador de brief e o `pre-commit` atualizado.
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0156` e acrescenta `CM-0156` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0156` sai 0; `python3 mjrp-scripts/state_first_check_selftest.py` sai 0.

## Quando não se aplica

Projeto que não é `code-app`.
