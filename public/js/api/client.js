import { serverFetch } from './serverFetch.js'
import { Album } from '../models/Album.js'
import { askedAlbum, compareOnlyAnswer } from '../models/askedAlbum.js'
import { plainAlbumQuery } from '../models/albumQuery.js'
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

export class APIClient {
    constructor() {
        this.baseUrl = API_BASE
        this.defaultRetries = 2
        this.retryDelay = 1000 // the first wait; it doubles on each new attempt, up to retryDelayCap
        this.retryDelayCap = 8000
        this.serverTimeoutMs = 90000 // POST /generate runs an AI model: slow, but not endless
        this.random = Math.random
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
     * @param {string|Object} query - "Artist - Album" or { artist, title }
     * @param {number} [retries] - new attempts after the first call
     * @returns {Promise<Album|null>} null when the server answered that it has no such album
     * @throws {ApiError} the real failure, with `status` when the server answered
     * @private
     */
    async _fetchAlbumFromAPI(query, retries = this.defaultRetries) {
        // The legacy backend takes the query as text
        const queryStr = (typeof query === 'object' && query !== null)
            ? `${query.artist || ''} - ${query.title || query.album || ''}`
            : query

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
     * Normalize album data from API
     * @param {Object} data - Raw API response
     * @returns {Object} Normalized album
     * @private
     */
    /**
     * Normalize album data from API
     * @param {Object} data - Raw API response
     * @returns {Album} Normalized album instance
     * @private
     */
    normalizeAlbumData(data) {
        // Generate stable ID
        const id = this.generateAlbumId(data)

        // DEBUG: Log raw API data
        console.debug('[APIClient] Raw API data received:', {
            hasTracks: !!data.tracks,
            hasTracksByAcclaim: !!data.tracksByAcclaim,
            tracksCount: data.tracks?.length,
            tracksByAcclaimCount: data.tracksByAcclaim?.length
        })

        const originalTracks = data.tracks || []
        const rankedTracks = data.tracksByAcclaim || data.rankingConsolidated || []

        // DEBUG: Inspect track lists before processing
        console.debug('[APIClient] Track lists before processing:', {
            originalFirst: originalTracks[0]?.title,
            originalLength: originalTracks.length,
            rankedFirst: rankedTracks[0]?.title,
            rankedLength: rankedTracks.length
        })

        // Sprint 12.5: Use TrackTransformer for canonical track creation
        const albumContext = {
            artist: data.artist,
            album: data.title || data.album,
            albumId: id
        }

        // Helper to prepare track data using TrackTransformer
        const prepareTrackData = (track, idx, isRanked) => {
            // Ensure strictly required fields for transformer if backend data is messy
            const raw = {
                ...track,
                // Pass rank/position hints if they exist, otherwise mapped by index below
                acclaimRank: track.rank || track.acclaimRank || track.finalPosition,
                position: track.position || track.trackNumber,
                acclaimScore: track.normalizedScore || track.acclaimScore
            }

            const canonical = TrackTransformer.toCanonical(raw, albumContext)

            // Apply index-based fallbacks if strictly needed (though transformer handles most)
            if (isRanked && !canonical.acclaimRank) canonical.acclaimRank = idx + 1
            if (!isRanked && !canonical.position) canonical.position = idx + 1

            return canonical
        }

        // Construct Album Data
        const albumData = {
            id,
            title: data.title || data.album,
            artist: data.artist,
            year: data.year,

            // Enrich coverUrl from albums-expanded.json if not present
            coverUrl: data.coverUrl || null, // TODO: Implement async hydration for covers

            // BestEver fields
            bestEverAlbumId: data.bestEverAlbumId,
            bestEverUrl: data.bestEverUrl,
            bestEverEvidence: data.bestEverEvidence,

            // Tracks Lists (Pre-processed)
            // If rankedTracks exists, use it for 'tracks' (Acclaim order)
            // Otherwise fallback to originalTracks
            tracks: (rankedTracks.length > 0 ? rankedTracks : originalTracks).map((t, i) => prepareTrackData(t, i, true)),

            // Original Order Tracks
            tracksOriginalOrder: originalTracks.map((t, i) => prepareTrackData(t, i, false)),

            metadata: {
                fetchedAt: new Date().toISOString(),
                ...data.metadata
            },

            // Calculate acclaim metadata if missing
            acclaim: data.acclaim || (() => {
                const tracks = rankedTracks.length > 0 ? rankedTracks : originalTracks
                const hasRatings = tracks.some(t =>
                    (t.rating !== null && t.rating !== undefined) ||
                    (t.rank !== null && t.rank !== undefined)
                )
                return {
                    hasRatings,
                    source: data.rankingConsolidatedMeta?.source || 'hybrid-curation',
                    trackCount: tracks.length
                }
            })()
        }

        // Return Domain Model Instance
        const album = new Album(albumData)

        // DEBUG: Log normalized output
        console.debug('[APIClient] Normalized album output:', {
            id: album.id,
            title: album.title,
            tracksCount: album.tracks.length,
            tracksOriginalOrderCount: album.tracksOriginalOrder.length,
            firstTrack: album.tracks[0],
            firstOriginalTrack: album.tracksOriginalOrder[0]
        })

        return album
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
