/**
 * The one check an address from outside the code passes before it becomes a link (F59, UAT-199).
 *
 * "From outside" is what a provider or a stored record sends: the Spotify address of an album or of
 * a created playlist, the source address of a ranked track. Put as it comes into href or handed to
 * window.open, an address such as `javascript:...` runs as code in the page when it is followed.
 *
 * Pure, no DOM. The scheme is read by URL, the parser the browser follows a link with, so what is
 * judged here is what the browser would see - tabs, line breaks and capitals inside the scheme
 * included.
 *
 * Addresses written in the code ('/albums', a template that starts with 'https://') do not need it.
 * An image address (img src) does not run as code and is held by the page's img-src policy.
 *
 * @module utils/safeUrl
 */

const WEB_SCHEMES = new Set(['http:', 'https:'])

/**
 * @param {*} value - the address as it came
 * @returns {string|null} the address, trimmed, when it is absolute and http or https; null otherwise
 */
export function safeUrl(value) {
    if (typeof value !== 'string') return null
    const address = value.trim()
    try {
        const parsed = new URL(address)
        return WEB_SCHEMES.has(parsed.protocol) && parsed.hostname ? address : null
    } catch {
        return null
    }
}
