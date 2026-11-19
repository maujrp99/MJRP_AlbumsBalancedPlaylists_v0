/**
 * String Utilities
 * 
 * Shared string manipulation functions used across the application.
 * 
 * @module utils/stringUtils
 * @since Sprint 13 - CRIT-5
 */

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
