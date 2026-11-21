# Playlists, saved playlists and blend capture, 2026-11-21

Real `PlaylistsView`, `SavedPlaylistsView`, `SavedPlaylistsController`, `SavedPlaylistsReader`, `SavedPlaylistsStore`, `BlendingMenuView`, phone shell and CSS, with fixture data. No sign-in, nothing written to Firestore. The saved list is fed through the real reader with a stand-in `source` (`listSeries`, `listPlaylists`, `deletePlaylists`).

## How it was served and shot

Run from the repository root (the worktree):

```sh
node_modules/.bin/vite --config reports/evidence/visual-recheck-batch/2026-11-21/playlists/harness/vite.config.mjs --port 5403 --strictPort --host 127.0.0.1
node reports/evidence/visual-recheck-batch/2026-11-21/playlists/shoot-playlists.mjs 5403 9402
```

Chrome: Google Chrome headless over the DevTools protocol on port 9402. 1280x800 and 393x852 (mobile emulation, touch, scale 2). Files: `<state>-1280.png`, `<state>-393.png`, `measures.json`, `console-errors.json`. Harness: `harness/` (copies of the F76 files, F76 untouched; `main.js` extended, config paths moved six levels up). URL: `http://127.0.0.1:5403/?screen=generated|empty|saved&mode=...|blend`. Shared helpers: `../cdp-lib-inventory-playlists.mjs`.

## States reached

| State | How |
|---|---|
| generated | 6 fixture playlists in `playlistsStore`. Computer: «Batch Name» field and Actions & Export panel (Save to Series History, Export to Spotify, Export to Apple Music, Download JSON). Phone: «Batch name» field; export buttons are not on the page but in a sheet. |
| generated-export (phone only) | tap «export» in the action bar: sheet "Export playlists" with Export to Spotify, Export to Apple Music, Download JSON |
| generated-typed | after the typing test below |
| empty | `/playlists` with no playlists: "No playlists here yet", text pointing to The Blending Menu, button "Go to The Blending Menu" (`/blend`). No Batch Name field, no export buttons. |
| saved-loading | every series reading (their `listPlaylists` never answers; reader timeout set to 24 h so it does not turn into failed): status line "Reading playlists: 0 of 6 series" |
| saved-loading-list | the list of series itself reading: "Reading your series..." (extra state) |
| saved-mixed | one screen with the mix: series reading, empty, failed and ready (3 ready). Shows "Reading playlists: 5 of 6 series", the ready series, and the failed series with its message and «Try again» |
| saved-ready | all six series ready |
| saved-empty | all six empty: "No Playlists Found" with «Create Series» |
| saved-failed | one series failed (others ready): message "The playlists of this series could not be read." with «Try again» |
| saved-failed-list | extra: the list could not be read: "Your series could not be read." with «Try again» |
| saved-retried | extra: a failed series, «Try again» pressed, the source answers: the series is ready |
| saved-open | first series opened and its first batch opened (on the phone the series row is opened; on the computer groups are open by default) |
| blend | `BlendingMenuView` rendered directly, 8 stand-in series in `albumSeriesStore`, covers drawn as SVG, no thumbnail lookup (that method is stubbed in the harness) |
| blend-recipe | extra: a series chosen: steps 2 and 3 and 4 appear |

### Batch Name typing test (F73), `generated-typing-1280` / `generated-typing-393` in `measures.json`

Field emptied with a real Backspace key event, then 12 letters ("albumblender") typed one real `Input.dispatchKeyEvent` each. After letters 3, 6, 9 and 11 the harness fires `albumsStore.notify()` and `albumSeriesStore.notify()`, which make the real `PlaylistsView.update()` draw the whole screen again. Result at both sizes: the input node WAS replaced by the redraws (`nodeReplacedByRedraw: true`), focus stayed on `#batchNameInput` after every key (`focusKeptAfterEveryKey: true`), the final value is all 12 letters (`finalValue: "albumblender"`). Note: `playlistsStore.setBatchName` itself does not notify, so the redraw trigger had to come from the other stores, as the real "albums load" does.

## Not reached / caveats

- In the saved screen a series that is reading or empty has NO card of its own in the real code: only the status line counts them, and when every series is empty the "No Playlists Found" screen shows. So "saved-loading" and "saved-empty" are those screens; the per-series «reading» and «empty» appear only through the status line in saved-mixed. Nothing was faked to draw them.
- A failed series shows "0 batches · 0 playlists" on the phone row above the failure message (as built).
- Playlists on the phone: the strip of playlist chips scrolls sideways on purpose, so 14 elements pass the right edge in `generated-393` (chips); `scrollWidth` is 393.
- The top bar logo is a broken image in the playlists harness (it is served with the harness folder as vite root, where the logo file is not); not a product issue. Same for the favicon 404.
- Console: 30 entries in `console-errors.json`, all harness artefacts: `Worker Error ... search.worker.js` (the album dataset is not served here) and the favicon 404. No page exceptions.
- Phone small targets (under 44px): only the top bar logo link (28x28). Computer counts are not meaningful for the 44px rule. Text under 12px on the computer: track badges (10px) in the generated grid.
- Blend on the phone: series is picked in a sheet; the sheet itself was not captured (blend-recipe shows the state after choosing).
