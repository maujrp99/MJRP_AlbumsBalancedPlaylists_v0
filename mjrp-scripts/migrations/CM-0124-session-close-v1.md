---
id: CM-0124
item: session-close
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0124 · session-close@0 → session-close@1

## Por que

Em 2026-11-07 o harness tinha 33 worktrees e o `MJRPpersonal`, 49: arquivar a sessão terminada dependia de o orquestrador lembrar, e
os filhos não tinham a limpeza dos worktrees mesclados, que só o trem do harness fazia. O MJRP pediu um mecanismo no kernel, para o
harness e os filhos, que encerre e arquive sozinho a sessão terminada (S-218, F206).

## O que muda

- O refresh leva `mjrp-scripts/session_close.py` (o juiz do fecho da sessão de página e a limpeza dos worktrees, antes só no
  `merge_train.py` do harness) e dois hooks da plataforma no `.claude/settings.json`:
  - `Stop` → `session_close.py stop-hook`: na sessão de página (worktree ligado) que escreveu a entrada de fechamento (`Session:` com o
    ramo), o fecho vermelho segura o turno uma vez com a lista do que falta; o verde leva as cópias do `_backups/` do worktree para o
    checkout principal, grava a marca em `.mjrp/to-archive/` e manda a sessão se arquivar (o app tira o worktree junto).
  - `SessionStart` → `session_close.py session-start`: no checkout principal, lista as sessões de fecho verde que não se arquivaram e
    tira os worktrees mesclados e limpos (nunca o novo nem o ativo), pelo `_safe`.
- `structure_rules.json` declara os rotativos `**/.mjrp/to-archive/` (a marca «pronta para arquivar») e `**/.mjrp/close-red/` (o vermelho que o hook segurou), do `session_close.py`.
- O hook só julga o worktree em que a sessão começou (a pasta do `transcript_path` do JSON do hook) e do repositório em que o script roda: uma sessão que entra num worktree irmão não é mandada se arquivar por ele.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness: traz o script, as regras e os dois hooks.
2. Confere no `.claude/settings.json` os dois comandos do `session_close.py` (`stop-hook` em `Stop`, `session-start` em `SessionStart`).
3. Roda `python3 mjrp-scripts/session_close.py clean-worktrees` no checkout principal e lê o que sairia; o acúmulo sai no próximo
   início de sessão de lá (ou agora, com `--apply`). O que fica tem o motivo: não force.
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0124` e acrescenta `CM-0124` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0124` sai 0: o `.claude/settings.json` do filho tem o hook `stop-hook` do `session_close.py`.

## Quando não se aplica

Projeto que não trabalha com sessões em worktree: aplica igual (os hooks ficam calados no checkout principal sem marca nem worktree).
