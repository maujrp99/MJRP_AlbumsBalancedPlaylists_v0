---
type: visual-parity-recheck
feature: F83
step: wave 6a (the inventory screen in React)
branch: claude/f83-wave-6a-fix-show-more
judged_on: 553fbd6
reference: claude/f83-sync-3-start-lean at 12f0234 (hand-made inventory, equal to production)
judge: independent (did not build)
date: 2026-11-22
previous: fail at 315ae5f (1 P0)
verdict: pass
p0: 0
p1: 0
p2: 1
---

# The inventory screen in React against the hand-made one: recheck 2

**Verdict: pass.** The fix commit (`553fbd6`, one commit on `315ae5f`) removes the P0: «Show 50 more» on Chromium phones now leaves the page where the parent leaves it. The fix covers 60 and 130 items, the list and the gallery, and every way of reaching the button. The list's 1/64-pixel text move is gone: 0 pixels at 1280. The builder's account of the 4,5 thousand pixels in «list full page» is correct. In the full computer and phone sets nothing else moved. The only finding left is the earlier P2-2 (the focus stays on «Filters and order» in Chromium). Nobody can see it, and it is a better behaviour.

## How

Same rules and scripts as the first pass (`scripts/`), with the fix built as a third tree:

- **Build:** `git archive 553fbd6` → `fix/`, `node_modules` cloned. `vite build` and the budget ran through the machine queue (label `f83-6a-judge`). Main script 211,686 B, ceiling 211,842 B; after the first screen 213,031 B; the budget passes.
- **Setup:** values ON (stubbed `/api/value-sources`, `/api/exchange-rates`, `/api/album-value`), Firebase blocked, my 64 items (or 60 or 130 for «Show 50 more»), own static server with the hosting's fallback, servers outside the queue.
- **New checks in each «Show 50 more» state:** how many rows are drawn, whether any row is drawn twice, whether the focused row is inside the screen, and the notice's `outerHTML`, its previous sibling and how many notices exist. These are compared parent against fix, like the text, boxes, scroll and focus.
- **Controls:**
  - Parent against parent, for «Show 50 more» at Chromium 393 with 130 items, and for the full-page states at 1280.
  - The unfixed build (`315ae5f`) through the same new states: it still fails, so the harness is sensitive (list 5,299 vs 10,749; gallery 8,395 vs 16,898).

## (1) The P0, «Show 50 more»: fixed

| Chromium profile | items | states (list and gallery: scrolled to the bottom, finger scroll, tap from the top) | parent vs fix |
|---|---|---|---|
| 393×852 (iPhone 14) | 60 | 6 | 84/84 equal |
| 393×852 | 130 | 6 | 84/84 equal (parent vs parent: 84/84) |
| 820 | 60 / 130 | 6 + 6 | 84/84, 84/84 |
| 899 | 60 / 130 | 6 + 6 | 84/84, 84/84 |
| WebKit iPhone 14 | 60 / 130 | 4 + 4 (no finger-scroll gesture in WebKit) | all equal |

**On each side:**
- Rows drawn: 60 of 60, or 100 of 130.
- All rows unique.
- The focus is on the first new album, and that album is inside the screen.
- The count reads «All 60 albums» or «Showing 100 of 130».
- There is one notice, `<p class="inv-discogs-notice">` with the same text, placed right after `#inventory-grid-container`, as in the parent.

Scroll after the tap, parent = fix: for example 5,299 / 8,395 at 393, 5,235 / 6,915 at 820, 5,219 / 7,347 at 899 (list / gallery).

**Is keying the notice sound? Yes.**
- It does what the hand-made screen did: the notice is rebuilt together with the list. The old screen called `container.appendChild(p.inv-discogs-notice)` on each draw.
- When the list box is remounted, no element stays mounted under it inside `#app`, so Chromium has nothing to anchor on.
- The key has its own prefix (`notice.`), so it cannot clash with its sibling's key.
- DOM and classes are equal to the parent, with no duplicates.
- One caution, not a defect: any new element that stays mounted below the remounted list will bring the jump back. `overflow-anchor: none` on that region would be the sturdier guard. The builder's test `Inventory.showMore.notice.test.js` covers the notice; it would not catch a new element.

## (2) The P2, the list's text pieces: fixed, and equal to the parent

- **Pixels, with the builder's 60 items:** 0 at Chromium 1280 (was 62). At 900, 7 px at most 3/255 remain at the edge of the view toggle. That is the same small change seen on the toggle in the first pass, not text.
- **Full list page at 1280:** the diff above the footer is now only the view toggle (see 3). In the first pass every row differed (6,657 px).
- **Text pieces, with every kind of value** (suggestion and lowest price with and without the Discogs link, none for sale, no CD edition, written value, waiting), list row and grid card: compared piece by piece against the parent.
  - The list is identical in all 64 lines. Example without a link: `"CD · Discogs · suggested · 22 Nov "` + `"≈ $…"`. With a link: `"CD · "` + link `"Discogs"` + `" · suggested · 22 Nov "` + `"≈ $…"`. `"None for sale on Discogs now "` + `"—"`.
  - The grid card's `origin-source` without a link is one piece, «Discogs · 22 Nov», on both sides.
  - The grid differs only in whitespace-only pieces between flex children. The old template wrote line breaks there; React writes nothing or a single space. These are not drawn: the grid compared at 0 px in both passes.

## (3) «list full page» at 1280: the builder's explanation is confirmed

- On the fix, «list full page» differs by 4,461 px (account run 4,495 px). Above the footer, the only area that differs is x 624–698, y 505–555: the view-toggle button. Below that, it is the footer's «Last updated» clock, which also differs parent against parent (886 to 1,132 px).
- In the full-page capture the new toggle is drawn hovered and the old one is not. The mouse is still on it after the click. React keeps the same button, while the old screen replaced it. Chromium re-evaluates the hover when the full-page capture resizes the page.
- **In the normal screenshot of the same state («list») both toggles look hovered and the pictures are equal, 0 px.**
- Extra state «list full page, mouse moved away»: only the footer clock remains (904 px; parent against parent 1,052 px).
- Capture: `captures/r2-list-toggle-hover-old-left-new-right-3x.png`.
- A person cannot see this as a difference: a mouse resting on a button shows hover in both.

## (4) Full sets again on the fix: nothing else moved

| pass | states | non-picture checks | pictures |
|---|---|---|---|
| Chromium 1280, visitor | 47 | all equal | footer clock, toggle hover (full page), ≤ 1/255 at the search box edge, toast timing; same as the first pass |
| Chromium 1280, account | 47 | all equal | same |
| Chromium 900 | 47 | all equal | ≤ 3/255 top bar and toggle, hover label during «Add the albums of my series», toast; same as the first pass |
| WebKit 1280 | 47 | all equal | footer clock, toast only |
| WebKit iPhone 14 / iPhone SE | 37 | all equal | toast timing; with the toast hidden 56/56 and 56/56 |
| Chromium 899 / 393 | 37 | the P2-2 focus only | with the toast hidden: ≤ 14/255 under the sheet backdrop |

## Findings

- **P0-1 (first pass), «Show 50 more» jump on Chromium phones:** fixed. Check: 504 comparisons across 393/820/899, 60/130 items, list and gallery, all equal.
- **P2-1 (first pass), list text pieces:** fixed. Check: 0 px at 1280; text pieces equal to the parent.
- **P2-2 (open, unchanged):** in Chromium, after closing the filters sheet by its footer with a change, the focus stays on «Filters and order» (parent: «the page»). Pictures are equal; this matches the map's rule that a closed sheet gives the focus back. Record it; nothing to fix.

## What I could not see

- WebKit has no finger-scroll gesture in Playwright: on the iPhone profiles «Show 50 more» was checked scrolled to the bottom and from the top. WebKit has no scroll anchoring, and it was equal in the first pass.
- Real devices, real Discogs, Firestore, MusicKit and Spotify, as in the first pass.
- I did not rerun the sign-in trap, the weight timing or the sweep of the other screens. The fix touches only `CardValue.tsx` and `Inventory.tsx`.
