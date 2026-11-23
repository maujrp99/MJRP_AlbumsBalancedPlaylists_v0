---
type: visual-parity-recheck
feature: F83
step: sync 3 (the lean Start on the phone in React)
branch: claude/f83-sync-3-start-lean
judged_on: 12f0234
reference: main at b8947e0
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 1
---

# The React Start screen matches the lean Start of `main` on the phone: recheck

**Verdict: pass.** On the built sites, the React Start screen (branch tip 12f0234) matched the hand-made lean Start of `main` (b8947e0) in every state I drove, on the iPhone 14 and iPhone SE in WebKit and on Chromium at 899 px. I compared text, boxes, bottom padding, focus and every pixel of the window: **0 pixels apart**. On the computer, the branch matched its parent (b143b4f) pixel for pixel in Chromium and WebKit, and matched `main` too, apart from residues the main-against-main control also shows. The one difference left on purpose (issue UAT-282) is real, and the React side is the right one. The two raised weight ceilings match my own build to the byte and are justified.

## How it was judged (independent of the builder's script)

- Three trees exported with `git archive` (`main` b8947e0, branch 12f0234, parent b143b4f) into `f83-sync3-recheck/{main,branch,parent}`, `node_modules` cloned (`cp -Rc`; the branch and parent use the React line's `node_modules`, whose lockfile hash matches). `vite build` for all three went through the machine queue (label `f83-sync3-judge`). `vite preview` servers ran outside the queue on ports 4611/4612/4613, plus one `vite` dev server of the branch on 4614 (used only for Portuguese). All four are stopped.
- Playwright 1.56.1 borrowed from `MJRPpersonal`. The Firebase hosts are blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`). The catalog is **my own** stand-in for MusicKit, not the builder's: a different artist (12 albums); «Fail…» makes it throw (catalog failed); any other text is not found; a hold switch freezes a search (searching). Covers are plain squares. Motion is asked off. Toasts are hidden on both sides with the same style (the "Authentication issue" toast comes from blocking Firebase).
- Each state opens three pages: the reference, the branch, and the reference again as the noise control. The noise control runs at the same moment as every comparison. A difference triggers a second photo after 1.5 s, and I report both photos. No tolerance is applied.
- Signed in = a non-anonymous user written to `firebaseLocalStorageDb` before load (the seam from wave lessons §14). Fake address, no password.
- Scripts: `scripts/common.mjs`, `scripts/start-parity.mjs`, `scripts/extras.mjs`, `scripts/repeat-typing.mjs`; results in `raw/`.

## Results

| run | states | branch vs reference | noise (ref vs ref) |
|---|---|---|---|
| WebKit iPhone 14 393×852, visitor, vs main | 15 | 0 px, facts equal | 0 |
| WebKit iPhone 14 393×852, signed in, vs main | 15 | 0 px, facts equal | 0 |
| WebKit iPhone SE 375×667, visitor, vs main | 15 | 0 px, facts equal | 0 |
| WebKit iPhone SE 375×667, signed in, vs main | 15 | 0 px, facts equal | 0 |
| Chromium 899×900 (phone layout), vs main | 15 | 0 px except «typing» 10 px, max 19/255 | the same 10 px in 2 of 5 repeats |
| Chromium 900×900 (computer layout), vs main | 10 | 0 px except «three chosen» 18 px and «last removed» 27 px, max 1/255 | 0 |
| Chromium 1280×900, vs main | 10 | ≤10 px, max 1/255 (chosen/removed); «typing» 4 px max 8 | «typing» 4 px max 8 (caret area) |
| Chromium 1280×900, vs parent b143b4f | 10 | **0 px** | 0 |
| WebKit 1280×900, visitor and signed in, vs main | 10 + 10 | 0 px | 0 |
| WebKit 1280×900, vs parent b143b4f | 10 | 0 px | 0 |

Phone states driven: first visit, typing, searching (held), results, three chosen, last album removed, paste, back from paste, not found, catalog failed, the «What is a series?» sheet open, sheet closed by its button, by the backdrop, by Escape, and the Menu sheet open. Computer: the same minus the sheets.

What the branch draws on the phone, checked as facts in every run:
- Title 26 px. «What is a series?» opens the sentence in the bottom sheet, and the sentence is not on the page.
- Under the field, only «or paste a list»: «Search an artist instead» in paste, nothing in not found. In catalog failed it keeps «or paste a list», the same as `main`.
- No three steps (`#homeHow` hidden).
- The bar is absent until the first cover. It appears with 3 chosen (bottom padding 148 px), and after the last removal only the undo strip is left, with padding back to 72 px.
- The visitor notice shows only when albums are chosen; it is absent with nothing chosen and for a signed-in person.
- The field says «Type an artist».
- No horizontal scroll in any state. No target under 44 px inside the Start screen, the sheet or the bar. The «What is a series?» button is 120×44 and «or paste a list» is 97×44.
- The bottom menu's five stops, the «Go» icon on Start included, are identical (both sides read `Start+icon|Albums+icon|Blend+icon|Playlists+icon|Inventory+icon`).

The 899/900 breakpoint holds. At 899 the phone layout is used (the «What is a series?» link and one link under the field); at 900 the computer layout is used. Both match `main`.

Focus return (keyboard: focus «What is a series?», Enter, then close), on WebKit iPhone 14 and Chromium 899, `main` and branch alike:
- Opening the sheet moves focus inside it.
- Closing by Escape, by the close button or by the backdrop removes the sheet and returns focus to «What is a series?».
- The Tab order from the top is identical on both sides.

UAT-282: in WebKit (393, 375, 1280), a mouse click on «Search» with the field focused gives `main` 0 covers and the branch 12 covers. In Chromium both give 12. **The React side is right**: a click on a visible «Search» button should search. `main`'s hand-made stage rewrites the button text between press and release, and WebKit then drops the click.

Portuguese (branch only: `main` has no Portuguese Start). The built site has no way to switch language, because `OPEN_LOCALES = ['en']` and nothing in the app calls `setLocale`. I therefore checked on the branch's **dev server**, with the preview mark (`mjrp.lang.preview=pt`) and `setLocale('pt')`, in WebKit at 393 and 375:
- The four new texts appear: «Digite um artista» (placeholder), «ou cole uma lista», «Buscar um artista» (paste state) and «O que é uma série?» (link and sheet title).
- The sheet carries the Portuguese sentence; not found, the notice and the bar are in Portuguese.
- No English is left on the Start screen, no element overflows, and there is no horizontal scroll. Captures: `captures/pt-phone375-*.png`, `captures/pt-phone393-*.png`.

Regression sweep (branch vs parent, built, with parent vs parent as noise), at Chromium 1280 full page and WebKit iPhone 14 full page:
- Screens: home, albums, saved playlists, inventory, playlists, blend, and the menu.
- WebKit phone: 0 px on every screen and on the Menu sheet. The home page differs about 12k px in both comparisons (animated entry page: the noise control shows the same).
- Chromium 1280: every screen differs from the parent by the same amount as parent against parent (animated parts below the fold, up to about 2k px), so these are noise. The menu shows 0 px.

Weight (my builds, without the keys, same `scripts/bundle-budget.mjs`):

| | parent b143b4f | branch 12f0234 | change |
|---|---|---|---|
| main script | 235,695 B | 235,748 B | +53 B (the 4 English texts) |
| downloaded after the first screen | 186,719 B | 187,136 B | +417 B (Start's lazy file 12,186 → 12,577 B, +391; the rest a few bytes) |
| first screen | 327,641 B | 327,701 B | +60 B |

My numbers equal the builder's to the byte. Both ceilings are justified:

- **Weight ceiling, `background` (49,000 → 49,500 B).** Checked against the parent's budget file, the branch build fails: «main script and what comes after … are over 422,437 B». The overshoot is 447 B, so a raise is necessary, and 500 B leaves 53 B of slack.
- **Weight ceiling, `main` (235,839 → 235,892 B).** The build without keys would still pass the old ceiling (235,748 B), but the publishable build with the keys adds about 144 B, which takes it to 235,892 B. Raising it follows the convention used since wave 2: the measured size plus 144 B.

## Findings

**P2-1: the builder's proof script hides small differences after a second photo.**
- **Where:** `reports/evidence/F83/sync-3/browser-proof.mjs`, the `inTheBar` rule.
- **Evidence:** the script takes a second photo whenever a difference is at most 4 of 255 anywhere on the screen, not only inside the top bar, and counts a clean second photo as a pass. A real low-contrast regression that settles after 1.5 s, such as a border or a 1-px offset of a dim line, would be reported as a pass. In my strict run (no tolerance, noise control running at the same time) no phone state needed it: every phone state was 0 px on the first photo. So the branch's result stands, but the evidence method is looser than it says.
- **Check:** in later waves, take the second photo only when the main-against-main control in the same round also shows a difference. Otherwise record the first-photo difference as a difference.

No P0 or P1.

Residues explained (not findings):
- Chromium 899 «typing», 10 px at max 19/255 at x 89–100, y 197–198 (the bottom edge of the search icon or the field ring): it appears identically in main against main in 2 of 5 repeats (`raw/repeat-typing.txt`).
- Chromium 1280 «typing», 4 px at max 8: it appears in main against main only (caret area).
- Chromium 900/1280 «chosen» and «removed», at most 1/255: the branch equals its parent at 1280, so this is a 1-level anti-aliasing difference already present in the React line before this step, not something this step brought.

## What I could not see

- The real MusicKit (developer token, Apple's catalog) and the real Firebase sign-in: both were stubbed, as in earlier waves.
- Portuguese on the built site: there is no way to switch language there; I checked it on the dev server only.
- Chromium 900 against the parent: not run. At 1280 the parent comparison was 0 px.
- The computer's account menu in the sweep: my selector may not have opened the top-bar account panel at 1280. That comparison was 0 px but may show the closed bar only. The phone Menu sheet was opened and compared (0 px vs parent, and 0 px vs `main` on the Start screen).
- A real iPhone and a real touch drag: I used WebKit with the iPhone profile only. Clicks, not touches, were used for the phone sheet and covers.
- Creating a series (the "created" bar) was not driven: it needs Firestore writes.
