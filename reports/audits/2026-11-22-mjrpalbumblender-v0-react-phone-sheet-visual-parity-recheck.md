---
type: visual-parity-recheck
feature: F83
step: wave 8c (the phone sheet engine in React)
branch: claude/f83-wave-8c-phone-sheet
judged_on: a1ac74f
reference: claude/f83-sync-4-create-and-the-three-lines at 1693d71
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 4
coverage: complete (every profile, scenario and control asked for ran to its end; the only thing not seen is a real iPhone)
---

# Wave 8c, the phone sheet in React: independent visual recheck

**Verdict: pass.** P0 0, P1 0, P2 4. No sheet regresses on any profile. Every difference against the parent is one of these:
- the declared difference (a), seen in more places than the builder listed;
- one 8 px page position on the Blend screen when the window grows past 899, which nobody can see;
- noise, which the parent-against-parent control shows in the same places.

## How it was judged
- **Builds.** I packed both commits with `git archive` into this folder and built each with `vite build` through the machine queue (label `f83-8c-judge`). Then I copied css, assets, `firebase-config.js` and the favicon in, as `site-build.sh` does. No `.env` exists in either archive, and none was read.
- **Script.** My own script, `judge.mjs`, runs **one side at a time, with one browser context open at a time**. The parent goes first, then the branch. The runs went **one after the other** (`pass2/runall.sh`).
- **Blocked:** the Firebase hosts (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`) and every host outside 127.0.0.1.
- **Stand-ins:** MusicKit (either the artist search for the Start screen, or the repo's own `musicKitRecorder.js` for the export) and Spotify (a stand-in token).
- **What each sheet goes through.** Every sheet is opened by a real tap. It is then closed by its button, by Escape, by a tap outside and, in Chromium, by drags on the handle and on the header (real touch events sent through CDP, the browser's own control channel). For each step the script records:
  - the markup of the layer;
  - the focus;
  - the page lock and `scrollY`;
  - a capture of the viewport (never a full page);
  - the timeline of the sheet: it comes, it is marked closing, it leaves; the page is held, then given back;
  - the slide frame by frame: the panel's `translateY`, the backdrop's opacity, and how many children the body holds at each animation frame.
- **Raw output:**
  - Pass 1 (iPhone 14): `out/`.
  - Pass 2 (all other profiles and the controls): `pass2/raw/*.json` and `pass2/*.log`.

## The runs

The «differ» column counts every check that is not equal between parent and branch, noise included; the last column says what those differences are.

| Profile | parent against branch | Parent against parent (noise) | What differs |
|---|---|---|---|
| WebKit iPhone 14 (393×852) | 1,501 pass / 30 differ, plus re-runs of the dock, rank and clear-cache scenarios: 82/0 and 91/4 | 1,554/14, plus a re-run 150/0 | (a), P2-1, P2-2; everything else also in the control |
| WebKit iPhone SE (375×667) | 1,549/36, plus a re-run of rank and the export 118/4 | — | (a), P2-1, P2-2; noise of the same kind as the controls |
| Chromium Pixel 7, touch through CDP | 2,304/41 | 2,328/17 | (a), P2-1; captures noise (the same boxes in the control) |
| Chromium 899 px, touch | 2,307/38 | — | the same as the Pixel 7 run, plus 1 px of the glide (P2-4) |
| Chromium 1280 | 58/2 | 58/2 (the same two captures) | noise only: nothing changed |
| WebKit 1280 | 59/1, and a 2nd run 58/2 | — | the animated logo (x 16–196, y 21–50), on a different screen each run: noise |
| Blend crossing 899→900 with the series sheet open (iPhone 14) | 2 runs: page position 491 on the parent against 483 on the branch, both times | control 20/0 | P2-2 is real and reproducible |

**What matches on every phone profile:**
- **Markup and classes** of every sheet:
  - Create: «What is a series?» and the series sheet from the bar (its title count changes while it is open);
  - Albums: album and filters;
  - Inventory: item, status, filters, actions, jump, values;
  - Saved playlists: batch, series, filters;
  - Playlists: playlist, track, «Export»;
  - the Menu; Blend (the series step with its search); clear-cache (a sheet from a sheet; «Cancel | Clear cache»);
  - the ranking window's phone sheets («Move to…» and the discard question);
  - the export form.
- **Behaviour:** focus on open and on close; the page held and given back; scrolling inside a long sheet (`overscroll-behavior: contain`, the page does not move).
- **Slides:** the curves match frame by frame, and «closing» to gone takes 198–204 ms on both sides.
- **Reduced motion:** no slide on either side.
- **Landscape** (852×393): identical.
- **Typing in a field inside a sheet:** the Blend search («queen 1» gives 2 of 30, and the field keeps the focus) and the inventory edit form both match.
- **The kept defect is identical on both sides.** A question opened from a sheet sits under it (the sheet's z-index is 1000), the first Escape closes the sheet and the second cancels the question.

## The drag thresholds (Chromium, Pixel 7 and 899, real touch through CDP; the same on both sides)

The drags were measured on all 14 bottom sheets of each profile:

| Drag | Result |
|---|---|
| 60 px on the handle | the panel follows the finger (`translateY(60px)` during the drag), then snaps back and stays open (14/14) |
| 80 px | stays open (14/14) |
| 81 px | closes (14/14) |
| 100 px on the header | closes (14/14) |

So the threshold is **«more than 80 px»**, as in the parent. WebKit has no touch drag in Playwright, so it could not be tried there.

## The builder's two unexplained differences

**Pixel 7, `scrollY` 183 against 185 after a 140 px drag on the inventory item sheet. Cause found: a glide of the page.**
- When the drag closes the sheet, the page is given back at its place (200). Then the page **glides about 22 px towards the top in about 200 ms**: 200 → 196 → 192 → 189 → 187 → **185 → 183** → … → 178. This is the momentum of the finger's drag reaching the page once it is free.
- Parent and branch draw the **same curve** in every round (200→178, 178→156, 156→134), in both Chromium profiles.
- The builder's 183 and 185 are two frames of that same glide, read about 17 ms apart. It is not a difference between the engines.
- In my 899 run the same reading gave 157 against 156 (1 px), for the same reason.
- **Does the page visibly move? Yes, by about 22 px, on both sides.** This is a kept behaviour, not a regression (P2-4).

**WebKit 1280, the one capture with 3,521 pixels: not reproduced.**
- In two real runs, the only differences were 4,886 pixels at the animated logo (x 16–196, y 21–50). They fall on a different screen in each run (Blend in one, Start and Saved playlists in the other): noise.
- In Chromium 1280, parent against branch is identical to parent against parent (the same 2 captures). **Nothing changed on the computer:** no sheet appears there.

## Findings
- **P2-1. Difference (a) also happens when an action inside a sheet leaves the screen, which the builder's list does not name.**
  - Where:
    - Saved playlists, series «⋯» → «Open the album series»;
    - the ranking window, «Back» → «Discard» (the window that owns the sheet closes).
  - Evidence: on the parent, an empty sheet (0 children in its body: only the title, the ✕ and the dark backdrop) slides for 210–229 ms over the next screen. On the branch it is gone in 2–29 ms. Seen on iPhone 14, SE, Pixel 7 and 899. Capture: `captures/saved-open-series-40-100ms-parent-branch.png`.
  - Check: an improvement, since the new screen appears in the same frame. Add this case to difference (1) in the proof and the lessons.
- **P2-2. Blend, crossing 899→900 with the series sheet open: the page ends 8 px higher on the branch.**
  - Evidence: iPhone 14 gave 483 on the branch against 491 on the parent, twice; the parent-against-parent control gave 0 differences. iPhone SE gave 579 against 587.
  - Likely cause, from the order of events: the parent lets the page go while its sheet, unstyled at 900, is still in the page; the branch removes the sheet first.
  - Check: invisible, because the page switches to the computer layout at that very moment.
- **P2-3. Difference (b) cannot be reached by a tap today.** While a sheet slides away it still takes the taps: a tap made then, by coordinates, reaches nothing, on both sides. No screen opens two sheets in a row from the same hook. Harmless.
- **P2-4 (kept, both sides). The page glides about 22 px after a drag closes a sheet** (Chromium touch; the cause is above). Not a regression. Check on a real iPhone whether Safari does the same.

## The three things judged hard
1. **The on-purpose differences.**
   - The owner's most frequent gesture, a Menu item such as «New playlists», does **not** vanish: on both sides the Menu slides out in full with its 5 rows. The shell stays mounted, so the sheet keeps its slide.
   - A sheet vanishes at once only when the part that opened it goes away:
     - when the window crosses 899 (unstyled, invisible);
     - «Open the album series» and «Discard» (clean, where the parent left an empty panel).
   - (b) cannot be reached by a person.
   - Both are improvements or neutral, and none of them looks like a glitch.
2. **The three defects the builder fixed.**
   - The `setTitle` loop: no hang on any filters sheet. 0 page changes in 1 s idle and the main thread was free (the setTimeout loop above 150 ticks), on both sides.
   - Siblings, found by reading the code. All are bounded or harmless:
     - `PlaylistExportWindow` calls `setTitle` only when its view changes;
     - `Dock.tsx` calls `close()` from an effect, which stops once `isOpen` is false;
     - no other screen draws its sheet layer in two places;
     - the Saved playlists and Blend layers exist only on the phone, so they fall under difference (a).
   - `sheet--closing`: the class is in place 100 ms after the close, as in the parent.
3. **The unexplained differences:** explained above (a glide of the page; animated-logo noise).

## Also checked
- **The Apple Music export from the phone form**, one playlist into an existing folder: the MusicKit calls match one for one on iPhone 14 and SE (token, configure, getInstance, authorize, GET folders, 2 catalog searches, POST the playlist into the folder).
- **The recording** `test/fixtures/exportMusicKitRecording.json` is byte-identical between the two commits (sha1 `84358723…`).
- **Weight** (`budget:publication`, stand-in keys held only in the environment, output in this folder):

  | Measure | Parent | Branch | Ceiling |
  |---|---|---|---|
  | Main script | 195,804 B | 194,827 B (−977 B) | 194,987 B |
  | Main + after | — | 430,090 B | 430,257 B |
  | react-vendor | — | 68,691 B | 72,000 B |

  The branch's numbers are exactly the builder's.
- **Regression sweep:** the screens at 1280 (Start, Albums, Inventory, Saved playlists, Playlists, Blend) in Chromium (the same as the control) and in WebKit (logo noise only).

## What the owner should try on his own iPhone (on the preview)
1. Drag a bottom sheet down with a finger, a little (it should snap back) and then far (it should close). For example the inventory row «⋯».
2. Right after the drag closes it, watch whether the page behind glides a little (P2-4).
3. In a long sheet (inventory «Filters and order»), pull past the end: the rubber-band should stay inside the sheet, and the page behind should not move.
4. Blend, «Choose a series», type in the search: the on-screen keyboard should not hide the field or the list.
5. Turn the phone to landscape with a sheet open, then back: the sheet clears the notch and the home bar.
6. Saved playlists, series «⋯» → «Open the album series»: the Albums screen appears clean, with no empty panel over it.

## Not seen
- A real iPhone: the real keyboard, the rubber-band, the safe areas, and a finger drag in Safari.
- A touch drag in WebKit: Playwright cannot do one.
- Nothing else that was asked is missing. The first control runs of three iPhone 14 scenarios (the edit form, the ranking window, the export) and two first SE runs (the ranking window, the export) stopped on page-load timeouts. All five were re-run in full: 150/0 and 118/4, the 4 being P2-1.

Files in this folder: `judge.mjs`, `build.sh`, `budget.sh`, `pass2/runall.sh`, `out/`, `pass2/`, `captures/`.
