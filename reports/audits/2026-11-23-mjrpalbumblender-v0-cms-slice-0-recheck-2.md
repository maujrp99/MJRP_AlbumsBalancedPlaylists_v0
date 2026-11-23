---
type: recheck
feature: F82
also_covers: [F92 TASK-04, F93 TASK-04, F93 TASK-05]
branch: claude/f82-cms-slice-0-foundation
judged_on: b6108c6 (main merged in 7895bce)
judge: independent (did not build)
date: 2026-11-23
pass: 2
previous: 2026-11-23-mjrpalbumblender-v0-cms-slice-0-recheck.md
verdict: pass
p0: 0
p1: 0
p2: 5
---

# CMS slice 0 — second recheck

**Verdict: pass.** P1-1 is fixed for real, and so are the four P2s the builder claimed. I found no new
P0 or P1. Five P2s remain: two of them are new, about how strong the guard is and about the CI time
budget; the other three are left over from the first pass.

## The six checks

**(1) The default suite no longer needs the emulator, and the rules test still runs.**
- The rules test was renamed to `test/security/firestoreRules.emulator.js`. The default `include`
  pattern (`test/**/*.test.{js,ts,tsx}`, `vitest.config.js`) does not match that name, and neither does
  the `core-node` project (`vitest.workspace.js`, which takes only `test/shared` and `test/repositories`).
- Proven by a run without the emulator: `npx vitest run firestoreRules …` (no `FIRESTORE_EMULATOR_HOST`,
  no `MJRP_RULES_STEP`) found no rules file. The other three files passed: `Test Files 3 passed, Tests 52 passed`.
- `npm run test:rules`, run through the queue, reports `✓ test/security/firestoreRules.emulator.js (31 tests)`
  and `Test Files 1 passed (1) · Tests 31 passed (31)`, then «Script exited successfully (code 0)». The
  emulator shut down by itself and port 8089 was free afterwards. Java was found at the Homebrew path
  without being on `PATH`.
- `MJRP_RULES_EMULATOR=skip` is gone. Run alone with no emulator, the file still fails loudly
  (`firestoreRules.emulator.js:65-67`).
- `MJRP_RULES_STEP=1` is set only by `scripts/rules-emulator.mjs:57`. It narrows the workspace to the
  rules config, so `test:rules` runs that one file and not the whole suite.
- **The guard** (`test/architecture/rulesTestHasItsOwnStep.test.js`), with one mutation per scratch copy
  of the files it reads: a control copy passes 4/4, then

| Mutation | Guard |
|---|---|
| G1 the CI rules step removed | red |
| G3 the `run_rules_tests` call removed from `run_unit_tests` | red |
| G4 the rules `die` turned into `warn` | red |
| G5 `run_unit_tests` commented out of `deploy-server.sh` | red |
| G6 the rules file renamed back to `*.test.js` | red |
| G2 `continue-on-error: true` on the CI rules step | **survives** (P2-1) |
| G7 the CI step neutered to `run: echo skipped  # npm run test:rules` | **survives** (P2-1) |

**(2) The deploy scripts run the rules test, and a failure stops the deploy.**
- `run_unit_tests` calls `run_rules_tests` after the suite passes (`scripts/lib/deploy-common.sh:155`).
- The three deploy paths each call `run_unit_tests` before anything is published: `deploy-site.sh:98`,
  `deploy-server.sh:276`, `deploy-preview.sh:90`. Dry runs call it too.
- I exercised the failure path with stubs in scratch, sourcing the real `deploy-common.sh` with stub
  `npx` and `npm` on `PATH`. Nothing was deployed and no network was used.
  - suite ok, rules ok: exit 0, the next step is reached, the calls are `npx vitest run; npm run test:rules --silent`.
  - suite ok, rules fail: exit 1, the next step is **not** reached,
    `ERROR: the rules test failed, or could not run (it needs Java and the Firebase CLI): nothing was deployed`.
  - suite fails: exit 1, the rules test is never called, `ERROR: the unit tests failed: nothing was deployed`.
- Remember: the deploy builds from a clean export of `main`, so this protection only applies after the merge.

**(3) The CI step is coherent.**
- The order is: `setup-java@v4` (temurin 21), then `npm install -g firebase-tools@15.36.0 && npm run test:rules`,
  after the «Unit tests» step.
- 15.36.0 exists on npm and is the version on this machine. A failure in the step fails the job (there is
  no `continue-on-error`).
- I did not run the CI. See P2-2 for the time budget.

**(4) The 10-key cap mutation is now killed.**
- `M13_site_previous_no_size` was run again under `firebase emulators:exec`, from scratch copies
  (control: 31/31). Result: `1 failed | 30 passed`, on «the site document keeps at most 10 keys in
  previous» (`firestoreRules.emulator.js:165-169`).

**(5) The `unknown` warning is rate-limited.**
- `valueService.js` `sayUnknown`: the warning goes out once when the state starts and at most once every
  60 s while it lasts. Any other state resets it, so a new start is said again.
- Test `valueRoutes.test.js:182-197`: 5 requests give 1 warn; +61 s gives 2; on, then unknown again, gives 3.
- One harmless gap: the environment-off path returns before `sayUnknown`, so it does not reset the
  timer. The worst effect is one warning held back by up to a minute.

**(6) The merge of main lost nothing.**
- `git diff main HEAD` on `package.json` shows only the two new scripts and the dev dependency.
- On `behavior.md` it shows only the Discogs-switch sentence, extended with the second lock and the
  10-minute window. The rest of main's React-line text is identical.
- On `firestore.rules`, the only lines removed relative to main are the `albums/` comment and its `write`.
- Every file that differs from main belongs to the slice (rules, emulator, switches, server, deploy, CI, docs).
- The F93 spec's acceptance criterion for REQ-08 and `behavior.md` now state the 10 minutes, marked
  «decidido pelo agente — revisável». The owner can still overrule it.

## P2

1. **The guard checks that the text is present, not that the step really runs** (G2 and G7 survive).
   A rules step with `continue-on-error: true`, or one replaced by an `echo` that only mentions
   `npm run test:rules` in a comment, stays green. Fix: assert that the step's `run:` line starts with
   the command, and that the step has no `continue-on-error`.
2. **The CI time budget has not been checked.** The job keeps `timeout-minutes: 10`. It now also does a
   global `firebase-tools` install and downloads the Firestore emulator jar on every run (not cached),
   on top of typecheck, lint and a suite of about 5,200 tests. It may fit, but no CI run has shown it.
   Fix: look at the first CI run, and raise the timeout or cache `~/.cache/firebase/emulators` if needed.
3. **A wrong comment in `scripts/rules-emulator.mjs:9`.** It calls the default suite
   `npx vitest run --config vitest.rules.config.js`. That is the rules step; the default suite is plain
   `npx vitest run`.
4. **Left over from pass 1:** ADR-0024 still says `Status: Proposed`, its Pre-Implementation box is
   unchecked, and `tech-stack.md` has neither the emulator row nor the server line. The builder left
   these on purpose because they are the owner's; they are needed before integration.
5. **Left over from pass 1:** the probe list behind «guest writes only shrink» is still hand-written
   (`firestoreRules.emulator.js`, the `COLLECTIONS` constant).

Carried over without change: **deploy order.** Deploying this server hides the Discogs values until the
owner has published the rules and created `published/site` with `discogsValues: true`. Doing both
before the server deploy avoids the gap.

## What I ran

- Through the queue, with no emulator variable: the default config with the filter `firestoreRules`,
  plus `rulesTestHasItsOwnStep`, `valueRoutes` and `cmsSwitches`: `Test Files 3 passed (3) · Tests 52 passed (52)`.
  No rules file was collected.
- Through the queue: `npm run test:rules` gave `Tests 31 passed (31)`, exit 0, and the emulator stopped by itself.
- Through the queue, under `firebase emulators:exec` from scratch: the rules mutation (control 31/31,
  M13 red) and the guard mutations (the table above). Script: `scratchpad/f82-slice0-judge/runall2.sh`.
- The stub harness of the deploy (`scratchpad/f82-slice0-judge/deploystub/`), with three cases.
- `git diff main HEAD` on `package.json`, `behavior.md` (word diff), `firestore.rules` and the list of files.
- `npm view firebase-tools@15.36.0 version` → 15.36.0.

At the end: port 8089 is free, no emulator is left running, and I changed nothing in the worktree.

## What I could not check

- A real GitHub Actions run (Java 21 on ubuntu, the emulator download, the 10-minute budget).
- A real deploy run of `run_rules_tests` from a clean export of `main`. That code only exists on main
  after the merge; I exercised it with stubs only.
- The full suite. The builder reports 5233 passed; I did not repeat it, as instructed.
