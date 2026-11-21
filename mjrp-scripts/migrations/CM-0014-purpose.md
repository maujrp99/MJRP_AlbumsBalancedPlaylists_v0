---
id: CM-0014
item: purpose
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0014 · purpose@0 → purpose@1

## Por que

A onboarding abre a síntese pelo propósito do projeto; num projeto de conteúdo, ele mora no `VISION.md` ou no `Core/PROJECT_CONTEXT.md`.

Nasceu de: a onboarding abre pelo propósito (perfil content da bootstrap).

## O que muda

- um dos dois arquivos existe e declara o propósito.

## O que o filho faz

1. `mjrp-pdlc-bootstrap` (modo conform): escrever o propósito, com o MJRP, no `VISION.md`.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0014` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `purpose`.

## Quando não se aplica

Projeto `code-app` (o catálogo cobre por perfil).
