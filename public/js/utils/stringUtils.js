/**
 * String Utilities
 * 
 * Shared string manipulation functions used across the application.
 * 
 * @module utils/stringUtils
 * @since Sprint 13 - CRIT-5
 */

/**
 * Calculate string similarity (0-1) using Levenshtein distance
 * 
 * @param {string} s1 - First string
 * @param {string} s2 - Second string
 * @returns {number} Similarity score (0 = completely different, 1 = identical)
 * 
 * @example
 * calculateSimilarity("abbey road", "abbey road") // 1.0
 * calculateSimilarity("walking into clarksdale", "physical graffiti") // ~0.15
 */
export function calculateSimilarity(s1, s2) {
    if (!s1 || !s2) return 0

    const str1 = s1.toLowerCase().trim()
    const str2 = s2.toLowerCase().trim()

    if (str1 === str2) return 1.0

    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    const longerLength = longer.length

    if (longerLength === 0) return 1.0

    // Levenshtein distance calculation
    const costs = new Array()
    for (let i = 0; i <= longer.length; i++) {
        let lastValue = i
        for (let j = 0; j <= shorter.length; j++) {
            if (i === 0) {
                costs[j] = j
            } else {
                if (j > 0) {
                    let newValue = costs[j - 1]
                    if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
                    }
                    costs[j - 1] = lastValue
                    lastValue = newValue
                }
            }
        }
        if (i > 0) costs[shorter.length] = lastValue
    }

    return (longerLength - costs[shorter.length]) / parseFloat(longerLength)
}

/**
 * Normalize string for comparison (lowercase, trim, remove special chars)
 * 
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export function normalizeForComparison(str) {
    if (!str) return ''
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ')    // Normalize whitespace
}

/**
 * Generate a stable cache key from album data
 * 
 * @param {string} artist - Artist name
 * @param {string} album - Album title
 * @returns {string} Normalized key
 */
export function generateAlbumKey(artist, album) {
    const normalizedArtist = (artist || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w_-]/g, '')
    const normalizedAlbum = (album || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w_-]/g, '')
    return `album_${normalizedArtist}_${normalizedAlbum}`
}

/**
 * Similarity threshold for album matching
 */
export const SIMILARITY_THRESHOLD = 0.35

const HTML_ESCAPES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })

/**
 * The one way text from outside the code goes into an HTML string (F59, UAT-199): names of albums,
 * tracks, artists, series and playlists, notes, messages of a provider, anything read from the URL.
 *
 * Pure, no DOM. Escapes & < > " and ', so the result is safe as element content and inside a QUOTED
 * attribute value (title="${escapeHtml(name)}"). It is not enough for an attribute with no quotes,
 * for a URL scheme (href="javascript:...") or for text placed inside a <script> or an inline handler.
 *
 * Use it only at the moment of writing HTML. A text node, textContent, setAttribute and SafeDOM
 * children take the plain text: escaping there shows "&amp;" on screen (UAT-180).
 *
 * @param {*} value - null and undefined give ''; anything else is turned into its text first
 * @returns {string}
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) return ''
    return String(value).replace(/[&<>"']/g, character => HTML_ESCAPES[character])
}

/**
 * Safe Text injection
 * Usage: safeText(element, content)
 * Instead of: element.innerHTML = content (dangerous)
 * Or: element.textContent = content (safe but verbose if null checking needed)
 * @param {HTMLElement} element - The target element
 * @param {string} text - The text content
 */
export function safeText(element, text) {
    if (element) {
        element.textContent = text || ''
    }
}
