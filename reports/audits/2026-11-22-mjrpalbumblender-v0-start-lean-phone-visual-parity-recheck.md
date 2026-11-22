---
type: visual-parity-recheck
feature: F79
branch: fix/f79-start-lean-on-the-phone
judged_on: 0736e186fceaaf5396c7977753cc256bd1af88d0
reference: design/proposals/f79-start-lean (Enxuta)
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 1
---

# F79 · Start screen lean on the phone — independent visual recheck

**Verdict: pass.** On the built site the phone screen matches the approved «Enxuta» reference in every state checked, plus the two later decisions (no steps in any state; «An artist» in the field). The computer screen shows no pixel difference beyond what a `main`-against-`main` run shows. One minor finding (P2), about the shared bottom sheet in WebKit.

## How

- `git archive` of `0736e18` and of `main` (`ae6ced4`; nothing under `public/`, `shared/`, `scripts/` or `vite.config.js` changed since the branch's base `c333385`) into the scratch folder, `vite build` of each through the machine queue (`machine_load.py run --label f79-judge`). Each was served with `vite preview` (lean on 5891, main on 5892) and both servers were stopped at the end.
- Playwright 1.56.1 borrowed from `MJRPpersonal`. **WebKit with the iPhone 14 profile** (touch, mobile) for the phone at 393×852 and 375×667, signed out and signed in. WebKit with a desktop profile for 1280, 1440, 899 and 900. Chromium (Pixel 7 profile) only for the keyboard-focus checks, because Playwright's WebKit does not move focus to buttons with Tab.
- Seams: Firebase hosts blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations` and every other outside host). The signed-in account is a local stand-in written to IndexedDB, with its lookup and refresh answered locally. The catalog is a fixture: a `window.MusicKit` stub injected before load, with `/api/musickit-token` answered locally and the covers drawn as local SVGs. No password was typed and `.env` was never read (it was only symlinked for the build). The orange «Authentication issue» toast in the signed-out captures comes from the blocked Firebase, not from the screen.
- Scripts and raw data: `seams.mjs`, `phone.mjs`, `desk.mjs`, `diff.mjs`, `kb.mjs` in this folder. Measures are in `raw/lean/results.json`, `raw/main/results.json` and `raw/desk-*/facts.json`.

## 1. Phone, 393×852 and 375×667, signed out and signed in (40 state captures + the sheet run)

States: first visit, typing, searching, results, albums chosen (top and bottom), last album removed (undo), paste a list, catalog did not answer, artist not found, «What is a series?» open.

| Check | Result |
|---|---|
| Title 26 px on 3 lines | 26 px; height ÷ line height = 2.94 → 3 lines, at both widths ✓ |
| Sentence of the series off the screen; «What is a series?» link | sentence hidden, link visible on every big-stage state, 44 px tall ✓ |
| Only the link under the field | «or paste a list» in first visit, typing, searching, results, chosen, failed; «Search an artist instead» in paste; nothing in «not found» ✓ |
| No steps | `#homeHow` hidden in every state (on `main` it shows on first visit and typing) ✓ |
| Field text «An artist» | ✓ everywhere on the phone; the computer keeps «An artist, or paste a list of albums» |
| Series bar only after the first cover | no bar in first, typing, searching, results, paste, failed, not found, sheet, undo; bar in chosen ✓ |
| Not-signed-in notice only with albums | signed out: only in «chosen»; gone again after the last removal; never when signed in ✓ |
| Touch targets ≥ 44 px | no visible interactive element under 44 px in any state (same as `main`) ✓ |
| No horizontal scroll | `scrollWidth` = viewport width in all 40 captures ✓ |
| Bottom menu with «Go» and the equalizer | present and intact in every state; the tab labels never overlap the bars ✓ |
| Nothing overlapping | bar 712–776 / menu 777–852 (393); bar 527–591 / menu 592–667 (375); the undo strip never overlaps the menu; the sheet sits above the menu with its backdrop, as in the reference ✓ |
| Focus visible | keyboard focus on «What is a series?» and «or paste a list»: 2 px white outline, offset 3 px (Chromium) ✓ |
| Sheet closes by button, backdrop, Escape | all three close it, at both widths, signed in and out ✓ |
| Sheet returns focus | keyboard path (Enter to open, Escape to close): focus goes back to the link ✓. Tap path in WebKit: focus goes to `<body>` → P2-1 |

Side by side with `caps/first-lean-out-393.png`, `state-lean-out-typing/searching/paste/failed/notfound/chosen/sheet.png`: same layout, same order, same words. The only difference is the field text, «An artist» instead of «An artist, or paste a list of a…», which is the later decision.

Evidence: `captures/phone-393-out-states-1.jpg` (first → chosen), `captures/phone-393-out-states-2.jpg` (chosen bottom → sheet), `captures/phone-375-in-states.jpg`, `captures/phone-focus-ring-what-is-a-series.png`.

## 2. Breakpoints 899 and 900 px (WebKit, signed in and out)

- 899: title 26 px, sentence hidden, link shown, no steps, hint «or paste a list», «An artist», no bar (`is-barless`, bottom padding 72 px). After one cover: bar on, padding 148 px.
- 900: title 52 px, sentence shown, steps shown, full hint and full field text, the computer dock, padding 160 px: the same values as `main` at 900.
- Pixels at 900, lean against main: 654–861 changed pixels, all in the top-bar and footer bands, the same as the main-against-main control (675–873). The lean rules stop exactly at 900 ✓. Evidence: `captures/breakpoint-899-900-lean.jpg`.

## 3. Computer 1280 and 1440, against `main`

Eight states at 1280 (first visit signed out and in, typing, results, chosen, paste, failed, not found) and seven at 1440 (signed in), full page:

- lean against main: 583–959 changed pixels per capture, all in the footer line (y≈988–999 at 1280) and a few pixels in the top bar.
- main against main (control): 676–976 per capture, in the same places.
- Same image sizes; no difference in the stage, results, dock or steps. Identical apart from noise ✓. Evidence: `captures/desktop-1280-lean-main-diff.jpg` (lean, main, magenta diff, control diff).

## 4. The builder's own decisions

1. **The bar stays when the series is already saved** (`barShows({ created })`). **Accepted.** A saved series always has at least one album until «Start another» resets it, so the condition is a safety net and does not change what the reference shows. *Not seen on screen:* saving needs Firestore, which was blocked, and the try ended in «Not saved · Try again».
2. **When the last album is removed, the undo strip stays at the menu level.** **Accepted.** Seen: strip at 716–768 (393) and 531–583 (375), just above the menu (777 / 592). It does not overlap the menu or the content, and it is in the place where the bar was, so nothing jumps. On `main` it sat above the empty bar (652).
3. **Bottom padding of 72 px without the bar.** **Accepted.** With the page scrolled to the bottom, the content ends 72 px above the menu, so the 52 px undo strip plus its 8 px gap does not cover the last row of covers.

## Findings

### P2-1 · After a tap, closing «What is a series?» leaves focus on the page, not on the link (WebKit)
- **Where:** the phone, «What is a series?» opened by a tap or click and closed by any of the three ways; `components/ui/Sheet.js` puts focus back on `cameFrom`.
- **Evidence:** `raw/lean/results.json` → `*-sheetlog`: `closeBtn/backdrop/escape.focus = body` in WebKit at both widths and both accounts. In Chromium with the keyboard, focus goes back to `BUTTON.home-what` (see `kb.mjs` output).
- **Why:** WebKit, like Safari, does not focus a button on tap, so the element focused when the sheet opens is `<body>`. This is the shared sheet's behaviour and not new code, but this change adds a new way into the sheet. Keyboard users are unaffected.
- **Check:** in WebKit, tap «What is a series?», press Escape, then `document.activeElement` should be the link.

## Seen outside this change (not counted)

- **Tapping «Search» after typing does not start the search, in WebKit, on both the branch and `main`.** iPhone profile with tap or click, and the WebKit desktop profile. Enter works; Chromium works. A likely cause: the field's `focusout` redraws the stage and rewrites the button's text (`search.textContent = 'Search'`) between press and release, so WebKit drops the click. The cause is not confirmed. This needs a check on a real iPhone; it is not part of F79's lean change.

## What I could not see

- A real iPhone (Safari, keyboard on screen, safe areas, dragging the sheet). Only WebKit with the iPhone profile.
- The real catalog and covers (fixture), and the real account (stand-in).
- The «series saved» state on the phone (Firestore blocked).
- Keyboard focus in WebKit (Playwright's WebKit skips buttons with Tab), so focus rings were checked in Chromium.
