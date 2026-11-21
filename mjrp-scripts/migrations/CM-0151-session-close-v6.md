---
id: CM-0151
item: session-close
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0151 · session-close@5 → session-close@6

## Por que

A UAT-600 (aberta pelo MJRP: «o Harness deveria garantir a manutenção das sessões devidamente») mostrou três furos na manutenção das sessões: o aviso de que um branch entrou na `main` mandava arquivar sem rodar o `session-check`; a sessão que entregou o branch e parou sem a entrada de fechamento passava calada; e nada cobrava o `Done` que a via rápida deixa para depois do merge.

## O que muda

- O `session_close.py`, no checkout principal, roda o `session-check` de cada sessão juntada: só a de fecho verde recebe a ordem de arquivar; a vermelha sai com o que falta e o dono; o branch sem worktree no disco é dito, sem ordem.
- Numa sessão de página de feature com trabalho entregue (commit de trabalho à frente da `main`, ou já mesclado) e sem entrada de fechamento, o `Stop` cobra a entrada uma vez por estado.
- A feature mesclada com task aberta ou spec fora de `Done` é pendência: o `session_close.py upkeep` a lista, e o início de sessão e o `Stop` do checkout principal a repetem até fechar. O `merge_train.py merge` a imprime no merge e o novo hook `mjrp-scripts/hooks/post-merge` faz o mesmo no filho sem trem.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o `session_close.py`, o `merge_train.py` e o hook `post-merge`.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0151` e acrescenta `CM-0151` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0151` sai 0; `python3 mjrp-scripts/session_close.py upkeep` no checkout principal lista as features mescladas ainda abertas e as sessões que entregaram sem a entrada de fechamento.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
