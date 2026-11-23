---
type: visual-parity-recheck
feature: F80
branch: fix/f80-album-links-as-the-apple-music-button
judged_on: f448e5c
reference: main at 15cd7e2 (merge base)
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 2
---

# Album links as the Apple Music button — visual parity recheck (UAT-285)

**Verdict: pass.** Every album link on the entry page is now the one bordered button; nothing else on the page moved. Two cosmetic notes (P2), neither blocks.

## How it was judged

- Built sites reused from the stopped judge (`dist-main`, `dist-branch`): both build logs end «inside the budget»; the sources they were built from match `15cd7e2` and `f448e5c` byte for byte in `public/splash.html`, `public/splash/splash.js`, `crate3d.js`; the two builds differ only in the entry page's two scripts and `index.html`.
- My own script `judge2.mjs` (same folder). WebKit as iPhone 14 at 390, 393 and 375 px, Chromium at 1280 x 800, Portuguese and English, three runs each: main, main again (noise control), branch. 24 page runs + 12 sweep runs.
- Safety: every context aborts at the network layer all hosts except 127.0.0.1 and four static hosts (covers CDN, Google Fonts x2, jsdelivr); `music.apple.com`, `itunes.apple.com`, `geo.music.apple.com`, `open.spotify.com`, `accounts.spotify.com` and `music:`/`itms:`/`spotify:` are named explicitly. No click anywhere, no navigation off 127.0.0.1, `window.open` neutralised. Requests attempted to the forbidden hosts: **0**. Extra windows opened: 0. Local servers closed by the script.
- The stopped judge's `judge.mjs` was read and **not run**: it clicks every Apple Music button (with a local stub answering for music.apple.com). Its `shots/` folder was not used.

## Findings

| # | Sev | What | Evidence |
|---|-----|------|----------|
| 1 | P2 | At 375 px the longest credit («The Velvet Underground & Nico · The Velvet Underground & Nico», story Albums, PT and EN) takes 4 lines and sits glued to what is around it: its first line starts at the cover's lower edge and its last line ends about 3 px above the orange label «LADO A · 2 — ÁLBUNS». A person sees **no collision and no cut** — every letter is whole, nothing overlaps, no ellipsis — but the block reads cramped. Line boxes: credit 1591–1651, label box top 1651 (gap 0; ink about 3 px). At 390 and 393 px the same credit is 3 lines with 7.5 px of air. | `shots2/webkit-375-pt-branch-albums-credit.png`, `shots2/webkit-375-en-branch-albums-credit.png` |
| 2 | P2, not from this change | The button of the story «Criar» (The Dark Side of the Moon) points to an Apple Music **search** address, not an album address (`/us/search?term=Pink%20Floyd…`); same for Homogenic in the crate. Identical on main (`covers.js`), so outside this change; noted because the request says «the right album's address». | `judge2-results.txt` |

## The six checks

1. **One button everywhere — pass.** Phone: 6 visible album links (5 stories + the caption), all `class="am"`, identical markup (a copy of the caption's element), 44 px high (199.8 px wide PT, 205.9 EN), border 1px solid rgba(255,255,255,.62), radius 10px, 600 14px, no underline, icon 20x20 red gradient «♫» `aria-hidden`. No `.slot-am` is an `<a>` any more (on main: 5 underlined `a.slot-am`, 343x44). Computer: 1 link (the caption), unchanged.
2. **Album and artist readable beside the button — pass, with finding 1.** 12px/15px, colour #d6d6dc, left of the button, 14–29 px between text and button, button 16 px from the right edge. Lines: 1 to 3 at 390/393, up to 4 at 375; never clamped (`scrollHeight` = `clientHeight`), nothing on top of any line or of any button.
3. **Address, new tab, name — pass.** Each slot button's `href` equals its record's address in `covers.js` and main's href for the same story; `target="_blank"`, `rel="noopener"`; accessible name «Ouça no Apple Music: <album>, <artist> (abre numa nova aba)» / «Listen on Apple Music: … (opens in a new tab)», found by role in both engines; focusable. Addresses were read, never opened (finding 2 on one of them).
4. **Nothing else changed — pass.** Same 15 records and 5 slot covers in the same order; section boxes and page height identical (e.g. 390 PT 4635 → 4635, 375 EN 4605 → 4605, 1280 PT 4578 → 4578); every box outside the credits identical (386/386 phone, 427/427 computer); all text nodes identical. Pixels: phone top and caption 0 % or inside the control's noise; story blocks differ 2.1–3.6 % (the credit row only, expected); computer viewports 0.01–0.06 % against a control of 0.02–0.08 %; captions 0 %. Control main vs main: boxes, texts, heights identical.
5. **Console and width — pass.** 0 console errors on the entry page in all 8 branch runs (none on main either); no host blocked; `scrollWidth` = window at 375, 390, 393, 1280.
6. **`/start` and `/albums` — pass.** 390 WebKit and 1280 Chromium: same text, same boxes, 0 % pixel difference branch vs main; the only text difference is the «Last updated» clock, which also differs main vs main. The same 4 console errors on both sides (Firebase sign-in and a worker, because the judge blocks those hosts).

## The builder's proof script

`reports/evidence/F80/album-links-as-button/proof.mjs` (read, not run): it does **not** click or navigate to Apple Music or Spotify. It only goes to its own 127.0.0.1 server, aborts every host outside the same five-host list, and reads `href` from the DOM. It does not name the Apple hosts explicitly, but they fall under its abort-everything-else rule.

## What did not run

- No click on any button, so «opens in a new tab at the right page» is judged from `href`/`target`/`rel` only; whether the addresses resolve at Apple was not checked (forbidden).
- No real iPhone, no Safari proper (Playwright WebKit); no 320 px (outside the request); no full-page phone screenshots (by instruction); no rebuild (builds reused after checking); unit tests and the builder's proof not re-run.

## Files

- Before/after, phone 390 PT: `before-after-phone.png` (this folder)
- Measures and results: `judge2-measures.json`, `judge2-results.txt`; scripts `judge2.mjs`, `analyze.mjs`; screenshots `shots2/`
- Note: 8 «visible label» lines in `judge2-results.txt` read FAIL because my comparison did not expect the screen-reader-only « (abre numa nova aba)» inside the button (same markup as main's caption button); 4 sweep lines read FAIL on clock text and error order. Both were checked by hand and are not findings.
