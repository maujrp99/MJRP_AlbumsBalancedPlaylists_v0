---
type: visual-parity-recheck
feature: F96
branch: feat/f96-entry-page-on-the-phone
judged_on: bca8ea9 (the tip of feat/f96-entry-page-on-the-phone; compared with main 4e6495a for the computer)
reference: the owner's decisions of 2026-11-23 (docs/specs/features/F96-entry-page-in-swipes-on-the-phone/spec.md, the prototype on wip/f96-phone-home-prototype, and what he said on his iPhone about the step mark and the orange)
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 5
---

# F96 — the entry page on the phone: independent visual recheck (quick pass)

**Verdict: pass — 0 P0, 0 P1, 5 P2.** The phone page is what the owner decided: the crate on the diagonal with no big button, «Entrar» at the top, the bottom bar's «Criar» opening the app for a visitor, «Como funciona» in the strongest orange, every step with its label and link in the lighter orange and its text before the illustration, the line and the alternating bands from edge to edge, and the albums in one row at the end. Nothing scrolls sideways at 390 or 360, in either engine, visitor or signed in, in Portuguese or English. The computer page is the same as on `main`. The five P2 are small; three of them are older than this feature.

The owner already approved the page on his iPhone. This pass did not reopen his choices; it looked for defects.

## How it was judged

- The branch at `bca8ea9` and `main` at `4e6495a`, each built by me (`vite build`, real covers) and served with `vite preview` on ports 5496 and 5497, outside the machine queue; both stopped at the end. Built in my own worktree and in a throwaway copy of `main`; the builder's folder was only read.
- Playwright 1.63, Chromium and WebKit as a phone, 390×844 and 360×740, visitor and signed in, Portuguese and English: 16 runs. Signed in is the builder's stand-in record in the page's own storage (the key `gate.js` reads); no account, no password. Chromium at 1280×800 for the computer, before against after, four combinations.
- My own scripts, not the builder's: measures read from the page, the shelf driven by its two buttons, by the arrow keys and (Chromium) by a synthesized finger swipe, a Tab walk through the whole page from a fresh load.
- Safety: every context aborted the five music hosts, every scheme that is not http(s)/data/blob/about, and every host other than this machine, Apple's image CDN and Google Fonts (so production Firebase too). Requests attempted to a blocked host: 0. No link was clicked or opened: the Apple Music buttons were judged by href, target and rel. No app on the Mac was opened or controlled.

## What holds (measured)

| Check | Result |
|---|---|
| Sideways overflow | Page width equals the screen in all 16 runs (390/390, 360/360); a push to x=300 leaves the page at x=0; no element sticks out but the off-screen skip link and a decorative glow. The only sideways scroller is the shelf. |
| Console errors | 0 in 16 runs. |
| Landing | No big button shown in the opening (visitor and signed in). CSS crate with `--yaw:-30deg`, 8 sleeves, no 3D canvas, no request for the 3D library. Caption: «The Velvet Underground & Nico», «1967», and «Ouça no Apple Music» / «Listen on Apple Music» (`target=_blank`, `rel=noopener`, 200×44). |
| The way in | Visitor: «Entrar» at the top (`/start?signin`, 81×44); bottom bar «Criar» → `/start`, the other four stops scroll to their steps. Signed in: «Criar» at the top, the five stops go to the app's screens. |
| Section title | «Como funciona» / «How it works», `#f97316`, 28 px, contrast 7.06:1 on the page. |
| Step labels | «Lado A · 1 — Criar» … «Lado B · 2 — Inventário» (and «Side A · 1 — Create» … «Side B · 2 — Inventory»), numeral included and set large (30 px), all `#fb923c`: 8.74:1 on the page, 7.49:1 on the band. |
| Step links (signed in) | Same lighter orange, underlined, 8.74:1 / 7.49:1; each 358×44 (328×44 at 360). |
| Body text | `#b9b9c2`: 10.16:1 on the page, 8.70:1 on the band. Lowest text anywhere in a step: the ranking card's note, 6.7:1. All above AA (4.5:1). |
| Order in a step | Label, title, text, then the illustration, in all five steps, all runs. One illustration per step; no cover and no Apple Music button inside a step. |
| Step mark | Thin line above every step but the first; steps 2 and 4 on the band `#1c1c22`; the band runs 0 to 390 (0 to 360). The flip band stays neutral. |
| The shelf | One carousel, at the end: «Na caixa do The Album Blender» / «In The Album Blender's crate», 15 albums, 150 px covers, the next album's edge in sight (16 to 46 px). Every button: `https://music.apple.com/…`, `_blank`, `noopener`, 150×44. Arrows 44×44, 12 px apart. |
| Shelf by tap, key and finger | Each arrow tap and each arrow key moves one album (164 px); at the end «próximo» says `aria-disabled`, the last album ends 16 px inside the screen. A finger swipe (Chromium) moves the row and not the page; a vertical swipe or wheel over the row scrolls the page (no trap); a push past the row's end does not move the page. Tab enters the row, walks its 15 buttons, and leaves to the arrows. Nothing advances by itself (no timer in `shelf.js`). |
| Focus | Every one of the 34 (visitor) and 41 (signed in) Tab stops shows the 3 px amber outline, in both engines. |
| Bottom bar | Fixed, 76 px. At the end of the page the last line of the footer ends 40 px above it (728 against 768; 624 against 664). |
| Tap targets | Every link and button is at least 44 px high and wide, except the skip link (25 px high, off-screen until focused). |
| Texts | No «disco»/«discos» anywhere in the Portuguese page (text, labels, alt, meta); no «Blender» without «The Album»; no raw dictionary key; inventory verb «Catalogue» in both languages. |
| The computer (1280) | Before against after, 4 combinations: the same 228 (visitor) / 249 (signed in) drawn boxes, same position, size, colour, font and text; page height identical. Six screens of pixels each: identical but for 44 pixels inside one letter of one label (the number is now wrapped in its own element; not visible to the eye). The shelf is not shown there; «Como funciona» is there only for a screen reader, and the step titles went from second to third level under it. |

## Findings

### P2-1 — With a keyboard, the focused control can sit under the bottom bar

Walking the phone page by Tab, the page scrolls the focused control to the screen's bottom edge, where the fixed bar is. Measured at 390×844: «Gerar uma playlist» at 767–811 and the closing «Criar» / «Abrir o app» at 796–844, with the bar starting at 768; in WebKit the shelf's 15 buttons at 792–836 and its arrows at 800–844, wholly behind the bar. The outline is drawn but cannot be seen. The bar and its lack of a scroll margin are older than F96; the shelf's stops are new. It touches only someone using a keyboard at phone width, which is why it is P2. Fix: `scroll-padding-bottom` of the bar's height on the page. Owner: the builder.

### P2-2 — Signed in, the step link is before the illustration in four steps and after it in «Álbuns»

«Começar uma série», «Gerar uma playlist», «Ver suas playlists» and «Abrir o inventário» come right after the text; «Ver seus álbuns» comes after the ranking card. The owner's rule (text before the illustration) holds in all five; the link's place is just not the same. Owner: the builder.

### P2-3 — At 360 the first screen ends before the caption's year and button

At 360×740 the caption starts at 639 and the bar at 664: the album's name shows, the year and «Ouça no Apple Music» are one short scroll below. At 390×844 the whole caption is on the first screen. It is better than `main` (caption at 687). Noted because the spec's opening lists the caption and the button.

### P2-4 — At 360 the caption breaks the album's name with an ellipsis in the middle (older than F96)

«The Velvet / Undergrou… / & Nico»: the name's column is 116 px and «Underground» does not fit. The same box and the same break on `main`. At 390 it reads whole.

### P2-5 — The Tab order puts the crate's pause button and its Apple Music button after the page's close (older than F96)

They are at the top of the phone page and last in the document, so a keyboard reaches them after the closing button. Same structure on `main`.

## Observations, not counted

- **The shelf's caption is the album's name only** (two lines at most), with the artist in the button's hidden text; the year is in the crate's caption at the top. That is what the prototype's shelf showed. If «album and year» was meant for the shelf too, the year is missing there.
- **The test WebKit draws the crate flat**: the style says `--yaw:-30deg` and Chromium draws the diagonal, but Playwright's WebKit does not draw the turn. This is the test browser's limit, not a defect; the owner saw the diagonal on his iPhone.
- The shelf's covers load lazily in Chromium (12 of 15 before the row is reached) and are all drawn once it is on screen.

## What I could not verify

- A real iPhone: Safari's own 3D drawing, its edge gesture beside the shelf, what fits with its toolbars. The owner's look covers this.
- A finger swipe in WebKit (the synthesized swipe exists only in Chromium); in WebKit the row was driven by its buttons and keys, and its scroll style was read.
- A screen reader's reading of the page.
- The page without script and with less motion asked, on the phone: the builder's evidence covers them; I did not rerun them.
- 375×667 (the spec names it; the request named 390 and 360).
- Where the links leave to: never opened, judged by address only. Signed in was a stand-in record, never a real account.
