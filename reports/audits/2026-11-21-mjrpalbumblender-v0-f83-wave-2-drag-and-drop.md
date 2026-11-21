# F83 wave 2 — drag and drop with React: `sortablejs` behind a bridge (TASK-14)

Written by the agent that built wave 2, on 2026-11-21. The decision is technical and was left to the agent by the proposal (§ 4.5); it is revisable. Nothing changed in how the drag behaves for the person, so nothing here goes to the owner to decide.

## The question

The tracks of a generated playlist are dragged inside a playlist and between playlists (`sortablejs`, 85 lines of the old screen). React draws the same lists. A library that moves DOM nodes by itself and a framework that believes it owns them can disagree: React then fails on the next draw (a node it holds is gone or in the wrong place) or shows an order the store does not have. Two ways were open: keep `sortablejs` behind a bridge, or change to `@dnd-kit` (a new dependency, and a different feel: its own long-press, its own scroll, its own animation).

## What was built

`public/js/react-bridge/sortableTracks.ts` (`useSortableTracks`), 95 lines, no new dependency (the library is the one the site already had; its types are a 27-line declaration in `types/sortablejs.d.ts`).

- One Sortable per list of tracks (`.playlist-tracks`), made once and kept while the list is in the page, destroyed when it leaves; the handle follows the phone line (the whole row on a computer, only the position on the phone); the same options as before (`group` shared by the lists, 150 ms animation, 100 ms delay on touch only, 3 px threshold).
- When the drop ends, the bridge **puts the dragged row back where React had it** (`putBack`: out of where Sortable left it, back before the row that was at its old place) and only then asks, one microtask later as before, for `moveTrack(from, to, oldIndex, newIndex)`. The service makes a new list, the store tells, React draws the new order. React never sees a DOM it did not write. The rows are keyed by place, so the node put back is the one React still holds.
- While a row is in the hand, a draw of the screen (a store that tells something unrelated) does not make the Sortables again.

Not changed: the behaviour. The old one is the control in every step below.

## What was measured

Chromium (Playwright 1.63), `reports/evidence/F83/wave-2/browser-proof.mjs`, the old screen (dev server on the parent of the wave's code commit) and the new one (this branch) driven the same way, signed out, with the playlists put in the store in the page, nothing written or read from the database.

| Step | Result |
|---|---|
| 1280 · mouse: a row dragged down inside its playlist | the order in the store equals the old screen's; the page shows exactly the order of the store |
| 1280 · mouse: a row dragged to another playlist | the same |
| 1280 · mouse: a row dragged into the empty playlist | the same |
| 1280 · undo and redo by real clicks after the drags | `#app` identical to the old screen's |
| 393 · touch (`Input.dispatchTouchEvent`: touch down on the position handle, hold 220 ms, 16 moves, lift): a row dragged inside the open playlist | the order equals the old screen's; the page shows the order of the store |
| 393 · a finger on the row but **not** on the handle, moving 96 px | nothing moves, on both screens (the page scrolls; a finger that scrolls never picks a track up) |
| after each drag | no page error; `#app` identical to the old screen's after the same step (collapsed white space, attributes as sets) |
| five visits to the screen and away | no screen left in `#app`, no `.sheet` or notice left, the class `grabbing` of the body is gone, the listeners of `window` before and after are the same (32 and 32) |

On the phone only the open playlist is in the page, so there is no drag between playlists there, as before (the sheet of the row sends a track to another playlist).

The run: 82 checks, 70 passed. All of the 12 that did not are **screenshots** compared pixel by pixel, never `#app`; they are 2 to 10 pixels (anti-aliasing at the corner of a card, or at the left edge of a row on the phone) except three steps with 171 to 173 pixels after a button changed state: with the page's transitions and animations switched off (`NO_TRANSITIONS=1`, the control run) these 171 vanish to 4 to 6 pixels. The cause is that the new screen keeps a button and lets it fade between enabled and disabled, where the old screen drew a new one at every notice. Nobody can see 171 pixels of anti-aliasing in a button label; it is written here so nobody has to wonder.

## Decision

Keep `sortablejs` behind the bridge. `@dnd-kit` was not built nor measured: the bridge works with the mouse and with a touch, so the condition for changing (that the bridge cannot be made to work) did not happen, and changing would have changed the behaviour (long-press, scroll, animation), which is the owner's to decide and nobody asked for.

## What this does not prove

- Browsers other than Chromium (Safari on iPhone is where the touch drag is most likely to differ; the old screen had the same library and the same risk).
- A real finger. Touch was emulated by the protocol (`Input.dispatchTouchEvent`), not by a device: the hold, the threshold and the scroll hand-over are Sortable's own code and ran, but a physical phone is the owner's to try.
- A drop while the store changes under it by itself (an album arriving): the bridge does not make new Sortables mid-drag, and the row put back is the one React holds, but no test makes the two happen together.
- The unit tests (`test/react-bridge/sortableTracks.test.tsx`) prove `putBack` and the life of the Sortables in jsdom, not the drag.

## Evidence

`reports/evidence/F83/wave-2/browser-proof.mjs`, `raw/browser-proof-output.txt`, `raw/browser-proof-results.json`, `captures/` (a screenshot per step; the ones that differ are saved as `-NEW` and `-OLD`).
