---
type: visual-parity-recheck
feature: F80
branch: fix/f80-album-credit-album-only-and-aligned-button
judged_on: eddf38f
reference: main (c4c81d4)
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 3
---

# Entry page — album credit, direct addresses, «álbum», «Vire o lado»: independent recheck

**Verdict: pass.** The four requests of the owner (2026-11-23) are in the built page of the branch's tip; nothing else moved against main.

## How it was judged

- Both sides built by me from `git archive` (eddf38f and c4c81d4) through the machine queue (`machine_load.py run --label f80-judge2 -- node scripts/publication-budget.mjs --out …`, stand-in keys, real covers). Both inside the budget. The previous judge's main build was NOT reused: its source differed from c4c81d4.
- Served by an in-process local server (closed at the end). Playwright: WebKit 390x664 and 375x667 (iPhone profile), Chromium 1280x800; Portuguese and English; main and branch: 12 runs.
- Safety: every context aborted `music.apple.com`, `itunes.apple.com`, `geo.music.apple.com`, `open.spotify.com`, `accounts.spotify.com` before any page; no click, no navigation off 127.0.0.1; links judged by attribute. Requests attempted to those hosts: 0. Pages per context: 1.
- Files: `judge.mjs`, `analyze.mjs`, `measures.json`, `shots/` in this folder. Phone captures are crops of each story's top, never the full page.

## Results

| # | Check | Result |
|---|---|---|
| 1 | Credit text is the album's name only (5 stories, pt and en, 390 and 375) | pass — «The Dark Side of the Moon», «The Velvet Underground & Nico», «Dummy», «In the Aeroplane Over the Sea», «Desire, I Want to Turn Into You»; on main each carried « · artist». 13 px, 1 or 2 lines, not cut, under the record (x 16, w 172) |
| 1 | Button's left edge and width equal the visual panel above, within 1 px | pass — 390: panel x 202 w 172, button x 202 w 172; 375: panel x 202 w 157, button x 202 w 157; all five stories, both languages, difference 0 px (main: x 174.2/159.2, w 199.8) |
| 1 | Button one line, not clipped, at least 44 px high, text at least 12 px | pass — 44 px high, 12 px text (was 14), `white-space: nowrap`, scrollWidth = clientWidth (170/170, 155/155), icon 16x16; centre of the button hits the button; crops confirm |
| 1 | Credit does not run into the story's text | pass — credit's box ends 2 px after the next text's first ink line starts at most (box, not ink); the name's ink ends 12 to 20 px above the next text |
| 1 | Accessible name still says album and artist | pass — «Ouça no Apple Music: Dummy, Portishead (abre numa nova aba)» / «Listen on Apple Music: … (opens in a new tab)»; role link found; `target=_blank`, `rel=noopener`; no aria-hidden ancestor; tabindex 0 |
| 2 | The Dark Side of the Moon and Homogenic have direct album addresses | pass — `https://music.apple.com/us/album/the-dark-side-of-the-moon/1065973699` and `https://music.apple.com/us/album/homogenic/20833577`; all 15 Apple addresses of the page match `/us/album/<slug>/<number>`; main had 2 `/us/search?term=`. Attribute only: I did not open them, so that each number is the right album is NOT verified by me |
| 3 | No Portuguese text on the page says «disco(s)» | pass — 0 in visible text, aria-label, alt, title, meta content (main: 7); 0 in `public/js/i18n/pt` and `public/splash/copy.js` by grep |
| 4 | Title reads «Vire o lado» | pass — title «Vire o lado», control's name «Virar o lado»; English unchanged («Flip the record») |
| — | Computer layout equals main | pass — 427 boxes outside the credit, identical in English; in Portuguese 1 box differs: the title's text span 196 → 179.2 px wide (shorter words). Caption button box identical on the 7 stops; only the Dark Side address differs |
| — | Page height and section positions equal main | pass — 390 pt 4635, 390 en 4504, 375 pt 4674, 375 en 4605, 1280 pt 4578, 1280 en 4543, each equal to main; 8 sections, none moved. On the phone, in Portuguese, the title's box 138.7 → 128 px wide; nothing else |
| — | Console errors | pass — 0 on the 12 runs |
| — | Horizontal scroll | pass — scrollWidth = window at 375, 390, 1280 |

## Findings

- **P2-1 — the English button has little slack at 375.** «Listen on Apple Music»: icon 16 + gap 5 + label 124.4 = 145.4 px inside a 157 px button, 5.8 px to each border (Portuguese: 8.3 px). It fits and is not clipped; below 375 px, or with a wider font fallback, the one-line label would leave the box (`nowrap`). Out of the asked range (375 and up). Owner: builder, only if narrower phones enter the scope.
- **P2-2 — two links share one accessible name on the phone, already on main.** «Ouça no Apple Music: The Velvet Underground & Nico, …» resolves to 2 links at 390 and 375 (the story's button and the caption's `#am`), on main and on the branch alike. Not introduced here. Owner: whoever next touches the caption.
- **P2-3 — my own measure of "label lines" is not valid.** It counted the hidden screen-reader span «(abre numa nova aba)»; one line is established by nowrap, scrollWidth = clientWidth and the crops, and agrees with the builder's `boxes.txt` (label 119.5 / 124.4 px).

## What did not run

- No click on any Apple Music button and no visit to any Apple address (by the safety rule): the two new addresses are judged by shape only.
- No pixel diff; no WebKit at 393 (the builder's evidence has it); no real device; no other route than the entry page; no run with motion on (reduced motion in all runs).
- The unit suite was not run by me.
