---
type: visual-parity-recheck
feature: F80
branch: fix/f80-crate-caption-album-and-year
judged_on: 73f3bf8 (final tip, judged as a delta over 1d6f7d5; commits ceb1fdd, 4d96cde, 28dc655, 7715ba8, 79e2640, 803dd18, 73f3bf8)
reference: the same branch at 1d6f7d5 (judged in the first report against main 1755246)
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 4
---

# Entry page, second pass — the name in full, «Catalogue», the 3D crate on the computer

**Verdict: pass.** Nothing blocks. Four P2: one new and real (the app's phone header cuts the longer name), one typographic, one at the limit of the crate's own rule, one carried from the first report.

## How it was judged

- A fourth build made by me through the machine queue (`f80-judge3`), publication-shaped with stand-in keys, from `git archive 73f3bf8`; inside the budget. Compared with my build of 1d6f7d5 from the first pass.
- Local server outside the queue, closed at the end. Playwright from MJRPpersonal.
- Safety: the five music hosts aborted by name in every context before any page loaded; requests attempted to them: 0. **No click anywhere** (scroll and reads only). No `open`, no `osascript`.
- The builder's `reports/evidence/F80/crate-animation-break/proof.mjs` was read and NOT re-run: it opens no music address, but it clicks the page's own menu and pause icon. I wrote my own reader of the three.js scene (same way in: the 3D library handed back with a few lines that remember the scene and the camera), which only scrolls.

## (a) The product's name in full

**Entry page — pass.** «…The Album Blender monta a série.» / «…The Album Blender builds the series.» and «…The Album Blender pega faixas…» / «…draws from every album…» are on the page, phone and computer, both openings. No «Blender» alone is left in the page's text.

**App's phone header — the longer name does not fit (P2-1).**
- Where it shows: in none of the screens at rest. `/start`, `/albums`, `/blend`, `/playlists`, `/saved-playlists`, `/inventory` each show their own name («Create», «Albums», «Blend», «New…», «Playlists», «Inventory»). The name is the header's fallback, and it shows **in passing**, while an address with no screen name is being sent to `/start`: seen on `/callback` (the return from the Spotify sign-in) and on an unknown address, at 390 and 375, visitor and signed-in.
- Fit, measured with the name written into the header's own title element: the title has 173 px at 390 and 158 px at 375; «The Album Blender» needs 177 px (17 px, bold). It is cut with an ellipsis at both widths — «The Album Blen…» at 375, by 4 px at 390. The old «Album Blender» (138 px) fitted.
- It stays on one line and pushes nothing: the logo (16–149) and the menu button (342–386 at 390, 327–371 at 375) do not move; the page does not get wider.
- Same result signed-in and visitor. The app rendered in English in every context I opened (also with the Portuguese locale); the name is the same text in both languages, so the measure holds.

## (b) The Inventory sentence — pass

- «Catalogue as mídias físicas da sua estante.» / «Catalogue the physical media on your shelf.»; no «Conte» / «Count» left.
- Line breaks of the title:
  - 390 pt: Catalogue / as mídias / físicas da / sua estante.
  - 375 pt: the same four lines.
  - 1280 pt: the same four lines.
  - 390 en: Catalogue the / physical media / on your shelf.
  - 375 en and 1280 en: Catalogue / the physical / media on / your shelf.
- The title's box is the same size as before at every width (the old sentence took the same number of lines).
- Link-preview description (`og:description`): 121 characters in Portuguese, 120 in English — under 130. The page's `description` meta (155 / 159) was not changed by this delta.

## (c) The 3D crate on the computer — pass

Chromium and WebKit, 1280×900, motion on, each part of the page reached by scroll, down and then up (16 stops per engine and build), the scene read once it had settled.

- **No cover in the wood at rest.** Before (1d6f7d5): 8 of 16 stops had covers inside a wall — the two nearest the wall 0.036 and 0.032 deep in the front wall on «Criar» and «Blend», the same in the back wall on «Playlists» and «Inventário». After (73f3bf8): 0 of 16 stops, both engines; no two covers cross each other; every stop settled.
- The flipped covers now lean in a fan (0.25, 0.34, 0.43, 0.51, 0.59 rad on «Blend») instead of all at 0.62; the lifted cover is the right one on every part.
- **The caption still changes with the crate**, album then year: The Velvet Underground & Nico / 1967 → The Dark Side of the Moon / 1973 → (Álbuns) The Velvet Underground & Nico / 1967 → Dummy / 1994 → In the Aeroplane Over the Sea / 1998 → Desire, I Want to Turn Into You / 2023 → To Pimp a Butterfly / 2015; the same going back up. The button is never hidden.
- **What the closer camera changes on the first screen** (the crate's wood on the screen, left, top → right, bottom):
  - Chromium: 677, 399 → 1239, 783 (561 × 383) before; 653, 397 → 1234, 793 (581 × 396) after. About 3.5 % larger, its left edge 24 px further left, its bottom 11 px lower.
  - WebKit: 687, 398 → 1265, 795 (579 × 397) before; 668, 398 → 1250, 795 (582 × 397) after. Same size, 18 px to the left.
  - Before, the two browsers framed the crate differently; now the camera is in the same place in both.
  - Nothing is cut: with the covers, the smallest space to the canvas edge is 43 px (top, the lifted cover on «Blend»), 48 px left, 51 px right, 64 px bottom.
- Half turned (the «flip» band) the crate is clearly larger than before: 459 × 210 → 595 × 272 in Chromium.
- No page or console error; no host blocked.
- **The phone's crate is untouched**: the page never loads the 3D on the phone, and every box of the phone page equals 1d6f7d5 (below).

## (d) Nothing else moved — pass

Entry page, 1d6f7d5 × 73f3bf8, 390 and 375 (WebKit), 1280 (Chromium), Portuguese and English, visitor and signed-in (reduced motion, as in the first pass):

- Page height equal in all 12 pairs; every section at the same place and height.
- 0 boxes differ in 8 pairs. In the 4 signed-in phone pairs, 8 entries differ in name only (four cover slots read once with and once without their «loading» class) — same place, same size.
- The longer sentences take the same number of lines as the old ones, so nothing below them moved.
- 0 console errors; no «disco(s)» in Portuguese; the caption is still album + year; no horizontal scroll for the visitor.

## Findings

- **P2-1 (new, from `shell.phone.appName`).** In the app on the phone, the header cuts the name to «The Album Blen…»: it needs 177 px and has 173 px at 390, 158 px at 375. It shows only in passing (while `/callback` or an unknown address goes to `/start`); one line, no button pushed.
- **P2-2 (new, typographic).** At 1280 the name breaks after «The» in the «Criar» paragraph, both languages: «…quer ouvir. The / Album Blender monta a série.» On the phone the name stays whole.
- **P2-3 (at the limit, not visible).** On «Blend» the deepest reading of a cover in the wood at rest is 0.010 (the crate's floor, under the flipped covers) — exactly the limit the builder's own rule allows (0.01; a cover is 2.3 wide). It was 0.036 through the front wall before.
- **P2-4 (carried, unchanged).** Signed-in on the phone the page is still wider than the screen (406 px in English at 390 and 375, 379 px in Portuguese at 375): the top bar's «Criar / Create» button. Same as main; see the first report.

## What did not run

- The crate **while it moves** (frame by frame through the turn, the jumps, the wheel): only the rest states were read, including one half-turned. «The turn crosses smoothly» is therefore not confirmed by me.
- The builder's proof script and the branch's unit tests were not re-run.
- No click anywhere, so the page's menu, the pause icon and the app's menu were not exercised.
- The app in Portuguese (it rendered in English in every context); no screen of the app shows the name at rest, so its fit was measured by writing it into the title's element.
- 1440 wide, real devices, iOS Safari, screen reader, the preview channel.

## Files

Same folder as the first report: `judge-final.mjs`, `sum-final.mjs`, `crate3d-judge.mjs`, `app-header.mjs`, `extra.mjs`, `lib2.mjs`, `measures-final.json`, `measures-3d.json`, `measures-app.json`, `sum-final.txt`, `out-3d.txt`, `out-app.txt`, `shots-final/`, `shots-3d/`, `shots-app/`, `build-final.log`.
