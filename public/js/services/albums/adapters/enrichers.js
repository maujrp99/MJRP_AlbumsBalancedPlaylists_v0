/**
 * The enrichment sources of an album, each behind the same small port (DP-07, DP-14):
 *   enrich(album) -> Promise<{ status: 'done' | 'empty' | 'not-connected', album, apply, reason? }>
 * Every one works on a copy and returns it: the album it received is never changed.
 * `apply(other)` puts the same answer on another album (a copy again). The load uses it when a
 * newer album was published while the source was working, so no source undoes another.
 * A source that breaks throws; "the source has nothing" is 'empty'; "the person is not connected
 * to the source" is 'not-connected' (the popularity, F69), which is neither.
 *
 * The ratings come from the app's server, whose answer says which of the two it is (F52):
 * 'not_found' and 'no_ratings' are 'empty'; a failure is thrown as it came, with its code and its
 * hold, so the load marks the source as failed (or holds) and never stores it as "has none".
 * An 'empty' that comes from the server's own word carries it as `reason` ('not_found' or
 * 'no_ratings'): the record the browser keeps is believed for a time that depends on it. An
 * 'empty' with no reason (the server before F52) is believed for a short time only.
 * A 'not_found' also carries `rule`, the version of the identity rule the server decided it with
 * (null from a server before F68): the record is believed only while that is the rule of the app.
 * The ratings themselves ('done'), and a 'no_ratings', carry `trackRule`, the version of the track
 * rule the server put each rating on its track with (null from a server before F74): the record is
 * believed only while that is the rule of the app, so ratings an older rule spread are asked for
 * again, once (F74).
 */

import { cloneAlbum } from '../../../models/cloneAlbum.js'

const DONE = 'done'
const EMPTY = 'empty'
const NOT_CONNECTED = 'not-connected'

/** What the server may answer about the ratings of an album (api/serverResult.js). */
const SOURCE_HAS_NONE = new Set(['not_found', 'no_ratings'])
const LEGACY = 'legacy'

/** The version of the track rule the server decided with, or null when it does not say. */
const trackRuleOf = (answer) => answer.data?.trackRule ?? null

/** The answer changes nothing in the album. */
const unchanged = (album) => album

/** "The source has none", with the server's reason and, for 'not_found', the version of the rule that decided it. */
const hasNone = (answer, album) => ({
    status: EMPTY, reason: answer.kind, rule: answer.data?.identityRule ?? null, trackRule: trackRuleOf(answer), album, apply: unchanged
})

/** Track ratings from the server (BestEverAlbums). */
export class AcclaimEnricher {
    /**
     * @param {Object} deps
     * @param {Function} deps.requestRatings - ({ title, artist, tracks }) => Promise<{ kind, data }>;
     *        kind is 'found' | 'not_found' | 'no_ratings', or 'legacy' from the server before F52.
     *        It throws when the request failed.
     * @param {Function} deps.applyRatings - (album, data) => void, writes the data into the album given
     */
    constructor({ requestRatings, applyRatings }) {
        this.requestRatings = requestRatings
        this.applyRatings = applyRatings
    }

    async enrich(album) {
        if (album.bestEverUrl) return { status: DONE, album, apply: unchanged }

        const answer = await this.requestRatings({ title: album.title, artist: album.artist, tracks: album.tracks || [] })
        if (!answer) throw new Error('The ratings request failed')

        // The source answered and has no ratings for this album: nothing is written into it. A page
        // with zero ratings is not "done" (it was, before F52), and its address is not kept, because
        // an album with that address reads as "already has its ratings".
        if (SOURCE_HAS_NONE.has(answer.kind)) return hasNone(answer, album)
        const data = answer.data || {}

        const apply = (target) => {
            const copy = cloneAlbum(target)
            this.applyRatings(copy, data)
            if (copy.acclaim?.hasRatings) {
                copy.tracks.sort((a, b) => {
                    const ratingA = a.rating !== null && a.rating !== undefined ? a.rating : -1
                    const ratingB = b.rating !== null && b.rating !== undefined ? b.rating : -1
                    if (ratingA !== ratingB) return ratingB - ratingA
                    return (a.position ?? a.trackNumber ?? 0) - (b.position ?? b.trackNumber ?? 0)
                })
                copy.tracks.forEach((track, index) => { track.rank = index + 1 })
            }
            return copy
        }

        const copy = apply(album)
        // The server before F52 does not say whether the source has ratings: the rule of before
        const hasData = answer.kind === LEGACY ? Boolean(copy.acclaim?.hasRatings || copy.bestEverUrl) : true
        return { status: hasData ? DONE : EMPTY, album: copy, apply, trackRule: trackRuleOf(answer) }
    }
}

/**
 * Spotify popularity (F69). Three outcomes that never merge:
 *   'done'           Spotify has the album (or its answer was already stored)
 *   'empty'          Spotify answered: it has no such album; with the reason and, for 'not_found',
 *                    the version of the identity rule that decided it (the rule of the app)
 *   'not-connected'  there is no Spotify session: nobody was asked, nothing failed, and the load
 *                    keeps and writes nothing for this source
 * A call that failed is thrown as it came (with its `hold`, when Spotify said "wait a little").
 */
export class PopularityEnricher {
    /**
     * @param {Object} deps
     * @param {Function} deps.readPopularity - (album) => Promise<{ kind: 'found', data } |
     *        { kind: 'not_found', reason, rule } | { kind: 'not_connected' }>; it throws when Spotify
     *        could not be asked (adapters/spotifyPopularitySource.js)
     * @param {Function} deps.applyPopularity - (album, data) => void, writes the data into the album given
     */
    constructor({ readPopularity, applyPopularity }) {
        this.readPopularity = readPopularity
        this.applyPopularity = applyPopularity
    }

    async enrich(album) {
        if (album.spotifyId) return { status: DONE, album, apply: unchanged }

        const answer = await this.readPopularity(album)
        if (answer.kind === 'not_connected') return { status: NOT_CONNECTED, album, apply: unchanged }
        if (answer.kind !== 'found') {
            return { status: EMPTY, reason: answer.reason, rule: answer.rule ?? null, album, apply: unchanged }
        }

        // Asked again for a newer album, the same answer is written on a copy of that one.
        const apply = (target) => {
            if (target.spotifyId) return target
            const copy = cloneAlbum(target)
            this.applyPopularity(copy, answer.data)
            return copy
        }
        return { status: DONE, album: apply(album), apply }
    }
}

/** The person's own track ranking. Never cached with the album: it belongs to the user and changes. */
export class UserRankingEnricher {
    /**
     * @param {Function} deps.getUserId - () => string|null
     * @param {Function} deps.getRanking - (userId, albumId) => Promise<ranking|null>
     */
    constructor({ getUserId, getRanking }) {
        this.getUserId = getUserId
        this.getRanking = getRanking
    }

    async enrich(album) {
        const userId = this.getUserId()
        if (!userId) return { status: EMPTY, album, apply: unchanged }

        const ranking = await this.getRanking(userId, album.id)
        const rankings = ranking?.rankings || (Array.isArray(ranking) ? ranking : null)
        if (!rankings || rankings.length === 0) return { status: EMPTY, album, apply: unchanged }

        const apply = (target) => {
            const copy = cloneAlbum(target)
            copy.setUserRankings(rankings)
            return copy
        }
        return { status: DONE, album: apply(album), apply }
    }
}
