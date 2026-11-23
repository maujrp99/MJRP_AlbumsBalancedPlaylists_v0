---
type: visual-parity-recheck
feature: F83
step: wave 6b (the album, edit and add windows in React)
branch: claude/f83-wave-6b-inventory-windows
judged_on: 6622654
reference: claude/f83-wave-6a-inventory-screen at 315ae5f (hand-made windows, equal to production)
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 3
---

# F83 wave 6b — the windows in React against the hand-made ones (independent recheck)

**Verdict: pass.** On the built sites, the three windows in React (the album window from both screens, the edit window, the add window) are the hand-made ones of the parent in every state I drove, on every profile: same elements, attributes, classes and field states, same text, same part boxes, same focus, same page lock, same toasts, same calls to the outside world, and the same picture once the screen is settled. The one change on purpose (windows close when the screen is left) is confirmed from the albums screen and from the inventory, by the app's link and by the browser's Back. The add-window picture difference the builder could not explain is the **sign-in warning toast** of a blocked Firebase sliding out over the window; with the screen settled (or the toast hidden) the difference is 0 pixels, old against new and old against old. Three P2, none blocking: the on-purpose change also covers the edit and add windows (say so); the proof's unexplained noise (now explained); and one undeclared difference at 899 px in a desktop Chromium, where the **parent** opens some album windows with the title already in the phone bar and the React one does not (the React one is the correct state).

## How it was judged

- Both sides from git (`git archive 315ae5f` and `git archive 6622654` into this folder), built with `vite build` through the machine queue (`machine_load.py run --label f83-6b-judge`), node_modules borrowed (same `package.json` and lock on both commits). Served by a 40-line static server with the hosting's rewrite to `app.html` (`vite preview` would hand the entry page for `/albums`). Playwright 1.56 from `MJRPpersonal/node_modules`.
- Seams, the same on both sides: Firebase hosts blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`), plus MusicKit, Spotify and PostHog hosts; the Discogs server calls answered by `page.route` (`/api/value-sources` on/off, `/api/exchange-rates`, `/api/album-value` found / 500 / 6 s slow). One line appended to the main script on the wire puts the inventory store and the **inventory service** on `window` (found by shape); the service's `addAlbum`, `updateAlbum` and `setReadings` are replaced in the page by recorders with an ok / duplicate / fail / returns-false / throws switch, so every write and its outcome is compared and nothing reaches the cloud. The albums screen's stores were already on `window`. No key read or written anywhere; `.env` not read.
- Each state is driven the same way on each side in a fresh context; at each step I compare the windows' DOM (normalised as the builder's golden: field *state*, not attribute), visible text, part boxes, focus, `body` overflow, path, toasts' text, the recorded writes, page errors, and two pictures (the window panel and the whole viewport). Pictures are taken with `#toast-container` and the footer clock (`.last-update`) hidden — toasts are compared as text instead (see question 4 for why).
- Scripts: `scripts/` in this folder (`judge.mjs`, `common.mjs`, `addwindow-cause.mjs`, `leave.mjs`, `leave-forms.mjs`, `sweep.mjs`, `brl.mjs`, `probe-*.mjs`); logs `log-*.txt`; per-pass diffs under `out/`.

| Pass | Steps compared | Different | What the differences are |
|---|---|---|---|
| Chromium 1280 | 102 | 13 | viewport 5–57 px, two window pictures 4–5 px; one toast list at its 3 s expiry |
| Chromium 1280, **old vs old** | 102 | 7 | viewport 7–51 px, one window picture 132 px — the same class of noise |
| Chromium 900 | 102 | 10 | viewport 5–51 px, one window picture 5 px |
| Chromium 899 (phone layout, mouse, no mobile emulation) | 83, and 83 again alone | 4, then 9 | every one is the parent opening with `album-window--scrolled` (title already in the bar) where React does not — P2-3; nothing else; the add window 0 px |
| WebKit 1280 | 100 + 18 rerun | 3 → 0 | one toast list at expiry; two states lost to a WebKit page-load timeout on both sides late in the run; the «add» rerun alone is 18/18 same |
| WebKit iPhone 14 | 81 + 42 rerun | 4 → 0 | toast list at expiry; the rest were the script (the phone has no backdrop and no visible sort header) and late WebKit load timeouts on both sides; the reruns of «closed by every way», «tabs» and «add» are 14/14, 10/10, 18/18 same |
| WebKit iPhone 14, **old vs old** | 82 | 6 | all six are the same late WebKit load timeouts; no picture difference at all |
| WebKit iPhone SE | 82 + 18 rerun | 7 → 0 | one toast at expiry, the rest the late load timeouts on both sides; the «add» rerun alone is 18/18 same |

Every viewport/window-picture difference I opened is either inside the area of a toast or the clock, or a few pixels of hover/caret state under the 80 % black backdrop, and the same class and size appears old against old. No difference in DOM, text, boxes, focus, lock, writes or errors between old and new on any computer pass or on the phones once rerun.

## What was covered

1. **The album window, from both screens.** Every album of the albums world (4: good sources, BestEverAlbums failed with «Try again» → «Asking…», popularity failed, not connected) and every inventory item (8: CD/vinyl/digital/no format, owned/not owned/wishlist, «Paid» in BRL and USD, notes with markup shown as text, an item with no tracks, an item with the value written by the person, an item with a kept Discogs reading). Header, cover, badges, status and series. The table sorted by **each** column (`position, title, userRank, rank, spotifyPopularity, duration`) once and twice — the row orders match. On the phone: the three tabs (original, BestEverAlbums, Spotify), the bar and the title in it after a scroll; no visible sort header on the phone on either side. Closing: ✕, «Close», backdrop, Escape, and Escape again with nothing open (computer); ✕ and Escape on the phone (the window is the whole screen: no backdrop, no footer). Focus after every step equal: it stays where the click left it (the card's button, or the page) — **neither side moves focus into or out of the window**; equal, as asked, no more requested.
2. **The value section, every body:** never read («Read the value now»), reading (6 s answer: «Reading the value from Discogs… Reading…»), value read (the three conditions, the mean, the edition, «See it on Discogs», «Read on 15 Nov 2026, 07:00», «Read again», «Data provided by Discogs.» on the computer; the folded line «≈ $22.33 Discogs · 15 Nov» on the phone), the read failed (500: the failure body, «Try again», the toast), read but not kept (the toast about the browser keeping it six hours), source off («Write the value yourself»), the person's own value («Yours», «Change it», «Use the Discogs value instead» → removed), invalid «abc» (toast), «12,50» with a comma, Enter in the field (focus stays in the input on both), EUR (the conversion note, € amounts), the kept reading in the item, and «Where to buy» (Discogs / Amazon / iMusic links with `target=_blank rel=noopener`, the Discogs release link when there is one). On the phone the fold opened. All equal.
3. **The edit window:** three items (with format, with «Not set», series item), every field (format, currency, price, notes with spaces and a line break → saved trimmed), save ok, service returns false, service throws (window stays, error toast, focus on «Save Changes» on both), price 0 (sent as 0), ✕ / Cancel close, Escape and backdrop do nothing (both). Kept defects reproduced identically: **two success toasts** («Album updated» + «Inventory item updated»); when the service returns false, the error toast **and** «Inventory item updated», and the window closes; **the invented BRL**: «The Album 1» (no currency) opens with BRL chosen and is saved `currency: "BRL"` (`brl.mjs`, identical write on both).
4. **The add window:** opened (CD, BRL, «R$»), USD → «$», back to BRL → «R$», every field, confirm ok / duplicate («Album is already in your inventory», window stays) / failure («Failed to add: …», window stays, focus on the button), ✕ / Cancel, Escape and backdrop do nothing. **Pressed twice:** a second press after the first write resolves cannot happen on either side (the window is gone); **two presses in one go** write twice and toast twice on both sides (the kept defect).
5. **Leaving the screen** (question 5, below). 6. **Sweep** (question 6). 7. **Weight** (question 7).

## Question 4 — why the add-window picture on phones moved from pass to pass

**Cause: the sign-in warning toast, «Authentication issue. Some features may be limited.»** With Firebase blocked, the app shows that amber toast at start-up (both sides). It is `#toast-container`, `position: fixed; top-4 right-4; z-index: 9999`; on a phone it is 358 px wide at y = 64, so it lies **on top of the add window**, which on a phone fills the screen. It stays about 3 s and then slides out with a 300 ms CSS transition (`opacity` + `translate-x`; it ignores `prefers-reduced-motion`, on both sides). The add window on a phone is reached through the album's «More» sheet, so it opens ~3.9 s after load (`toast-probe.mjs`: old 3,968 ms, new 3,902 ms) — right inside the toast's exit. A picture taken then catches the toast at a random point of its slide: that is the 8,573–353,308 px, the old-against-old 213,673 px, and the 0 px in a pass where it had already left. On the computer the window is centred and the toast sits to its right, so it never shows there (the computer's viewport pictures do show it, in the top-right corner only).

Evidence (`addwindow-cause.mjs`, WebKit iPhone 14; `captures/q4-*`):
- panel pictures at 0, 100, 250, 400, 600, 1000, 1500, 2500, 4000 ms after opening, two runs per side: at 0–250 ms every run differs from its own settled picture by the same 232,501 px (the toast fully over the panel, `captures/q4-add-window-phone-old-at-open-with-sign-in-toast.jpg`); at 400–600 ms the numbers scatter between runs (7,170 … 232,642; the toast's `opacity` read 0.84–0.91 and `translateX` 32–59 px mid-slide); **from 1,000 ms on every pair is 0 px — old/old, old/new, new/new**;
- hiding the album's sheet changes nothing (the sheet is already gone; the panel has no animation running — `animationName: none`, `opacity 1`, identity transform; `document.getAnimations()` lists only the toast's two transitions);
- the same on WebKit iPhone SE (82,846 px with the toast over the panel, scattered at 400–600 ms, 0 px for every pair from 1,000 ms) and Chromium 899 (58,927 px, then 0 from 1,000 ms) — `log-cause-iphonese.txt`, `log-cause-899.txt`;
- in my full passes, with the toast hidden for the pictures, the add window «opened», «USD prefix», «BRL prefix», «filled», «confirm ok/duplicate» are **0 px** on WebKit iPhone 14, iPhone SE and Chromium 899.

**Settled, there is no difference at all.** Not the sheet's slide, not an image decoding late, not the keyboard. The other phone states were spared only because the album window opens straight from the card (~3.3 s, toast still fully in place, identical on both sides).

## Question 5 — the window closes when the screen is left (on purpose)

`leave.mjs`, Chromium 1280 and WebKit iPhone 14, both screens, two ways each (the app's top-bar link followed, and the browser's **Back** after building the history through the app's links):

| From | By | Parent: windows on the next screen | React: windows on the next screen |
|---|---|---|---|
| albums → inventory | link | 1 (the centre of the next screen is the album window) | 0 (the centre is the next screen) |
| albums → inventory | Back | 1 | 0 |
| inventory → albums | link | 1 | 0 |
| inventory → albums | Back | 1 | 0 |

Same on the phone. No page error, `body` overflow unchanged after leaving, Escape afterwards closes the parent's leftover and does nothing on the new. Captures `captures/leave-*`. The albums route was exercised in the browser this time.

The same `closeAllWindows()` also takes the **edit and add windows** off when the screen is left (`leave-forms.mjs`: parent 1 left over, React 0, both by Back) — see P2-1.

## Question 6 — the other screens

`sweep.mjs`, Chromium 1280, old vs new, 4.5 s after load (toast gone): `/start`, `/home`, `/albums`, `/albums/s0`, `/inventory`, `/playlists`, `/saved-playlists`, `/album-series`, `/series`, `/blend`, `/artists`. Text and `#app` DOM identical except the footer's «Last updated: h:mm:ss» clock; pictures 0 px except the clock (`/playlists`, 1,078 px), the top bar's dots (35 px) and the pulsing icon of «Coming soon» (`/artists`, `animate-pulse`, 7,213 px). No page errors. The albums screen and the inventory screen themselves (lists, grids, phone rows) also match in every state of the main passes (their page under the window is part of the viewport picture). No source outside the windows, the two screens' route files and the dictionaries changed between the two commits.

## Question 7 — weight

Measured on my own builds (`scripts/bundle-budget.mjs`, gzip): main script 211,698 → **213,079 B (+1,381)**; after the first screen 212,976 → 213,896 B (+920); both inside the new ceilings (213,223 and the `background` 53,600 B). The `background` need is 213,079 + 213,896 − 301,437 − 72,000 = **53,538 B**: the new ceiling leaves 62 B. Justified:
- the only product files of the main script that changed are the English dictionaries: **109 new English keys** (6,639 characters added, 1,850 B gzipped on their own, less inside the bundle); every hand-made string they replace was in lazy files;
- the window files are **not on the first screen**: `app.html` preloads only `menu` and `react-vendor`; the main script's `import()` targets are the screens and PostHog only. In the browser, on any first screen (`/start`, `/albums`, `/inventory`, …) no `openAlbumWindow`, `inventoryWindows`, `AddWindow`, `EditWindow` or `ItemForm` file is fetched; they come on the press. The background prefetch of the screens pulls `windowLayer` (276 B, `closeAllWindows` of the routes) and `inventoryValue` (2,640 B) — where the parent prefetched `AlbumWindows`, `TracksTable` and `buyLinks` (6 KB). That is the +920.

## Findings

### P2-1 — The on-purpose change is wider than declared: the edit and add windows also close when the screen is left
- **Where:** `public/js/ui/windowLayer.tsx` (`closeAllWindows`), called in the `dispose` of `screens/albums/index.ts` and `screens/inventory/index.ts`; declared in `reports/evidence/F83/wave-6b/proof.md` («A janela do álbum sai com a tela») and in the brief as the album window only.
- **Evidence:** `leave-forms.mjs`: edit window open on the inventory, Back → parent leaves it over `/albums` (1), React removes it (0); add window open on the albums screen, Back → parent 1 over `/inventory`, React 0. What was typed in those forms is dropped on leaving.
- **Check:** proof.md / the map's «mudança de propósito» name all three windows (or the edit/add windows are kept as the parent kept them). It is the better behaviour; it only has to be said, so the owner's acceptance covers it.

### P2-2 — The proof left the add-window difference unexplained; the noise source is a toast, and the proof script can remove it
- **Where:** `reports/evidence/F83/wave-6b/proof.md` («A causa exata não foi localizada»), `browser-proof.mjs` (`windowShot` takes the panel with the toast layer on top).
- **Evidence:** question 4 above; with `#toast-container` hidden during the picture, or with the picture taken ≥ 1 s after the toast leaves, every phone pass of the add window is 0 px, old/old and old/new.
- **Check:** proof.md replaces «not localized» with the cause, and the proof script hides `#toast-container` (and the footer clock) for pictures while comparing toasts as text — so a real difference under that area would not be masked as noise again.

### P2-3 — At 899 px in a desktop Chromium, the parent opens some album windows with the title already in the phone bar; the React one does not (undeclared)
- **Where:** the phone bar of the album window (F76): parent `components/ViewAlbumModal.js` `watchTheTitle` (the IntersectionObserver is attached while the window is still off the page); React `ui/albumWindow/AlbumWindow.tsx` `useTitleInTheBar` (attached in an effect, after it is on the page). Same root, same `-56px` margin.
- **Evidence:** Chromium 899×900, mouse, no mobile emulation: on the albums screen, opening an album by the **title under its cover** (`album-tile__text`) in a fresh page gives the parent `album-window album-window--scrolled` every time (`probe-scrolled2.mjs`: albums 0 and 1, both tries), the React one never; opening by the cover gives neither. On the inventory at 899 the parent did it in 6 of about 28 openings across the two passes, not always on the same item. Picture: 50,320 px, the bar showing «Album 0» while the header below still shows it (`captures/p2-3-chromium-899-album1-old-title-in-bar.jpg` / `-new.jpg`). After a real scroll both show the title in the bar alike (every phone pass, «the window scrolled» = same). Not seen on WebKit iPhone 14 / SE (touch) nor in the builder's 899 pass, which emulated an iPhone.
- **Check:** proof.md names it as a parent defect not carried (the React one shows the bar empty while the header title is in view, which is the F76 rule). No code change asked; the owner's acceptance should know it, since parity is the rule of the wave.

### Observations (not counted)
- `probe-scrolled.mjs` (opening the windows one after another in the same page) never triggered P2-3 on either side: the parent's race needs a fresh page and the right entry point.
- The sign-in toast's slide ignores `prefers-reduced-motion` (both sides; pre-existing, outside this wave).
- The owner's Portuguese preview (`mjrp.lang.preview = pt`): the new windows have Portuguese texts in the dictionary, the parent's were English-only. With the mark set in storage my run still rendered English on both sides (the preview needs more than the mark, or the locale file loads later than I waited); not judged — see below.

## What I could not see

- Real Discogs, real MusicKit, real Spotify popularity, real Firestore writes: all stubbed identically on both sides; the write payloads were compared, not their persistence.
- A real touch keyboard on the phone (WebKit emulation types without an on-screen keyboard), real iOS Safari, VoiceOver.
- The Portuguese preview of the windows (above).
- Width 820 and a tablet profile; Firefox.
- The «Paid» and value amounts with a real exchange-rate failure (rates always answered).
- Pixel-exact comparison of the window during its 200 ms fade (pictures are of settled states; the fade-out is the same code path `opacity 0.2s` on both).
