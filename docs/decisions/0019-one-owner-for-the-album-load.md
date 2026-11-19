# ADR-0019: One Owner for the Album Load

**Date**: 2026-11-19
**Status**: Proposed
**Deciders**: MJRP (approved the design in conversation on 2026-11-19, «go for it»), Claude agent (drafter). Formal acceptance of this record is pending.
**Related work**: release v4.0, features F45, F46, F47, F48, F51

## Context
The albums screen took minutes to show 80 albums (one album every 5 to 6 seconds, 46 of 80 after 4 min 40 s, measured on 2026-11-19). Series stayed as grey blocks, disappeared when the person left and came back mid-load, and a failed album gave no notice (issues UAT-172 to UAT-177).

The cause was structural, not a slow call:
- the load was a loop inside `SeriesController`, one album after the other, with no deadline;
- one boolean said "loading" for the whole screen, and anything could reset it;
- an older load kept writing to the screen after a newer one had started;
- the controller, the stores and the API client all talked to Firestore and to the catalog;
- the album cache had more than one key for the same album.

The analysis and the measurements are in `docs/specs/arch.md`, section «Carga da tela de álbuns — proposta» (sections 1 to 19), judged by two separate critiques before the code (`side-session-notes`, 2026-11-19).

## Decision
The load of albums has **one owner**, `AlbumLoadService` (`public/js/services/albums/`), and the rest of the app asks it.

1. **One service owns the load.** Screens and controllers do not loop over albums; they call `load({ scopeKey, series, fresh })` and read the result from a store.
2. **Generations.** Every load has an identity; only the current generation writes. Cancelling means "stop waiting and drop the result", because the catalog and the cloud do not really abort.
3. **Explicit state per album.** Each album asked for is `pending`, `finding`, `found`, `failed` or `cancelled`, and each enrichment source has its own status. The state of a series is derived from its albums, never stored apart.
4. **Find is separate from enrich.** The album shows as soon as the catalog answers; ratings, popularity and the person's ranking arrive after, each on its own.
5. **A queue with a limit and a deadline** (`public/js/utils/TaskQueue.js`): three queues (catalog, quick sources, slow sources), each with its own limit, so a slow source does not hold the others.
6. **Ports and adapters.** The service knows a catalog port, an enricher port and a cache port. Apple Music, the server, Spotify and Firestore sit behind adapters (`services/albums/adapters/`).
7. **One store owns the state** (`public/js/stores/albumLoad.js`); `stores/albums.js` is a projection of it for the screens that still read the old shelf.
8. **A published album is never changed.** A source returns a new album. Since 2026-11-19 (arch.md, section 19) each source also returns `apply`, which puts its answer on the newest album, so no source undoes another; and only the latest ask of a source for an album writes.
9. **One cache record per album asked for**, with the status of each source; a failure is never saved, "the source has nothing" is trusted for one hour, and the person's ranking is never saved with the album.
10. **The rules are tests.** `test/architecture/albumLoadBoundaries.test.js` fails the build when a file outside the repositories imports Firestore (with a short list of known exceptions) or when the service imports a screen.

## Consequences
**Positive**:
- Measured on 2026-11-19: 80 albums **found and on screen** in 8.5 s; 45 series and 217 albums in 31 s, 213 found and 4 with a failure notice. The «before» number (46 of 80 in 4 min 40 s) counted albums found **and rated**, so the two are not the same measure: ratings still take minutes for 217 albums, and Spotify was not connected in these measurements.
- A failed album has a notice and a "try again"; a series never disappears while loading.
- The load is tested without network (56 tests of the load on 2026-11-19).
- Filters, search and paging became pure functions over what the series ask for.

**Negative**:
- More code and more files: the sum of cyclomatic complexity went up, not down (measured on 2026-11-19, `reports/audits/2026-11-19-mjrpalbumblender-v0-load-architecture-analysis.md`). `_enrichOne` reached 21 and has to be split.
- A single point of failure: a defect in the service reaches every screen that uses it.
- Two ways of loading live side by side until the migration ends (see below).

**Not done yet** (corrected on 2026-11-19 after the cross-check with the earlier reports, `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`; decisions 1, 3 and 7 above describe the target, and the code is not there yet):
- Decision 1: **done in F56** (2026-11-19, on the branch `fix/f56-screens-load-through-the-service`, not yet published). The blend and the playlist edit ask the service through `albumAsks.albumsOf` (`services/albums/AlbumAsks.js`), which joins the load in force (`join` / `leave`) instead of starting a generation; Refetch is `reloadAlbum`, through the queue; `injectAlbumsIntoViewCache` and `refetchAlbumMetadata` are gone, and so are `apiClient.fetchAlbum`, `fetchMultipleAlbums` and `BEAenrichAlbum`. A test keeps it so (`test/architecture/screensLoadThroughTheService.test.js`). Still outside the queue: the "Enrich Data" button of the album window and the background Spotify queue (`SpotifyEnrichmentService`), which ask Spotify on their own.
- Decision 3: for popularity and ratings a failure can still end as "the source has nothing" (an expired Spotify token, a 401 or a 429; the server answering 200 and empty when the scraper fails), and that answer is now written into the series as a fact.
- Decision 7: **done in F56** (same branch). The projection is the only writer of albums in `stores/albums.js`; the methods that added or removed one album were removed from the shelf.
- The limit of 4 slow sources at once is not the ceiling on the server: the browser's deadline does not stop the scrape. Since F56 no caller of the ratings route skips the queue. The critiques asked to start at 2 and measure.
- The blend and the playlist edit mode loaded albums through their own loop: **done in F56** (UAT-189), as was "saving the edit of a series reloads every series" (UAT-191: the save now reconciles). The saved playlists screen was done in F61 (UAT-186). What F56 left: it was not seen in a browser by its implementer, and an ask looks at the load again every second because a hold changes no entry of the store (a job for F58).
- "Is this the album that was asked for?" still accepts any album of the right artist (UAT-184).
- The server has no cache for ratings and passes the provider's raw error on (F52, UAT-181).

## Alternatives Considered
1. **Parallelize the existing loop and add a deadline.** Rejected by MJRP on 2026-11-19 («não quero patches»): it would have made the screen faster and left the single boolean, the late writes and the mixed layers in place.
2. **Move the load to the server** (one request per series). Rejected for now because the server is the slowest part today. (An earlier version of this record also said the catalog is called «with the person's storefront»; that was wrong: the code uses the storefront of the browser's language, `services/musickit/MusicKitAuth.js`, never the account's. So that is not a reason against the server, and this alternative deserves a second look in v5.0.)
3. **A third-party data library** (query cache with built-in states). Rejected: the app is vanilla JS with no framework, and the states needed here (per album, per source, per series) are specific.

## Notes
- Limits in force (`LOAD_LIMITS`): 3 catalog searches at once (Apple Music answered 429 with 6), 45 s to find, 6 quick sources and 4 slow sources at once, 20 s per source.
- The local address is `http://127.0.0.1:5010` (F50); logins and caches are kept per origin.
- This record was written after the code. The design was judged before the code by two separate critiques; this text itself has not been judged.
