/**
 * RankingStrategy
 * Abstract base class for defining track ranking logic.
 * 
 * Part of the Strategy Pattern for "Source of Truth" selection.
 * Decouples sorting criteria (How to rank) from distribution algorithms.
 * 
 * @module ranking/RankingStrategy
 */
export class RankingStrategy {
    static metadata = {
        id: 'abstract',
        name: 'Abstract Strategy',
        description: 'Base class'
    }

    constructor(options = {}) {
        this.options = options
    }

    /**
     * Get strategy metadata
     */
    static getMetadata() {
        return this.metadata
    }

    /**
     * Rank tracks from an album based on specific criteria
     * @param {Object} album - The album object containing tracks and metadata
     * @returns {Array} List of tracks with normalized `_rank` property (1-based)
     */
    rank(album) {
        throw new Error('RankingStrategy.rank() must be implemented by subclass')
    }

    /**
     * Helper: Sort tracks by primary key
     * @protected
     */
    sortTracks(tracks, scoreFn) {
        return [...tracks].sort((a, b) => scoreFn(b) - scoreFn(a))
    }
}
