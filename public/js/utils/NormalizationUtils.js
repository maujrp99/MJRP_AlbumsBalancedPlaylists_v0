/**
 * NormalizationUtils.js
 * 
 * Title cleaning for the TEXT sent to a search, and the core of a track title for matching tracks.
 * It does not decide whether an album is the album asked for: that is the one identity rule,
 * shared/albumIdentity.js (F55). The album and artist normalizers that lived here were removed.
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
     * Standard "core" version for matching (no spaces, no punctuation).
     */
    toCore(str) {
        if (!str) return ''
        return this.removeDiacritics(str).toLowerCase()
            .replace(/\s*[\(\[][^()]*?[\)\]]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim()
    }
}
