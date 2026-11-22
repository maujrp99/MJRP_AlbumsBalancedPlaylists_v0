---
type: visual-parity-recheck
feature: F79
branch: wip/f79-create-lean-computer-and-no-loading-line
judged_on: 0364a13
reference: design/proposals/f79-create-lean-computer (Enxuta); main at 336385a for the phone and the other screens
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 2
---

previous: pass at 10649f8 (1 P1 decision, 4 P2)

# F79 · re-check after 0d0ff95, e78f1a4, 10a0808 (tip 0364a13)

**Verdict: pass.**
- The Albums screen now says it is loading for the whole series read. When the read returns series, it goes straight from loading to the list, with no flash of the empty state, on the computer (Chromium and WebKit) and on the iPhone (WebKit).
- One Escape now closes one thing.
- The phone's «What is a series?» button carries only `aria-haspopup="dialog"`.
- On the phone, the `/start` screen is pixel-identical to `main`.
- Previous P1-1 and P2-1 are fixed, and so is P2-2. Previous P2-3 and P2-4 were not in scope and are unchanged; they are not counted again.

## How

- Scripts are in `recheck2/work/`: `common.mjs`, `server.mjs`, `runL.mjs`, `runEsc.mjs`, `runA.mjs`, `runOther.mjs` and `diff.py`. Raw captures and facts are in `recheck2/work/raw*`.
- `git archive` of `336385a` («main») and `0364a13` (branch). Both were built with `vite build` through the machine queue (`f79-lean-computer-judge`), and each was served by its own static server (6491 for main, 6492 for the branch).
- Playwright 1.56.1, borrowed from MJRPpersonal.
- Firebase hosts are blocked. The stand-in account's auth lookup is answered locally, and no password is typed. The catalog is a MusicKit fixture.
- **The seam for a person WITH series:**
  - The static server rewrites, on both sides alike, the one `getDocs` of the site's data store (`repositories/firestoreStore.js`, one match per bundle). The rewritten call asks `window.__fakeGetDocs` first.
  - The page then answers the series list (`users/<uid>/curator/data/series`) with two series of fictional albums: «Radiohead early» with 3 albums and «Radiohead 2000s» with 4, after a chosen delay. It can also answer with none, or fail.
  - Every scenario runs in a fresh browser context, so no series are cached.
  - `main` was run twice as a noise control.

## Albums: loading, then the list

The read is held 1.5 s unless the row says otherwise. Sampling every ≈40 ms, the screen states were:

| Profile | read returns series, direct to `/albums` | the same, through the menu | fast read | Refresh with the list on screen | read returns none | read fails | signed out |
|---|---|---|---|---|---|---|---|
| branch, Chromium 1280 | loading @132 → list @1635 | loading @0 → list @1526 | list @129 (no loading) | list kept, no loading, no empty | loading → empty @1636 | loading → empty @1621 | empty @306, at once |
| branch, WebKit 1280 | loading @96 → list @1587 | loading @0 → list @1526 | list @95 | list kept | loading → empty | loading → empty | empty @105 |
| branch, WebKit iPhone 393 | «Loading your series…» @101 → list @1642 | «Loading your series…» @0 → list @1551 | list @88 | (no Refresh button on the phone) | loading → empty | loading @112 → empty @1618 | empty @104 |
| main (twice, identical) | **empty @≈100 → list @≈1610** | empty @0 → list | list | list kept | empty | empty | empty |

- **No flash of «No albums in library» before or after**, for a person with series, in any branch profile. On `main` the same person sees the empty state for the whole wait.
- On the phone there is one sample of nothing between the words and the list (≈40 ms). The second `main` run shows the same blank on the phone, so it is noise.
- **The loading pieces:**
  - On the computer it is the spinner, inside a `role="status"` with `aria-live="polite"`.
  - On the phone it is the words «Loading your series…».
  - The header («Create › Albums / All Albums Series / BLEND YOUR ALBUMS»), the search, the filters and Refresh stay where they are.
- **Blend's markup is unchanged:** during the held read, the spinner's `outerHTML` on `/blend` is byte-identical between main and the branch, and so are its whitespace and classes.
- **Settled screens are identical to main:** 0 pixels differ in 23 of 23 settled `/albums` screens (list, list after Refresh, none, fail, signed out; three profiles). Main against main is also 0.
- **Layout shift (Chromium 1280, direct load):**
  - The list replacing the spinner scores 0.041. Main's list replacing the empty state scores 0.040. The cause is the same: the footer moves down.
  - The empty card replacing the spinner (read returns none or fails) scores 0.141. On main there is no swap at all here.
- **Layout shift (Chromium 1280, through the menu):** see P2-A.

## Findings

### P2-A · Opened from the menu while the series are read, the Albums screen jumps when the list arrives
- **Where:** `/albums` reached by the menu, Chromium 1280, read held 1.5 s.
- **Evidence:** `recheck2/captures/albums-loading-to-list-computer-1280.jpg`; the `list-held-nav` shifts in `recheck2/work/rawL/*/c1280-chromium.json`. The layout-shift score is **0.663 on the branch** against 0.112 on main.
  - Already on main: the «By Album / By Artist…» tab row appears only when the list arrives, so the whole header drops 45 px (y 125 → 170).
  - New on the branch: the spinner area is short, so the «Last updated» footer sits mid-screen at y≈516 and is pushed off-screen when the list arrives. On main the tall empty card kept it off-screen.
  - With a direct load the tab row is already there and the swap scores only 0.041.
  - A person sees a spinner, then the list arriving and the header nudging down. It is noticeable but not misleading.
- **Check:** keep the loading block at least as tall as the empty card (for example a `min-height` on the loading state). Optionally, show the tab row from the start.

### P2-B · Empty card replacing the spinner shifts the page by 0.141 (read returns none or fails, computer)
- **Where:** `/albums`, Chromium 1280, `none-held` and `fail-held`.
- **Evidence:** the builder measured the same 0.14. It comes from the empty card being taller than the spinner.
- **Check:** the same fix as P2-A covers it. It only matters for an account with no series or a failed read.

## Escape (Chromium and WebKit 1280, branch)

| Setup | One Escape |
|---|---|
| Sentence open, account menu open | closes **only the menu**: the sentence stays open and focus returns to the menu button (`a_after1`). A second Escape with focus on the menu button leaves the sentence open, as intended (focus is not on the link). |
| Focus on «What is a series?», sentence open | closes the sentence; focus stays on the link |
| Focus in the artist field, sentence open, «Radio» typed | does **nothing**: the sentence stays open and the text stays. This change is intentional. |

## The phone and `/start`

- **The button's attributes:** iPhone 393, before and after the tap, the attributes are `type=button, class=home-what, aria-haspopup=dialog` only, and the sheet opens. At 899 px they are the same. On the computer they are `aria-expanded` (false, true when open) and `aria-controls=homeWhatText`, with no `aria-haspopup`.
- **Phone and boundary pixels:** **0 differ in 88 of 88 pairs** against main (iPhone 393 and 375, 899 Chromium and WebKit, 11 states, signed in and out). Main against main is also 0.
- **The computer `/start` re-run** (1280, 1440, 1920, 900; Chromium and WebKit; signed in and out; 168 captures), against the previous branch tip 10649f8:
  - 144 are identical.
  - 24 differ by exactly 23 pixels, all inside the «Sign In» button, only when signed out in Chromium. A zoomed side-by-side shows no visible change: it is text anti-aliasing, and nothing in the diff touches that button.
  - Search after typing still starts the search in every profile (9 covers).
  - Layout shift on the first cover is 0.
- **Other screens** (`/`, `/inventory`, `/saved-playlists`, `/playlists`, `/playlists/edit`, `/albums`, `/blend`; Chromium 1280 and iPhone WebKit, settled), against main:
  - All 0, except 59 pixels of anti-aliasing in the PT/EN switch on `/` (Chromium; no visible change) and 383 pixels in the iPhone tab-bar equalizer on `/playlists/edit` (the animation, also seen in the previous pass).
  - Console errors are the same on both sides and all come from the test setup: blocked Firebase reads, the stubbed 503 `/api`, the worker JSON.

## What I could not see

- A real Firestore read of a real account. The list comes from my fixture through the data-store seam, the same on both sides. The real read's timing and its order of series and albums were not seen.
- Refresh on the phone, which has no Refresh button.
- Real Safari on Mac or iPhone, Firefox, a screen reader speaking the `role="status"`, and monitors above 1920×1080.
