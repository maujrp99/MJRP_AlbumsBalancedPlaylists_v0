import axios from 'axios'
import { serverFetch } from './serverFetch.js'
import { Album } from '../models/Album.js'
import { askedAlbum, appleCandidate, compareAlbumIdentity, pickAlbum } from '../models/askedAlbum.js'
import { plainAlbumQuery } from '../models/albumQuery.js'
import { albumCache } from '../cache/albumCache.js'
import { albumLoader } from '../services/AlbumLoader.js'
import { musicKitService } from '../services/MusicKitService.js'
import { TrackTransformer } from '../transformers/TrackTransformer.js'
import { retryWithBackoff } from '../utils/retry.js'
import { readServerResult, failedWithoutAnswer, ApiError, ResultKind } from './serverResult.js'

/**
 * API Client
 * Wrapper for backend API calls with retry logic and caching
 * 
 * An album is accepted only when it is the album asked for, by the one identity rule
 * (shared/albumIdentity.js, F55): the Apple Music search result and the answer of the AI search.
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
        this.cache = albumCache // Initialize this.cache with albumCache
    }

    /**
     * Fetch album data (with caching)
     * @param {string} query - Album query (Artist - Album)
     * @param {boolean} skipCache - Force fresh fetch
     * @returns {Promise<Album>} Album data
     */
    async fetchAlbum(query, skipCache = false) {
        // 1. Check cache (if not skipped) - ARCH-5: Now async for IndexedDB
        if (!skipCache) {
            const cached = await this.cache.get(query)
            if (cached) {
                // console.log('[APIClient] Returning cached album:', query)
                // HYDRATION: Convert cached JSON back to Album instance
                return cached instanceof Album ? cached : new Album(cached)
            }
        }

        // 2. Sprint 7.5: Try Apple Music + Enrichment First
        try {

            // The catalog is asked with plain text; what is accepted is decided by the one identity rule
            const asked = askedAlbum(plainAlbumQuery(query))

            // Search (limit 5: the results come scored, standard editions first)
            const appleAlbums = await musicKitService.searchAlbums(asked.artist, asked.title, 5)
            const picked = pickAlbum(asked, appleAlbums, appleCandidate)

            if (picked.found) {
                // Get Full Details (Tracks)
                const fullAlbum = await musicKitService.getAlbumDetails(picked.candidate.id)

                if (fullAlbum) {
                    // 3. Enrich with Rankings (Backend)

                    // 3. Construct Base Album Model (Clean, no ratings yet)
                    const stableId = this.generateAlbumId({ title: fullAlbum.title, artist: fullAlbum.artist })

                    const albumContext = {
                        artist: fullAlbum.artist,
                        album: fullAlbum.title,
                        albumId: stableId
                    }

                    // Map Apple Music tracks to canonical format (no ratings initially)
                    const allTracks = fullAlbum.tracks.map(t => TrackTransformer.toCanonical({
                        id: t.id || `track_${stableId}_${t.trackNumber}`,
                        title: t.title,
                        artist: t.artist || fullAlbum.artist,
                        duration: t.duration,
                        position: t.trackNumber,
                        trackNumber: t.trackNumber,
                        isrc: t.isrc,
                        previewUrl: t.previewUrl,
                        appleMusicId: t.id,
                        rating: null // Will be enriched by Helper
                    }, albumContext))

                    const tracksOriginalOrder = [...allTracks].sort((a, b) => a.trackNumber - b.trackNumber)
                    const tracksByAcclaim = [...allTracks] // Initial order, will be sorted by Helper if needed, or we might need to re-sort after enrichment?
                    // Actually, enrichment updates properties. We might need to re-sort 'tracks' if we want them rating-sorted.
                    // But initially Apple Music returns disk order usually. 
                    // Let's create the Album.

                    const albumData = {
                        id: stableId,
                        title: fullAlbum.title,
                        artist: fullAlbum.artist,
                        year: fullAlbum.year,
                        coverUrl: musicKitService.getArtworkUrl(fullAlbum.artworkTemplate, 600),
                        tracks: tracksByAcclaim,
                        tracksOriginalOrder: tracksOriginalOrder,
                        metadata: { source: 'Apple Music', sourceId: fullAlbum.id }
                    }

                    const album = new Album(albumData)

                    // 4. Enrich with BEA (Encapsulated)
                    // This handles API call, mapping, and updates album.bestEverUrl, album.acclaim, and track.rating
                    try {
                        const { enrichAlbum } = await import('../helpers/BEAEnrichmentHelper.js')
                        await enrichAlbum(album, { silent: true })

                        // Re-sort tracks by rating if enrichment happened
                        if (album.acclaim && album.acclaim.hasRatings) {
                            album.tracks.sort((a, b) => {
                                const rA = a.rating !== null ? a.rating : -1
                                const rB = b.rating !== null ? b.rating : -1
                                if (rA !== rB) return rB - rA
                                return a.trackNumber - b.trackNumber
                            })
                            // Re-assign ranks
                            album.tracks.forEach((t, idx) => t.rank = idx + 1)
                        }
                    } catch (beaError) {
                        console.warn(`BEA enrichment failed for ${album.title}:`, beaError)
                    }

                    // 5. Enrich with Spotify (Encapsulated)
                    try {
                        const { applyEnrichmentToAlbum } = await import('../helpers/SpotifyEnrichmentHelper.js')
                        await applyEnrichmentToAlbum(album, { fetchIfMissing: true })
                    } catch (spotifyError) {
                        console.warn(`Spotify enrichment failed for ${album.artist} - ${album.title}:`, spotifyError.message)
                    }

                    await this.cache.set(query, album)
                    return album
                }
            }
        } catch (e) {
            console.error(`Error fetching from Apple Music for "${query}":`, e)
        }

        // 5. Fallback: Legacy Generate API
        return this._fetchAlbumFromAPI(query)
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
     * The ratings of an album, for the callers of before the album load (BEAEnrichmentHelper).
     * @param {Object} albumData - { title, artist, tracks }
     * @returns {Promise<Object|null>} { bestEverInfo, trackRatings, trackEvidence }, or null when the request failed
     */
    async BEAenrichAlbum(albumData) {
        try {
            return (await this.requestRatings(albumData)).data
        } catch (error) {
            console.warn('[APIClient] Enrichment failed:', error?.message || error)
            return null
        }
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
        if (!this._isTheAlbumAskedFor(query, data)) return null
        return this.normalizeAlbumData(data)
    }

    /**
     * The AI search answers with whatever album it believes in. It is accepted only when it is the
     * album asked for, by the one identity rule (F55); another album of the artist is "the server
     * has no such album", and the paid call is not made again.
     * @private
     */
    _isTheAlbumAskedFor(query, data) {
        const answered = { artist: data?.artist, title: data?.title || data?.album, year: data?.year }
        const verdict = compareAlbumIdentity(askedAlbum(plainAlbumQuery(query)), answered)
        if (!verdict.same) {
            console.warn(`[APIClient] the AI search answered "${answered.artist} - ${answered.title}", which is not the album asked for (${verdict.reason}): not accepted`)
        }
        return verdict.same
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
     * Fetch multiple albums with progress callback
     * @param {Array<string>} queries - Album queries
     * @param {Function} onProgress - Progress callback (current, total, result)
     * @param {boolean} skipCache - Skip cache for all albums
     * @param {AbortSignal} signal - Abort signal to cancel operation
     * @returns {Promise<Object>} { results, errors }
     */
    async fetchMultipleAlbums(queries, onProgress = null, skipCache = false, signal = null) {
        const results = []
        const errors = []

        for (let i = 0; i < queries.length; i++) {
            // Check cancellation
            if (signal && signal.aborted) {
                console.log('[APIClient] Fetch multiple albums aborted.')
                break
            }

            const query = queries[i]

            try {
                const album = await this.fetchAlbum(query, skipCache)

                // Check cancellation again after await
                if (signal && signal.aborted) {
                    console.log('[APIClient] Fetch multiple albums aborted after fetch.')
                    break
                }

                const result = { query, album, status: 'success' }
                results.push(result)

                if (onProgress) {
                    onProgress(i + 1, queries.length, result)
                }
            } catch (error) {
                // Check cancellation
                if (signal && signal.aborted) break

                const errorResult = {
                    query,
                    error: error.message,
                    status: 'error'
                }
                errors.push(errorResult)
                results.push(errorResult)

                if (onProgress) {
                    onProgress(i + 1, queries.length, errorResult)
                }
            }
        }

        return { results, errors }
    }

    /**
     * Generate balanced playlists from albums
     * @param {Array<Object>} albums - Albums with ranked tracks
     * @param {Object} options - Generation options
     * @returns {Promise<Array>} Generated playlists
     */
    async generatePlaylists(albums, options = {}) {
        try {
            const response = await serverFetch(`${this.baseUrl}/playlists`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    albums: albums.map(album => ({
                        id: album.id,
                        title: album.title,
                        artist: album.artist,
                        tracks: album.tracks.map(t => ({
                            id: t.id,
                            title: t.title,
                            rank: t.rank,
                            rating: t.rating,
                            duration: t.duration
                        }))
                    })),
                    options: {
                        targetCount: options.targetCount || 4,
                        minDuration: options.minDuration || 30,
                        maxDuration: options.maxDuration || 60
                    }
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()

            // Normalize playlist response
            return this.normalizePlaylists(data.playlists || data)
        } catch (error) {
            console.error('Playlist generation failed:', error)
            throw error
        }
    }

    /**
     * Normalize playlists data from API
     * @param {Array} playlists - Raw playlist data
     * @returns {Array} Normalized playlists
     * @private
     */
    normalizePlaylists(playlists) {
        return playlists.map((playlist, index) => ({
            id: `playlist-${index + 1}`,
            name: playlist.name || `Playlist ${index + 1}`,
            tracks: (playlist.tracks || []).map(track => ({
                title: track.title || track.name || '',
                artist: track.artist || '',
                album: track.album || '',
                rating: track.rating || null,
                rank: track.rank || track.acclaimRank || track.finalPosition || '-',
                duration: track.duration || track.durationSeconds || 0,
                metadata: track.metadata || {}
            }))
        }))
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
