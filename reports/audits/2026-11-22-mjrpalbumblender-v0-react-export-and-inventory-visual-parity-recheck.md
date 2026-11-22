---
type: visual-parity-recheck
feature: F83
step: sync 2 (export from saved playlists in React; inventory changes carried)
branch: claude/f83-sync-2-export-and-inventory-changes
judged_on: 693cb97 (code; docs tip 88e6b60)
reference: main at 9ff2141
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 3
---

# The export window and the inventory in React, against `main` — independent recheck

**Verdict: pass.** On the built sites, the saved-playlists screen and the playlists edit screen open the same export window as `main`, in every state, on computer and phone, with the same DOM, focus, notices and calls to Apple Music. The inventory is pixel-equal at 393, 820 and 1280. Three small things remain, none visible to the eye.

## How it was judged

- Three trees exported with `git archive` into this folder (`new` = 693cb97, `main` = 9ff2141, `integ` = a488bca; plus `merge` = 53ef3a6 for the weight split). Each built with `vite build` (builds through the machine queue). `vite preview` of `main` on two ports (5301, 5303, for the main-vs-main noise control) and of the branch (5302).
- Playwright 1.56.1 borrowed from `MJRPpersonal`. Chromium at 1280, 900 and 899; WebKit computer, iPhone 14, iPhone SE. Firebase hosts blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`); Spotify hosts blocked; MusicKit replaced by a stand-in (token route and `musickit.js`) with five library modes: folders, none, error, slow (never answers = loading), many (23 folders served 10 per page with `next`, so the app's paging is exercised); and two export outcomes: refused (failed) and hanging (exporting).
- Each step was done on both sides in step; after it: the window's DOM (radios compared by state), the focus, the notices, what MusicKit was asked, other open windows, the order of the destinations, the pixels of the window, and on the phone every button/row in the window measured for 44 px.
- Scripts: `js/export.mjs`, `js/screens.mjs`, `js/drag.mjs`, `js/radio*.mjs`; raw results in `raw/`, logs in `logs/`.
- Note on the queue: midway the coordinator asked that Playwright runs leave the queue; the remaining runs (edit screen on iPhone SE, 899, 900; drag; inventory; sweep) ran outside it. Only builds used the queue.

## 6. Saved playlists on the built site — proven, not left unproven

The builder said the saved-playlists store «is not exposed in the build». It is reachable: the store and its reader live in the screen's lazy file (`index-*.js` on the branch, `SavedPlaylistsView-*.js` on `main`). The judge served that same built file with one line appended (`window.__saved = {store, reader}`, the minified names found by the class's own constructor text), stubbed the reader's network calls, and seeded one series («Plant», batch «Sunday mix», three playlists) through the store's own `begin` / `setSeries` / `flush`. Same seam on both sides. Everything below on `/saved-playlists` ran on the built sites. (The script's «data seeded» line reads false on the phone only because the batch is folded; the steps that open it passed on both sides.)

## Results by item

1. **`/saved-playlists`, export window** — equal to `main` in Chromium 1280 / 900 / 899, WebKit computer, iPhone 14, iPhone SE:
   - entry points: «Export batch …» and «Export Playlist …» (computer); the share button beside a playlist and the «Export» row of the batch sheet (phone);
   - destinations in the order **Apple Music, Spotify, file** on every profile;
   - folder step: folders, none, error, loading, 23 folders all listed (paged API), the list scrolled to the end; new folder with no name asks for it and focuses the field; remembered choice («Favorites») on reopening; exporting (button text «Exporting 1. …», disabled); done (notice «1 playlist exported to Apple Music, in the folder "Favorites".»); failed;
   - closing by Escape, backdrop and the close button, each giving the focus back to the opener; Tab stays inside;
   - Spotify gives way the same; the file is named the same (`playlists_Sunday mix_2026-11-22.json`);
   - phone: no control under 44 px, on either side.
   - Noise seen in both branch and control: a notice that lingers on one side a moment longer, and the console errors of the «refused» mode.
2. **Playlists edit screen** — the same window (computer: straight to the folder step from «Apple Music»; phone: from «Export»), equal on every profile, all states.
3. **Inventory in the React shell** — list and gallery at 1280 (Chromium), 820 (Chromium) and 393 (WebKit iPhone 14): DOM of `#app` equal, visible text equal, value lines equal, **0 pixels apart** (control 0 too). Captures: `captures/inventory-*-branch.png`.
4. **Row lit after a mouse drop (WebKit)** — on the built edit screen, a real mouse drag of row «One» to the third place: the branch leaves **no** row lit, after the drop and after the mouse moves. `main` still leaves the old place («Two») lit in WebKit after the mouse moves (the Safari defect the branch fixed). The order after the drop is the same on both. This is a deliberate improvement over `main`, not a parity break; `main` keeps the defect.
5. **Regression sweep** (home, Start, albums empty, saved playlists empty, inventory empty, the open menu; six profiles): all pixel-equal to `main`, except the animated home, whose difference sits in the same area and size as the main-vs-main control on every profile (noise), and finding P2-2 below. The albums screen's DOM differs only in which of its two «All Years» options carries `selected` (the duplicate option is also on `main`; the result on screen is identical).
7. **Weight** — measured by the judge:

   | build | main script | after the first screen | first screen |
   |---|---|---|---|
   | previous step (a488bca) | 233,458 B | 182,255 B | 325,723 B |
   | merge alone (53ef3a6) | 235,443 B | 182,679 B | 327,702 B |
   | this branch (693cb97) | 235,695 B | 186,719 B | 327,641 B |

   The branch build is inside its own budget and over the previous one (main 233,590; after-cap 421,635). The split matches the builder: 1,985 B from the merge (the inventory stays hand-made and in the main script), 252 B from the port; the window is a lazy file `PlaylistExportWindow-*.js`. **Both raises are justified**: the main ceiling is the measured value plus the 144 B the keys add (the rule of every earlier step); the `background` raise to 49,000 B is what the sum needs (422,414 B against a cap of 422,437 B). See P2-3.

## Findings

### P2-1 — After «Export», the checked radio of the computer window paints differently in Chromium
- **Where:** the folder step of the export window, computer layout, Chromium only (1280 and 900; both screens). Not in WebKit, not on the phone.
- **Evidence:** after an export ends (done, failed, no folders, error) the window differs by 128 pixels (max 202/255) in the 13×13 box of the checked radio (`captures/saved-chromium-desktop-05-export-exporting-done-{main,branch}.png`). The main-vs-main control shows 0. The radio's box, state, focus, hover and the list's scroll are identical on both sides (`logs/radio.log`), and a screenshot of the radio alone shows 0 apart before, after, after a forced repaint and after Tab (`js/radio2.mjs`). Not visible to the eye. Cause not found: said plainly, it stays unexplained. Smaller sub-pixel noise (≤ 7/255) near the radios at 900 px is of the same kind.
- **Check:** in Chromium at 1280, export with the series folder and compare the window with `main`: 0 pixels apart.

### P2-2 — Search icon antialiasing on the empty saved-playlists screen at 899 px
- **Where:** `/saved-playlists`, empty, Chromium at 899 px.
- **Evidence:** 11 pixels apart, max 24/255, on the magnifier icon (`captures/zoom-saved-empty-w899-{main,branch}.png`); control 0; not seen at other widths. Invisible.
- **Check:** the same capture at 899 px: 0 pixels apart.

### P2-3 — The `background` allowance was raised to leave 23 B of room
- **Where:** `scripts/bundle-budget.json` (`background` 48,198 → 49,000 B).
- **Evidence:** main script + after-first-screen = 422,414 B against a cap of 422,437 B. Justified for this step, but the next lazy byte breaks the budget, so the next screen step will have to raise it again.
- **Check:** the next step says, in the budget text, its own after-first-screen weight and the allowance it needs.

## What the judge could not see
- The real Apple Music (MusicKit with the developer token from the server and a real library) and the real Spotify: both stubbed or blocked. The Spotify window opened by «Export to Spotify» did not show on either side with Spotify blocked (same on both).
- Touch drag (WebKit has no touch drag in Playwright); only the mouse drop was proven.
- The inventory's Discogs values «kept with their date»: the seeded readings produced the value line for one album and the «Discogs ↗» links, equal on both sides; whether every dated «kept» origin line appears was not exercised with the database's exact current shape.
- Real Safari on a real iPhone (only Playwright WebKit with device profiles).
