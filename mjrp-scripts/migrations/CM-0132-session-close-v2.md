---
id: CM-0132
item: session-close
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0132 · session-close@1 → session-close@2

## Por que

O `session_close.py` da v1 (CM-0124, F206) punha a pasta dos scripts no `sys.path` à mão, e o autoteste do `_boot` (a regra de que só o
`_boot.py` faz isso, F73 R17) reprovava no trem da tarde de 2026-11-07. O script passa a usar o `_boot`, como os outros. É só a forma
de carregar os módulos vizinhos: o comportamento do fecho da sessão e da limpeza dos worktrees não muda.

## O que muda

- `mjrp-scripts/session_close.py` troca o `sys.path.insert` pelas duas linhas de bootstrap e pelo `import _boot`. O `_boot.py` já vai ao
  filho com os módulos de apoio (`_*.py`) que o refresh leva.
- Os dois hooks do `.claude/settings.json` (`stop-hook` e `session-start`) e o check do item não mudam.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o `session_close.py` novo. Sem o refresh, a cópia do filho fica
   diferente da `main` do harness e segue funcionando igual.
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0132` e acrescenta `CM-0132` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/session_close.py --help` sai 0 no filho, e `conformance_check.py . --check-note CM-0132` sai 0: o
`.claude/settings.json` tem o hook `stop-hook` do `session_close.py`.

## Quando não se aplica

Igual à CM-0124: projeto que não trabalha com sessões em worktree aplica igual (os hooks ficam calados no checkout principal).
