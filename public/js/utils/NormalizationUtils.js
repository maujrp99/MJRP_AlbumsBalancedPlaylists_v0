/**
 * NormalizationUtils.js
 * 
 * The core of a track title, for matching tracks.
 * It does not decide whether an album is the album asked for, nor clean an album title for a
 * search: both are the one identity rule's (shared/albumIdentity.js: compareAlbumIdentity,
 * titleWithoutEditionNotes). The album and artist normalizers and the title cleaner that lived
 * here were removed (F55, F68).
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
     * Standard "core" version for matching (no spaces, no punctuation).
     */
    toCore(str) {
        if (!str) return ''
        return this.removeDiacritics(str).toLowerCase()
            .replace(/\s*[([][^()]*?[)\]]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim()
    }
}
