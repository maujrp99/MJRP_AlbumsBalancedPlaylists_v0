<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F66: O token do Discogs sai do repositório · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] sem ramo: nenhum código muda; o fecho é só registro, na `main`
- [x] verify the spec and the plan of F66 passed their cross-checks (and were approved, where gated)

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
- [x] TASK-01 os dois scripts com o token fora do repositório e a varredura de segredos como teste (feito na F65, `f9d1abd`) · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 o token antigo apagado no Discogs e o novo no Secret Manager, pelo MJRP (2026-11-20) · implements:: REQ-02 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-03 `noSecretsInRepo.test.js` verde e `git ls-files` sem os dois scripts; evidência em `reports/evidence/F66/2026-11-20-token-out-of-the-repository.md` · implements:: REQ-01, REQ-02 · model:: sonnet · rounds:: 1

## Documentation
- [ ] update the specs affected · mark F66 Done in spec.md · commit: feat: implement discogs-token-out-of-the-repository
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde
