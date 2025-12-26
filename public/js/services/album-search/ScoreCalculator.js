/**
 * ScoreCalculator
 * Calculates match confidence for search results.
 * Uses Levenshtein distance and contextual penalties.
 */
import { escapeHtml } from '../../utils/stringUtils.js';

export class ScoreCalculator {
    constructor() {
        this.weights = {
            exactMatch: 1.0,
            fuzzyThreshold: 0.6,
            penalties: {
                deluxe: 0.15,
                live: 0.4, // Live albums heavily penalized unless requested
                compilation: 0.3,
                single: 0.5
            }
        };
    }

    /**
     * Calculate confidence score (0-1) for an album against a query
     * @param {Object} album - Apple Music Album object
     * @param {string} queryArtist - Target artist
     * @param {string} queryTitle - Target album title
     * @param {Object} options - Search options
     * @returns {number} Confidence score
     */
    calculate(album, queryArtist, queryTitle, options = {}) {
        const albumTitle = (album.attributes?.name || '').toLowerCase();
        const albumArtist = (album.attributes?.artistName || '').toLowerCase();
        const targetTitle = queryTitle.toLowerCase();
        const targetArtist = queryArtist.toLowerCase();

        // 1. Text Similarity (Base Score)
        const titleSim = this._similarity(targetTitle, albumTitle);
        const artistSim = this._similarity(targetArtist, albumArtist);

        // Weighted average: Title is more important (60%), Artist (40%)
        let score = (titleSim * 0.6) + (artistSim * 0.4);

        // 2. Penalties
        // Deluxe/Remaster Penalty
        if (!options.preferStandard) {
            // If user didn't explicitly ask for Deluxe/Remaster in the query
            const isDeluxe = this._isDeluxe(albumTitle) && !this._isDeluxe(targetTitle);
            const isLive = this._isLive(albumTitle) && !this._isLive(targetTitle) && !options.allowLive;

            if (isDeluxe) score -= this.weights.penalties.deluxe;
            if (isLive) score -= this.weights.penalties.live;
        }

        return Math.max(0, Math.min(1, score));
    }

    _isDeluxe(title) {
        return title.includes('deluxe') || title.includes('expanded') || title.includes('edition') || title.includes('remaster');
    }

    _isLive(title) {
        return title.includes('live') || title.includes('concert') || title.includes('tour');
    }

    /**
     * Calculate string similarity (0-1) using Levenshtein distance
     * Derived from MusicKitService implementation
     * @private
     */
    _similarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) return 1.0;

        const costs = new Array();
        for (let i = 0; i <= longer.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= shorter.length; j++) {
                if (i == 0) costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (longer.charAt(i - 1) != shorter.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[shorter.length] = lastValue;
        }

        return (longerLength - costs[shorter.length]) / parseFloat(longerLength);
    }
}
