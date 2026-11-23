---
type: visual-parity-recheck
feature: F83
step: sync of main (the F88 menu in React)
branch: claude/f83-sync-main-and-the-new-menu
judged_on: 5bcb82a
reference: main at 1330ba9 (the hand-made F88 menu, in production)
previous_wave: a14aea9 (wave 5b, for the weight and the time of the first screen)
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 1
p2: 3
---

# F83, the new menu in React against production's menu: independent visual parity recheck

**Verdict: pass, with one P1 to fix before the merge.** The React shell draws the same pixels and behaves the same as production's hand-made menu. I checked every route, every account state, both engines and the phone line at 768, 800 and 899 px. I ran 1,263 checks. 20 of them differ, and every one is explained below: the noise of the «coming soon» screens, a notice still sliding in, an option's whitespace, or the P2s. The P1 is about the builder's proof, not about the screen. The one difference he declared on purpose does not exist in a real browser.

## How it was checked
- **Builds.** I built three sites myself, through `machine_load.py`, each with `vite build --outDir` into `work/`: `main` at 1330ba9 (from the clean tree `scratchpad/main-old`, whose `public/` and `src/` equal 1330ba9), the branch (worktree `agent-a3f82d1f2869de070`, app code equal to 5bcb82a; 5f3fd50 adds only `docs/log.md`), and wave 5b (a14aea9). I served them with `vite preview` on 127.0.0.1:5611/5612/5613 and stopped all three at the end. The app redirects `localhost` to 127.0.0.1, and the seams must live on that origin.
- **Blocked.** `identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations` and every other outside host except Google Fonts were blocked. **The signed-in seam:** an account record written into this throwaway context's IndexedDB, with `accounts:lookup` and the token refresh answered locally. No request left the machine. Nothing was written anywhere.
- **Stubs.** MusicKit was replaced by a stand-in script, with `/api/musickit-token` answered locally. Its modes: script blocked, connected, not connected, a 6 s answer (to show «Checking…»), token 500, `configure` throws, `authorize` refused. Spotify was stubbed with a token in `localStorage` and `/v1/me` answered locally.
- **Method.** Every scenario opened `main`, the branch and `main` again; the third is the noise control. The comparisons: pixels of the viewport or the panel; menu state (`aria-current`, the lit stretch, the bar's rectangle); overlap (content starts below the top bar and ends above the phone menu, and the page has no sideways scroll); focus; what Apple's script was asked; Apple requests before and after opening the panel; console errors.
- **Engines and sizes.** Chromium at 1280, 899, 800 and 768. Playwright WebKit at 1280, on iPhone 14 and on iPhone SE. Larger text by a root font of 130 %. Motion reduced.
- **Scripts and results** are in `work/`: `lib.mjs`, `menu.mjs`, `extra.mjs`, `passage*.mjs`, `win.mjs`, `connect-probe.mjs`, `cancel*.mjs`, `speed.mjs`, `res*.mjs`, `results-*.json`, `run-*.log`, `speed-slow4g.json`.

## What holds (equal to production)
- **The computer's bar on all 14 routes**, the redirects included (`/start`, `/albums`, `/albums/:id`, `/blend`, `/saved-playlists`, `/playlist-series`, `/playlists`, `/playlists/edit`, `/inventory`, `/artists`, `/genres`, `/tracks`, `/album-series`, `/series`). It sits at 330, 10, 620 × 52, with the same lit stretch, the line under Albums and Playlists, `aria-current` and the flip mark. The viewport differs by 0 px except on the «coming soon» screens: at most 1 to 3 levels in 255, at y 159–255, which shows up main-against-main too.
- **The account panel, in every state, signed out and signed in:** checking, connected, not connected, could not connect with «Try again», and Spotify connected «as Test Listener». The button carries the initial, the dots, the name, «Sign In», and the label that says the summary. The pixels differ by 0. Captures: `captures/chromium-1280-panel-*`.
- **Keyboard.** The Tab order is the same. Escape closes the panel and gives the focus back to the button. Enter, a click outside, and Enter on a stop (address, `aria-current`) behave the same. **ArrowDown on the account button lands on the first control that remains** («Connect Apple Music», or «Connect Spotify» while Apple shows «Checking…»), the same in Chromium and WebKit. The builder's fix holds.
- **Disconnect** opens the same question, and the panel stays open after confirming or cancelling. The focus returns to the row's button.
- **Apple Music in the background.** With no sign of an earlier authorization, nothing is asked of Apple until the panel opens, on both sides. With the sign, the token and the script are asked at idle on both sides. With Apple's script blocked, no new console error appears: the only error on both sides is the one that was already there (see «Not a finding»).
- **The phone, at 768, 800, 899, iPhone 14 and iPhone SE.** One opaque bottom menu (`rgb(10,10,12)`, 76 px, flush with the bottom). No label sits over the row of bars (0 px of overlap), also at 130 % text. The Menu sheet shows the same rows; its focus starts on «Sign In», and Escape gives it back to the menu button. A tap on each of the five stops gives the same address and `aria-current`. Nothing of any screen sits under the phone menu or the top bar.
- **The two ports.** The series grid has 2 columns at 600 px, 3 from 640 to 900, 4 at 1024 and 5 at 1280, the same as production, at 0 px. The phone layout runs up to 899 px and the computer bar starts at 900, the same on both sides (`usePhone` against main's CSS).
- **Home → app.** The bar keeps the same rectangle on the home and on `/start`, sampled every 60 ms during the passage (25 samples), at 1280, 800 and 393 and on iPhone 14. The app's bar is equal to main's, at 0 px. One WebKit 800 sample showed 5,530 px. Repeated 3 times, it came back once on each side, so it is noise.
- **The still hand-made screens** (Inventory, Blend) are drawn the same inside the React shell, at 0 px.

## Findings

**P1-1 · The one «deliberate difference» does not exist in the browser. Both sides keep the panel open through «Connecting…» and «Connected», then close it.**
- *Files:* `test/shell/Shell.sameAsBefore.test.tsx:44-46` (`KNOWN_DIFFERENCES`), `docs/specs/features/F83-site-screens-in-react/wave-lessons.md` § 12 (the paragraph on «Connect»), `reports/evidence/F83/sync-main/proof-sync-main.md` § 1, `public/js/shell/TopNav.tsx:45-46` (`<Menu key={drawnAnew}>`, which draws the account again at each notice of the user store).
- *Evidence:* `work/connect-probe.txt`, a MutationObserver on the button, by mouse and by keyboard, in Chromium and WebKit. On both sides the sequence is `true|Connecting…` → `true|Connected` → `false|Connected`. A refused connect also ends closed, on «Could not connect». So the hand-made panel does not close «by accident» on the click, and the React panel does not stay open. They are identical. The jsdom golden asserts a difference the built site does not have. The builder's browser proof never checked `aria-expanded` after «Connect».
- *The change:* remove the «keepOpen» entry (or make it true) and correct § 12 and the proof. Add a browser check of `aria-expanded` after «Connect».
- **The answer to the question.** Keeping the panel open after «Connect» is right. The person sees «Connecting…», then «Connected» or «Try again», as «Disconnect» already does. Neither side does it today. Fix it in both, keeping the panel open across the redraw: in React, keep `open` outside the keyed `Menu` or stop remounting the account; in production, the same in `AuthNav`'s redraw.

**P2-1 · The figure for the weight.** The main script grew **1,890 B** gzip (234,003 against 232,113 on the wire; 233,010 against 231,139 at `gzip -9`). The builder's note and `scripts/bundle-budget.json` say 1,878 B. The first screen also downloads two new files, `menu-*.js` (2,965 B) and `menu-*.css` (1,464 B), and production's `wordmark.jpg` (25.5 kB): 28 kB more in all against wave 5b. *The change:* correct the figure and name these files in the note of `bundle-budget.json`.

**P2-2 · The time of the first screen** (`/start`, Slow 4G: 562.5 ms, 180 kB/s; cold; median of 5, interleaved; `work/speed-slow4g.json`).
- Against wave 5b, the time to see the screen is **equal**: first paint 1,696 against 1,676 ms, largest paint 4,616 against 4,596 ms, screen ready 4,600 against 4,575 ms (+0.5 %). The `load` event comes **+168 ms** later (4,044 against 3,876 ms), from the 28 kB above.
- Not caused by this step, but seen: **production's first screen is ready in 3,297 ms**, about 1.3 s sooner than the React line. Wave 3 recorded +0.4 s. The extra lazy files on `/start` (`Breadcrumb` 14 kB, `pickerController` 6.7 kB, among others: `work/res2.mjs`) and `react-vendor` explain it.
- *The change:* none in this step. Record it for the wave that owns the first screen.

**P2-3 · After Disconnect → Cancel, the account button's icon differs by 58 px, up to 17 levels in 255** (x 1233–1263, y 13–43). It came back 3 times in 3 runs; main-against-main showed 0. It cannot be seen at 4× (`captures/p2-disconnect-cancel-button-x4-*.png`). Production's redrawn button carries whitespace text nodes that React's does not. *The change:* none needed; record it as a known raster difference.

## Not a finding (equal on both sides, or noise)
- The «coming soon» screens differ by at most 1 to 3 in 255, also main-against-main.
- The «Authentication issue» notice, caught while still sliding in at 800 px and on iPhone SE (`captures/noise-auth-toast-*`). Once it settles, the pixels are 0.
- WebKit's Tab order differs only in the whitespace of the sort `<option>` texts (the albums screen of wave 5a), and Tab does not reach buttons there on either side.
- A console error on both sides and in both engines: «Worker Error: Unexpected token '<'…». A worker asks for JSON and gets the app's HTML. It comes from production, not from this branch; worth its own issue.

## What I could not see
- The real MusicKit and Apple's catalog; a real Spotify login.
- A signed-in person's data (Firestore is blocked; only the shell's signed-in look was checked).
- The bars in motion (motion was reduced).
- Safari on a Mac or on a real iPhone, and Dynamic Type (larger text was a root font of 130 %).
- **The album window:** my seeded store did not open it on either side, so it went unchecked; the page around it was equal.
- How the «Go» icon reads to a person: compared only as pixels, equal.

## Captures (`captures/`, 476 kB)
Representative crops of the branch: the bar; the panel signed in, «Checking…» and «Try again»; the bottom menu at 800, 899 and iPhone SE; the Menu sheet on iPhone 14 signed in; the bar on the home and in the app. Main's crop is saved only where it differs: P2-3 and the toast noise.
