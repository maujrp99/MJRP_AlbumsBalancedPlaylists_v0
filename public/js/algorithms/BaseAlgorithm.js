/**
 * BaseAlgorithm - Abstract base class for playlist generation algorithms
 * 
 * All algorithms must extend this class and implement the generate() method.
 * This follows the Strategy Pattern for pluggable algorithm selection.
 * 
 * @module algorithms/BaseAlgorithm
 */

/**
 * @typedef {Object} AlgorithmMetadata
 * @property {string} id - Unique algorithm identifier
 * @property {string} name - Display name
 * @property {string} badge - Badge text (e.g., 'RECOMMENDED', 'LEGACY')
 * @property {string} description - User-facing description
 * @property {boolean} isRecommended - Whether this is the default algorithm
 */

/**
 * @typedef {Object} GenerationResult
 * @property {Array} playlists - Generated playlists with tracks
 * @property {Object} rankingSummary - Summary of track rankings
 * @property {Array} rankingSources - Sources used for ranking
 */

export class BaseAlgorithm {
    /**
     * Algorithm metadata - override in subclasses
     * @type {AlgorithmMetadata}
     */
    static metadata = {
        id: 'base',
        name: 'Base Algorithm',
        badge: 'ABSTRACT',
        description: 'Abstract base class - do not use directly',
        isRecommended: false
    }

    /**
     * @param {Object} opts - Algorithm options
     * @param {number} opts.targetSeconds - Target playlist duration in seconds
     */
    constructor(opts = {}) {
        this.targetSeconds = opts.targetSeconds || 45 * 60 // 45 minutes default
        this.rankingSources = new Map()
        this.albumLookup = new Map()
    }

    /**
     * Get algorithm metadata
     * @returns {AlgorithmMetadata}
     */
    static getMetadata() {
        return this.metadata
    }

    /**
     * Generate playlists from albums
     * @abstract
     * @param {Array} albums - Albums with enriched tracks
     * @param {Object} opts - Generation options
     * @returns {GenerationResult}
     */
    generate(albums, opts = {}) {
        throw new Error('BaseAlgorithm.generate() must be implemented by subclass')
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SHARED UTILITY METHODS - Available to all algorithms
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Register a ranking source for traceability
     * @param {Object} source - Source metadata
     * @returns {Object} Normalized source
     */
    registerRankingSource(source) {
        if (!source) return null
        const payload = typeof source === 'string' ? { name: source } : { ...source }
        const name = (payload.name || '').trim()
        if (!name) return null

        const normalized = {
            name,
            type: payload.type || 'external',
            reference: payload.reference || '',
            secure: payload.secure === true,
            description: payload.description || ''
        }

        const key = name.toLowerCase().trim().replace(/[^\w\s]/g, '')
        if (!this.rankingSources.has(key)) {
            this.rankingSources.set(key, normalized)
        }
        return this.rankingSources.get(key)
    }

    /**
     * Mark track with origin album ID
     * @param {Object} track 
     * @param {string} albumId 
     */
    markTrackOrigin(track, albumId) {
        if (track && albumId) {
            track.originAlbumId = albumId
        }
    }

    /**
     * Annotate track with ranking info for traceability
     * @param {Object} track 
     * @param {string} source - Source description
     * @param {Object} metadata 
     * @param {number} score 
     */
    annotateTrack(track, source, metadata = null, score = null) {
        if (!track.rankingInfo) track.rankingInfo = []
        track.rankingInfo.push({
            source,
            metadata,
            score,
            timestamp: new Date().toISOString()
        })
    }

    /**
     * Calculate total duration of tracks
     * @param {Array} tracks 
     * @returns {number} Duration in seconds
     */
    calculateTotalDuration(tracks) {
        return (tracks || []).reduce((sum, track) => sum + (track.duration || 0), 0)
    }

    /**
     * Build ranking summary for all playlists
     * @param {Array} playlists 
     * @returns {Object} Summary by album
     */
    buildRankingSummary(playlists) {
        const summary = {}
        const now = new Date().toISOString()

        for (const playlist of playlists) {
            for (const track of playlist.tracks || []) {
                const albumId = track.originAlbumId
                if (!albumId) continue

                const albumMeta = this.albumLookup.get(albumId)
                if (!summary[albumId]) {
                    summary[albumId] = {
                        albumId,
                        albumTitle: albumMeta?.title || 'Unknown Album',
                        artist: albumMeta?.artist || 'Unknown Artist',
                        tracks: [],
                        sourceNames: [],
                        lastUpdated: now
                    }
                }

                const entry = summary[albumId]
                entry.tracks.push({
                    trackId: track.id,
                    title: track.title,
                    rank: track.rank,
                    playlistId: playlist.id,
                    playlistTitle: playlist.title,
                    duration: track.duration,
                    rankingInfo: (track.rankingInfo || []).map(info => ({ ...info }))
                })

                // Collect source names
                const trackSources = new Set(
                    (track.rankingInfo || []).map(info => info.source).filter(Boolean)
                )
                trackSources.forEach(sourceName => {
                    if (!entry.sourceNames.includes(sourceName)) {
                        entry.sourceNames.push(sourceName)
                    }
                })
            }
        }

        return summary
    }

    /**
     * Get all registered ranking sources
     * @returns {Array}
     */
    getRankingSources() {
        return Array.from(this.rankingSources.values())
    }
}

export default BaseAlgorithm
