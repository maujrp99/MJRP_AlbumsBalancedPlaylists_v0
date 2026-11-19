
import { SpotifyAuthService } from './SpotifyAuthService.js'
import { NormalizationUtils } from '../utils/NormalizationUtils.js'
import { pickAlbum, spotifyCandidate } from '../models/askedAlbum.js'
import { SpotifyReconnectError, SpotifyRateLimitError } from './spotify/spotifyErrors.js'

/** The longest wait a rate limit may ask of a patient caller before it is reported instead. */
const MAX_RATE_LIMIT_WAIT_SECONDS = 30

/** The export waits a short rate limit; see _fetch. */
const PATIENT = Object.freeze({ patient: true })

/** The seconds a 429 asked to wait, or null when it did not say. */
const retryAfterOf = (response) => Number(response.headers?.get?.('Retry-After')) || null

/**
 * SpotifyService
 * Handles data fetching from Spotify Web API
 * depends on SpotifyAuthService for tokens
 */
export const SpotifyService = {

    baseUrl: 'https://api.spotify.com/v1',

    /**
     * Helper to get headers with valid token (an access past its time is renewed here)
     * @private
     * @throws {SpotifyReconnectError} when there is no access and none can be had without the person
     */
    async _getHeaders() {
        const token = await SpotifyAuthService.getAccessToken()
        if (!token) throw new SpotifyReconnectError()
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    },

    /** Replaceable in tests. @private */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    },

    /** One request to the Web API, with the access of now. @private */
    async _send(endpoint, options) {
        const headers = await this._getHeaders()
        return fetch(`${this.baseUrl}${endpoint}`, { ...options, headers: { ...headers, ...options.headers } })
    },

    /**
     * Spotify refused the access (401) although its time had not passed: renew it ONCE with the
     * refresh token and make the request again. Refused again, or not renewable: the person must
     * connect again.
     * @private
     */
    async _sendWithRenewedAccess(endpoint, options) {
        console.warn('[SpotifyService] Access refused (401): renewing it once')
        if (!(await SpotifyAuthService.renewAccess())) throw new SpotifyReconnectError()

        const response = await this._send(endpoint, options)
        if (response.status === 401) throw new SpotifyReconnectError()
        return response
    },

    /**
     * Spotify asked to wait (429). A caller that said it is patient waits what `Retry-After` asks,
     * once, when that is at most MAX_RATE_LIMIT_WAIT_SECONDS; otherwise the limit is reported with
     * the time Spotify asked for.
     * @private
     */
    async _sendAfterTheWait(limited, endpoint, options, patient) {
        const seconds = retryAfterOf(limited)
        if (!patient || !seconds || seconds > MAX_RATE_LIMIT_WAIT_SECONDS) throw new SpotifyRateLimitError(seconds)

        console.warn(`[SpotifyService] Rate limited: waiting ${seconds} s`)
        await this._sleep(seconds * 1000)
        const response = await this._send(endpoint, options)
        if (response.status === 429) throw new SpotifyRateLimitError(retryAfterOf(response))
        return response
    },

    /**
     * Generic fetch wrapper.
     * @private
     * @param {string} endpoint
     * @param {Object} [options] - fetch options
     * @param {Object} [policy]
     * @param {boolean} [policy.patient] - wait a short rate limit and try again (the export does;
     *        the album load does not: it has its own deadline)
     * @throws {SpotifyReconnectError|SpotifyRateLimitError|Error}
     */
    async _fetch(endpoint, options = {}, { patient = false } = {}) {
        try {
            let response = await this._send(endpoint, options)
            if (response.status === 401) response = await this._sendWithRenewedAccess(endpoint, options)
            if (response.status === 429) response = await this._sendAfterTheWait(response, endpoint, options, patient)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error?.message || `Spotify API Error: ${response.status}`)
            }

            return await response.json()

        } catch (error) {
            console.error(`[SpotifyService] Error fetching ${endpoint}:`, error)
            throw error
        }
    },

    /**
     * The Spotify album that is the album asked for, or null.
     *
     * Three searches, from the narrowest to the widest: artist and clean title, artist and the
     * title as written, the albums of the artist. The searches only LIST candidates; which one is
     * accepted is decided by the one identity rule (shared/albumIdentity.js, F55). No candidate
     * passes: null. There is no "first result" and no "closest album of the artist".
     *
     * @param {string} artist
     * @param {string} albumName
     * @param {number|string|null} [year] - only orders the candidates that pass
     * @returns {Promise<object|null>} Spotify Album Object or null
     */
    async searchAlbum(artist, albumName, year = null) {
        if (!artist || !albumName) return null

        const asked = { artist, title: albumName, year }
        const cleanAlbumName = NormalizationUtils.cleanTitle(albumName)
        const searches = [
            () => this._searchAlbumQuery(artist, cleanAlbumName),
            ...(cleanAlbumName !== albumName ? [() => this._searchAlbumQuery(artist, albumName)] : []),
            () => this._searchByArtist(artist)
        ]

        for (const search of searches) {
            const picked = pickAlbum(asked, await search(), spotifyCandidate)
            if (picked.found) return picked.candidate
        }
        console.log(`[SpotifyService] No album of Spotify is "${artist} - ${albumName}".`)
        return null
    },

    /**
     * The albums Spotify lists for the artist (up to 20). A failure of this last, widest search
     * is "no candidates", as it was before.
     * @private
     * @returns {Promise<Array>}
     */
    async _searchByArtist(artistName) {
        // Diacritics are kept: Spotify handles them well
        const q = `artist:${artistName}`.replace(/['"()]/g, '')
        const params = new URLSearchParams({ q, type: 'album', limit: 20 })
        try {
            const data = await this._fetch(`/search?${params.toString()}`)
            return data?.albums?.items || []
        } catch (error) {
            console.warn('[SpotifyService] Artist-only search failed:', error.message)
            return []
        }
    },

    /**
     * The albums Spotify lists for "artist + album" (up to 5).
     * @private
     * @returns {Promise<Array>}
     */
    async _searchAlbumQuery(artist, albumName) {
        // Clean query but preserve diacritics. Spotify handles them well.
        const cleanArtist = artist.replace(/['"()]/g, '')
        const cleanAlbum = albumName.replace(/['"()]/g, '')
        const params = new URLSearchParams({ q: `artist:${cleanArtist} album:${cleanAlbum}`, type: 'album', limit: 5 })

        const data = await this._fetch(`/search?${params.toString()}`)
        return data?.albums?.items || []
    },

    /**
     * Get full album details including tracks and popularity
     * @param {string} spotifyId 
     */
    async getAlbumDetails(spotifyId) {
        if (!spotifyId) return null
        return await this._fetch(`/albums/${spotifyId}`)
    },

    /**
     * Get tracks for an album with their popularity
     * Note: /albums/{id} returns tracks, but track objects there strictly usually DO NOT contain popularity?
     * WAIT: Spotify API docs say "SimplifiedTrackObject" in album details does NOT have popularity.
     * We must fetch tracks via /albums/{id}/tracks (still simplified) -> THEN /tracks?ids=... to get FullTrackObject.
     * OR check if /albums/{id} implementation changed.
     * Documentation Check: "Get Album" -> returns AlbumObject. Tracks property is PagingObject<SimplifiedTrackObject>.
     * SimplifiedTrackObject does NOT have popularity.
     * We MUST batch fetch full tracks.
     * 
     * @param {string} albumId 
     * @returns {Promise<Array>} List of tracks with popularity
     */
    async getAlbumTracksWithPopularity(albumId) {
        const album = await this.getAlbumDetails(albumId)
        if (!album) return []

        // Tracks are paginated, but usually < 50 for single album.
        // Let's assume < 50 for v1.
        const simplifiedTracks = album.tracks.items
        const trackIds = simplifiedTracks.map(t => t.id)

        // Batch fetch full track details (max 50)
        // If > 50, would need chunks.
        const idsParam = trackIds.join(',')
        const tracksData = await this._fetch(`/tracks?ids=${idsParam}`)

        return tracksData.tracks // These are FullTrackObjects with popularity (0-100)
    },

    /**
     * Calculate average popularity of a set of tracks
     * @param {Array} tracks 
     * @returns {number} 0-100
     */
    calculateAveragePopularity(tracks) {
        if (!tracks || tracks.length === 0) return 0
        const sum = tracks.reduce((acc, t) => acc + (t.popularity || 0), 0)
        return Math.round(sum / tracks.length)
    },

    // ========== EXPORT METHODS (Phase 5) ==========

    /**
     * Get current user's Spotify profile
     * @returns {Promise<object>} User profile with id, display_name, etc.
     */
    async getCurrentUser() {
        return await this._fetch('/me', {}, PATIENT)
    },

    /**
     * Search for a track by name and artist (used by the export).
     * @param {string} trackName
     * @param {string} artistName
     * @param {string} albumName - Optional album name for better matching
     * @returns {Promise<object|null>} Spotify track object, or null when Spotify has no such track
     * @throws when Spotify could not be asked (the caller decides what a failure means: "not found"
     *         is an answer, a failure is not one)
     */
    async searchTrack(trackName, artistName, albumName = '') {
        if (!trackName || !artistName) return null

        // Build query - include album if provided for better accuracy
        let query = `track:${trackName} artist:${artistName}`
        if (albumName) {
            query += ` album:${albumName}`
        }

        // Clean query of special characters
        query = query.replace(/['"]/g, '')

        const params = new URLSearchParams({
            q: query,
            type: 'track',
            limit: 5
        })

        const data = await this._fetch(`/search?${params.toString()}`, {}, PATIENT)
        const items = data.tracks?.items || []
        if (items.length === 0) return null

        // Try to find exact artist match first
        const normalizeStr = str => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
        const targetArtist = normalizeStr(artistName)
        const targetTrack = normalizeStr(trackName)
        const includesEither = (a, b) => a.includes(b) || b.includes(a)

        const match = items.find(track =>
            includesEither(normalizeStr(track.name), targetTrack) &&
            includesEither(normalizeStr(track.artists[0]?.name), targetArtist))

        // Fallback to first result if no exact match
        return match || items[0]
    },

    /**
     * Create a new playlist in user's Spotify account
     * @param {string} name - Playlist name
     * @param {string} description - Optional description
     * @returns {Promise<object>} Created playlist object with id
     */
    async createPlaylist(name, description = '') {
        const user = await this.getCurrentUser()
        if (!user) throw new Error('Could not get user profile')

        return await this._fetch(`/users/${user.id}/playlists`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                description: description || 'Created by MJRP Album Blender',
                public: false
            })
        }, PATIENT)
    },

    /**
     * Add tracks to a playlist
     * @param {string} playlistId
     * @param {Array<string>} trackUris - Array of Spotify track URIs
     * @param {Function} [onAdded] - (count) => void, after each request: how many of `trackUris`
     *        are in the playlist so far (a failure in the middle leaves the count of what went)
     * @returns {Promise<object>} Snapshot response
     */
    async addTracksToPlaylist(playlistId, trackUris, onAdded = () => { }) {
        if (!trackUris || trackUris.length === 0) return null

        let lastSnapshot = null
        // Spotify allows max 100 tracks per request
        for (let start = 0; start < trackUris.length; start += 100) {
            if (start > 0) await this._sleep(300) // small delay between requests
            const chunk = trackUris.slice(start, start + 100)
            lastSnapshot = await this._fetch(`/playlists/${playlistId}/tracks`, {
                method: 'POST',
                body: JSON.stringify({ uris: chunk })
            }, PATIENT)
            onAdded(start + chunk.length)
        }

        return lastSnapshot
    },

    // ========== AUTO-ENRICHMENT METHOD (Sprint 11) ==========

    /**
     * Enrich an album object with Spotify data (ID, popularity, track URIs)
     * Used during album loading for auto-enrichment
     * @param {string} artist - Artist name
     * @param {string} albumTitle - Album title
     * @returns {Promise<object|null>} Enrichment data or null if not found
     */
    async enrichAlbumData(artist, albumTitle) {
        try {
            // 1. Search for the album
            const spotifyAlbum = await this.searchAlbum(artist, albumTitle)

            if (!spotifyAlbum) {
                console.log(`[SpotifyService] Album not found: "${artist} - ${albumTitle}"`)
                return null
            }

            // 2. The album is the one asked for: searchAlbum accepts nothing else (title and artist)

            // 3. Get tracks with popularity
            const spotifyTracks = await this.getAlbumTracksWithPopularity(spotifyAlbum.id)

            if (!spotifyTracks || spotifyTracks.length === 0) {
                console.log(`[SpotifyService] No tracks found for: "${artist} - ${albumTitle}"`)
                return null
            }

            // 4. Calculate average popularity
            const avgPopularity = this.calculateAveragePopularity(spotifyTracks)

            // 5. Build track popularity map (by normalized title)
            const trackPopularityMap = new Map()
            spotifyTracks.forEach(track => {
                const normalizedTitle = track.name.toLowerCase().trim()
                trackPopularityMap.set(normalizedTitle, {
                    popularity: track.popularity,
                    spotifyId: track.id,
                    spotifyUri: track.uri,
                    spotifyPreviewUrl: track.preview_url
                })
            })

            console.log(`[SpotifyService] Enriched "${artist} - ${albumTitle}" - ${spotifyTracks.length} tracks, avg popularity: ${avgPopularity}`)

            return {
                spotifyId: spotifyAlbum.id,
                spotifyUrl: spotifyAlbum.external_urls?.spotify,
                spotifyPopularity: avgPopularity,
                spotifyArtwork: spotifyAlbum.images?.[0]?.url,
                trackPopularityMap,
                spotifyTracks: spotifyTracks.map(t => ({
                    name: t.name,
                    popularity: t.popularity,
                    spotifyId: t.id,
                    spotifyUri: t.uri
                }))
            }
        } catch (error) {
            console.warn(`[SpotifyService] Enrichment failed for "${artist} - ${albumTitle}":`, error.message)
            return null
        }
    },

    /**
     * Check if Spotify is available (user authenticated)
     * @returns {boolean}
     */
    isAvailable() {
        return SpotifyAuthService.isAuthenticated()
    }
}

