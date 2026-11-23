---
type: ux-audit
subject: "Independent visual recheck before merge of claude/f83-wave-3-shell (F83 wave 3: the site's shell in React) against its parent 610fc1b — 1280, 900 and 393, signed out and signed in"
project: mjrpalbumblender-v0
features: [F83]
moment: delivery
date: "2026-11-21 19:03"
judged: "2026-11-21 19:03"
judged_commit: 1e3c14b
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 3
duration_s: 1800
status: open
---

# Independent visual recheck: the site's shell in React (F83, wave 3)

**Verdict: pass, no P0 and no P1; 3 P2.** On every address of the router, at 1280, 900 and 393, signed out and signed in, the new shell looks and behaves like the old one: the same header, footer, phone bars, drawer, menus, sign-in window and notices; the same focus after each action; the same Back/Forward, leaving and returning, and «No connection» on a lazy screen. The only visible differences are the two on purpose, and both are improvements. The builder's 2 to 12 pixels are rendering noise on the top bar's rounded corner, not a difference of the shell. The cost: React at the start makes the first screen about 0.4 s later on Slow 4G.

## How it was done
- **Who judged:** an agent (Opus) that did not build the branch; its own scripts, not the builder's `browser-proof.mjs`.
- **Object:** `claude/f83-wave-3-shell` at `1e3c14b` (worktree `.claude/worktrees/agent-aff916c71882553e7`, clean) against its parent `610fc1b`. The old tree at `/private/tmp/claude-501/f83w3/w3/old-tree` was checked before use: it is a symlink into this session's scratchpad, a clean git worktree detached at `610fc1b`.
- **Staging:** two Vite dev servers (ports 5071 old, 5072 new), each with its own dependency cache; and the two publishable builds (built through `machine_load.py`) served with gzip on 5081/5082 for the timing and offline runs. All servers stopped at the end.
- **No production touched:** every request not to `127.0.0.1` was aborted in the browser (Firebase, analytics, Spotify, Google's logo). Signed in = a fake person put in `userStore` (the seam the builder used). No provider button was pressed. «Clear Cache» was clicked only in a fresh, empty Playwright profile.
- **Captures and data:** `captures/` (164 PNG; `SIDE_*.png` are old over new, a red line between), `results-routes.json`, `results-interact.json`, `results-pixels.json`, `results-corner.json`, `results-timing.json`, `results-offline.json`; scripts `recheck.mjs`, `corner.mjs`, `timing.mjs`. Viewports 1280x900 and 900x900 with a mouse, 393x852 with touch. The clock of the footer was frozen; the toast «Authentication issue» (caused by the blocked Firebase, shown at a network-dependent moment) was hidden in the route sweep.

## What was checked

**Every address of the router** (`/start`, `/home`, `/albums`, `/albums/:id`, `/inventory`, `/blend`, `/playlists`, `/playlists/edit`, `/saved-playlists`, `/playlist-series`, `/artists`, `/genres`, `/tracks`, `/album-series`, `/series`) × 1280/900/393 × signed out/in = 90 pairs. In each: the tab title, the header shown or hidden, the current link, the label of the series menu, the account (sign-in button or avatar), the phone top-bar title, the current tab, the number of phone bars, the footer and «Clear Cache».
- **52 pairs at 0 px with every state equal.**
- **30 pairs with pixels only inside the screen, not the shell:** the pulsing icon of the «Soon» screens (`/artists`, `/genres`, `/tracks`, 7,344 px in a 96 px circle), a live clock on `/playlists` (`Last updated: 6:53:11` vs `6:53:12`), the animated entry page on `/home` (no shell there on either side). `SIDE_1280_artists.png`, `SIDE_1280_playlists_edit.png`.
- **8 pairs differ in the shell, all from the on-purpose change:** `/album-series` and `/series` redirect to `/albums`; the old bar was drawn before the redirect and marks nothing («Music Series»), the new one marks «By Album». `SIDE_1280_album_series.png`.

**Behaviour, old vs new** (`results-interact.json`):
- **Links of the bar, Back, Forward (1280):** same address, same title («MJRP The Album Blender - Playlist Generator» on every address, both sides), focus stays on the clicked link on both, the next Tab goes to the same place. The new bar marks the address after each move; the old keeps «Start» (`SIDE_1280_after_click_inventory.png`).
- **Leaving the app and coming back** (`about:blank`, then Back): same page, same bar, 0 px.
- **Account menu (signed in):** avatar, name, «Signed in as Judge Person», «Sign Out» present on both; Escape gives the focus back to the avatar on both; 0 px.
- **Sign-in window:** Google and Apple buttons and «Continue as Guest» on both. There is no Spotify button in the sign-in window on either side (Spotify is the separate «Connect» pill of the bar and the phone menu, present on both). Opened by click or keyboard: focus stays on «Sign In» on both. **Neither side** closes on Escape, traps the focus (Tab walks to the page behind) or gives the focus back on close (it goes to the page); neither has a dialog role. Same behaviour, so not a regression: see P2-2. Asked twice by the app: the old stacks 2 windows, the new shows 1 (better).
- **Drawer at 900:** opens the same, holds the page (`overflow: hidden`) on both; neither closes on Escape; a link closes it and moves on both. The series toggle turns the music note on the old side (it looks like a broken glyph) and the chevron on the new (`SIDE_900_drawer_series.png`).
- **Phone at 393:** menu opened by a tap, the focus on «Sign In» inside, Escape gives it back to the menu button on both; signed in, the initial «J» and the same menu text with «Sign Out». Tabs and Back: the same title and the same current tab.
- **«Back to top» with a real tap (touch emulation):** from 3,200 px, 2.5 s later both at 0 and the button hidden; from 4,000 px with a raw touchscreen tap, both at 0. The builder's fix holds.
- **Footer:** the Discogs notice turned on, 0 px; «Clear Cache» in an empty profile: «Cache Cleared!» on both, then a reload on both (689 px apart only in the pulsing message, max 7 levels).
- **«No connection» on a lazy screen** (publishable builds; the browser goes offline after the first screen, before the saved-playlists file arrives), 1280 and 393: «No connection … Try again» inside the screen on both, bar, top bar («Playlists») and current tab still there; «Try again» with the connection back opens the screen on both. If requests fail while the browser still says online, both say «The app was updated…» instead (same on both).
- **No page errors** on either side in any run.

## The 2 to 12 pixels at the top right with the sign-in window (the builder's unexplained result)
- **Where they are:** in the builder's captures, x 1273 to 1278, y 25 to 30, 0 to 3 levels of 255. At that point, under the window, is `NAV.top-nav.glass-panel`: they are the anti-aliased **rounded top-right corner of the top bar's 1 px border**, seen through the window's `backdrop-filter: blur(8px)` (`captures/PX_builder_wide.png`, brightened ×8).
- **They are noise, not a difference:** between two of the builder's steps the values swap (step «closed by Continue as Guest» new = step «closed by the background» old, pixel for pixel). The DOM, the boxes and the computed styles are equal: the overlay is the last child of `body` on both, `position: fixed`, rect 0,0,1280,900, z-index 2147483647, the same blur and animation; `html` and `body` have the same overflow, padding and size (1175 px); no scrollbar takes width (client width 1280 on both). The header differs only in white space between tags.
- **In this recheck: 0 px** in 6 runs (window opened at once, after signing in and out, mouse left on the button or moved away, 0.45 s and 2 s later, animations off, overlay hidden, blur removed). The one thing that differs from the builder's runs: here Firebase is blocked. In the builder's runs the app's anonymous sign-in got an answer, which redraws the bar at a moment set by the network, while the window's blur is drawn over it. Most likely cause; the builder's network cannot be replayed without signing in to production.

## The two differences on purpose
- **The top bar follows the address: an improvement a person will notice.** The old bar kept the highlight where the bar was first drawn («Start» highlighted while on Inventory; nothing highlighted after `/series` → `/albums`; on the drawer, «By Album» kept as the series label while on Inventory). The new one always marks where you are. The focus is not lost when it changes (it stays on the clicked link).
- **The drawer turns the chevron: an improvement, small.** The old one turned the music note upside down, so it looked like a broken icon, and the chevron did not move. Visible only at 769 to 1023 px, after opening «Music Series».
- **Both will be redone with the new menu (F88).**

## First load: time to the first screen (publishable builds, median of 5, 1280, nothing cached, outside calls blocked, CPU not slowed)

| | first paint | top bar drawn | first screen | JS + CSS over the wire |
|---|---|---|---|---|
| `/start`, no throttling, old → new | 64 → 76 ms | 57 → 64 ms | 170 → 189 ms | 322,491 → 420,566 B (new includes the screens fetched after the first one) |
| `/albums`, no throttling, old → new | 68 → 76 ms | 55 → 61 ms | 72 → 175 ms | same |
| `/start`, Slow 4G, old → new | 1,504 → 1,652 ms | 2,967 → 3,377 ms | 2,980 → 3,396 ms | 321,198 → 394,280 B |
| `/albums`, Slow 4G, old → new | 1,504 → 1,660 ms | 2,967 → 3,382 ms | 2,981 → 3,397 ms | same |

The runs are tight (Slow 4G first paint 1,488 to 1,516 old, 1,652 to 1,688 new). **On Slow 4G the first paint is about 150 ms later (+10 %) and the bar and the first screen about 0.41 s later (+14 %)**: a person on a slow phone connection will see the page frame appear a bit later, not a broken or blank page. On a fast connection the difference is under a tenth of a second (`/albums` 72 → 175 ms is a page that is fast either way). This matches the builder's 0.4 s on its own slow profile.

## Findings
- **P2-1 · the first screen is about 0.4 s later on a slow connection.** The cost decided with React at the start (ADR-0023, `scripts/bundle-budget.json` `reactAtStart: true`); +73 kB over the wire on Slow 4G. Evidence: `results-timing.json`. Anchor: `public/js/app.js` (imports `shell/`, which pulls `react-vendor` into the first load). The change, if wanted: draw the old frame first (a static bar in `index.html`) and let React take over, or keep this cost and record it in the ADR as accepted. Not a blocker.
- **P2-2 · the sign-in window has no Escape, no focus trap, no focus return and no dialog role, the same as before; the series menu and the drawer do not close on Escape either.** Not a regression: the old shell had the same gaps. Evidence: `results-interact.json` («signin Tab x8», «signin Escape», «900 drawer Escape», «series menu Escape»). Anchor: `public/js/shell/LoginWindow.tsx` (`Window`), `SeriesDropdown.tsx`, `TopNav.tsx` (drawer). The change: `role="dialog" aria-modal="true"`, Escape closes, focus moves into the window and back to the opener, as `ui/SheetWindow` already does; the menus go into the F88 redesign.
- **P2-3 · the builder's browser proof lets the app reach production.** `reports/evidence/F83/wave-3/browser-proof.mjs` `open()` does not block outside requests, so each fresh browser context runs the app's anonymous sign-in against the real Firebase project (`services/AuthService.js` → `signInAnonymously` when nobody is signed in), very likely one anonymous account per context, over 4 runs. Not checked in the Firebase console. It also explains the corner pixels. The change: in `open()`, `context.route(u => !/^http:\/\/127\.0\.0\.1/.test(u.href), r => r.abort())`, as in this recheck, for this wave and the next.

## Not seen
- A real sign-in with Google or Apple, and the error notices of a failed sign-in (they need the provider's own window; only the unit tests cover them).
- «Sign Out» pressed (it calls the login and reloads).
- Spotify connected, in this recheck (the builder's stub covers it; not repeated).
- The Portuguese texts (the shell starts in English); a real iPhone (only the 393 touch emulation); CPU slowdown in the timing (network only).
- Firebase's answers: every outside call was blocked, so «signed in» is the fake person in the store, not a session.
