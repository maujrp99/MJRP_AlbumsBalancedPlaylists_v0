
import { SpotifyAuthService } from './SpotifyAuthService.js'
import { pickAlbum, spotifyCandidate, titleWithoutEditionNotes } from '../models/askedAlbum.js'

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
     * @returns {Promise<object|null>} Spotify Album Object or null
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
        return await this._fetch('/me')
    },

    /**
     * Search for a track by name and artist
     * @param {string} trackName 
     * @param {string} artistName 
     * @param {string} albumName - Optional album name for better matching
     * @returns {Promise<object|null>} Spotify track object or null
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

        try {
            const data = await this._fetch(`/search?${params.toString()}`)

            if (data.tracks && data.tracks.items.length > 0) {
                // Try to find exact artist match first
                const normalizeStr = str => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
                const targetArtist = normalizeStr(artistName)
                const targetTrack = normalizeStr(trackName)

                for (const track of data.tracks.items) {
                    const trackArtist = normalizeStr(track.artists[0]?.name)
                    const trackTitle = normalizeStr(track.name)

                    // Check for reasonable match
                    if (trackTitle.includes(targetTrack) || targetTrack.includes(trackTitle)) {
                        if (trackArtist.includes(targetArtist) || targetArtist.includes(trackArtist)) {
                            return track
                        }
                    }
                }

                // Fallback to first result if no exact match
                return data.tracks.items[0]
            }
            return null
        } catch (error) {
            console.warn('[SpotifyService] Track search failed:', trackName, error.message)
            return null
        }
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

        const response = await this._fetch(`/users/${user.id}/playlists`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                description: description || 'Created by MJRP Album Blender',
                public: false
            })
        })

        return response
    },

    /**
     * Create multiple playlists for a series (e.g. "Series - S Tier", "Series - A Tier")
     * @param {Array<{name: string, tracks: Array<{spotifyUri: string}>}>} playlistsData 
     * @param {string} seriesNamePrefix 
     * @param {Function} onProgress (current, total, message) => void
     */
    async createSeriesPlaylists(playlistsData, seriesNamePrefix, onProgress) {
        const totalPlaylists = playlistsData.length
        let createdCount = 0

        for (const playlistData of playlistsData) {
            const playlistName = `${seriesNamePrefix} - ${playlistData.name}`
            createdCount++

            if (onProgress) {
                onProgress(createdCount, totalPlaylists, `Creating "${playlistName}"...`)
            }

            // 1. Create Playlist
            const playlist = await this.createPlaylist(playlistName, `Part of ${seriesNamePrefix} series`)

            // 2. Add Tracks
            const uris = playlistData.tracks.map(t => t.spotifyUri).filter(Boolean)
            if (uris.length > 0) {
                if (onProgress) {
                    onProgress(createdCount, totalPlaylists, `Adding ${uris.length} tracks to "${playlistName}"...`)
                }
                await this.addTracksToPlaylist(playlist.id, uris)
            }
        }
    },

    /**
     * Add tracks to a playlist
     * @param {string} playlistId 
     * @param {Array<string>} trackUris - Array of Spotify track URIs
     * @returns {Promise<object>} Snapshot response
     */
    async addTracksToPlaylist(playlistId, trackUris) {
        if (!trackUris || trackUris.length === 0) return null

        // Spotify allows max 100 tracks per request
        const chunks = []
        for (let i = 0; i < trackUris.length; i += 100) {
            chunks.push(trackUris.slice(i, i + 100))
        }

        let lastSnapshot = null
        for (const chunk of chunks) {
            lastSnapshot = await this._fetch(`/playlists/${playlistId}/tracks`, {
                method: 'POST',
                body: JSON.stringify({ uris: chunk })
            })
            // Small delay between chunks
            if (chunks.length > 1) {
                await new Promise(r => setTimeout(r, 300))
            }
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

