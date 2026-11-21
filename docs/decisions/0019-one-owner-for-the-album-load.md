# ADR-0019: One Owner for the Album Load

**Date**: 2026-11-19
**Status**: Proposed
**Acceptance**: tech lead
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

The analysis and the measurements are in `docs/specs/arch.md`, section «Carga da tela de álbuns — proposta», judged by two separate critiques before the code.

## Decision
The load of albums has **one owner**, `AlbumLoadService` (`public/js/services/albums/`), and the rest of the app asks it.

1. **One service owns the load.** Screens call `load({ scopeKey, series, fresh })` and read the result from a store; none loops over albums.
2. **Generations.** Every load has an identity; only the current generation writes. Cancelling means "stop waiting and drop the result".
3. **Explicit state per album:** `pending`, `finding`, `found`, `failed` or `cancelled`, and a status per enrichment source. The state of a series is derived, never stored apart.
4. **Find is separate from enrich.** The album shows as soon as the catalog answers; ratings, popularity and the person's ranking arrive after, each on its own.
5. **Queues with a limit and a deadline** (`public/js/utils/TaskQueue.js`): catalog, quick sources, slow sources, so a slow source does not hold the others.
6. **Ports and adapters** (`services/albums/adapters/`): the service knows a catalog port, an enricher port and a cache port.
7. **One store owns the state** (`public/js/stores/albumLoad.js`); `stores/albums.js` is a projection of it.
8. **A published album is never changed.** A source returns a new album and an `apply` that puts its answer on the newest one; only the latest ask of a source for an album writes.
9. **One cache record per album asked for**, with the status of each source; a failure is never saved, "the source has nothing" is trusted for one hour, the person's ranking is never saved with the album.
10. **The rules are tests:** `test/architecture/albumLoadBoundaries.test.js` fails the build when a file outside the repositories imports Firestore or when the service imports a screen.

## Alternatives Considered
1. **Parallelize the existing loop and add a deadline** — rejected by MJRP on 2026-11-19 («não quero patches»): faster, but the boolean, the late writes and the mixed layers stay.
2. **Move the load to the server** (one request per series) — rejected for now, the server is the slowest part today; it deserves a second look in v5.0.
3. **A third-party data library** — rejected: the app is vanilla JS and the states needed (per album, source, series) are specific.

## Consequences
**Positive**:
- Measured on 2026-11-19: 80 albums found and on screen in 8.5 s; 45 series and 217 albums in 31 s. The «before» number counted albums found **and rated**, so it is not the same measure; ratings still take minutes for 217 albums.
- A failed album has a notice and a "try again"; a series never disappears while loading.
- The load is tested without network; filters, search and paging are pure functions.

**Negative**:
- More code and files: the sum of cyclomatic complexity went up (`reports/audits/2026-11-19-mjrpalbumblender-v0-load-architecture-analysis.md`); done in F58, no function of the load is above 10, and `test/architecture/complexityLimit.test.js` keeps it so.
- A single point of failure: a defect in the service reaches every screen that uses it.
- Decisions 1, 3 and 7 were a target when this was written; what was still open, and what F56, F58 and F61 closed, is in `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md` and in the specs of those features. Still open: a failed source can end as "the source has nothing" (UAT-181), and "is this the album asked for?" accepts any album of the right artist (UAT-184).

## Notes
- Limits in force (`LOAD_LIMITS`): 3 catalog searches at once, 45 s to find, 6 quick and 4 slow sources at once, 20 s per source.
- This record was written after the code; the design was judged before the code, this text itself has not been judged.
