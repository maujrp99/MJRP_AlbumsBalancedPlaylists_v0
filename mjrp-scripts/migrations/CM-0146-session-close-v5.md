---
id: CM-0146
item: session-close
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0146 · session-close@4 → session-close@5

## Por que

A F275 (o board pelo estado registrado, UAT-592) fez da entrega uma passagem gravada: quando o fecho de uma sessão de feature fica verde, o que o ramo dela carrega passa a «Esperando o merge» no registro do board (`board_move.py`), na hora e sem commit. O board deixa de adivinhar que a feature foi entregue.

## O que muda

- O `session_close.py`, no fecho verde, chama `board_move.on_delivered` para as features do nome do ramo. A falha do board nunca segura o fecho: vira uma frase na ordem de arquivar.
- O check do item não muda.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o `session_close.py` e o `board_move.py` (a nota CM-0144).
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0146` e acrescenta `CM-0146` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0146` sai 0; numa sessão de feature com o fecho verde, `python3 mjrp-scripts/board_move.py next <Fxx>` diz «Esperando o merge».

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
