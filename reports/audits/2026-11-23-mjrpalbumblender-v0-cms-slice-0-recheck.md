---
type: recheck
feature: F82
also_covers: [F92 TASK-04, F93 TASK-04, F93 TASK-05]
branch: claude/f82-cms-slice-0-foundation
judged_on: 866baa4 (merge-base with main 51856f8)
judge: independent (did not build)
date: 2026-11-23
verdict: fail
p0: 0
p1: 1
p2: 8
---

# CMS slice 0 (foundation) — independent recheck

**Verdict: fail, on one P1.** The rules, the switches validator and the server's two locks are sound: no
P0, no rule got looser, and 12 of 13 rule mutations turn the emulator test red. What fails is the
wiring of the suite: with no emulator running, `npx vitest run` now fails. The CI (`.github/workflows/ci.yml`)
and the deploy scripts (`scripts/lib/deploy-common.sh`) run exactly that, so after a merge the CI goes red
on every push and neither the site nor the server can be deployed.

## P1

**P1-1 · The suite now fails without an emulator, and the CI and the deploy scripts have none.**
- `test/security/firestoreRules.test.js:66-73`: with no `FIRESTORE_EMULATOR_HOST`, `beforeAll` throws,
  on purpose. The only way out is `MJRP_RULES_EMULATOR=skip`.
- `.github/workflows/ci.yml` (step «Unit tests»: `npx vitest run`, ubuntu, no Java, no firebase-tools,
  no emulator) and `scripts/lib/deploy-common.sh:145-154` (`run_unit_tests`: `npx vitest run`;
  any failure gives «nothing was deployed»). The branch changes neither file.
- Reproduced: `vitest run test/security/firestoreRules.test.js` without the variable → `Error: No Firestore emulator…`,
  `Test Files 1 failed (1)`. The builder's log says the suite was green «com o emulador de pé»: the
  no-emulator path was never run.
- Consequence after the merge: the CI is red on every push, and `deploy-site.sh` / `deploy-server.sh`
  refuse to deploy unless the owner first starts the emulator and exports the variable.
- Fix (the builder chooses one): (a) the CI job installs Java and firebase-tools and runs the rules
  test under `firebase emulators:exec --only firestore`, and `run_unit_tests` does the same, or runs the
  emulator itself; or (b) the rules test runs in its own declared step (`npm run test:rules` through
  `emulators:exec`), and the default `npx vitest run` excludes it, while the CI and the deploy scripts run
  that step. Either way the test must still fail loudly where it is supposed to run. Do not use the silent skip.

## P2

1. **A rule mutation survives: `previous` on `published/site` has no size test.** Dropping
   `previousIsSmall(10)` from `validSite` (`firestore.rules:116`) keeps all 30 tests green. The texts
   and recipes caps are covered (`test:168-174`). Fix: add one case with an 11-key `previous` on `site`.
2. **The «only shrinks» list of guest writes probes a hand-written set of collections.** The probe list
   is in `test:272-278`. A future rule that opens guest writes on a new root collection would not be
   caught. The list cannot grow silently, but it is not derived from the rules. Fix: derive the root
   `match` paths from `RULES`, or assert that the probe list equals them.
3. **The server keeps the last good reading for up to 10 minutes while Firestore is down**
   (`cmsSwitches.js:20,29,119`). This fits the architecture proposal, which the ADR points to
   (`design/proposals/f82-cms/architecture-proposal.md:215`, «o último lido; nunca lido = unknown»).
   The 10-minute cap is the builder's addition. It differs from the literal Then of F93 REQ-08
   («dado o banco que não responde, então o servidor devolve desconhecido») and from plan.md:54. It
   never turns `unknown` into `on`: after the cap the answer is `unknown`, and each failure is logged.
   Acceptable, but the spec should say it: the owner should accept the 10 minutes in the spec text, or
   the cap should drop to 60 s.
4. **«404 or missing key = off» fits.** A 404 is a successful read of «nothing published». The code's
   default for `discogsValues` is `false` (`shared/content/switches.js:25`). That is consistent with the
   ADR («code stays the fallback»), with REQ-05 (a declared default) and with REQ-08 (`unknown` = could
   not read). **The consequence for the deploy order:** while the production rules have no
   `published/*` match, the REST read gets 403, so the answer is `unknown`. Once the rules are
   published but `published/site` does not exist, the answer is `off`. Either way, deploying this server
   hides the Discogs values in production (today only for the people in `DISCOGS_VALUES_FOR`). F93's
   Pre-Implementation plans it that way: server first, then the key. **Recommendation:** reverse the
   order. The owner publishes the rules and creates `published/site` = `{ _schemaVersion: 1, rev: 1,
   switches: { discogsValues: true } }` in the console *before* the server goes out. Then there is no gap.
5. **Log noise when the state is `unknown`.** `valueService.js` `discogsFor` warns on *every* request,
   on top of `cmsSwitches`' own warn once per 60 s. Harmless, but each inventory request adds one line
   during an outage. Fix: warn on state change, or rely on the cmsSwitches warn.
6. **`behavior.md` claims slightly more than the code does.** The `^inventory-value-switch` line says that
   if the server cannot read the key, it answers «desconhecido». It omits the up-to-10-minute last good
   reading. `arch.md` does mention it. Fix: add the half-sentence.
7. **The ADR file still says `Status: Proposed`** (`docs/decisions/0024-…md:3`), on main too. The
   acceptance exists only as a log entry on main (35ce129, «o MJRP aceitou em conversa»). F82 TASK-05
   says the emulator needs the ADR accepted, and the Pre-Implementation box is unchecked. `tech-stack.md`
   has not gained the emulator row or the server line. Fix: stamp the ADR, check the box, and update
   `tech-stack.md`, all at integration.
8. **The branch is behind main by the React production merge** (b36d2f1, bd90fd3). `git merge-tree`
   shows **conflicts in `docs/specs/behavior.md` and `package.json`**, and main's CI added a `typecheck`
   step. Main's `InventoryValueService.sourceState` already treats anything other than `on` as off, so
   `unknown` stays safe after the merge. Merge main into the branch and re-run everything before integrating.

## What was checked and found sound

**1 · `firestore.rules` (diff vs main)**
- Nothing that existed got looser. The only change to an old block is `albums/` losing `write` (`:59-61`).
  The rest of the diff only adds blocks (`:63-157`), and there is no root wildcard (the test pins it, `:79-85`).
- **`albums/` has no writer:** there is no `collection/doc(…'albums'…)` at the root and no
  `collectionPath = 'albums'` in `public/`, `shared/`, `app/src`, `server/` or `scripts/`, on the
  branch **and on main** (after the React merge). `SharedAlbumRepository` was removed in 40b2eb2
  (F65), and at 40b2eb2^ nothing imported it. The only residual risk: a browser tab still open on a
  pre-F48 bundle would get a refused write. That is not a production path.
- `published/*`: `read: if true` (the only unconditional allow, pinned by the test at `:87-91`).
  `create` requires the admin, the doc id on the closed list and `rev == 1`. `update` requires the admin,
  the shape, `rev == stored + 1` (absent counts as 0) and `keepsSchemaVersion`. There is no `delete`, and
  subcollections are unmatched, so they are closed.
- `isCmsAdmin()` (`:70-74`): it checks that the user is signed in and not anonymous, then reads
  `role == 'super'` through an absolute-path `get()`. A missing record makes the access an error, and
  the error denies: **it fails closed**. Nobody can write `cmsAdmins`, so a batched write cannot
  elevate itself in the same batch (no `getAfter` is involved).
- Shapes: `hasOnly` + `hasAll` per doc, `_schemaVersion is int && >= 1`, `rev is int`, `switches` keys
  closed and `bool`, `texts`/`recipes` are maps with ≤ 6000 / ≤ 100 entries, `previous` is a map with
  a count cap. Text *values* are not checked by the rules: that is declared in a comment (`:108-110`),
  admin-only, and the readers validate them.
- `cmsAdmins/{uid}`: only the owner of the record reads it, nobody writes it. `cmsWork/**`: admin only,
  with `keepsSchemaVersion` on update.
- Bypass attempts that failed: rev type confusion (`'5'`, `5.5`, `null`), same/jump/back rev, a write
  that leaves `rev`, an extra field, an extra switch key, non-bool switches, `texts` as a string or a list,
  6001 keys, an anonymous admin, role `editor`, no record, self-promotion, delete. All are refused in
  the emulator.

**2 · The emulator test is real, not vacuous.**
- It ran against the emulator: **30/30 pass** (with 7 related files: `Test Files 8 passed, Tests 156 passed`).
- The positive cases make the negatives meaningful. Example: `updateDoc(site, {rev: 2})` is valid in shape,
  so its refusal for `other`/`guest`/`adminAnonymous` comes from the auth check alone.
- **Mutation check** on scratch copies of the rules, with the worktree untouched. A control copy passes
  30/30. Then each single mutation:

| Mutation | Result |
|---|---|
| M1 drop the anonymous check | red (2) |
| M2 `rev` any int | red (1) |
| M3 drop `keepsSchemaVersion` on published update | red (1) |
| M4 `cmsAdmins` writable by self | red (3) |
| M5 `albums/` write back | red (2) |
| M6 switches keys open | red (1) |
| M7 published delete for admin | red (1) |
| M8 any role string | red (1) |
| M9 no texts size cap | red (1) |
| M10 `cmsWork` for any signed-in user | red (2) |
| M11 create with any rev | red (1) |
| M12 drop `hasOnly` on site | red (1) |
| M13 drop `previousIsSmall(10)` on site | **survives** (P2-1) |

**3 · `shared/content/switches.js`**
- It is a closed, frozen list of three (`:24-30`). An unknown key or a non-boolean is refused *alone*
  and the rest goes on (`:52-62`). `__proto__`/`constructor`/`toString` count as unknown (test `:62-68`).
  Anything that is not a plain map is refused as a whole. `switchValue` throws on an id outside the list.
- It is portable: no import, no global, no Firebase, no `fetch`. `coreStaysPortable` passes, and the
  test runs in the `core-node` project too.

**4 · Server**
- The two locks, environment first: `valueService.js` `discogsFor` checks `discogsSwitch(env)` first,
  and when it is not `on` the CMS is never asked. A test proves it (`valueRoutes.test.js:169-172`).
  `discogsState` (`valueSwitch.js:48-51`) gives `on`/`off` only for those exact strings. Anything else
  gives `unknown`, never `on`. `albumValue` returns `not_configured` for both `off` and `unknown`
  without calling Discogs (test `:189-194`).
- `unknown` never becomes `off`. Transport failures (403/500/network/1.5 s deadline/a body that is not
  a document) all give `unknown`. The `off` cases are only a 404, an absent key, or a key of the wrong
  type, which is logged as refused. `refresh()` never rejects, and `discogsValues()` cannot throw
  (`loadSwitches` is cached once the first read succeeds).
- Cache, deadline and sharing: the reading is fresh for 60 s, a read has 1.5 s (`createBudget` race +
  axios timeout), requests that arrive together share one in-flight read, the first request waits, a
  failure is retried after 60 s, and the last good reading lasts at most 10 min (see P2-3).
- Secrets and credentials: the REST GET carries no auth header, no API key and no service account
  (`cmsSwitches.js:83`, test `:42`). The only environment read is `FIREBASE_PROJECT_ID` (url-encoded).
  Nothing secret is logged. **No new credential.**
- The client: `InventoryValueService.sourceState` shows only on an exact `'on'` and logs `unknown`
  separately.

**5 · Scope, secrets, docs**
- The work stays within slice 0: rules, emulator test, validator, server read, `valueApi` doc line,
  `sourceState`. There is no Painel, no reader in the site, and no `entry` document (it is deferred,
  as the log says).
- A diff scan for keys, tokens and passwords found nothing. All `package-lock` resolves point to
  registry.npmjs.org. `@firebase/rules-unit-testing` 3.0.4 is a dev dependency.
- `firebase.json` gained an `emulators` block (port 8089, UI off) on the `demo-` project, so the emulator
  cannot touch production.

## What I ran

- `npm run rules:emulator` (Java 27 from Homebrew, firebase-tools), outside the queue. I stopped it at the
  end: the ports 8089 and 4400 are free, and the worktree's `git status` is clean.
- Through the queue (`machine_load.py run --label f82-judge`), with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8089`:
  `vitest run` on firestoreRules, switches, cmsSwitches, valueRoutes, coreStaysPortable,
  discogsLowestForSale and InventoryValueService. Result: `Test Files 8 passed (8) · Tests 156 passed (156)`.
  The rules file: `✓ (30 tests)`.
- Through the queue, without the emulator variable, on the rules test: `Error: No Firestore emulator…` ·
  `Test Files 1 failed (1)`. This is the basis of P1-1.
- Through the queue, the mutation run (`scratchpad/f82-slice0-judge/runmut.sh`): control 30/30, then
  12 mutants red and 1 surviving (the table above).
- `git merge-tree main claude/f82-cms-slice-0-foundation` showed conflicts in `docs/specs/behavior.md`
  and `package.json`.

## What I could not check

- The real production Firestore: the rules are not published and I made no REST call to production.
  The 403-before-publish and 404-after-publish behaviour comes from the code and the tests, not from
  observing production.
- The full suite (`npx vitest run`, 332 files): not run. I only ran the files the slice touches.
- The CI run itself: I read the workflow file but did not trigger a run.
- Whether the emulator's rules engine matches production on every edge case, for example
  `sign_in_provider` on linked accounts. That rests on the emulator.
