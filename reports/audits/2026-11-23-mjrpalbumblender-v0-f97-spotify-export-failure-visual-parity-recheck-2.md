---
type: visual-parity-recheck
feature: F97
branch: fix/f97-spotify-export-says-why-it-failed
judged_on: 6c00545 (judged as a delta over 95ef787, the first pass; the wording commit fc2c62f and two merges of `main`)
reference: the first pass report (verdict pass, 0 P0, 0 P1, 6 P2), the spec's REQ-01..05 and the issue UAT-302
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 5
---

# F97 — the Spotify export says why it failed, second pass: the wording commit holds, and Portuguese was seen through the app's own language choice

**Verdict: pass — 0 P0, 0 P1, 5 P2. Nothing here should stop the publication.** The wording commit does what it says and nothing else. The four cases behave as in the first pass, in English and in Portuguese, in Chromium and WebKit, at 1280 and 390. One P2 of the first pass is closed (the English singular), half of another (the Portuguese article); five stay open, all carried.

This pass is narrow: it did not redo the comparison with `main`, the expired login or the rate limit.

## How it was judged

- The site built by me from 6c00545 through the machine queue, served by a small static server on 127.0.0.1, stopped at the end.
- The first pass's script, with the language set the way the app itself stores it (`albumblender:lang` = `pt` or `en`): no dev server and no call to `setLocale` this time. Five scenarios with my Spotify stand-in: 403 on everything; 500 on the searches, then recovered and «Try again»; real-shaped empty results; a mix; all found.
- Safety as in the first pass: the Apple Music hosts, `open.spotify.com`, `accounts.spotify.com`, the production Firebase and every non-local address aborted; no link leaving the site clicked; no app of the Mac touched; no password, no secret. The test suite was not run.
- The screenshots and raw readings stayed in my scratch folder.

## The wording commit (fc2c62f), line by line

- `public/js/i18n/en/exportWindow.js`: `spotifyWindow.notFound.one` is now «{count} track not found». One line.
- `public/js/i18n/pt/exportWindow.js`: the note of the refusal now reads «No Spotify, The Album Blender está numa fase de testes limitada… Peça a quem cuida de The Album Blender…». One line. No article before the name; the name in full.
- Nothing under `shared/` changed. The two merges of `main` did not touch any file of the export (the window, the two services, the errors, the two dictionaries, the outcome model, the usage events).
- **The frozen fixture** (`test/fixtures/spotifyExportBeforeF83.json`): two entries changed, and in each only the words «1 tracks not found» became «1 track not found» (once in the markup, once in the list of texts: four strings). Every element, class, attribute and other text is byte for byte as before. It does not weaken what the test protects: the fixture guards that the window is drawn the same as the hand-made one, and it still pins everything except the one wording that was changed on purpose. The change is written down in the test's header, and two new assertions pin the new wording in both languages. The honest cost: for those four strings the fixture is no longer a recording of the old window but a hand edit; a regenerated fixture could not have been made, since the old window no longer exists.

## What was seen

Same result in both engines and both widths; panel inside the screen, no element outside the panel, no clipped text, no sideways scroll, Syne computed, no page error.

| Case | English | Portuguese |
|---|---|---|
| 403 | «Export Failed · Spotify did not allow this account», the note, only «Close» | «A exportação falhou · O Spotify não permitiu esta conta», «Não criadas (1)», the new note, only «Fechar» |
| 500, then retry | «…your tracks could not be checked. Nothing was created.», «5 tracks could not be checked», «Try again» → «Export Complete», 5 / 5 | «Não foi possível falar com o Spotify, então as suas faixas não puderam ser conferidas. Nada foi criado.», «5 faixas não puderam ser conferidas», «Tentar de novo» → «Exportação concluída!», 5 / 5 |
| Empty | «No tracks found on Spotify», «5 tracks not found» | «Nenhuma faixa encontrada (1)», «5 faixas não encontradas» — and the service's sentence «No tracks found on Spotify» still in English (carried, item 4) |
| Mix | «3 / 5», «1 track not found», «1 track could not be checked» | «3 / 5», «1 faixa não encontrada», «1 faixa não pôde ser conferida» |

Singular and plural are right in both languages. No English sentence is left in the new states in Portuguese. The Portuguese reads naturally; no «disco»; «The Album Blender» in full, with no article.

## Findings

No P0. No P1.

**Closed since the first pass:** «1 tracks not found» (was item 4); the doubled article in Portuguese (half of item 6).

### P2, carried

1. **Every 403 gets the «test list» explanation**, though Spotify also answers 403 for other reasons (a missing permission, someone else's playlist). Anchor: `SpotifyService.js` (`errorOf`). Owner: builder, own issue.
2. **A partial result is headed «Export Complete! 🎉»** («Exportação concluída!») when a track could not be checked, with no «Try again» for it. Owner: MJRP's call on the screen.
3. **Inherited: the failure is not announced.** No `role`, no `aria-live`, focus on the page body after the report, as on `main`. Owner: own issue.
4. **Inherited: in Portuguese the service's own sentences stay in English** («No tracks found on Spotify», the reconnect and rate-limit sentences). It weighs more now than in the first pass: Portuguese is open to the public in Brazil since the merge of `main`. Still older than this fix and not in its new states. Owner: own issue, soon.
5. **Wording.** English «the list has few places» still reads a little foreign. For MJRP's approval in the Painel.

## Not verified

- Spotify's real answer to a really refused account; the usage event leaving the page; separate-playlists mode in the browser; a real screen reader; a real iPhone.
- The language chosen by country (the app opening in Portuguese for Brazil by itself): here the choice was the stored one.
