---
type: visual-parity-recheck
feature: F83
step: final (the whole app in React; sync 5 and wave 8d judged for the first time)
branch: claude/f83-wave-8d-closure
judged_on: c159805842e77105cd2a49fc0130b8ff4efd65ac
reference: main at a88adf48307d115b6cabda02656388e71eaac939 (production) and claude/f83-sync-5-lean-create-and-albums-loading at 66cb1ee
judge: independent (did not build)
date: 2026-11-22
verdict: pass
p0: 0
p1: 0
p2: 4
coverage: complete except — the phone Menu sheet (my selector did not open it on either side; the earlier judges covered it), «Search» by tap on the phone (my selector found no button on either side; the computer has no Search button since F79, Enter only), the Albums loading state reached «from the menu» on the phones (selector), `/home` in English signed in on iPhone 14 (one page load timed out), a real iPhone/Safari, real Apple Music, real Firestore
---

# The whole app in React — final independent recheck

**Verdict: pass.** P0 0, P1 0, P2 4. Against production (`main` a88adf4) every screen I reached shows the same words, the same boxes, the same focus, the same tab title and, apart from noise the main-vs-main control also shows, the same pixels. The Apple Music export sends **the same MusicKit calls, in the same order, with the same bodies, and gives the same notices** as production in all 9 cases, on Chromium, WebKit computer and WebKit iPhone. Wave 8d is invisible against its parent. The `removeChild` error is **made by the proof scripts, not by the app**.

Two facts for the owner that are not defects (declared costs, measured here):
- **The orange line** still shows on the React line when a person opens a screen for the first time soon after the site opens; production never shows it now (numbers below).
- **The Create screen is ready later on a phone connection**: +0.37 s on Fast 4G, **+1.23 s on Slow 4G** (numbers below).

## How it was judged

- **Builds.** `git archive` of `main` a88adf4, the parent 66cb1ee and the branch c159805 into this folder; each built with `vite build` through the machine queue (label `f83-final-judge`), with the five publication stand-in values of `scripts/publication-budget.mjs` held only in the build's environment (no `.env` read, no key written); then `css/`, `assets/`, `js/firebase-config.js` and the favicon copied in as `scripts/lib/site-build.sh` does (`build.mjs`). `main` built with the repository's own `node_modules` (its lockfile), the two React commits with a worktree whose lockfile is byte-identical to theirs.
- **Server and seams** (`lib.mjs`). My own static server: `/` and `/home` answer the entry page, every deep route answers `app.html`, `/api/*` answers 404. Firebase hosts and **every host that is not 127.0.0.1** are blocked; MusicKit is a stand-in (search, discography, albums with tracks), covers are plain squares. The data store's `getDocs` is rewritten in the served script, identically on all sides, to a page function that answers the series (held 0 or 1.5 s, or empty, or refused), the saved playlists of each series and 14 inventory items. «Signed in» is a test person written into Firebase's local store before load (the build's public web configuration read in memory, never written); the entry page's signed-in look is forced with the `in` class, as `main`'s tests do. Toast area and footer hidden in pictures; motion reduced; one browser context open at a time, one run at a time.
- **Scripts** (all in this folder): `sweep.mjs` (every route × signed out/in, entry page PT/EN), `flows.mjs` (Create, Albums windows, Blend generation to Playlists, Saved playlists, Inventory windows, menu, router panels), `loading.mjs` (Albums/Blend loading state, positions, layout shift, orange line), `export.mjs` (Apple Music end to end with the branch's own `test/support/musicKitRecorder.js` on both sides; notices are **read** by a MutationObserver, never removed), `removechild.mjs`, `perf.mjs` (CDP throttle, gzip served), `probe-create.mjs`, `probe-paste.mjs`. Raw results: `out/`.
- **Runs** (all finished; nothing left running):

| What | Pairs (A ↔ B) | Profiles | Result |
|---|---|---|---|
| Sweep, 18 routes + entry page PT/EN, signed out and in | main↔branch | Chromium 1280×800 (full), 1440×900, 899×900, 900×900; WebKit 1280×800, iPhone 14 (full), iPhone SE | text, title, `lang`, attributes, boxes, focus, height: **0 differences**; pictures: noise only |
| | main↔main (control) | Chromium 1280, WebKit 1280, WebKit iPhone 14 | the same noise boxes |
| | parent↔branch | Chromium 1280 (full), WebKit 1280, WebKit iPhone 14 | **0 differences** except noise; iPhone 14 216/216 |
| Flows | main↔branch, main↔main, parent↔branch | Chromium 1280, 1440, 899; WebKit 1280, iPhone 14, SE | equal except P2-1 and P2-3 |
| Loading state | main↔branch, main↔main, parent↔branch | Chromium 1280×720, 1440×900; WebKit 1280×720, iPhone 14, SE | positions equal; React no worse on shift |
| Apple Music export, 9 cases | main↔branch, parent↔branch, main↔main | Chromium 1280; WebKit 1280, iPhone 14 | **81/81 equal in every run** |
| removeChild probe | parent and branch | Chromium; WebKit | origin pinned |
| First screen, orange line on first visits | main and branch | Chromium, iPhone 14 profile, Fast 4G / Slow 4G | table below |

Noise the controls show (not counted): WebKit computer top bar 4,886 px (max 116/255, rows 21–50); WebKit phone wordmark 2,101–2,490 px (rows 16–38); Chromium 1–60 px at most 2/255 in panels and the account chip (also parent↔branch); the count of «client is offline» console lines from the blocked Firestore.

## Findings

### P2-1 — «or paste a list» answers the first click while the field holds typed words; production drops that click (undeclared difference, for the better)
- **Where:** Create (`/start`), computer and phone, Chromium and WebKit.
- **Evidence:** `probe-paste.mjs` (`out/probe-paste.txt`): type «Pink Floyd» without searching, press «or paste a list» once. Production stays in the artist mode (the button is still at the same box, 593,405,94×44 at 1280; 16,264,97×44 on iPhone 14); React opens the list mode with the focus in «Line 1». With an empty field both open the list. Cause on production: `HomeController.bindEvents` redraws the stage on `focusout` of the field, which replaces the button between the press and the release, so the click is lost (the same mechanism as UAT-282, which the closure declares for «Search» only). Main against main: equal (the control shows production does this every time). Captures: `captures/p2-create-paste-with-typed-text-main-left-react-right-1280.png`, `…-iphone14.png`.
- **Check:** add this case to the declared differences (closure §4, the «Search» line: «o primeiro clique em "colar uma lista" com texto digitado também é recebido»), or the owner says it must be undone.

### P2-2 — The account chip in the top bar differs by a few pixels on signed-in screens
- **Where:** top bar, Chromium 1280/1440/900, signed in.
- **Evidence:** 26–44 px at most 44/255 inside the avatar circle and the name (x 1180–1262, y 27–35 at 1280). Seen main↔branch on most signed-in routes, once parent↔branch, never in main↔main. Zoomed: `captures/p2-account-chip-main-top-branch-bottom.png`; nothing a person can see.
- **Check:** none needed; noted so the next judge does not chase it.

### P2-3 — WebKit computer: after the «remove a playlist» step on the Playlists screen the page rests at another scroll
- **Where:** Playlists after a Blend generation, WebKit 1280×800 only.
- **Evidence:** `flows.mjs`, step «remove a playlist»: scrollY production 578, React 925 (Chromium: 925 on both), reproduced in two runs (`out/flows/mb-webkit-1280*.log`), absent from main↔main WebKit. Words, height, layers and focus equal; only where the page rests. Not pinned (it follows Playwright's scroll-into-view of the trash button). `captures/p2-webkit-1280-playlists-scroll-after-remove-main-left-react-right.png`.
- **Check:** on the owner's Mac Safari: generate, scroll to a playlist, remove it; the page should stay where it was.

### P2-4 — The weight ceiling has no slack, and the earlier export proofs compared empty notices
- **Where:** `scripts/bundle-budget.json`; `reports/evidence/F83/wave-8a/browser-proof.mjs` and the 8d engine runs that reuse it.
- **Evidence:** `npm run budget:publication` (`budget-publication.txt`): main script 194,872 B against a ceiling of 195,022 B (**exactly the 150 B margin**), main + after 430,680 B against 430,830 B, react-vendor 68,691 B against 72,000 B — inside. Separately: the 8a/8d proofs remove notices with `toast.remove()`; this kills the notices layer (see the `removeChild` origin), so from that moment their «the notices (text)» checks compared `[]` with `[]`. The export's notices were therefore not really compared by the builder; **my `export.mjs` compares them for real and they are equal**.
- **Check:** the next byte added to the main script needs a ceiling change; the proofs should read notices instead of removing them.

## The orange loading line — the facts

- **While the series are read** (held 1.5 s; Albums and Blend; direct and from the menu; list, empty, failed, Refresh): **never shown** on the React line, in any engine or profile; never shown on production either (`out/loading/*`).
- **When a screen's file is slow** (the router, kept for F94): still shown on the React line. Production never shows it, because its screens are inside the main script.
- **How often a person sees it** (iPhone 14 profile, cold cache, gzip, tap on the menu at a given time after the Create screen is ready; `out/perf/bar-iphone14.json`):

| Network | tap 0.5 s after Create is ready | tap 2 s after | tap 5 s after |
|---|---|---|---|
| Fast 4G | **all four** screens tried (Albums, Blend, Inventory, Saved): from 0.16 s, for 0.2–0.5 s | Blend only, 0.2 s | never |
| Slow 4G | **all four**, for 1.9–2.9 s | **all four**, for 0.6–1.8 s | Blend 1.4 s, Saved 0.6 s |
| production, both networks | never | never | never |

  In plain words: on a phone connection, a person who taps a menu item in the first few seconds of a visit sees the orange line; on a slow connection, for up to about 3 s. After the site has downloaded the screens in the background (a few seconds on Fast 4G, longer on Slow 4G), it no longer appears.

## The origin of the `removeChild` page error

- **Element:** the React notices layer. A failed `removeChild` is called by React on `div#toast-container` for a `div.toast` whose parent is already `null` (spy on `Node.prototype.removeChild`, `out/removechild-*.txt`), in Chromium («Failed to execute 'removeChild'…») and WebKit («The object can not be found here»), parent and branch alike.
- **Code path:** `shell/Toasts.tsx` draws the notices in a portal at the end of `body`; the proof script removes the notice nodes itself (`document.querySelectorAll('#toast-container .toast').forEach(t => t.remove())`, `clearToasts` in `wave-8a/browser-proof.mjs`, also in 8b, sync-2, sync-4, 5b proofs). When the notice's time runs out React removes the node it still owns → `NotFoundError` → the shell's barrier (`[Shell] A part of the shell could not be drawn`) takes the **whole notices layer away** for the rest of the page's life.
- **Proven both ways:** a person's path (two exports, notices left alone): no error, all 4 notices drawn, the layer stays. The proof's path (notices removed by script after the first export): the error 12 s later, the layer is gone, and the second export's notices are **never drawn** (MusicKit still called 24 times).
- **Reachable by a person?** No: no app code removes notice nodes (`grep` of `public/js`: only `Toasts.tsx` touches `#toast-container`). **It cannot break an export**: the MusicKit calls are the same with or without it. It only made the builder's notice checks blind (P2-4).

## Weight and first screen (branch vs production)

Bytes (gzip, publication-shaped builds; `weights.txt`):

| | production `main` | React branch |
|---|---|---|
| Main script | 310,846 B | 194,872 B |
| React's own file (downloaded at opening) | — | 68,691 B |
| What comes after the first screen | 26,423 B | 235,808 B |
| Script total measured on `/start` (iPhone, all files) | 313,286 B in 2 files | 409,434 B in 27 files |

Time until the screen is ready (Chromium, iPhone 14 profile, cold cache, gzip; median of 3; `out/perf/first-iphone14.json`; «ready» = the search field shown for `/start`, the heading for `/`):

| Route | Network | production | React | difference |
|---|---|---|---|---|
| `/` (entry page, the same hand-made page on both) | Fast 4G | 0.23 s | 0.22 s | none |
| `/` | Slow 4G | 0.68 s | 0.68 s | none |
| `/start` (Create) | Fast 4G | 0.86 s (first paint 0.42, largest 0.70) | 1.23 s (0.46, 1.20) | **+0.37 s (+43 %)** |
| `/start` | Slow 4G | 3.23 s (first paint 1.52, largest 3.06) | 4.46 s (1.66, 4.47) | **+1.23 s (+38 %)** |

**Plainly: yes, a person on a phone connection waits longer for the Create screen** — about a third of a second on Fast 4G and over a second on Slow 4G — because React's own file comes at opening and the screen arrives as its own file. The entry page is unchanged. (Network only; no CPU slowdown applied.)

## Wave 8d (B) and sync 5 — first independent judgement

- **8d invisible:** parent↔branch sweep, flows, loading, export: 0 differences beyond noise; titles equal on all 20 routes (`useScreenTitle.ts` writes `document.title` exactly as `BaseView.setTitle` did); no page or console error the parent lacks. Code read: the dead `btn` branch of `handleExportToAppleMusic` had no caller; the albums controller is made once per visit as before; `DEFAULT_BATCH_NAME`/`DEFAULT_SERIES_NAME` keep «Unsaved Batch»/«MJRP Playlists» as data (equal in the export's folder name, `edit screen → the folder list fails`).
- **The 64 texts:** 61 keys in `i18n/en/notices.js` (+3 moved inside `start.js`); every English sentence equals the parent's literal (checked fragment by fragment; the 8 composed ones via `askTexts.js` keep the same plural rules). Seen on screen equal to the parent and to production: «Your unsaved playlists were restored», the ask lines («Acclaim ratings are missing for 3 of 3 albums (3 did not answer): …»), «This screen could not be loaded / The app was updated…» (screen file refused), every Apple Music notice incl. «Apple Music was not authorized: nothing was exported.». **Raw dictionary keys on screen: 0 in 688 checks** (text, `aria-label`, `title`, `placeholder`, notices). Not triggered: «No connection» panel, «Connected to Spotify!», «View Error»; the unknown route redirects to Create on both.
- **Sync 5:** the lean Create on the computer equals production in every state reached (sentence in place and Escape rules, results by Enter, two chosen, last removed with undo strip, not found; the sheet on the phone) except P2-1. The Albums loading state: content right under the filters (gap 32 px computer, 12 px phone), same positions as production when opened directly (417–513 at 1280×720 Chromium, 418–514 WebKit; 124–206 production vs 124–212 React on the phone, the words' box 6 px taller), no «No albums» text while reading, settled screens equal. From the menu production places it 45 px higher and then shifts (0.0305 at 1280, 0.0279 at 1440); React has it in place from the first paint (shift 0). Captures: `captures/albums-loading-from-menu-1280x720-main-left-react-right.png`.
- **Apple Music:** `test/fixtures/exportMusicKitRecording.json` byte-identical between 66cb1ee and c159805 (sha256 914c71f2…). Built-site export, all 9 cases equal to production: saved batch → existing folder (13 calls), one saved playlist → new folder, no folder, 250 folders (paging, 19 calls), second playlist refused mid-way, authorization refused (5 calls), edit screen → existing / new folder, folder list failing.

## O que só o dono pode provar

1. Na prévia, com sua conta: Playlists guardadas → um lote → «Exportar» → Apple Music → **pasta que já existe**. No app Música, confira a pasta e as faixas.
2. Repita com **uma pasta nova** (digite o nome) e depois **sem pasta**.
3. Exporte **uma playlist só** (o botão ao lado dela) e o **lote inteiro**; leia os avisos do fim.
4. Pela tela de edição (depois de gerar na Blend), exporte de novo; aperte «Exportar» duas vezes seguidas: não pode criar nada em dobro.
5. Feche a janela da Apple sem autorizar: o aviso deve dizer que nada foi exportado.
6. No iPhone, em cada tela com Folha: feche pelo «fechar», tocando fora e arrastando para baixo.
7. No iPhone, abra a Create pela primeira vez no 4G e toque logo no menu: diga se a linha laranja incomoda.
8. No Safari do Mac, na tela de Playlists, remova uma playlist e veja se a página fica onde estava.
