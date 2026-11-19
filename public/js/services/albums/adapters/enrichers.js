/**
 * The enrichment sources of an album, each behind the same small port (DP-07, DP-14):
 *   enrich(album) -> Promise<{ status: 'done' | 'empty', album }>
 * Every one works on a copy and returns it: the album it received is never changed.
 * A source that breaks throws; "the source has nothing" is 'empty'.
 */

import { cloneAlbum } from '../../../models/cloneAlbum.js'

const DONE = 'done'
const EMPTY = 'empty'

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
        if (album.bestEverUrl) return { status: DONE, album }

        const data = await this.requestRatings({ title: album.title, artist: album.artist, tracks: album.tracks || [] })
        if (data === null || data === undefined) throw new Error('The ratings request failed')

        const copy = cloneAlbum(album)
        this.applyRatings(copy, data)

        const hasRatings = !!copy.acclaim?.hasRatings
        if (hasRatings) {
            copy.tracks.sort((a, b) => {
                const ratingA = a.rating !== null && a.rating !== undefined ? a.rating : -1
                const ratingB = b.rating !== null && b.rating !== undefined ? b.rating : -1
                if (ratingA !== ratingB) return ratingB - ratingA
                return (a.position ?? a.trackNumber ?? 0) - (b.position ?? b.trackNumber ?? 0)
            })
            copy.tracks.forEach((track, index) => { track.rank = index + 1 })
        }
        return { status: hasRatings || copy.bestEverUrl ? DONE : EMPTY, album: copy }
    }
}

/** Spotify popularity. Skipped when Spotify is not connected and nothing is stored for the album. */
export class PopularityEnricher {
    /** @param {Function} deps.applyPopularity - (album) => Promise<void>, writes into the album given */
    constructor({ applyPopularity }) {
        this.applyPopularity = applyPopularity
    }

    async enrich(album) {
        if (album.spotifyId) return { status: DONE, album }
        const copy = cloneAlbum(album)
        await this.applyPopularity(copy)
        return { status: copy.spotifyId ? DONE : EMPTY, album: copy }
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
        if (!userId) return { status: EMPTY, album }

        const ranking = await this.getRanking(userId, album.id)
        const rankings = ranking?.rankings || (Array.isArray(ranking) ? ranking : null)
        if (!rankings || rankings.length === 0) return { status: EMPTY, album }

        const copy = cloneAlbum(album)
        copy.setUserRankings(rankings)
        return { status: DONE, album: copy }
    }
}
