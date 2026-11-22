---
type: visual-parity-recheck
feature: F79
branch: fix/f79-search-tap-starts-the-search
judged_on: 42afedc
reference: main at b8947e0
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 0
---

# Start screen: «Search» with the field focused (UAT-282) — independent recheck

**Verdict: pass.** The fix makes «Search» start the search in WebKit, on the phone and on the computer. Nothing else moved, in behaviour or in pixels.

## How
- `git archive` of `main` (b8947e0) and of the branch (42afedc) into this folder. Each side was built with `vite build` through the machine queue (label `f79-search-judge`) and served with `vite preview`, main on port 4791 and the branch on 4792. I checked the built bundles: main writes `textContent` every time, and the branch writes it only when the label differs.
- Playwright from MJRPpersonal, with WebKit and Chromium. The Firebase hosts were blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`). `/api/musickit-token` returns a dummy string, not a key. A fake `window.MusicKit` answers the catalog: «Radiohead» returns nine fixture albums with solid-colour covers, and any other name returns «artist not found». Every other `/api/*` call was stubbed to return 503, and none was called. No password was typed and `.env` was not read.
- Scripts: `js/lib.cjs`, `js/func.cjs`, `js/pix.cjs`. Raw results: `func.txt` and `pixels.txt`. Screenshots: `shots/`.

## 1. The fix (type an artist with the field focused, then press «Search»)
| Profile | main | branch |
|---|---|---|
| WebKit iPhone 14 (393×852), click | 0 covers | 9 covers |
| WebKit iPhone 14, `tap()` with touch | 0 | 9 |
| WebKit 1280×800, click | 0 | 9 |
| Chromium 1280×800, click | 9 | 9 |
| Chromium Pixel 7, `tap()` | 9 | 9 |

On main in WebKit, the defect shows on three searches: the first search, a second search from the results, and the «not found» search. None of them starts on main, and all three start on the branch.

## 2. Nothing else changed (main and branch give the same results in every profile)
- Enter starts the search on both sides: 9 covers in every profile.
- Button label: `drawStage` gives the button only two labels, «Search» and «Searching…». A mutation observer on the branch recorded this sequence: «Search» → «Searching…» (disabled, `aria-busy`) → «Search» (enabled). It held for the first search, the second search and the not-found search, in all five profiles. The sequence matches main wherever main's search starts, which is in Chromium.
- Paste state: the button stays «Search» and enabled, and it is hidden together with the field, as on main. Going to the list and back writes no label change.
- «or paste a list» opens the list and hides the field. «Add albums» is disabled while the list is empty; after a line is typed it reads «Add 1 album» and is enabled. «Search an artist instead» brings the field back.
- «What is a series?» opens the sheet on the phone profiles. At 1280 the link is not shown because the sentence is already on screen, on both sides.

## 3. Pixels (branch vs main, with a main-vs-main control)
- States: first visit, typing, searching, results, not found, paste.
- Sizes: WebKit 393×852 (iPhone 14 profile, 3× density), WebKit 1280×800, Chromium 1280×800.
- Screenshots were taken with animations disabled and reduced motion on. The searching, results and not-found states were reached with Enter, so that both sides reach the same state.

**All 18 comparisons show 0 differing pixels between the branch and main. The main-vs-main control also shows 0.**

## Findings
None (no P0, P1 or P2).

## What I could not see
- A real iPhone: Safari on the device, the on-screen keyboard and a real finger. Playwright's WebKit reproduces the defect and the fix, but it is not the Safari on the device.
- The real Apple Music catalog and a signed-in user, because Firebase was blocked. Both sides show the «Authentication issue» banner on the phone. In the phone «searching» screenshot the banner covers the field, so the label there was checked by the observer, not by the pixel comparison.
- «Add N albums» was not pressed, because it calls the stubbed album search. The paste flow was checked only up to the button's state.
