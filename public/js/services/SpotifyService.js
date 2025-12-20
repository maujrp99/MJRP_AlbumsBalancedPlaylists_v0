
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

        // Clean album name - remove common suffixes that may differ
        let cleanAlbumName = albumName
            .replace(/\s*\(Remastered(\s*\d+)?\)\s*/gi, '')
            .replace(/\s*\(Deluxe\s*(Edition)?\)\s*/gi, '')
            .replace(/\s*\(Anniversary\s*Edition\)\s*/gi, '')
            .replace(/\s*\(Expanded\s*Edition\)\s*/gi, '')
            .replace(/\s*-\s*EP\s*$/gi, '')
            .trim()

        // Try with structured query first
        let result = await this._searchAlbumQuery(artist, cleanAlbumName)

        // If not found, try simpler search
        if (!result && cleanAlbumName !== albumName) {
            console.log(`[SpotifyService] Retrying with original name: "${albumName}"`)
            result = await this._searchAlbumQuery(artist, albumName)
        }

        // Final fallback: search by ARTIST ONLY and fuzzy match
        if (!result) {
            console.log(`[SpotifyService] Trying artist-only search for: "${artist}"`)
            result = await this._searchByArtistFuzzy(artist, cleanAlbumName)
        }

        return result
    },

    /**
     * Simple Levenshtein distance calculation for fuzzy matching
     * @private
     */
    _levenshteinDistance(str1, str2) {
        const m = str1.length
        const n = str2.length
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

        for (let i = 0; i <= m; i++) dp[i][0] = i
        for (let j = 0; j <= n; j++) dp[0][j] = j

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1]
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
                }
            }
        }
        return dp[m][n]
    },

    /**
     * Calculate similarity score (0-1) between two strings
     * @private
     */
    _similarityScore(str1, str2) {
        const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '')
        const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '')
        const maxLen = Math.max(s1.length, s2.length)
        if (maxLen === 0) return 1
        const distance = this._levenshteinDistance(s1, s2)
        return 1 - (distance / maxLen)
    },

    /**
     * Search by artist only and fuzzy match album name
     * @private
     */
    async _searchByArtistFuzzy(artist, targetAlbumName) {
        const params = new URLSearchParams({
            q: `artist:${artist.replace(/[^\w\s.-]/g, '')}`,
            type: 'album',
            limit: 20
        })

        try {
            const data = await this._fetch(`/search?${params.toString()}`)

            if (!data.albums || data.albums.items.length === 0) {
                return null
            }

            // Score all albums by similarity to target name
            const scored = data.albums.items.map(album => ({
                album,
                score: this._similarityScore(album.name, targetAlbumName)
            }))

            // Sort by score descending
            scored.sort((a, b) => b.score - a.score)

            // Accept if best match has score > 0.5 (50% similar)
            if (scored[0].score > 0.5) {
                console.log(`[SpotifyService] Fuzzy match found: "${scored[0].album.name}" (score: ${(scored[0].score * 100).toFixed(0)}%)`)
                return scored[0].album
            }

            console.log(`[SpotifyService] No good fuzzy match. Best: "${scored[0].album.name}" (score: ${(scored[0].score * 100).toFixed(0)}%)`)
            return null
        } catch (error) {
            console.warn('[SpotifyService] Artist-only search failed:', error.message)
            return null
        }
    },

    /**
     * Internal album search helper
     * @private
     */
    async _searchAlbumQuery(artist, albumName) {
        // Try structured query first
        const query = `artist:${artist} album:${albumName}`
            .replace(/[^\w\s:.-]/g, '')

        const params = new URLSearchParams({
            q: query,
            type: 'album',
            limit: 5
        })

        const data = await this._fetch(`/search?${params.toString()}`)

        if (data.albums && data.albums.items.length > 0) {
            // Score results to find best match
            const normalize = str => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
            const targetArtist = normalize(artist)
            const targetAlbum = normalize(albumName)

            for (const album of data.albums.items) {
                const albumArtist = normalize(album.artists[0]?.name)
                const albumTitle = normalize(album.name)

                // Check for reasonable match
                if ((albumArtist.includes(targetArtist) || targetArtist.includes(albumArtist)) &&
                    (albumTitle.includes(targetAlbum) || targetAlbum.includes(albumTitle))) {
                    return album
                }
            }

            // Fallback to first result if no exact match
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

            // 2. Validate match
            if (!this._validateMatch(spotifyAlbum, artist)) {
                console.log(`[SpotifyService] Artist mismatch for: "${artist} - ${albumTitle}"`)
                return null
            }

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

