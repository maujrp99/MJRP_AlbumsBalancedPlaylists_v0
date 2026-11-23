# F83, third sync: the lean Start on the phone, in React, against `main` (b8947e0)

What was compared: the BUILT site of `main` (hand-made lean Start) against the BUILT site of this branch (React), in WebKit with the iPhone 14 profile at 393x852 and 375x667, and the computer at 1280 against the branch's parent (b143b4f) and against `main`. Firebase hosts blocked (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`); the catalog is a stand-in MusicKit (one artist, 14 albums; «Nobody» is not found); covers are plain squares; motion asked off. Script: `browser-proof.mjs`; results: `raw/results-*.json`; picture: `phone-393-main-vs-react.png` (old = main, new = React). The REAL MusicKit (developer token, Apple's catalog) is not exercised.

States, each compared by pixels (whole window), by facts (visible text, boxes, bottom padding, page height, title size, placeholder, aria-label) and by where the focus is: first visit, typing, results, three chosen, one left, last album removed (Undo strip only), paste, back from paste, not found, the list opened from «not found», sheet «What is a series?» open / closed by its button / closed by Escape, the series sheet from the bar. Visitor and signed-in person (a non-anonymous user saved in IndexedDB; Firebase restores it with the network blocked), plus: no visitor notice with nothing chosen, notice only for a visitor with an album.

| run | result |
|---|---|
| 393x852 visitor, main vs React | 45 of 45 (0 pixels apart in every state) |
| 393x852 signed in, main vs React | 45 of 45 |
| 375x667 signed in, main vs React | 45 of 45 |
| 375x667 visitor, main vs React | 45 of 45 on the last run; the first run had 2 states with 9,798 and 9,238 pixels apart, at most 2 of 255, around the search field (see noise) |
| noise control, main vs main (393, 375, 393 signed in, 1280) | the same states; 0 pixels apart, except the 375 first run: «typing» 11,488 pixels, at most 4 of 255, same place as the 375 sobra above (the fading ring of the focused field) |
| computer 1280, branch vs parent, WebKit and Chromium | 31 of 31 (0 pixels apart) |
| computer 1280, branch vs main, WebKit | 31 of 31 |

In every run the one line that says FAIL is the probe «a click on Search with the field focused starts the search», which main loses on purpose (it fails on `main` in WebKit: UAT-282) and the branch passes: the one difference left on purpose, and it is the branch that is right. The searches of all other states are made with Enter on both sides.

Noise and the two odd results, said plainly: (1) at 375 the first visitor run showed ≤ 2 of 255 on a ring-shaped area around the field in «typing» and «the list opened from the message»; main against main showed the same sort of sobra (≤ 4 of 255, same box) in the same round, and the final script re-takes a picture after 1.5 s when a difference is ≤ 4 of 255 or wholly inside the top bar; the re-run had no difference at all. (2) At 1280 in WebKit a first round had up to 13 of 255 in the top-right corner (the Apple Music button of the shell, not touched by this port) that is not in the final rounds. Neither was left without a place: both are transitions that were still running when the picture was taken.

The banner «Authentication issue» over the title in the pictures is the page with Firebase blocked (it is on both sides).
