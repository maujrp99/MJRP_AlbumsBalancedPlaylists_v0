---
id: CM-0012
item: adr-names
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0012 · adr-names@0 → adr-names@1

## Por que

Nome de arquivo é inglês (o que a máquina lê é inglês). As ADRs 0001 a 0003 do fin-control têm nome em português.

Nasceu de: a regra de nomes do CLAUDE.md (2026-09-09); auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes).

## O que muda

- `docs/decisions/NNNN-<kebab-em-inglês>.md`.

## O que o filho faz

1. Renomear com `git mv` e reescrever os links que apontam para o nome antigo (nada se apaga sem cópia). O conteúdo em prosa continua em português.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0012` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `adr-names`.

## Quando não se aplica

Projeto sem `docs/decisions/`. Limite: a lista `deny_words` é heurística (radicais comuns em português), não um dicionário.
