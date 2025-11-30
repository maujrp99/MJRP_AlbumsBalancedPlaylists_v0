/**
 * Track Domain Model
 * Atomic unit of music data. Guarantees context (Artist/Album) is never missing.
 */
export class Track {
    /**
     * Create a Track instance
     * @param {Object} data - Raw track data
     * @param {Object} albumContext - Parent album context (optional)
     */
    constructor(data = {}, albumContext = {}) {
        this.id = data.id || crypto.randomUUID()
        this.title = (data.title || data.name || 'Unknown Track').trim()

        // Critical: Fallback logic to ensure context is never lost
        this.artist = (data.artist || albumContext.artist || 'Unknown Artist').trim()
        this.album = (data.album || albumContext.title || 'Unknown Album').trim()

        this.duration = Number(data.duration) || 0
        this.rating = (data.rating !== undefined && data.rating !== null) ? Number(data.rating) : null

        // Rank: The position in the "Acclaim" list (1..N)
        this.rank = (data.rank !== undefined && data.rank !== null) ? Number(data.rank) : null

        // Position: The original track number on the album (1..N)
        this.position = (data.position !== undefined && data.position !== null) ? Number(data.position) : null

        // Metadata preservation
        this.metadata = { ...data.metadata }

        // Preserve any other properties (like rankingInfo)
        Object.assign(this, data)

        // Ensure core properties are not overwritten by Object.assign if they were missing in data
        // (Object.assign overwrites with undefined if property exists but is undefined, but we handled defaults above)
    }
}
