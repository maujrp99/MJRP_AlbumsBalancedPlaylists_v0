/**
 * TrackTransformer
 * 
 * Single Source of Truth for Track Normalization
 * 
 * Sprint 12.5: Data Schema Canonical Refactor
 * Converts any raw track data to CanonicalTrack format.
 * 
 * Used by:
 * - client.js (initial album loading)
 * - SpotifyEnrichmentHelper (Spotify data merge)
 * - BalancedRankingStrategy (track enrichment)
 * - TrackEnrichmentMixin (algorithm enrichment)
 * - PlaylistGenerationService (output transformation)
 */

/**
 * @typedef {Object} CanonicalTrack
 * @property {string} id - Unique identifier
 * @property {string} title - Track title
 * @property {string} artist - Artist name (from album context)
 * @property {string} album - Album title (from album context)
 * @property {number} duration - Duration in seconds
 * 
 * @property {number|null} acclaimRank - Position by BEA/Acclaim (1-N)
 * @property {number|null} acclaimScore - Normalized score 0-100
 * @property {number|null} rating - Star rating (alias for display)
 * @property {Object} ranking - Consolidated ranking evidence { evidence: [] }
 * 
 * @property {number|null} spotifyRank - Position by Spotify popularity (1-N)
 * @property {number|null} spotifyPopularity - Spotify popularity 0-100
 * @property {string|null} spotifyId - Spotify track ID
 * @property {string|null} spotifyUri - spotify:track:...
 * 
 * @property {string|null} appleMusicId - Apple Music track ID
 * @property {string|null} isrc - ISRC for cross-platform matching
 * @property {string|null} previewUrl - Audio preview URL
 * 
 * @property {number|null} position - Original disc track number (1..N)
 * @property {string|null} originAlbumId - Parent album ID
 * 
 * @property {Object} metadata - Preserved metadata object
 */

export class TrackTransformer {

    /**
     * Convert raw track to canonical format.
     * Handles data from any source: Apple Music, Backend, Cache, Firestore.
     * 
     * @param {Object} raw - Raw track from any source
     * @param {Object} context - Album context { artist, album, albumId }
     * @returns {CanonicalTrack}
     */
    static toCanonical(raw, context = {}) {
        if (!raw) return null

        return {
            // Identity
            id: raw.id || raw.trackId || crypto.randomUUID(),
            title: (raw.title || raw.name || raw.trackTitle || 'Unknown').trim(),
            artist: raw.artist || context.artist || 'Unknown Artist',
            album: raw.album || context.album || context.title || 'Unknown Album',

            // Audio
            duration: Number(raw.duration) || 0,

            // Acclaim (BEA / Hybrid Curation)
            acclaimRank: raw.acclaimRank ?? raw.rank ?? raw.finalPosition ?? null,
            acclaimScore: raw.acclaimScore ?? raw.normalizedScore ?? null,
            rating: raw.rating ?? null,

            // Sprint 23: Consolidated Ranking Schema (Evidence)
            ranking: {
                evidence: Array.isArray(raw.evidence) ? raw.evidence : (raw.ranking?.evidence || [])
            },

            // Spotify
            spotifyRank: raw.spotifyRank ?? null,
            spotifyPopularity: raw.spotifyPopularity ?? raw.popularity ?? null,
            spotifyId: raw.spotifyId ?? raw.metadata?.spotifyId ?? null,
            spotifyUri: raw.spotifyUri ?? null,

            // Apple Music Kit
            appleMusicId: raw.appleMusicId ?? raw.id ?? null,
            isrc: raw.isrc ?? raw.metadata?.isrc ?? null,
            previewUrl: raw.previewUrl ?? null,

            // Original Order
            position: raw.position ?? raw.trackNumber ?? null,
            originAlbumId: raw.originAlbumId ?? context.albumId ?? null,

            // Preserve metadata
            metadata: { ...raw.metadata }
        }
    }

    /**
     * Merge Spotify enrichment data into existing track.
     * Preserves existing track properties, only updates Spotify fields.
     * 
     * @param {Object} track - Existing track object
     * @param {Object} spotifyData - Spotify enrichment data
     * @returns {Object} Track with Spotify data merged
     */
    static mergeSpotifyData(track, spotifyData) {
        if (!track || !spotifyData) return track

        return {
            ...track,
            spotifyRank: spotifyData.spotifyRank ?? track.spotifyRank,
            spotifyPopularity: spotifyData.spotifyPopularity ?? spotifyData.popularity ?? track.spotifyPopularity,
            spotifyId: spotifyData.spotifyId ?? track.spotifyId,
            spotifyUri: spotifyData.spotifyUri ?? track.spotifyUri
        }
    }

    /**
     * Calculate spotifyRank for a list of tracks based on spotifyPopularity.
     * Mutates tracks in place and also returns the array.
     * 
     * @param {Array} tracks - Array of tracks with spotifyPopularity
     * @returns {Array} Same array with spotifyRank assigned
     */
    static calculateSpotifyRanks(tracks) {
        if (!tracks || !Array.isArray(tracks)) return tracks

        // Get tracks that have Spotify popularity data
        const withPopularity = tracks.filter(t => t.spotifyPopularity != null)

        // Sort by popularity (highest first)
        const sorted = [...withPopularity].sort((a, b) =>
            (b.spotifyPopularity || 0) - (a.spotifyPopularity || 0)
        )

        // Create a map of title -> rank for unique tracks
        const rankMap = new Map()
        sorted.forEach((track, idx) => {
            const key = track.title?.toLowerCase().trim()
            if (key && !rankMap.has(key)) {
                rankMap.set(key, idx + 1)
            }
        })

        // Apply ranks to ALL tracks with matching titles
        tracks.forEach(track => {
            const key = track.title?.toLowerCase().trim()
            if (key && rankMap.has(key)) {
                track.spotifyRank = rankMap.get(key)
            }
        })

        return tracks
    }

    /**
     * Validate that a track has essential identity fields.
     * 
     * @param {Object} track - Track to validate
     * @returns {boolean} True if valid
     */
    static isValid(track) {
        return track &&
            typeof track.title === 'string' &&
            track.title.trim().length > 0
    }

    /**
     * Create a minimal track for testing or placeholders.
     * 
     * @param {string} title - Track title
     * @param {Object} overrides - Additional fields to set
     * @returns {CanonicalTrack}
     */
    static create(title, overrides = {}) {
        return TrackTransformer.toCanonical({ title, ...overrides }, {})
    }
}

export default TrackTransformer
