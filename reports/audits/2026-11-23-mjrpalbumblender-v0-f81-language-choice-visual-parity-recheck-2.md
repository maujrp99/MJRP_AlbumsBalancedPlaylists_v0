---
type: visual-parity-recheck
feature: F81
branch: feat/f81-language-by-country-and-switch
judged_on: aea8013 (judged as a delta over aff752c, the first pass; from a copy of that commit on wip/f81-judge-2)
reference: the first pass report (verdict fail, 1 P1, 11 P2): reports/audits/2026-11-23-mjrpalbumblender-v0-f81-language-choice-visual-parity-recheck.md
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 11
---

# F81 — the language choice, second pass: the English words are gone from the Portuguese texts, dates follow the language, the deploy checks the hint

**Verdict: pass — 0 P0, 0 P1, 11 P2.** The one P1 of the first pass is fixed and guarded by a test that reads its pairs from the dictionaries. Three P2 were fixed (the phone's Blend line, the deploy's check of the hint, dates by the language). Nothing in the fixes broke the mechanism. Nothing found here blocks a deploy.

This pass is narrow: it did not redo the full sweep of the first one.

## How it was judged

- My own build of `aea8013` through the machine queue, served by the Firebase Hosting emulator (demo project, port 5057, offline), the country told by Firebase's test cookie. Emulator stopped, `dist/` discarded, nothing deployed or pushed.
- Playwright, Chromium and WebKit, 1280 and 390, Portuguese and English: 52 checks, 52 pass (`judge3.mjs`). Music hosts and schemes aborted by name in every context (requests attempted: 0); production Firebase never reached.
- Tests run: `test/i18n/portugueseNames.test.js`, `test/i18n/dates.test.js`, `test/scripts/countryHintChecks.test.js`, `test/i18n/language.test.js`, `test/shell/Language.test.tsx` — 45 pass. The whole suite was not run.
- `git diff 9c8eeb8^ aea8013 -- public/ scripts/ firebase.json` read in full outside `public/splash*`. `git diff main aea8013 -- public/splash.html public/splash` is empty: the entry page on this branch is the one of `main` (F96, judged separately).
- New evidence from the owner, counted: he opened the preview on the real Firebase Hosting from Brazil and the app came up in Portuguese. That covers what the first pass could not verify for Brazil (the swap by country on the real hosting). The other half (a visitor abroad gets English on the real hosting) is still only proved in the emulator.
- Outputs: `/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/` (`judge3.mjs`, `judge3-out.txt`, `shots2/`).

## What was fixed

**P1-1 — fixed.** `notices.router.notFoundBack` is «Ir para Criar» (seen on screen, 4 of 4, inside its button, not cut; English still «Go to Create»). `albums.rankWindow.tip` and `.note` name the recipe «Top Faixas pela Minha Própria Classificação» (read in the dictionary; the window needs an album). The guard `test/i18n/portugueseNames.test.js` is derived: it takes the pairs from the dictionaries (the menu's stops `shell.phone.tab*` and every `blend.recipes.*.name` whose Portuguese differs from the English) and refuses any Portuguese text, of the app or of the Painel, that carries the English name as a whole word. A new recipe or stop enters the check by itself. It also caught one more, fixed in the same commit: «Receitas do Blend» → «Receitas da Mistura» in the Painel.

**P2-1 — fixed in Portuguese.** The phone's Blend with no series says «Nenhuma série ainda: crie uma em Criar» (seen at 390 in both browsers). The English keeps «on Home» (see open P2 number 9).

**P2-4 — fixed.** `public/js/i18n/dates.js` writes dates by the language of the app. Seen with an en-US browser: Portuguese «Atualizado às 19:02:08» and «Última atualização: 23/11/2026, 19:02:08»; after the switch to English, with no reload, «Last updated: 7:02:08 PM» and «11/23/2026, 7:02:08 PM»; back to Portuguese the same moment as before. English in a browser that is not English writes day first («23/11/2026, 19:02:13»). The five call sites: the footer, Albums and Playlists (seen or read), the saved batch card and the «resumes at» toast (read; they need data).

**P2-8 — fixed; it cannot refuse a good deploy.** Read:
- `verify_country_hint` (`scripts/lib/site-build.sh`, run by production and preview) looks only at the two built files, parsed as JSON by Node: whitespace does not matter, and no network is involved.
- `verify_production` (`scripts/deploy-site.sh`) parses the live `/country.json` the same way and accepts **any** country, so a deploy machine in Brazil reading «br» passes; it only refuses an answer that is not the hint (a page, broken JSON). The second request, with the Brazil cookie, is a warning, never a refusal.
- Both run after `firebase deploy` has already finished, so neither can stop a publication; the worst case is a false alarm (open P2 number 11).

**The mechanism's core four — still pass** in the four browser × width pairs: Brazil → Portuguese with no English frame; another country → English with no Portuguese frame, even with the browser in Portuguese; the choice beats the country on reload and the hint is not asked; the switch keeps the page, the typed text and the focus. No page error, no sideways scroll.

**Budget.** The ceilings moved with the new measurement (main 200,190 + 150 = 200,340; the dates file and the texts account for the +578 B); my build is inside the budget.

## Open P2 (11)

Carried from the first pass (8), by the coordinator's decision:

1. `inventory.value.mint` / `.nearMint` / `.veryGoodPlus` stay «Mint», «Near Mint», «Very Good Plus» in Portuguese (Discogs' grades; the owner decides).
2. The decades of the Albums year filter («1960s … 1990s») are written in the code, English style.
3. The page title stays in English (TASK-07).
4. A black, wordless page while the country is asked, up to 1.5 s, on every visit with no stored choice.
5. The fallback can pick the wrong language: a Brazilian whose browser is not in Portuguese gets English when the hint fails or takes more than 1.5 s (the owner's rule; its cost).
6. The entry page (Portuguese for everyone) and the app (English abroad) disagree for a first visitor outside Brazil.
7. The budget's «1st screen» line does not count the Portuguese dictionary a visitor in Brazil downloads before the first screen.
8. The Apple Music row of the account panel in Portuguese cuts «Não foi possível conectar» with an ellipsis in the failure state (1280).

New in this pass (3):

9. **The English of `blend.phone.noSeries` still says «create one on Home»** (seen at 390); the stop is «Create». The builder left it because an old stored page compares that text letter by letter (`test/fixtures/blendBeforeF83.json`).
10. **The «loading is paused» toasts are written in English in the code** (`public/js/models/albumLoadState.js`, `holdNotice`: «Your sign-in could not be confirmed…», «The ratings source asked to slow down…», «Spotify asked to slow down…»). In the Portuguese app they would appear in English, now with the hour in the Portuguese way. Older than this feature; read, not seen on screen (it needs the server to ask for a pause).
11. **The production check of the hint has no second try.** One failed request (a network hiccup, or an edge still answering the old page for a moment) ends the script with «the live /country.json is not the country hint» and the rollback instructions, after a deploy that went well. The check of `app.html` just above it tries six times; this one could too.

## What I could not verify

- On the real hosting, a visitor **outside** Brazil (the owner's check covers Brazil only), and the CDN's behaviour with `no-store`.
- Screens with data in Portuguese (the ranking window with its fixed text, the saved batch card's date, the pause toast): read, not seen.
- The deploy scripts were read, not run (`--dry-run` needs the `.env` and runs the whole suite).
