---
id: CM-0136
item: session-close
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0136 · session-close@2 → session-close@3

## Por que

A F245 (o merge na `main` manda arquivar a sessão da feature) acrescentou ao `session_close.py` uma parte nova: no checkout principal, o
`stop-hook` avisa uma vez quais ramos de trabalho entraram na `main`, para o orquestrador arquivar a sessão de cada um. O commit mudou o
padrão do item sem subir a versão e sem nota, e o portão do catálogo (`conformance_check.py . --learn-gate`) reprovou na `main` (UAT-531).

## O que muda

- `mjrp-scripts/session_close.py` ganha `_merged_order` e o arquivo-marca `.mjrp/merged-announced.json` (rotativo, só no checkout principal).
- Os dois hooks do `.claude/settings.json` (`stop-hook` e `session-start`) e o check do item não mudam.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o `session_close.py` novo. Sem o refresh, a cópia do filho fica
   diferente da `main` do harness e segue funcionando igual, sem o aviso de ramos mesclados.
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0136` e acrescenta `CM-0136` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/session_close.py --help` sai 0 no filho, e `conformance_check.py . --check-note CM-0136` sai 0: o
`.claude/settings.json` tem o hook `stop-hook` do `session_close.py`.

## Quando não se aplica

Igual à CM-0124: projeto que não trabalha com sessões em worktree aplica igual (os hooks ficam calados no checkout principal).
