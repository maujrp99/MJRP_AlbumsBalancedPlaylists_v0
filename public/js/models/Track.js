/**
 * Track Domain Model
 * 
 * Sprint 12.5: Canonical Track Schema
 * Atomic unit of music data. Guarantees context (Artist/Album) is never missing.
 * 
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
 */
export class Track {
    /**
     * Create a Track instance
     * @param {Object} data - Raw track data
     * @param {Object} albumContext - Parent album context (optional)
     */
    constructor(data = {}, albumContext = {}) {
        // Identity
        this.id = data.id || crypto.randomUUID()
        this.title = (data.title || data.name || 'Unknown Track').trim()
        this.artist = (data.artist || albumContext.artist || 'Unknown Artist').trim()
        this.album = (data.album || albumContext.title || 'Unknown Album').trim()

        // Audio
        this.duration = Number(data.duration) || 0

        // Acclaim (BEA / Hybrid Curation)
        this.acclaimRank = data.acclaimRank ?? data.rank ?? null
        this.acclaimScore = data.acclaimScore ?? data.normalizedScore ?? null
        this.rating = (data.rating !== undefined && data.rating !== null) ? Number(data.rating) : null
        this.rank = this.acclaimRank  // Alias for backwards compatibility

        // Spotify
        this.spotifyRank = data.spotifyRank ?? null
        this.spotifyPopularity = data.spotifyPopularity ?? data.popularity ?? null
        this.spotifyId = data.spotifyId ?? data.metadata?.spotifyId ?? null
        this.spotifyUri = data.spotifyUri ?? null

        // Apple Music Kit
        this.appleMusicId = data.appleMusicId ?? null
        this.isrc = data.isrc ?? data.metadata?.isrc ?? null
        this.previewUrl = data.previewUrl ?? null

        // Original Order
        this.position = (data.position !== undefined && data.position !== null) ? Number(data.position) : null
        this.originAlbumId = data.originAlbumId ?? albumContext.albumId ?? null

        // Metadata preservation
        this.metadata = { ...data.metadata }

        // Preserve any other properties (like rankingInfo, _rank)
        Object.assign(this, data)

        // Ensure core properties are not overwritten
        this.title = (data.title || data.name || 'Unknown Track').trim()
        this.artist = (data.artist || albumContext.artist || 'Unknown Artist').trim()
        this.album = (data.album || albumContext.title || 'Unknown Album').trim()
    }
}
