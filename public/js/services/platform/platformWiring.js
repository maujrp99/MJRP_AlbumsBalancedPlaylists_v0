/**
 * platformWiring - the site hands the core's platform ports their browser sources (F78, REQ-07).
 *
 * Today one port: the id. The rules ask `newId()` (shared/platform/newId.js); here the site says
 * where a new id comes from: the browser's `crypto.randomUUID`. app.js imports this file before
 * every other module of the app, so no track is made before the port has a source.
 *
 * The phone app will have its own wiring with its own source; the rules do not change.
 */
import { setIdSource } from '@shared/platform/newId.js'

/**
 * Wires the id port with `host.crypto.randomUUID` (the page's `globalThis` by default).
 * @param {{ crypto?: { randomUUID?: () => string } }} host
 */
export function wirePlatform(host = globalThis) {
    const browserCrypto = host.crypto
    if (!browserCrypto || typeof browserCrypto.randomUUID !== 'function') {
        throw new Error('This browser has no crypto.randomUUID: the site cannot make ids for tracks')
    }
    setIdSource(() => browserCrypto.randomUUID())
}

wirePlatform()
