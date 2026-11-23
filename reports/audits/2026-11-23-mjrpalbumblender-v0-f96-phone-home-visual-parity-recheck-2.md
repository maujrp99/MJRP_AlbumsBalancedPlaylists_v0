---
type: visual-parity-recheck
feature: F96
branch: feat/f96-entry-page-on-the-phone
judged_on: f3c4770 (judged as a delta over bca8ea9, the first pass; the one screen commit in between is 4d53a35; compared with main 65a2005)
reference: the first pass report (reports/audits/2026-11-23-mjrpalbumblender-v0-f96-phone-home-visual-parity-recheck.md, verdict pass, 5 P2) and, through it, the owner's decisions of 2026-11-23
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 6
---

# F96 — the entry page on the phone, second pass: the visitor's «Criar» moved to its own file, nothing visible changed

**Verdict: pass — 0 P0, 0 P1, 6 P2.** Between the commit I judged (`bca8ea9`) and the tip (`f3c4770`) the screen code changed in one way only: the rule «on the phone a visitor's "Criar" opens the app» left `menu.js` for a new file, `visitorDoor.js`. The page behaves the same, and the app is untouched: every built file of the app at `f3c4770` is byte for byte the one `main` builds. The five P2 of the first pass stay open; one more was seen in this pass, on the computer in the test WebKit, and it is the same on `main`.

This pass is narrow: it did not redo the first pass's measures of contrast, tap targets, the shelf or the focus walk; nothing in the delta can touch them.

## The delta, read line by line

`git diff bca8ea9 f3c4770 -- public/ scripts/ firebase.json`: four files, 33 lines added, 13 removed.

| File | What changed | Visible or behavioural? |
|---|---|---|
| `public/splash/menu.js` | `VISITOR_DOOR` and the `phone` argument of `menuHref` and `applyAccount` removed: the file is back to what `main` has. | No by itself; the rule now lives in the next file. |
| `public/splash/visitorDoor.js` (new) | `applyDoor(doc, signedIn, phone)`: for a visitor on the phone, writes `/start` on the bar's «Criar»; does nothing otherwise. Imports nothing. | The same rule as before, in another place. |
| `public/splash/splash.js` | The page's `account()` now calls `applyAccount` and then `applyDoor`, on load, when the account answers, and when the screen crosses 899 px. | Same result in every case: `applyAccount` writes all five items first, so going back to a wide screen puts «Criar» back on its story. |
| `scripts/bundle-budget.json` | Two measured numbers one byte up (63379 → 63380, 238197 → 238198). | No: a build check's record, not shipped. |

`firebase.json` did not change. The merge of `main` (65a2005) brought documents only: nothing under `public/` or `scripts/`.

## What was re-run

Built by me at `f3c4770` and at `main` 65a2005 (real covers), served with `vite preview` on ports 5496 and 5497, both stopped at the end. Playwright, Chromium and WebKit, 390×844 (visitor and signed in, Portuguese and English) and 1280×800. Same safety as the first pass: music hosts, foreign schemes and every host but this machine, the covers' CDN and Google Fonts aborted; requests attempted to a blocked host: 0; no link clicked.

| Check | Result |
|---|---|
| Visitor, phone, bottom bar | «Criar» → `/start` from the first moment (before the account answers) and after; «Álbuns», «Blend», «Playlists», «Inventário» → their steps. Both engines, both languages. |
| Signed in, phone, bottom bar | `/start`, `/albums`, `/blend`, `/saved-playlists`, `/inventory`: unchanged. |
| Top bar | Visitor: «Entrar» / «Sign in» → `/start?signin`. Signed in: «Criar» / «Create» → `/start`. No big button in the opening. |
| The screen crosses the phone's width | 390 → 1280: the visitor's «Criar» goes back to `#start`, the menu moves to the header; 1280 → 390: `/start` again. Signed in: no change either way. Both engines. |
| Overflow at 390 | None: page 390 wide, a sideways push leaves it at x=0, 8 runs. |
| Console errors | 0 in the 8 phone runs and the 8 computer loads. |
| The computer at 1280 against `main` | Same 228 (visitor) / 249 (signed in) drawn boxes, same position, size, colour, text and link address, in Chromium and in WebKit. The visitor's «Criar» there → `#start`, as on `main`. |
| The app's own menu | The app takes one function from `menu.js` (`threadBarStyle`, in `public/js/shell/BarMenu.tsx`), and it did not change. Proof by the build: of the 53 files `vite build` writes, 50 are byte-identical between `main` and `f3c4770` — `app.html`, the app's main script, the shared `menu` chunk (same name, same bytes) and every screen. The three that differ are the entry page's: `index.html`, its `splash` script and the `crate3d` script that names it. At `bca8ea9` the shared chunk did differ from `main`'s, which is what the commit set out to undo. |

The app's screens were not opened in a browser: with Firebase blocked the app does not start, and identical bytes say more than a look would.

## Findings

No new finding from the delta. Open, all P2:

- **P2-1 to P2-5 — carried from the first pass, unchanged** (see that report): with a keyboard at phone width the focused control can sit under the bottom bar; signed in, the step link is after the illustration in «Álbuns» and before it in the other four; at 360 the caption's year and button are just below the first screen; at 360 the caption breaks the album's name with an ellipsis (same on `main`); the Tab order leaves the crate's pause and Apple Music buttons for after the close (same on `main`).
- **P2-6 — on the computer, the test WebKit lets the page scroll 32 px sideways (same on `main`, not from this feature).** At 1280×800 in Playwright's WebKit, with less motion asked, the crate's scene ends at 1312 and the page can be pushed 32 px to the right. Identical on `main` 65a2005, so F96 neither caused nor changed it; Chromium does not show it. Not confirmed in a real Safari. Seen only because this pass ran WebKit at 1280, which the first pass did not.

## What I could not verify

- The same limits as the first pass: a real iPhone, a finger in WebKit, a screen reader, the page without script and with less motion on the phone, 375×667, where the links leave to.
- The app's screens in a browser (see above): judged by the identical build.
- 360×740 was not re-run in this pass; the delta does not touch layout.
