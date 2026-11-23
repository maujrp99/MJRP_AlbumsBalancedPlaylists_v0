---
type: visual-parity-recheck
feature: F82
also_covers: [F93 TASK-05 (the app side of `unknown`)]
branch: claude/f82-cms-slice-0-foundation
judged_on: b6108c6 (main merged in 7895bce)
reference: main 4504ebf
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 1
---

# CMS slice 0: visual parity of the inventory value switch

**Verdict: pass.** A person sees no difference.
- When the server answers `on`, `off` or the pre-F52 body, the branch shows the same words, positions and
  notices as main. This holds on the inventory screen and in its windows, at 1280 and at iPhone 14 width.
- When the server answers `unknown`, the branch looks exactly like `off`: no error panel, no Discogs word.
  The only difference is one console warning, which is intended.
- The other screens show no difference beyond what main-against-main also shows.

The one finding is about weight, not looks (P2-1).

## What differs in the code, screen-wise

`git diff 4504ebf b6108c6` touches three site-reachable files under `public/` and `shared/`:
- `public/js/api/valueApi.js`: a comment only.
- `public/js/services/inventory/InventoryValueService.js`: `sourceState` now reads `unknown` apart from
  `off`, logs it, and returns `off`.
- `shared/content/switches.js`: the site does not import it yet.

So the only behaviour change a person could meet is in `sourceState`.

## Method

- **Builds.** Both sides were built as a publication build (`scripts/publication-budget.mjs --out`), with
  the script's own stand-in keys held only in the environment, through the machine queue.
  - The sources are `git archive` copies of 4504ebf and b6108c6 in scratch, with no `.env`; I did not read
    any `.env`.
  - The asset set is the same on both sides. Only the hashes differ, because the change cascades through them.
- **Servers.** A small static server per side, in the Playwright process (port 0), closed at the end of
  each run.
- **Browser.** Playwright 1.56.1 borrowed from MJRPpersonal: Chromium at 1280×900, WebKit with the
  `iPhone 14` device. Firebase is blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`,
  `firebaseinstallations`).
  - The inventory is seeded with the wave 6c seam: the same 60 items, put on `window.__inv`.
  - `/api/exchange-rates` and `/api/album-value` are stubbed as in wave 6c.
  - With Firebase blocked there is no current user, so the app's `mayAsk` (`mayUsePaidRoutes`) is true and
    `/api/value-sources` is really asked: once per page load on every run (`asked: [1]`).
- **`/api/value-sources` stubs.**
  - `on` = `{data:{discogs:'on'},outcome:'found'}`. This is the body both servers send for «on», so the
    old shape and the new shape are the same bytes.
  - `legacy` = `{discogs:'on'}`, the pre-F52 body with no `outcome`.
  - `off` = `{data:{discogs:'off'},outcome:'found'}`.
  - `unknown` = `{data:{discogs:'unknown'},outcome:'found'}`.
- **Per state compared:** a picture of the viewport only (no full-page picture at any width), the visible
  text of `#app` and of any open sheet or modal, the footer text, the boxes of every element, the page
  height, the focus and scroll, the visible alerts and toasts, and the console warnings and errors.
- **The states.**
  - At 1280: the grid; the page bottom with the footer; the list; a status count pressed; the order «Value»;
    the euro chosen when offered; the album window with its value section and where to buy; that window
    scrolled; the edit window.
  - At iPhone 14: the list; the page bottom; the gallery; the filters sheet; the sheet of an album; the
    actions sheet; the album window; the album window with its value fold opened when present; the edit window.
- Scripts: `scratchpad/f82-slice0-judge/visual/parity.mjs`. Raw results: `visual/out/parity-*.json`.

## Results: the inventory screen and its windows

| Comparison | Chromium 1280 | WebKit iPhone 14 |
|---|---|---|
| control main/on vs main/on | 9/9 identical | 9/9 identical |
| **on**: main vs branch | 9/9 identical | 9/9 identical |
| **legacy body**: main vs branch | 8/9 identical, plus 1 picture-only noise (see below) | 9/9 identical |
| **off**: main vs branch | 8/9, same noise (and again 8/9 in a second run) | 9/9 identical |
| **unknown**: main vs branch | 7/9, picture-only noise only | 9/9 identical |
| **branch: unknown vs off** | **9/9 identical** | **9/9 identical** |
| sanity, branch on vs off: must differ | differs in 9/9 (the stubs work) | differs in 9/9 |

**The picture-only differences are rendering noise.**
- Each is 12 or 19 pixels at intensity 1 of 255. They sit in the dimmed backdrop behind the album window and
  the edit window. Text, boxes, focus and alerts are identical.
- The same 12 and 19 pixel spots also differ in the noise control **main/off vs main/off** (7/9).
- branch/off vs branch/off and main/unknown vs main/unknown were 9/9.

**What the person sees in each state** (counted on the page text):
- On: «Discogs» appears 43 or 44 times at 1280 (values, notices, the attribution footer).
- Off, legacy and unknown: 0 or 1 at the top of the page, and the count is equal on both sides. The single
  one at a page bottom is the store link «Where to buy», which stays as specified.
- No error panel and no new alert in any mode. The toast «Authentication issue. Some features may be limited.»
  shows in every mode on both sides, because Firebase is blocked. It is the same on both sides.

**Console:**
- Branch, `unknown`: `[InventoryValueService] the server could not read the Discogs key of the CMS (unknown, not off): no Discogs value is shown`.
  On main, the same answer is silently off.
- Legacy body, both sides: `… the switch of the values could not be read: legacy`.
- No page error that is not also on main. The others are the same on both sides and come from the blocked
  network: auth, search worker, MusicKit.

## Results: the other screens, branch vs main

I used the unchanged sweep of the sync 4 judge (`reports/evidence/F83/sync-4/judge.mjs`): its `sweep` part
covers Create (`/start`), Albums, Inventory, Saved playlists, Artists, and Playlists with a set and its
regenerate panel. Blend was covered by `mini` at 1280 and by the full `blend` flow at iPhone 14. Each pair
was run against a main-vs-main2 control.

- **Chromium 1280 `sweep`, run 1:** 187 checks, 2 picture-only differences.
  - Playlists header: 35 px, max 2.
  - Regenerate panel border: 5 px, max 1.
  - In run 2 the header difference **also appears main vs main2**. branch vs branch2 is 0.
  - The 5 px border line repeats main vs branch, at intensity 1 with DOM, text and boxes equal. Nothing in
    the playlists code changed, so it is not visible and I classed it as noise.
- **Chromium 1280 `mini` (Blend):** run 1 differs in 12 px at max 6. Run 2: main vs branch is **0**, while
  main vs main2 differs in 10 pictures (up to 12 px) and branch vs branch2 in 7. So it is noise.
- **WebKit iPhone 14 `sweep`:** main vs branch differs only on `/start`, inside the animated flame wordmark.
  main vs main2 differs on `/start` and `/inventory` in the same wordmark (max 129). The animated image makes
  pixels unusable there. Text, DOM, boxes and aria are equal on all routes.
- **WebKit iPhone 14 `blend`:** 746 checks, 0 pictures differ. Two things fail on both sides alike, so they
  are not branch differences:
  - one box of the «sources blocked» failure panel is off by sub-pixels, in the control too;
  - the flow's last step stops on both sides (`window.__release is not a function`), the same as in the control.

## P2

1. **The branch fails the declared weight margin.** `npm run budget:publication` exits 1 on the branch and 0
   on main.
   - Main already sits at the margin: main script 194,872 B, ceiling 195,022 B, so 150 B over; main plus
     after the first screen 430,680 B, cap 430,830 B, so 150 B over.
   - The branch adds 3 B to the main script and 66 B after the first screen. The headroom drops to 147 B and
     81 B, under the 150 B margin.
   - The deploy check (`bundle-budget.mjs`, ceilings without the margin) still passes, so nothing is blocked
     today. But the rule in `scripts/bundle-budget.json` says to re-measure and re-set the ceilings each wave,
     and a real key gzips a few bytes differently from a stand-in.
   - Fix: copy the new measured numbers into `publication.measured` and set the ceilings to them plus 150 B,
     as the rule says.

## What did not run

- WebKit at 1280 and Chromium at the phone width: each width ran in one engine only.
- A real signed-in account and a real server: everything ran with Firebase blocked and the API stubbed.
- Portuguese: not checked; the strings did not change.
- The last steps of the phone `blend` flow (after «generate»): they stop on both sides alike.
- Pixel comparison of the wordmark area at phone width: an animated image, noise even main vs main.

At the end, no server or browser of mine is left running. The three node listeners on the machine (Expo on
8081, a Next server and a test runner) are not mine and predate these runs. The worktree is unchanged.
