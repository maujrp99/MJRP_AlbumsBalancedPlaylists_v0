/**
 * F52, slice 1 - the one place where the app reads an answer of its own server.
 * The site and the server are published apart: the reader understands the new contract
 * ({ data, outcome } / { error: { code, retryable } }) and the answers of the server before it.
 */
import { describe, it, expect } from 'vitest'
import {
    readServerResult, failedWithoutAnswer, ApiError, ResultKind, DEFAULT_RATE_LIMIT_WAIT_MS
} from '../../public/js/api/serverResult.js'

const response = (status, body, headers = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name] ?? headers[name.toLowerCase()] ?? null },
    json: async () => {
        if (body === undefined) throw new SyntaxError('Unexpected token < in JSON')
        return body
    }
})

describe('readServerResult: the new server', () => {
    it.each(['found', 'not_found', 'no_ratings'])('200 with outcome "%s" is that kind, with the data', async (outcome) => {
        expect(await readServerResult(response(200, { data: { a: 1 }, outcome }))).toEqual({ kind: outcome, data: { a: 1 } })
    })

    const codes = [
        [502, 'upstream_failed', true],
        [504, 'upstream_timeout', true],
        [503, 'upstream_busy', true],
        [424, 'upstream_failed', false],
        [424, 'upstream_busy', false],
        [400, 'invalid_request', false],
        [500, 'internal', false],
        [503, 'internal', false]
    ]
    it.each(codes)('%i { error: { code: "%s", retryable: %s } } is a failure with that code, and asking again is what the field says', async (status, code, retryable) => {
        const result = await readServerResult(response(status, { error: { code, retryable } }))
        expect(result).toMatchObject({ kind: 'failed', code, retryable, status, hold: null })
    })

    it('"ask again?" comes from the field, never from the status alone', async () => {
        const refused = await readServerResult(response(500, { error: { code: 'internal', retryable: false } }))
        expect(refused.retryable).toBe(false)
        const passing = await readServerResult(response(424, { error: { code: 'upstream_failed', retryable: true } }))
        expect(passing.retryable).toBe(true)
    })

    it('401 unauthorized asks the load to hold until the person signs in', async () => {
        const result = await readServerResult(response(401, { error: { code: 'unauthorized', retryable: false } }))
        expect(result).toMatchObject({ kind: 'failed', code: 'unauthorized', retryable: false, hold: { reason: 'unauthorized' } })
    })

    it('403 unauthorized (a guest on a route for accounts) is a plain failure: nothing to hold', async () => {
        const result = await readServerResult(response(403, { error: { code: 'unauthorized', retryable: false } }))
        expect(result).toMatchObject({ kind: 'failed', code: 'unauthorized', hold: null })
    })

    it('429 rate_limited asks the load to hold for what Retry-After says, in seconds or as a date', async () => {
        const body = { error: { code: 'rate_limited', retryable: false } }
        const seconds = await readServerResult(response(429, body, { 'Retry-After': '120' }))
        expect(seconds).toMatchObject({ code: 'rate_limited', retryable: false, hold: { reason: 'rate_limited', retryAfterMs: 120000 } })

        const now = Date.parse('2026-11-19T12:00:00Z')
        const dated = await readServerResult(response(429, body, { 'Retry-After': 'Thu, 19 Nov 2026 12:00:30 GMT' }), { now: () => now })
        expect(dated.hold.retryAfterMs).toBe(30000)

        const silent = await readServerResult(response(429, body))
        expect(silent.hold.retryAfterMs).toBe(DEFAULT_RATE_LIMIT_WAIT_MS)
    })

    describe('503 upstream_busy: the scraped source asked the server to wait (F52, slice 3)', () => {
        const body = { error: { code: 'upstream_busy', retryable: true } }

        it('with Retry-After, the load holds for that long instead of failing every album', async () => {
            const result = await readServerResult(response(503, body, { 'Retry-After': '42' }))
            expect(result).toMatchObject({ kind: 'failed', code: 'upstream_busy', retryable: true, status: 503 })
            expect(result.hold).toEqual({ reason: 'source_busy', retryAfterMs: 42000 })
        })

        it('without Retry-After it is a plain failure, with "try again": nobody said for how long to hold', async () => {
            expect((await readServerResult(response(503, body))).hold).toBeNull()
            expect((await readServerResult(response(503, body, { 'Retry-After': 'soon' }))).hold).toBeNull()
        })

        it('the other failures of the source never hold, even with Retry-After', async () => {
            for (const [status, code] of [[502, 'upstream_failed'], [504, 'upstream_timeout']]) {
                const result = await readServerResult(response(status, { error: { code, retryable: true } }, { 'Retry-After': '42' }))
                expect(result.hold).toBeNull()
            }
        })
    })
})

describe('readServerResult: the server before F52', () => {
    it('200 without outcome is "legacy": the caller follows the rule it had, and the body is handed over whole', async () => {
        const body = { data: { bestEverInfo: null, trackRatings: [] } }
        expect(await readServerResult(response(200, body))).toEqual({ kind: ResultKind.LEGACY, body })
        expect(await readServerResult(response(200, { albums: [], error: 'quota' }))).toEqual({ kind: 'legacy', body: { albums: [], error: 'quota' } })
    })

    it('200 with an outcome it does not know is legacy too: never trusted as "the source has none"', async () => {
        expect((await readServerResult(response(200, { data: {}, outcome: 'maybe' }))).kind).toBe('legacy')
    })

    it('an error as { error: "text" }: 5xx may be asked again, 4xx may not (the rule of before)', async () => {
        expect(await readServerResult(response(500, { error: 'Internal server error' })))
            .toMatchObject({ kind: 'failed', code: 'internal', retryable: true, status: 500, hold: null })
        expect(await readServerResult(response(503, { error: 'AI API key not configured on server' })))
            .toMatchObject({ kind: 'failed', retryable: true, status: 503 })
        expect(await readServerResult(response(400, { error: 'Invalid albumData' })))
            .toMatchObject({ kind: 'failed', code: 'invalid_request', retryable: false })
    })

    it('its own 401 and 429 (text errors) hold the load, as the new ones do', async () => {
        expect((await readServerResult(response(401, { error: 'Sign in to use this.' }))).hold).toEqual({ reason: 'unauthorized' })
        expect((await readServerResult(response(429, { error: 'Too many requests. Try again later.' }, { 'Retry-After': '10' }))).hold)
            .toEqual({ reason: 'rate_limited', retryAfterMs: 10000 })
        expect((await readServerResult(response(403, { error: 'Sign in with an account to use this.' }))).hold).toBeNull()
    })

    it('the AI provider\'s own error, passed on raw by the old /api/generate, is a plain failure: a 402, 429 or 401 of the provider never holds the load', async () => {
        const google = (code, status) => ({ error: { code, message: 'provider text', status } })
        for (const [status, name] of [[402, 'FAILED_PRECONDITION'], [429, 'RESOURCE_EXHAUSTED'], [401, 'UNAUTHENTICATED']]) {
            const result = await readServerResult(response(status, google(status, name)))
            expect(result).toMatchObject({ kind: 'failed', code: 'unknown', retryable: false, status, hold: null })
        }
        expect(await readServerResult(response(503, google(503, 'UNAVAILABLE')))).toMatchObject({ code: 'unknown', retryable: true })
    })

    it('an error with no readable body (a proxy page) follows the status', async () => {
        expect(await readServerResult(response(502, undefined))).toMatchObject({ kind: 'failed', code: 'unknown', retryable: true, hold: null })
        expect(await readServerResult(response(404, undefined))).toMatchObject({ kind: 'failed', code: 'unknown', retryable: false })
        expect(await readServerResult(response(429, undefined))).toMatchObject({ kind: 'failed', code: 'unknown', hold: null })
    })
})

describe('readServerResult: what is not an answer', () => {
    it('200 with a body that cannot be read is a failure, not asked again', async () => {
        expect(await readServerResult(response(200, undefined))).toMatchObject({ kind: 'failed', code: 'unreadable', retryable: false, status: 200 })
    })

    it('no answer at all may be asked again; a deadline may not (the paid work may still be running)', () => {
        expect(failedWithoutAnswer(new TypeError('Failed to fetch'))).toMatchObject({ kind: 'failed', code: 'no_answer', retryable: true, status: null, hold: null })
        expect(failedWithoutAnswer(new Error('aborted'), { timedOut: true })).toMatchObject({ kind: 'failed', code: 'deadline', retryable: false, status: null })
    })
})

describe('ApiError: a failure, thrown', () => {
    it('carries the code, whether to ask again, the status and the hold of the failure it was made from', async () => {
        const failed = await readServerResult(response(429, { error: { code: 'rate_limited', retryable: false } }, { 'Retry-After': '5' }))
        const error = ApiError.from(failed, 'POST /x')
        expect(error).toBeInstanceOf(Error)
        expect(error).toMatchObject({ name: 'ApiError', kind: 'http', status: 429, code: 'rate_limited', retryable: false, hold: { reason: 'rate_limited', retryAfterMs: 5000 } })
        expect(error.message).toContain('POST /x')
        expect(error.message).toContain('429')
    })

    it('says "network" or "timeout" when there was no answer', () => {
        expect(ApiError.from(failedWithoutAnswer(new TypeError('Failed to fetch')), 'POST /x')).toMatchObject({ kind: 'network', retryable: true })
        expect(ApiError.from(failedWithoutAnswer(new Error('aborted'), { timedOut: true }), 'POST /x')).toMatchObject({ kind: 'timeout', retryable: false })
    })
})
