---
type: visual-parity-recheck
feature: F83
wave: 5b
branch: claude/f83-wave-5b-albums-windows
judged_on: f4e3262
old: 499399c (served from fbae3fd, which adds only tests and docs to 499399c; checked with git diff --stat)
judge: independent (did not build)
date: 2026-11-21
verdict: pass
p0: 0
p1: 0
p2: 3
---

# F83 wave 5b: the albums screen's windows in React. Independent visual parity recheck

**Verdict: pass.** The saved data is the same as the old windows' in all 23 of my own save cases (11 computer ranking, 6 phone ranking, 6 series edit, plus 1 phone edit). The order, the payload and the moment of each call to the stubbed repository and series service all match. The windows look the same. With transitions off, 0 px differ in every window picture in Chromium at 1280 and 393, and in WebKit on the built site at 1280 and 393 (iPhone 14 Pro profile). Focus, Escape, the backdrop and the sheets behave the same. The Start screen is unchanged. I found no P0 and no P1. There are three P2s. One of them is a new Safari-desktop difference that is worse than the builder describes.

## How it was checked
- **Trees.** Old: the dev server and `vite build` of `scratchpad/w5b/old5b` (fbae3fd: the 499399c production code plus tests and docs only). New: the branch worktree `agent-a5744ca4faee320b7`, whose app code equals f4e3262 (`git diff f4e3262 -- public src` is empty). I built both sites into `work/dist-old` and `work/dist-new` under `machine_load.py` and served them with `vite preview`. I stopped all four servers at the end.
- **Firebase blocked.** Every context blocked identitytoolkit, securetoken, firestore.googleapis and firebaseinstallations. Covers came from a local SVG.
- **Stubs (dev servers, both sides alike).** The page reached the real modules and replaced: `albumSearchService.scanArtist`; `SeriesService.prototype.updateSeries`, `deleteSeries` and `countSavedPlaylists`; and `userRankingRepository.saveRanking`. Every call was logged with a millisecond timestamp, together with the app toasts and the moment each window opened or closed. Nothing was written anywhere.
- **My own world.** One series of 8 albums, built for these cases: 12 tracks with ids; 12 tracks with no id; two tracks titled "Same" with no ids; two tracks titled "Same" with ids; a saved partial ranking (track 8 is rank 1, track 3 is rank 2).
- **My scripts** (in `work/`): `saves.mjs` (the save comparison), `vis.mjs` (pictures, focus and keys; transitions off), `start.mjs`, `badge.mjs`, `hover.mjs`, `leave.mjs`, `scroll.mjs`.
- **Unit tests.** The wave's tests on a clean `git archive f4e3262`, covering `test/screens/albums`, `test/ui`, `test/architecture`, `test/models` and `test/screens/start`: **101 files, 1225 tests green** (`work/tests.log`).

## Saves: the heart of the wave (`work/saves-1280.txt`, `work/saves-393.txt`)
The result is **23 of 23 cases SAME**. That covers the payload shape and values, the order of the calls, the ranking rows shown before saving, and the notices. The timings agree within about 30 ms. For the ranking: repository call 4 to 23 ms after Save; toast and close about 515 to 540 ms. For the edit: `updateSeries` immediately, toast and close about 150 ms later, the stub's delay.

| Case | What is written (both sides) |
|---|---|
| 1 track of 12 moved, the 5th to the top (mouse, and finger by the handle) | `saveRanking('u1','s0-0',{albumTitle,artistName,rankings:[Delta 1, Intro 2, Alpha 3, Bravo 4, Charlie 5, Echo 6 … Outro 12]})` |
| moved **down** (the 1st to the 4th; mouse, and finger) | Alpha 1, Bravo 2, Charlie 3, Intro 4, Delta 5 … all 12 |
| several drags, tracks with no id | same full list |
| saved partial ranking opened, nothing changed, Save | Golf 1, Bravo 2, then the rest in record order, 3 to 12 |
| changes, then Reset, then Save | the record order, 1 to 12 |
| phone: change, Reset, Undo, Save | the order from before Reset |
| phone: pick, Up, Down, Down, Move to 1, Done | Foxtrot 1, then the rest |
| Back + Discard (computer and phone) | **nothing written** |
| reopened after a save | the saved order is shown; Save writes it again |
| double-click on Save | **two `saveRanking` calls and two toasts, old and new alike** (P2-3) |
| same title twice (with and without ids), the 3rd dragged to the top | Same 1, Same 2, Other 3, Last 4 |
| edit: nothing changed | `updateSeries('s0',{name:'Floyd & Co', albumQueries:[8 entries]})`: the HTML entity is decoded on both sides |
| edit: rename "␣␣Floyd <b>II</b> &amp; more␣␣" | name `Floyd <b>II</b> & more`: trimmed and decoded; the markup is kept as text |
| edit: add two, remove the 2nd | the 7 left, then `{artist,title,appleMusicId,year,coverUrl}` for the two added, in the order picked |
| edit: Cancel after a removal, reopen, Save | the original 8: nothing of the cancelled edit |
| edit: empty name | no write; "Give the series a name before saving." Then a double-click after typing a name gives **one** write |
| edit: the write fails, then succeeds | 2 calls; the message, then "Series updated" and the window closes |
| phone edit: move down, move up | the reordered list |

**What is stored when a person moves one track of twelve:** the whole list, all 12 tracks numbered 1 to 12, `{trackTitle, userRank}`. The moved track gets its new place, and the other 11 are stored in the order shown. A person who only meant to rank one track has stored a full ranking. This is identical before and after the wave (the builder's item (d), kept as found).

## Drag
- **Mouse, Chromium 1280.** Real press, 14 moves, release. The order after each drop is identical old and new (5 drag cases).
- **Touch, Chromium 393.** CDP touch events. By the handle: the same order on both sides. Off the handle, over the text of a row: no move on either side.
- **WebKit, built site, iPhone 14 Pro profile.** Playwright has no touch-drag API in WebKit. `new Touch()` throws "Illegal constructor". Synthetic `touchstart`/`touchmove`/`touchend` events, with `touches` set on them, did **not** move Sortable on either side; untrusted events are a likely cause. What I *could* do: a real Playwright mouse drag by the handle inside the iPhone profile. It moved track 2 to the top **identically** on both sides. A real finger drag in Safari stays unproved.
- **WebKit 1280 (built).** The Playwright mouse drop moves a row one place only, on both sides, so the order is equal. The hover after the drop is not equal: see P2-1.

## Windows, states, focus and keys (`work/vis-chromium.txt`, `work/vis-webkit-built.txt`)
All of the following match old and new, in Chromium dev and WebKit built: which layers are open, where the focus is, and the pixels (0 px).
- **Edit window.** Opens; scan results; pick; Escape does nothing; a backdrop click does nothing; Tab moves through (no trap); empty name shows the message; X closes. Focus after close goes to `body`, the same as old.
- **Delete question.** It appears; Escape cancels; focus goes back to the Delete button.
- **Rank, computer.** Opens with the saved partial ranking first; Escape with nothing changed closes it; Reset then Back asks; inside the question, Escape means Keep editing; a backdrop click asks; Discard closes it.
- **Rank, phone.** Pick; the «Move to…» sheet; **Escape with «Move to…» open closes only the sheet, the window stays and the focus returns to "Move to"**: this settles the builder's open question about Escape, the same on both sides in both engines. Then Move to 2, Done, Reset with the Undo notice, the Discard sheet, and Escape on it.
- **The series «⋯» sheet** on the phone.
- **Two picture differences** were the page behind the window, not the windows:
  - a phone screenshot after the edit window closed (209 k px). It is **identical in the old-against-old control**, so it is an artifact of my capture harness.
  - the footer clock in WebKit.
- **Start screen** (`start.mjs`, 1280 and 393): empty search, search plus Enter, a filter, pick two, unpick one. The HTML of `#home-page` is the same, the pixels are 0, and the scan calls are the same. The empty-search picture differs only in the sliding toast, and the old-against-old control differs there too. The ported `pickerController.ts` matches the old `AlbumPickerController.js` line for line; only the private method names lost their `_`, and nothing outside used them.

## The four declared differences
1. **The edit window closes when the screen is left. Better.** Old (`leave.mjs`): `#edit-series-modal` is still open over `/saved-playlists`. New: it is gone. No issue needed.
2. **The rank window's notices vanish when the screen is left. Better.** Old: "Ranking saved!" and the phone's Reset "Undo" notice stay on `/saved-playlists`, with an Undo that acts on a window that no longer exists. New: gone. The app's own toast ("Rankings saved for …") remains on both sides. No issue needed.
3. **Same-title tracks with no id are no longer corrupted on drag. Better inside, invisible in the data.** Only `{trackTitle, userRank}` is written, so the old window's duplicated object saves the same titles and the same numbers: identical payloads in my 4 same-title cases. The builder's wording ("the ranking saved had a track twice and one missing") overstates the effect on stored data. It could only show as a wrong duration on a row. No issue needed.
4. **Kept as found.**
   - No Escape on edit, no backdrop close, no focus trap and no focus on open: confirmed the same as old. This deserves an issue row; it is an accessibility debt the wave did not create.
   - No icons on Back and Reset on the computer: the same as old. It deserves an issue row (small).
   - **Safari desktop keeps a row highlighted after a drop: NOT the same as old. It is worse, and not "kept as found".** See P2-1. It deserves an issue row.

## The «DELUXE» badge pixels: noise
- Element screenshots of the card: **0 px** old against new, after the scan, after a filter, after the filter is turned off, and after cloning the badges. This holds with transitions on and with them off.
- Whole-window screenshots with transitions on vary from run to run: once 534 px (max 35), once 445 px (max 4, a strip by a card's glow, not the badge), once 0.
- **New against new also differs (453 px, max 4).**
- With transitions off: 0 to 8 px of 1 level.

Conclusion: this is paint-timing noise from animated or blurred layers. It shows up new against new, so it is not a real old-against-new difference. I could not reproduce the builder's 154/255. Crop: `captures/deluxe-badge-after-filter-old-left-new-right-x4.png`.

## The built-site failures the builder lists (`raw/browser-proof-results-*built*.json`, opened one by one)
- **Chromium 277 of 289 (12 failures).**
  - 9 window pictures differ by 1 to 9 px at 1 level in 255: anti-aliasing noise.
  - 1 picture differs by 34 px of 11 levels on the «4 ALBUMS» badge (phone, after "moved up").
  - 2 "no error on either side" checks fail on both sides alike, for two reasons:
    - the published build's search worker gets HTML from the preview server ("Unexpected token '<'");
    - `saveRanking` reports "client is offline", because Firebase is blocked.

  This is the environment, not the code.
- **WebKit 1280: 118 of 126 (8 failures).**
  - 6 are the stale hover after a drop (P2-1).
  - 1 is "Back with a change asks": 50 k px at 3 levels, the confirm overlay's dim edge, faint.
  - 1 is the same pair of errors on both sides.
- **WebKit iPhone: 150 of 151.** The only failure is that same pair of errors on both sides.

## Findings
### P2-1. WebKit desktop: a row stays highlighted after a mouse drop, and keeps it after the pointer moves away (a new difference)
- **File:** `public/js/screens/albums/RankWindow.tsx` together with `public/js/react-bridge/sortableTracks.ts`. The bridge puts the dragged node back, React reorders it, and WebKit does not recompute the hover style on the moved node.
- **Evidence:** `work/hover.mjs` on the built site in WebKit 1280. Right after the drop, the old window highlights row 0 (under the pointer) and the new one highlights row 5. After the pointer moves 3 px, and even **1.5 s after the pointer has left the list**, the new row 5 still computes `background rgba(255,255,255,0.1)`, the hover colour, while `:hover` is false. Old: all rows at 0.05. Chromium: equal. Captures: `captures/webkit1280-after-mouse-drop-old-left-new-right.png` and `captures/webkit1280-after-pointer-moves-old-left-new-right.png` (two rows lit on the new side).
- **The builder said:** "until the pointer moves". What I saw: it persists. The emulated mouse may exaggerate this, and real Safari is not proven.
- **Change:** open an issue row. Possible remedies: force a style recalculation on the moved row after `onEnd`, or let React own the node move (cancel Sortable's DOM move). Not blocking.

### P2-2. The proof document overstates the same-title "corruption"
- **File:** `reports/evidence/F83/wave-5b/proof-wave-5b.md` §7 and `map-wave-5-albums.md` «O que muda de propósito» (3).
- **Evidence:** identical payloads in 4 same-title cases. The write carries titles only.
- **Change:** say "the old window held the same track object twice; what was written was identical, because only titles and numbers are written".

### P2-3. A double-click on Save in the ranking window writes the ranking twice (the same as old)
- **File:** `public/js/screens/albums/RankWindow.tsx` (the save handler), the same as old `UserRankModal.js`.
- **Evidence:** `saves-1280.txt`, "double click on Save": two `repository.saveRanking` calls 1 to 18 ms apart and two toasts, on both sides. The edit window, by contrast, guards against a second press.
- **Change:** an issue row (guard while saving, as `seriesDraft` does). It is harmless today, because the second write is identical.

## What could not be seen
- A real finger drag in WebKit or Safari, and a real iPhone.
- The real Apple Music catalog, the real series service, and Firestore writes. The calls that reach them are compared; nothing was written.
- The Portuguese text of the windows.
- The phone's Up/Down state after a drag (the builder's item (e)): not exercised.

## Paths
- Report: this file.
- `captures/` (1.2 MB): side-by-side old (left) and new (right) pictures.
- `work/`: my scripts, `saves-*.txt`, `vis-*.txt`, `tests.log`, and the builds' logs.
