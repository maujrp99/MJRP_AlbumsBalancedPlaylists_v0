---
type: visual-parity-recheck
feature: F83
step: wave 7b (the Blend screen in React)
branch: claude/f83-wave-7b-blend-screen
judged_on: 160c702
reference: ace99a9 (the branch's merge commit: hand-made Blend, equal to production)
judge: independent (did not build)
date: 2026-11-22
verdict: fail
p0: 0
p1: 2
p2: 3
---

# The Blend screen in React: independent visual parity recheck (F83, wave 7b)

**Verdict: fail. There is no P0, but there are two P1s.**

1. **The page jumps in Chromium.** On a computer, the page jumps up when an ingredient button is pressed near the bottom of the page.
2. **Publication would be refused.** The weight check fails on a build made the way the published one is made, with the keys.

Everything else is equal to the parent or explained:

- **Equal:** elements, text, boxes, focus, Tab order, toasts, the configuration handed to the generation, and the hand-over after a successful generation.
- **Explained:** the Chromium picture difference. Its cause is found, and nobody can see it.
- **The on-purpose difference is now proven in the browser:** focus and list position are kept when the covers arrive.

## How it was judged

- **Built sites.** Each side was built with `git archive` into this folder and `vite build`, run through the machine queue. Each was served by my own static server, which answers deep routes with `app.html` like the hosting does.
- **Seams.** Firebase and every external host are blocked, so MusicKit and Spotify are unreachable. The footer clock is fixed. `Math.random` is seeded, and seeded again just before each generation, so shuffled playlists come out the same on both sides.
- **Album dataset.** The local album dataset (`albums-autocomplete.json`) is replaced by a 5-row fixture. Its covers are PNGs served by my server, so real covers arrive.
- **Profiles:**
  - Chromium at 1280, 900 and 899, and with the iPhone 14 profile.
  - WebKit at 1280, iPhone 14 and iPhone SE.
- **Noise control.** Old against old was run at Chromium 1280, 900 and 899, WebKit 1280 and iPhone 14, and on the sweep.
- **Pictures.**
  - The window is captured page by page. There are no full-page pictures.
  - Toasts and the footer clock are hidden in pictures.
  - The script waits 1 s or more after sheets and toasts.
- **Harness:** `judge.mjs`, with flows `blend`, `many`, `covers`, `address`, `sweep`, `first`, `scroll2` and `tap2`. Probes: `probe-cause.mjs`, `probe-jump*.mjs` and `probe-fade.mjs`.
- **Results:** `out/*.json`, one file per run.

**The generation seam (point 3)** is identical text injected into the served chunk on both sides. On the old side it sits in `main-*.js`; on the new side in `BlendingController-*.js`.

- At the start of `generateFromSeries`, the seam records `{series, config}` with the keys sorted, plus the original key order.
- At the start of `_albumsFor`, an optional hook can hand back two fixture albums. Everything after that runs the real code on both sides: `PlaylistGenerationService`, the stores, the toasts and the navigation.
- The hook has three modes:
  - **stop:** fails at once with a message from the judge.
  - **ok:** succeeds.
  - **hold:** waits until it is released or aborted.
- The real path, with Apple Music blocked, was also driven.

## Findings

### P1-1: in Chromium, pressing an ingredient button near the bottom of the page makes the page jump up 112–254 px; the parent does not

- **Where:** `public/js/screens/blend/Blend.tsx`, `<GenerateSection key={draws} …>`. The whole step-4 `<section>` is mounted again on every draw.
- **What you see:** Chromium on a computer (Chrome, Edge), at 1280 and 900, with the page scrolled to its end. That is where the ingredients sit at 800 px height.
  - **By Album:** the page moves up 230 px and the pressed button slides 230 px down under the pointer. The parent does not move.
  - **Single, then Multiple:** the new page moves up 230 px, then 112 px more. The parent only drops 112 px once, because the page got shorter.
  - **Failure panel showing:** with the panel on screen, pressing Single leaves the page at 1293 against 1435.
  - **Capture:** `captures/jump-after-grouping-click-old-left-new-right.png` (old on the left).
- **Cause, proven:**
  - React removes the step-4 section, swaps the ingredient panel, and inserts the section back, all in one commit.
  - The panel swap removes the button that has the focus. Chromium then lays out the page while the section is missing, the page is shorter, and the scroll is clamped. When the section comes back, the scroll stays where it was clamped.
  - **Evidence 1:** MutationObserver order (`probe-jump.mjs`): `container -1`, `ingredients -1/+1`, `container +1`.
  - **Evidence 2:** no script call scrolls the page. The probe logged `scrollTo`, `scrollIntoView`, `focus` and `scrollTop`.
  - **Evidence 3:** clicking the same button with `element.click()` after a blur, so no focused element is removed, gives 1229 on both sides (`probe-jump-jsclick.mjs`).
  - **Evidence 4:** `overflow-anchor: none` changes nothing, so this is not scroll anchoring.
- **Not affected:** WebKit 1280 and iPhone are equal (`scroll2-webkit-*`).
- **Chromium phone (899, and the Chromium iPhone 14 profile, which stands for Android Chrome):** a smaller variant appears. After Single, Multiple moves the new page up about 101–116 px and the parent does not. Step 4 is hidden there, so this part is seen but not pinned.
- **The builder's proof missed it.** Its steps scroll the button into view first, which places it mid-window, so nothing is clamped. My main flow caught it on "single": `blend-chromium-1280` and `-900` show `scrollY` 1435 against 1293, and 1473 against 1360.
- **Check:** with the page scrolled to its end, press each grouping and structure button. Does `scrollY` stay as in the parent (no change, or only the clamp)? Probe: `PART=scroll2`.
- **Likely fix (the builder's call):** do what the parent did. Keep the outer `<section>` and put the draw `key` on the inside (`#blend-generate-section`), so the section never leaves the page.

### P1-2: the published build fails `bundle-budget.mjs`: publication would be refused

- **Where:** `scripts/bundle-budget.json` (`main` 195,033 and `background` 58,100). `scripts/lib/site-build.sh` runs `node scripts/bundle-budget.mjs "$dist"` on the build made with the `.env` copied in, and it dies when the check fails ("nothing was deployed"). `deploy-preview.sh` shares this file, so the preview is refused too.
- **How I measured without reading `.env`:** the same builds, with stand-in values of the right shape passed only through the environment and never written to a file. The Spotify client id was 32 random hex characters; the PostHog key was `phc_` plus 43 random characters.

| build (new, 160c702) | main script | after the first screen | sum (cap 431,537) | result |
|---|---|---|---|---|
| no keys (as the builder) | 194,889 | 236,603 | 431,492 | inside |
| Spotify id only | 195,033 (= ceiling) | 236,618 | 431,651 | **over by 114** |
| Spotify id + PostHog key | 195,079 | 236,615 | 431,694 | **over by 157, and main over by 46** |

- **Why it fails:**
  - The sum rule leaves only 45 B of room without keys (431,537 − 431,492).
  - The Spotify id alone adds 132–164 B to the main script. The ledger says 132 B; I measured 144 B on the new side and 164 B on the old.
  - The deploy refuses a build without that id, so the sum check cannot pass on a published build.
  - With the PostHog key as well, the `main` ceiling is broken too: it only allows +144 B.
- **Same gap as before:** this is the gap the 7a judge flagged, now proven on this wave. The parent `ace99a9` also fails (main 215,106 against 214,066), as the builder said.
- **Check:** with the real `.env`, does `bash scripts/deploy-preview.sh` (or `node scripts/bundle-budget.mjs` on its `dist`) pass?
  - Expected: no.
  - Fix: raise `background` by the keys' allowance (≈ 58,300) and leave room in `main` for both keys, or state that the check is made without keys and change the script to match.

### P2-1: the stepper marks and the series cards now fade (150–200 ms) on each choice; the parent changed at once. This is the source of the Chromium picture difference

- **Where:** `Blend.tsx` `Stepper` (`transition-all` on the marks) and `SeriesStep.tsx` `SeriesCard` (`transition-all duration-200`).
- **What changed:** React keeps these elements and changes their classes, so the CSS transitions now run. The parent rebuilt them with `innerHTML`, so nothing ran.
- **Evidence:** `probe-fade.mjs`. One frame after a click:
  - **Parent (Chromium and WebKit):** only the header equalizer runs.
  - **New, after choosing a series:** transitions of `background-color`, border colours, `color` and `box-shadow` on two step marks and one series card.
  - **New, after choosing a recipe:** the same on three marks.
- **What a person sees:** a short colour fade where there was a snap. It is noticeable only if you look for it, and it is not wrong. It is still a behaviour difference that nobody declared.
- **Check:** is the fade accepted? If not, add a `key` per draw on the stepper and the cards, or no transition on change.
- **The cause of the builder's unexplained pictures (main question 2)** is set out in its own section below.

### P2-2: choosing a series keeps the list's scroll position; the parent sent the list back to the top (not declared)

- **Where:** `SeriesStep.tsx`, the box that scrolls (`max-h-64 overflow-y-auto`), on the computer.
- **Evidence (`many-chromium-1280`):**
  - **List scrolled, then m9 chosen:** the list stays at 295 against 0 in the parent.
  - **m3 by Enter, m4 by Space:** 7 against 0.
  - **`?seriesId=m13`:** the new list ends scrolled to the chosen card (400). The parent revealed it, then lost it when the covers drew the list again (0). That part follows from the declared cover difference.
- **Phone:** equal. There is no box there.
- **Judgement:** better for the person, and in line with lesson 1 ("the scroll to the top of a redraw is not reproduced"). But the map declares only the cover case as on purpose, and the proof says "equal scroll".
- **Check:** declare it next to the cover difference.

### P2-3: every first screen now fetches one more small file (`playlists-*.js`, 619 B) before the screen's own file

- **Where:** `app.js`, the "expose stores" block. It imports `stores/playlists.js` dynamically on every load.
- **Why it is a file now:** before, the store was in the main script. Now only the shared controller file reaches it, so the bundler split it into its own file. The block then fetches it at start, at 82 ms against 103 ms for the albums screen file (`first` flow).
- **Weight:** negligible, and it is fetched in parallel. It is one more request on every cold first screen, in production too.
- **Check:** is that accepted? If not, import the store statically in `app.js`.

## What each requested point showed

**1. Every state of the Blend: equal apart from P1-1, P2-1 and P2-2.**

- **Computer (Chromium 1280 and 900, WebKit 1280), 33 steps each, covering:**
  - no choice and a series chosen;
  - each recipe;
  - Top 1 and Top 10, the five groupings, the three structures and the three sources;
  - the slider by keys (two Left, three Right, End, Home), by mouse click at 75 % and by drag to 30 %, then a button after it;
  - Tab through 34 stops;
  - each recipe's generate (failure panel), single, the real path (sources blocked: still "Blending…" at 8 s on both sides), generating, and success.
- **Phone (Chromium 899 and iPhone 14, WebKit iPhone 14 and SE), 35 steps each, covering:**
  - the series row;
  - the sheet: open, search "rush", no result, cleared, a row chosen;
  - the sheet with 14 series: a search, a name with `&amp;`, reopened with the choice marked, closed by X;
  - the bar note, the bar button, a slider tap.
- **Matched on every step:** elements, attributes, classes as a set, text, field values, the accessibility tree, every box, focus, scroll, page width, toasts and Tab order (except the scroll in P1-1).
- **Toasts:**
  - success: "Judge notice: 1 album left out", then "Generated 1 playlist(s)!";
  - visitor on `?seriesId=`: "Authentication issue. Some features may be limited.", on both sides.
- **No series:** "No series" was the same.
- **`?seriesId=`:** a known id comes chosen; an unknown id comes with no choice.
- **Leaving while loading** (generation on hold, then `/albums`): the load was aborted on both sides, no toast, no page error, even after 1.5 s more.
- **Back and Forward:** Back shows the Blend again with no choice. Forward goes to `/albums`.
- **Remaining box differences:** only the rotating spinner box, also present old against old.
- **WebKit phone pictures:** a difference of 1/255 over large areas. Old against old shows the same: it is noise.
  - iPhone 14: 8 pictures differ.
  - SE: 11 pictures differ, and old against old has the same 79,956 px block.
- **Not reached in the main phone flow:** the hold-then-success step. The real-path generation was still "Blending…" (button off) on both sides, so the judge's taps found it off; the harness logged `__release` missing on both sides. The `tap2` probe covered that step instead (point 5).

**2. The Chromium picture differences: cause found.**

- **The pixels:** an orange glow left behind at the edge of a step mark, at most 6/255, never seen by eye.
- **The mechanism:** React keeps the stepper marks and changes their classes, so `transition-all` animates the glow of the step that stops being current (`shadow-lg shadow-orange-400/30`). When the transition ends, Chromium leaves those leftover pixels at the edge of the mark until something repaints that spot.
- **Where:**
  - **Computer:** at the stepper's left edge, 16–25 px at most 5/255.
  - **Phone (899):** along the stepper's top edge, 28–30 px at most 6/255, on every step after a series is chosen. Old against old at 899 is 0.
- **Proof** (`probe-cause.mjs`, at the builder's 1280 × 3200, after choosing a series): old against new 16 px at most 5/255, at x 431–436 and y 234–314 (the stepper); old against old 0.
  - No transitions on the page, or only on the stepper: **0**.
  - No box-shadow on the stepper: **0**.
  - One forced repaint (`transform` on `body` for two frames): **0**.
  - The DOM rebuilt as the parent did (`innerHTML`): **0**.
  - No animations: still 16 px at most 5.
  - No backdrop blur: 1 px.
- **Not the cause:** the backdrop blur, gradients, split text nodes, `will-change` (no element has one) or image decoding. It is not just noise either: old against old is 0 in every experiment.
- **Remaining 1/255 lines:** the 1/255 lines across the slider row at 1280 and 900 (11 px) also appear in old against old (6 px at most 1/255). That is noise.
- **Can a person see it?** No. It is at most 6/255 over at most 31 px, and it goes away at the next repaint. What a person can notice is the fade itself (P2-1).

**3. Proved in the browser.**

- **(a) The configuration is identical on both sides,** for every call on every profile: values, and the key order `algorithmId,targetDuration,rankingId,outputMode,groupingStrategy,trackCount`. Examples (1280):
  - `{"algorithmId":"top-n-user","groupingStrategy":"shuffle","outputMode":"single","rankingId":"balanced","targetDuration":4500,"trackCount":10}`
  - The panel to generate again: `{"algorithmId":"top-n-popular","groupingStrategy":"flat_ranked","outputMode":"multiple","rankingId":"bea","targetDuration":3900,"trackCount":7}`, the same on both sides.
- **(b) A successful generation hands over the same way.** The fixture albums go through the real generation service and stores. Then on both sides:
  1. the notice toast;
  2. "Generated 1 playlist(s)!";
  3. `/playlists?seriesId=bs1`;
  4. the playlists screen with equal DOM, text and boxes (shuffle seeded).
- **Where (b) was checked:** computer runs and Chromium 899. On WebKit iPhone 14 and SE and on the Chromium iPhone profile, the bar-button probe (`tap2`) checked it.
- **Generating:** "Blending…" with the button off, and the progress text the judge sent, are the same on both sides.

**4. The on-purpose difference: conclusive.**

- **Why the builder's attempt saw nothing:** it delayed the album dataset. The search worker answers `SEARCH` at once with no results while the dataset is not ready (`search.worker.js`), so the covers "arrived" (as empty slots) immediately.
- **What I did instead:** I delayed the worker's search answers by 6 s, with one line appended to the worker file on both sides. The real covers then arrive about 6–9 s after the screen opens. Before they arrived, a card (m6) had the focus, the list was scrolled 100 px and the page 120 px.
- **Computer (`covers-chromium-1280`):**
  - **Old:** focus goes to `body`, and the list goes back to 0.
  - **New:** the focus stays on m6, and the list stays at 100.
  - The page scroll is 120 on both sides; 27 covers on both.
  - Capture: `captures/covers-chromium-1280-old-left-new-right.png`.
- **Phone (Chromium 899, WebKit iPhone 14):** the old side loses focus from the series row (`#blend-series-pick`) to `body`; the new keeps it.

**5. The fix for the phone bar button: sound.** Probe `tap2` on WebKit iPhone 14 and SE and the Chromium iPhone profile:

- one tap that fails, then another tap: each makes one generation, and the button stays on;
- two quick taps (80 ms apart) while loading: **one** generation on both sides, the button off, `aria-busy`, "Blending…";
- after release: `/playlists?seriesId=bs1` and the same toasts;
- focus is `body` throughout, as in the parent;
- `:hover` on the button is the same as in the parent after every tap: on in WebKit, off in Chromium, because each tap meets a new button on both sides.

**6. Regression sweep: no regression.** Chromium 1280 and WebKit iPhone 14: `/start`, `/albums`, `/inventory`, `/saved-playlists`, `/artists`, and the playlists screen with a set.

- **Computer only, the panel to generate again** (it is closed on the phone and needs "⋯"): opened, top-n-popular Top 7, slider −10, generated with the judge's albums.
- **Result:** elements, text, boxes, focus and toasts are equal. The configuration is equal, and so is the result: "Generated 1 playlists".
- **Pictures:** one 35 px at 2/255 in the top bar (Chromium). The old-against-old run of the WebKit iPhone sweep also shows the animated logo (129/255).

**7. Weight.**

- **My builds without keys** match the builder: main 215,106 → 194,889 (−20,217) and after the first screen 216,670 → 236,603 (+19,933). The `background` need is 431,492 − 301,437 − 72,000 = 58,055, so the 58,100 ceiling holds without keys.
- **Justified:** the view, the four pieces and the cascade leave the main script. The controller, the generation service and the algorithms become a shared file of 10,350 B (`BlendingController-*.js`) that the Blend and the playlists screens import. The Blend file is 5,795 B.
- **The Blend file is not on the first screen.** It and the controller file come at 182 ms, among the background prefetch after the first screen's file (103 ms), like the other screens. The only new early file is P2-3.
- **With keys, publication fails:** P1-2.

## What I could not see

- Real MusicKit and Spotify, and a real signed-in account: the seams stand in for the album load.
- The real `.env` values. I reasoned from stand-in values of the right shape.
- Chromium iPhone SE.
- The "loading series" state, because a visitor's read is immediate. A failed read of the series.
- A real touch device, and real Safari on a Mac. P1-1 is absent in Playwright WebKit.
- The exact Chromium step that lays out mid-commit. The cause is proven by elimination, not traced inside the engine.
- The phone variant of P1-1 (899 and Chromium iPhone) is seen but not pinned.
- The playlists screen after a success on WebKit, beyond its URL and toasts. Its DOM was compared on Chromium.

## Files (this folder)

- **Scripts:**
  - `judge.mjs`, `sum.mjs`, `sbs.mjs`;
  - `probe-cause.mjs`, `probe-jump.mjs`, `probe-jump-jsclick.mjs`, `probe-jump-shot.mjs`, `probe-fade.mjs`;
  - `build.sh`, `batch1.sh`, `batch2.sh`.
- **Budget outputs:** `budget-{old,new}-{dist,dist-cid,dist-keys}.txt`.
- **Run results:** `out/*.json`, one per run, with the A/B pictures of differences.
- **Captures (all under 1 MB):**
  - `captures/jump-after-grouping-click-old-left-new-right.png`, `jump-before-…`;
  - `captures/covers-chromium-1280-old-left-new-right.png`;
  - `captures/stepper-glow-1280-old-left-new-right.png`;
  - `captures/899-top-band-old-left-new-right.png`.
- **Sides:** `old/` and `new/`, the archives and their builds. `trash/` holds the first copies of `node_modules`, which lacked `@vitejs/plugin-react` (moved aside, not removed).

Nothing in the repository was written or removed. All servers were opened and closed by the scripts, and no job of mine is left running.
