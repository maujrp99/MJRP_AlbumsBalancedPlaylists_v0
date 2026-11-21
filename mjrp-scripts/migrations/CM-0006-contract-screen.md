---
id: CM-0006
item: contract-screen
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0006 · contract-screen@0 → contract-screen@1

## Por que

O A2 do doctor e o hook `pre-merge-commit` leem o `screen:` do contrato para saber onde a tela mora. Sem ele, usam uma heurística — e o fin-control, com a tela num único `DashboardUI.html`, nem chega a ser perguntado.

Nasceu de: ADR-0017 do harness, 2026-10-12; auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes).

## O que muda

- o contrato declara `screen:` (lista de prefixos terminados em `/`, caminhos exatos ou globs).

## O que o filho faz

1. `mjrp-pdlc-bootstrap` (modo conform): declarar `screen:` no `.mjrp-project.yml` com onde a tela mora.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0006` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `contract-screen`.

## Quando não se aplica

Projeto sem tela.
