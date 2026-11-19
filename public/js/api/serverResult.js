/**
 * serverResult - the one place where the app reads an answer of its own server (F52).
 *
 * The contract (server/lib/outcome.js writes it):
 *   200      { data, outcome }                outcome: 'found' | 'not_found' | 'no_ratings'
 *   4xx/5xx  { error: { code, retryable } }   code from the server's closed list
 *
 * `readServerResult(response)` gives a typed result:
 *   { kind: 'found' | 'not_found' | 'no_ratings', data }
 *   { kind: 'legacy', body }     a 200 WITHOUT outcome: the server before F52. The caller follows
 *                                the rule it had before; it is never trusted as "the source has none"
 *   { kind: 'failed', code, retryable, status, hold }
 *
 * `retryable` says whether asking again within seconds may work. With the new server it is the
 * field the server sent, never the status alone. With the old server (errors as `{ error: 'text' }`,
 * or the AI provider's own error passed on raw) it is the rule of before: only a 5xx.
 *
 * `hold` is set when OUR server said "sign in" (401) or "you asked too much, wait" (429), or when
 * it said that the ratings source asked it to wait and until when (503 `upstream_busy` WITH
 * Retry-After): the album load holds its queue instead of failing every album. An error of the AI
 * provider that the old server passes on with the same status is not ours and never holds.
 *
 * Pure: no network, no store, no screen. It receives a Response-like object ({ ok, status, headers, json }).
 */

import { HoldReason } from '../models/albumLoadState.js'

export const ResultKind = Object.freeze({
    FOUND: 'found',
    NOT_FOUND: 'not_found',
    NO_RATINGS: 'no_ratings',
    LEGACY: 'legacy',
    FAILED: 'failed'
})

/** How long to hold after a 429 that does not say when to come back. */
export const DEFAULT_RATE_LIMIT_WAIT_MS = 60000

const OUTCOMES = new Set([ResultKind.FOUND, ResultKind.NOT_FOUND, ResultKind.NO_RATINGS])
const SERVER_CODES = new Set(['upstream_failed', 'upstream_timeout', 'upstream_busy', 'invalid_request',
    'unauthorized', 'rate_limited', 'internal'])

/** The codes the old server's own text errors stand for, by status. */
const legacyCodeOf = (status) => {
    if (status === 401 || status === 403) return 'unauthorized'
    if (status === 429) return 'rate_limited'
    if (status === 400) return 'invalid_request'
    if (status >= 500) return 'internal'
    return 'unknown'
}

const failed = (code, retryable, status, hold = null) => ({ kind: ResultKind.FAILED, code, retryable, status, hold })

/** What Retry-After says, in ms (it comes in seconds or as a date); null when absent or unreadable. */
function retryAfterMsOf(response, now) {
    const header = response.headers && typeof response.headers.get === 'function' ? response.headers.get('Retry-After') : null
    if (header === null || header === undefined || header === '') return null
    const seconds = Number(header)
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
    const date = Date.parse(header)
    return Number.isNaN(date) ? null : Math.max(0, date - now())
}

/**
 * Only our own door (401), our own limit (429) and "the source asked to wait until..." hold the load.
 * A 429 with no time holds for a default; "the source is busy" with no time is a plain failure.
 */
function holdOf(code, response, now) {
    if (code === 'unauthorized' && response.status === 401) return { reason: HoldReason.UNAUTHORIZED }
    const retryAfterMs = retryAfterMsOf(response, now)
    if (code === 'rate_limited') return { reason: HoldReason.RATE_LIMITED, retryAfterMs: retryAfterMs ?? DEFAULT_RATE_LIMIT_WAIT_MS }
    if (code === 'upstream_busy' && retryAfterMs !== null) return { reason: HoldReason.SOURCE_BUSY, retryAfterMs }
    return null
}

function readFailure(response, body, now) {
    const { status } = response
    const error = body && typeof body === 'object' ? body.error : undefined

    // The new server: the code and "ask again?" are what it sent
    if (error && typeof error === 'object' && SERVER_CODES.has(error.code)) {
        return failed(error.code, error.retryable === true, status, holdOf(error.code, response, now))
    }
    // The old server's own errors are text: the rule of before (only a 5xx may pass)
    if (typeof error === 'string') {
        const code = legacyCodeOf(status)
        return failed(code, status >= 500, status, holdOf(code, response, now))
    }
    // Anything else (the AI provider's error passed on raw, a proxy page): not ours to hold for
    return failed('unknown', status >= 500, status)
}

/**
 * @param {{ ok: boolean, status: number, headers?: { get: Function }, json: Function }} response
 * @param {Object} [options]
 * @param {Function} [options.now] - () => ms, for a Retry-After given as a date
 * @returns {Promise<Object>} the typed result described at the top of this file
 */
export async function readServerResult(response, { now = () => Date.now() } = {}) {
    let body
    let readable = true
    try {
        body = await response.json()
    } catch {
        readable = false
    }

    if (!response.ok) return readFailure(response, readable ? body : null, now)
    if (!readable) return failed('unreadable', false, response.status)

    if (body && typeof body === 'object' && OUTCOMES.has(body.outcome)) {
        return { kind: body.outcome, data: body.data ?? null }
    }
    return { kind: ResultKind.LEGACY, body }
}

/**
 * The failure of a call that got no answer.
 * @param {*} cause - what fetch threw
 * @param {Object} [options]
 * @param {boolean} [options.timedOut] - the call was aborted at its deadline: the work may still be running, so it is not asked again
 */
export function failedWithoutAnswer(cause, { timedOut = false } = {}) {
    return { ...failed(timedOut ? 'deadline' : 'no_answer', !timedOut, null), cause }
}

/**
 * A failed call to the server, thrown. It carries what is needed to decide what to do next:
 *   kind       'http' (the server answered, `status` says what), 'network' (no answer), 'timeout' (too slow)
 *   code       the server's code, or 'unknown' | 'unreadable' | 'no_answer' | 'deadline'
 *   retryable  asking again within seconds may work
 *   hold       { reason, retryAfterMs? } when our server said "sign in" or "wait"; else null
 */
export class ApiError extends Error {
    constructor(message, { kind, status = null, cause = null, code = 'unknown', retryable, hold = null } = {}) {
        super(message)
        this.name = 'ApiError'
        this.kind = kind
        this.status = status
        this.code = code
        // Built by hand, with no result behind it: the rule of before (no answer, or a 5xx)
        this.retryable = typeof retryable === 'boolean' ? retryable : (kind === 'network' || (kind === 'http' && status >= 500))
        this.hold = hold
        if (cause) this.cause = cause
    }

    /** @deprecated the name of before F52; read `retryable`. */
    get isTransient() {
        return this.retryable
    }

    /**
     * @param {Object} result - a result of kind 'failed'
     * @param {string} route - for the message, e.g. 'POST /generate'
     */
    static from(result, route) {
        let kind = 'http'
        let message = `${route} answered HTTP ${result.status} (${result.code})`
        if (result.code === 'no_answer') {
            kind = 'network'
            message = `${route} got no answer: ${result.cause?.message || result.cause}`
        } else if (result.code === 'deadline') {
            kind = 'timeout'
            message = `${route} passed its deadline`
        }
        const { status, code, retryable, hold, cause = null } = result
        return new ApiError(message, { kind, status, code, retryable, hold, cause })
    }
}
