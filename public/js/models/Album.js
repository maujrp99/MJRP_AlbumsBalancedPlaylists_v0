import { Track } from './Track.js'

/**
 * Album Domain Model
 * Aggregates tracks and manages different orderings (Original vs Ranked).
 */
export class Album {
    /**
     * Create an Album instance
     * @param {Object} data - Raw album data
     */
    constructor(data = {}) {
        this.id = data.id
        this.title = (data.title || 'Unknown Album').trim()
        this.artist = (data.artist || 'Unknown Artist').trim()
        this.year = data.year
        this.coverUrl = data.coverUrl

        // Context for tracks (to prevent missing artist/album fields)
        const context = { artist: this.artist, title: this.title }

        // Ranked Tracks (tracksByAcclaim or tracks fallback)
        // These are typically sorted by rank/rating
        const rankedData = data.tracksByAcclaim || data.tracks || []
        this.tracks = rankedData.map(t => new Track(t, context))

        // Original Order Tracks (tracksOriginalOrder or tracks fallback)
        // These MUST be in the original disc order (1..N)
        const originalData = data.tracksOriginalOrder || data.tracks || []
        this.tracksOriginalOrder = originalData.map(t => new Track(t, context))

        // Metadata
        this.bestEverAlbumId = data.bestEverAlbumId
        this.bestEverUrl = data.bestEverUrl
        this.acclaim = data.acclaim || {}

        // Spotify Data
        this.spotifyId = data.spotifyId || null
        this.spotifyUrl = data.spotifyUrl || null
        this.spotifyImages = data.spotifyImages || []
        this.spotifyPopularity = data.spotifyPopularity !== undefined ? Number(data.spotifyPopularity) : null

        // Preserve other properties
        this.metadata = data.metadata || {}
    }

    /**
     * Get tracks in specified order
     * @param {string} order - 'original' or 'acclaim'
     * @returns {Track[]} Array of Track objects
     */
    getTracks(order = 'original') {
        if (order === 'acclaim') return this.tracks
        return this.tracksOriginalOrder
    }
}
