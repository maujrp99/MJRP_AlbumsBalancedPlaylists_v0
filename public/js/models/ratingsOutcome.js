/**
 * ratingsOutcome - what the server said about each source of ratings of an album it found (F70).
 *
 * POST /api/generate (the second source of an album, the AI search) answers the album and, beside
 * it, `ratings: { acclaim, popularity, aiRanking }`: what happened to each source when the server
 * asked it (server/lib/rankingSources/sourceOutcome.js writes the list, F52 slice 5):
 *
 *   found           the source has ratings for the album: what came with the album is used as it is
 *   not_found       the source answered: it has no such album
 *   no_ratings      the source has the album's page, with no rating on it
 *   not_configured  the server is not set up to ask the source: it was not asked
 *   failed          the source could not answer
 *   not_asked       the server did not need the source
 *
 * The last three say nothing about the album: the source was not heard. They are never read as
 * "this album has no ratings". The app's own source is asked through its normal path, and what is
 * kept is that answer. `not_found` and `no_ratings` are not kept from here either: the app's own
 * answer carries the reason and the version of the identity rule the trust times need
 * (adapters/AlbumCacheAdapter.js), so it is the one that is kept.
 *
 * So only `found` lets what came with the album be used as it is (`cameWithTheAlbum`).
 *
 * Pure: it reads what it is given. The album carries the outcome in `metadata.ratingsOutcome`
 * (`ratingsOutcomeOf` reads it), for whoever tells the person what happened.
 */

export const SourceOutcome = Object.freeze({
    FOUND: 'found',
    NOT_FOUND: 'not_found',
    NO_RATINGS: 'no_ratings',
    NOT_CONFIGURED: 'not_configured',
    FAILED: 'failed',
    NOT_ASKED: 'not_asked'
})

/** The sources the server tells about. */
export const RATED_SOURCES = Object.freeze(['acclaim', 'popularity', 'aiRanking'])

const KNOWN_OUTCOMES = new Set(Object.values(SourceOutcome))

/**
 * The `ratings` field of an answer of POST /api/generate, read: only the sources and the outcomes
 * of the lists above pass.
 * @param {*} ratings - as the server sent it
 * @returns {Object|null} { acclaim?, popularity?, aiRanking? }, or null when the server said
 *          nothing that can be read (the server before F52 slice 5 sends no such field)
 */
export function readRatingsOutcome(ratings) {
    if (!ratings || typeof ratings !== 'object') return null
    const known = RATED_SOURCES.filter(source => KNOWN_OUTCOMES.has(ratings[source]))
    if (known.length === 0) return null
    return Object.fromEntries(known.map(source => [source, ratings[source]]))
}

/**
 * @param {Object} album - an album (it may have come from any source)
 * @param {string} source - one of RATED_SOURCES
 * @returns {string|null} what the server said about that source when it found the album, or null
 */
export const ratingsOutcomeOf = (album, source) => album?.metadata?.ratingsOutcome?.[source] ?? null

/**
 * May what came with the album for this source be used as it is? Yes when the server said `found`,
 * and when it said nothing at all (the server before slice 5: the rule of before).
 * @param {Object|null} outcomes - what readRatingsOutcome gave
 * @param {string} source
 */
export const cameWithTheAlbum = (outcomes, source) => !outcomes || !outcomes[source] || outcomes[source] === SourceOutcome.FOUND
