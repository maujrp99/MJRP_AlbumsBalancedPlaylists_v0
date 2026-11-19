/**
 * The one local address of the app (F50).
 *
 * Spotify only accepts the loopback IP as a local redirect, and the browser keeps logins, tokens and
 * caches per origin: `localhost` and `127.0.0.1` are two different apps to it. So the app runs at
 * one address only, and a page opened at `localhost` is sent to the same place at `127.0.0.1`.
 * Pure: receives a location, returns a URL or null.
 */

export const LOCAL_HOST = '127.0.0.1'

/**
 * @param {Location|URL|null} location
 * @returns {string|null} where to go instead, or null when the address is already the right one
 */
export function canonicalLocalUrl(location) {
    if (!location || location.hostname !== 'localhost') return null
    const port = location.port ? `:${location.port}` : ''
    return `${location.protocol}//${LOCAL_HOST}${port}${location.pathname || '/'}${location.search || ''}${location.hash || ''}`
}
