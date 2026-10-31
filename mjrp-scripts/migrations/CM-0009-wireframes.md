---
id: CM-0009
item: wireframes
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0009 · wireframes@0 → wireframes@1

## Por que

O protótipo, o `info-arch.md` e os wireframes se movem juntos (hook `commit-msg` e W14). O fin-control não tem wireframe nenhum, e o W14 não cobra porque falta o `info-arch.md`.

Nasceu de: MJRP, 2026-10-09: protótipo, info-arch e wireframes andam juntos; auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes).

## O que muda

- `design/wireframes/` com ao menos um PNG por tela; a sincronia com o protótipo é do W14.

## O que o filho faz

1. `mjrp-designing-ui`: gerar os wireframes (PNG e SVG) na mesma rodada do `info-arch.md`.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0009` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `wireframes`; o W14 passa.

## Quando não se aplica

Projeto sem tela.
