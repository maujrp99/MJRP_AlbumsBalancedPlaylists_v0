# Wave 5a (the albums screen): what was proved, with what, and what was not

Old = the tree before the wave (`8e685cd`, the hand-made screen); new = the branch tip. Everything below was run with Firebase Auth and Firestore
**blocked** (identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations): the page is a visitor, nothing is made in production.

## 1. Page, focus and what the screen asks of the world: 36 scenarios (jsdom)
`test/screens/albums/Albums.sameAsBefore.test.tsx` against `test/fixtures/albumsBeforeF83.json` (written by the hand-made screen,
`capture-before.test.js`, run twice and identical): every page after every step, the focus, and the calls to the load, the windows that stay
hand-made, the dialogs, the notices, the address and the scroll. 40 tests green; it accuses a changed word, a changed class and a focus left elsewhere.
Differences on purpose, each in the test file: the watcher of the groups off screen (it never worked with the list cut to a page); the pager's
watcher asked for twice under the strict mode; the focus 250 ms after turning into a computer with the sheet open.

## 2. Chromium, 1280 and 393, real clicks/keys/taps (`browser-proof.mjs`): 71 checks of page, focus and pixels
- old against new (dev servers): page and focus equal in every step; 5 pixel notes, all explained below.
- old against old (the control): the same top-bar noise (24,091 px at 1280, 22,548 at 393) and the clock of the footer (112 px).
- with transitions off: the same, plus the 11-20 px below.
- on the built site (`vite preview` of both builds): the same set (24,098 px: the top bar and 7 more).
The notes: (a) top bar, 24,091 / 22,548 px, box y 16-78 (1280) and y 56-137 (393): the frame the shell draws, identical in old against old (known
since wave 4); (b) «Last updated» in the footer, 96-976 px, box y 874-886: the clock of the minute each page opened, identical in old against old;
(c) «the list view» and «a column of a track table pressed», 11-20 px of **1 level in 255**, box x 838-1215, y 146-184 (the bar): not in old against
old; `locate-pixels.mjs` compares the box and the computed style of all 77 elements of the bar on both pages and they are equal to two decimals
except which of the two «All Years» options (the old list has the entry twice, see 5) the browser marks as chosen. **Not explained beyond that**:
sub-visible raster noise on the view buttons (a `scale-105` transform), nothing a person can see.

## 3. WebKit with the iPhone 14 Pro profile, on the BUILT site (`ENGINE=webkit WIDTHS=393`): 40 checks, 38 equal
Page and focus equal in all 17 steps (filters sheet, chip, album and series sheets, list in the sheet). The 2 notes: the top bar (the same noise as
in Chromium, scaled by the device pixel ratio) and `Worker Error: SyntaxError` on BOTH sides (the search worker of the published build, not this screen).
**This pass found a defect that nothing before it could**: the sheet of the filters showed the previous draw's choice in the published build
(the toolbar read its props for the sheet before assigning them; the strict mode's second draw hid it in the tests and in the dev server). Fixed
(`ui/FilterToolbar.tsx`); the lesson is in `wave-lessons.md`.

## 4. Redraw with 300 covers (`redraw-300-covers.mjs`, fixed so that the 1280 list is recognised: the test albums had no `getTracks`, the old screen threw and drew nothing)
Median of six redraws, ms; the machine's queue was in use by other sessions (the numbers are of the day; old and new were run back to back).
| | old, built | new, built | old, dev | new, dev |
|---|---|---|---|---|
| 1280 grid, 25 series × 12 | 51.8 | 42.6 | 49.1 | 77.2 |
| 1280 list, 25 series × 12 | 52.8 | 41.8 | 48.2 | 79.9 |
| 1280 grid, 1 series × 300 | 44.9 | 39.9 | 40.7 | 69.6 |
| 1280 list, 1 series × 300 | 40.8 | 38.7 | 47.2 | 71.8 |
| 393 grid, 25 × 12 | 22.9 | 24.7 | 21.9 | 38.7 |
| 393 list, 25 × 12 | 28.3 | 16.0 | 23.1 | 40.9 |
| 393 grid, 1 × 300 | 19.2 | 17.7 | 14.5 | 29.6 |
| 393 list, 1 × 300 | 14.2 | 14.6 | 19.1 | 32.6 |
On the **built site** (what a visitor gets) the React screen is at or under the old one everywhere except 393 grid 25 × 12 (24.7 against 22.9 ms,
+8 %, inside the 1.2× ceiling). On the **dev server** it is 1.6-1.9× slower: that is React's development build plus the strict mode drawing
twice, not the screen; it is reported so nobody is surprised by it.

## 5. Kept as they were (found while porting, not decided here)
- The «Year» and «Source» lists have their «All Years» / «All Sources» entry twice (the label entry and the option of the list).
- «Refresh» reloads the scope the address asked for when the screen opened, not the series chosen since in the filter.
- Every filter is «on» for the «No albums match» notice (the empty filters are `''`, not `'all'`).
- «Go to Start» in the empty state is a full page load (`window.location.href`), not a navigation of the router.

## 6. Not checked, and why
- The real catalog (MusicKit: the developer token comes from the server and the search needs the catalog of Apple) and the real Spotify enrichment
  (popularity needs a connected account): the loads are replaced by entries put in the load store (found, failed with a reason, some failed,
  popularity `empty` / `failed`), which is what the screen reads; a real call would still have to prove that Apple Music's answer fills those entries.
- Writing a ranking (`ownRankingService.save`) and removing an album from a real series (`SeriesService`): the windows and the service are stand-ins
  that write down what the screen asked.
- The screen read by a person in Portuguese (only the dictionary agreement test reads it).
