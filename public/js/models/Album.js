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

        // DEBUG: Trace Spotify Data Load
        if (data.spotifyId || data.spotifyPopularity) {
            // console.log(`[Album Model] Loaded Spotify Data for ${this.title}:`, {
            //     id: this.spotifyId,
            //     pop: this.spotifyPopularity,
            //     source: data.rankingSource
            // })
        }
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

    /**
     * Inject user rankings into both track lists
     * @param {Object[]} rankings - Array of { trackTitle, userRank }
     */
    setUserRankings(rankData) {
        if (!rankData) return

        // Robustness: Handle both full record object and raw array (Sprint 20 Fix)
        const rankings = Array.isArray(rankData) ? rankData : (rankData.rankings || [])

        if (!Array.isArray(rankings)) {
            console.error('[Album] setUserRankings: rankings is not an array', rankData)
            return
        }

        this.hasUserRanking = true
        this.userRanking = rankings // Always store the array for strategies to use
        const rankMap = new Map(rankings.map(r => [r.trackTitle.toLowerCase().trim(), r.userRank]))

        const updateList = (list) => {
            list.forEach(t => {
                const key = t.title.toLowerCase().trim()
                if (rankMap.has(key)) {
                    t.userRank = rankMap.get(key)
                }
            })
        }

        updateList(this.tracks)
        updateList(this.tracksOriginalOrder)
    }

    /**
     * Ensures all tracks have valid ranking data.
     * Fallback Strategy:
     * 1. If no external rank, use 'position' (Original Order) as 'rank'.
     * 2. If 'rank' is present, respect it.
     * @returns {boolean} True if data was modified (needs save), False otherwise.
     */
    ensureRankingIntegrity() {
        let modified = false

        // Check availability of ranking Source
        const hasExternalRanking = !!this.bestEverAlbumId || !!this.spotifyId || this.rankingSource === 'popularity'

        // If 'tracks' (ranked list) is empty or same as original and no external source,
        // force metadata alignment
        if (!hasExternalRanking) {
            this.rankingSource = 'original'
            modified = true
        }

        // Ensure every track in the "Ranked" list has a numeric rank
        this.tracks.forEach((track, index) => {
            // If rank is missing or invalid, fallback to 1-based index (assuming array is somewhat ordered)
            // OR fallback to original position if available
            if (!track.rank || track.rank >= 999) {
                // Heuristic: If we are in 'acclaim' order but have no rank, 
                // we default to current array index + 1 OR original position
                const fallbackRank = track.position || (index + 1)

                if (track.rank !== fallbackRank) {
                    track.rank = fallbackRank
                    modified = true
                }
            }
        })

        return modified
    }
}
