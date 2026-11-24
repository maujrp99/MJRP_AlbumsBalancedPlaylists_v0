---
id: CM-0008
item: info-arch
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0008 · info-arch@0 → info-arch@1

## Por que

O `info-arch.md` é onde a tela vira inventário (UI-xx), estados com block ID e protótipos aprovados; os requisitos apontam para ele. O fin-control tem 65 requisitos e 12 protótipos e nenhum inventário.

Nasceu de: auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes); sem ele, cinco requisitos do fin-control (S-48, S-49, S-50, S-57, S-58) não avançam.

## O que muda

- `docs/specs/info-arch.md` com o inventário `UI-xx` do protótipo vigente, os estados e os protótipos aprovados.

## O que o filho faz

1. `mjrp-designing-ui` (modo converge): eleger o protótipo vigente de cada tela; escrever o inventário, os estados e o `info-arch.md`; os wireframes saem na mesma rodada (CM-0009).
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0008` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `info-arch`; o W11 e o W14 do doctor passam a valer.

## Quando não se aplica

Projeto sem tela.
