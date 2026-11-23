---
type: visual-parity-recheck
feature: F80
branch: fix/f80-crate-caption-album-and-year
judged_on: 1d6f7d5 (final tip, judged as a delta over ce1d041); ce1d041 (full pass: commits 6bf79be, 481300b, ce1d041)
reference: main at 1755246
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 3
---

# Entry page — caption, story order on the phone, hero without the small line, hero button signed-in on the phone

**Verdict: pass.** The four requests are met on the phone (390 and 375, WebKit) and on the computer (1280, Chromium), in Portuguese and English, visitor and signed-in. No P0, no P1. Three P2, all present on `main` too (not caused by this branch).

## How it was judged

- Three builds made by me through the machine queue (`f80-judge3`), publication-shaped with stand-in keys (`scripts/publication-budget.mjs --out`), from `git archive` copies: `main` 1755246, branch ce1d041, branch 1d6f7d5. All three inside the budget. The older judge's build was NOT reused: its sources differ from 1755246.
- Served from a local server outside the queue (closed at the end; no server of mine is left). Playwright from MJRPpersonal. 24 runs main × ce1d041 and 24 runs ce1d041 × 1d6f7d5 (3 screens × 2 languages × visitor/signed-in × 2 sides). Signed-in = the stand-in account record in the page's own storage, as the builder did.
- Safety: `music.apple.com`, `itunes.apple.com`, `geo.music.apple.com`, `open.spotify.com`, `accounts.spotify.com` aborted in every context before any page loaded; requests attempted to them: 0. No click anywhere (only scroll, Tab / Alt+Tab focus, reads). No `open`, no `osascript`.
- Reduced motion was on in every context (stable measures). Screens looked at by eye: viewport clips only, none full-page at phone width.

## 1. Caption under the crate: album and year, no artist — PASS

- Phone and computer, both languages, both openings: the caption reads «The Velvet Underground & Nico» then «1967» on the next line (main: «… · The Velvet Underground & Nico · 1967»).
- Computer, as the record changes with the scroll: «The Dark Side of the Moon / 1973», «Dummy / 1994», «In the Aeroplane Over the Sea / 1998», «Desire, I Want to Turn Into You / 2023», «To Pimp a Butterfly / 2015» — album then year each time.
- All 15 albums of the crate written into the caption the way the page writes them (simulated in the page, then put back), at 390, 375 and 1280: 0 clipped, 0 over the button, 0 out of the screen; every year has 4 digits.
- Cover-credit line intact («Capa do Apple Music» / «Artwork from Apple Music», same box as main). Button intact: same text, size (199.8×44 pt, 205.9×44 en), colours, border, address, `target=_blank rel=noopener`; its accessible name still says album and artist («Ouça no Apple Music: The Velvet Underground & Nico, The Velvet Underground & Nico (abre numa nova aba)»).
- On the phone the caption got shorter (151 → 115 px for the first album).

## 2. Phone: each story opens with label → title → text, illustrations below — PASS

- All five stories, 390 and 375, both languages, both openings: DOM order and visual order are label, title, paragraph(s), (signed-in: the story's door link), then the illustrations block (cover, panel, album name, «Ouça no Apple Music»). No element overlaps the next. No CSS `order` left (all 0); no positive `tabindex`.
- Focus order by real keys (Alt+Tab in WebKit): top bar → bottom bar → hero button → per story [door link when signed-in] → its Apple Music button → next story. Matches the visual order inside every story.
- Separation between one story's button and the next story's label: 81 px (start→albums, albums→blend, playlists→inventory, with the divider line between); 44 px to the «flip» band after Blend and to the closing section after Inventory.
- First label now starts 836 px (pt) from the top, right after the caption (ends 799); on main it was at 1146.
- Phone page at ce1d041 is 28 px shorter than main (390, pt: 4635 → 4607): −36 the shorter caption, +50 the five stories (10 px each), −42 the removed line.

## 3. Small orange line of the hero removed — PASS

- 0 kicker elements in the hero (main: 2, one per opening); its text is nowhere in the page's text or attributes, both languages, both openings, three screens.
- No empty band: the title is the first thing in the hero, at the same distance from the hero's top as the removed line was (20 px on the phone).
- Phone: title up 42 px, hero 42 px shorter (340 → 298 pt, 303 → 261 en), everything below follows.
- Computer: title, subtitle, paragraph and buttons up **21 px** (the hero is centred in a fixed height of 692 px: half of the 42); hero height unchanged; **nothing below the hero moved**.
- The `h1` is still the title (one visible `h1` per opening: «Mergulhe nos álbuns que você ama.» / «Dig through the albums you love.», 36 px on the phone).

## Computer unchanged — PASS

- 1280, both languages, both openings, main × ce1d041: 457 boxes compared; the only differences are inside the hero (the removed line and the 21 px above). Every part of every story has the same box; page height equal (4578 pt, 4543 en, 4828 pt signed-in, 4758 en signed-in).
- ce1d041 × 1d6f7d5 at 1280: 0 of 455 boxes differ, both openings.

## 4. Delta 1d6f7d5: signed-in on the phone, no big «Criar» in the hero — PASS

- One CSS rule inside the phone block (`.hero .only-in .ctas{display:none}`).
- Signed-in phone (390, 375, pt, en): hero button gone; hero 48 px shorter (exactly the button); the crate comes up 48 px (starts at 306 pt / 269 en); 26 px between the orange subtitle and the crate — no empty band; everything below up 48 px; top bar «Criar» / «Create» present and focusable; bottom bar «Criar» present.
- Visitor phone: 0 boxes changed; «Abrir o app» / «Open the app» present, 358×48 at 390, a link (`a#app`, `href="/start"`), focusable. Not clicked.
- Computer: unchanged in both openings (signed-in still has its hero «Criar»).
- No console error, caption still album + year.

## Other checks

- Console errors: 0 in all 72 page loads. Hosts aborted other than the forbidden ones: none.
- «disco(s)» in Portuguese: 0 in text, 0 in attributes.
- Horizontal scroll, visitor: none (phone and computer).

## Findings

- **P2-1 (to open; same on main, ce1d041 and 1d6f7d5 — not from this branch).** Signed-in on the phone the page is wider than the screen: English 406 px on 390 and on 375; Portuguese 379 px on 375; Portuguese on 390 fits (390). The element: the top bar's «Criar / Create» button (`header .acct > a.btn.btn-primary.btn-sm.btn-start.only-in`), which starts at x 256.9 and ends at 378.8 (pt, 121.9 wide) or 405.8 (en, 148.9 wide). In English its equaliser icon sits past the screen at 375. Weight grew with the delta: on the phone, signed-in, this is now the only «Criar» of the first screen besides the bottom bar.
- **P2-2 (same on main).** On the phone the album's name in the caption has a 146 px column beside the 200 px button, so 4 of the 15 titles take 3 lines («The Velvet Underground & Nico», «In the Court of the Crimson King», «Power, Corruption & Lies», «In the Aeroplane Over the Sea»). Nothing is clipped; with the artist gone it is shorter than before.
- **P2-3 (not touched by this diff).** By keyboard, the caption's «Ouça no Apple Music» (at the top of the page on the phone) is reached only after the closing section's links, because the crate comes after the stories in the HTML.

## What did not run

- No click on any control (Apple Music by rule; the others not needed) — «working as a link» is by attribute and focus only.
- No run with motion on (reduced motion in every context), so the crate's caption changing by itself on the phone was not watched; on the phone the caption was read with the first album and simulated for the other 14.
- No real device, no Safari on iOS; no screen reader.
- The unit tests of the branch and the builder's proof scripts were not re-run; the builder's evidence was read, not relied on. His numbers match mine where they overlap (title up 42 / 21 px; 406 and 379 px).
- The preview channel was not opened.

## Files

Same folder: `judge.mjs`, `judge-tip.mjs`, `analyze.mjs`, `sum.mjs`, `sum-tip.mjs`, `measures.json`, `measures-tip.json`, `analysis.txt`, `shots/`, `shots-tip/`, `build-*.log`.
