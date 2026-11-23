---
type: visual-parity-recheck
feature: F97
branch: fix/f97-spotify-export-says-why-it-failed
judged_on: 95ef787 (against main at 65a2005)
reference: no prototype (fast lane, fix) — the export window as it is on `main`, the spec's REQ-01..05 and the issue UAT-302
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 6
---

# F97 — the Spotify export says why it failed: independent visual and behaviour pass

**Verdict: pass — 0 P0, 0 P1, 6 P2.** With Spotify answering 403, the window says «Spotify did not allow this account», gives the next step without promising anything, offers no «Try again» and shows no «Tracks matched 0» nor a «not found» list. A search that fails (500 or a dropped connection) is «could not be checked», apart from «not found», with «Try again», and trying again completes once Spotify is back. Real empty answers are still «not found». The success path, the expired login and the rate limit are identical to `main`, element by element. Nothing overflows at 390. English and Portuguese both exist and were both seen in the browser. Three of the six P2 are older than this branch.

## How it was judged

- The site built by me from 95ef787 and, for comparison, from `main` (65a2005), both through the machine queue. Served by a small static server on 127.0.0.1, stopped at the end.
- My own script (the builder's `reports/evidence/F97/browser-proof.mjs` read first, its way into the window reused; scenarios and readings are mine). Playwright, Chromium and WebKit, 1280×900 and 390×844.
- `api.spotify.com` answered only by my stand-in. Nine scenarios: 403 on everything; 403 only when the playlist is created; 500 on the searches; the searches dropped at the network; real-shaped empty results; a mix; all found; 401 on everything; 429 with a wait of 120 seconds.
- Portuguese: seen in the browser, on a Vite dev server of 95ef787 started by me outside the queue (port 5197, stopped at the end), by calling the app's own `setLocale('pt')` with the owner's preview mark. Chromium and WebKit, both widths.
- Safety: the Apple Music hosts, `open.spotify.com`, `accounts.spotify.com`, the production Firebase and every non-local address aborted in every context; no link leaving the site clicked; no app of the Mac opened or controlled; no password typed; no secret read. The whole suite was not run; the four test files of the feature were (74 of 74).
- The screenshots and raw readings stayed in my scratch folder: this commit carries only this report and the log entry.

## What was asked, and what was seen

| | Asked | Seen (same in both engines and both widths) |
|---|---|---|
| a | 403 on every call | «Export Failed · Spotify did not allow this account», «Not created (1)», the note (limited test phase; ask the owner to add the e-mail of the Spotify account; «the list has few places»; Apple Music is available). No «Try again», no «Connect again», no «Tracks matched», no «not found». The export stopped at the first refused search. |
| a' | 403 only on creating the playlist | The same refusal and note; «Tracks matched 4 / 5» and the one track really not found are kept, which is true. |
| b | 500 on the searches; network failure | «Spotify could not be reached, so your tracks could not be checked. Nothing was created.», «5 tracks could not be checked» with their names, «Try again». No «not found». With the stand-in recovered, «Try again» ends in «Export Complete», one playlist created, 5 / 5. |
| c | Real empty results | «No tracks found on Spotify», «No track found (1)», «5 tracks not found» — identical to `main`. |
| d | A mix | «3 / 5»; «Nowhere Man» only in the «not found» list, «Two» only in the «could not be checked» list. 3 + 1 + 1 = 5. |
| e | Success path unchanged | The window before the export and the final report have the same elements, classes and texts as on `main`; the same calls to Spotify. |
| f | Login expired, rate limit | Same elements, texts and calls as on `main`: «Spotify needs you to connect again.» with «Connect to Spotify again»; «Spotify asked to wait 120 seconds…» with «Try again». |

**Visual.** The new states are the window's own pieces: the red warning circle and heading of a failure, the grey «Not created» box, the yellow line that opens into names (the same markup as «not found», now shared), the green «Try again» and the grey «Close». The note of the refusal is a paragraph in the window's text style (14 px, white at 80%). Syne everywhere, computed. No fire accent is used in this window on `main` either (its primary is the Spotify green); nothing new departs from it. At 390 the panel stays inside the screen, no element leaves the panel, no text is clipped, the page does not scroll sideways — in English and in the longer Portuguese.

**Texts.** English and Portuguese exist for the six new keys. Portuguese reads naturally: «O Spotify não permitiu esta conta», «Não foi possível falar com o Spotify, então as suas faixas não puderam ser conferidas. Nada foi criado.», «1 faixa não pôde ser conferida» / «5 faixas não puderam ser conferidas». No «disco». The product name is «The Album Blender» in full, in both languages.

**The shared change (`SpotifyService._fetch`: 403 becomes `SpotifyRefusedError`).** Read with its callers. It is still an `Error`, so every caller that did not know it treats it as before. Album loading asks Spotify only through the popularity source (`spotifyPopularitySource.js`), which rethrows anything that is not «connect again» or «wait»; `AlbumLoadService._failSource` then marks the source as failed and writes the message to the console only. No screen shows the message. What changes: the console line, and the reason line of the admin identity audit, now say «Spotify did not allow this account.» instead of Spotify's raw sentence (kept in `detail`). No bad effect on another screen.

## Findings

No P0. No P1.

### P2

1. **Every 403 gets the «test list» explanation.** `errorOf` turns any 403 into the refusal, and the note says the app is in a limited test phase and to ask the owner. Spotify also answers 403 for other reasons (a permission missing in the login, a playlist of someone else). In those cases the note would be wrong, and the owner himself could read «ask the owner». Anchor: `public/js/services/SpotifyService.js` (`errorOf`). The builder declared it. Check: a 403 whose message is not about registration shows a different text — Y/N. Owner: builder, own issue.
2. **A partial result is headed «Export Complete! 🎉».** In the mix, one track could not be checked, the heading and the green tick say complete, and there is no «Try again» for what was not checked. The count line under it is honest, and it is what the spec describes; the heading overstates. Anchor: `SpotifyExportWindow.tsx` (`Report`, `heading`). The case «one whole playlist not checked while another is created» (separate mode) was not exercised in the browser. Owner: MJRP's call on the screen.
3. **Inherited: the failure is not announced.** The window has no `role`, no `aria-live` and no dialog role anywhere, on `main` and here; after the report the focus is on the page body, on `main` and here. The new messages are readable in the document but are not announced, exactly like the old ones. Not a regression. Anchor: `SpotifyExportWindow.tsx` (header comment, `Report`). Owner: own issue.
4. **Inherited: «1 tracks not found».** The English singular of `spotifyWindow.notFound.one` is wrong on `main`; it now sits right above the correct new «1 track could not be checked». Anchor: `public/js/i18n/en/exportWindow.js:56`. Owner: builder, one word.
5. **Inherited: in Portuguese the service's own sentences stay in English.** «No tracks found on Spotify», «Spotify needs you to connect again.» and the rate-limit sentence come from the service as text; the two new failures are translated because the window maps their kind to a key. Seen: «A exportação falhou · No tracks found on Spotify». Not a regression; Portuguese is not open to the public yet. Owner: the translation wave.
6. **Wording, for MJRP's approval in the Painel.** English «the list has few places» reads a little foreign («has only a few places»). Portuguese «O The Album Blender… dono do The Album Blender» doubles the article; the full name is his rule, and one other Portuguese text already does the same.

## Notes

- The builder's proof says Portuguese could not be seen in the browser. It can: the owner's preview mark plus the app's `setLocale`, on a dev server. Done here.
- REQ-05 (the usage event's `reason`): `reason` is an optional, closed-set property (`describeEvent` keeps only what is given and valid), so events without it are unaffected. Proved by the feature's tests, not in the browser.

## Not verified

- Spotify's real answer to a really refused account (the 403 body is the documented one; no real account was used).
- The usage event leaving the page (the collector is blocked in the proof).
- Separate-playlists mode in the browser; a real screen reader; a real iPhone.
