# F83, sync of main: the proof that the menu in React is the menu of `main` (F88)

The reference is the build of `main` (1330ba9, the hand-made menu, in production); the other side is the build of the branch `claude/f83-sync-main-and-the-new-menu`. Both are BUILT (`vite build`, served by `vite preview`), Firebase Auth and Firestore blocked, motion asked off, Apple Music a stand-in script (the real MusicKit needs the developer token of the server and Apple's catalog and was not exercised). Nobody is signed in on these pages (Firebase is blocked); the signed-in states are proved by the unit golden.

## 1. The page, element by element (jsdom)
`test/shell/Shell.sameAsBefore.test.tsx` against `test/fixtures/shellBeforeF88.json`: 55 scenarios captured from the hand-made shell of `main` (`capture-before.test.js`, run in a worktree of `main`): the computer's bar on each route, the account panel (click, Escape, arrow, outside), every Apple Music state (asked on open, connected, not connected, cannot be told, fails to connect, disconnects after the question), Spotify (not connected, connected, the name as text, the name late, connecting while the shell is on), Clear album cache from the panel, the bar drawn again when the user store tells, the focus, the phone (bars, the bottom menu on each address, the Menu sheet with the connections, the question before clearing the cache, the window to sign in). 55 equal (attributes, focus, calls to the outside); ONE difference on purpose: a click on «Connect» in the panel leaves the panel open (the hand-made one closed it by accident). The test also accuses a changed word, a changed class and a moved focus.

## 2. The pixels (`browser-proof.mjs`; results in `browser-proof-results-*.json`, pictures in `captures-*/` for the first three of each run and for what differs by more than 1 of 255)

| run | checks | pixels apart (branch against `main`) | control (`main` against `main`) |
|---|---|---|---|
| Chromium, computer 1280 | 39 | 0 on every route's bar, every panel state, the dots, the Apple Music connect; 3 routes (/artists, /genres, /tracks) differ by at most 1 of 255 on 107 to 265 pixels at y 160-169 (below the bar, the «coming soon» screens) | 0 to 2 routes of the same noise, run to run |
| Chromium, 800 px (the range 768-899, phone layout) | 40 | 0 | 0 |
| WebKit, iPhone 14 | 40 | 0 | 0 |
| WebKit, iPhone SE | 40 | 0 | 0 |
| WebKit, computer 1280 | 39 | 0 on every panel state; the same 3 routes differ by at most 3 of 255 at y 160-169 | the same routes, at most 2 of 255 |

Each run also compares: what Apple's script was asked (the same calls), the focus after Escape and after the arrow on the account button, the order of Tab through the panel, the address and the focus after a click or a tap on a stop, the bottom menu of the home and the passage home to app, the bottom menu with the root font at 130 % (larger text), and that no label sits over the row of bars (the rectangle of each label against the row, 0 over, old and new).

One difference showed only in the browser, on the built site, and was fixed: the arrow down on the account button focused the Apple Music button that the check of Apple Music then took away (the focus went to the page). Now `flushSync`: open, ask, draw, then focus the first control that is left (`public/js/shell/Account.tsx`). A single cold-start difference of the first page of the first WebKit computer run (the bars of the old side thinner, on /start) did not come back in six repeated runs and not in the final run.

## 3. What was not proved
The real MusicKit (token route and catalog), a signed-in person in the browser (Firebase blocked), the equalizer in motion (the motion was asked off so the pixels hold still), a real iPhone, Safari on a Mac with the system's own settings, the keyboard on Mac Safari (it does not Tab to buttons by default: the Tab order there is only the order of the fields).

## 4. Weight
`bundle-budget-sync-main.txt`: the main script 233,446 B gzip against 231,568 B after wave 5b (without the keys of the publishable build); the ceiling is 233,590 B.
