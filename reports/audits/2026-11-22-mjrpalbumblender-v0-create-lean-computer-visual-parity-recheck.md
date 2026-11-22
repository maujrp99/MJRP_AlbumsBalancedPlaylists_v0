---
type: visual-parity-recheck
feature: F79
branch: wip/f79-create-lean-computer-and-no-loading-line
judged_on: 10649f8
reference: design/proposals/f79-create-lean-computer (Enxuta); main at 336385a for the phone and the other screens
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 1
p2: 4
---

# F79 · the lean «Create» screen on the computer and the loading line removed: independent visual recheck

**Verdict: pass.** Nothing breaks the approved screen, the phone or a flow. The one P1 is the Albums screen while it loads. Removing the line did not create that problem. It uncovered it, and the owner has to decide on it.

## How

- `git archive` of `336385a` (merge-base, «main») and `10649f8` (branch) into this folder. `vite build` for each, through the machine queue (`f79-lean-computer-judge`).
- Each build ran on its own static server (127.0.0.1:6481 for main, 6482 for the branch). Deep routes return `app.html`; `/api/musickit-token` returns a stub token; other `/api/*` routes return 503.
- Playwright 1.56.1 borrowed from MJRPpersonal, with Chromium and WebKit, reduced motion and toasts hidden.
- Firebase hosts are blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`). For the test stand-in account, the auth lookup and token refresh are answered locally. No password is typed.
- The catalog is a fixture: `window.MusicKit` is replaced before the page runs. It returns 11 fictional «Radiohead» albums with generated covers, and has «never answers», «not found» and «fails» modes.
- The scripts are in `work/`: `common.mjs`, `runA.mjs`, `runKeys.mjs`, `runB.mjs`, `runOther.mjs` and `diff.py`. The raw captures and facts are in `work/raw*`.
- Matrix A: 10 states × {1280×800, 1440×900, 1920×1080} × {Chromium, WebKit} × {signed in, signed out}, on main and on the branch. Also 900×800 (Chromium and WebKit), plus 899×800 (Chromium and WebKit), WebKit iPhone 393×852 and WebKit iPhone SE 375×667, each signed in and out, on main, a second main run (noise control) and the branch.

## Findings

### P1-1 · Albums shows «No albums in library · Go and create!» for the whole series read, with no sign of loading (owner decision)
- **Where:** `/albums`, computer and phone, signed in, while the series read is in flight.
- **Evidence:** `captures/albums-during-wait-branch.jpg`, sampled every 60 ms in `work/rawB/*/…json`.
  - Branch, computer, 300, 800 and 1300 ms after the click: «No albums match your filters / Try adjusting your search or filters», and below it «No albums in library / Create a series from the home page to get started».
  - Branch, iPhone: the same «No albums in library» card with the orange «Go and create!» button, from ≈130 ms until the end of the read.
  - Nothing on the screen signals a load. The only busy element is the connection dot in the menu (`conn__status--wait`), which is not about the series.
  - On main the screen is the same, under the 6 px orange line (`#globalProgress`, `display:block`, from ≈30 ms to ≈1750 ms).
- **How misleading:** high, for anyone who has series. The screen does not say «empty for now». It says the library is empty and offers a button to leave and create a series. On the computer it also shows two empty messages at once (this was already on main).
  - The exposure lasts as long as the read: here 1.5 s (forced); in real use, whatever Firestore takes. A slow network or a cold start can make it long.
  - The B change did not cause it. It removed the only cue.
- **Check:** on `/albums`, while `albumSeriesStore` is loading, either a loading state shows or the empty state does not render. For the owner, the choice is: (a) accept it as is; (b) give Albums its own loading state, like Blend's «Loading your series…»; (c) bring the line back for Albums only.

### P2-1 · One Escape closes both the open account menu and the open series sentence
- **Where:** `/start` on the computer, branch. The listener is `HomeView.mount` → `document.addEventListener('keydown', …Escape → closeWhatText)`.
- **Evidence:** `work/raw/keys/keys-branch-chromium.json`. With the sentence open and the «Connections» menu open, one Escape closed both (`whatAfterEsc.expanded=false`, menu `invisible`). On main, Escape closes the menu alone.
- **Check:** Escape closes only the innermost open thing. The sentence closes only when focus is in the hero (or no other popup is open).

### P2-2 · On the phone, «What is a series?» now has `aria-expanded="false"` and `aria-controls` while it opens a dialog
- **Where:** phone and 899 px, branch. The `.home-what` attributes are `{expanded:"false", haspopup:"dialog", controls:"homeWhatText"}`; on main they are `{haspopup:"dialog"}` only.
- **Evidence:** `work/raw/branch/p393-webkit-*.json`, `states.first.whatAttrs`. The pixels are identical, but VoiceOver will announce the button as «collapsed». The builder's proof says the phone has no `aria-expanded`, which is wrong for the DOM.
- **Check:** `drawWhatLink(phone)` removes `aria-expanded` and `aria-controls` on the phone and puts them back on the computer.

### P2-3 · After the last album is removed, the «Undo» strip floats over the grid with no bar under it and covers a card title
- **Where:** computer, «removed-undo» state, all sizes.
- **Evidence:** `captures/undo-strip-no-bar-1440-webkit.jpg`. «Removed «A Moon Shaped Pool». Undo» sits over the «Pablo Honey» title for its 8 s. It is a consequence of «no bar until the first cover». The strip itself is correct and reachable.
- **Check:** the strip does not cover card text, for example by reserving bottom padding while it shows. Optional.

### P2-4 · On monitors taller than about 950 px, the block stops moving down
- **Where:** `.home-stage.is-big.is-calm { padding-top: clamp(44px, calc(19vh - 30px), 150px) }`.
- **Evidence:** `captures/first-visit-1920-branch.jpg`. At 1920×1080 the field is at y=420 (39 %) and the whole block sits in the top 55 % of the screen. That still reads as deliberate and not lost: the title, link, field, link and equalizer stay grouped, the glow goes with them, and the menu stays in view.
  - At 1080 the cap (150 px) is already reached. On a 1440p monitor (not seen) the bottom half will be empty, as the proposal's risk 1 anticipated.
- **Check:** none needed now. If the owner sees a large monitor and dislikes it, raise the cap.

## What matches (no finding)

- **The approved preview:** `captures/preview-vs-branch-1280.jpg`. Below the menu, the branch's first visit at 1280 (scaled to 800×500) differs from `caps/first-visit-lean-1280.png` by a mean of 0.66/255, and 0.19 % of pixels differ by more than 40. The title, the link, the field, «or paste a list» and the equalizer fall in the same places.
- **States on every computer profile** (1280, 1440, 1920, 900; Chromium and WebKit; signed in and out):
  - The placeholder reads «Type an artist».
  - The only hint is «or paste a list». In the paste state it is «Search an artist instead», and in «not found» there is no hint.
  - There are no three steps (`#homeHow` is gone) and no «Press Enter…» line.
  - The bar is absent before the first cover and absent again after the last one is removed.
  - The «You're not signed in» notice appears only with albums, inside the bar (judged right: the preview says it «comes with the bar»).
  - No horizontal scroll.
- **«What is a series?» on the computer:**
  - The sentence opens in place under the link (the field moves down 58 px) with `aria-expanded` set to true. A second click closes it.
  - With the keyboard, Enter, Enter, Space and Escape give open, close, open and close. Focus stays on the link throughout, and the focus ring (2 px white) shows (`captures/what-open-keyboard-focus-1280.jpg`).
  - Escape when the sentence is closed changes nothing. Escape inside the field closes the sentence and keeps the typed text.
  - Shrinking the window to the phone closes it.
- **Tab order** (Chromium): the menu, then Sign In, Connections, «What is a series?», the field, Search, «or paste a list», then the footer. This is sane. (Playwright WebKit tabs only to fields, as macOS does by default.)
- **Layout shift when the first cover is chosen:** 0. The Chromium layout-shift score is 0 in every profile, and the first card stays at y=402 before and after. The bar is fixed at the bottom.
- **Search after typing in WebKit:** tapping or clicking «Search» right after typing still starts the search on the branch. All 9 covers appeared in WebKit at 1280, 1440 and 1920 and on iPhone 393 and 375.
- **The phone and the 899/900 boundary:**
  - Main vs branch: **0 pixels differ in 88 of 88 captures** (393, 375, 899 Chromium and WebKit, 11 states, signed in and out). The main-vs-main noise control is 0 as well.
  - 900 already behaves as the computer.
- **The builder's decisions:**
  - Notice inside the bar: correct.
  - The stage still redraws on typing and focus: harmless, and it keeps the phone at 0 px.
  - `is-calm` lowers the block before a search: matches the preview's intent, with the cap noted in P2-4.
- **B, the line:**
  - The branch has no `#globalProgress` and no fixed element of 8 px or less at the top, at any sample, on either screen or device.
  - Main has the line from ≈30 ms to ≈1750 ms.
  - During the wait, the branch differs from main only in the line's band (computer y<24; phone css y≈42–76). Elsewhere the differences match the main-vs-main noise regions.
  - Settled screens are 0 px against main on all 8 (`/albums` and `/blend`, direct and by menu, computer and iPhone).
  - Blend during the wait shows its own spinner in place of the series on the computer, and «Loading your series…» on the phone (`captures/blend-during-wait-main-vs-branch.jpg`).
- **Other screens:**
  - `/`, `/inventory`, `/saved-playlists`, `/playlists`, `/playlists/edit`, `/albums` and `/blend`, settled, are 0 px against main on the computer. On iPhone the only difference is 383 px in the tab-bar equalizer (animation noise).
  - Console errors are the same on both sides and all come from the test setup: blocked Firebase, the stubbed 503 `/api`, the worker JSON.
  - No source references `GlobalProgress` any more, apart from the branch's own test that asserts it is gone.

## Albums while loading, the facts

- **Branch, computer:** «No albums match your filters» together with «No albums in library — Create a series from the home page to get started», from ≈190 ms to the end of the read. No spinner, no line.
- **Branch, iPhone:** blank under the search at ≈70 ms. From ≈130 ms, the «No albums in library» card with «Go and create!».
- **Main:** the same content, plus the orange line, which was the only cue.

## What I could not see

- What a person with real series sees after the read. My stand-in account has none, so «settled» is still the empty state, and the switch from empty to albums was not observed.
- The real Firestore timing, Safari on a real Mac or iPhone, Firefox, and monitors above 1920×1080 (1440p, 4K).
- A screen reader actually speaking `aria-expanded`.
- The React migration line's own `GlobalProgress.tsx`, which is out of scope.
