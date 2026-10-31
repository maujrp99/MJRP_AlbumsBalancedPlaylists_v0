---
id: CM-0015
item: content-map
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0015 · content-map@0 → content-map@1

## Por que

O scaffold do perfil `content` cria o `CONTENT_MAP.md`; projetos de conteúdo anteriores ao scaffold não o têm.

Nasceu de: o scaffold do perfil content (new_project.py).

## O que muda

- `CONTENT_MAP.md` na raiz, descrevendo onde mora cada tipo de conteúdo.

## O que o filho faz

1. `mjrp-pdlc-bootstrap` (modo conform): criar o `CONTENT_MAP.md` a partir do conteúdo que já existe.
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0015` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `content-map`.

## Quando não se aplica

Projeto `code-app`.
