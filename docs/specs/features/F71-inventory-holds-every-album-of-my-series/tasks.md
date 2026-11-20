<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F71: O inventário tem todos os álbuns das minhas séries; filtro por Owned, Not Owned e Wishlist · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [ ] create the branch feat/inventory-holds-every-album-of-my-series-<timestamp>
- [ ] verify the spec and the plan of F71 passed their cross-checks (and were approved, where gated)

## Implementation
<!-- Atomic (one focused session), verifiable (a clear "done"), ordered by dependency: data → logic →
     components → composition → polish. -->
<!-- Marks, after `implements::`, separated by ` · `:
     model:: sonnet|opus — MANDATORY on every task; the author of this file decides, the implementer never does.
                        sonnet = MECHANICAL: texts and registry keys, summaries, format samples and tests, derived
                        files, renames. opus = code design, architecture, critique, visual recheck. There is no
                        default: a task without the mark fails the cross-check.
     rounds:: N       — written when the task CLOSES ([x]): how many Execute ⇄ Verify rounds it took (ceiling 3).
                        `python3 mjrp-scripts/loop.py --check-tasks tasks.md` fails a closed task without it. -->
- [ ] TASK-01 «a escrever: ação sobre um arquivo ou componente nomeado — o sinal de pronto» · implements:: REQ-01 · model:: «a escrever: sonnet|opus»

## Verification
- [ ] TASK-02 «a escrever: a verificação: suíte, build, caminho feliz, regressão» · implements:: REQ-01 · model:: «a escrever: sonnet|opus»

## Documentation
- [ ] update the specs affected · mark F71 Done in spec.md · commit: feat: implement inventory-holds-every-album-of-my-series
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde
