---
id: CM-0010
item: design-system
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0010 · design-system@1 → design-system@2

## Por que

O `design-system.md` do harness declara na seção Themes as paletas que o produto troca (ou o tema único). O fin-control tem 12 paletas no app e o documento não declara nenhuma.

Nasceu de: Control Center: o produto troca de paleta; auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes).

## O que muda

- seção `## Themes` no `docs/specs/design-system.md`, apontando a biblioteca de paletas do kernel.

## O que o filho faz

1. `mjrp-defining-design-systems`: reescrever o documento a partir do protótipo aprovado; declarar os temas (as 12 paletas do fin-control) na seção Themes.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0010` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `design-system`.

## Quando não se aplica

Projeto sem tela.
