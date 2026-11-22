---
type: visual-parity-recheck
feature: F79
branch: wip/f79-create-lean-computer-and-no-loading-line
judged_on: f4cf2a6
reference: main at 336385a; the previous tip 0364a13
judge: independent (did not build)
date: 2026-11-22
verdict: fail
p0: 0
p1: 1
p2: 0
---

previous: pass at 0364a13 (2 P2)

# F79 · third pass: the loading block's height (f4cf2a6)

**Verdict: fail, with one P1.**
- The shifts are fixed: the measured numbers match the builder's.
- The new layout pushes the computer's spinner about 330 px down. On common laptop heights (1280×720, 1366×768, and 1280×800 when the screen is opened directly) it is below the fold. So during the wait the Albums screen on the computer shows **nothing** under the filters. That undoes, more quietly, what the previous fix (P1-1) was for.
- The phone is fine.

## How

- Scripts are in `recheck3/work/`.
- `f4cf2a6` was built through the machine queue, and served next to my `recheck2` builds of `main` (336385a) and `0364a13`.
- Seeding is the same as in pass 2: the page answers the data store's `getDocs` with two series (7 albums), or with none, or with a failure, after a 1.5 s hold. Each scenario runs in a fresh browser context.
- Chromium and WebKit 1280×800, and WebKit iPhone 393×852.
- `main` was run twice as a noise control; the two runs gave the same numbers.

## (1) Layout shift, Chromium 1280, read held 1.5 s

| | main | 0364a13 | f4cf2a6 |
|---|---|---|---|
| From the menu, list arrives | 0.112 | 0.663 | **0.031** |
| Direct, list arrives | 0.040 | 0.036 | **0** (none recorded) |
| Empty card arrives (no series) | — (no swap) | 0.141 | **0** |
| Empty card arrives (failed read) | — | 0.141 | **0** |
| Refresh with the list on screen | 0.040 | 0.036 | 0 |

- One shift of 0.097–0.158 is common to all three sides: it is the `/start` page changing to Albums, and it is not counted.
- The footer stays put for the whole wait: y = 1040 when opened directly, 995 from the menu.
- The settled position of the footer is the same.

## Finding

### P1 · On the computer the spinner sits below the fold: the wait looks blank
- **Where:** `/albums` on the computer during the series read.
  - The invisible grid keeps its 184 px, holding only its empty «No albums match…» block.
  - The 391 px loading block comes below that grid, and the spinner is centred inside it.
- **Evidence:** `recheck3/work/spin.mjs`. Spinner top and bottom while loading:

  | Window | 0364a13 (direct / menu) | f4cf2a6 (direct / menu) |
  |---|---|---|
  | 1280×720 | 446–484 / 397–443 | **778–815 / 729–774: off-screen, both** |
  | 1366×768 | 444–486 / 397–443 | **779–814 / 729–774: off-screen, both** |
  | 1280×800 | 446–484 / 397–443 | **778–815: cut by the fold** / 729–774 |
  | 1440×900 and 1920×1080 | visible | visible, low (about 775) |

  - At 1280×800, opened directly, the spinner's top half shows at the very bottom edge.
  - Captures: `recheck3/captures/albums-loading-computer-1280-prev-vs-new.jpg` (0364a13 against f4cf2a6) and `recheck3/captures/albums-loading-1366x768-spinner-below-fold.jpg` (an empty screen under the filters).
- **Check:**
  - On the computer, during the wait, the spinner is in view at 1280×720 and above.
  - The footer is still steady.
  - Ways to get there: place the spinner near the top of the reserved area (not centred), or let the loading block take the grid's place inside the same total height, rather than adding below it.

## (2) iPhone 393

- **Where the loading block sits:** box (16, 308, 361×282). The words «Loading your series…» are centred at y≈449.
  - 0364a13 had them at y≈131. The words moved to mid-screen but are still visible.
  - The block ends at 590, and the bottom menu starts at 776, so **nothing overlaps**.
- **Both sequences are clean:**
  - Series: loading @85, then the list @1593.
  - No series: loading, then the empty state @1589.
  - Neither shows «No albums in library» before or after.
  - Capture: `recheck3/captures/albums-loading-iphone-393-sequences.jpg`.

## (3) The grid while hidden (Chromium 1280, WebKit 1280, WebKit iPhone)

- **What is hidden, and how:**
  - The grid has `visibility: hidden`, and 0 of its descendants are visible.
  - It still contains the text «No albums match your filters…» in the DOM, but that text is **not exposed**: the accessibility snapshot shows neither «No albums match» nor «No albums in library», and the page's visible text does not contain it.
  - The `status` loading region is in the snapshot.
- **Focus and clicks:**
  - 40 Tab presses never landed inside the grid, which has 0 focusable elements.
  - `elementFromPoint` at the grid's centre does not hit the grid, so there is no click target.
- **Refresh with a list on screen:** the list is kept, with no loading and no empty state.

## (4) Settled screens and `/start`

- **Albums:** 0 pixels differ from main, branch against main, on every settled `/albums` screen (list, list after Refresh, none, failed, signed out), on Chromium 1280 and the iPhone.
  - The one exception is the phone's Refresh scenario, where the first main run lost its stand-in sign-in. Compared with the second main run, it is 0.
- **Blend:** `/albums` and `/blend` opened plainly, settled, are 0 pixels from main on both the computer and the iPhone.
- **`/start`:** untouched by this commit. It changes only `components/series/SeriesLoadingState.js`, `views/helpers/SeriesViewUpdater.js`, a test, the log and the proof.

## What I could not see

- A real Firestore read.
- Real Safari, and Firefox.
- A screen reader actually speaking the loading state.
- Window heights between 800 and 900 other than 1280×800.
