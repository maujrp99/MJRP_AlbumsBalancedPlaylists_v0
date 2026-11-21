# Albums screen and album window: capture notes (2026-11-21)

Capture only; no design judgement. Nobody can sign in, so the real `SeriesView` (real components, real CSS, real phone shell, real Footer, real `filterSeries` / `countAlbums` / `deriveSeriesState` / `paginate`) is mounted over fixture data and a stand-in controller (the F76 seam, copied and extended in `harness/`; F76 files untouched).

## How it was served and shot

```sh
npx vite --port 5401 --strictPort --host 127.0.0.1 .        # from the worktree root
node reports/evidence/visual-recheck-batch/2026-11-21/albums/shoot.mjs 5401 9401
```
Google Chrome headless over the DevTools protocol (debug port 9401, scratch profile outside the repo). 1280x800 desktop; 393x852 phone (mobile emulation, touch, DSF 2). Animations frozen before measuring; covers (data-URI SVGs) loaded before each shot. Clicks are real `Input.dispatchMouseEvent`, typing is real `Input.dispatchKeyEvent`. Pages: `harness/albums.html` (query: `state=loading`, `view=list`, `scope=single&seriesId=s5`, `states=mix`, `notices=1`), `harness/album-window.html` (`screen=album|rank`). Fonts come from Google Fonts at load; computed families in measures.json are the declared stacks.

Harness differences from F76: groups are `{series, queries, keys}` as in the real `getPageView` (F76 gave `{series}` only, which would have broken the album count); `platformWiring.js` imported (the album window throws without it); the search/filter handlers redraw once per tick like `renderFromStore` (no timer); series `s2` (15 albums) and `s7` (13) are on page 1 for the load-more button.

## States

| State | Files | How reached / what is seen |
|---|---|---|
| grid-all | `grid-all-1280/393.png`, `grid-all-1280-full.png` | 50 series, page 1 of 5 (10 per page), ready. Pager top: «Showing 1–10 of 50 series · 67 albums» (phone: «1–10 of 50 series · 67 albums» with ‹ ›). Filter toolbar present. The F72 count is in `Pager`, not in `SeriesHeader`. |
| list-all | `list-all-*` (+ `-full` at 1280) | `view=list` (`viewMode: 'expanded'`). |
| loading | `loading-*` | `state=loading`: every entry `pending`, `isLoading` true: skeletons for every series. |
| series-states | `series-states-*` | `states=mix`, via `getSeriesStates()` (real `deriveSeriesState`): s1 loading (skeleton), s8 loading with 3 found, s5 one album failed («1 album did not load. Try again», 7 found), s6 all 5 failed («5 albums did not load. Try again», failed group, no cards), s4 asks for no album. s1 being first puts a skeleton at the top. Details in measures.json `_extra`. |
| single | `single-*` | `scope=single&seriesId=s5` (Pink Floyd, 8 albums). H1 is the series name; the pager draws nothing for a single series (`paging.single`; top and bottom pager text are empty); the «N albums» text appears only in the series group header, which the single-series grid does not draw. So «the albums of that series» wording is NOT shown on this screen in this code: not reached. |
| filtered | `filtered-*` | Search field clicked once, then «discipline» typed key by key. Count: «Showing 1–10 of 12 series (of 50 in all) · 10 albums» (the «x of y» form is `(of 50 in all)` in `Pager._count`). Typing result (both sizes): focus stayed on `#genericSearch` after every one of the 10 keys, final value «discipline», no re-click. Caveat: this is the stand-in (microtask redraw, no debounce); the real `SeriesController.handleSearch` was read (`requestLoad` then microtask `renderFromStore`, no timer) but not executed. |
| load-more | `load-more-*`, `load-more-open-*` | s2 (15 albums): button «Load 3 more albums», 12 cards shown. Real click on the button: all 15 shown, button gone, header «15 albums». |
| album-notices | `album-notices-*`, `album-notices-list-*` (grid and list) | `notices=1`. Drawn: F55 «accepted with a subtitle» notes on three cards of s1 (short title / more in parentheses / another spelling), via `metadata.identityReason`; plus one failed album in s3 («1 album did not load. Try again»). |
| ranking-window | `ranking-window-*`, `ranking-window-rank-*`, `album-close-button-393.png` | Real `ViewAlbumModal` and `UserRankModal`: «In the Court of the Crimson King (Expanded Edition)», 8 tracks with durations (m:ss, e.g. 7:22), 5 originals with BestEverAlbums rank and rating, 3 extras («Duo Version», «Backing Track», «Alternate Mix») with none. Close: label «Close» (phone icon button 44x44, `aria-label="Close"`; desktop has a text «Close» button 85x43 in the footer; the desktop header X has no label). The `rank` window and the lower rows need scrolling inside the window and are not all in the first screen. |
| footer | `footer-1280.png`, `footer-393.png` | Desktop: real Footer, «Clear Cache» visible at the bottom. Phone: the footer is hidden (button in DOM, not visible); `#phoneMenuBtn` opened with a real click; the sheet shows «Sign In», «Connect», «Clear album cache» (label differs from «Clear Cache»). |

## Not drawn on this screen (code evidence)

- F55 «asked album was not found» reason: a not-found entry only adds the count in `SeriesGridRenderer._renderFailureNotice` («N albums did not load» + Try again); `FailureReason.NOT_FOUND` is not shown anywhere.
- F52 rating «failed / try again»: `ratingsOutcomeOf` (`models/ratingsOutcome.js`) has no caller in `public/js` outside the model.
- F69 popularity «failed» / «no data»: only `TracksRankingComparison.renderPopularityNotice` (needs a `popularity` prop); `ViewAlbumModal` creates the comparison without it, and `SeriesController.getPopularityStatus/askPopularity` have no view caller. Not mounted standalone, as instructed.

## Measures (measures.json, per capture)

No capture has anything past the right edge, and `scrollWidth` equals `innerWidth` everywhere. Phone: interactive elements under 44x44 are 1-2 per screen (top-bar logo link 28x28; `Connect` 109x30 on the footer sheet; the «Series» filter chip 158x36 on single); text under 12px 0; inputs under 16px 0. Desktop: text under 12px is the 10px year chip on cards (67 on grid-all). Body background rgb(0,0,0); body and h2 use «Syne, sans-serif» (the single-series phone h1 resolves to the system stack).

Console: no errors or warnings in the final run. (The first run, before `platformWiring` was added to the album-window harness, threw `newId(): no id source wired`; that was a harness gap, not the app.)

Files are in this folder: 33 entries (30 PNG, measures.json, shoot.mjs, NOTES.md, harness/).
