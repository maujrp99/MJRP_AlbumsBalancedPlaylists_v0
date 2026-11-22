# F83 sync 4: the proof in the browser («Create» in place of «Start», F91, and the shared files that came with `main`)

Built sites (`vite build`, then `css/`, `assets/` and `js/firebase-config.js` copied in as `site-build.sh` does), each served by the script's own small static server on
127.0.0.1 that answers a deep route with `app.html` and `/` and `/home` with `index.html`. Chromium and WebKit (Playwright 1.56.1, borrowed from MJRPpersonal), at 1280 x 800,
WebKit with the iPhone 14 profile and with the iPhone SE profile. Firebase Auth and Firestore and **every host that is not 127.0.0.1** are blocked (no Google Fonts either, so
Syne itself is not downloaded: the computer's menu is drawn in the fallback face on both sides, and what is compared is the font the stylesheet asks for). Nobody is made
anonymous, no key is read or written (`js/firebase-config.js` is the tracked web configuration, copied into the build only). Motion asked off, `Math.random` and the clock
seeded. Servers closed by each script. Raw results: `summary.json` (one row per run), `observed.json`, `raw/*.json.gz`; scripts: `run-all.sh`, `main-vs-react.mjs`, `judge.mjs`,
`notices-and-questions.mjs`, `phone-icon-check.mjs`, `summarize.py`.

The four builds: `main` 336385a (hand-made), this branch, its parent 3877aaf, and **the parent with only the words** (the parent plus the six dictionary files and
`splash/phoneBar.js`, `splash/bar-menu.css` of this branch: it exists so that «what the branch changed on purpose» and «what it changed by accident» are separate; the
parent itself differs from the branch in the words on purpose, shown below). Every comparison has its noise control (the same build twice).

## 1. `main` against the React line (the words, the icon, the active state, the font, the boxes)

Per route (`/start`, `/albums`, `/blend`, `/saved-playlists`, `/inventory`): the text, the link and the active state (`cur`, `aria-current`) of each stop, the font the
stylesheet gives each stop, the icon strokes, the box of every element of the header, the footer, the bottom bar and the top bar, the breadcrumb, the footer links, the name in
the phone's top bar, and a picture of the window.

| Run | checks | differences | pixels |
|---|---|---|---|
| Chromium 1280 | 67 | **0** | **0** (control 0) |
| WebKit 1280 | 67 | **0** | **0** (control 0) |
| WebKit iPhone 14 | 67 | 13 (below) | 22,533 on 3 routes; control 0 in this run |
| WebKit iPhone SE | 67 | 12 (below) | 9,780 on 2 routes; control 9,780 on the same route |

What was read, the same on both sides: the stops `Create · Albums · Blend · Playlists · Inventory`, the active stop lit (`#fb923c`, `aria-current="page"`) on `/start` and on
each other route, the font `Syne, sans-serif | 700 | 14px` on every stop of the computer menu, the breadcrumb `Create › Albums` on `/albums`, the footer links `Create -> /start |
Albums -> /albums | Playlists -> /playlists`, the phone's top bar name `Create` on `/start`, and on the phone's bottom bar the first tab `Create` with the plus
(`<line x1="12" x2="12" y1="4" y2="20"/><line x1="4" x2="20" y1="12" y2="12"/>`) and the active state (`phone-icon-check.txt`: label, `cur`, `aria-current`, strokes and top bar
name equal to `main`'s).

The phone's 13 and 12 differences, all explained:
- **10 (iPhone 14) and 10 (SE) are the text of the header and the footer of the computer, which the phone hides** (`display: none`): the page's `innerText` of a hidden
  element is its `textContent`, and the React markup has no whitespace between the links where the hand-made markup has some (`CreateAlbumsPlaylists` against `Create Albums
  Playlists`). The words are the same; nothing is drawn. On the computer, where the elements are drawn, the same reading is equal.
- **3 (iPhone 14) and 2 (SE) are pictures**: 22,533 px (iPhone 14) and 9,780 px (SE), maximum 129/255 and 85/255, all inside the box of the **animated flame wordmark**
  at the left of the top bar (x 48-446, y 50-115 at 3x; `wordmark-noise-A.png` and `-B.png`: the same words, a different frame of the flames). The animation of the picture does not
  stop with reduced motion. It is the noise of the page, and the controls show it: iPhone 14 `main` against `main` was clean in the run above and the parent against the parent
  had the identical 22,533 px / 129 in the sweep; SE `main` against `main` had the identical 9,780 px on `/inventory`.

The empty albums screen (`/albums` with nothing in the library, Firestore blocked): the button says **«Go and create!»** on both sides, the box is equal on Chromium 1280,
WebKit 1280, iPhone 14 and SE (0 px; WebKit 1280 control had one noise picture of 4,886 px in the top bar), and pressing it goes to `/start`.

The entry page (`/home`), signed out and signed in (the class `in` forced after the load, as `main`'s tests do), in Portuguese and in English: the text, the title, the
language, the boxes of the menu stops, the opening, the first screen, a picture of the window and of the whole page. `index.html` is **identical** after the hash of the
assets is taken out of the names (the page is the shared file). Chromium 1280: 48 checks, 0 differences, 0 px (control the same). iPhone 14: 0 (control 0). SE: the 4 differences
are the full-page pictures, 26,292 px at the most 1/255 (control 0 in this run; the WebKit 1280 control has the same class, 43,096 px at 1/255). WebKit 1280: 6 against the control's
4, all the width of the page (1280 or 1312 depending on the moment of the 3D crate) and the pictures that follow from it, which the control shows too (166,001 px). The words seen:
Portuguese `Criar · Álbuns · Blend · Playlists · Inventário`, English `Create · Albums · Blend · Playlists · Inventory`, signed in the opening `h.kick`, `h.title`,
`h.what`, `h.para` text, font `Syne, sans-serif | 700 | 14px` on the stops of the entry page's bar.

## 2. The branch against its parent (a regression sweep of every screen)

The sweep (`/start`, `/albums`, `/inventory`, `/saved-playlists`, `/artists`, the playlists screen with a set and its panel to generate again) and the full Blend flow, each
step: the element tree of `#app`, the text, the box of every element, the focus, the scroll, the ARIA tree, a picture. Parent-with-the-words against the branch, with the
parent against itself as the control:

| Run | checks | differences, branch | differences, control (the noise) |
|---|---|---|---|
| sweep, Chromium 1280 | 187 | 2 pictures, 35 px, max 2/255 | the same 35 px, max 2 |
| sweep, WebKit 1280 | 187 | **0** | 1 picture, 4,886 px (the top bar) |
| sweep, WebKit iPhone 14 | 106 | 4 pictures, 22,533 px max 129 (the wordmark) | 7 pictures, the same 22,533 / 129 |
| sweep, WebKit iPhone SE | 106 | 3 pictures, 9,780 px max 85 (the wordmark) | 4 pictures, the same 9,780 / 85 |
| Blend flow, Chromium 1280 | 611 | 7 (below) | 2 (24 px, max 5) |
| Blend flow, WebKit iPhone 14 | 746 | 3 | the same 3 |

The parent itself (without the words) differs from the branch in 44 checks on both 1280 runs and 13 on the phones, all of them the words (the breadcrumb `Start`
to `Create` and its width, the stop in the top menu): the largest picture is 11,844 px, in the breadcrumb and the menu. The parent with the words removes them, which is why it is the reference.

The Blend flow's 7 at 1280: 3 are pictures of 12 to 25 px, max 6/255 (the glass corners the 7b fix already described, present in the control as well), and 4 are what the
**fix of the Blend screen** (the integration line, now in the branch) changed on purpose: after «Single» with the failure panel the page is at 1435 instead of 1293, and the
boxes of the generating state. On the iPhone 14 the 3 are the same 3 as the control's (`window.__release is not a function` in the judge's own flow, on both sides, and one box line).

**The page-jump check (Chromium 1280, the page scrolled to the end, an ingredient button pressed)**, `scrollY` from 1439 (the end of a 2239 px page):

| Button | parent | branch |
|---|---|---|
| a grouping button (no change of height) | 1209 (a jump of 230 px) | **1439** (no jump) |
| «Single» (the page loses 112 px) | 1209 | 1327 |
| «Multiple» | 1097 | 1327 |
| the failure panel shown, then «Single» | 1293 | 1435 |
| Top 5 / Top 10 (Playwright scrolls the button into view) | 837 / 887 | 837 / 887 |

The branch's numbers are the table of the 7b fix's proof (`wave-7b/fix-scroll-and-weight/proof.md`) to the pixel. WebKit iPhone 14, the same sequence with taps: 45 checks, 0 differences
(and 0 for the control).

**A notice and a question window (wave 8b)**, the parent with the words against the branch, then the parent against itself (the control): the albums screen (remove an album, the
question and the one to type), the inventory, the saved playlists, the playlists on the edit screen, the shell (disconnect Spotify, the sign-in window), the Start screen, the
callback, the notice of the blocked login on load and a slow change of screen for the bar; at every step the layers, the focus, the lock of the page, the scroll, a picture and the
timeline of each notice, bar and window in milliseconds.
- **Chromium 1280: 237 checks, 229 passed, 8 differences; the control 237 checks, 230 passed, 7.** Seven are the same small pictures in both (10, 12 and 2 px, max 4/255, in the
  inventory's question and the playlists' panel) and one of the control's is a timeline reading 25.3 ms against a 20 ms tolerance. The eighth (152 px, max 37/255, in the inventory
  after Escape) did **not** reproduce in 3 more runs of that scenario (`raw/...r1..r3-only-inventory`: only the two pictures of 10 and 12 px, as in the control).
  All the DOM, text, focus, lock, scroll and timeline checks of the branch passed.
- **WebKit iPhone 14: 264 passed, 0 failed; the control 263 passed, 1 failed** (a timeline reading of 22.0 ms, 2 ms over the tolerance).
- The first run of this proof used the parent without the words as the reference: 12 differences, all pictures of the breadcrumb (`Start` to `Create`, x 64-239, y 145-161) and of the top bar;
  kept as `raw/notices-chromium-1280-parent-vs-new-WORDS-DIFFER.json.gz`.

## 3. What was not proven

- **The Portuguese texts of the app.** The built site has no way to ask for Portuguese (nothing in the app calls `setLocale`; the language is open only in tests and by the preview
  key), so «Criar» and «Vá e crie!» are proven by the unit tests (`test/shell/Shell.test.tsx`, `test/screens/playlists/Playlists.texts.test.tsx`), not in a built page. The entry
  page, which has its own language switch, is proven in both languages.
- **Syne drawn.** Google Fonts is blocked in every run (no external host), so the glyphs are the fallback face on both sides; what is proven is the computed font and
  that no React-only stylesheet overrides it (no rule for `.ms .stop` outside `splash/bar-menu.css`).
- **The real MusicKit, the real Firebase, a real signed-in account** (only the class `in` on the entry page, as `main`'s tests do). The empty albums screen is the one a
  visitor with nothing in the library sees with the database blocked.
- **Real Safari on a phone**: WebKit with a profile is the engine, not the device.
