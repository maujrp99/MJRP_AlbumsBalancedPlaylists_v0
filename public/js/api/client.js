import axios from 'axios'
import { Album } from '../models/Album.js'
import { albumCache } from '../cache/albumCache.js'
import { albumLoader } from '../services/AlbumLoader.js'
import { musicKitService } from '../services/MusicKitService.js'

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
        this.cache = albumCache // Initialize this.cache with albumCache
    }

    /**
     * Fetch album data (with caching)
     * @param {string} query - Album query (Artist - Album)
     * @param {boolean} skipCache - Force fresh fetch
     * @returns {Promise<Album>} Album data
     */
    async fetchAlbum(query, skipCache = false) {
        // 1. Check cache (if not skipped)
        if (!skipCache) {
            const cached = this.cache.get(query)
            if (cached) {
                console.log('[APIClient] Returning cached album:', query)
                // HYDRATION: Convert cached JSON back to Album instance
                return cached instanceof Album ? cached : new Album(cached)
            }
        }

        // 2. Sprint 7.5: Try Apple Music + Enrichment First
        try {
            console.log('[APIClient] Searching Apple Music:', query)
            // Extract Artist/Album from query for better search
            const artist = this.extractArtist(query)
            const albumName = this.extractAlbum(query)

            // Search (limit 5 to allow scoring/filtering for best edition)
            const appleAlbums = await musicKitService.searchAlbums(artist, albumName, 5)

            if (appleAlbums && appleAlbums.length > 0) {
                // First result is already scored/sorted by searchAlbums (standard editions prioritized)
                const selected = appleAlbums[0]
                const appleId = selected.id
                console.log(`[APIClient] Selected from ${appleAlbums.length} results: "${selected.attributes?.name}" (${appleId})`)
                if (appleAlbums.length > 1) {
                    console.log(`[APIClient] Other options: ${appleAlbums.slice(1, 3).map(a => a.attributes?.name).join(', ')}`)
                }

                // Get Full Details (Tracks)
                const fullAlbum = await musicKitService.getAlbumDetails(appleId)

                if (fullAlbum) {
                    // 3. Enrich with Rankings (Backend)
                    console.log('[APIClient] Enriching album with BestEver data...')
                    const enrichResp = await axios.post(`${this.baseUrl}/enrich-album`, {
                        albumData: {
                            title: fullAlbum.title,
                            artist: fullAlbum.artist,
                            tracks: fullAlbum.tracks
                        }
                    })

                    const enrichment = enrichResp.data?.data || {}
                    const ratingsMap = new Map()
                    if (enrichment.trackRatings) {
                        enrichment.trackRatings.forEach(r => {
                            // Normalize key on client too just to be safe, or direct match
                            if (r.rating !== null) ratingsMap.set(r.title, r.rating)
                        })
                    }

                    // 4. Construct Album Model Data
                    const stableId = this.generateAlbumId({ title: fullAlbum.title, artist: fullAlbum.artist })

                    // Helper to map Apple Track to internal format
                    const mapTrack = (t) => ({
                        id: t.id || `track_${stableId}_${t.trackNumber}`,
                        title: t.title,
                        artist: t.artist || fullAlbum.artist,
                        album: fullAlbum.title,
                        duration: t.duration,
                        trackNumber: t.trackNumber,
                        isrc: t.isrc,
                        previewUrl: t.previewUrl,
                        rating: ratingsMap.get(t.title) || null,
                        rank: null // Calculated below
                    })

                    // Create objects once to ensure reference identity between lists
                    const allTracks = fullAlbum.tracks.map(mapTrack)

                    const tracksOriginalOrder = [...allTracks].sort((a, b) => a.trackNumber - b.trackNumber)

                    // Calculate Acclaim Order (Sorted by Rating Desc)
                    let tracksByAcclaim = [...allTracks]

                    const hasRatings = tracksByAcclaim.some(t => t.rating !== null)
                    if (hasRatings) {
                        tracksByAcclaim.sort((a, b) => {
                            const rA = a.rating !== null ? a.rating : -1
                            const rB = b.rating !== null ? b.rating : -1
                            if (rA !== rB) return rB - rA
                            return a.trackNumber - b.trackNumber
                        })
                    }
                    // Assign Rank (1..N)
                    tracksByAcclaim.forEach((t, idx) => t.rank = idx + 1)

                    const albumData = {
                        id: stableId,
                        title: fullAlbum.title,
                        artist: fullAlbum.artist,
                        year: fullAlbum.year,
                        coverUrl: musicKitService.getArtworkUrl(fullAlbum.artworkTemplate, 600),
                        tracks: tracksByAcclaim, // Ranked List
                        tracksOriginalOrder: tracksOriginalOrder, // Disk List
                        bestEverUrl: enrichment.bestEverInfo?.url,
                        bestEverAlbumId: enrichment.bestEverInfo?.albumId,
                        metadata: { source: 'Apple Music', sourceId: fullAlbum.id }
                    }

                    const album = new Album(albumData)

                    // Sprint 12: Use modular SpotifyEnrichmentHelper
                    // This checks cache first, then fetches fresh if needed
                    try {
                        const { applyEnrichmentToAlbum } = await import('../helpers/SpotifyEnrichmentHelper.js')
                        await applyEnrichmentToAlbum(album, { fetchIfMissing: true })
                    } catch (spotifyError) {
                        console.warn('[APIClient] Spotify enrichment skipped:', spotifyError.message)
                    }

                    this.cache.set(query, album)
                    return album
                }
            }
        } catch (e) {
            console.warn('[APIClient] Apple Music fetch failed/skipped, falling back to Legacy:', e)
        }

        // 5. Fallback: Legacy Generate API
        return this._fetchAlbumFromAPI(query)
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
     * @param {AbortSignal} signal - Abort signal to cancel operation
     * @returns {Promise<Object>} { results, errors }
     */
    async fetchMultipleAlbums(queries, onProgress = null, skipCache = false, signal = null) {
        const results = []
        const errors = []

        for (let i = 0; i < queries.length; i++) {
            // Check cancellation
            if (signal && signal.aborted) {
                console.log('[APIClient] fetchMultipleAlbums aborted')
                break
            }

            const query = queries[i]

            try {
                const album = await this.fetchAlbum(query, skipCache)

                // Check cancellation again after await
                if (signal && signal.aborted) {
                    console.log('[APIClient] fetchMultipleAlbums aborted after fetch')
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
            const response = await fetch(`${this.baseUrl}/playlists`, {
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
        console.log('[APIClient] normalizeAlbumData - Raw data:', {
            hasTracks: !!data.tracks,
            hasTracksByAcclaim: !!data.tracksByAcclaim,
            tracksCount: data.tracks?.length,
            tracksByAcclaimCount: data.tracksByAcclaim?.length
        })

        const originalTracks = data.tracks || []
        const rankedTracks = data.tracksByAcclaim || data.rankingConsolidated || []

        // DEBUG: Inspect track lists before processing
        console.log('[APIClient] normalizeAlbumData - Track Lists:', {
            originalFirst: originalTracks[0]?.title,
            originalLength: originalTracks.length,
            rankedFirst: rankedTracks[0]?.title,
            rankedLength: rankedTracks.length
        })

        // Helper to prepare track data for Model
        // Handles backend-specific field mapping
        const prepareTrackData = (track, idx, isRanked) => ({
            ...track,
            // Map backend fields to Model expected fields
            rank: track.rank || track.acclaimRank || track.finalPosition || (isRanked ? idx + 1 : null),
            position: track.position || track.trackNumber || (!isRanked ? idx + 1 : null),
            normalizedScore: track.normalizedScore || track.acclaimScore || 0,
            // Artist/Album will be filled by Album Model context
        })

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
        console.log('[APIClient] normalizeAlbumData - Normalized Album:', {
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
            console.log('[APIClient] AlbumLoader not ready, skipping cover lookup')
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
            console.log(`[APIClient] Cover found for "${artist} - ${album}"`)
            return match.coverUrl
        }

        console.log(`[APIClient] No cover found for "${artist} - ${album}"`)
        return null
    }
}

// Singleton instance
export const apiClient = new APIClient()
