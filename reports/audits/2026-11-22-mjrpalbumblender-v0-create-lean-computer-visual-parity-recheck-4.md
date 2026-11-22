---
type: visual-parity-recheck
feature: F79
branch: wip/f79-create-lean-computer-and-no-loading-line
judged_on: 1db178f
reference: main at 336385a; the previous tip f4cf2a6
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 1
---

previous: fail at f4cf2a6 (1 P1)

# F79 · fourth pass: the loading content lifted over the invisible grid (1db178f)

**Verdict: pass, with one P2.** The P1 is fixed:
- **The loading signal is in view.** In every window tested, on the computer and on the phone, whether Albums is opened directly or from the menu, the spinner or «Loading your series…» is fully inside the window during the wait. It never overlaps the filters, the header or anything else.
- **The shifts are unchanged** from f4cf2a6.
- **Nothing is left over** when the list or the empty card arrives.

The remaining P2: in WebKit (Safari's engine) and on the iPhone, when Albums is opened directly, the lift is read once, too early. The content then sits about 130 px lower than intended. It is still visible.

## How

- Scripts are in `recheck4/work/`: `pos.mjs` measures positions over the whole wait, and `runL.mjs` covers the shifts, the transitions, frame bursts at the moment the list arrives, and the screen-reader and focus facts.
- `1db178f` was built through the machine queue. It was served next to my `recheck2` build of main (336385a) and my `recheck3` build of f4cf2a6.
- The seam is the same as before: the data store's `getDocs` answers with two series (7 albums), none, or a failure, after a hold (1.5 s for shifts and transitions, 5 s for positions). Each scenario runs in a fresh browser context.
- Main was run twice as a noise control.

## (1) Where the loading content sits during the wait

- Values are the spinner's top and bottom on the computer, the text's on the phone, in px from the top of the window.
- The gap is the distance from the bottom of the filters panel to the top of that content.
- Every case was sampled about every 80 ms for 4.5 s.

| Window | Opened directly | From the menu |
|---|---|---|
| Chromium 1280×720 | 443–487, gap 75 | 400–440, gap 77 |
| Chromium 1366×768 | 442–488, gap 74 | 398–442, gap 75 |
| Chromium 1280×800 | 445–485, gap 77 | 399–441, gap 76 |
| Chromium 1440×900 | 444–486, gap 76 | 400–440, gap 77 |
| Chromium 1920×1080 | 444–486, gap 76 | 399–441, gap 76 |
| Chromium 900, 1000, 1100 ×800 | 443–487 | 398–443 |
| Chromium 899×800 (phone layout) | 124–206, gap 12 | 124–206, gap 12 |
| **WebKit 1366×768** | **576–620, gap 207 (stale lift)** | 399–443, gap 75 |
| **WebKit iPhone 393×852** | **256–338, gap 144 (stale lift)** | 124–206, gap 12 |
| **WebKit iPhone SE 375×667** | **256–338, gap 144 (stale lift)** | 124–206, gap 12 |

- **No overlap.** The content never overlaps the filters panel. Hit-testing at the content's centre finds only the page container.
- **Bottom menu clear.** On the phone the text ends at 338 or above, and the bottom menu starts at 776 (393) or about 591 (375).
- **The ±4 px jitter on the computer** is the spinner's rotating box.
- **Grid height is the same at every width.** The invisible grid is 184 px at 900–1920 and at the 899 boundary; the «No albums match…» text does not wrap at those widths, so the lift lands right there.
- Captures (`recheck4/captures/`):
  - `albums-loading-1366x768-chromium-direct.jpg`
  - `albums-loading-1366x768-webkit-direct-stale-lift.jpg`
  - `albums-loading-iphone375-direct.jpg`
  - `albums-loading-iphone375-from-menu.jpg`

### P2 · The lift is read once, before the grid has its final height (WebKit and iPhone, opened directly)
- **Where:**
  - `SeriesViewUpdater.updateEmptyState` reads `grid.offsetHeight` once, when the loading block is first drawn.
  - In WebKit, on a direct load, the grid is 52 px at that moment and grows to 184 px right after. The lift stays at `translateY(-52px)` for the whole wait (0 corrections in 4.5 s).
  - The same thing happens on the iPhone profiles.
  - In Chromium, and in every case opened from the menu, the first read is already 184 px.
- **Evidence:** `recheck4/work/rawP/pos-branch*.json`, the `trace` and `liftMismatch` fields.
  - WebKit 1366 direct: the lift is 52 px, the grid is 184 px, and the spinner sits at 576 instead of about 444.
  - iPhone direct: the text sits at 256 instead of 124.
  - For about 80 ms before that (first sample, grid at 52) the content is lower still, at 862 or 893 px, off-screen.
  - The builder's phone numbers (256 / 338) are this stale case. Opened from the menu, the phone gives 124 / 206.
- **Impact:** small. The content stays fully in view in every window tested, but it is not «right under the filters» in Safari or on the iPhone when Albums is opened directly. Resizing the window during the wait would leave the lift stale in the same way (not exercised).
- **Check:** the lift follows the grid's height while loading (re-read on the next frame or with a `ResizeObserver`), or the content is placed by layout instead of a measured number.

## (2) Layout shift, Chromium 1280, read held 1.5 s

| Case | main (×2) | f4cf2a6 | 1db178f |
|---|---|---|---|
| From the menu, list arrives | 0.112 | 0.031 | **0.031** |
| Opened directly, list arrives | 0.040 | 0 | **0** |
| Empty card arrives (no series) | no swap on main | 0 | **0** |
| Empty card arrives (failed read) | no swap on main | 0 | **0** |
| Refresh with the list on screen | 0.040 | 0 | **0** |

- Not counted: the page change itself (0.097–0.158, on every side) and a 0.0025 shift at first paint that main also has.
- The footer is steady during the wait: y=1040 opened directly, 995 from the menu. In WebKit it settles from 1000 to 1030 in the first ≈100 ms; f4cf2a6 did the same.

## (3) No residue; screen reader and focus

- **No frame shows the loading content together with the list or the empty card.** The «loading and content at once» flag was false in every sample of every scenario (Chromium 1280, WebKit 1280, WebKit iPhone).
- **The frames around the list's arrival are clean** (1.38–1.8 s; `recheck4/captures/burst-c1280-webkit-list-held-sheet.jpg` and `burst-p393-webkit-list-held-sheet.jpg`): the spinner is gone in the same frame that the list or its skeletons appear, and nothing is drawn outside the block.
- **The pass-3 facts are unchanged** in Chromium, WebKit 1280 and the iPhone:
  - The grid is `visibility:hidden` with 0 visible descendants.
  - «No albums match» and «No albums in library» are absent from the accessibility snapshot, and the loading status is present.
  - Tab never lands in the grid, and a click at its centre does not hit it.
  - Refresh with a list on screen keeps the list.

## (4) Settled screens

- **`/albums` and `/blend`, opened plainly and settled:** 0 pixels against main on Chromium 1280 and the iPhone.
- **`/albums` in Chromium 1280:** 0 against main in every settled seeded scenario (list, list from the menu, list after Refresh, no series, failed read, signed out). The main-against-main control shows 17 pixels in one scenario (Refresh) and 0 elsewhere.
- **The commit's files:** `SeriesLoadingState.js`, `SeriesViewUpdater.js`, a test, the log and the proof. `/start` and Blend are not touched.

## What I could not see

- A real Firestore read.
- Real Safari on a Mac or an iPhone (only Playwright's WebKit, which is where the P2 shows).
- Firefox.
- A narrow window where the «No albums match» text actually wraps: the grid stayed at 184 px from 899 to 1920 wide.
- A window resized during the wait.
