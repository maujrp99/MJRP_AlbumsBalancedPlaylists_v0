import { serverFetch } from './serverFetch.js'
import { mayUsePaidRoutes } from './paidRoutes.js'
import { Album } from '../models/Album.js'
import { askedAlbum, compareOnlyAnswer } from '../models/askedAlbum.js'
import { plainAlbumQuery } from '../models/albumQuery.js'
import { readRatingsOutcome, cameWithTheAlbum } from '../models/ratingsOutcome.js'
import { albumLoader } from '../services/AlbumLoader.js'
import { TrackTransformer } from '../transformers/TrackTransformer.js'
import { retryWithBackoff } from '../utils/retry.js'
import { readServerResult, failedWithoutAnswer, ApiError, ResultKind } from './serverResult.js'

/**
 * API Client
 * Wrapper for the calls to the app's own server, with retry logic.
 *
 * It does not load albums for a screen. Since F56 the album load (services/albums/) is the only
 * loader: it reaches this client through its ports (the second source of the catalog, POST
 * /generate; the ratings, POST /enrich-album). The old find-and-rate calls (fetchAlbum,
 * fetchMultipleAlbums, BEAenrichAlbum) were removed when their last callers left.
 *
 * The answer of the AI search is accepted only when it is the album asked for, by the one
 * identity rule (shared/albumIdentity.js, F55).
 */

const API_BASE = window.__api_base || '/api'

// The failure of a call to the server (its code, whether to ask again, the hold) is read in one
// place, api/serverResult.js. Exported from here too, for the callers that already import it.
export { ApiError }

const isSet = (value) => value !== null && value !== undefined

/**
 * A track of the server's answer as the app's canonical track (transformers/TrackTransformer.js).
 * @param {string} orderField - 'acclaimRank' or 'position': the field the place in the list fills
 *        when the track does not say it
 */
function canonicalTrack(track, index, context, orderField) {
    const canonical = TrackTransformer.toCanonical({
        ...track,
        acclaimRank: track.rank || track.acclaimRank || track.finalPosition,
        position: track.position || track.trackNumber,
        acclaimScore: track.normalizedScore || track.acclaimScore
    }, context)
    if (!canonical[orderField]) canonical[orderField] = index + 1
    return canonical
}

/** The acclaim summary of an album that came without one. */
function acclaimOf(tracks, source) {
    return {
        hasRatings: tracks.some(track => isSet(track.rating) || isSet(track.rank)),
        source: source || 'hybrid-curation',
        trackCount: tracks.length
    }
}

/** The page of BestEverAlbums, only when its ratings came with the album (see normalizeAlbumData). */
function pageOfTheSource(data, outcomes) {
    if (!cameWithTheAlbum(outcomes, 'acclaim')) return {}
    return { bestEverAlbumId: data.bestEverAlbumId, bestEverUrl: data.bestEverUrl, bestEverEvidence: data.bestEverEvidence }
}

/** The server takes the query as text: "Artist - Album". */
function queryText(query) {
    if (typeof query !== 'object' || query === null) return query
    return `${query.artist || ''} - ${query.title || query.album || ''}`
}

export class APIClient {
    constructor() {
        this.baseUrl = API_BASE
        this.defaultRetries = 2
        this.retryDelay = 1000 // the first wait; it doubles on each new attempt, up to retryDelayCap
        this.retryDelayCap = 8000
        this.serverTimeoutMs = 90000 // POST /generate runs an AI model: slow, but not endless
        this.random = Math.random
        this.mayUsePaidRoutes = mayUsePaidRoutes // false for a visitor: POST /generate is a paid route (F70)
    }

    /**
     * One call to the app's own server, read by the one reader (api/serverResult.js).
     * @param {string} path - e.g. '/generate'
     * @param {Object} body - sent as JSON
     * @param {Object} [options]
     * @param {number} [options.timeoutMs=0] - deadline of the call; 0 means none
     * @returns {Promise<Object>} a result that is not a failure: { kind, data } or { kind: 'legacy', body }
     * @throws {ApiError} when the server failed, did not answer, or passed the deadline
     * @private
     */
    async _post(path, body, { timeoutMs = 0 } = {}) {
        const route = `POST ${path}`
        const controller = new AbortController()
        const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null

        try {
            let result
            try {
                const response = await serverFetch(`${this.baseUrl}${path}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: controller.signal
                })
                result = await readServerResult(response)
            } catch (cause) {
                result = failedWithoutAnswer(cause, { timedOut: controller.signal.aborted })
            }
            if (result.kind === ResultKind.FAILED) throw ApiError.from(result, route)
            return result
        } finally {
            if (timer) clearTimeout(timer)
        }
    }

    /**
     * Ask the server for the track ratings of an album (POST /enrich-album, BestEverAlbums).
     * @param {Object} albumData - { title, artist, tracks }
     * @returns {Promise<{ kind: string, data: Object }>} kind is 'found', 'not_found' or 'no_ratings'
     *          with the new server, and 'legacy' with the server before F52 (then the data says
     *          nothing about "the source has none": the caller follows the rule it had)
     * @throws {ApiError} when it could not be known (the source or the server failed)
     */
    async requestRatings(albumData) {
        const result = await this._post('/enrich-album', { albumData })
        if (result.kind === ResultKind.LEGACY) return { kind: ResultKind.LEGACY, data: result.body?.data || {} }
        return { kind: result.kind, data: result.data || {} }
    }

    /**
     * Fetch an album from the server (POST /generate, the second source: paid AI).
     *
     * Asked again only when the failure says so (`retryable`), up to `retries` times, with growing
     * waits and jitter (DP-23). The new server sends that field; with the server before F52 it is
     * "no answer, or a 5xx". It is never decided by the status alone: billing, quota and a refused
     * request are not asked again whatever status they come with. A call that passed the deadline
     * is not asked again either, because the paid work may still be running.
     *
     * A visitor may not use the paid routes (api/paidRoutes.js): nothing is asked, and for the
     * visitor this source has no album (F70).
     * @param {string|Object} query - "Artist - Album" or { artist, title }
     * @param {number} [retries] - new attempts after the first call
     * @returns {Promise<Album|null>} null when the server answered that it has no such album, or
     *          when it was not asked because the person is a visitor
     * @throws {ApiError} the real failure, with `status` when the server answered
     * @private
     */
    async _fetchAlbumFromAPI(query, retries = this.defaultRetries) {
        if (!this.mayUsePaidRoutes()) return null

        const queryStr = queryText(query)
        const result = await retryWithBackoff(() => this._postGenerate(queryStr), {
            retries,
            baseMs: this.retryDelay,
            capMs: this.retryDelayCap,
            shouldRetry: (error) => error instanceof ApiError && error.retryable,
            pause: (ms) => this.delay(ms),
            random: () => this.random(),
            onRetry: ({ attempt, waitMs, error }) =>
                console.warn(`[APIClient] "${queryStr}": ${error.message}. New attempt ${attempt} of ${retries} in ${waitMs} ms`)
        })
        return this._albumOfAnswer(query, result)
    }

    /**
     * The album of an answer of POST /generate, or null when the answer is not the album asked for.
     * @param {string|Object} query - what was asked
     * @param {Object} result - a result that is not a failure (api/serverResult.js)
     * @returns {Album|null}
     * @private
     */
    _albumOfAnswer(query, result) {
        if (result.kind === ResultKind.NOT_FOUND) return null
        // The server before F52 answered the album itself, or { data: album }
        const data = result.kind === ResultKind.LEGACY ? (result.body?.data || result.body) : result.data
        const accepted = this._acceptedAnswer(query, data)
        if (!accepted) return null
        const album = this.normalizeAlbumData(data)
        // How the rule accepted it stays on the album: the caches and the card read it (F55)
        album.metadata = { ...(album.metadata || {}), identityReason: accepted.reason }
        return album
    }

    /**
     * The AI search answers with whatever album it believes in. It is accepted only when it is the
     * album asked for, by the one identity rule (F55); another album of the artist is "the server
     * has no such album", and the paid call is not made again.
     * The AI is asked for this album and answers one album, so the rule judges it as the only
     * answer (`compareOnlyAnswer`): the full catalog title with a subtitle is accepted, with its reason.
     * @returns {{ same: true, reason: string } | null} the verdict when accepted
     * @private
     */
    _acceptedAnswer(query, data) {
        const answered = { artist: data?.artist, title: data?.title || data?.album, year: data?.year }
        const verdict = compareOnlyAnswer(askedAlbum(plainAlbumQuery(query)), answered)
        if (verdict.same) return verdict
        console.warn(`[APIClient] the AI search answered "${answered.artist} - ${answered.title}", which is not the album asked for (${verdict.reason}): not accepted`)
        return null
    }

    /**
     * One call to POST /generate, with a deadline (DP-22).
     * @returns {Promise<Object>} the result of the answer (never a failure)
     * @throws {ApiError}
     * @private
     */
    _postGenerate(queryStr) {
        return this._post('/generate', { albumQuery: queryStr }, { timeoutMs: this.serverTimeoutMs })
    }

    /**
     * The album of an answer of POST /generate, as the app's Album.
     *
     * What the server said about each source of ratings (`data.ratings`, F52 slice 5) is read here
     * (models/ratingsOutcome.js) and stays on the album, in `metadata.ratingsOutcome`. The page of
     * BestEverAlbums stays on the album only when the server said the ratings were found (or said
     * nothing: the server before slice 5). An album with that address reads as "already has its
     * ratings" (adapters/enrichers.js), so an album whose source failed, was not asked, or has no
     * ratings comes without it, and the app's own source is asked through its normal path (F70).
     * @param {Object} data - the album as the server answered it
     * @returns {Album}
     * @private
     */
    normalizeAlbumData(data) {
        const id = this.generateAlbumId(data)
        const title = data.title || data.album
        const context = { artist: data.artist, album: title, albumId: id }
        const originalTracks = data.tracks || []
        const rankedTracks = data.tracksByAcclaim || data.rankingConsolidated || []
        const byAcclaim = rankedTracks.length > 0 ? rankedTracks : originalTracks
        const outcomes = readRatingsOutcome(data.ratings)

        return new Album({
            id,
            title,
            artist: data.artist,
            year: data.year,
            coverUrl: data.coverUrl || null,
            ...pageOfTheSource(data, outcomes),
            // The tracks by acclaim when the server ranked them, else in the order they came
            tracks: byAcclaim.map((track, index) => canonicalTrack(track, index, context, 'acclaimRank')),
            tracksOriginalOrder: originalTracks.map((track, index) => canonicalTrack(track, index, context, 'position')),
            metadata: {
                fetchedAt: new Date().toISOString(),
                ...data.metadata,
                ...(outcomes ? { ratingsOutcome: outcomes } : {})
            },
            acclaim: data.acclaim || acclaimOf(byAcclaim, data.rankingConsolidatedMeta?.source)
        })
    }

    /**
     * Generate stable album ID
     * @param {Object} data - Album data
     * @returns {string} Stable ID
     * @private
     */
    generateAlbumId(data) {
        const artist = (data.artist || '').toLowerCase().replace(/\s+/g, '-')
        const album = (data.title || data.album || '').toLowerCase().replace(/\s+/g, '-')
        return `${artist}_${album}`.replace(/[^\w-]/g, '')
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Lookup coverUrl from albums-expanded.json via AlbumLoader
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @returns {string|null} Cover URL or null if not found
     * @private
     */
    lookupCoverUrl(artist, album) {
        if (!artist || !album) return null

        // AlbumLoader must be already loaded (it's loaded on app init)
        if (!albumLoader.isLoaded || !albumLoader.albums) {
            console.warn('[APIClient] AlbumLoader not loaded or albums not available for cover lookup.')
            return null
        }

        const normalizedArtist = artist.toLowerCase().trim()
        const normalizedAlbum = album.toLowerCase().trim()

        // Find matching album in enriched dataset
        const match = albumLoader.albums.find(a => {
            const matchArtist = (a.artist || '').toLowerCase().trim()
            const matchAlbum = (a.album || '').toLowerCase().trim()
            return matchArtist === normalizedArtist && matchAlbum === normalizedAlbum
        })

        if (match?.coverUrl) {
            return match.coverUrl
        }

        return null
    }
}

// Singleton instance
export const apiClient = new APIClient()
