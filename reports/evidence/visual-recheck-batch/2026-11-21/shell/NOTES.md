# Shell capture, 2026-11-21 (capture only, no judging)

Commands (from the worktree root, Chrome headless on debug port 9404, vite on 5404):
- Chrome: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --disable-gpu --hide-scrollbars --remote-debugging-port=9404 --user-data-dir=<scratch> about:blank`
- Vite: `npx vite --host 127.0.0.1 --port 5404 --strictPort`
- `node reports/evidence/visual-recheck-batch/2026-11-21/shell/shoot-prod.mjs` (state A, production)
- `node .../shoot-dev.mjs visitor` (states B, C, D, E as a visitor)
- `node .../shoot-dev.mjs account` (state D, E with a stand-in account)
Scripts: lib.mjs (CDP client, measures, freeze), stub.mjs (the seam), states.mjs, shoot-*.mjs. Both servers stopped at the end.
Sizes: 1280x800 desktop; 393x852 phone (mobile emulation, touch, scale 2). Animations frozen before measuring.
Files: `<where>-<state>-<1280|393>.png`; measures-prod.json, measures-dev-visitor.json, measures-dev-account.json; prod-title-favicon.json.

## A. Production, signed out (fresh profile) - reached
`/`, `/home`, `/start`, `/albums`, `/inventory`, `/playlists`, `/saved-playlists`, `/blend` at both sizes (prod-*.png). Nothing typed or clicked. No route redirected away.
- Titles: `/` and `/home` (entry page): "The Album Blender — for people who listen to whole albums". Every app route (`/start`, `/albums`, `/inventory`, `/playlists`, `/saved-playlists`, `/blend`): "MJRP The Album Blender - Playlist Generator". Exactly one `<title>` element on each page.
- Favicon links (same on every page, entry and app): `<link rel=icon>` -> `/assets/favicon-DVBstM4o.png` (image/png), saved as prod-favicon-1.png; `apple-touch-icon` -> `/assets/app-icon-180-BQfbuP-v.png`, saved as prod-favicon-2.png. Only these two links per page (so the tab icon is the site logo image on both the entry page and the app). Details in prod-title-favicon.json.
- Console errors on production: none in any capture.

## B. Dev server, /start - reached (empty, scanning, results, notfound, error), both sizes
Seam: ONLY the raw catalog call `musicKitService.getArtistAlbums` is replaced in the page (stub.mjs), with a fixture of RAW Apple-Music-shaped items (appleMusicId, title, trackCount, isSingle, isCompilation, raw.attributes.genreNames, ...) for Kendrick Lamar. Everything after is the real code: AlbumSearchService.scanArtist -> _classifyAll -> models/albumType.js classifyAlbum -> groupVariants -> AlbumPickerController -> HomeController/Home view. The classifier is NOT bypassed; the page's `window.controller.search` is used like F79.
- scanning: the stub never answers (busy button). notfound: stub answers `[]`. error: stub throws, so the real scan fails and shows «Try again» (button text recorded in measures).
- results: classifier output is in measures-dev-visitor.json (`classified`, `chips`). "To Pimp a Butterfly" and "good kid, m.A.A.d city" came back typed Album, reason default-studio, shown under the chip «Studio · 7». Chips: Studio 7, EPs 1, Singles 2, Live 1, Compendiums 1, Other. The "(Deluxe Version)" of good kid was grouped under the base album. Honest oddity: my fixture "Black Panther The Album (Music From and Inspired By)" was classified Album (studio) too, not soundtrack; that is the classifier's behaviour, not changed.
- Covers are flat generated tiles (data: SVG) because no real artwork URLs; the first item (Mr. Morale) has no tile image in the screenshot (placeholder disc); this is a fixture artifact (an ampersand in the title broke my SVG text), not an app state.
- The error capture has 1 console error: the app's own `[AlbumPicker] Scan failed` log from the fixture failure (expected).
- A visitor is not signed in; no AI list call is made (visitor cannot use paid routes). Nothing was written; no series created.

## C. Edit series window - reached, both sizes
Without an account: `albumSeriesStore.setSeries([stand-in series])` in the page, then the real `SeriesEditModal.open('stand-in-series')`; the same stubbed catalog call; the real AlbumPickerPanel inside it. Captures: editseries-opened (before search) and editseries-aftersearch (typed "Kendrick Lamar", clicked Scan; 7 cards under Studio, same chips). Save Changes was never clicked, nothing written. Captured as viewport shots (the modal grid scrolls inside; on the phone only the first two cards show above the footer).

## D. Shell - reached
- Visitor, desktop: shell-visitor-top-1280 (top bar: logo, START, MUSIC SERIES, THE BLENDING MENU, PLAYLISTS, INVENTORY, Spotify Connect, Sign In) and shell-visitor-footer-1280 (scrolled to the bottom; «Clear Cache» button present, not clicked).
- Visitor, phone: shell-visitor-top-393 (top bar and tab bar) and shell-visitor-menu-393 (the phone menu opened by tapping #phoneMenuBtn).
- Signed-in (stand-in): same four shots as shell-account-*. Method as F85: a hand-written record `isAnonymous:false`, test uid, fake tokens, in the 127.0.0.1:5404 IndexedDB `firebaseLocalStorageDb` only (key built from the page's own web config). In this pass Chrome blocked network requests to firestore/identitytoolkit/securetoken hosts, so nothing could be read or written. The shell shows the avatar «T» and "Signed in as Test Account", plus Sign Out. Consequence: each of these captures has one console error, Firestore "could not reach backend" (expected, caused by the block). Stand-in data is not real.

## E. Spotify connect button - reached
Visible for a visitor: desktop top bar (109x30 «Connect», green outline) and inside the phone menu (361x55 box, «Connect» pill); also visible signed in. Sizes recorded in `spotify` / `spotifyInMenu` fields of the measures.

## Not reached
- Nothing from the list was left out. Not done on purpose: clicking Clear Cache, Create series, Save Changes, Sign In (no writes, no sign-in). Production was not driven through search (no seam there).
- Production `/saved-playlists`, `/blend` etc. show what a visitor sees (empty states), no deeper.
- The visitor desktop top bar was captured only on /start; other dev routes were not captured.
