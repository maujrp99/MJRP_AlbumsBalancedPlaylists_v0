---
type: visual-parity-recheck
feature: F83
step: wave 7a (the recipe pieces and the "generate again" panel in React)
branch: claude/f83-wave-7a-recipe-pieces
judged_on: fecfc69afe7175d449609f8d1ba2253b26bc56e9
reference: claude/f83-wave-7-blend-map at b29b552 (hand-made panel, equal to production)
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 1
---

# Wave 7a: independent visual parity recheck

**Verdict: pass.** On the built sites, the React "generate again" panel matches the hand-made panel of the parent. The match holds in all six profiles for the page elements, text, accessibility tree, the box of every element, focus, scroll, page width, slider, toasts and pictures. Every recorded generation configuration is identical. The hand-made Blend screen is unchanged. Every picture difference I saw also occurs when the parent is compared with itself.

## How it was judged

- **Builds.** I ran `git archive` on b29b552 and on fecfc69 into this folder, cloned `node_modules`, and ran `npx vite build` through the machine queue (label `f83-7a-judge`). The builds are reproducible: they produce the same hashes as the builder (`main-B_gJQaAL.js`, `main-DOOAiEHF.js`).
- **Script and server.** My own script is `judge.mjs`, not the builder's `browser-proof.mjs`. It uses Playwright 1.56.1, borrowed from MJRPpersonal, and its own static server. The server answers deep routes with `app.html` and serves `/` and `/home` with `index.html`, as the hosting does.
- **Blocked hosts.** Every host other than 127.0.0.1 is aborted: Firebase (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`), MusicKit, Spotify, fonts and covers. MusicKit and Spotify are therefore stubbed by absence, the same on both sides.
- **Fixed clock.** The clock is fixed: `toLocaleTimeString`, and from the second sweep run on, `toLocaleString`.
- **Waits and hidden areas.** Every comparison waits at least 1 s after the action, plus the end of all finite animations. The toast area and the footer clock are hidden in every picture. The part picture also hides what is fixed to the window.
- **What each step compares, old against new:**
  - the elements: tags, sorted attributes and classes, collapsed text, the value of each field
  - `innerText`
  - Playwright's `ariaSnapshot` (what a screen reader gets)
  - `getBoundingClientRect` of every element, to 0.01 px
  - the focus, `scrollY` and the page width
  - the toast texts and the "generating" overlay
  - the slider: the property, the attribute, `valueAsNumber` and the number shown beside it
  - two pixel diffs: the part, and the viewport
- **Configuration seam.** The same text is injected on both sides into the served `handleGenerate(config)` of the playlists controller chunk: `window.__cfgs.push(JSON.stringify(config))`. The repository is not touched.
- **Noise control.** I compared the parent with itself (old against old) for Chromium 1280 and 900, WebKit 1280 and SE, the Blend at Chromium 899, and both sweeps.

## Results

| Run | Steps | Equal comparisons | Only failures, and their class |
|---|---|---|---|
| Panel, Chromium 1280 (old vs new, 2 runs) | 44 | 301 of 302 / 302 of 302 | Run 1: icons of the export buttons, 61 px at most 26/255 (noise class N2) |
| Panel, Chromium 1280 (old vs old) | 44 | 302 of 302 | — |
| Panel, Chromium 900 (old vs new, 2 runs) | 44 | 301 of 302 / 301 of 302 | Run 1: 5 px at most 6/255, once. Run 2: export icons, 84 px at most 26/255 (N2) |
| Panel, Chromium 900 (old vs old, 2 runs) | 44 | 301 of 302 / 300 of 302 | **The same export-icon diff, 84 px at most 26/255** (N2) |
| Panel, Chromium 899 (phone, mouse) | 20 | 140 of 142 | `innerText` of the panel while it is closed and `display:none` (N4) |
| Panel, WebKit 1280 (old vs new, 2 runs) | 44 | 298 of 302 / 297 of 302 | The wordmark, 4,886 px at most 116/255 (N1). One toast-timing line in run 2 (N5) |
| Panel, WebKit 1280 (old vs old) | 44 | 302 of 302 | — |
| Panel, WebKit iPhone 14 (touch) | 20 | 140 of 142 | N4 |
| Panel, WebKit iPhone SE (touch, without the slider tap) | 19 | 131 of 133 (old vs new) / 133 of 133 (old vs old) | N4 |
| Hand-made Blend: Chromium 1280 / 899 / WebKit 1280 / iPhone 14 / SE | 11 / 12 / 11 / 12 / 12 | all equal (100, 109, 100, 109, 109) | — |
| Hand-made Blend, Chromium 899 (old vs old) | 12 | 106 of 109 | **Arc of the Disc ring, 36–38 px at most 41/255; viewport 48 px at most 1/255** (N3) |
| Sweep of 8 routes, Chromium 1280 and WebKit iPhone 14 (old vs new and old vs old) | 8 + 8 | see item 6 | Only N1, N5, N6 and N7; the old-vs-old runs show the same classes |
| What the first screen downloads, Chromium 1280 (`/`, `/start`, `/albums`) | 3 | 4 of 4 | — |

**Noise classes** (each one is shown on the parent compared with itself, or on both sides equally):

- **N1.** The WebKit wordmark JPG is drawn at a fractional width (181.2 px). It is drawn in one of two ways on each page load, and either way occurs on either side. In six separate loads of each side, the old/old, new/new and old/new pairs each came out both equal and 4,886 px apart (`probe-logo.mjs`).
- **N2.** The icons of the Apple Music and Spotify export buttons, below the panel, after the "no series" press. The parent compared with itself at 900 shows the same 84 px at most 26/255. In isolation, six loads were all equal (`probe-export.mjs`). It is intermittent and not caused by the branch.
- **N3.** The top arc of the Disc ring on the hand-made Blend, in a full-page capture at 899: Chromium rasterization. It also occurs when the parent is compared with itself.
- **N4.** `innerText` of an element whose display is `none` returns its raw `textContent`. The old template's white space differs from React's. Nothing is drawn, and the accessibility tree is equal in the same steps.
- **N5.** Toast timing.
- **N6.** The animated equalizer bars (`eqb`).
- **N7.** The splash page motion (inline `translate3d`).

## Findings

### P2-1: the weight ceilings leave no room for the keys of the publishable build

- **Where:** `scripts/bundle-budget.json` (`main` 214,066; `background` 56,400) and its `//` note.
- **Evidence, part 1:** my build without keys measures main 213,923 B and "after the first screen" 215,845 B, the same as the builder's.
  - The note says the `main` ceiling is "the measured value plus the 144 B of the keys". In fact 213,923 + 144 = 214,067, and the ceiling is 214,066 (+143).
  - The sum check is main + after-first-screen ≤ mainToday + reactVendor + background. With the new ceiling it is 429,768 ≤ 429,837: 69 B to spare without the keys.
  - The keys add 132 B to the main script (measured in wave 1) and 144 B by the note's own allowance. Either way, the publishable build would be 63–75 B over the `background` allowance, unless the check is only run without keys.
- **Evidence, part 2:** this convention predates 7a. Wave 6b's `background` of 53,600 against its need of 53,538 had the same gap.
- **What it changes:** nothing on screen. It could fail `bundle-budget` on the build that is published.
- **Check, yes or no:** does `node scripts/bundle-budget.mjs` pass on a build made with the `.env` keys? If not, either raise `background` by the keys' allowance (≈ 56,480) or say in the note that the sum is checked without keys. Fix "+144" to "+143", or raise `main` by 1 B.
- **Owner:** the builder or the orchestrator.

No P0 and no P1.

## What each requested point showed

1. **The panel on the playlists screen: equal.**
   - **Computer (Chromium 1280 and 900, WebKit 1280).** Covered: closed; open (on the recipe the playlists carry); each of the four recipes; Top 1, 7 and 10; the five groupings and three structures; the slider by keys (two Left, three Right, End, Home), by a mouse click at 75 % and by a mouse drag to 30 %; a button after the slider; Tab through 30 stops (identical order, and the cards are not tab stops on either side); shut and opened again; the "no series" failure; "generating" and its failure.
   - **Phone (Chromium 899, iPhone 14, SE).** Opened through `⋯ → Reconfigure and regenerate`; then each recipe, Top 6 / artist_rank / auto, balanced + bea, the slider by keys, a slider tap (899 and iPhone 14), asked again while open, shut by the header, asked again once shut, and the failure.
   - **Text, boxes and focus.** Elements, text, accessibility tree, boxes, focus, scroll, width, the slider and toasts are equal in every step. The toasts are "No series to take the albums from. Open the series first." and "None of the 2 albums could be loaded: Pink Floyd - The Wall (network error), Led Zeppelin - IV (network error)."
   - **"Generating" overlay.** After 0.4 s the overlay is up, with "Generating balanced playlists...", on both sides.
   - **Pictures.** Equal apart from N1, N2 and N4.
   - **Extra probe.** I also checked whether a panel that is made again on the phone, after `⋯`, makes the page jump (`probe-remount.mjs`, emptying and then refilling the list): it does not. Old and new are equal.
2. **The configuration handed to the generation: identical** in every recorded call, on every profile. That is 8 calls per computer run, 3 per phone run, and 1 from the "generating" flow. Examples from Chromium 1280:
   - opened: `{"algorithmId":"top-n-acclaimed","targetDuration":4500,"rankingId":"bea","outputMode":"multiple","groupingStrategy":"flat_ranked","trackCount":4}`
   - top-n-user, Top 10, shuffle, single: `{..."outputMode":"single","groupingStrategy":"shuffle","trackCount":10}`
   - slider −10: `targetDuration:3900`
   - after the mouse: `{"algorithmId":"mjrp-balanced-cascade","targetDuration":4500,"rankingId":"balanced","outputMode":"multiple","groupingStrategy":"shuffle","trackCount":10}`

   The defect the migration keeps (options hidden by the recipe still go to the generation) is the same on both sides.
3. **The hand-made Blend: unchanged.** All Blend runs are equal (computer 1280 Chromium and WebKit; phone 899, iPhone 14, SE). This covers: no choice, the series sheet on the phone, a series chosen, each recipe, Top 5, shuffle, multiple, source spotify, and the slider by keys. Its source files are untouched by the branch (no diff in `views/`, `components/blend/`, `controllers/`, `algorithms/`, CSS or `app.js`).
4. **The builder's two unrepeated differences: reproduced or explained** (`probe-settle.mjs`; four runs, pictures at 50, 150, 300, 600, 1000 and 2000 ms).
   - **WebKit iPhone SE, "opened by the sheet".** At 50 ms the sheet's closing animations (`sheet-fade-out` on the backdrop, `sheet-slide-out` on the panel) are still running under the blurred bottom bar. That frame differs from the settled one by 65,518 px, at most 94/255, in the bottom-bar band (0,1032–639,1135 device px). This is the builder's block: the bottom bar's backdrop blur over the card while the sheet leaves. By 150 ms every run is settled. Old against new is 0 px at every time, and the judge run with a 1 s wait is equal. **Cause: a picture taken before the sheet finished closing. It does not occur once the screen is settled.**
   - **Hand-made Blend at Chromium 899, "structure multiple".** Reproduced on the parent against itself: 36–38 px at most 41/255, on the top arc (30 × 10 px) of the Disc ring icon of "Choose Your Mix", in the full-page capture. **Cause: Chromium rasterization of that SVG ring. It is not caused by the branch (the Blend's code is unchanged).** In the timed probe, old against new is 0 at every time. The early frames (≤ 150 ms) differ from the settled one only by the buttons' 200 ms transition.
5. **`broken.ts` and the slider's `value` attribute: behaviour unchanged.**
   - The slider moves and reports its value by keys, by mouse click, by mouse drag and by touch tap. The property, `valueAsNumber` and the number beside it follow each move, and the configuration carries it.
   - The `value` attribute stays at the value it was drawn with, until the sections are drawn again. It behaves the same on both sides: for example, the attribute stays "65" while the property reads 80, 180, 30, 145 and 75. It becomes 75 after a button draws the sections again.
   - The accessibility tree is equal in every step on every profile, so the line breaks that `broken()` writes do not change what a screen reader gets.
6. **Other React screens: no regression.** I swept 8 routes (`/`, `/start`, `/home`, `/albums`, `/inventory`, `/saved-playlists`, `/playlists` empty, `/artists`) on Chromium 1280 and WebKit iPhone 14.
   - Old against new and old against old show the same classes only: N1, N5, N6 and N7, plus the stamp in the shell footer in the first run.
   - With the stamp fixed (run 2), elements, text and the accessibility tree are equal on every route except the animated splash.
7. **Weight: confirmed, and the first screen downloads the same files.**
   - The main script grew +844 B (213,079 → 213,923). The playlists screen file grew 10,340 → 12,216 B. "After the first screen" grew 213,896 → 215,845 B, and the measured need for `background` is 56,331 B. These match the builder's numbers.
   - The justification (the English texts in the main script; the hand-made pieces still there for the Blend) is consistent with the diff: only i18n, the models and the playlists screen are added, and `app.js` is not touched.
   - The first screen downloads nothing new: on `/`, `/start` and `/albums` the files requested, by name without hash, are the same set on both sides.
   - The margin of the ceilings is P2-1.

## What I could not see

- **A successful generation.** Albums come only from Apple Music, which is blocked. So I did not see the panel following new playlists, a real MusicKit session, or Spotify popularity.
- **On the iPhone SE, the slider tap step.** After a touch tap on the slider, the next scroll to "Regenerate" timed out on both sides alike (also old against old). The SE flow was rerun without that tap. A tap on the slider was covered on iPhone 14 and 899.
- **The Portuguese texts.** They sit behind the preview gate, so production shows English, and they await MJRP.
- **Others.** The 820 px phone width; iPhone 14 in Chromium; the publishable build with keys (I did not read `.env`).
- **The cause of N2.** Not pinned beyond intermittent icon raster: it is not reproducible in isolation, and it occurs on the parent against itself.

## Files (this folder)

- `judge.mjs`, `probe-settle.mjs`, `probe-remount.mjs`, `probe-export.mjs`, `probe-logo.mjs`, `px.mjs`
- `out/*.json`: one file per run, with the failures and samples (configurations, slider, toasts, Tab order)
- `budget-old.txt` and `budget-new.txt`
- `settle-se.txt` and `settle-blend899.txt`
- `captures/`: all files under 1 MB
  - `diff-*.png`: side-by-side crops of each picture difference (A on the left, B on the right)
  - `settle-se-new-150ms.png` and `settle-se-new-2000ms.png`
  - `settle-blend899-new-*.png`
- `old/` and `new/`: the archives and their builds

All servers were closed by the scripts and no job of mine is left running. Nothing in the repository was written or removed.
