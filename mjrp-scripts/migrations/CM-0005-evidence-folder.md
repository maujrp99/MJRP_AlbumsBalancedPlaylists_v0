---
id: CM-0005
item: evidence-folder
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0005 · evidence-folder@0 → evidence-folder@1

## Por que

A regra de screenshots (`structure_rules.json`) manda a prova de entrega para `reports/evidence/<TASK-ID>/`. O fin-control tem features e não tem a pasta.

Nasceu de: auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes).

## O que muda

- `reports/evidence/` existe e recebe a evidência de cada feature.

## O que o filho faz

1. `mjrp-implementing-tasks`: criar `reports/evidence/` e passar a gravar a prova de cada task nela.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0005` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `evidence-folder`.

## Quando não se aplica

Projeto sem features.
