# F83 wave 8d: the proof that the closing is invisible (browser, BUILT sites)

**What was compared:** a site built from the parent, `66cb1ee` (the React line before this wave), against one built from this branch's tip, both with `npx vite build` through the machine queue (the parent from a `git archive` of the commit, in the scratch folder). Own static server answering deep routes; Firebase hosts (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`) and every external host blocked; no key in any file; MusicKit and Spotify are the stand-ins of the earlier waves. One run after the other, never two at once. This wave changed no screen, so the answer wanted is «nothing moved».

**The scripts are the earlier waves' own, unchanged** (so the proof does not move with the code it judges): the sweep of every screen, the Blend flow and the page-jump sequences (`sync-4/judge.mjs`), the notices, questions and the loading bar (`sync-4/notices-and-questions.mjs`, wave 8b), every sheet of every screen (`wave-8c/browser-proof.mjs`), the export windows (`wave-8a/browser-proof.mjs`) and the calls to MusicKit played on the built site against the golden (`wave-8a/recording-built.mjs`). New here: `titles.mjs` (the tab title on 18 routes), `run-sweep.sh`, `run-engines.sh` and `summarize.py` (the numbers, in `summary.json`). Each run has the parent against itself as the noise control. The pixel comparisons are strict: one picture, taken once, compared (`STRICT` in the sync-3 script is for that older script; the judge's script never retook a picture).

## The numbers

| What | Engine and profile | Branch against parent | Parent against parent (noise) |
|---|---|---|---|
| Sweep of every screen: 10 steps, 187 checks (DOM, boxes, focus, text, picture) | Chromium 1280 | **0 failed, 0 pixels** | 0 / 0 |
| the same | WebKit 1280 | 1 picture, 4,886 px, in the wordmark | the same 4,886 px (second run of the control) |
| Sweep: 6 steps, 106 checks | WebKit iPhone 14 | 5 pictures, 22,533 px (max 129/255), all in the wordmark box (x 48-446, y 50-115 at 3x) | 0 in one run, **48,112 px in another**; the same build against itself (new against new): 25,579 and 48,112 px |
| Sweep | WebKit iPhone SE | 1 picture, 9,780 px, wordmark | the same 9,780 px (7 pictures) |
| Blend flow: 33 steps, 611 checks | Chromium 1280 | 25 failed, 24 pictures, **max 3 px at 2/255** and one box of the turning spinner | **the same 25 / 24 / 3 px / 2** |
| Blend flow: 35 steps, 746 checks | WebKit iPhone 14 | 21 failed: pictures at 1/255 in the top bar (18,573 px) and the bottom bar (1,977 px) | 3 failed (a `__release` harness line, the same on both sides), 0 pictures |
| Page jumps (scroll): 3 steps | Chromium 1280 and WebKit iPhone 14 | 0 failed, 0 px | 0 / 0 |
| Notices, question windows, loading bar (wave 8b): 237 checks, 264 checks | Chromium 1280, WebKit iPhone 14 | **237 / 264 passed, 0 failed** (including the timeline of each notice, window and bar) | 237 / 264 passed |
| Every sheet of every screen (wave 8c) | WebKit iPhone 14: 960 passed, 1 failed; WebKit SE: 959 / 2; Chromium 899: **1,247 / 0**; Chromium 1280: 187 / 4 | see below: the failures did not come back | iPhone 14 961 / 0 |
| Export windows, from the saved playlists and the edit screen (wave 8a): Apple Music, Spotify, JSON file, closing | Chromium 1280, WebKit iPhone 14 (8 runs each) | the only failures are a page error on **both** sides (below) and one picture of 10 px at 1/255 | |
| **The calls to Apple Music** (the golden of 264 calls to `api.music`, played on the built site) | Chromium | **106 passed, 0 failed, 264 `api.music` calls compared, parent and branch alike** | |
| the same | WebKit | 102 passed, 1 failed, 256 calls compared, **parent and branch alike** (the failed line is the harness not finding `window.playlistsStore`, on both) | |
| The tab title on 18 routes (all the screens, the deviations `/home`, `/album-series`, `/series`, `/playlist-series`, `/callback`, and an unknown route) | Chromium 1280, WebKit iPhone 14 | **0 routes differ** (title and final address) | |

## What the differences were, and why they are not this wave's

- **The wordmark in WebKit.** Every picture difference at WebKit iPhone and 1280 lies inside the box of the flame wordmark of the top bar (`wordmark-parent-above-branch-below.png`: the same picture, two frames). The sweep **against itself** shows the same: parent against parent, 48,112 px / 129; this branch against this branch, 25,579 and 48,112 px; one control run came out clean, another did not. It was found by sync 4's judge too (22,533 px, 129 on the iPhone 14, 9,780 px on the SE, identical numbers). The CSS of the two builds is the same but for four rules of a utility class (`!btn`) that only the deleted hand-made code used. The DOM, boxes and focus checks of those steps all pass.
- **The Blend at WebKit iPhone 14 at 1/255:** in the top bar and in the bottom bar (chrome that is the shell, unchanged by this wave); the control had none in this run. Judged as the wordmark was: a one-in-255 level difference, no box moved.
- **The Chromium Blend: 3 pixels at 2/255 and the spinner box:** the same numbers in the control.
- **Wave 8c, timing checks:** one timeline event 4 ms over its tolerance (WebKit iPhone 14, the sheet when the window grows to 1100 px) and one slide timing (WebKit SE, saved playlists sheet, 302 against 201 ms): **neither came back** in 3 runs of the same scenario on the SE (real and control, 59 checks each, 0 failed) and one on the iPhone 14 (14 checks, 0 failed). Chromium 1280: 21 pixels at 18/255 on the albums screen in x 105-364, y 267-307: the control (parent against parent) has the same 4 failures.
- **The export windows (wave 8a): `removeChild ... not a child of this node`.** A page error on **both** sides in every Apple Music run (32 on each side over Chromium and WebKit). It is not this wave's (the parent has it), the harness did not have it in wave 8a, and I did not find its origin: it may be the harness (it adds one line to the end of a screen's file and drives the window through stand-ins) or the React line since wave 8a. **To look at before the owner's export on the preview** (listed in the closure report as an open item; nothing in the golden of the calls is touched by it: the 264 calls compare equal).

## What this proof does not prove

A real iPhone, the real Safari, the real Apple Music and Spotify, a real account's data, and Portuguese in the app. The first is not the Playwright WebKit with an iPhone profile; the second and third are stand-ins that note the calls; the fourth is data made here; the fifth is read by tests only.

## Not run on purpose

The full 11-run list of wave 8c (Chromium 900 and the Pixel profile), and the sweep at WebKit 1440 and the other widths of earlier waves: the screens did not change in this wave, the profiles that carry the risk (the phone in WebKit, the computer in Chromium) were run, with controls.

## Files

`summary.json` (every run: counts), `run-sweep.sh`, `run-engines.sh`, `titles.mjs`, `summarize.py`, `bundle-budget-wave-8d.txt`, `migration-status-final.txt`, `wordmark-parent-above-branch-below.png`. The raw logs and the builds are in the session's scratch folder and are not kept (the per-run result is in `summary.json`).
