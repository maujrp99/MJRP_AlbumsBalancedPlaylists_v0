---
id: CM-0143
item: report-names
from: 8
to: 9
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0143 · report-names@8 → report-names@9

## Por que

A F273 (UAT-589) fez o teste de navegador do bug, no site compilado, valer como reconferência visual no ramo de conserto. O relatório dele é um tipo novo, e o filho não pode inventar tipo.

## O que muda

- `mjrp-scripts/report_types.json`: o tipo **`bug-browser-test`** — pasta `audits`, tema `parity`, dona a `mjrp-ensuring-quality`; `type: bug-browser-test` no cabeçalho, com `verdict`, `p0`, `site: compiled` e `test:`.
- O check do item **não muda**.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `report_types.json` novo.
2. Nada a reescrever: o tipo é novo.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0143` e acrescenta `CM-0143` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0143` sai 0.

## Quando não se aplica

Projeto sem `reports/`.
