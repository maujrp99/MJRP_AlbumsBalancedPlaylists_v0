# Inventory capture, 2026-11-21

Real `InventoryView`, controller, renderers, sheets, dialogs, `ViewAlbumModal`, `InventoryEditModal`, phone shell and all CSS of `public/`, with fixture data. No Firebase, no server, no sign-in, nothing written to Firestore.

## How it was served and shot

Run from the repository root (the worktree):

```sh
node_modules/.bin/vite --config reports/evidence/visual-recheck-batch/2026-11-21/inventory/harness/vite.inventory.config.mjs --port 5402 --strictPort --host 127.0.0.1
node reports/evidence/visual-recheck-batch/2026-11-21/inventory/shoot-inventory.mjs 5402 9402
```

Chrome: Google Chrome headless over the DevTools protocol on port 9402. Sizes: 1280x800 (desktop, scale 1) and 393x852 (mobile emulation, touch, scale 2). Files: `<state>-1280.png`, `<state>-393.png`, `measures.json`, `console-errors.json`.

Harness (copies of the F76 files, F76 untouched): `harness/inventory.html`, `inventory.js` (extended), `vite.inventory.config.mjs` (paths moved six levels up), `fakeFirebase.js`, and new `standInWiring.js`. The vite config aliases `inventoryWiring.js` to `standInWiring.js`: the REAL `InventoryService` on an in-memory repository, so delete and "add series" run the real code and only change an array in the page. Shared helpers: `../cdp-lib-inventory-playlists.mjs`.

Fixture: 211 items (160 Owned, 32 Not Owned, 19 Wishlist). Items carry `averages = { rating, popularity, ratedTracks, popTracks, tracks }` as the real model writes them (item 0 has them computed by the real `averagesOf` from its 10 tracks). Animations frozen before measuring.

## States reached (each at 1280 and 393)

| State | How |
|---|---|
| list | all 211 items, default order |
| filters | the status filter in this build: the three count buttons of the title row. On the phone the "Filters and order" sheet is opened (format and order). See "Not reached" for the dropdown. |
| filtered-notowned | `handleStatusCount('not-owned')`: the «Not Owned» count pressed (aria-pressed true), 32 items, all Not Owned |
| sort-avg | list view on the computer (the grid does not show averages), order «Avg Rating (↓)». Rows show «Avg Rating» and «Avg Pop» values (phone: rating and popularity scores per row). |
| sort-pop | same, ordered by «Avg Pop (↓)» |
| series-button | the action «Add the albums of my series»: on the computer in the filters row; on the phone inside the «Collection actions» sheet (opened) |
| series-confirm | button pressed: real plan from a stand-in series list, then the confirm dialog "Add the albums of your series?" (11 albums, 3 already there, 1 repeat, 1 left out). Cancel/Add 11 albums visible. Nothing written yet (`written: 0`). |
| series-result | the dialog confirmed: the real service writes into the in-memory repository, the list reads again (211 to 222), toast "Added 11 albums as Not Owned." |
| series-nothing | extra: series already all in inventory: toast "Every album of your series is already in your inventory. Nothing was added." |
| delete-confirm | `handleDeleteWithModal('inv-1')`: dialog "Remove from Inventory?" |
| delete-after | «Remove» pressed: item gone from the list and from state (211 to 210), toast shown |
| item-window | `handleViewWithModal('inv-0')`: album window with 10 tracks, durations m:ss (1:35, 2:33, 3:31 ...; no `--:--`), footer button «Close»; on the phone the top bar close has `aria-label="Close"`. On the computer the header X has no label (only `data-action="close"`), the footer button is «Close». |
| edit | `handleEditWithModal('inv-0')`: "Edit Inventory Item" (format, currency, price, notes, Cancel, Save Changes) |

## Not reached / caveats

- A status dropdown offering All, Owned, Not Owned, Wishlist: NOT in the UI. `STATUS_FILTER_OPTIONS` exists in `models/inventoryStatus.js` but nothing draws it; since F75 the status filter is the three count buttons (pressing the pressed one again shows all). Captured as built, nothing faked.
- Edit and delete confirmations were not confirmed to the end for the edit (Save not pressed). Delete and series-add were confirmed in memory only.
- The Avg Rating / Avg Pop line is shown only in the list view on the computer; the grid view of the computer has no such line.
- Desktop counts for targets below 44px and text below 12px are large (hundreds of cards); the 44px rule is meant for the phone. Phone: only the topbar logo link (28x28), and the toast close (32x32) while a toast is visible.
- Album window on the phone: 2 decorative elements (`.album-window__glow` and its image, right edge 441) pass the right edge but sit outside `#app` in a clipped overlay; scrollWidth stays 393.
- Console errors: none (0 console, exception or network errors in 26 captures).
