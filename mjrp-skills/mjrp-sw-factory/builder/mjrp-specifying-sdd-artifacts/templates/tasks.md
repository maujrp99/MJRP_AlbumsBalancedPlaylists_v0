<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature Fxx: [Name] · Plan: [[plan]]
**Approved**: [human, YYYY-MM-DD HH:MM when the contract's `gates:` lists this stage — empty until then; otherwise `not a gate`]

## Pre-Implementation
- [ ] create the branch feat/<feature>-<timestamp>
- [ ] verify spec and plan passed their cross-checks (and were approved, where gated)

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
- [ ] TASK-01 [action on a named file or component — its done signal] · implements:: REQ-01 · model:: opus
- [ ] TASK-02 [a mechanical task, e.g. add the registry keys] · implements:: REQ-01 · model:: sonnet
- [ ] TASK-03 … · model:: sonnet|opus

## Verification
- [ ] TASK-0n test suite · build · happy path · regression check · implements:: REQ-01, REQ-02 · model:: opus
- [ ] TASK-0n visual parity against the approved visual reference — the project's visual sensor (`sensors.visual`) at 0 on
      the feature's screens and states, and the side-by-side pairs looked at in the project's widths and palettes;
      the LAST task when the feature touches a screen (PRINCIPLES.md §I.12) · implements:: REQ-0x · model:: opus

## Quickstart (optional)
<!-- Manual validation scenarios right after implementing — Spec Kit's quickstart.md, merged here. -->

## Requirements checklist (optional)
<!-- Is the writing of the requirements clear and complete? — Spec Kit's checklists/, merged here. -->

## Documentation
- [ ] update the specs affected · mark the feature Done in spec.md · commit: feat: implement <feature>
