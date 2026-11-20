/**
 * newId - the one place the rules get a new id from (F78, REQ-07, Ref-0).
 *
 * The rules (a track with no id, a track turned canonical) need a fresh id. Where it comes from
 * depends on the engine: the browser and Node have `crypto.randomUUID`, the phone's engine (Hermes)
 * has none and gets one from the app (expo-crypto). So the core does not reach for any global: each
 * side hands this port its source ONCE, at start, and the rules call `newId()`.
 *
 *   the site   public/js/services/platform/platformWiring.js (the browser's crypto.randomUUID)
 *   the tests  test/setup.js (Node's crypto.randomUUID)
 *   the app    its own wiring, later (expo-crypto)
 *
 * Asked for an id before any source is wired, it throws and says what to wire: a silent fallback
 * would hide, on the phone, the very difference this port exists for.
 *
 * Pure: no import, no global.
 */

let source = null

/**
 * Hands the port the function that makes a new id (a non-empty text, a v4 UUID on every side
 * today). `null` takes it away. Returns the source it replaced, so a test can put it back.
 * @param {(() => string) | null} fn
 * @returns {(() => string) | null}
 */
export function setIdSource(fn) {
    if (fn !== null && typeof fn !== 'function') {
        throw new TypeError('setIdSource expects a function that returns a new id, or null')
    }
    const replaced = source
    source = fn
    return replaced
}

/**
 * A new id from the wired source.
 * @returns {string}
 */
export function newId() {
    if (source === null) {
        throw new Error('newId(): no id source wired. Call setIdSource() once at start: the site with ' +
            "the browser's crypto.randomUUID (public/js/services/platform/platformWiring.js), the app " +
            'with its own source (expo-crypto).')
    }
    const id = source()
    if (typeof id !== 'string' || id === '') {
        throw new TypeError('newId(): the wired id source must return a non-empty text')
    }
    return id
}
