---
type: visual-parity-recheck
feature: F95 (with F82 TASK-04)
branch: feat/f95-crate-managed-in-the-panel
judged_on: 188011d (diff over main at the merge base 9cfb859; main built for the comparison at b76dfeb)
reference: F82 spec REQ-03 and REQ-11, ADR-0024, F95 spec, the builder's proof in reports/evidence/F95/, the owner's approval of the section's shape («Ótimo!»)
judge: independent (did not build) — visual, behaviour and security
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 11
---

# F95 / F82 TASK-04 — the crate managed in the Painel: security, behaviour and visual judgment

**Verdict: pass — 0 P0, 0 P1, 11 P2.** Nobody but the administrator can write `published/crate`, no write to another `published/*` document that was refused is now accepted, and the entry page treats what it reads as hostile: across 47 hostile answers in Chromium and WebKit at 1280 and 390 px nothing became an element, nothing ran, no other host was asked and no error reached the screen. The server route is behind the administrator's door and fetches nothing it is given. The entry page loads as fast as on `main`.

The P2 are real and listed below. The two that matter most: the artwork path can leave Apple's artwork folder (never Apple's image host) through percent-encoded dots, in the rules and in the validator; and the rules put no ceiling on any text, so a document of about 1 MiB is accepted from the administrator.

## How it was judged

- My own worktree at `188011d`, branch `wip/f95-judge`. The site built publication-shaped (`scripts/publication-budget.mjs --out`) for the branch and for `main` (b76dfeb), both through the machine queue, each served by `vite preview` on 127.0.0.1 (ports 4795 and 4796), stopped at the end.
- The rules ran in the Firestore emulator through the queue (`npm run test:rules`): the builder's 55 cases, plus 57 probes of mine appended to the test file as scratch and removed after (the file is back to its committed text).
- The builder's `proof.mjs` re-run by me on my build: 272 of 272. Then a script of mine built on its harness (the database, the sign-in and the server's search answered by stand-ins): hostile answers, main against the branch, the two languages, the Painel's states. Playwright, Chromium and WebKit, 1280×800 and 390×844, English and Portuguese through the stored choice `albumblender:lang`.
- Targeted unit tests through the queue: 30 files, 560 tests, all pass (`noSecretsInRepo`, the route, the guards, the core, the repository, the entry page, the Painel). The whole suite was not run.
- Safety: every context aborted the music hosts and the non-web schemes; Firestore and the server were only ever answered by stand-ins; no link leaving the site was clicked; no app of the Mac was opened or controlled; no password typed; no `.env` read; no deploy, no push. Requests did go to Apple's image host and Google Fonts, the two static hosts the pages name themselves.

## Security

### 1. The rules: `validCrate()` and the `published/crate` line

**Can anyone but the administrator write? No.** In the emulator a guest, another account, a person with no login, the administrator signed in anonymously and a role other than `super` are refused on create and on update (the builder's cases). Mine: another account that first tries to make itself administrator is refused on both writes; `updateDoc` of `rev` alone by another account is refused; nobody deletes, the administrator included.

**Regression on the other documents: none.** Refused, as before: `site` with `sideA`/`sideB` added, `texts_en` with the sides added, `recipes` holding a crate, `crate` holding the body of `site` or of `texts`, `crate` with `switches` added, `published/Crate` (capital), `published/crate/sub/x`. A valid `site` is still accepted. The diff touches no other line of the file.

**The builder's claim, verified: true, and wider than stated.** The rules check the id, the artwork path and the link by the one joined pattern, and the count of a side and of an album's fields. They do not check, and accept from the administrator:

| What | Accepted by the rules | Stopped later by |
|---|---|---|
| markup, `javascript:` text, control characters, a right-to-left override in the title | yes | markup: the validator. The other three: nobody (P2-3) |
| a title of 900 000 characters; an artwork path of 200 000; a link of 300 000 | yes (1.1 MB is refused by Firestore's own 1 MiB limit) | the validator (200, 300, 500 characters) |
| `title` as a map, `year` as a list of 1000 texts or as null | yes | the validator |
| an album with `id`, `art`, `href` and three keys of any name in place of `title`, `artist`, `year` | yes | the validator |
| the same album six times | yes | the validator (kept once, then the count refuses) |
| `previous.sideA` as a 900 000-character text, or any map | yes | nothing reads it; every visitor downloads it (P2-2) |
| artwork `a/%2e%2e/%2e%2e/%2e%2e/x` (encoded dot-dot), `a/b%00c`, `a/%5c%5cevil.example` | yes | nobody: the validator accepts them too (P2-1) |

Refused by the rules, as claimed: another host or a scheme in the artwork, `..`, a leading slash, `?`, `#`, a backslash, a colon, a newline at the end; in the link `http:`, a look-alike host, `user@host`, a port, capitals in the scheme, a space, a tab, a newline, DEL, `<`, `>`; an id with a newline or that is a list; the «join» trick (a space inside a field); `rev` 1.5. The link is safe by construction: the host ends at the first slash, so `https://music.apple.com/@evil.example` and a backslash after it stay on Apple Music.

**Can the administrator's session be abused to store something harmful?** With a stolen session a person can publish any Apple Music albums and any text up to 200 characters without `<` or `>` (what a CMS is), a large document, and a cover from another folder of Apple's image host. Never a script, never another host, never a link off Apple Music.

### 2. The entry page reader

- **Treated as hostile: yes.** Every value goes through `shared/content/crate.js`; text is written with `textContent`, `alt`, `dataset` and DOM properties; there is no `innerHTML` in `publishedCrate.js` or in the swap. The cover address is always built on `https://is1-ssl.mzstatic.com/image/thumb/`; the link is set only after the validator accepted `https://music.apple.com/…`, with `target="_blank"` and `rel="noopener"`.
- **The content policy:** the one change is `https://firestore.googleapis.com` added to `connect-src` (read in the source and in the built page). `img-src` is unchanged.
- **Never delays the first paint:** the request leaves only after the `load` event (measured: first asked 5 to 10 ms after `load` in every run), `credentials: 'omit'`, aborted 3 s later. With the database answering in 6 s, first paint and `load` are as on `main`.
- **Hostile answers, 47 each in Chromium and WebKit at 1280 and 390 (188 runs): 184 as expected.** Markup in a title and in an id, a title of 500 000 characters, 500 albums a side, sides that are texts, numbers or maps, albums that are null, numbers or lists, a missing side, a cover on another host (absolute, `//`, `../`, `@`, backslash, `?#`), links `javascript:`, `data:`, `music://`, `http:`, a look-alike host, `user@host`, a quote, a backslash; duplicates; `{}`, `[]`, `null`, a text, `found` with no fields, `__proto__` keys, a nesting 3000 deep, a body that is not JSON, an empty body, 403, 500, and about 1 MB of `previous`. In every one: no element with a handler, no script, no request to a host outside the page's own list, every link on Apple Music, no console error, and either the good albums alone or the whole fixed set.
- **The 4 that differ are one case, P2-1:** the encoded dot-dot. The page asked `https://is1-ssl.mzstatic.com/judge-escape/360x360bb.webp`, outside `/image/thumb/`, on Apple's host. The image did not load and the browser logged one error in the console; nothing on screen.

### 3. The server route `POST /api/admin/apple-albums`

- **The guard is the translation's:** `app.use('/api/admin', guards.admin)` is mounted before the router, so `requireCmsAdmin` and the limiter run for both routes.
- **Rate limit:** the door's 600 knocks an hour and the 120 calls an hour, shared with the translation (P2-8).
- **Input bounds:** `query` is text, not empty, at most 300 characters; `express.json()` holds the body at its default 100 KB; at most 12 results.
- **No SSRF.** A pasted link is never fetched. One pattern takes a two-letter storefront and a run of digits from `https://music.apple.com/<sf>/album/[name/]<id>`, and the server asks its own fixed address `api.music.apple.com/v1/catalog/<sf>/albums/<id>`. Probed: another host, `http://169.254.169.254/…`, `file:///etc/passwd`, `user@host`, `../` in the path, a playlist link: all «not an album link», Apple not asked.
- **The developer token** stays in the request header inside `catalogClient.js`; the service file has no token and no `Authorization` (a test holds it); answers carry only the six fields of each album, each checked by the validator.
- **Errors** are named from a closed list by HTTP status; no upstream body is passed on or logged.
- **Tests:** bad input, not configured, each upstream failure, the log line. Non-administrator, anonymous and over-limit are covered by the guard's own tests and, for this route, only by a test that reads the source to see the mount (P2-8).

### 4. Secrets and data

`test/security/noSecretsInRepo.test.js` passes. The new log line `cms_apple_albums` says the answer, the time, link or term, the length and the count: nothing of what was searched, nothing of the person (a test holds it). Who saved is written in `cmsWork/save_crate`, never in the public document (emulator and browser). The entry page sends no credential to Firestore.

## Behaviour and visual

**The «Caixa» section** — Chromium and WebKit, 1280 and 390, English and Portuguese (8 runs of mine, one re-run four times, plus the builder's proof re-run):

- Sides, reorder by buttons and by keyboard with the focus following the moved album, to the other side, remove (focus lands on the album that took the place), add by search and by pasted link, save with confirmation of what goes live, discard, conflict (mine or theirs), a failed save with «Try again»: all work.
- Limits: a side under its minimum says so in words («O Lado A precisa de pelo menos 6 álbuns (até 10)…») and Save is off. At its ceiling the buttons that would add are off (P2-6 on the message).
- «The rules do not accept this save yet» reads clearly: «Não salvou: o banco recusou: as regras ainda não aceitam esta gravação (um campo novo, ou um texto fora do formato). Nada mudou no site, e as suas mudanças continuam aqui.» with «Tentar de novo».
- Design system: headings and album names in Syne, accent `#f97316`, the Painel's `ak-*` and `cms-*` pieces. The kit copy is untouched: no file under `public/js/ui/admin-kit` or `test/admin-kit` differs from `main`, the stamp line («cópia carimbada … admin-kit v1.0.1») included.
- Nothing overflows at 390 or at 1280, no label is cut, no console error.
- Tap targets: at 390 every button and field is 44 px or more. At 1280: Save and Discard 36 px high, the arrows 36×36, «To side B» and «Remove» 30 px high.
- Texts: no «disco»; «The Album Blender» in full; no English left in the Portuguese section; album and artist names untranslated.

**The entry page:**

- With nothing published it is, element by element, where it is on `main` (523 to 669 elements compared, both engines, both widths); the only additions are the new label's own elements, hidden on the phone. The phone is unchanged from the approved F96 page.
- With a published crate: swapped in the owner's order in the computer's crate and in the phone's row; caption album and year; the label «NA CAIXA DO THE ALBUM BLENDER» / «IN THE ALBUM BLENDER'S CRATE» on the computer in each language; no layout shift at the swap (the builder's check, re-run), and the layout boxes equal the fixed set's even with a 200-character name (it is cut with an ellipsis).
- After a failed, refused, slow or garbage read: the fixed set, no error on screen.

**The `load` time (the builder's note of 3 to 4 s).** Not this feature, and not `main` either: it was the proof's own conditions. Median of 5 cold loads, ms:

| | main `load` | branch `load` | main first paint | branch first paint |
|---|---|---|---|---|
| Chromium 1280 | 559 | 585 | 344 | 372 |
| Chromium 390 | 505 | 537 | 348 | 400 |
| WebKit 1280 | 436 | 438 | 333 | 326 |
| WebKit 390 | 404 | 437 | 338 | 367 |

The differences are inside the spread of the runs (429 to 1001 ms on `main` alone). The branch makes one request more, after `load`. One thing a visitor can see later than before is the 3D crate (P2-7).

## Findings

No P0. No P1.

**P2-1 — The artwork path can leave the artwork folder through percent-encoded dots.** `a/%2e%2e/%2e%2e/%2e%2e/x` passes the rules and `isArtPath` (both look for a literal `..`), and the browser resolves it to `https://is1-ssl.mzstatic.com/x/360x360bb.webp`. It never leaves Apple's image host, the content policy would stop anything else, and it is an image only, so I rate it P2 and not a hole; but the rules' comment, the validator's comment and the how-to all say «never `..`», and that is not true. Fix: drop `%` from the path's characters (no path of the fixed set uses it), in the rules and in the validator, or refuse `%2e`, `%2f`, `%5c` and `%00` in any case. Needs the administrator's own action. Y/N: does `a/%2e%2e/x` fail in the emulator and in `validateAlbum`?

**P2-2 — The rules put no ceiling on size.** A title, a path, a link or `previous` of hundreds of kilobytes is accepted; `previous` is checked only for its two key names. The entry page asks for the whole document, `previous` included, for every visitor. Tested with about 1 MB: the page still swaps, no error. Fix: ask only for the two sides (`mask.fieldPaths` in the `batchGet`), and bound `previous` (each side a list of at most 10). A `.size()` on the joined text of each album may fit the 1000 expressions; the builder should measure.

**P2-3 — A name accepts control characters, a right-to-left override and a text of only zero-width characters.** `brokenName` refuses only `<`, `>`, empty and over 200. They are written as text, so nothing runs; a name could be shown reversed or blank.

**P2-4 — The rules do not name `title`, `artist`, `year`, nor refuse a repeated album.** Six fields of any name with a good `id`, `art` and `href` pass. The readers refuse them. Stated so the limit of the rules is on record.

**P2-5 — A search with a colon after its first word is refused as «not an album link».** «U2: Achtung Baby», «Tool: Lateralus», «Re:Stacks», «AC:DC» answer 400 `not-an-album-link`, because anything shaped like `word:` counts as an address. Fix: treat as an address only what starts with `http:`, `https:` or `www.`.

**P2-6 — A full side says so only in a tooltip.** At ten albums «To side B» and «Add to side B» go off; the words «Side B is full (10 albums).» are a `title` on a disabled button, which a phone never shows and a disabled button often does not. The badge «10 albums · from 4 to 10» is the only visible sign.

**P2-7 — The 3D crate now waits for the database.** `load3d` runs after the read ends: on a computer with WebGL the 3D crate comes later by the time of the read, up to 3 s when the database does not answer, plus up to 4 s for new covers. The CSS crate is on screen meanwhile. Read in the code; not measured (the test browsers have no WebGL).

**P2-8 — The search shares the translation's 120 calls an hour, and its door is tested by reading the source.** A session of searching can use up the translations. No test sends a request to `/api/admin/apple-albums` through the guards as a non-administrator, an anonymous person or over the limit.

**P2-9 — «Salvando…» stayed for 15 s once.** WebKit, 390, Portuguese, 1 run of 5, while a second browser run was going on the same machine; 4 re-runs alone passed. The builder saw a similar one-off. I cannot tell the stand-in from the product. The save has no deadline of its own.

**P2-10 — The confirmation says «Todos veem em até 1 minuto».** It is the texts' note; the entry page reads the crate at every visit, so the crate is seen at once.

**P2-11 — Small things seen, older than this feature.** The cover's alternative text is in English on the Portuguese page («Dummy by Portishead (1994), album cover»), the same on `main`, now also written by the swap. The phone's top bar cuts the app's name («The Album Blend…») in the Painel. WebKit at 1280 scrolls 32 px sideways on the entry page: 1312 px on `main` and on the branch alike.

## What was not verified

- The real database answering a browser, and the published rules (nothing was deployed): every read and write here is a stand-in or the emulator.
- The search against Apple's real API, and the real developer token.
- The 3D crate with a published crate, and P2-7's delay in numbers: no WebGL in the test browsers.
- The whole test suite (not run, by instruction); a real iPhone; a screen reader.
- Whether P2-9 is the product's.

## Evidence

In the session's scratch area, not committed: `rules1.txt` (the 57 probes), `builder-proof.txt` (272 of 272), `judge-hostile-chromium.txt` and `judge-hostile-webkit.txt` (92 of 94 each), `judge-painel.txt`, `judge-phone.txt`, `judge-timing.txt`, `tests.txt`, and the captures in `out-judge/`. The scripts: `judge.mjs` (the builder's `proof.mjs` harness with my cases), `judge_probe.js`, `validator_probe.mjs`.
