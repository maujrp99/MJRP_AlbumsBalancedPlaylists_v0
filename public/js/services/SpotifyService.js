
import { SpotifyAuthService } from './SpotifyAuthService.js'
import { pickAlbum, spotifyCandidate, titleWithoutEditionNotes } from '../models/askedAlbum.js'
import { SpotifyReconnectError, SpotifyRateLimitError, SpotifyRefusedError } from './spotify/spotifyErrors.js'

/** The longest wait a rate limit may ask of a patient caller before it is reported instead. */
const MAX_RATE_LIMIT_WAIT_SECONDS = 30

/** The export waits a short rate limit; see _fetch. */
const PATIENT = Object.freeze({ patient: true })

/** How many tracks Spotify gives in one request of full tracks. */
const TRACKS_PER_REQUEST = 50

/** The seconds a 429 asked to wait, or null when it did not say. */
const retryAfterOf = (response) => Number(response.headers?.get?.('Retry-After')) || null

/**
 * The error of an answer that is not a success. 403: Spotify does not serve this account (F97) - a refusal with a
 * name, never "any failure"; anything else keeps what Spotify said.
 * @param {Response} response
 * @returns {Promise<Error>}
 */
async function errorOf(response) {
    const errorData = await response.json().catch(() => ({}))
    const said = errorData.error?.message
    if (response.status === 403) return new SpotifyRefusedError(said || null)
    return new Error(said || `Spotify API Error: ${response.status}`)
}

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
     * @throws {SpotifyReconnectError|SpotifyRateLimitError|SpotifyRefusedError|Error}
     */
    async _fetch(endpoint, options = {}, { patient = false } = {}) {
        try {
            let response = await this._send(endpoint, options)
            if (response.status === 401) response = await this._sendWithRenewedAccess(endpoint, options)
            if (response.status === 429) response = await this._sendAfterTheWait(response, endpoint, options, patient)

            if (!response.ok) throw await errorOf(response)

            return await response.json()

        } catch (error) {
            console.error(`[SpotifyService] Error fetching ${endpoint}:`, error)
            throw error
        }
    },

    /**
     * The Spotify album that is the album asked for, or null.
     *
     * Three searches, from the narrowest to the widest: artist and the title without its edition
     * notes (the rule's own `titleWithoutEditionNotes`), artist and the title as written, the albums of the artist. The searches only LIST candidates; which one is
     * accepted is decided by the one identity rule (shared/albumIdentity.js, F55). No candidate
     * passes: null. There is no "first result" and no "closest album of the artist".
     *
     * @param {string} artist
     * @param {string} albumName
     * @param {number|string|null} [year] - only orders the candidates that pass
     * @returns {Promise<object|null>} Spotify Album Object, or null when Spotify answered and has none
     * @throws when a search could not be made: null is only ever "Spotify has no such album"
     */
    async searchAlbum(artist, albumName, year = null) {
        if (!artist || !albumName) return null

        const asked = { artist, title: albumName, year }
        const cleanAlbumName = titleWithoutEditionNotes(albumName)
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
     * is a failure like any other (F69): read as "no candidates", it made "Spotify could not be
     * asked" look like "Spotify has no such album".
     * @private
     * @returns {Promise<Array>}
     */
    async _searchByArtist(artistName) {
        // Diacritics are kept: Spotify handles them well
        const q = `artist:${artistName}`.replace(/['"()]/g, '')
        const params = new URLSearchParams({ q, type: 'album', limit: 20 })
        const data = await this._fetch(`/search?${params.toString()}`)
        return data?.albums?.items || []
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
     * The tracks of an album with their popularity. The album itself lists its tracks without it
     * (SimplifiedTrackObject), so the full tracks are read by id, at most
     * TRACKS_PER_REQUEST in each request.
     *
     * @param {string} albumId
     * @returns {Promise<Array>} FullTrackObjects, with popularity (0-100)
     */
    async getAlbumTracksWithPopularity(albumId) {
        const album = await this.getAlbumDetails(albumId)
        const trackIds = (album?.tracks?.items || []).map(track => track.id).filter(Boolean)

        const tracks = []
        for (let start = 0; start < trackIds.length; start += TRACKS_PER_REQUEST) {
            const ids = trackIds.slice(start, start + TRACKS_PER_REQUEST).join(',')
            const data = await this._fetch(`/tracks?ids=${ids}`)
            tracks.push(...(data?.tracks || []).filter(Boolean))
        }
        return tracks
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

    // ========== THE POPULARITY OF AN ALBUM (F69) ==========

    /**
     * What Spotify has about the popularity of an album. The one caller is the popularity source
     * of the album load (services/albums/adapters/spotifyPopularitySource.js).
     *
     * It answers only when Spotify answered: the album with its data, or "Spotify has none" with
     * the reason ('not_found': no album of Spotify is the album asked for, by the one identity
     * rule in searchAlbum; 'no_tracks': the album is there and lists no track). A call that could
     * not be made is thrown as it came (SpotifyReconnectError, SpotifyRateLimitError, or the
     * error of the network or of the API): it is never an answer.
     *
     * @param {string} artist
     * @param {string} albumTitle
     * @returns {Promise<{ found: true, data: Object } | { found: false, reason: string }>} `data` is
     *          { spotifyId, spotifyUrl, spotifyPopularity, spotifyArtwork, trackPopularity: [{ name, popularity, spotifyId, spotifyUri }] }
     */
    async albumPopularity(artist, albumTitle) {
        const spotifyAlbum = await this.searchAlbum(artist, albumTitle)
        if (!spotifyAlbum) return { found: false, reason: 'not_found' }

        const tracks = await this.getAlbumTracksWithPopularity(spotifyAlbum.id)
        if (tracks.length === 0) return { found: false, reason: 'no_tracks' }

        return {
            found: true,
            data: {
                spotifyId: spotifyAlbum.id,
                spotifyUrl: spotifyAlbum.external_urls?.spotify,
                spotifyPopularity: this.calculateAveragePopularity(tracks),
                spotifyArtwork: spotifyAlbum.images?.[0]?.url,
                trackPopularity: tracks.map(track => ({
                    name: track.name,
                    popularity: track.popularity,
                    spotifyId: track.id,
                    spotifyUri: track.uri
                }))
            }
        }
    }
}

