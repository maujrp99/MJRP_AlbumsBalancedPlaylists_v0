# Wave 5b (the windows of the albums screen): what was proved, with what, and what was not

Old = the tree before the wave (`fbae3fd`: the hand-made windows `SeriesEditModal`, `SeriesModals`, `UserRankModal` still there; the production code of
`499399c`, the 5a tip); new = the branch tip. Everything below that opens the app was run with Firebase Auth and Firestore **blocked** (identitytoolkit,
securetoken, firestore.googleapis, firebaseinstallations): the page is a visitor, nothing is made in production.

## 1. What the windows draw and ask of the world: 50 scenarios (jsdom)
`test/screens/albums/AlbumWindows.sameAsBefore.test.tsx` against `test/fixtures/albumWindowsBeforeF83.json`, written by the hand-made windows
(`capture-before.test.js`, run on the old tree and written again after each change of the scenarios; identical on the unchanged ones):
- the window to edit a series with its album picker (the scan busy, results, every filter, Enter, the empty text, the catalog that finds nothing, that
  is late («Try again»), that fails, the AI list that arrives or fails, a pick, a repeat, a removal, Cancel, the cross, Escape and a click outside, a scan
  that answers after the window closed, the save busy / refused / with no name / with no database / again, the albums moving on the phone, the computer
  with no move buttons), the question to delete a series (asked, with one or several saved playlists, not confirmed, the service that fails, the count that
  fails, a series that is not there, no database), and the window to rank the tracks (the order of the record, the saved order with a partial ranking, a
  drop, Reset, the save, a refused or broken save, Back and Escape with and without a change, a click outside, the question, Keep editing; on the phone:
  the window, the tap and Up / Down / Done, «Move to…», Reset and Undo (and 5 s), Back with a change, the sheet, turning the phone into a computer and back,
  the sheet open and Escape; the ranking saved **through the real ranking service down to the ranking repository** on the computer and on the phone).
- What is compared at each step: what stands over the page (every element of `body` but `#app`, attribute by attribute, the classes as a set), where the
  focus is, and EVERY call to what is outside, in order: how the series service was made, `updateSeries` with the payload, `countSavedPlaylists`,
  `deleteSeries`, the catalog scan, the notices, the question (its words), `onSubmit` with the ranking, `onSave` and `onClose` and **when** (the save closes
  500 ms after the confirmation and only then says `onSave`; the notice stays 2 s, 5 s with Undo), the options the drag library was given and when it was
  let go, and the call the repository would have received (`saveRanking(userId, albumId, { albumTitle, artistName, rankings })`).
- 105 tests green: the 50 scenarios (normal mode of React), the 50 again in the strict mode (the notes without the pair the strict mode adds to the drag
  library), four proofs that it accuses a different word, class, call (a rank off by one) and focus, and the list of scenarios.
- A real difference the golden file found while it was written, kept as it was: the old window asks for two icons that do not exist (`ChevronLeft`,
  `RotateCcw`), so the «Back» and «Reset» buttons of the computer have none.
- What it cannot prove: how the drag library behaves with a real pointer (below), the pixels, the real catalog.

## 2. The hand-made proofs that were carried over
`SeriesEdit.test.tsx` (21), `SeriesEdit.phone.test.tsx` (4), `RankWindow.test.tsx` (16), `RankWindow.phone.test.tsx` (15), `rankSession.test.ts` (8),
`PickerCard.test.tsx` (4), `ModalShell.test.tsx` (9: the React shell equals `BaseModal.render`, four widths, with and without a footer). The old files
(`SeriesEditModal*.test.js`, `UserRankModal*.test.js`, `DiscographyRenderer.card.test.js`) were taken over with the scaffold changed and the
assertions kept; the one new rule they added: a partial ranking is saved as the order left on screen, every track numbered.

## 3. Chromium, 1280 (a mouse: the drag is a real press, a move in 14 steps and a release) and 393 (a touch screen: taps and a drag by CDP touch events, by
the handle and off the handle) — `browser-proof.mjs`
What is outside the windows is replaced alike on both sides by stand-ins that write down every call (`window.__calls`): the catalog scan, the series
service (its prototype, so the real service object is the one the windows reach) and the **ranking repository** (`userRankingRepository.saveRanking`): a
ranking goes the whole way a real one goes (window, screen, controller, ranking service) and stops at the repository; what would be written to the person's
own data is compared old against new.
- **old against new, dev servers: 60 steps, 347 checks, 329 equal.** The windows over the page 60 of 60, the focus 60 of 60, the calls to what is outside
  60 of 60 (the scan with the text and the Enter, the write of the series with its payload, the count of saved playlists, the delete, and the ranking that
  reaches the repository), the rows of the ranking (order and numbers) 60 of 60, the words of the notices 59 of 60 (the one that differs is the delete
  notice read in the middle of its life: it differs the same way in the control), the picture of the window 28 of 45.
- **the control, old against old: 334 of 347**; the same 59 of 60 on the notice; the picture of the window 33 of 45. The 12 pictures that differ of
  old against old are the noise that exists on this machine: 1 to 9 pixels of 1 level in 255 on text, and, on the phone, the top bar of the app behind
  the window (26.9 thousand pixels, the same «known noise» of waves 4 and 5a) and 2.9 to 6.9 thousand pixels of 14 levels at the 393 picker cards.
- **with the transitions off: 335 of 347** new against old and **345 of 347** old against old (the two that fail old against old: the top bar of the app at 393 and the delete notice read mid-life). Without transitions the 1-pixel noise is gone, and what is left of new against old besides those two is exactly: the badge «DELUXE» (8 pictures: the 6 at 1280 and the 2 at 393, the same pixels), 46 pixels of 3 levels on a filter chip of the phone window (1) and the 34 pixels of 11 levels on «4 ALBUMS» (1).
- **the 17 pictures that differ new against old**, by cause: (a) the same noise as the control, 8 pictures: 1 to 4 pixels of 1 level in 255 (6 pictures)
  and the top bar of the app behind the phone window (22.6 and 26.9 thousand pixels at 393); (b) **the badge «DELUXE» on a card of the picker**, 8 pictures:
  168 to 193 pixels at up to 154 of 255 at 1280 (6: every picture after the first filter) and 293 pixels at up to 148 at 393 (2): the lettering of the badge
  (9 px, uppercase, over a backdrop blur) is rastered differently; (c) 34 pixels of at most 11 levels on the badge «4 ALBUMS» of the phone window (1).
  **What was done to explain (b) and (c):** the DOM of the card is identical to the character (only the order of two attributes differs, `alt` first in
  React); the box and the computed style of all 50 elements of the cards are equal to 0.001 px (`locate-box.mjs`); forcing a new raster (the grid moved
  by a pixel and back, the window scrolled by a pixel) does not change it; hiding the cover does not change it; taking the backdrop blur off the badges
  makes the two equal; **replacing the badges by clones of themselves, on both sides, makes the two equal (0 pixels)** (`locate-raster.mjs`). So what
  differs is not what the badge is, but the paint history of the node that was made (a card React kept across a draw, against a card the hand-made grid made
  again at every draw). **Not explained beyond that**; nothing a person can see (9-pixel capitals over a blur, 154 of 255 on the edge of a glyph).
- the drag: the track is dragged from the bottom to the top with the real mouse by the whole row (the whole row is the handle on a computer), and a
  little down; the order and the numbers are equal old and new after each, and equal after Reset, after a partial move (one track moved, the rest left),
  and the ranking that Save hands to the repository; on the phone a finger drags by the handle (the track goes to the top: equal) and a finger over the text
  of a row, off the handle, does not move it (equal: the order is the same as before).
- the keyboard and the focus: Escape with nothing changed closes; Escape with a change asks, and inside the question Escape is «Keep editing»; a click
  outside the window closes it or asks; Escape and a click outside the window to edit a series do nothing (the hand-made window did not have them); the
  focus after each press is the same control on both sides.
- no error of the page on either side, except the one the test provokes (a refused write of the series, written to the console by both).

## 4. The BUILT site (`vite build`, `vite preview` of both trees), Chromium (1280 and 393)
The modules are bundled there, so the page cannot swap the services: this pass proves what does not ask the service (the window opens, the name, a
removal, the albums moving on the phone, Cancel, the cross, Escape, the refused save of a visitor with no database, the delete of a visitor with no
database (the notice), the ranking window and its drags and sheets, Back and Discard, the Save of a person with no account whose repository answers
«client is offline»).
- old against new: **289 checks, 277 equal**: the windows, the focus, the calls, the notices and the rows 50 of 50 each; the picture of the window 27
  of 37. Old against old: 279 of 289 (picture 29 of 37). The 10 pictures that differ new against old are 1 to 9 pixels of 1 level in 255 and the 34
  pixels of 11 levels on «4 ALBUMS» of the phone (cause (c) above). Both sides log the same two errors (the search worker of the published build, as in
  wave 5a, and the repository of the ranking that is offline because Firebase is blocked).

## 5. WebKit (the engine of Safari) with the iPhone 14 Pro profile, on the BUILT site
- **393 (the phone): 151 checks, 150 equal, and 0 pixels apart in every picture of the window.** The windows over the page, the focus, the calls, the notices
  and the rows (the taps, Up / Down / Done, «Move to…», the sheet, Reset and Undo, Back and the sheet that asks, Keep editing, Discard) equal in all 28 steps; the
  one check that is not «equal» is «no error on either side»: both sides log the same two errors (the search worker of the published build and the repository of
  rankings, offline because Firebase is blocked). The phone window was the place the 5a pass found a real defect only the build showed; here the built site in
  WebKit shows none.
- **1280 (a computer with a mouse): 126 checks, 118 equal.** The windows, the focus, the calls, the notices and the rows 22 of 22 each. The 7 pictures that
  differ are **the hover state after a drop**: in WebKit the row that is highlighted after a mouse drop is the one the dragged row was put back on (the bridge
  of wave 2 puts the row back where React had it and React then draws the new order), not the one under the pointer, until the pointer moves (72 to 109
  thousand pixels at up to 77 of 255: one row lighter). Chromium recomputes the hover and does not show it (0 to 5 pixels there). The order and the numbers
  are equal; in WebKit the drop of Playwright's mouse moves the row by one place (the native drag of that engine is not driven as well as Chromium's). This is
  a difference to the old window that a person using Safari on a computer would see for as long as the pointer rests. It was not fixed here (the same
  bridge is the playlists screen's); it is listed as a candidate for an issue.
- the finger's drag (CDP touch events) does not exist in WebKit: it is proved in Chromium only.

## 6. Kept as they were (found while porting: issue candidates, none repaired here)
- The window to edit a series: no Escape, no click on the backdrop, no focus trap, no focus given when it opens or given back when it closes, no
  `aria-labelledby` (the shell `BaseModal` does none of it).
- The window to rank: no focus trap, no focus given or given back, and `role="dialog"` only on the phone.
- The «Back» and «Reset» buttons of the computer window to rank have no icon (the two icons they ask for do not exist).
- What the window saves is a whole ranking (every track, 1 to N, the ones with no rank of their own after the ranked ones): the «partial ranking» the
  window lets a person make cannot be told, in their data, from a whole one.
- On the phone, Up and Down do not take their state again (disabled or not) after a drag.

## 7. Decided differences (revisable)
- The window to edit closes when the albums screen is left (the hand-made one stayed open over the other screen: nobody took it down).
- The notices of the ranking window disappear if the screen is left before they end (the hand-made one left them in `body` for 2 s or 5 s).
- The order of the ranking changes in state, not in the nodes: two tracks with the same title and no identifier, which the hand-made window corrupted when
  dragged (one found twice, the other lost, so the ranking saved had a track twice and one missing), now move right.
- `draggable="false"` is left by the drag library on a row of React, which is kept; the hand-made list was made again at some moments (not seen by a person).

## 8. Weight
Main script 230,315 B → 231,568 B (+1,253 B: the 102 English texts of the windows; ceiling 230,459 → 231,712 B). The albums screen file 19,997 B → 23,565 B
(the windows in it; the hand-made ones were lazy files: the ranking window 4,394 B, the picker's controller 6,642 B); `pickerController` (shared by the Start screen and the
windows) is a lazy file of 6,332 B. React and the screens after the first: 181,764 B → 180,603 B. The first screen and a later screen download **not more**
than before. `bundle-budget-wave-5b.txt`.

## 9. Not checked, and why
- **The real catalog**: the window to edit a series searches the Apple Music catalog (MusicKit, the way the Start screen does, through the same
  `albumSearchService`); its developer token comes from the server and the search needs the catalog of Apple, which cannot be reached without it: the
  scan is replaced by answers put in the page, and what is exercised is everything the window does with an answer (results, none, late, failed, the AI
  list). Whether the real answer of Apple Music fills a card as the stand-in does is shown by the Start screen, which reads the same fields.
- **The real series service and the real repository of rankings**: the calls that reach them are compared (above), but nothing is written to
  Firestore.
- **The finger's drag in WebKit**, and Safari on a real phone (the profile of an iPhone is an emulation).
- **The windows read by a person in Portuguese**: only the dictionary test and `SeriesEdit.test.tsx` (one test) read it.
- **Escape with the sheet «Move to…» open, in a real browser**: the sheet's key handler is in the capture phase and the window's in the bubble phase; in a
  browser the sheet closes first and the window may then also react; the unit proof (an event on `document`) cannot show the order. Old and new have the same
  two handlers in the same places.

## 10. Files
`browser-proof.mjs` (the script; `RESULT_TAG`, `NO_TRANSITIONS=1`, `OLD_AGAINST_OLD=1`, `BUILT=1`, `ENGINE=webkit`, `WIDTHS`, `WAIT_MS`, `STOP_AFTER`, `DEBUG_FOCUS`),
`raw/browser-proof-results*.json` (every check of every run, with the detail of what differed), the pictures of each run in `captures*/` (old and new of every
step; the old-against-old pictures of the built site and of the no-transitions run are not kept, their results are in `raw/`), `locate-pixels.mjs` (where two
pictures differ, writes a `.diff.png`), `crop.mjs` (a piece of two pictures side by side, magnified), `locate-box.mjs` (the box and the style of every
element of the cards, old against new), `locate-raster.mjs` (the variants that find what makes the badge differ), `capture-before.test.js` (the record of the old
windows), `bundle-budget-wave-5b.txt`, `migration-status-end-of-wave-5b.txt`.
