---
type: visual-parity-recheck
feature: F81
branch: feat/f81-language-by-country-and-switch
judged_on: aff752c (TASK-02 and TASK-03; judged from a copy of that commit on wip/f81-judge)
reference: docs/specs/features/F81-site-in-more-than-one-language/spec.md REQ-02, REQ-03, REQ-04; the owner's rule of 2026-11-23 («o idioma do app é em portugues, está nascendo no brasil, mas fora do brasil a geolocation deve mudar para en»); the menu rows already in the account panel and in the phone's Menu
judge: independent (did not build)
date: 2026-11-23
verdict: fail
p0: 0
p1: 1
p2: 11
---

# F81 — the language of the app by country, the person's choice and the selector: the mechanism passes, three Portuguese texts still carry English

**Verdict: fail — 0 P0, 1 P1, 11 P2.** Everything the builder claims about the mechanism holds in Chromium and WebKit at 1280 and 390: Brazil opens in Portuguese with no English frame, any other country or none opens in English, the choice survives a reload and beats the country, the switch keeps the page, the typed text and the focus, the selector is made of the menu's own rows and is usable by keyboard. A deploy changes one address only, `/country.json`. The one P1 is small and is text: three Portuguese entries of the dictionary still show English words on screen, now that Portuguese is open to the public. Fixing three strings clears it.

## How it was judged

- My own build of `aff752c` (`npx vite build` through the machine queue, plus the four copies `scripts/lib/site-build.sh` makes), served by the **Firebase Hosting emulator** with a demo project (`demo-f81-judge`, port 5057, offline, a copy of this `firebase.json` with only the emulator ports added). The country was told with Firebase's test cookie `firebase-country-override`, so the swap of `/country.json` was done by Firebase's own code in every check. Emulator stopped at the end; `dist/` discarded; nothing deployed, nothing pushed.
- Playwright, Chromium and WebKit, 1280×900 and 390×844 (touch): my own script (244 checks and notes: 224 pass, 0 fail, 20 notes) and a second short one (switching in the middle of three screens, `/admin` as a visitor, a fast triple switch). The builder's proof script was read, not rerun; its network stand-ins for Firebase were reused.
- A frame recorder wrote down every distinct text the page showed from the first frame, with `<html lang>`; the hint was slowed (700 ms, 2.6 s), aborted, answered as a page and answered 500.
- The two dictionaries were compared key by key (1,238 keys each, none missing in Portuguese, none extra).
- `test/i18n/language.test.js`, `test/shell/Language.test.tsx`, `test/i18n/t.test.ts` and `test/architecture/interfaceInEnglish.test.js` run: 34 pass. The whole suite was not run.
- Safety: the five music hosts and the three schemes aborted by name in every context (requests attempted: 0); production Firebase never reached (stand-ins or abort); no link leaving the site clicked; no app of the Mac opened or controlled; no password typed; `.env` not read.
- Outputs: `/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/` (`judge.mjs`, `judge2.mjs`, `dict.mjs`, `judge-out.txt`, `judge-result.json`, `shots/`).

## (a) Behaviour

| What | Result (same in the 4 browser × width pairs) |
|---|---|
| Brazil, first visit, browser in English, hint 700 ms late | Portuguese, `<html lang="pt-BR">`; frames: empty page, then the Portuguese shell at 770–870 ms. **No English frame.** Nothing stored as a choice; the hint asked once |
| US; no country; Portugal with a pt-PT browser; US with a pt-BR browser | English, `<html lang="en">`, no Portuguese frame (the country wins over the browser) |
| Hint aborted, answered as a page, answered 500 — browser en-US | English (the browser's language), no Portuguese frame |
| Hint aborted — browser pt-BR | Portuguese |
| Hint 2.6 s late, Brazil, browser en-US | English at about 1.8 s; no late flip when the hint arrives; nothing stored |
| Pick «Português» in the menu | No reload, same address, the typed text kept, `<html lang="pt-BR">`, the mark moves, focus on the row picked, `albumblender:lang = pt` |
| Reload from the US with «Português» chosen | «Carregando...» at the first frame, then Portuguese; the hint is not asked |
| Reload from Brazil with «English» chosen | English, no Portuguese frame, the hint not asked |
| Switch in the middle of `/inventory`, `/albums`, `/blend` | The screen changes where it is, the menu stays open, switching back gives the same text |
| en, pt, en with no wait | Ends in English everywhere (bar, mark, storage, `lang`) |
| Keyboard | Enter opens the menu, Tab reaches «Português» then «English» (Option+Tab in WebKit), Space and Enter pick, the focus stays, a 2 px white ring is drawn; Escape closes |
| Accessible names | group «Language» / «Idioma»; buttons «Português» and «English», the current one pressed; the codes PT / EN hidden from the reader; each button carries its own `lang` |

**Can the fallback show the wrong language to a Brazilian?** Yes, in one case: the hint did not arrive within 1.5 s (or failed) **and** the browser is not set to Portuguese. That visit opens in English; it is not kept, so the next visit asks again. A Brazilian with the browser in Portuguese gets Portuguese either way. The hint is one 15-byte request to the site's own address on a connection already open, so in normal use this should be rare; it becomes systematic only if the hint file is missing from what is published (see P2-8). The mirror case exists too: a Portuguese-language browser abroad with the hint unreadable gets Portuguese. Both follow the owner's rule of 2026-11-21 for «country unknown».

## (b) Visual

- **The rows are the menu's rows.** Computed style of the two language rows against a neighbour row of the same menu: identical font, size, weight, padding, gap, radius, height, width and left edge — panel 15 px / 600 / 44 px tall; phone sheet Syne 16 px / 52 px tall. Icon 16 px like the others. The title «Language» / «Idioma» has the style of «Connections» / «Conexões». The mark of the current language is the fire orange `rgb(249, 115, 22)`; the other row's mark is hidden. No new shape.
- **Nothing overflows at 390** on Create, Albums, Blend, Playlists, Saved playlists, Inventory or with the Menu open (visitor and signed in); no row of the selector is cut.
- **No raw key, no «disco», the product always «The Album Blender»** in every text, `aria-label`, `title`, `placeholder` and `alt` read on those screens and menus, and in the 1,238 Portuguese entries. Brands and catalog words stay as they are (Apple Music, Spotify, BestEverAlbums, Discogs, Playlists, EPs, Singles, Deluxe).
- **Limits of this sweep:** the screens were read in their empty state (no series, no album, no playlist: the stand-in database is empty). Windows that need data (the album window, the ranking window, export, the inventory item) were judged by the dictionary and by where each key is used, not on screen. Google Fonts was blocked with every other outside host, so Syne was checked by computed style, not by eye.

## (c) Risk to production

- **`firebase.json`**: two additions, both inside `hosting`: `i18n.root: /geo` and a `Cache-Control: no-store` header for `/country.json`. No rewrite, no other header, nothing of Firestore changed.
- **Measured in the emulator**: `/country.json` answers `{"country":"br"}` with the Brazil cookie and `{"country":""}` otherwise, `no-store` both ways. With and without the Brazil cookie, `/`, `/home`, `/index.html`, `/app.html`, `/start`, `/albums`, `/admin`, `/favicon.ico` and `/js/firebase-config.js` answer byte-identical bodies. Only `/country.json` changes. One side effect, harmless: `/geo/ALL_br/country.json` is itself a public address.
- **`scripts/countryHint.mjs`** writes exactly two files in the build folder and answers one address in the dev server. It reads nothing and touches no other file.
- **The deploy scripts** (`deploy-site.sh`, `deploy-preview.sh`, `lib/site-build.sh`) build with `npx vite build` from an export of the branch, so the plugin runs and `dist/country.json` and `dist/geo/ALL_br/country.json` are in what is published (present in my build; `hosting.ignore` does not catch them). `verify_build` and `verify_production` are not confused by them: they look at `app.html`, `index.html`, the main script, `.map` files, the budget and the copied folders. They also do not check the hint (P2-8).
- **`scripts/bundle-budget.json`**: the arithmetic is right (199,612 + 150 = 199,762; 238,197 + 17,617 = 255,814; 301,437 + 72,000 + 82,139 = 455,576 = 455,426 + 150) and my build agrees (main 199.36 kB without the `.env` values, the Portuguese dictionary 17,579 B, the Painel 36.03 kB, «inside the budget»). The explanation is honest: the Portuguese dictionary left the Painel's file and became its own. See P2-10 for what the labels no longer say.

## Findings

### P1

**P1-1 — Three Portuguese texts still show English words.** Owner: builder (dictionary, `public/js/i18n/pt/`).

| Key | Portuguese today | Where | Seen |
|---|---|---|---|
| `notices.router.notFoundBack` | «Ir para Create» | the button of «Página não encontrada» (`ui/NotFound.tsx`) | on screen, 4 of 4 (`/admin` as a visitor) |
| `albums.rankWindow.tip` | «…na receita "Top Tracks by My Own Ranking".» | Albums, the ranking window on the computer (`RankWindow.tsx`) | in the dictionary |
| `albums.rankWindow.note` | «…pela receita "Top Tracks by My Own Ranking".» | Albums, the ranking window on the phone (`RankPhone.tsx`) | in the dictionary |

The menu says «Criar», and the recipe is called «Top Faixas pela Minha Própria Classificação» in Portuguese (`blend.recipes.topNUser.name`), so the two ranking texts name a recipe the person will not find. Check: do the three texts read all in Portuguese and name things as the menu and the recipe list do? N.

### P2

1. **`blend.phone.noSeries`** — «Nenhuma série ainda: crie uma no Início» (seen at 390). There is no «Início»: the tab is «Criar». The English has the same stale word («on Home»).
2. **`inventory.value.mint` / `.nearMint` / `.veryGoodPlus`** — «Mint», «Near Mint», «Very Good Plus» stay in English in Portuguese. They are Discogs' grades; the owner decides whether they stay.
3. **The decades of the Albums year filter** — «1960s … 1990s» are written in the code (`screens/albums/Albums.tsx`, `YEARS`), English style, beside «2000 em diante».
4. **Dates and times follow the browser, not the language chosen** — «Última atualização: 11/23/2026, 6:29:43 PM» in the Portuguese app when the browser is en-US (footer, Albums, Playlists).
5. **The page title stays in English** — «MJRP The Album Blender - Playlist Generator» (TASK-07, declared by the builder).
6. **A black, wordless page while the country is asked** — a visit with no stored choice shows nothing until the hint answers (up to 1.5 s; with a 700 ms hint the first text came at 770–870 ms). It happens on every such visit, because the country is never remembered and the hint is `no-store`. No sign that something is loading.
7. **The fallback can pick the wrong language** — the case described in (a). The owner's rule; recorded so he knows its cost.
8. **The deploy does not check the hint** — if `dist/country.json` or `dist/geo/ALL_br/country.json` were missing, Hosting would answer `app.html` with status 200 and the app would quietly fall back to the browser's language for everybody. Two `[ -f … ]` lines in `verify_build` and one request to `/country.json` with the cookie `firebase-country-override=br` in `verify_production` would catch it.
9. **The entry page and the app disagree abroad** — a first visitor outside Brazil reads the entry page in Portuguese (decision of 2026-11-21) and the app in English. Declared by the builder; one more decision for the owner.
10. **The budget's labels under-state the Brazilian first screen** — the «1st screen» line (main script + the biggest screen) does not count the 17.6 kB Portuguese dictionary that a visitor in Brazil downloads before anything is drawn; the dictionary sits under the «background» ceiling, where it is not background. The note says so; the gate does not.
11. **The Apple Music row of the account panel in Portuguese (1280)** — in the failure state «Não foi possível conectar» is cut to «Não foi possível con…» beside «Tentar de novo». The row is older than this feature and ends in an ellipsis, not an overflow.

## What I could not verify

- **The swap on the real Firebase Hosting** (production or a preview channel): the country read from the IP, the behaviour of the CDN cache with `no-store`, and that a preview channel applies `i18n` as the emulator does. Only the emulator was used. The owner can check a published preview by setting the cookie `firebase-country-override` to `br` and to `us`.
- **Screens with data** in Portuguese (album cards, the album and ranking windows, export, the inventory item, playlists with tracks): read in the dictionary only.
- **`/admin` as the administrator** following the language: the builder's proof covers it; I checked `/admin` only as a visitor.
- **The production texts the owner may have published from the Painel** (`published/texts_pt`): they override the dictionary and were not read; the three texts of P1-1 may already be different there.
- The `--dry-run` of the deploy scripts was not run (it needs the `.env` and runs the whole suite).
