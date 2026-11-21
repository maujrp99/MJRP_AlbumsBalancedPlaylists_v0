# F83 wave 2 - pixels apart at each screenshot step

Same steps, same fixture, five runs (`browser-proof.mjs`; the old screen on port 5011, the new on 5012; `NO_TRANSITIONS=1` turns transitions and animations off, `PARK_MOUSE=1` takes the pointer off the page before each capture, old vs old points both sides at the old screen).

| step | new vs old | new vs old, mouse parked | new vs old, transitions off | old vs old | old vs old, transitions off |
|---|---|---|---|---|---|
| A 1280 · real keystrokes in the batch name: the field keeps the focus and the grid has the name | 10 | 10 | 10 | 0 | 0 |
| A 1280 · the panel closed again | 0 | 1 | 0 | 0 | 0 |
| A 1280 · MOUSE DRAG: a track down inside its playlist | 7 | 6 | 5 | 0 | 0 |
| A 1280 · MOUSE DRAG: a track to another playlist | 4 | 6 | 5 | 0 | 0 |
| A 1280 · MOUSE DRAG: a track into the empty playlist | 2 | 12 | 6 | 2 | 0 |
| A 1280 · undo (real click): the drag is taken back | 5 | 10 | 7 | 0 | 0 |
| A 1280 · redo | 3 | 8 | 6 | 0 | 0 |
| A 1280 · a track removed (hover, then the X) | 171 | 175 | 3 | 0 | 0 |
| A 1280 · the title of a playlist typed over (real keystrokes, Enter) | 173 | 176 | 3 | 0 | 0 |
| A 1280 · a playlist deleted | 171 | 172 | 6 | 0 | 0 |
| A 1280 · the Spotify window (real click) | 79 | 79 | 2 | 0 | 0 |
| A 393 · back to the first | 0 | 0 | 28 | 0 | 0 |
| A 393 · the sheet of a track (real tap on ⋯) | 0 | 0 | 11 | 0 | 0 |
| A 393 · move down by the sheet: the notice with Undo | 2 | 2 | 28 | 2 | 0 |
| A 393 · the notice taken back | 2 | 2 | 28 | 0 | 0 |
| A 393 · TOUCH DRAG: a track by its position handle, inside its playlist | 0 | 0 | 28 | 0 | 0 |
| A 393 · a finger on a row but NOT on the handle scrolls and does not pick the row up | 0 | 0 | 28 | 0 | 0 |
| A 393 · the sheet of a playlist (real tap on ⋯) | 0 | 0 | 11 | 0 | 0 |
| A 393 · the question before deleting a playlist (Cancel) | 0 | 0 | 28 | 0 | 0 |
| A 393 · the sheet of the exports | 0 | 0 | 11 | 0 | 0 |
| A 393 · the sheet closed by Escape | 0 | 0 | 28 | 0 | 0 |

Steps with a screenshot: 29 (steps not listed are 0 pixels in all five runs). Max per run: new vs old 173 px; new vs old, mouse parked 176 px; new vs old, transitions off 28 px; old vs old 2 px; old vs old, transitions off 0 px.

## What the numbers say

1. **Old vs old is the noise**: 0 px with transitions off; 2 px (two steps) with transitions on.
2. **Hover is not the cause**: with the pointer parked the 1280 steps keep the same few pixels.
3. **One real difference found and fixed: focus after removing a track.** With the pointer parked the step "a track removed" was 462 px (297 with transitions off). The X button of the removed row was left focused on the new screen (rows are keyed by place, so the same button now sat on the next track); the old screen drew the list anew, so the focus went back to the page. Fixed in `PlaylistCards.tsx` (the focus is let go before the removal); test `what a redraw took away from the page: the focus` in `Playlists.sameAsBefore.test.tsx` (red without the fix: focus stays on `remove-track`; green with it). The step now has the same pixels as the rest (175 parked, 173 unparked, the cause below).
4. **What is left is stale rasterisation, not a style or layout difference.** (a) The 2 to 12 px at 1280 with transitions off and the 11 to 28 px at 393: sub-pixel colour steps of 1/255 on the rounded corners of cards (e.g. 393, y 148, x 16 to 154) and glyph edges. (b) The ~170 px after an undo/redo (label `Redo` of the disabled button, glyph edges up to 38/255): the same DOM, computed styles (opacity, colour, background, transform, filter, backdrop-filter) and box (225.33, 523, 119.31 x 47) on both screens, but a kept node that went through a transition keeps the raster Chrome made then. Proof: in a reduced run of the same steps (undo, redo, remove), new vs old is 165 px with transitions on, 0 with transitions off, and 0 after forcing a re-raster of `#app` (`display:none`, read the height, `display:''`), which also equals the old screen re-rastered. The hand-made screen cannot show this because it destroys and rebuilds every node on each redraw; the pixels a person sees are the same to the eye (largest step 38/255, on glyph edges).
5. **Conclusion**: DOM, attributes, order, focus and the states shown are equal at every step (82 checks: the `#app` and overlay comparisons pass); the leftover pixels are noise of Chrome's raster of kept nodes, proved by the re-raster control, plus one real difference (the focus) found by the controls and fixed.
