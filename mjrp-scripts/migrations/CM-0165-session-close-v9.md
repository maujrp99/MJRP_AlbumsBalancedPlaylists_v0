---
id: CM-0165
item: session-close
from: 8
to: 9
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0165 · session-close@8 → session-close@9

## Por que

A UAT-633 (aberta pelo agente) mostrou que a trava de arquivar recusava a sessão que renomeou o branch para o nome da convenção (`claude/fNN-slug`), como o brief manda: o app guardou o nome da criação, com sufixo (`…-d487d6`), e o `session_check` comparava com ele.

## O que muda

- O `session_check` do `session_close.py` aceita o branch atual do worktree quando o do registro é exatamente `<atual>-<4 a 8 hex>` e confere o fecho por ele. Se o ref do app ainda existe, precisa estar na `main`. Branch irmão, de outra feature ou fora desse formato segue recusado.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o `session_close.py`.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0165` e acrescenta `CM-0165` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0165` sai 0; `python3 mjrp-scripts/archive_guard_selftest.py` sai 0.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
