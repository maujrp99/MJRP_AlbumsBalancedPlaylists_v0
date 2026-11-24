---
id: CM-0164
item: session-close
from: 7
to: 8
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0164 · session-close@7 → session-close@8

## Por que

A UAT-629 (aberta pelo agente) mostrou servidores de desenvolvimento (`next-server`, `vite`) de sessões já encerradas rodando dias a ~90% de CPU, alguns numa pasta removida ou na lixeira do app, até a carga da máquina chegar a 300.

## O que muda

- O `session_close.py` ganha `orphan_servers`, `is_dev_server` e `collect_orphan_servers`: o fecho verde da sessão e o `clean-worktrees --apply` encerram (TERM, depois KILL) o servidor de desenvolvimento cuja pasta de trabalho foi removida, está em `.ccd-trash`, é a worktree que a sessão deixa, ou roda há mais de 12 h numa worktree. Nunca o serviço do Control Center, nem processo fora das pastas de projeto.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o `session_close.py`.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0164` e acrescenta `CM-0164` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0164` sai 0; `python3 mjrp-scripts/session_close_selftest.py` sai 0.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
