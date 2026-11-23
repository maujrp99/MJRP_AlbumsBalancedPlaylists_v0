---
type: visual-parity-recheck
feature: F82
branch: claude/f82-cms-texts-panel
judged_on: 8ae419d (judged as a delta over 1247baf, the second pass; commits 6769f08, ae04ee4, 8ae419d)
reference: the second pass report (verdict fail, 1 P1, 9 P2) and, through it, design/proposals/f82-cms/prototype.html + prototype-v2.html
judge: independent (did not build)
date: 2026-11-23
verdict: pass
p0: 0
p1: 0
p2: 10
---

# F82 — the CMS texts panel, third pass: no raw key left, the bold is back, nothing broke

**Verdict: pass — 0 P0, 0 P1, 10 P2.** The one P1 of the second pass is fixed: the two screen chips have a name in English and in Portuguese, and no label anywhere in the Painel shows a dictionary key. The bold is drawn again. The three commits broke nothing in the list, the editor, the translation, the save bar or the guarded entry. Eight P2 of the second pass are still open and are restated below; two more were seen in this pass, both older than the three commits.

This pass is narrow: it did not redo the comparison with the prototype.

## How it was judged

- The branch's dev server (Vite) at 8ae419d, started by me from the builder's folder outside the machine queue, on port 5473, and stopped at the end. Playwright, Chromium, 1280×800 and 390×844, English and Portuguese.
- The second pass's script reused as it is (`judge2.mjs`: Firebase answered at the network layer by the builders' stand-in, a stand-in administrator, never a password), plus one scenario of mine for this pass (`raw`). Portuguese was reached as in the second pass, by calling the app's own `setLocale` from the page: the app has no language switch yet.
- Safety: the five music hosts and the three schemes aborted by name in every context; requests attempted to them: 0. No link leaving the site was clicked, no app of the Mac opened or controlled, the real translation API never called.
- Outputs: `/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f82-panel-judge3/` (`judge3.mjs`, `raw.part.mjs`, `shots/`).
- In the builder's folder I wrote no file of the project; Vite refreshed its own cache under `node_modules/.vite` (ignored by git), as in the second pass.

## (a) The two claims, in the browser

**No raw key (second pass P1-1): fixed.** At 1280 and 390, in English and in Portuguese:

- The 13 screen chips read: Albums, Blend, Coming soon, Export window, **Spotify export window**, Inventory, Notices, **Questions and confirmations**, Playlists, Saved playlists, Menu and frame, Create, Shared pieces. In Portuguese the two are «Janela de exportar para o Spotify» and «Perguntas e confirmações».
- Every chip was clicked (13 screens, 1,235 rows in all) and, on each, the first row's editor was opened. Every text and every `aria-label`, `title` and `placeholder` inside the Painel was read: none has the shape of a key, except the row's own key column, which shows the key on purpose (the open P2 number 4). The search's empty state and the save bar were read too.
- The new test (`test/screens/admin/adapter.test.ts`) takes the screen ids from the dictionaries, not from a hand list, so a new family of keys with no name fails it. Read, not run.

**The bold (second pass P2 number 2): fixed.** Computed style with the fonts loaded, the same at both widths and in both languages: rail buttons 600 / 14 px, chips 600 / 13 px, «Clear the search» 600, «Save», «Discard», «Edit», «Approve the Portuguese» 700 (13 px and 12.5 px), «Translate from…» 600 / 12 px. The fields did not turn bold (400). No button label is cut by the heavier weight, the chips wrap in 2 lines at 1280 and 8 at 390 inside their box, no horizontal scroll.

**The budget evidence (second pass P2 number 9, the file): fixed as a file.** `reports/evidence/F82/texts-panel/bundle-budget.txt` now says main script 198,469 B against a ceiling of 198,619 B and 238,197 B after the first screen, which is what `scripts/bundle-budget.json` says (measured 198,469 / 238,197, margin 150). I did not rebuild.

## (b) Regression after the three commits: none seen

Replayed with the second pass's scenarios, 1280 and 390:

- **List:** no `admin.*` row and no «admin» chip; search across screens (374 rows for «album»); the empty state with «Clear the search»; no horizontal scroll.
- **Editor:** English and Portuguese side by side at 1280, stacked at 390; one-line fields.
- **Translate:** the suggestion waits («Translate again», «Discard», «Accept»), the field changes only on «Accept»; the failure says why and leaves the field as it was.
- **Save bar:** counts the change; with the page scrolled to 25 %, 50 % and 100 %, «Save» and «Discard» answer the click (bar at y 0 at 1280, at y 56 under the app's top bar at 390); the confirmation opens inside the bar and «Save and put live» saves («✓ Saved and live: 1 text.»).
- **Rich bar (with the second pass's declared stand-in of one `rich` key):** 19 buttons, image, video and book hidden, the «+» menu inside the screen, 44×44 at 390, typing counts as a change.
- **Guarded entry:** visitor, account with no record, role «editor»: «Page not found» with «Go to Create», none of the Painel's files asked. Database held 6 s: «Could not check right now» after 3.4 s.
- No console error, except Firebase's own «Could not reach Cloud Firestore backend» in the 6 s scenario, caused by my delay (same as the second pass).

## P2 — still open from the second pass (numbers of that report)

1. **No text opens the rich editor yet** (`public/js/i18n/textKinds.js` is still an empty list): open.
3. **The dress is the kit's, not the prototype's** (system font and flat orange where the prototype has Syne 700–800, the fire gradient, a white chosen chip, a table with a header line): open; the weights are right now, the rest is as it was.
4. **A row is named by its key only**, not by its place in plain words: open.
5. **Three pieces of the prototype's editor are missing** (the kind of text, the letter count against the English, «Live: …»): open.
6. **The rail has no count next to «Texts»** and lists two «later» items, not the prototype's four: open.
7. **On the phone the app's header cuts the name on `/admin`** («The Album Blend…»): open, seen again at 390.
8. **Small things on the phone:** the row's checkbox is 28×28; the save bar stays stuck with nothing to save (about 140 px under the top bar); with the language switched while the Painel is open the kit's words stay in English («Translate from Portuguese» under «Português») until a reload: open, all three seen again.
9. **The main script is +3,595 B against `main`** by the branch's own measure, and the branch raises its own ceiling: open (only the stale evidence file of this item was fixed).

Closed: number 2 (the bold).

## P2 — seen in this pass (both older than the three commits)

10. **In Portuguese, four screen chips keep the English name.** `public/js/i18n/pt/admin.js:111-120` names the screens «Albums», «Blend», «Inventory» and «Create», and the rail says «Receitas do Blend», while the app's own menu, on the same screen, says «Álbuns», «Mistura», «Acervo» and «Criar» (`pt/shell.js`). They are names, not raw keys. Nobody reaches the Portuguese Painel today (no language switch yet).
11. **The builders' browser proof does not run from where it is committed.** `reports/evidence/F82/texts-panel/proof.mjs:7` imports `../create-lean-computer/harness.mjs`, and no such file is in the repository (I used a copy from the session's scratch folder). The «90 of 90» cannot be replayed from the branch alone.

(The frontmatter counts 10: eight carried, two new.)

## Not verified

- A build in the publication shape and the budget numbers themselves: the file was read against `bundle-budget.json`, nothing was rebuilt.
- The test suite, the new test included (read only), and the builders' «90 of 90» (taken as written).
- The comparison with the prototype: not redone; the open P2 numbers 3 to 6 are carried from the second pass, checked only by what the screenshots of this pass show.
- Conflict between two devices, «no permission», leaving with unsaved changes, the validator's refusals: not replayed (the builders' proof covers them).
- The Painel in Portuguese as the owner would reach it (no caller of `setLocale` in the app yet).
- The real translation API, the server started for real, the Firestore rules.
