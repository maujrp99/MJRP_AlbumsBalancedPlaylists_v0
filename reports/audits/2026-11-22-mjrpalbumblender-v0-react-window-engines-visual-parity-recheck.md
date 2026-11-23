---
type: visual-parity-recheck
feature: F83
step: wave 8b (notices, loading bar, window shell and question windows in React)
branch: claude/f83-wave-8b-window-engines
judged_on: 3877aaf7731f025d3efa4d8eb3227199fbdf4665
reference: claude/f83-wave-8a-exports at f4eae56
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 3
---

# F83 wave 8b — independent visual and timing recheck of the window engines

**Verdict: pass.** On the built sites, in six profiles, the notices, the loading bar, the question windows and the window shell behave as the parent's
(same texts, order, places, z-order, page lock, focus, answers; every time within one frame), with one visible difference that is on purpose and
better (P2-1), plus two minor notes. Nothing breaks a flow; nothing a person would notice in normal use.

## How it was judged (my own scripts, not the builder's)

- `git archive` of f4eae56 and 3877aaf into this folder; `vite build` of each through the machine queue (no `.env` exists in the archives; nothing read from the repository's).
- My server (`judge.mjs`): static, deep routes answered with `app.html`, `/api` 404; Firebase hosts (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`) and every non-local host blocked; my MusicKit stand-in records every call (`window.MusicKit`, the token fetch); Spotify is a stand-in token in `localStorage`. One line appended to the served chunk that holds the inventory / saved-playlists store (same line both sides) to give the page data.
- My recorder in the page (`MutationObserver` + capture listeners): every notice coming / in / out / removed, every window and sheet in/out, the bar shown/hidden, the body lock, focus, every input — with `performance.now()`. Times are measured from their cause (a notice from the tap that made it; in/out/removal from its own coming, or from the tap on its ✕). After each step: the layers (`#toast-container`, `#globalProgress`, `.app-modal`, `.modal-overlay`, `.rank-window`, `.sheet`) as normalized HTML **with every element's box**, z-index, the body's lock style, the focus, the scroll, the order of the layers in `body`, the path; viewport screenshots (never full page) at key steps, compared pixel by pixel.
- **One page open at a time** (parent, then branch), and a **parent-vs-parent control** in Chromium 1280 and 899, WebKit 1280, iPhone 14 and iPhone SE. Profiles: Chromium 1280, 900, 899; WebKit 1280, iPhone 14, iPhone SE (touch). 11 scenarios per profile, plus the Apple Music failure export in Chromium and WebKit 1280.
- Scripts: `judge.mjs`, `runall.sh`, `analyze.cjs` (re-reads a run, puts two window writes of the same instant in a fixed order so the documented order change does not hide later differences), `totals.cjs`, `show.cjs`. Raw runs: `out/*.json.gz`, logs `out/*.log`.

Scenarios: page load with the database blocked («Authentication issue»); Start «Search» with nothing typed three times (stacked notices, ✕ on the 2nd, auto-dismiss); `/callback` (Spotify failure notice); Albums (remove album: open, Enter, backdrop, Escape, ✕, Cancel, Remove → error notice; delete series → «Database not initialized» notice; edit series window + picker warning notice + scroll inside; add-to-inventory window + Add; ranking window: drag a track, Escape → «Discard changes?», Escape = keep editing, Escape again, Discard; album window + wheel + Escape; on the phone each question opened from the card's sheet); Inventory (delete item: the same five ways, then confirm; edit window + Save); Saved playlists (playlist details window, wheel over it, close; the same window asked twice by keyboard; batch export to Apple Music; delete batch: Escape, then confirm → notice; phone: from the batch sheet); Playlists (regenerate with no series → notice; export to Apple Music into a folder → notice; failure variant; phone: delete playlist from its sheet → question, Escape, confirm); Shell (account panel / phone Menu sheet: disconnect Spotify → question, Escape, confirm → «Disconnected» notice); the bar (every screen in turn by the router and by the menu links; screens' files held 2.5 s; two overlapping navigations).

## Totals

| Run | checks equal / differ | timeline sequences differing | timed events | worst time gap |
|---|---|---|---|---|
| Chromium 1280 parent vs branch | 53 / 12 | 1 (P2-1) | 136 | 9.3 ms |
| Chromium 1280 control | 55 / 5 | 0 | 162 | 9.8 ms |
| Chromium 900 parent vs branch | 52 / 13 | 1 (P2-1) | 136 | 30.5 ms (page-load clock, see noise) |
| Chromium 899 parent vs branch | 52 / 1 | 0 | 434 | 32.6 ms (page-load clock) |
| Chromium 899 control | 52 / 1 | 0 | 434 | 47.2 ms (page-load clock) |
| WebKit 1280 parent vs branch | 50 / 14 | 2 (P2-1; slow-bar script race) | 124 | 36 ms (page-load clock) |
| WebKit 1280 control | 49 / 10 | 1 (slow-bar script race) | 150 | 81 ms (page-load clock) |
| iPhone 14 parent vs branch | 51 / 4 | 0 | 423 | 75 ms (page-load clock) |
| iPhone 14 control | 52 / 3 | 0 | 423 | 71 ms (page-load clock) |
| iPhone SE parent vs branch | 53 / 2 | 0 | 423 | 23 ms (page-load clock) |
| iPhone SE control | 52 / 3 | 0 | 423 | 39 ms (page-load clock) |
| Apple Music failure, Chromium / WebKit 1280 | 6 / 0 each | 0 | 13 each | 4.7 / 10 ms |

Every difference not listed as a finding below is **also present in the control** (the same code twice), in the same place:
- the time of the «Authentication issue» notice and the first bar state measured **from page start** (70–200 ms, varying 20–80 ms run to run in both directions; the first page of a browser is slowest; tabulated per scenario, no side is systematically later);
- a box 1 px off in a snapshot taken 100 ms into a notice's 300 ms exit (mid-transition);
- pixels in the top bar's equalizer (WebKit, `x 16-196, y 21-50`) and in the bottom-right footer corner (`x ~1170-1200, y ~833-854`, max 1–15/255);
- WebKit 1280 slow-bar scenario: the script's first `navigate` sometimes lands after the Start screen's held file (the page answers `window.router` late); the bar's own timings are equal.

Event times measured from their cause (notice from its tap; in/out/removal from its coming; bar from the navigation; window in/out; lock) were **all within one frame (20 ms)** between parent and branch in every profile; the only gaps above 20 ms are the page-start clock above.

## Findings

### P2-1 — The playlist details window asked for twice: the parent stacked two windows, the branch shows one (on purpose #5; visible; better)
- **Where:** Saved playlists, computer (Chromium 1280 and 900; WebKit 1280 too), the «eye» button of a playlist. `useModalWindow` (`ui/ModalWindow.tsx`), the only user is `screens/saved-playlists/PlaylistDetails.tsx`.
- **Evidence:** the window takes no focus and traps none, so after the first Enter the button behind keeps the focus; a second Enter asks for the window again. Parent: two `#playlist-modal` shells, the backdrop twice as dark (162,814 px differ, max 40/255), and the first ✕ takes the window with the tracks away, leaving an **empty** window (the title «Playlist p1» and its ✕, no tracks, no Close button) that needs a second ✕. Branch: one window, one ✕ closes it. `captures/details-asked-twice-parent-chromium1280-small.png` / `…-branch-…-small.png` (full size: `captures/c1280-saved-details_twice-{A,B}.png`).
- **Reachable?** Yes, by keyboard only (mouse/touch can't reach the button under the backdrop). The result is not equal; the branch's is the correct one.
- **Check:** the orchestrator lists it among «differences on purpose» as a visible one (not «invisible»): «asking the same window twice now replaces it; before, a darker double window and an empty one left behind».

### P2-2 — A question opened, then Enter: the question is asked again (kept on both sides) — the documented order change is the only difference
- **Where:** every confirm on the computer (remove album, delete inventory item, delete batch, disconnect Spotify). Chromium keeps the focus on the button that opened the question (WebKit/touch leave it on `body`).
- **Evidence:** Enter re-triggers the opener behind the window, so a new question replaces the old one (the old one is answered «cancel»). Parent: old out, new in; branch: new in, old out — same millisecond, same frame (on purpose #3). Snapshots after Enter are equal (DOM, boxes, focus); no page lock on the computer, so no lock/unlock flicker to see; on the phone Enter is not reachable (touch). The «Enter does not confirm, it asks again» behaviour is an existing defect, equal on both sides (issue candidate, with «no focus on open»).
- **Check:** none for this wave.

### P2-3 — Portuguese preview: the question windows' default buttons are now translated
- **Where:** `ui/dialogs/ConfirmWindow.tsx`, `InputWindow.tsx` (`ui.dialog.confirm/cancel/save/ok`). Every question that does not pass its own «Cancel» (all of them) now shows «Cancelar» in Portuguese where the parent showed «Cancel».
- **Evidence:** code; Portuguese is closed to the public (`OPEN_LOCALES`), visible only with the owner's preview mark. In English (all my runs) the texts are identical.
- **Check:** the owner reviews the 4 proposed texts with the other Portuguese ones.

### Checked and equal (no finding)
- **Notices:** success / error / warning / info all reached through real flows (remove album error, «Database not initialized», picker warning — the new `warn` wiring of the edit-series picker and the Start picker works —, «Deleted batch», «Deleted playlists for Plant», «Disconnected from Spotify», «No series to take the albums from», Apple Music success and «did not create 2 of 2», `/callback` failure, «Authentication issue»). Texts, kind (colour class), order, stacking (three at 58 px steps), the ✕ (the 2nd goes, the others stay), the in at the next frame, the 4 s auto-dismiss and the 300 ms exit: equal within one frame. Place top-right on the computer, full width under the top bar on the phone; z-index 9999 over windows (z-50) and sheets (z-1000) — equal boxes and order in `body`.
- **Question windows:** text, buttons (`btn-danger` where asked), sheet-from-the-bottom on the phone (`app-modal--bottom`), no focus taken on open, backdrop does nothing, Escape = cancel, ✕ = cancel, Cancel, confirm → the following notice proves the answer; page lock on the phone (`data-scroll-locked`, `position: fixed`, `top: -scrollY`) and restored to the same scroll. The ranking window's «Discard changes?» (now `ConfirmWindow` via `showWindow`) reached by a real drag: Escape keeps editing, Discard closes both — equal (the two removals swap order within the same millisecond).
- **Question from a phone sheet:** from the card / batch / playlist sheets the sheet leaves as the question comes (equal). From the **phone Menu sheet** (disconnect Spotify) the question sits **under** the sheet and is invisible until Escape closes the Menu (`captures/i14-shell-disconnect_question-{A,B}.png`, pixel-identical) — the kept defect, the same on both sides.
- **Window shell:** add-to-inventory, inventory edit, edit series (scroll inside), export window (folder step), playlist details, the album window (`.modal-overlay`, not the shell) and the ranking window: open/close, boxes at every profile, `full` form on the phone, wheel over the window, page lock — equal. Window over window: the ranking window's question over the ranking window, the confirm over the phone Menu: equal.
- **On-purpose «invisible» differences:** (1) React draws a microtask later: the notice appears 0–1 ms after the tap on both sides, no flash; (2) `#globalProgress` at the end of `body`: equal z-index (9999) and the same relative order to `#toast-container` (bar first, notices after, as before), nothing above it — invisible; (3) replacing question: P2-2; (5) replaces instead of stacking: P2-1 (reachable, visible, better).
- **The WebKit prompt fix (starting text selected):** not reachable in the app (the only caller needs an error text the service never throws), so not seen on the built site; code read: `value` and `autofocus` written as attributes by a stable ref, native `input` listened, Save/Enter read the same value — consistent with the builder's figures.
- **Apple Music:** `test/fixtures/exportMusicKitRecording.json` is byte-identical (same blob `3a379f26…`, `git diff f4eae56 3877aaf` empty). On the built site, my recorder: one playlist set into a folder (14 calls: token, configure, getInstance, authorize, 2 folder reads, folder create, 5 catalog searches, 2 playlist POSTs with the same bodies), the saved batch export (12 calls), and the failure (every POST refused → the same error notice): **the same calls, in the same order, with the same parameters and bodies** in Chromium and WebKit 1280. Notices after the export equal in text and timing.
- **Regression sweep:** Start, Albums, Inventory, Blend, Saved playlists, Playlists, `/callback` opened on every profile; no page error on either side; layers, focus and scroll equal at every snapshot.

## The orange loading bar: when it shows, for how long, on which screens

Both sides behave **the same** (the store keeps the old rules: shown on the first `start()`, hidden 200 ms after the last `finish()`).

- **Moving between screens** (router): the bar shows only if a screen's file takes **more than 150 ms** to arrive; it then shows from 150 ms after the tap until 200 ms after the file arrives. Measured with the files held 2.5 s: shown +152–156 ms after the navigation, for 2.56 s, on every profile, both sides. Two overlapping navigations: one bar, shown +153 ms, gone 200 ms after the last file. With the files already downloaded (the app pre-fetches them after the first screen), going to Albums, Blend, Inventory, Saved playlists, Playlists and Start by the router or by the menu links: **the bar never showed**, on any profile, on either side.
- **Reading the series** (`SeriesService.loadFromFirestore`, which starts the bar and finishes it in `finally`): called on **every visit to Albums** (`SeriesController.loadScope` → `refreshSeriesList`) and to **Blend** (`blendVisit.read`), on Playlists when it has no series, and at sign-in for the inventory. With an account, the bar shows for the whole database read plus 200 ms. I could not measure that duration (no account, the database is blocked): the read is skipped signed out. This is what the owner sees on Albums and Blend; it is the same code on the parent (the bar exists since December 2025, `components/GlobalProgress.js`), so it is **not** a change of this wave. To stop it, the series read would have to stop starting the bar (or start it only past a delay, as the router does).
- Look: fixed at the top, full width, 6 px high (`h-1.5`), `bg-brand-orange` with an orange glow, an indeterminate animation, z-index 9999; on the phone `css/mobile.css` moves it under the top bar. Equal boxes and pixels on both sides (`captures/*-barslow-bar_slow-{A,B}.png`).

## Weight (gzip bytes, `scripts/bundle-budget.mjs` of each side)

| Build | main script | after the first screen | first screen | budget |
|---|---|---|---|---|
| parent, no keys | 195,460 | 236,792 | 289,388 | inside |
| branch, no keys | **195,608 (+148)** | **235,445 (−1,347)** | 289,557 | inside (ceiling 196,010: 402 B room) |
| parent, stand-in keys | 195,674 | 236,797 | 289,606 | inside |
| branch, stand-in keys | **195,828 (+154)** | 235,448 | 289,781 | inside (182 B under 196,010) |

Background need (main + after − 301,437 − 72,000): 57,616 B without keys, 57,839 B with keys, against 58,100 (484 / 261 B room). `react-vendor` 68,691 unchanged. Stand-in keys passed only through the environment of the build command (Spotify id 32 hex, PostHog `phc_` + 43, host 24 characters), generated at random per build; no `.env` read, no file written with them.

## What I could not see

- The prompt window (`dialogService.prompt`) on the built site — no screen reaches it (kept defect); the WebKit selection fix is judged on the code only.
- The bar during a real series read with an account (database blocked, no sign-in): reasoned from the code, same on both sides.
- `alert` (no caller), the delete-series question (the count of saved playlists is refused first: the notice is equal), Escape-less windows' keyboard traps beyond what is listed, a real iPhone (WebKit with the iPhone 14 / SE profiles only), and Portuguese texts in the browser.
- The add-to-inventory and inventory-edit writes hang on the blocked database on both sides, so their success/failure notices were not reached (their wiring — `notify` passed — was read in the code).
