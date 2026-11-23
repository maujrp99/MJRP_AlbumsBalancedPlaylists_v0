# F83 wave 3 - the browser proof of the shell

`browser-proof.mjs`; the shell as it was on port 5031 (the wave 2 tip, 610fc1b, its own copy of the tree), the shell as it is on 5032 (each dev server with its own cache of dependencies: a shared one made React load twice on the old side and gave a false «Invalid hook call»). Signed out, nobody signed in anywhere; a person is put in the user store when a step needs one; Spotify is a session in the page's storage with the account's name answered by a route stub. 1280 with a mouse, 900 (the drawer), 393 with touch. Four runs, as in wave 2:

| run | checks passed | checks failed | most pixels apart in a screenshot |
|---|---|---|---|
| new vs old | 130 | 3 | 12 |
| new vs old, transitions off | 130 | 3 | 12 |
| old vs old (the noise control) | 130 | 2 (by design, see below) | 0 |
| old vs old, transitions off | 130 | 2 (by design) | 0 |

**Old vs old is 0 pixels in every step, with and without transitions: the screenshots have no noise of their own.** The 2 «failures» of old vs old are the two steps that assert the two differences on purpose (the bar follows the address; the chevron turns): they cannot pass when both sides are the old shell, which is the proof that they test something.

## The 3 failures of new vs old, located

All three are the screenshot of the page with the sign-in window opened or just closed, at 1280; the DOM, the focus and the calls are equal. 2 px and 12 px, at x 1273 to 1278 and y 25 to 30 (the top-right corner of the page, where the page's scrollbar ends), with a difference of 0 to 3 levels of 255 in a channel. Repeatable (the same steps are 0 px apart old against old) but tiny: 12 pixels in a 1280x900 capture, none of them in the window or the shell; the cause was not isolated (it sits where the page's scrollbar ends, while the page is held behind the window). Nothing else on the page differs.

## What the proof found and fixed

1. **«Back to top» stopped half way with a real tap** (new only; scroll stuck at 1409 px with the old reaching 0): React, when a commit takes the focus from an element, puts the scroll back where it was at that moment, and the button hides itself on the way up. Fixed (`PhoneShell.tsx`: the button lets go of the focus first); `Shell.carried.test.tsx`; 0 px and the same scroll on both sides after.
2. Not the shell: a dev server with a shared dependency cache loads React twice (false «Invalid hook call» on the old side); the proof gives each server its own cache.

## The two differences on purpose, asserted

- The bar of the computer follows the address (the old one kept the highlight where it first was drawn): after a move to Inventory, old `["/start"]`, new `["/inventory"]`.
- The drawer turns the chevron of «Music Series»; the old one turned the music note: old `[true,false]`, new `[false,true]`.

## Not exercised

No account: «Sign Out» is not pressed (it calls the login and reloads the app); the sign-in window is opened and cancelled and the calls of Google and Apple are exercised only in the unit tests with a stand-in. Spotify: the connected pill, the account name and the app's own question before disconnecting are driven in the browser (the answer of the account is a stub); connecting needs Spotify's own page. There is no Apple Music control in the shell: «Sign in with Apple» (the window and the avatar of an Apple account) is what the shell has of Apple. «Clear Cache» (footer and phone) is proved by the unit tests, not clicked in the browser (it clears the album caches and reloads).

## First load (reports/evidence/F83/wave-3/first-load.mjs, 5 runs each, median; Fast 3G, CPU x4, no keys)

| | bytes of JS and CSS | first paint | top bar drawn | first screen has content |
|---|---|---|---|---|
| wave 2 tip (shell hand-made) | 322,491 | 656 ms | 2,155 ms | 3,737 ms |
| this branch (shell in React) | 407,902 | 796 ms | 2,546 ms | 4,111 ms |

React at the start costs +85,411 B and about +0.4 s on this slow profile; the screens in React that follow are only their own file.
