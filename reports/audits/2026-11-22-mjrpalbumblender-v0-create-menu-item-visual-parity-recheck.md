---
type: visual-parity-recheck
feature: F91
branch: wip/create-in-place-of-start
judged_on: fbacd12
reference: main at 44137fb
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 1
---

# «Start» becomes «Create» / «Criar», with a plus: visual recheck

**Verdict: pass.** The name changed everywhere it shows, no verb was touched, the plus sits where the «Go» sat, and nothing else on any screen moved.

## How it was checked

- `git archive` of `main` (44137fb) and the branch (fbacd12), each `vite build` through the machine queue (both exit 0).
- A small static server answering deep routes like `firebase.json` (`/home` -> index.html, routes without an extension -> app.html).
- Playwright 1.56 from MJRPpersonal. The Firebase hosts were blocked, motion was reduced, no account and no key were used.
- Profiles: Chromium 1280×800 (1x), WebKit 1280×800, WebKit iPhone 393×852 (3x), WebKit 375×667 (2x), Chromium 899 and 900 (1x).
- Routes: `/home` in Portuguese, `/home` in English (language stored in the page), `/start`, `/albums`, `/blend`, `/saved-playlists`, `/inventory`.
- Each screen was captured three times: main, main again (the noise control) and the branch. Pixels were compared outside the item's box plus 1 px. Every menu item's box and the bar's box were measured from the page.

## 1. Where the name shows

| Place | main | branch |
|---|---|---|
| Home menu, Portuguese (computer and phone) | Inicie | **Criar** |
| Home menu, English | Start | **Create** |
| Home section label | Lado A · 1 — Inicie / Side A · 1 — Start | Lado A · 1 — Criar / Side A · 1 — Create (from the built bundle) |
| App top menu (1280, 900) | Start | **Create** |
| Phone bottom menu (393, 375, 899) | «Go» icon + Start | **plus** + Create |
| Phone top bar on `/start` | Start | **Create** |
| Breadcrumb (`/albums`, computer) | Start › Albums | **Create › Albums** |
| Footer link | Start | **Create** |
| Empty albums screen button | Go to Start | **Go to Create** |

- **Leftover names:** the built pages and bundles were searched for «Start», «Inicie» and «Go» used as the screen's name, and the visible text of every route and profile was searched too. None is left. The only trace is a stylesheet comment `/* Inicie */`, which nobody sees.
- **Verbs:** none was changed. These keep their wording: «Start a series» (door), «Start from an artist…», «…starts here», «Start another series», «Go to page», «Go Back» and «Go to The Blending Menu».

## 2. The item

- **Icon:** it uses the same `stopIcon` function as its neighbours: 24×24, `stroke-width="2"`, round caps. The two strokes are centred on (12, 12). The icon box is identical to main's in every phone profile (393: [27.3, 805, 24, 24]; 375: [25.5, 620, 24, 24]; 899: [77.9, 753, 24, 24]).
- **Crispness:** sharp at 1x (zoomed capture, Chromium 899), at 2x (WebKit 375) and at 3x (WebKit 393).
- **Active state:** on `/start` the item has `cur` and `aria-current="page"` in all six profiles. On every other route it has neither.
- **Accessible name:** «Create», with `/url: /start`, in all six profiles. The svg is `aria-hidden`.
- **Touch target:** 78.6×75 at 393, 75×75 at 375, 179.8×75 at 899. On the computer the box is 124×52 at 1280 and 79.6×52 at 900. All are at least 44 px.
- **Navigation:** tapping it from `/albums` and from `/blend` lands on `/start` in all six profiles, on both sides. On the home without an account it scrolls to `#start`, the same as main.

## 3. Nothing else moved

- **Boxes:** every item's box, the bar's box and the icon boxes are **identical** to main on all 7 routes × 6 profiles. That covers English («Create») and Portuguese («Criar», home), at 1280, 900 and 899. The builder's claim holds: «Create» fits the same 124 px (1280) and 79.6 px (900) box.
- **Pixels outside the item's box (branch against main; the noise control is main against main):**
  - `/start`, `/blend`, `/saved-playlists` and `/inventory`, all profiles: 0, the same as the noise.
  - `/start` on the phone (393, 375, 899): only the top-bar name, box [159, 21]–[223, 33].
  - `/albums`, computer: only the breadcrumb, [64, 146]–[177, 158]. On the phone: only the «Go to Create» button, [99, 317]–[285, 385].
  - Home pt/en: 0 to 3,600 px in the animated art region. Main against main moves the same region by the same amount.
  - Home pt at 900: about 64 px around the language switch. A focused rerun found main against itself differing there by 52 px, while branch against itself differed by 0. It is rendering noise, not the change.
  - `/albums` and `/inventory` at 900: 12 to 14 px at the account corner, identical in the noise control.

## Findings

- **P2: the plus looks lighter than its neighbours.** Its strokes span 14 of the 24 units (5→19, the same as the app's Plus icon). The disc, the archive box and the sliders fill about 18 to 20 units. Same stroke and same box, so it is within the rules, but at a glance it reads a little smaller than the other four (see `captures/phone-393-start-bottom-bar-main-top-branch-bottom.png`). Optional fix: draw it 4→20 (16 units), still centred. Owner's call; it does not block.

## Note on the wording (for the owner, not a finding)

- «Go to Create» is acceptable but a little clumsy: «Create» reads as a verb, so the button sounds like «go to make». Better words: **«Create a series»**, which says what happens and matches the verb already on the door («Start a series»).
- The line above the button says «Create a series from the home page to get started», but the button goes to Create (`/start`), not to the home page. With the rename, «Create your first series to get started» would be truer. This line was already wrong on main.
- On `/start` the screen named «Create» also shows a step «3 Create — the series, then blend it» and a «Create series» button. The word «Create» repeats; this is harmless and worth knowing.
- The hand-made app has no Portuguese text for this button, so there is no Portuguese version to judge. The home's «Criar» is correct.

## What I could not see

- The home with an account: the item going to `/start`, and the «Criar» / «Create» button the signed-in home shows. Both need a sign-in.
- Real Safari on an iPhone (only Playwright's WebKit), and the iPhone's safe-area inset.
- Hover and keyboard focus rings on the new item.
- The computer captures show the «Authentication issue» notice. It appears because the Firebase hosts were blocked, and it is the same on both sides.

## Captures (`captures/`, main on top, branch below, all under 80 KB)

- `phone-393-start-bottom-bar-main-top-branch-bottom.png`: the new item on the phone
- `computer-1280-start-header-main-top-branch-bottom.png`: the new item on the computer
- `computer-webkit-1280-home-pt-header.png`: the home in Portuguese, «Criar»
- `phone-393-start-top-bar-main-top-branch-bottom.png`: the screen name on the phone
- `icon-1x-chromium-899-zoom4.png` and `icon-2x-webkit-375-zoom2.png`: the plus at 1x and 2x
- `computer-1280-albums-breadcrumb.png` and `phone-375-albums-empty-cta.png`

Raw data: `tools/measure.json` (boxes, names, navigation, accessible names) and `tools/diff.json` (pixel counts).
