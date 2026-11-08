---
id: CM-0091
item: visual-sensor
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0091 · visual-sensor@3 → visual-sensor@4

## Por que

UAT-418, 2026-10-30. A reconferência independente do lote F57, F61 e F132 achou dois furos na trava visual do merge (P2-2 e P2-3), e uma sessão de feature os encontrou na prática. Primeiro: `git merge main` dentro de um ramo de feature pedia o veredito visual (ou o Touch ID) por um trabalho que a `main` já tinha. Segundo: um merge na `main` recusado pelo `pre-merge-commit`, ou que parou num conflito, e foi fechado com `git commit` não passava pela trava, porque o git não roda o `pre-merge-commit` nesse caminho.

## O que muda

- o `visual_gate.py --hook` julga só o merge cuja ponta é a `main`. Em outro ramo, ele diz por que não julga e passa;
- quando o `GIT_REFLOG_ACTION` não nomeia o merge, o `--hook` lê as revisões do `MERGE_HEAD`;
- o hook `pre-commit` roda o `visual_gate.py --hook` no commit que fecha um merge na `main` (com `MERGE_HEAD`). Sem o veredito visual, ou sem o Touch ID na via rápida, o commit é recusado;
- o `check` do item não muda.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`: traz o `visual_gate.py` e o `pre-commit` novos.
2. Acrescenta `CM-0091` a `conformance.applied`, se quiser registrar a nota.

## Como se confere

`python3 mjrp-scripts/visual_gate_selftest.py` sai 0, com os três casos da UAT-418, e `conformance_check.py . --gaps` não lista `visual-sensor`.

## Quando não se aplica

Projeto sem tela, como na CM-0007.
