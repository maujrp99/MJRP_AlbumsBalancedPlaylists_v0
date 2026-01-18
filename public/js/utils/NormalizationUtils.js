/**
 * NormalizationUtils.js
 * 
 * Shared logic for title cleaning and fuzzy matching,
 * synchronized with backend (server/lib/normalize.js).
 */
export const NormalizationUtils = {
    /**
     * Removes diacritics from a string.
     */
    removeDiacritics(str) {
        if (!str) return ''
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    },

    /**
     * Standard title cleaning used for search/display.
     */
    cleanTitle(title) {
        if (!title || typeof title !== 'string') return ''

        return this.removeDiacritics(title)
            // Common edition/remaster suffixes in parentheses or brackets
            .replace(/\s*[\(\[][^()]*?(?:Remaster|Edition|Version|Anniversary|Expanded|Special|Bonus|Disc|Digital|Live)[^()]*?[\)\]]/gi, ' ')
            .replace(/\s*-\s*.*?EP\s*$/gi, '')
            .replace(/\s*-\s*.*?Single\s*$/gi, '')
            .replace(/\s*-\s*.*?(?:Remaster|Edition|Version|Mix).*?$/gi, ' ')
            .trim()
            .replace(/\s+/g, ' ')
    },

    /**
     * Normalizes artist name for comparison.
     */
    normalizeArtist(name) {
        if (!name || typeof name !== 'string') return ''
        let normalized = this.removeDiacritics(name).toLowerCase().trim()
        if (normalized.startsWith('the ')) normalized = normalized.substring(4)
        return normalized.replace(/[^a-z0-9]/g, '')
    },

    /**
     * Standard "core" version for matching (no spaces, no punctuation).
     */
    toCore(str) {
        if (!str) return ''
        return this.removeDiacritics(str).toLowerCase()
            .replace(/\s*[\(\[][^()]*?[\)\]]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim()
    },

    /**
     * Robust version for edge cases. Handles "The " prefix and aggressive pruning.
     */
    toFuzzyCore(str) {
        let core = this.toCore(str)
        if (core.startsWith('the')) core = core.substring(3)
        return core
    },

    /**
     * Robust normalization for edge cases. Keeps spaces but removes punctuation.
     */
    normalizeFuzzy(str) {
        if (!str) return ''
        let norm = this.removeDiacritics(str).toLowerCase()
            .replace(/\s*[\(\[][^()]*?(?:Remaster|Edition|Version|Anniversary|Expanded|Special|Bonus|Disc|Digital|Live)[^()]*?[\)\]]/gi, ' ')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
        if (norm.startsWith('the ')) norm = norm.substring(4)
        return norm
    }
}
