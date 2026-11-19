/**
 * The enrichment sources of an album, each behind the same small port (DP-07, DP-14):
 *   enrich(album) -> Promise<{ status: 'done' | 'empty', album, apply }>
 * Every one works on a copy and returns it: the album it received is never changed.
 * `apply(other)` puts the same answer on another album (a copy again). The load uses it when a
 * newer album was published while the source was working, so no source undoes another.
 * A source that breaks throws; "the source has nothing" is 'empty'.
 */

import { cloneAlbum } from '../../../models/cloneAlbum.js'

const DONE = 'done'
const EMPTY = 'empty'

/** The answer changes nothing in the album. */
const unchanged = (album) => album

/** Track ratings from the server (BestEverAlbums). */
export class AcclaimEnricher {
    /**
     * @param {Object} deps
     * @param {Function} deps.requestRatings - ({ title, artist, tracks }) => Promise<data|null>; null means the request failed
     * @param {Function} deps.applyRatings - (album, data) => void, writes the data into the album given
     */
    constructor({ requestRatings, applyRatings }) {
        this.requestRatings = requestRatings
        this.applyRatings = applyRatings
    }

    async enrich(album) {
        if (album.bestEverUrl) return { status: DONE, album, apply: unchanged }

        const data = await this.requestRatings({ title: album.title, artist: album.artist, tracks: album.tracks || [] })
        if (data === null || data === undefined) throw new Error('The ratings request failed')

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
        return { status: copy.acclaim?.hasRatings || copy.bestEverUrl ? DONE : EMPTY, album: copy, apply }
    }
}

/** Spotify popularity. Skipped when Spotify is not connected and nothing is stored for the album. */
export class PopularityEnricher {
    /** @param {Function} deps.applyPopularity - (album) => Promise<void>, writes into the album given */
    constructor({ applyPopularity }) {
        this.applyPopularity = applyPopularity
    }

    async enrich(album) {
        // Asked again for another album, the popularity comes from what the first ask stored.
        const apply = async (target) => {
            if (target.spotifyId) return target
            const copy = cloneAlbum(target)
            await this.applyPopularity(copy)
            return copy
        }

        const copy = await apply(album)
        return copy.spotifyId
            ? { status: DONE, album: copy, apply }
            : { status: EMPTY, album: copy, apply: unchanged }
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
