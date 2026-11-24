---
id: CM-0011
item: arch-critique
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0011 · arch-critique@0 → arch-critique@1

## Por que

A ADR nasce `Proposed` e a `mjrp-critiquing-architecture` a julga antes de ir ao MJRP. O fin-control tem ADRs e nenhuma crítica de arquitetura.

Nasceu de: a regra da ADR no AGENTS.md (crítica antes do aceite); auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes).

## O que muda

- ao menos um `reports/audits/*architecture-audit*.md`.

## O que o filho faz

1. `mjrp-critiquing-architecture` (corte Brownfield): auditar a arquitetura e as ADRs vigentes; o relatório vai para `reports/audits/`.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0011` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `arch-critique`.

## Quando não se aplica

Projeto sem ADR; nível `minimal`.
