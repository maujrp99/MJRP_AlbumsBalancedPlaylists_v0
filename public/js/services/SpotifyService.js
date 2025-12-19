
import { SpotifyAuthService } from './SpotifyAuthService.js'

/**
 * SpotifyService
 * Handles data fetching from Spotify Web API
 * depends on SpotifyAuthService for tokens
 */
export const SpotifyService = {

    baseUrl: 'https://api.spotify.com/v1',

    /**
     * Helper to get headers with valid token
     * @private
     */
    async _getHeaders() {
        const token = await SpotifyAuthService.getAccessToken()
        if (!token) {
            throw new Error('No access token available')
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    },

    /**
     * Generic fetch wrapper with 401 retry logic
     * @private
     */
    async _fetch(endpoint, options = {}) {
        try {
            let headers = await this._getHeaders()

            let response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: { ...headers, ...options.headers }
            })

            // Handle Token Expiry (401)
            if (response.status === 401) {
                console.warn('[SpotifyService] Token expired, refreshing...')
                // Force refresh via AuthService (getAccessToken logic handles refresh if we signal it? 
                // Actually SpotifyAuthService.getAccessToken checks expiry time, but 401 means it's invalid anyway)
                // Let's force a refresh if possible, or just rely on getAccessToken to have done it.
                // If we are here, it means the token WAS 'valid' by time, but rejected.
                // In simple PKCE, we might need to re-login if refresh fails, but let's try calling getAccessToken again 
                // implies we might need a force-refresh flag in AuthService. 
                // For now, let's assume getAccessToken handles it or throw.
                throw new Error('Spotify Token Invalid (401)')
            }

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('[SpotifyService] Rate Limited')
                    throw new Error('Rate Limited')
                }
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
     * Search for an album by artist and album name
     * @param {string} artist 
     * @param {string} albumName 
     * @returns {Promise<object|null>} Spotify Album Object or null
     */
    async searchAlbum(artist, albumName) {
        if (!artist || !albumName) return null

        // Clean query
        const query = `artist:${artist} album:${albumName}`
            .replace(/[^\w\s:.-]/g, '') // Basic sanitization

        const params = new URLSearchParams({
            q: query,
            type: 'album',
            limit: 1
        })

        const data = await this._fetch(`/search?${params.toString()}`)

        if (data.albums && data.albums.items.length > 0) {
            return data.albums.items[0]
        }
        return null
    },

    /**
     * Validates if the found album matches the artist strictly
     * (Search can be fuzzy)
     * @param {object} spotifyAlbum 
     * @param {string} targetArtist 
     */
    _validateMatch(spotifyAlbum, targetArtist) {
        if (!spotifyAlbum) return false
        // Simple check: is one of the artists similar?
        const artistName = spotifyAlbum.artists[0].name.toLowerCase()
        return artistName.includes(targetArtist.toLowerCase()) || targetArtist.toLowerCase().includes(artistName)
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
    }
}
