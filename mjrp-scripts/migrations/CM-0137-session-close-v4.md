---
id: CM-0137
item: session-close
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0137 · session-close@3 → session-close@4

## Por que

A trava de fim de sessão (`session_close.py`) mandava arquivar a sessão da Designer a cada turno, e o merge na `main` arquivava a sessão de uma
feature de via rápida antes do passo retroativo (F256, UAT-570). A ordem de arquivar passou a valer só para a sessão de uma feature `Done`.

## O que muda

- `mjrp-scripts/session_close.py`: o `Stop` do worktree só dá a ordem de fecho verde se o ramo é de feature (`claude|feat|fix/fNN-…`) e a spec da
  feature está `Done`; sessão de papel (a orquestradora, a Designer) não recebe ordem nem lista de fecho vermelho.
- No checkout principal, o aviso dos ramos mesclados só lista o ramo de feature cuja spec está `Done` na `main`; o ramo recém-aberto, sem commit
  próprio, não conta como mesclado. O `.mjrp/merged-announced.json` ganha `v: 2`, e a primeira leitura só registra.
- Os dois hooks do `.claude/settings.json` e o check do item não mudam.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o `session_close.py` novo. Sem o refresh, a cópia do filho segue funcionando
   com a regra antiga (a sessão de papel recebe a ordem).
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0137` e acrescenta `CM-0137` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/session_close.py --help` sai 0 no filho, e `conformance_check.py . --check-note CM-0137` sai 0: o
`.claude/settings.json` tem o hook `stop-hook` do `session_close.py`.

## Quando não se aplica

Igual à CM-0136: projeto que não trabalha com sessões em worktree aplica igual (os hooks ficam calados no checkout principal).
