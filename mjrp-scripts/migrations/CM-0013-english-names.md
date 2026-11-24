---
id: CM-0013
item: english-names
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0013 · english-names@0 → english-names@1

## Por que

A regra de nomes vale para arquivo e pasta. As páginas da wiki do fin-control (`assinaturas`, `cartao-*`, `esteira-cartoes`…) têm nome em português.

Nasceu de: a regra de nomes do CLAUDE.md; auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes).

## O que muda

- páginas de `docs/wiki/` com nome em inglês.

## O que o filho faz

1. `mjrp-syncing-docs`: renomear com `git mv`, reescrever os `[[wikilinks]]` e os aliases; o `index.md` da wiki segue o novo nome.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0013` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `english-names`.

## Quando não se aplica

Limite: heurística por lista de radicais (`deny_words`); pode não ver todo nome.
