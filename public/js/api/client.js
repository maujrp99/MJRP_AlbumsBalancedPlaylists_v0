import { albumCache } from '../cache/albumCache.js'

/**
 * API Client
 * Wrapper for backend API calls with retry logic and caching
 */

const API_BASE = window.__api_base || '/api'

export class APIClient {
    constructor() {
        this.baseUrl = API_BASE
        this.defaultRetries = 2
        this.retryDelay = 1000
    }

    /**
     * Fetch album data from backend (with caching)
     * @param {string} query - Album query (Artist - Album or just Album)
     * @param {boolean} skipCache - Skip cache and force fetch
     * @returns {Promise<Object>} Album data with tracks and acclaim
     */
    async fetchAlbum(query, skipCache = false) {
        // Check cache first (unless skipCache)
        if (!skipCache) {
            const cached = albumCache.get(query)
            if (cached) {
                return { ...cached, _cached: true }
            }
        }

        // Fetch from API
        const album = await this._fetchAlbumFromAPI(query, this.defaultRetries)

        // Cache result
        albumCache.set(query, album)

        return { ...album, _cached: false }
    }

    /**
     * Fetch album from API with retry logic
     * @private
     */
    async _fetchAlbumFromAPI(query, retries = this.defaultRetries) {
        try {
            const response = await fetch(`${this.baseUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ albumQuery: query })
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()

            // Normalize response
            return this.normalizeAlbumData(data.data || data)
        } catch (error) {
            if (retries > 0) {
                console.warn(`Retrying fetch for "${query}" (${retries} attempts left)`)
                await this.delay(this.retryDelay)
                return this._fetchAlbumFromAPI(query, retries - 1)
            }
            throw error
        }
    }

    /**
     * Fetch multiple albums with progress callback
     * @param {Array<string>} queries - Album queries
     * @param {Function} onProgress - Progress callback (current, total, result)
     * @param {boolean} skipCache - Skip cache for all albums
     * @returns {Promise<Object>} { results, errors }
     */
    async fetchMultipleAlbums(queries, onProgress = null, skipCache = false) {
        const results = []
        const errors = []

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i]

            try {
                const album = await this.fetchAlbum(query, skipCache)
                const result = { query, album, status: 'success' }
                results.push(result)

                if (onProgress) {
                    onProgress(i + 1, queries.length, result)
                }
            } catch (error) {
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
     * Extract artist from query string
     * @param {string} query - Album query
     * @returns {string} Artist name
     * @private
     */
    extractArtist(query) {
        if (query.includes(' - ')) {
            return query.split(' - ')[0].trim()
        }
        return ''
    }

    /**
     * Extract album from query string
     * @param {string} query - Album query
     * @returns {string} Album name
     * @private
     */
    extractAlbum(query) {
        if (query.includes(' - ')) {
            return query.split(' - ')[1].trim()
        }
        return query.trim()
    }

    /**
     * Normalize album data from API
     * @param {Object} data - Raw API response
     * @returns {Object} Normalized album
     * @private
     */
    normalizeAlbumData(data) {
        // Generate stable ID
        const id = this.generateAlbumId(data)

        return {
            id,
            title: data.title || data.album || '',
            artist: data.artist || '',
            year: data.year || null,
            tracks: (data.tracksByAcclaim || data.rankingConsolidated || data.tracks || []).map(track => ({
                ...track,
                title: track.title || track.name || '',
                rank: track.rank || track.acclaimRank || track.finalPosition || 0,
                rating: track.rating || null,
                normalizedScore: track.normalizedScore || track.acclaimScore || 0,
                duration: track.duration || null,
                metadata: track.metadata || {
                    isrc: null,
                    appleMusicId: null,
                    spotifyId: null
                }
            })),
            acclaim: {
                hasRatings: data.rankingConsolidatedMeta?.hasRatings || false,
                source: data.rankingConsolidatedMeta?.source || 'unknown',
                trackCount: data.rankingConsolidatedMeta?.tracksCount || 0
            },
            metadata: {
                fetchedAt: new Date().toISOString(),
                ...data.metadata
            }
        }
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
}

// Singleton instance
export const apiClient = new APIClient()
