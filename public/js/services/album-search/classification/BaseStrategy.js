/**
 * BaseStrategy - Abstract interface for classification strategies
 * 
 * Part of ARCH-18: Album Classification Modularization
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md
 */

export class BaseStrategy {
    /** Strategy name for logging */
    name = 'BaseStrategy';

    /**
     * Attempt to classify the album
     * @param {Object} album - Album data with raw.attributes
     * @param {Object} context - Context with aiList, genres, trackCount, etc.
     * @returns {string|null} - Classification type or null to pass to next strategy
     */
    execute(album, context) {
        throw new Error(`${this.name}: Subclass must implement execute()`);
    }

    /**
     * Log classification decision
     * @param {string} title - Album title
     * @param {string} type - Classification type
     * @param {string} reason - Reason for classification
     */
    log(title, type, reason) {
        // console.log(`[Classify] "${title}" → ${type} (${this.name}: ${reason})`);
    }
}
