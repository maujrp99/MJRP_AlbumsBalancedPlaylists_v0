/**
 * valueApi - the three calls of the value of the inventory to the app's own server (F75):
 *
 *   POST /album-value     the Discogs value of one album
 *   GET  /value-sources   the switch of the Discogs values, for who is on the app: { discogs: 'on' | 'off' | 'unknown' }
 *   GET  /exchange-rates  the rates of the day from USD
 *
 * Every call goes with the person's login (api/serverFetch.js) and is read by the one reader
 * (api/serverResult.js): what comes back is always a typed result, never a thrown error. A call
 * with no answer is `failed` with the code `no_answer`; one that passed its deadline, `deadline`;
 * one the caller dropped (its signal was aborted) is `failed` with the code `dropped`.
 *
 * `createValueApi` is pure (what it needs is given to it); the service is wired to the real ones
 * in services/inventory/inventoryValueWiring.js.
 */

import { readServerResult, failedWithoutAnswer } from './serverResult.js'

/** The server answers an album within 20 s (server/lib/services/valueService.js): the app waits a little more. */
export const VALUE_TIMEOUT_MS = 25000
/** The switch and the rates are short answers. */
export const SHORT_TIMEOUT_MS = 12000

const DROPPED = 'dropped'

/**
 * @param {Object} deps
 * @param {Function} deps.fetchServer - (url, init) => Promise<Response>, with the login
 * @param {string} [deps.base] - the address of the API
 */
export function createValueApi({ fetchServer, base = '/api' }) {
    /** One call, never thrown. `signal` drops it from outside; `timeoutMs` is its own deadline. */
    async function call(path, init, { signal = null, timeoutMs }) {
        const controller = new AbortController()
        const drop = () => controller.abort()
        if (signal?.aborted) drop()
        signal?.addEventListener('abort', drop, { once: true })
        const timer = setTimeout(drop, timeoutMs)
        try {
            return await readServerResult(await fetchServer(`${base}${path}`, { ...init, signal: controller.signal }))
        } catch (cause) {
            if (signal?.aborted) return { ...failedWithoutAnswer(cause, { timedOut: true }), code: DROPPED }
            return failedWithoutAnswer(cause, { timedOut: controller.signal.aborted })
        } finally {
            clearTimeout(timer)
            signal?.removeEventListener('abort', drop)
        }
    }

    return {
        /** @param {{ artist, title, year?, releaseId? }} album */
        albumValue: (album, { signal = null } = {}) => call('/album-value', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(album)
        }, { signal, timeoutMs: VALUE_TIMEOUT_MS }),

        valueSources: ({ signal = null } = {}) => call('/value-sources', { method: 'GET' }, { signal, timeoutMs: SHORT_TIMEOUT_MS }),

        exchangeRates: ({ signal = null } = {}) => call('/exchange-rates', { method: 'GET' }, { signal, timeoutMs: SHORT_TIMEOUT_MS })
    }
}
