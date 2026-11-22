---
type: visual-parity-recheck
feature: F83
step: wave 6a (the inventory screen in React)
branch: claude/f83-wave-6a-inventory-screen
judged_on: 315ae5f
reference: claude/f83-sync-3-start-lean at 12f0234 (hand-made inventory, equal to production)
judge: independent (did not build)
date: 2026-11-22
verdict: fail
p0: 1
p1: 0
p2: 2
---

# The inventory screen in React against the hand-made one: recheck

**Verdict: fail, for one reason.** On a phone with Chromium (Android Chrome, and any window from 820 to 899 px), with the Discogs values on, «Show 50 more» throws the person past the albums it just added: the page lands on the end of the new chunk, and the first new album, which has the focus, is off the screen. The hand-made screen stays put. Everything else I drove matched: texts, boxes, page height, scroll, focus, the calls to the server and the windows opened by the screen, on Chromium 1280 / 900 / 899 / 820 / 393 and WebKit 1280 / iPhone 14 / iPhone SE, with and without an account. The fix is one line (below).

**The main question, the 62 pixels of the list on the computer: found.** React writes «No value yet» and the space before the dash as two text pieces; the old HTML wrote them as one. Chromium shapes each piece on its own, so the line is 1/64 of a pixel wider, and the dash and the averages after it move by 1/64 px. That tiny move changes the smoothing of a few glyph edges. Merging the two pieces in the page (`normalize()`) gives 0 pixels. **Nobody can see it** (P2, below).

## How it was judged (independent of the builder's script)

- Both commits exported with `git archive` (`12f0234` → `parent/`, `315ae5f` → `branch/`), `node_modules` cloned from the sync-3 judge's tree (same lockfile hash, `1c487ec…`). `vite build` and `scripts/bundle-budget.mjs` for both through the machine queue (label `f83-6a-judge`).
- **Server:** my own static server over each `dist/` with the hosting's rule (`/` and `/home` → `index.html`, any other path → `app.html`). `vite preview` was not used: its fallback serves `index.html` (the entry page) for `/inventory`, which is not what the hosting does.
- Playwright 1.56.1 borrowed from `MJRPpersonal`. Firebase blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`); MusicKit token and SDK, Spotify and PostHog stubbed or aborted.
- **Items on the built site:** the same seam as wave lessons §15 (one line at the end of the main script puts the inventory store on `window.__inv`, same line on both builds), but **my own 64 items**: every status, every format plus «cassette» and none, prices in BRL and USD, notes with HTML, BestEverAlbums and Spotify badges, long titles, items without a cover.
- **Values on, unlike the builder's pass:** I stubbed the app's own server: `/api/value-sources` → on, `/api/exchange-rates` → USD 1, EUR 0.92, GBP 0.79, BRL 5.31, `/api/album-value` → a «found» answer after 300 ms (4 s for the «running» states). The items carry kept Discogs readings of every kind (suggestion, lowest for sale, no CD edition), written values and never-read ones. So the lines «CD · Discogs · suggested · 22 Nov ≈ $15.00», «Yours», «Waiting for a value», the totals, the waiting notice, the seller-settings notice and «Update values» were compared on the built sites, not only in the golden test.
- **Account:** a non-anonymous user written to `firebaseLocalStorageDb` before load, the API key read at run time from `public/js/firebase-config.js` (written in no file).
- Each state: a fresh page per side; compared the picture pixel by pixel (no tolerance), the text of `#app` and of everything outside it (windows, sheets; the footer's clock masked), focus, main boxes (to 1/4 px), page height and width, scroll, `mjrp_inventory_view_mode`, count of controls under 44 px, the `/api` calls, page errors.
- **Noise control:** parent against parent, same script, Chromium 1280, WebKit 1280 and WebKit iPhone 14. Differences that only come from the «Authentication issue» toast sliding in (it starts at a different moment on each load) were re-run with the toast hidden on both sides.
- Scripts: `scripts/common.mjs`, `parity.mjs`, `listprobe.mjs`, `trap.mjs`, `order.mjs`, `more.mjs`, `gallery.mjs`, `sweep.mjs`, `btn.mjs`; results `raw-*.json`, logs `run-*.log`, `rr-*.log`, `sweep*-*.log`, pictures under `runs/`.

## Results

| pass | states | branch vs parent (non-picture checks) | pictures that differ, after the toast re-run | noise (parent vs parent) |
|---|---|---|---|---|
| Chromium 1280, visitor | 44 | all equal | list full page (the 1/64 px text move, all rows); 1/255 at the search box edge after a select change | footer clock, toast |
| Chromium 1280, account | 42 | all equal | same as visitor | — |
| Chromium 900 | 44 | all equal | the 1/64 px move; ≤ 1/255 in the top bar; a label smoothing during the hover scale of «Add the albums of my series» (DOM and boxes identical) | — |
| WebKit 1280 | 44 | all equal | none (only the footer clock) | footer clock, toast |
| Chromium 899 (phone layout) | 31 + 3 | **«Show 50 more»: scroll 5,205 vs 6,663**; focus kept on «Filters» after closing by the footer with a change | ≤ 14/255 under the sheet backdrop | 0 for «Show 50 more» |
| Chromium 820 | 31 | **same two** | none | — |
| Chromium 393 (iPhone 14 profile) | 3 (the «Show 50 more» paths) | **scroll 5,403 vs 6,887; 130 items: 5,299 vs 10,749** | the whole screen | — |
| WebKit iPhone 14 (393×852), visitor | 31 | all equal | none | toast only |
| WebKit iPhone 14, account | 31 | all equal | none | — |
| WebKit iPhone SE (375×667) | 31 | all equal | none | — |

The computer states: grid, list, list remembered, list then grid, grid and list full page, search typed, search with no match (grid and list), format Vinyl, Digital in the list, the ten orders (both directions of each arrow pair), a status count pressed and pressed again, currency EUR / GBP / BRL (BRL in the list), «Update values» running / stopped by «Stop» / done, «Add the albums of my series», «Update ratings», empty inventory, the album window by the title, by a list row and by «Where to buy», closed by Escape, the edit window (grid and list) and cancelled, the delete question and Escape, 12 Tabs. The phone states: list, gallery, the filters sheet (open; gallery + Vinyl + Z-A; closed by its footer, Escape, the backdrop, ✕), the album sheet (open, Escape, «Open album», «Edit», «Remove from inventory»), the status sheet (open, a choice, backdrop), the jump sheet (open, a letter, by value order, backdrop), the actions sheet (open, Escape, «Update values» inside it), the values sheet (open, ✕), «Show 50 more» (three ways), search with nothing found and cleared, empty inventory, a tile opened from the gallery. All by real taps on the phone profiles.

## Findings

### P0-1. «Show 50 more» on a Chromium phone moves the page past the new albums

- **Where:** `public/js/screens/inventory/Inventory.tsx`, the phone branch: `<div id="inventory-grid-container" key={bridge.gridKey()}>` is remounted on «Show 50 more», while `<p className="inv-discogs-notice">` (shown when the Discogs values are on) stays mounted right under it.
- **What a person sees:** on Android Chrome (and any Chromium window 820–899 px), scrolled down to the button with the values on, a tap on «Show 50 more» lands the page at the end of the new chunk (the next «Show N more», or «All N albums»). The first new album has the focus but is above the screen. The hand-made screen does not move; the first new album is in view. WebKit (iPhone) is not affected.
- **Evidence:** scroll after the tap, parent vs branch: Chromium 899 5,205 vs 6,663, 820 5,221 vs 6,679, 393 5,403 vs 6,887 (64 items, last chunk); 130 items, a middle chunk: 5,299 vs 10,749 (the whole 50-row chunk). Same by a synthetic finger scroll (`Input.synthesizeScrollGesture`) and by `scrollTo` then tap. Parent against parent: equal. Capture `captures/show-50-more-chromium-393-old-left-new-right.png` (old left: «Album 46» in view; new right: the end of the list).
- **Cause, proved:** Chromium's scroll anchoring. The persistent Discogs notice is the anchor; the remount above it grows the page, and Chromium shifts the scroll to keep the notice in place. The hand-made screen rebuilt the notice with the view (`container.appendChild(… 'inv-discogs-notice' …)` on each draw), so there was no anchor to keep. With `overflow-anchor: none` on both sides: 13/13 equal. With the notice hidden on both sides: 13/13 equal. Without the values (the builder's items), the notice is not there, which is why the builder's pass did not see it.
- **Why P0:** it breaks the parity of a flow; the point of «Show 50 more» (see the next albums) is lost on Chromium phones.
- **Check (Y/N):** on Chromium 393 with the values on, scroll to the bottom, tap «Show 50 more»: is `scrollY` unchanged and is the focused first new row inside the screen? Suggested fix: `overflow-anchor: none` on `.inv-discogs-notice` (or render the notice inside the keyed box, or key it with `gridKey()`), and add this state to the browser proof with the values on.

### P2-1. The list's value line moves by 1/64 px in Chromium (the builder's unexplained 62 pixels)

- **Where:** `public/js/screens/inventory/CardValue.tsx:141`, `RowValue`: `{line}{' '}<strong …>{amount}</strong>`. The hand-made renderer wrote `${origin.line}… <strong>` (one text piece ending in a space).
- **Evidence:** the builder's exact numbers reproduced with the builder's items: 62 px, up to 77/255, box x 434–673, y 514–817 at 1280; parent vs parent 0. Text pieces: old `"No value yet "`, `"—"`; new `"No value yet"`, `" "`, `"—"`. Computed styles, attributes, images (`decoding`, `loading`), hover and focus: identical. The value span is 77.9375 px wide against 77.921875 (+0.015625 = 1/64 px); the dash and the averages after it start 1/64 px further right. Merging the pieces in the branch's page (`normalize()` on `[data-role=value]`): **0 pixels at 1280**. WebKit shapes across the pieces: 0 pixels. On the full list page it touches every row whose value line is plain text (6,657 px at 1280, up to 95/255), never a row whose line has the Discogs link.
- **Can a person see it?** No: glyph-edge smoothing of 12 px grey text, moved by 1/64 of a pixel. Capture `captures/list-value-line-chromium-1280-old-top-new-bottom-2x.png` (old above, new below, 2×) and the diff `captures/list-diff-chromium-1280-62px.jpg`.
- **The 29 px at 900 the builder saw:** the same cause; what remains after merging (7 px, up to 3/255, at the edge of the view toggle) is a hover/transition step of the toggle button, not text.
- **Check (Y/N):** does `RowValue` write the label and the space in one text piece (`{`${line} `}`)? Optional; nothing visible changes.

### P2-2. Chromium keeps the focus on «Filters and order» after the filters sheet is closed by its footer with a change; the old screen lost it

- **Where:** the phone filters sheet, closed by «Show N albums» after choosing the gallery and an order; Chromium 899 and 820 (WebKit puts no focus on a tapped button, so both sides say «the page» there).
- **Evidence:** focus old «the page», new `BUTTON.inv-bar__button[Filters and order, 1 on]`; the pictures are equal (no ring after a tap), so nobody sees it. Closed by Escape, backdrop or ✕, both sides give the focus back to the button.
- **Reading:** the old screen redrew the bar after a view change and lost the button; React keeps it. This is the behaviour the map asks for (a closed sheet gives the focus back), so it is a better result, but it differs from production. Record it in the proof; nothing to fix.

## What matched, by question

1. **Computer:** header and counts, totals in the four currencies, the notices («20 albums are waiting for a value» with «Read them now», the seller-settings notice, «Exchange rates are not available»), the filters, the ten orders in both directions, list and grid, the card and the row with «Discogs · 22 Nov» / «CD · lowest|suggested» / «Yours» / «Waiting for a value», «Update values» running, stopped and done, «Add the albums of my series» (no series: the same toast), «Update ratings», empty inventory, no match, with and without an account, the breadcrumb (in the compared text). Same `/api` calls in each state.
2. **Phone:** the bar, the list, the gallery (2 columns at 375, 393 and 639; 3 at 640 and 820, both sides), every sheet opened by real taps and closed by button, backdrop and Escape (focus: equal in Chromium, «the page» on both in WebKit), no control under 44 px in the screen on either side, no horizontal scroll, `mjrp_inventory_view_mode` = `grid` remembered after a reload on both.
3. **Hand-made windows** (view, edit, delete, add series question): the same window, the same text, the same picture on both sides. Closing the album window by Escape and cancelling the edit window leave the focus on «the page» on **both** sides (the hand-made windows do not give it back; map, defect 8). The delete question does not close on Escape on either side.
4. **The list difference:** see P2-1.
5. **Sign-in trap:** a signed-in person opening `/start` or `/albums` first: on both builds the console shows «[InventoryService] Switching user context: anonymous-user -> judge-user» and the inventory read is sent to Firestore (blocked) before the inventory screen is opened; then the menu link opens the inventory. A visitor: no switch, no read, on both. The trap is closed.
6. **Other screens** (Chromium 1280 and WebKit iPhone 14, visitor, toast hidden): Start, blend, saved playlists, the account panel open and closed by Escape, the inventory reached by the menu: 0 pixels. Home (the entry page's moving covers), albums and playlists (a moving element and the text of the moment) and the «coming soon» page (≤ 12/255) differ by the same amounts in the parent-against-parent control. No regression seen.
7. **Weight:** my builds measure what the builder wrote: main script 235,748 → 211,698 B (ceiling 211,842 = measured + 144, the rule used since wave 2); after the first screen 187,136 → 212,976 B; main + after 422,884 → 424,674 B (+1,790 B: the lazy-file overhead and the Portuguese dictionary), inside `mainToday 301,437 + reactVendor 72,000 + background 51,300 = 424,737` with 63 B to spare. Both moved ceilings follow the file's own rule and are justified. **The first screen does not download the inventory file up front:** on `/start` the screen is drawn at 264 ms and the inventory file (`index-DBzEvXUc.js`, 21,503 B) starts at 278 ms, in the background chain after the Start and albums files; on `/albums` 405 ms vs 415 ms. No `modulepreload` of it in `app.html`.

## What I could not see

- The real Discogs server, real Firestore, real MusicKit and a connected Spotify (stubbed or blocked). With Firestore blocked, the signed-in run proves the read is **asked for**, not that the items arrive.
- iOS Safari and Android Chrome on real devices: only WebKit and Chromium with device profiles. P0-1 is a Chromium behaviour; I expect Android Chrome to show it, not verified on a device.
- The gallery variant of P0-1 under the exact failing path (my 130-item gallery probe used a different scroll path that did not trigger anchoring in either layout); it shares the same container and notice, so it likely behaves the same.
- Inventory reached by the phone's bottom menu (my selector timed out on both sides); reached by the computer menu and by the router instead.
- The two files `captures/show-50-more-chromium-393-parent.png` and `-branch.png` come from a probe path that did not trigger the anchoring (equal pictures); the evidence for P0-1 is the side-by-side capture.
