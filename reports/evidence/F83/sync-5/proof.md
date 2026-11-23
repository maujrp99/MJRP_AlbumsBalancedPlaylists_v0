# F83 sync 5: the proof in the browser (the lean «Create» on the computer, no orange line while the series are read, the Albums screen that says it is loading)

Built sites (`vite build`, then `css/`, `assets/` and `js/firebase-config.js` copied in as `scripts/lib/site-build.sh` does; the tracked web configuration, no `.env`, no key written
anywhere): `main` a6bc310 (hand-made), this branch, and its parent a1ac74f. Each served by the script's own small static server on 127.0.0.1 (a deep route answers with `app.html`).
Chromium and WebKit (Playwright borrowed from MJRPpersonal), reduced motion, Firebase and **every host that is not 127.0.0.1 blocked**, the catalog (MusicKit) a stand-in (one artist with
14 albums; for the series, one album per query with three tracks), covers plain squares. One run at a time. Scripts: `proof.mjs`, `run-all.sh`, `summarize.py`; results of every run:
`summary.json` (the raw files stay in the scratch: 46 runs). Noise controls: the same build twice (`control-*`). Nothing is left running.

## A. The lean «Create» on the computer (React against `main`)

Lockstep on both builds, 40 checks per run (facts of each state: text, `aria-*`, the boxes of title, link, field, hint, dock, stage; the focus; a picture with the equalizer box masked):
first visit, «What is a series?» open and closed by mouse, open and closed by Enter, Escape on the link (closes), Escape in the field (stays), with an account: the account menu open and the focus
on the link (one Escape closes only the menu), typing, results, two chosen (the bar comes), the last removed (no bar, the strip to undo), paste, not found.

| Run | facts and focus | pictures |
|---|---|---|
| Chromium 1280×800, 1440×900, 1920×1080, visitor | all equal | all 0 px, except «two chosen» at 1280: 22 px, max 1/255 (the control `main` against `main`: 19 px, max 1/255) |
| Chromium 1280×800 and 1440×900, signed in | all equal | 0 px |
| WebKit 1280×800 (visitor and signed in), 1440×900 (signed in) | all equal | the top bar only, 4,886 px, max 116/255, rows 21-50 (the control: the same 4,886 px) |
| WebKit 1440×900 visitor, 1920×1080 | all equal | 0 px |
| iPhone 393 and 375 (WebKit), 393 and 375 (Chromium with the iPhone profile), visitor and signed in (393) | all equal; the sheet «What is a series?» opens by touch and closes with Escape on both; only `aria-haspopup="dialog"` on the phone | 0 px, except the animated wordmark of the top bar (22,533 px, max 129/255, rows 17-38) in some captures of 375 (the control shows the same box) |

The computer's attributes read on both sides: `aria-expanded` false/true, `aria-controls="homeWhatText"`, no `aria-haspopup`; no `#homeHow`; the stage `is-calm` before the first search.
Pictures: `img/create-*-main-vs-react-*.png` (`main` left, React right, 1/4 size). The difference between the old golden and the new one that the unit tests use: `golden-diff-start.txt`.

## B. No orange line while the series are read (the parent against the branch; `main` has it out already)

`/albums` and `/blend`, opened directly and by the menu, the series read held 1.5 s and returning two series with albums (the judges' seam: the `getDocs` of the data store rewritten, on both
sides alike, to wait and answer), probes at 250, 600, 1000 and 1400 ms. `#globalProgress` (or any fixed element of 8 px or less at the top):

| Run | parent | branch |
|---|---|---|
| Chromium 1280×720, WebKit 1280×720, WebKit iPhone 393 and 375, `/albums` and `/blend`, direct and by the menu | shown at 250, 600, 1000 and 1400 ms (every case where it applies) | **never** |

And `main` (read runs): never. **What stays on purpose, shown:** the router's bar for a slow screen file (F94 owns it): every script file held 2 s, the first click on the menu at once; parent and branch
both show the bar at 300, 800, 1200 and 1700 ms and hide it after (Chromium 1280×800 and WebKit iPhone 393).

## C. The Albums screen says it is loading (React against `main`, the series read held 1.5 s)

Position of the content during the read (top-bottom, px), `main` / React; the filter bar ends at 385 (computer, from a direct visit) or 112 (phone), the window height is in the first column; «from the menu»
means a click on the menu from `/start`.

| Window | engine | direct (main / React) | from the menu (main / React) | footer y during the read, direct (main / React) |
|---|---|---|---|---|
| 1280×720 | Chromium | 447-483 / 445-485 | 404-436 / 449-481 | 1040 / 1040 |
| 1366×768 | Chromium | 447-483 / 445-485 | 404-436 / 449-481 | 1040 / 1040 |
| 1440×900 | Chromium | 447-483 / 445-485 | 404-436 / 449-481 | 1040 / 1040 |
| 1280×720 | WebKit | 447-485 / 445-487 | 404-438 / 450-482 | 1041 / 1041 |
| 1366×768 | WebKit | 447-485 / 445-487 | 404-438 / 449-483 | 1041 / 1041 |
| 1440×900 | WebKit | 448-485 / 446-487 | 405-438 / 449-483 | 1041 / 1041 |
| iPhone 393×852 | WebKit and Chromium | 124-206 / 124-212 | the same | (the footer is not drawn on the phone) |
| iPhone 375×667 | WebKit and Chromium | 124-206 / 124-212 | the same | |

- The content is in view in every window (the bottom is far under the window's height) and **right under the filters** (about 60 px under the bar on the computer, 12 px on the phone), in Chromium and
  WebKit, direct and from the menu. The top-bottom pairs differ by the turn of the spinner's box (the box of a rotating square changes with the angle: the centre, 465, is the same) and, on the phone,
  by 6 px of the words' box (88 px of React against 82 px of `main`; the top is the same, 124). **From the menu `main` puts the content 45 px higher than direct** (the page's header row is drawn only
  when the read ends); React has it in its place from the first paint, so the position is the same direct and by the menu. That is a placement that does not depend on any number read at some moment:
  there is none (nothing in the page measures anything), so the stale placement the judge found on `main` (about 130 px low in WebKit when the grid is 52 px tall at the first paint) has no way to happen.
- Layout shift in Chromium when the list arrives (WebKit has no API; the footer position is the check there: 1041 during the read, 1642 settled, on both sides):

| Window | direct, at the swap (main / React) | from the menu, at the swap (main / React) | whole load (main / React) |
|---|---|---|---|
| 1280×720 | 0 / 0 | 0.0305 / **0** | 0.1102 / 0.1102 (direct), 0.1055 / 0.1055 (menu) |
| 1366×768 | 0 / 0 | 0.0288 / **0** | 0.1032 / 0.1032, 0.0991 / 0.0991 |
| 1440×900 | 0 / 0 | 0.0279 / **0** | 0.0979 / 0.0979, 0.0946 / 0.0946 |

  From the menu the React screen takes the 45 px of the header row at the moment of the click (0.0305 at navigation instead of at the swap), so the whole is the same; at the swap it is 0, no worse than `main`.
  A first version of this port (the hidden box was only the grid inside the mount) measured 0.029 at the swap even direct, because the browser counts a visible box that moves; the mount itself is
  invisible now (`visibility: hidden`, as `main`'s), and the content is `visible`.
- Words on the phone «Loading your series…», the spinner on the computer, no «No albums in library» and no «No albums match» text visible during the read, in all of the runs.
- Settled screens equal `main` (picture, `/albums` and `/blend`, direct and by the menu): 0 px in Chromium 1366 (direct), 1280 and 1440 direct, and all the WebKit/phone runs except the known noise boxes
  (WebKit computer 4,886 px, rows 21-50, the top bar; phone 22,533 px, rows 17-38, the wordmark: the controls `main` against `main` show the same); Chromium «from the menu» 10 to 26 px, max 1 to 4/255
  (rows 175-203 or 40-47 or 382-384), not repeated in the one control run of 1440 (0). Blend: the same loading state, the same two cards after the read, 0 px.

## Regression sweep (the branch against its parent, with the parent against itself)

`/start`, `/albums`, `/blend`, `/playlists`, `/saved-playlists`, `/inventory`, `/artists`, `/genres`, `/tracks` with two series loaded: text, page height, a picture. Chromium 1280×800, WebKit 1280×800,
WebKit iPhone 393 and 375. Every difference is a difference the control shows too (the top bar 4,886 px; the wordmark 22,533 px; the animated «Coming soon» boxes, 7,300 to 88,000 px at most 35/255) or the
one that was meant: **`/start` on the computer** (text differs, 345,000 to 369,000 px: the lean screen), while `/start` on both phones is equal to the parent. Heights equal everywhere.

## Not proven

The real Firestore read of an account with series (the seam answers it); Safari of a Mac or an iPhone (WebKit of Playwright only); Firefox; a screen reader saying `aria-expanded`; the real catalog;
Portuguese in the app (nothing in the app calls `setLocale`; it opens only with the preview key); an iPhone at 3x with the keyboard open; monitors above 1920×1080.
