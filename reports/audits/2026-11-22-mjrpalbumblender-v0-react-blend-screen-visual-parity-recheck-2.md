---
type: visual-parity-recheck
feature: F83
step: wave 7b (the Blend screen in React)
branch: claude/f83-wave-7b-fix-scroll-and-weight
judged_on: ac12998
reference: ace99a9 (the branch's merge commit: hand-made Blend, equal to production)
judge: independent (did not build)
date: 2026-11-22
previous: fail at 160c702 (2 P1)
verdict: pass
p0: 0
p1: 0
p2: 1
---

# The Blend screen in React: second recheck, after the fixes (F83, wave 7b)

**Verdict: pass. No P0, no P1, one P2.**

- **Both P1s are fixed.**
  - P1-1, the page jump, is gone on every Chromium profile.
  - P1-2, the weight: a build shaped like the published one now passes, with room to spare.
- **P2-1 (the fade) is fixed**, and P2-3 (the extra early file) is fixed.
- **P2-2 is declared as on purpose,** in the proof and in a test.
- **The remaining pixels are leftover paint.** When the box involved is painted again fresh, the two sides are identical, so nothing is really drawn differently.
- **New P2:** one stale code comment.

## How

This pass works the same way as the first:

- **Sides:** the fixed side is ac12998, from `git archive` into `pass2/new`, with `vite build` run through the machine queue. The parent build is the one from the first pass (`old`, ace99a9).
- **Serving and blocking:** my own static server answers deep routes. Firebase and every external host are blocked, and MusicKit and Spotify are stubbed out.
- **Fixed inputs:** the footer clock is frozen, `Math.random` is seeded, and the album dataset is a fixture with local covers.
- **Generation:** the same seam as before on both sides.
- **Pictures:** page by page, never full-page, with toasts and the clock hidden.

The harness is `pass2/judge.mjs`, a copy of the first pass's, and the probes are `pass2/probe-*.mjs`.

## Findings

### P2-1 (new): the comment in `app.js` names the wrong file for `window.playlistsStore`

- **Where:** `public/js/app.js:218` says `window.playlistsStore` "is exposed by stores/playlists.js itself". It is set in `controllers/BlendingController.js:28`.
- **Effect:**
  - Nothing in the app reads `window.playlistsStore`. Only `docs/manual/*` mentions it, for console use.
  - It now appears only once the shared controller file loads. That happens with the playlists or Blend screen, or the background prefetch about 30–50 ms after the first screen. My sweep found it set in time.
- **Check:** does the comment name the right file?

## The six points

### 1. P1-1, the page jump: fixed, and the fix is sound

The same scroll trace as in the first pass (`PART=scroll2`). With the page scrolled to its end, I pressed Single, Multiple, Auto, a grouping, Top 5 and Top 10, and Single again with the failure panel showing. A mouse click gives the button the focus. Old and new now give identical sequences on:

- Chromium 1280 and 900;
- Chromium 899;
- the Chromium iPhone 14 profile (the phone variant is gone too);
- WebKit 1280.

Example at 1280: after By Album, `scrollY` is 1439 on both sides. In the first pass it was 1209 on the new side.

Why it holds: step 4's `<section>` now stays on the page with `key="ready"`, and only a `Fragment key={draws}` inside it is made again. The section is never missing when Chromium lays the page out after the focused button is removed.

- Going from `locked` to `ready` still swaps the section, but only on a recipe choice, as the parent did.
- `Blend.remount.test.tsx` holds the section in place for both an ingredient button and a recipe choice.

### 2. P1-2, the weight: a real publication would pass

I ran `node scripts/publication-budget.mjs --out pass2/new/dist-publication` through the queue:

- main 195,050 against a ceiling of 195,210;
- main plus after-first-screen 431,386 against a cap of 431,587;
- result: "inside the budget, with the margin" (exit 0).

I also checked it with my own random stand-ins, held only in the environment, passed to `bundle-budget.mjs`:

| build (ac12998) | main | main + after the first screen (cap 431,587) | result |
|---|---|---|---|
| no keys | 194,859 | 431,262 | inside |
| Spotify 32 hex, PostHog `phc_`+43, host 24 | 195,056 | 431,451 | inside: 154 B under the main ceiling, 136 B under the cap |
| the same, plus `VITE_SPLASH_COVERS=real` and `VITE_USAGE_MEASUREMENT=on` | 195,080 | 431,440 | inside: 130 B and 147 B |

- **Are the stand-in lengths plausible?**
  - A Spotify client id is 32 hex characters.
  - A PostHog project key is `phc_` plus 43 characters.
  - The host is `https://eu.i.posthog.com` (24 characters). The US host is the same length, and an empty host is shorter.
  - Random values do not compress, which is how real keys behave.
- **What else is inlined:**
  - It is true that every `VITE_*` value is inlined: `usageWiring` takes all of `import.meta.env`.
  - The builder's stand-ins leave out `VITE_SPLASH_COVERS` and `VITE_USAGE_MEASUREMENT` when the `.env` sets them. Together they measured +24 B on the main script, inside the 150 B margin.
  - I cannot see whether the `.env` holds any other `VITE_*` name, because I did not read it. Each extra value would cost roughly its length in bytes.
- **The Firebase web configuration:** it is not "only a copied file". `index.html` loads `/js/firebase-config.js` as a module, so it is bundled into the main script. That file is committed and identical in every build, so it is already inside every measurement, with keys or without. The copy to `dist/js` is a second, separate use. There is no gap in the weight.
- **The builder's unit test** (`test/scripts/publicationBudget.test.js`): I read it but did not run it.

### 3. P2-1: the fade is gone; the remaining pixels are leftover paint, and nothing is really drawn differently

**The fade.** `probe-fade.mjs`, one frame after each choice, in Chromium and WebKit: the new side now runs no transition at all, the same as the parent. Only the header equalizer runs.

**The remaining pixels.** Chromium only, at most 7/255.

- **1280:** 12 px at most 6/255, from the second recipe choice on (`blend-chromium-1280`). They sit at the bottom-left corner of the recipe section, a glass panel that React keeps.
- **899:** 10 px at most 7/255, at the top-right corner of the stepper's box (`blend-chromium-899`).
- **900:** a band of 14,400 px at most 3/255 across one glass panel, from the second recipe choice on (`blend-chromium-900`). It was not there in the first pass. It probably comes from keeping step 4's section, which is the P1-1 fix.
  - At 900, scrolled to 1600 px, after a series and two recipes, the probe reproduces it: 14,400 px at most 3/255, with old against old 0.
  - On the new side only, a transparent outline on each section for one frame gives **0**, and so does switching the backdrop blur off and on again.
  - The DOM made again gives 0.
  - So this is the same leftover backdrop paint on a panel React keeps.

What clears them (`probe-cause.mjs`; old against old is always 0):

| 1280, at the builder's 1280 × 3200, after a series and three recipes | old against new |
|---|---|
| as it is | 12 px at most 6/255, at x 149–158, y 989–994: the recipe section, 682–995 |
| no transitions / no animations / no transitions on the cards | unchanged |
| the backdrop blur switched off for one frame then on again, **new side only** | **0** |
| a transparent outline on each section for one frame, **new side only** (forces a fresh paint) | **0** |
| the backdrop blur switched off and on, old side only | unchanged |
| the DOM made again as the parent did | 0 |
| `transform` on `body` for two frames, both sides | unchanged |

| 899, phone, the page at the top | old against new |
|---|---|
| as it is | 10 px at most 7/255, at x 874–878, y 126–129: the stepper's box (`.blend-stepper`) |
| a transparent outline on the stepper for one frame, **new side only** | unchanged |
| the same, **old side only** | **0** |
| the DOM made again | 0 |

- **What this means:** these are pixels of a box that Chromium painted again only in part: the backdrop of a kept glass panel at 1280 and 900, and the stepper box that the parent left partly stale at 899.
- **Proof:** once the box is painted again fresh, on whichever side holds the stale paint, the two sides are pixel-identical. So the correct drawing is the same on both sides.
- **The builder's account holds:** it is the same on the unfixed build, and a fresh paint clears it. Note that a `transform` on `body` did not clear it in my run; a fresh paint of the box itself does.
- **Can a person see it?** No: at most 7/255 on a corner edge, or at most 3/255 across the 900 band, and it is gone at the next repaint of that box.
- **Capture:** `pass2/captures/899-remaining-old-left-new-right.png`.

### 4. P2-3, the first screen: fixed. The four files are background prefetch; one of them is shared code of the albums screen

- **`playlists-*.js` is gone:** it is no longer requested at start on `/start` or `/albums`.
- **Timing, measured** on the same clock as the page (`probe-first.mjs`, `performance.now`):

| first screen | screen drawn | the four files start |
|---|---|---|
| `/start` | 65–67 ms | `useFocusLikeAfterAnewDraw` 74–82, then `AlbumCascade` and `batchNaming` 84–93, then `BlendingController` 88–96 |
| `/albums` | 76–79 ms | `AlbumCascade`, `batchNaming` and `BlendingController` 94–98 |

- **On `/start`:** all four come after the screen is drawn. That is the idle prefetch, as for the other screens.
- **On `/albums` (and `/inventory`):** `useFocusLikeAfterAnewDraw-*.js` (435 B) starts at 67–71 ms, before the screen is drawn.
  - It is a static import of the albums and inventory screen files. The bundler split it into its own file because the Blend shares it.
  - It comes in the same parallel batch as that screen's other pieces (`filterUse`, `windowLayer` and the rest), so it adds no round trip: the screen was drawn at 76–79 ms against 77 ms on the parent.
  - So the builder's "fetched about 30 ms after load by the prefetch" is not exact for this one file, but it does not delay the first screen.
- **`window.playlistsStore`:** nothing in the app needed it earlier (see the new P2-1 for the comment).

### 5. P2-2: declared

- **Proof:** stated in `reports/evidence/F83/wave-7b/proof.md`, section "Duas diferenças de propósito", and in `fix-scroll-and-weight/proof.md` (§ P2-2). It is also in `wave-lessons.md` §20.
- **Test:** `Blend.remount.test.tsx`, "P2-2 (on purpose): choosing a series keeps the scroll of the list where it was".
- **Browser:** both declared differences still show, and nothing else does (`many-chromium-1280`, `covers-chromium-1280`).
  - The list scroll is kept: 295 against 0 after m9, and 7 against 0 after Enter or Space.
  - When the covers arrive, the focus stays on the card (old: `body`) and the list stays at 100 (old: 0).

### 6. Full state sets, hand-over and sweep: nothing else moved

**Blend runs:**

| run | steps | difference |
|---|---|---|
| Chromium 1280 | 33 | none, apart from the pixels in point 3 and the 1/255 noise lines on the slider row seen in the first pass's old-against-old run |
| Chromium 900 | 33 | the band in point 3 (at most 3/255), 3 px at most 2/255 at one corner, and the slider-row noise |
| Chromium 899 | 37 | the pixels in point 3 only |
| Chromium iPhone 14 profile | 35 | none |
| WebKit 1280 | 33 | none |
| WebKit iPhone 14 | 35 | 1/255 over large areas, the WebKit noise also seen in the first pass's old-against-old run |

- **Equal on every step:** elements, text, the accessibility tree, all boxes (except the rotating spinner), focus, scroll, toasts, Tab order and the configurations handed to the generation.
- **Spinner boxes:** they still differ, because the spinner rotates, on both sides and in the old-against-old runs too.
- **Phone flow:** it could not reach its success step on either side. The real-path generation was still running, as in the first pass, so `tap2` covers that step.
- **Hand-over after a successful generation:** the same on both sides. The notice toast, then "Generated 1 playlist(s)!", then `/playlists?seriesId=bs1`, and the playlists screen is equal.
- **Phone bar button** (`tap2`, WebKit iPhone 14): a tap that fails, then a second tap, each make one generation; two quick taps make one generation; the focus is `body`; `:hover` is as in the parent.
- **Sweep:**
  - Chromium 1280 (`/start`, `/albums`, `/inventory`, `/saved-playlists`, `/artists`, the playlists screen with a set and its panel to generate again, through to the regenerated set): equal. One 35 px at most 2/255 in the top bar, as in the first pass.
  - WebKit iPhone 14: equal, apart from the animated logo (129/255), which the old-against-old run also shows.

## What I could not see

- The real `.env`: whether it holds other `VITE_*` names, and the true lengths of the keys.
- The builder's unit tests: read, not run.
- Real MusicKit, Spotify and a signed-in account.
- Chromium with the iPhone SE profile, and WebKit SE in this pass.
- A real phone, and Safari on a Mac.

## Files

All under `pass2/`:

- **Scripts:** `build.sh`, `batchA.sh`, `batchB.sh`, `judge.mjs`, `probe-cause.mjs`, `probe-fade.mjs`, `probe-first.mjs`, `sum.mjs`, `sbs.mjs`.
- **Weight:** `publication-budget.txt`, and `budget-{dist,dist-keys,dist-keys-all}.txt`.
- **Results:** `out/*.json` and `out/log-*.txt`.
- **Captures:** `captures/899-remaining-old-left-new-right.png`.

Nothing in the repository was written or removed, and none of my servers or jobs is still running.
