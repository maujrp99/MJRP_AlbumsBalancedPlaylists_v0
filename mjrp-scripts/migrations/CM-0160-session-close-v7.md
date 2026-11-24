---
id: CM-0160
item: session-close
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0160 · session-close@6 → session-close@7

## Por que

A UAT-623 (aberta pelo agente) mostrou que a trava de arquivar (`archive_guard.py`) tomava por sessão de papel a sessão de uma feature num worktree reaproveitado, com HEAD destacado ou com o registro do app sem `worktreePath`, e dava «não avaliável» ao worktree que o trem já removera. O orquestrador não conseguia arquivar sessão mesclada de fecho verde.

## O que muda

- O `session_close.py` ganha `merged_without_worktree` e o `session_check` aceita o ramo do registro (`branch=`) quando o HEAD está destacado.
- A trava distingue a sessão de papel (sem ramo de feature e sem worktree próprio) da de feature, e deixa passar a de worktree removido quando o ramo está na `main` com a entrada de fechamento e a spec `Done`.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o `session_close.py` e o hook.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0160` e acrescenta `CM-0160` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0160` sai 0; `python3 mjrp-scripts/archive_guard_selftest.py` sai 0.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
