---
id: CM-0007
item: visual-sensor
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0007 · visual-sensor@0 → visual-sensor@1

## Por que

A ADR-0017 pôs o sensor de paridade visual (`sensors.visual`, `when: pre-merge`) no contrato dos projetos com tela. O A2 só cobra quando há referência visual aprovada; este item cobra a declaração em todo projeto com tela, e deixa o A2 julgar se o sensor é alcançável.

Nasceu de: ADR-0017 do harness, 2026-10-12 (o Control Center 1.0 chegou ao UAT longe do protótipo, com todos os sensores verdes).

## O que muda

- o contrato declara `sensors.visual` com o kit `mjrp-scripts/visual_parity/` (que chega com o `--refresh-kernel`).

## O que o filho faz

1. `mjrp-pdlc-bootstrap` (modo conform): declarar `sensors.visual` (`cmd`, `config`, `when: pre-merge`), apontando o juiz do projeto para o kit.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0007` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `visual-sensor`; o A2 do doctor passa.

## Quando não se aplica

Projeto sem tela.
