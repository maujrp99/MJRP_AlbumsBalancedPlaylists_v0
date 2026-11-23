---
type: visual-parity-recheck
feature: F83
step: wave 8a (the exports: Spotify window in React, Apple Music and file moved)
branch: claude/f83-wave-8a-exports
judged_on: f4eae56
reference: claude/f83-wave-7b-blend-screen at 160c702
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 3
---

# Wave 8a, the exports: independent recheck

**Verdict: pass.** What goes to Apple Music is the same, call for call, in every case I tried, on six browser profiles. The Spotify window draws the same thing in every state, pixel for pixel. The downloaded file is byte-identical. I found three minor differences (P2) and no defect that breaks a flow.

## How it was judged

- Both sides were exported with `git archive` (160c702 and f4eae56) into this folder and built with `vite build` through the machine queue, with no `.env` (no key read, none written). Each built site was served by my own static server, which falls back to `app.html` on deep routes as the hosting does.
- **The outside world was stood in by my own code, the same on both sides** (`scripts/run.mjs`). The builder's recorder was not reused.
  - MusicKit is a stub that I wrote myself (`window.MusicKit`). It logs `configure`, `getInstance`, `authorize` and every `api.music` call with method, path, params and body, in order. It can return folders (with paging through `next`), fail the folder read, refuse authorization, answer 401 on every library call, fail the Nth playlist creation, or hold a call.
  - The developer-token route is answered by Playwright, or made to fail.
  - The Spotify API is stood in with every request logged, and calls can be held to freeze each stage.
  - Firebase hosts and every outside host are blocked. Only `fonts.googleapis.com` (and once `www.google.com`) was attempted and aborted, the same on both sides.
- **Profiles:** Chromium at 1280, 900 and 899; WebKit at 1280, iPhone 14 and iPhone SE.
- **Scenarios:** 30 on each profile, plus 1 for leaving the screen with the window open.
- **Checks:** 5,488 comparisons across the six profiles, covering the window's DOM, text, element boxes, focus and pictures, the MusicKit log, the toasts, the progress texts, the Spotify requests, the downloads, the outside hosts and the page errors.
- **Noise control:** parent against parent on Chromium 1280, Chromium 899 and WebKit 1280.
- **Waits and pictures:** I waited at least 1.1 s after sheets and toasts. The toast area and the footer were hidden in pictures. Pictures are element or viewport only, never full page.

## 1. Apple Music (the owner's path)

Scenarios, from the playlists edit screen unless marked:

- an existing folder picked
- a new folder typed
- a new folder left empty (the alert)
- the series' own folder (looked up by name)
- no folder
- no folders in the library
- the folder read failing
- 250 folders across 3 pages, picking the last one
- tracks not found, with one playlist left with none
- a 300-track playlist
- the second of 3 creations failing, then exporting again
- authorization refused
- authorization expired (401 on library calls)
- the developer token failing
- cancelling (Back, then Escape)
- Escape pressed while an export runs
- the remembered folder, then exporting again in the same session ("already exported")
- two quick presses
- from the saved playlists screen: one playlist, and the whole batch into a new folder

| Profile | MusicKit SDK calls compared | of which `api.music` | Differences in calls, toasts, progress texts and final state |
|---|---|---|---|
| Chromium 1280 | 309 | 251 | 0 |
| Chromium 900 | 309 | 251 | 0 |
| Chromium 899 | 309 | 251 | 0 |
| WebKit 1280 | 309 | 251 | 0 |
| WebKit iPhone 14 | 309 | 251 | 0 |
| WebKit iPhone SE | 309 | 251 | 0 |

- **What the stub saw:**
  - **Order:** the token route is called first, then `configure`, `getInstance`, `authorize`, the folder pages (`limit=100`, then `offset=100`, then `offset=200`), the searches, and one `POST /v1/me/library/playlists` per playlist.
  - **Folder:** the chosen folder goes as `relationships.parent` (`f-2`, or `new-folder-1` when a new one is made). No `parent` is sent with "No folder".
  - **300 tracks** go in one `POST` holding all 300 ids.
- **Toast texts are the same on both sides, word for word:** success, the folder warning, the not-found and empty warnings, partial failure, already exported, not authorized, failed before starting, and "already running".
- **The recording fixture predates the move.** `test/fixtures/exportMusicKitRecording.json` was added in 1513f6b at 09:01. The move came in ad99443 at 09:07, and `git log --follow` shows no later change to the fixture.
  - I ran the recording test on a `git archive` of 1513f6b (the pre-move code): 29 of 29 passed against the fixture.
  - I ran it on f4eae56 (the post-move code): 29 of 29 passed.
  - So the code before and after the move both produce it.

## 2. Code read of the move

Diff `git diff -M 160c702 f4eae56` of `controllers/playlistExports.js` and the deleted wrapper.

- **`playlistExports.js` is a 92% rename.** Seven static imports lose one `../`, the dynamic `import('../services/MusicKitService.js')` changes path, and one comment changes. That is the only change.
  - Error handling, the `appleExportRunning` guard, the order of awaits, `progressWriter` and `giveBackButton` are untouched.
- **`playlistExportEntries.js` copies `OutputWindows.ts` function for function**, with the TypeScript types turned into JSDoc. The single MusicKit import promise is kept (`musicKit ??= import(...)`).
- `openSpotifyExport` now also lazy-loads `SpotifyExportService` and `SpotifyAuthService` and hands them to the window as `deps`. Before, the hand-made window imported them itself.
- **The split into two files does not change behaviour in the built site.**
  - The entries file goes into the same chunk as the export window (6,749 B, loaded with the screen, as `PlaylistExportWindow` 6,475 B was before).
  - `playlistExports` stays its own on-demand chunk (2,966 B, against 2,965 B for `PlaylistsExport` before), loaded on Export.
  - `appleExportRunning` is still one module-level flag in one module instance.
- **Exports wiring.** `ui/PlaylistExportWindow.tsx` takes `exports` from all three screens:
  - `Playlists.tsx` (`Controls`, computer)
  - `PhoneParts.tsx` (`usePhoneSheets`, phone)
  - `SavedPlaylists.tsx`

  `DESTINATIONS` is unchanged. The rows read "Export to Apple Music, Export to Spotify, Download JSON" in the snapshots on every profile, and on both sides. No other caller of `usePlaylistExport` remains, and nothing still imports the removed files.

## 3. The Spotify window in React

States compared on every profile:

- idle (several playlists, one playlist, saved batch)
- merge and separate
- a name typed (including markup, which shows as text)
- Escape while idle (does nothing)
- searching (held, "1 / 6 17%")
- creating (held)
- adding (held)
- the backdrop while running (does nothing)
- done with links
- partial (tracks not found, a playlist with none, the details opened)
- Escape on the report (does nothing)
- Close; X; the backdrop
- creation failing, then "Try again"
- separate with the 2nd creation failing (stopped part of the way)
- not connected (Connect to Spotify again)
- 401 refused

**Same on both sides:** the DOM, text, every element box, focus, parent (`body`) and pixels. The Spotify request log (method, path, query, body) is the same too. The CSS rules `#spotify-export-modal > .glass-panel` and `#spotify-export-modal …` still apply on the phone: the pictures are identical at 899, iPhone 14 and SE.

**Kept defects, the same on both sides:** no Escape, no focus trap, focus left on the opener or `body`, and «1 tracks». The jsdom golden (23 tests) is also green on f4eae56.

**Noise only:**
- The spinner's box moves by 1 px while it rotates; this happens in the control too.
- The animated flame of the logo in WebKit 1280 (4,003 to 4,276 px, max 34, at x 16–196, y 21–50). It appears **in my parent-against-parent control too** (`a-cancel`, `a-expired`). This settles the point the builder left as "probable, not proven".
- At 899, 21 px at max 9 in the page behind the sheet. It also appears in the control.

## 4. The file export

The downloaded files are byte-identical on all six profiles:

- `playlists_Unsaved Batch_2026-11-22.json`, 982 B, sha256 `dbf02636…b6e977`, from the edit screen
- `playlists_Sunday mix_2026-11-22.json`, 1,080 B, sha256 `efb0eca1…2a84c`, from the saved batch

## 5. Regression sweep, signed out

Pages compared: `/home`, `/start`, `/albums`, `/blend`, `/playlists`, `/saved-playlists`, `/inventory`, and `/series` (which redirects to `/albums`). Profiles: Chromium 1280, Chromium 899 and WebKit iPhone 14.

- Text, DOM length and final URL are the same on every page.
- Pixels are 0 apart, except on `/home`, where the animated covers differ by the same amount in the parent-against-parent control.

## 6. Weight

| Build | main | after the first screen | budget |
|---|---|---|---|
| parent, no keys | 194,889 B | 236,603 B | inside (ceiling 195,033) |
| new, no keys | **195,460 B** (+571) | 236,792 B | inside: 400 B under 195,860; `background` needs 58,815 B, 485 B under 59,300 |
| parent, stand-in keys passed in the environment | 195,039 B | 236,611 B | **over** (main 6 B over 195,033; the total over too) |
| new, stand-in keys passed in the environment | **195,594 B** | 236,778 B | inside: 266 B under 195,860; `background` needs 58,935 B, 365 B under 59,300 |

The stand-in keys were the four `VITE_SPOTIFY_*` and `VITE_POSTHOG_*` values, passed in the environment. No `.env` was read and no file was written. They add 134 to 150 B.

**The Spotify window is fetched only on demand.**
- `SpotifyExportWindow-*.js` (3,517 B) and `SpotifyExportService-*.js` (1,639 B) are requested only after the Spotify press, on both screens.
- In Apple-only runs they are never requested.
- They replace `SpotifyExportModal-*.js` (5,274 B).

## Findings

**P2-1. The Spotify window now closes when the person leaves the albums or inventory screen.**
- **Where:** `ui/SpotifyExportWindow.tsx` opens through `ui/windowLayer.showWindow`, which `closeAllWindows()` empties on leaving the albums and inventory screens.
- **Evidence:** scenario `sp-navigate`. The window is opened on `/playlists`, then the app moves to `/albums`, then to `/start`.
  - In the parent, the window is still present over `/start` and `/blend`.
  - In the new build it is gone after leaving `/albums`.
  - Seen on Chromium 1280, WebKit iPhone 14 and SE. Capture: `captures/spotify-window-after-leaving-albums-PARENT-only-new-has-none.jpg`.
- **Impact:** only reachable by browser back or forward while the window is open. If an export is running, it goes on unseen, without its report.
- **Check:** open Spotify on playlists, call `router.navigate('/albums')` then `('/start')`; is `#spotify-export-modal` there?

**P2-2. The Spotify window's text now follows the language.**
- **Where:** `i18n/pt/exportWindow.js`, keys `spotifyWindow.*`.
- **What changes:** the hand-made window was English only. With the owner's Portuguese preview mark (`mjrp.lang.preview=pt`), the window speaks Portuguese.
- **What it sends to Spotify:** when no series is open, the default playlist name becomes «Playlist MJRP» instead of «MJRP Playlist». The public site (English only) is unaffected.
- **Check:** with the preview mark set and no series, open the window and read the name field.

**P2-3. The move differs from the wave-8 map.**
- **Where:** `controllers/playlistExports.js`, `ui/SpotifyExportWindow.tsx`, and `map-wave-8-closure.md` lines 15–16.
- **The dead `btn` branch:** `progressWriter` and `giveBackButton` still carry it, although the map says the file moves "without the dead branch".
- **No `ModalShell`:** the Spotify window is not built on `ModalShell`. This one is documented in lesson 20, on purpose, to keep parity.
- **Impact:** harmless at run time. The map and the code disagree.
- **Check:** grep for `btn` in `playlistExports.js`.

## What I could not see

- The real MusicKit SDK and a real Apple account: the authorization popup, Apple's real error objects and messages (my 401 and 500 shapes are guesses), the storefront, rate limits, and real catalog matches.
- The real Spotify API and sign-in. The rate-limit (429) path was not driven in the browser; the jsdom golden covers it.
- The Spotify window has no "connecting" state of its own: signing in leaves the page.
- The published build with the real keys.
- Signed-in Firebase states: the sweep is signed out, and the saved playlists screen was fed through a hook line on its store class, the same on both sides.
- The Portuguese preview in a browser.
- Touch drag, and a real iPhone or Safari.

## What the owner should try with his real Apple Music account on the preview

1. Saved playlists, then a batch, then «Export», then Apple Music. Pick a folder you already have, then «Export». In the Music app, check that the playlists are inside that folder, with their tracks.
2. Do the same with «New folder» and a name you type. Then once more with «No folder». Check that the folder is created, and that the last export lands at the top of the library.
3. Export the same batch again without reloading the page. Expect the notice "already exported in this session and not created again", and no duplicates in Music.
4. On the playlists edit screen, right after generating, press Export to Apple Music and keep the default (the series' folder). Check that the count in the notice matches what appears in Music.
5. On the iPhone, export one playlist from the saved playlists sheet.

## Files

- Scripts: `scripts/run.mjs` (the harness and the stand-ins), `scripts/compare.mjs`, `scripts/sweep.mjs`
- Raw results: `out/<engine-profile>/{parent,new,control}/`
- Comparisons: `out/cmp-*.txt`
- Budgets: `budget-*-{nokeys,keys}.txt`
- Recording runs: `rec-before.log`, `rec-new.log`
- Captures (each under 1 MB): `captures/` — parent on the left, new on the right.
