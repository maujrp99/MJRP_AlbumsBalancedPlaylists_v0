---
id: CM-0154
item: process-sensors
from: 9
to: 10
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0154 · process-sensors@9 → process-sensors@10

## Por que

Uma trava nova entrou no `pre-commit` do kernel sem nenhuma skill mudar, e quem fazia o passo que ela cobra descobriu a regra na recusa do commit (UAT-618, F306). Nada ligava uma trava à skill que a ensina.

## O que muda

- O `process_sensors.json` ganha `taught_by`: para cada script que o `pre-commit`, o `commit-msg` ou o `pre-merge-commit` do kernel executa, a skill que ensina o passo que ele cobra (e que o nomeia no próprio texto) ou `none: <motivo>`. Quem confere é o autoteste do kernel, no harness. Nenhum sensor novo chega ao filho; o check do item **não muda**.

## O que o filho faz

1. Nada além de trazer o manifesto (`new_project.py --refresh-kernel`): a chave é lida no harness. Quando uma trava do filho recusar um commit, `taught_by` diz qual skill ensina o passo.
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0154` e acrescenta `CM-0154` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0154` sai 0; `python3 mjrp-scripts/new_project_selftest.py` sai 0 no harness.

## Quando não se aplica

Projeto que não é `code-app`.
