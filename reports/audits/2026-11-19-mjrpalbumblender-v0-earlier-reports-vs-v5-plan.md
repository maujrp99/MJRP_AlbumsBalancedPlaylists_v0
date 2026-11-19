---
type: cross-check
subject: "Os relatórios anteriores do v0 (V1, apêndices verificados, críticas) contra a análise de 2026-11-19 e o plano da v5.0"
project: mjrpalbumblender-v0
written: "2026-11-19 14:49"
who_wrote: agente separado, só de leitura, a pedido do implementador (o MJRP pediu o cruzamento antes de começar a v5.0)
spot_checked: "o implementador conferiu no código seis das afirmações mais graves (regras do Firestore, leitura em série das playlists guardadas, apagar-antes-de-gravar no lote, loja da Apple pelo idioma do navegador, rotas de depuração montadas, conferência de state do Spotify desligada): as seis conferem. O resto não foi reconferido por ele."
---

> **Estado das linhas, atualizado em 2026-11-19 14:56 a pedido do MJRP.** A coluna «Class» de cada tabela diz: ✅ consertado na v4.0 (com a issue e a feature); 🔧 a consertar na v5.0 (com a feature); 🚫 não vale mais (com o motivo na última coluna); ⏳ em aberto, a discutir com o MJRP no chat; ⚠️ contradiz a análise de 2026-11-19 (a ADR-0019 já foi corrigida nesses pontos; o resto, a discutir). O texto do relatório, em inglês, é do agente que fez o cruzamento e não foi reescrito. Depois dele: a UAT-149 passou a `fixed` (F53); a janela de ranking (UAT-187), o ícone e o título da aba estão em produção; o botão «Close» sem rótulo (UAT-195) está consertado na `main`.


# V0 — earlier reports against today's analysis and the v5.0 plan

Written 2026-11-19. Read-only cross-check: nothing was changed in any repository, no test and no app was run.

- **Before side read:** the tech-debt survey (whole file), the six `v0-appendix-*-verified.md` notes (whole files; their verdicts are used instead of the raw appendices), the two load-design critiques, the feature inventory (sections 4 and 5 and the defect marks) and the coverage checklist (verdict, traps, section H).
- **After side read:** the load-architecture analysis, the browser regression report, ADR-0019, `arch.md` sections 1 to 19 of the load proposal, `uat.md` (all 193 rows of the worktree plus UAT-194 from the main checkout), the draft specs of F49, F52, F54 to F58, and `ROADMAP.md` lines 96-97.
- **Code checked:** worktree `fix-albums-loading-and-cache-d92daf`, branch `fix/f53-test-suite-green` at `d9e6103`. `git diff HEAD main -- public server shared firestore.rules cloudbuild.yaml .github scripts` is empty, so the code is the same as `main`.
- **Not read:** the raw appendices A to M of the bootstrap report (930 kB) and its body before line 204; the parity and aesthetic audits; the V0 architecture audit of 2026-10-28 that UAT-14 to UAT-25 cite.
- Paths are relative to `public/js/` unless they start with `server/`, `scripts/`, `test/`, `docs/` or a root file name.

## How the rows are counted

One row is one distinct finding, or one tight group of same-kind findings with the source ids listed. Rows the verified notes marked WRONG in the earlier report are not findings and are left out (A-14e, A-21, B-49, C33, D43, D48, D49, F45, G A-25c, H08, J07, K-3, K-4, L H-16). Ids: `TD` tech-debt survey (H, R, M); `A-`, `B-`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M` the appendices; `xx-N` the "not in the report" lists of each verified note; `CR` the first critique; `OP` the second critique.

| Estado | Linhas |
|---|---|
| ✅ Consertado na v4.0 | 33 |
| 🔧 A consertar na v5.0 | 10 |
| 🚫 Não vale mais | 3 |
| ⏳ Em aberto: tem issue, sem feature (a discutir) | 20 |
| ⏳ Em aberto: sem issue e sem plano (a discutir) | 83 |
| ⚠️ Contradiz a análise de 2026-11-19 (a discutir) | 4 |
| Total | 153 |

The rows cover about 560 source rows of the verified notes. Roughly 130 of them are dead code and 120 are manual-versus-code text; each of those two sets is folded into a few MISSING rows.

## The three answers

### 1. Earlier findings that should change the v5.0 design

1. **The saved-playlists screen does not load albums, so the load service is the wrong owner for it (D24).** The cause of the 20 seconds was already pinned: one sequential read of the playlists sub-collection per series, with every track, `components/playlists/SavedPlaylistsController.js:50` and `:54-62` (46 series in the account). Today's analysis draws «Playlists guardadas → Serviço de carga» and UAT-186 says «Causa: não investigada». F56 should split in two: albums through the load service (blend, edit), and a playlist read that is parallel or lighter (a collection-group query, or a per-series summary) for the history screen.
2. **"Is this the album asked for?" exists in four more places than F55 names.** F55 fixes the catalog match (`models/AlbumIdentity.js`, threshold 0.35). The same "take the first result" rule decides the Spotify album (E9, `services/SpotifyService.js:239-240`), the BestEverAlbums album on the server (G B-02, B-06, 8.5-c, G-N4), the local cover (B-50, `services/OptimizedAlbumLoader.js:129`, wired into the new load at `services/albums/albumLoading.js:37-40`) and the AI second source, which can return a made-up «Unknown Album» with no tracks (G A-29). An album can be the right one and still carry the ratings, popularity or cover of another. F55 should state one match rule and say which of the five matchers it covers.
3. **The storefront explains part of the 404s behind UAT-184, and nobody checked it (E25c, E25d).** The catalog uses the browser-language storefront, never the account one: `services/musickit/MusicKitAuth.js:99`, `:38-47`. An `appleMusicId` chosen in one storefront answers 404 in another; the new adapter's own comment says so (`services/albums/adapters/CatalogAdapter.js`, `_detailsOfChosen`). The regression ran in Claude's embedded browser, whose language may not be the owner's. Before F55 writes «o identificador novo gravado na série», it must record which storefront the id belongs to, or one browser will keep rewriting the ids another browser chose. Not verified: the language of the test browser and whether the ids are valid in the owner's storefront.
4. **Failure is still stored as "empty" for two sources, and since F51 that goes into Firestore.** Popularity: an expired Spotify token (E3, `services/SpotifyAuthService.js:194-200`), a 401 or a 429 (E5, E6) all end as «no data»; the adapter returns `empty` (`adapters/enrichers.js`, `PopularityEnricher`). Ratings: the server answers 200 with nulls when the scraper fails (CR P0-1, UAT-23). `models/albumFacts.js` then writes `sources.popularity` and `sources.acclaim` into the series document. And an album with a BestEverAlbums URL and zero matched ratings is recorded as `done`, not `empty` (G-N2): `adapters/enrichers.js:31` and `:52`, fed by `server/lib/services/EnrichmentService.js:121`. The server error contract (F52) is a precondition of the blend move (F56), because the blend needs ratings.
5. **A server cache for ratings would freeze wrong answers unless the scraper is fixed first.** The scraper has confirmed matching defects on the main path: multi-word artist and title never match the album page (G B-01), the first link with any title word stops the scan (G B-02), different tracks share one rating key (G-N3), a shorter title contained in the wanted one is accepted (G-N4). None has an issue. F52 should order the work: error contract, then scraper correctness, then cache.
6. **`albumQueries` already has two whole-array writers from memory, and v5.0 adds a third.** `repositories/SeriesRepository.js:58-59` (facts, F51) and `controllers/PlaylistsController.js:323-331` (every playlist save rewrites the series from the in-memory copy, D11). F55 will write the new album id into the same array. A stale copy in memory overwrites the list of albums of a series, which is the person's main data. The design needs one writer, or per-field updates, before a third is added.
7. **The shelf is not a projection yet.** The critiques asked for one owner of «pedido → álbum»; `arch.md` §15.1 and ADR-0019 decision 7 say it is done. Four other writers remain: `controllers/BlendingController.js:154-156`, `controllers/PlaylistsController.js:159-170`, `services/SeriesService.js:129-130` and `:287-291`, `components/series/SeriesEventHandler.js:237` and `:294`; and the projection replaces a series' shelf on every notice (`stores/albums.js:75-80`). The «only ready albums» selector promised in §15.10 exists with no caller (`stores/albumLoad.js:96`). F56 must include: remove those writers, make blend and regenerate read only ready albums, and carry the person's ranking into the edit path (CD-N6).
8. **The Home classifier may be failing because of the server, not because of two classifiers (B-22, G A-24).** `server/routes/ai.js:65` answers 200 with an empty list on any error, and the AI list uses the same Gemini key that answers 402 today (UAT-181). With an empty list the AI stage cannot confirm a studio album. Hypothesis, not verified. F57 should test the classification with the AI list working before redesigning, and it inherits known classifier defects with no test (B-13, B-14, B-15, B-17, B-19).
9. **The "one owner" rule has two more bypasses than the ADR lists.** `services/SeriesService.js:239-291` (`injectAlbumsIntoViewCache`, enrichment in parallel with no limit, B-30) and `:307-459` (Refetch, noted in `arch.md` §17 as an open task with no issue). Both call the ratings route outside the queue, so «at most 4 at once» is not the real ceiling.

### 2. Earlier findings more severe than anything in the v5.0 plan

All of these are confirmed in the code today. The first five have open issues and sit in no feature of v4.0 or v5.0.

1. **Anyone can read, overwrite or delete any user's rankings**, without signing in: `firestore.rules:32-36` (`allow read, write: if true`). Any signed-in visitor, anonymous included, can overwrite the shared albums and the Spotify cache (`:42-44`, `:49-52`). UAT-15, P1, open. Also F44: `firebase.json` has no `firestore` block, so the repository does not deploy the rules; what is live is not verified.
2. **The production server is public, with debug routes mounted**: `server/index.js:134-136`, `cloudbuild.yaml:32`. `GET /api/debug/files?path=` lists any folder of the container; `/api/generate`, `/api/ai/studio-albums` and `/api/debug/raw-ranking` spend the paid AI key for any caller; requests without `Origin` pass CORS (`server/index.js:64-68`). UAT-16, P1, open. Not named in UAT-16: `rawStage: 'ranking'` can crash the process (G A-20, `server/lib/services/GenerationService.js:71`) and the Apple developer token is handed to any caller (G-N14).
3. **A Discogs token is written in two tracked scripts**: `scripts/generate-dataset.js:8`, `scripts/fetch-missing-artists.js:12`. UAT-17, open. It should be revoked, not only removed.
4. **Spotify sign-in**: the `state` check is disabled (`services/SpotifyAuthService.js:118-122`), the verifier comes from `Math.random` (`:46`), and the refresh token sits in `localStorage` (`:179-182`) on a page that allows inline script. UAT-28 covers only the storage; the `state` check has no issue.
5. **Guest data is not migrated on sign-in** (UAT-12, P1, open), and **unsaved generated playlists are lost on reload** (UAT-05, P1, open).
6. **Data loss with no issue at all:**
   - Saving an edited batch deletes the old playlists one by one and then writes the new ones; a failure in between loses the batch (D1, `controllers/PlaylistsController.js:350-352`, `:362`).
   - The save can go to the active series instead of the playlists' series (D13, `:305-310`), and every save rewrites the series document from memory (D11, `:323-331`).
   - After sign-out, the previous person's inventory stays on screen and is copied, malformed, into the next anonymous account (F7, EF-N2, `stores/inventory.js:29-45`).
   - Deleting a series leaves its playlists in Firestore, unreachable (D46, F14, `services/SeriesService.js:121-124`).
   - A double click on Save can write the batch twice (CD-N7); nothing warns about unsaved edits (D16).
7. **CI has never run**: 100 of 100 workflow runs failed, the last with no job (L H-14, KLM-N3), and lint is ignored (`.github/workflows/ci-firebase.yml:32-33`). Every fitness function in ADR-0019 decision 10 «fails the build» only on the developer's machine. UAT-20 names the lint only.

### 3. Where today's analysis is wrong, overconfident or unverified

1. **«80 albums in 8.5 s (before: 46 of 80 in 4 min 40 s)» compares two different things.** The old number is find plus ratings; the new one is albums found. Ratings still run 4 at a time at 5 to 7 s each (`arch.md` §17: about 31 in 60 s), so 217 albums need several minutes to be complete. Spotify was not connected in the measurements (session notes; CR P2), so the popularity source has no number at all.
2. **«At most 4» is not the ceiling on the server.** The 20 s deadline in the browser does not stop the scrape (CR P1-4); the old loop in blend and edit, `injectAlbumsIntoViewCache` and Refetch call the same route outside the queue. The critiques said «começar em 2 e medir»; the code has 4 with the comment «4 is being measured» (`services/albums/AlbumLoadService.js:40`), justified by speed, not by what the site tolerates (G B-10: no cache, no delay, browser-like user agent).
3. **ADR-0019 states as decided what the code does not do yet.** Decision 1 («controllers do not loop over albums») and decision 7 (the shelf «is a projection») are false for four writers listed in answer 1.7; decision 3's failure states do not hold for popularity and ratings (answer 1.4).
4. **The reason given to reject «move the load to the server» is inaccurate.** ADR: «called from the browser with the person's storefront». Code: the storefront is the browser language (`MusicKitAuth.js:99`); the account storefront is never used (E25c). The catalog needs only the developer token, which the server itself issues (`server/routes/musickit.js`); that last point is API knowledge, not verified in the repository.
5. **Three causes marked «não investigada» were already in the earlier reports**: saved playlists (D24), the classifier (B-13 to B-17, B-21, B-22), and the wrong-album family (B-50, E9, the scraper rows). UAT-184 also leaves open «quantos álbuns da conta estão trocados»; nothing in the plan counts them.
6. **The regression's «passou» for blend hides what the earlier reports show about that path.** The blend still searches by text and ignores the chosen edition (`api/client.js:71-77`, B-11), sends any Apple failure to the paid AI route (`:181-187`, E42), and drops a failed album with a console warning only (`controllers/BlendingController.js:148-150`). With the AI route answering 402, a blend can come out with fewer albums and no notice. Not verified in the browser.
7. **Not tested today and broken according to the verified notes:** Spotify export after one hour (D6), «By Artist then By Rank» that does not group by artist (C6), Apple export failures that only reach the console (D20), bulk paste with a hyphen in the artist (B-05), and Home after the Spotify callback, where the screen is drawn but its buttons are dead (A-01, `app.js:133-146`, `router.js:138`).
8. **The complexity table measures the load folder only.** The functions it wants to retire are not the worst: `handleSave` is 27 and holds three of the data-loss findings above. F58 limits `services/albums/` and leaves it out.
9. **The analysis and the ADR were not judged separately**, as both say. The two critiques judged the proposal before the code; nothing has judged the code against the critiques. Four critique points are still open in the code (rows CR-04, CR-05, CR-08, OP-05 below).

## The four contradictions, with both sides

| # | Earlier report | Today | What the code supports |
|---|---|---|---|
| 1 | Critique 1, P1-1: «`albums.js` vira leitura derivada para as outras telas» | ADR-0019, decision 7: «`stores/albums.js` is a projection of it» | The earlier report. The shelf is written by the projection (`services/albums/albumLoading.js:77-80`) and also by `controllers/BlendingController.js:154-156`, `controllers/PlaylistsController.js:159-170`, `services/SeriesService.js:129-130`, `:287-291` and `components/series/SeriesEventHandler.js:237`, `:294`. The refusal of an inactive series is still there (`stores/albums.js:89-97`). |
| 2 | Critique 1, P1-4: «começar em 2 e medir» and «o teto de 4 não é o teto no servidor» | `arch.md` §2: «no máximo 4» calls at once to the ratings route | The earlier report. The queue allows 4 (`services/albums/AlbumLoadService.js:40`), and three other callers reach the same route outside the queue (`services/SeriesService.js:255`, `:330`; the old loop used by blend and edit). |
| 3 | Appendix E, E25c: «Account storefront is never used» | ADR-0019, alternative 2: «called from the browser with the person's storefront» | The earlier report: `services/musickit/MusicKitAuth.js:99` sets the storefront from the browser language. |
| 4 | Appendix D, D24: «History does N+1 sequential reads, all tracks, no cache» | Load analysis, §2: the saved-playlists screen goes to the load service; UAT-186: «Causa: não investigada» | The earlier report: `components/playlists/SavedPlaylistsController.js:54-62` reads playlists, one series after the other; no album is loaded on that screen. |

## Classification

### A. Load, cache and state (tech-debt survey, critiques, related appendix rows)

| Ids | Finding | Class | Issue · feature | Checked |
|---|---|---|---|---|
| TD-H1, M3, M4 | One sequential queue, no deadline | ✅ Consertado na v4.0 | UAT-172 · F45 | `services/albums/AlbumLoadService.js:36-42` |
| TD-H2, R12 | One boolean for loading, filtered and empty | ✅ Consertado na v4.0 | UAT-173 · F45, F46 | state per album in `stores/albumLoad.js`; not re-read line by line |
| TD-H3, R5 | «Ready» means at least one album | ✅ Consertado na v4.0 | UAT-173 · F45 | reconciliation on every load (`arch.md` §15.3); browser evidence in `uat.md`, not re-run |
| TD-H4, M17 | A failed album leaves no trace | ✅ Consertado na v4.0 | UAT-174 · F45 | failure notice per series (`components/series/SeriesGridRenderer.js:177-189`) |
| TD-H5, R11 | Load order differs from display order | ✅ Consertado na v4.0 | F45 | per `arch.md` §15.4; not verified in code |
| TD-H6a, B-31, OP P2-1 | Subscriptions pile up on each visit | ✅ Consertado na v4.0 | F46 | `controllers/SeriesController.js:77-82`, `:101` |
| TD-H6b | The whole grid is rebuilt on each notice | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | still `SafeDOM.replaceChildren` of the whole grid in `SeriesGridRenderer.render`; `arch.md` §4 promised a redraw per series |
| TD-H7, M16 | One-shot visibility observer | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `SeriesGridRenderer.js:47`, `:215` still use `VirtualScrollObserver`; whether the stuck case can still happen is not verified |
| TD-H8, F33 | The cache hands out the live object | ✅ Consertado na v4.0 | F45, F48 | `adapters/AlbumCacheAdapter.js` `get` copies; enrichers clone |
| TD-H9, M1, M2, KLM-N2 | Old load writes into the new context; progress callback not awaited | ✅ Consertado na v4.0 | F45 | generations in the service; the old loop survives in blend and edit (row below) |
| TD-R1, C34 | Five definitions of «same album», five `normalizeKey` | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | a sixth key was added (`queryKey`); the old ones live in `cache/albumCache.js` and `stores/albums.js` |
| TD-R2 | Three copies of the «Artist - Title» split | ✅ Consertado na v4.0 | F45, F46 | `models/albumQuery.js:5-6`, `:29`; old copies remain in `api/client.js` |
| TD-R3, R7, F13, F34 | Validity in five places; dead version and cleanup functions; `:all` keys never written | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; minor |
| TD-R4, M10, AB-N05, A-24, F36 | «Clear Cache» clears the wrong store and the Spotify session | ✅ Consertado na v4.0 | UAT-177 · F48 | `services/albums/clearAlbumCaches.js:26-33` |
| TD-R6, M9, B-38, F11 | The ranking cache never works | ✅ Consertado na v4.0 | UAT-176 · F48 | `repositories/UserRankingRepository.js:26`, `:54` |
| TD-R8, M18, B-23, F37 | Series list cut at 20 | ✅ Consertado na v4.0 | UAT-24 · F47 | `services/SeriesService.js:142-143` |
| TD-R9 | Album put in a series by approximate title match | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `SeriesGridRenderer.js:108` still calls `groupAlbumsBySeries`; OP P0-1 asked to derive the groups from the load store |
| TD-R10, B-27 | Add and remove use different rules; the remove fallback tests a text never thrown | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; matters once F55 changes which title is loaded |
| TD-R14, B-40, F39 | Every load writes each album to the shared collection, ranking included | ✅ Consertado na v4.0 | UAT-176 · F48 | `repositories/SharedAlbumRepository.js:13`; the rule stays open (row UAT-15) |
| TD-R15, M6, G CL-a, G-N1, KLM-N1 | Second source: retry never runs, result never cached | ✅ Consertado na v4.0 | UAT-175 · F48 | `api/client.js:232-244`; base saved per query by the load |
| TD §5.1-13, B-11 | The chosen `appleMusicId` is stored and ignored | ✅ Consertado na v4.0 | F45 | `adapters/CatalogAdapter.js:131-132`; still ignored on the old path |
| TD §5.1-15, E42, OP P1-4b | Blend and playlist edit load with their own loop, by text, falling to paid AI on any Apple error | 🔧 A consertar na v5.0 | UAT-189 · F56 | `controllers/BlendingController.js:133`, `controllers/PlaylistsController.js:165`, `api/client.js:71-77`, `:181-187` |
| TD-M15 | Refetch saved under another key than the load reads | ✅ Consertado na v4.0 | F48 | `AlbumLoadService.js:169-177` (`adoptAlbum`) |
| TD-M5 | Legacy `localStorage` cache window of 7 days | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | only reachable through the old path now; trivial |
| TD-M11 | Progress bar `finish()` without `start()` | ✅ Consertado na v4.0 | F45 | per `arch.md` §15 table; not verified in code |
| TD-M7, M8, M12, M13, M14 and the other manual rows | Manual text differs from code (survey §1.1) | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `git status` lists 19 manual files as modified but `git diff --stat` shows no change; not verified |
| CR P0-2, OP P0-2, CR P1-3 | What is cached, when, under which key | ✅ Consertado na v4.0 | F45, F48 | `adapters/AlbumCacheAdapter.js:14-16` and record per query |
| CR P0-3, OP P1-3, OP P0-3 item 5 | Session reused while the list of requests changed | ✅ Consertado na v4.0 | F45 | regression scenario 2 (new series loads); code not re-read |
| CR P0-3b, B-55 | Editing a series reloads more than what changed | 🔧 A consertar na v5.0 | UAT-191 · F56 | per the regression report |
| CR P0-1, OP P2-4, G 8.5-a, 8.5-b, G-N11 | The server answers 200 and empty when the scraper fails | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-23 | ADR-0019 assigns it to F52, but F52 `fixes:` only UAT-181 |
| CR-04 (CR P1-1, OP P0-1) | Two lists for «which albums a series has» | ⚠️ Contradiz a análise de 2026-11-19 (a discutir) | — | see «The four contradictions» and answer 1.7 |
| CR-05 (CR P1-2, §15.10) | Readers that build playlists must get only ready albums | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `stores/albumLoad.js:96` has no caller |
| CR-08 (CR P1-4, §15.8) | The ceiling of 4 is not the server's; start at 2 | ⚠️ Contradiz a análise de 2026-11-19 (a discutir) | — | see «The four contradictions» and answer 3.2 |
| CR P1-5, OP P0-3 | Behaviours with no owner in the proposal | ✅ Consertado na v4.0 | F45 to F48 | table in `arch.md` §15; Refetch excepted (next row) |
| B-29, B-30, OP P0-3 item 6 | Refetch and «injection» enrich outside the queue, with no limit | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/SeriesService.js:239-291`, `:307-459`; `arch.md` §17 calls it an open task |
| CR P1-6, OP question 5 | Cancel cannot really abort | ✅ Consertado na v4.0 | F45 | ADR-0019 decision 2 |
| CR P1-7, OP P0-4 | F45 depended on parts of F46 and F48 | 🚫 Não vale mais | — | Motivo: a divisão em fatias foi refeita antes do código; a F45 deixou de depender de partes da F46 e da F48 (`arch.md` §15.4 e §17). |
| OP-05 (CR P1-8, OP P1-5) | Fitness functions miss: one key function, no shelf writer outside the service, only the adapter calls the ratings route | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | the 9 cases of `test/architecture/albumLoadBoundaries.test.js` (titles at `:35-86`) check imports only; UAT-194 adds complexity only |
| CR P1-9, OP P1-2 | Filters lie while series are pending | ✅ Consertado na v4.0 | F51 | filter over requests, count of unchecked (`arch.md` §16, §18) |
| OP P1-1, CR question 4 | A published album is changed in place | ✅ Consertado na v4.0 | F45, F46 | `adapters/enrichers.js` (`apply` on a copy) |
| OP P1-4a | Second-source retry contradicted the proposal | ✅ Consertado na v4.0 | F48 | `api/client.js:232-244` |
| OP P1-4c | «Does not match» is not told apart from «not found» | 🔧 A consertar na v5.0 | UAT-184 · F55 | `adapters/CatalogAdapter.js:99-108` |
| CR P2 measure | Baseline measured with Spotify off; no basis for the 20 s target | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | see answer 3.1 |
| CR P2 ranking | One read for all rankings instead of one per album | ✅ Consertado na v4.0 | F46 | `services/ranking/OwnRankingService.js` (`ensureLoaded`), per `arch.md` §18 |
| G-N2 | A URL with zero matched ratings is kept as «done» | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `adapters/enrichers.js:31`, `:52`; `server/lib/services/EnrichmentService.js:121` |
| E3, E5, E6, E7 | Spotify: expired token, 401 and 429 become «no data» | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/SpotifyAuthService.js:194-200`; see answer 1.4 |
| E8, E27, E31, E33 | Background Spotify queue: other cache key, skips object-form requests, starts only after a fresh login | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/SpotifyEnrichmentService.js:118-123`; 196 of 217 requests are objects |
| E25c | The catalog never uses the account storefront; ADR-0019 says it does | ⚠️ Contradiz a análise de 2026-11-19 (a discutir) | — | `services/musickit/MusicKitAuth.js:99`; see «The four contradictions» |
| E25d | The storefront is taken from the second part of the browser language (`zh-Hans-CN` gives `hans`) | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/musickit/MusicKitAuth.js:38-47` |
| E25a, E25b | Possible MusicKit load race; `isAuthorized` never reset | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not verified (needs a browser) |
| I24 | The 8 MiB search file loads when the app opens | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/OptimizedAlbumLoader.js:9-15`; size on the wire not measured |
| J04 | «Enrich Data» in the album window does not persist | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not verified; a third enrichment path outside the service |
| G H-12 | 100 kB body limit while the client posts whole track objects | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not verified |

### B. Security, data loss, deploy

| Ids | Finding | Class | Issue · feature | Checked |
|---|---|---|---|---|
| B-37, E17, F22, F42, G FS-a, J09, CD-N4 | Firestore rules open | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-15 | `firestore.rules:32-36`, `:42-44`, `:49-52` |
| F44 | The repository does not deploy the rules | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `firebase.json` has only `hosting`; UAT-15 names the file but not this |
| G A-06, A-06b, A-06c, A-07, A-07b, A-23, A-24b, G-N7, J08, AB-N07, EF-N6, HIJ-N1, E14 | Public server, debug routes, paid AI open to anyone | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-16 | `server/index.js:134-136`, `:64-68`; `cloudbuild.yaml:32` |
| G A-20 | `rawStage` can crash the server process | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `server/lib/services/GenerationService.js:71`; crash itself not run |
| G A-19b, G-N14, G A-21 | AI key in the URL; Apple token to callers with no Origin; server fetches model-supplied URLs | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| H06, K-1 | Discogs token in two scripts | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-17 | `scripts/generate-dataset.js:8`, `scripts/fetch-missing-artists.js:12` |
| A-16b, D40, E1, E2 | Spotify `state` check disabled; `Math.random` verifier | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/SpotifyAuthService.js:118-122`, `:46` |
| E30 and UAT-28 | Spotify tokens in `localStorage`, kept after sign-out | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-28 | `:179-182` |
| A-16a, I01, I02 | Weak CSP, Tailwind from a CDN at run time | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-25 | not re-checked |
| A-09d, A-09e, A-16c, C18, D23, E23d, AB-N08 | Text inserted as HTML without escaping | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| HIJ-N7 | Production build publishes source maps | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `vite.config.js:12` |
| D1, F12 | Batch edit save is delete-then-write, not atomic | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `controllers/PlaylistsController.js:350-352`, `:362` |
| D11 | Every playlist save rewrites the series from memory | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `:323-331` |
| D13 | Save may land in another series | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `:305-310`; effect not verified |
| CD-N7, D14 | Save can run twice; button state goes stale | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| D16 | No warning about unsaved edits | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| D7, UAT-05 | Generated playlists lost on reload | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-05 | — |
| D46, F14 | Deleting a series orphans its playlists | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/SeriesService.js:121-124` |
| F7, E19b, EF-N2 | Sign-out leaves the inventory on screen and copies it to the next anonymous account | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `stores/inventory.js:29-45`; not run |
| B-25, E19, F17, H22, L H-11, L H-12 | Guest data not migrated on sign-in | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-12 | no `linkWith*` in `public/js` |
| A-05, F16, EF-N3, CD-N5, HIJ-N4, A-12a | Migration screen unreachable; `/save-all` loads a second Firebase from a CDN | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-11, UAT-14 | not re-checked |
| G A-15, H51, HIJ-N2, G-N9 | Two server build recipes; Node 18 | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-22 | `cloudbuild.yaml:3-8` copies no `config/` |
| E13, H13, G H-13 | Server Spotify secrets absent from the deploy | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; UAT-22 does not name it |
| EF-N1, E46 | CI build has no Spotify client id; variable missing from `.env.example` | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not verified |
| I22, HIJ-N8 | CI deploy would ship without images and data | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not run |
| H40 | Lint never fails the build | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-20 | `.github/workflows/ci-firebase.yml:32-33` |
| H43, H44, L H-14, KLM-N3, HIJ-N3 | The CI workflow never ran a job | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `:63`, `:111` still there; run history not re-queried |
| G-N6 | CORS rejects the app on other hosts | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not verified |
| A-29, E16, H19 | Silent fallback to a placeholder Firebase config | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| E15, H07, G-N10 | `firebase-config.js` ignored but tracked | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; low |

### C. Home, series screen, search, classifier

| Ids | Finding | Class | Issue · feature | Checked |
|---|---|---|---|---|
| B-13, B-14, B-15, B-17, B-21 | Classifier: two «electronic» lists, substring keywords, fields Apple may not send | 🔧 A consertar na v5.0 | UAT-185 · F57 | named here as candidate causes; UAT-185 says «não investigada» |
| B-22, G A-24, G R11-a | AI album list: 200 and empty on any error, no timeout | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `server/routes/ai.js:65`; see answer 1.8 |
| B-19, B-58, L no-test (album-search) | No test for the classification funnel | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | F57 depends on it |
| B-09, B-10 | Non-Latin titles collapse into one group; variants never shown | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| B-50 | Local cover falls back to the first search result | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/OptimizedAlbumLoader.js:129` |
| I21 | Cover placeholder image does not exist | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; both pickers reference it |
| B-05, B-06 | Bulk paste splits on every hyphen; one bad line aborts the rest | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `controllers/HomeController.js:158`; only in the regression's backlog text |
| AB-N06 | `toast.warn` does not exist | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-26 | `controllers/HomeController.js:134` |
| B-34 | «Load N more albums» does nothing | 🔧 A consertar na v5.0 | UAT-06 · F49 | `_attachEventListeners` (`SeriesGridRenderer.js:226`) still has no caller |
| B-35, A-10d, D36 | Search field loses focus on each key | ✅ Consertado na v4.0 | UAT-179 · F51, F46 | Home «ainda não foi conferida» (`uat.md`) |
| B-36 | Rank window opens in disc order | ✅ Consertado na v4.0 | UAT-187 · F46 | per `uat.md` |
| B-46 | Track duration read in the wrong unit | 🔧 A consertar na v5.0 | UAT-188 · F54 | — |
| B-39 | Ranking saved with one user id, read with another | ✅ Consertado na v4.0 | F46 | `services/ranking/ownRanking.js:13`; not verified in the browser |
| B-53 | Double escaping shows `&amp;` | ✅ Consertado na v4.0 | UAT-180 · F46 | per `arch.md` §18; not re-read |
| B-12 | Four shapes of album request | ✅ Consertado na v4.0 | F46 | `toAlbumQuery` per `arch.md` §18; not re-read |
| B-28 | Albums under «Uncategorized» cannot be removed | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | group still drawn at `SeriesGridRenderer.js:150` |
| B-33, B-41, B-45, H26 | Sort orders only the groups; equal titles share a rank; «OWNED» badge by default; hidden rule for «expansion» albums | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| A-01 | Redirect routes skip `mount`: Home is dead after the Spotify callback | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `app.js:133-146`, `:154-169`; `router.js:138` |
| AB-N04, A-22 | Back button trapped after creating a series; fallback adds history | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `controllers/SeriesController.js:128` |
| A-02, A-06, A-07, A-25, A-26 | Menu highlight stale; «Soon» items navigate; footer and menu «Playlists» differ | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | no `afterNavigate` caller found |
| A-08, C9 | `/blend?seriesId=` ignored | 🔧 A consertar na v5.0 | UAT-192 (and UAT-07) · F54 | — |
| A-20, I04 | Version and tab title disagree | 🔧 A consertar na v5.0 | UAT-192 · F54 | — |
| A-13 | Ranking screens reachable only by URL, mixing tracks | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-10 | — |
| A-19 | Account menu opens on hover only | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-13 | — |
| A-15, B-02, B-03, B-04, B-26, A-33, H17, I05 | Missing icons, native alerts, colour-only state, icon-only buttons, empty favicon | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| H23 | Escape closes a dialog and its promise never resolves | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/DialogService.js:31-38` |

### D. Blend and playlists

| Ids | Finding | Class | Issue · feature | Checked |
|---|---|---|---|---|
| D24 | History reads each series' playlists one after the other; today's design sends this screen to the album load service | ⚠️ Contradiz a análise de 2026-11-19 (a discutir) | UAT-186 · F56 | `components/playlists/SavedPlaylistsController.js:50`, `:54-62`; see «The four contradictions» |
| CD-N6, C8 | «My Own Ranking» silently falls back to acclaim order (always when regenerating from an edited batch) | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| J02 | «Blend your Albums» never disabled | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| C3 | Discovery Mode has no effect | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-08 | — |
| C6 | «By Artist then By Rank» does not group by artist | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| C5, C7, C12, C13, C14, C15, C29, C30, D28 | Algorithm defects: tiebreak fields, shuffle, volume numbers, short albums, missing durations, no size cap, hidden 60 or 48 minute default, empty volume | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| C10, CD-N2, D29 | Reconfigure panel forgets the configuration | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| C26, D17, D30 | Provenance and «Your Rank» dropped from generated tracks | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| C11, D25, B-44 | UTC date in default names | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| D4, D34, A-27 | «Editing: ...», double «Batch Name», wrong trail | 🔧 A consertar na v5.0 | UAT-190 · F54 | — |
| D8 | Undo and redo have no control | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-02 | — |
| D18 | Playlist title edit not saved; no delete button | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-03, UAT-04 | — |
| A-10a, D10 | «Create Series» on the empty history does nothing | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-27 | — |
| D2, D3, D35, CD-N1, CD-N3, CD-N8, J06, D12, D47 | Same-name batches merge; context lost through the footer; batch filter; `%` in a name; misleading notice; unnamed batch; delete without confirmation; sort and timestamp types | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| AB-N03, A-10e | History screen draws over the next screen | ✅ Consertado na v4.0 | F46 | `views/SavedPlaylistsView.js:80-85` |
| D6 | Spotify export refuses an expired token though a refresh token exists | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `services/SpotifyAuthService.js:194-200` |
| D37, E23a | «Open in Spotify» dead in separate mode | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-09 | — |
| D5, D21, D38, D39, D41, D42, E23b, E23c, E23e, E23f, E25f, CD-N11, E9, E10, E11, E36 | Export and matching: first result accepted, no retry on 429, empty playlists, wrong text, stored ids not reused | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; E9 is in answer 1.2 |
| D20, EF-N4 | Apple export fails silently; second click exports twice | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| C16, D44 | Non-Apple id treated as an Apple id | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |

### E. Inventory

| Ids | Finding | Class | Issue · feature | Checked |
|---|---|---|---|---|
| F1, AB-N01 | Delete calls a method that does not exist | 🔧 A consertar na v5.0 | UAT-01 · F54 | `controllers/InventoryController.js:315`; `stores/inventory.js:222` |
| F2 | After F1 is fixed, re-adding a deleted album says «already in inventory» for up to 7 days | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; F54 should include it |
| A-11a, AB-N02 | A visited Inventory screen keeps drawing over other screens | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `views/InventoryView.js:25-27` still `onUnmount`; effect not run |
| F3, F4, F5, F6, F8, F19, F20, F21, F23 to F27, F29, F30, F41 | Reads the whole inventory twice per add; no-op sort; born «Not Owned»; errors not shown; two toasts; missing filters; currency defaults; cost of `count()` | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |

### F. Server: scraper, ranking, normalisation

| Ids | Finding | Class | Issue · feature | Checked |
|---|---|---|---|---|
| G B-01, B-02, B-06, B-07, 8.5-c, A-13, G-N4, G-N5 | Scraper accepts the wrong album or misses a right one | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; see answer 1.5 |
| G B-03, B-04, B-05, B-09, A-12, 3.3.5, G-N3, G-N13 | Scraper and mapping: dropped titles, text ratings, zero-vote rows, rating collisions | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| G B-10, 8.5-d, T-sp | No cache, no delay, 30 s per request, no handling of 429 | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | ROADMAP v5.0 and ADR-0019 name a server cache under F52; F52 `fixes:` only UAT-181 |
| G A-18a, A-18b, A-18c, N-04, N-05, C17, G-N12, E29 | Three title normalisations that disagree | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| G A-29, N-02, N-03, A-28, A-03, A-08, A-09, A-11, A-22, H-08, A-19a, A-19c | AI second source: phantom album, lost provenance, double scrape, truncation never detected | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked; the route answers 402 today (UAT-181) |
| E12, G A-01, EF-N7 | Server Spotify stage always throws (missing import) | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| G A-10, R5-a | Ratings route needs the AI key it does not use; no try in `/generate` | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| G R6 to R15, A-30b, A-31, R6-pl, G-N8, C32 | Server curation engine and `/api/playlists`: no caller | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | dead code |

### G. Tests, tooling, CSS, dead code

| Ids | Finding | Class | Issue · feature | Checked |
|---|---|---|---|---|
| H01 (root), H02, H03, L H-1 to H-8c, M E-5 | Root test suite red; E2E files picked up by the unit runner | ✅ Consertado na v4.0 | UAT-149 · F53 | `vitest.config.js:11`; commit `0d402f9` «431 passam»; not re-run |
| H04, H05, H37, H38, C22, G A-16, G A-30, G 10.4-b, 10.5 | Server and orphan tests point at missing files or never run | ⏳ Em aberto: tem issue, sem feature (a discutir) | UAT-21 | not re-checked |
| L H-9, H-10, H-13, H52 | Tests that assert nothing; orphan global mock | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not verified after F53 |
| L no-test (SeriesController, cache) | No test for the controller and the album cache | ✅ Consertado na v4.0 | F45, F46 | 15 controller cases and adapter tests, per `arch.md` §18 |
| L no-test (SeriesGridRenderer, cascade algorithm, real repositories, loaders, `api/client.js`) | Still no test | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | `arch.md` §18 confirms the grid |
| M E-1 to E-13, H32 to H36, H45 | E2E suite is stale and cannot run | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | excluded from the unit run by F53, not repaired |
| I06 to I11, I14, I16, I17, I18, I28, I29, I30 | CSS: undefined classes, dropped `@apply`, duplicate rules, no cache headers | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| A-03, A-04, A-17, A-18, A-31, E18, E21, E26, B-56, F9, F38, HIJ-N5, HIJ-N6 | Listener leaks, circular imports, debug globals and logs, two `AuthService`, mixed timestamp types | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked |
| A-09c, A-09f, A-14a to A-14h, A-23, B-01, B-16, B-18, B-24, B-32, B-43, B-47, B-48, B-51, AB-N09, C1, C2, C4, C19, C21, C24, C25, C27, C28, C31, D9, D19, D26, D27, D45, D50, CD-N9, CD-N10, E11c, E20, E24, E25e, E34, E35, E40, E44, F10, F18, F31, F32, F35, F40, G A-02, A-04, A-05, A-17, MK-b, H09, H18, H20, H21, H27 to H31, H39, H50, I12, I13, I15, I19, I20, I26, I27, J 1 to 10, J01, J03, J12, J13 | Dead code and dead files (about 130 source rows) | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not re-checked one by one |
| A-34, B-59, C35, D51, E §6, F §11, G MAN, H10 to H12, H15, H16, H46 to H49, J10, J11 | Manual and docs differ from code (about 120 source rows) | ⏳ Em aberto: sem issue e sem plano (a discutir) | — | not verified |
| E22 | Spotify change event sent only on sign-out | 🚫 Não vale mais | — | Motivo: consertado pela F50 em 2026-11-19: `SpotifyAuthService.setSession` passou a mandar o sinal `spotify-auth-change` também ao conectar (conferido no código e no navegador, UAT-182). |
| A-11b, A-30, B-54, E43, G MK-a, G GAP-a | Reported as risks, harmless or not happening per the verified notes | 🚫 Não vale mais | — | Motivo: as notas verificadas contra o código no começo da sessão concluíram que cada um destes riscos não acontece ou não causa dano. Não reconferido em 2026-11-19. |

## What was not verified

- Nothing was run: no browser, no test, no call to production. Every «not verified» above stays as the verified notes left it.
- Live state: the deployed Firestore rules, the Cloud Run environment, which recipe built the live server, whether v4.0 is published.
- The storefront hypothesis (answer 1.3) and the AI-list hypothesis for the classifier (answer 1.8) are deductions from the code.
- Rows marked «not re-checked» rely on the verified notes of the same day, which read the `main` checkout before today's fixes; a fix made today in a file I did not open would make such a row stale.
- UAT-149 still reads «open» in this worktree's `uat.md` although commit `0d402f9` says the suite is green.
