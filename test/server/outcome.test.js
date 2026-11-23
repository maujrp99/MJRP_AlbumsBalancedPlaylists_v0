/**
 * F52, slice 1 - one module builds every answer of the server: success always says its outcome,
 * a failure is `{ error: { code, retryable } }` with a code from a closed list, and nothing of
 * the provider or of the server's inside leaves in the body.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { fakeResponse, answerOf, httpError, timeoutError, networkError } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const outcome = require('../../server/lib/outcome.js')
const { OUTCOMES, ERROR_CODES, success, failure, respond, UpstreamError, upstreamErrorFrom } = outcome

describe('outcome: the success answer', () => {
    it('always carries its outcome; "found" when nothing else is said', () => {
        const res = fakeResponse()
        respond(res, success({ a: 1 }))
        expect(answerOf(res)).toMatchObject({ status: 200, body: { data: { a: 1 }, outcome: 'found' } })
    })

    it('says "not_found" and "no_ratings" with 200: the source answered', () => {
        for (const name of ['not_found', 'no_ratings']) {
            const res = fakeResponse()
            respond(res, success({ a: 1 }, name))
            expect(answerOf(res)).toMatchObject({ status: 200, body: { data: { a: 1 }, outcome: name } })
        }
    })

    it('the outcomes are a closed list', () => {
        expect(Object.values(OUTCOMES).sort()).toEqual(['found', 'no_ratings', 'no_value', 'not_configured', 'not_found'])
        expect(() => success({}, 'maybe')).toThrow()
    })
})

describe('outcome: the error answer', () => {
    it('the codes are the closed list of the design', () => {
        expect([...ERROR_CODES].sort()).toEqual(['internal', 'invalid_request', 'not_configured', 'rate_limited', 'unauthorized',
            'upstream_busy', 'upstream_failed', 'upstream_timeout', 'upstream_unauthorized'])
        expect(() => failure('something_else')).toThrow()
    })

    const defaults = [
        ['upstream_failed', 502, true],
        ['upstream_timeout', 504, true],
        ['upstream_busy', 503, true],
        ['upstream_unauthorized', 502, false],
        ['invalid_request', 400, false],
        ['unauthorized', 401, false],
        ['rate_limited', 429, false],
        ['not_configured', 503, false],
        ['internal', 500, false]
    ]
    defaults.forEach(([code, status, retryable]) => {
        it(`${code} leaves as ${status}, retryable ${retryable}, and the body is only { error: { code, retryable } }`, () => {
            const res = fakeResponse()
            respond(res, failure(code))
            expect(answerOf(res)).toMatchObject({ status, body: { error: { code, retryable } } })
            expect(Object.keys(answerOf(res).body)).toEqual(['error'])
            expect(Object.keys(answerOf(res).body.error).sort()).toEqual(['code', 'retryable'])
        })
    })

    it('a caller may say another status and whether to ask again; the code stays in the list', () => {
        const res = fakeResponse()
        respond(res, failure('upstream_failed', { status: 424, retryable: false }))
        expect(answerOf(res)).toMatchObject({ status: 424, body: { error: { code: 'upstream_failed', retryable: false } } })
    })

    it('says when to come back in the Retry-After header, in seconds', () => {
        const res = fakeResponse()
        respond(res, failure('rate_limited', { retryAfterSeconds: 60 }))
        expect(answerOf(res).headers).toEqual({ 'Retry-After': '60' })
        expect(answerOf(res).status).toBe(429)
    })
})

describe('outcome: a failure of an outside source', () => {
    it('a deadline is upstream_timeout', () => {
        expect(upstreamErrorFrom(timeoutError(), 'Source')).toMatchObject({ code: 'upstream_timeout' })
    })
    it('429 and 503 are upstream_busy', () => {
        expect(upstreamErrorFrom(httpError(429), 'Source')).toMatchObject({ code: 'upstream_busy' })
        expect(upstreamErrorFrom(httpError(503), 'Source')).toMatchObject({ code: 'upstream_busy' })
    })
    it('any other HTTP failure, and no answer at all, are upstream_failed', () => {
        expect(upstreamErrorFrom(httpError(500), 'Source')).toMatchObject({ code: 'upstream_failed' })
        expect(upstreamErrorFrom(httpError(404), 'Source')).toMatchObject({ code: 'upstream_failed' })
        expect(upstreamErrorFrom(networkError(), 'Source')).toMatchObject({ code: 'upstream_failed' })
    })
    it('is an UpstreamError that keeps the cause and never copies the address of the request', () => {
        const cause = Object.assign(httpError(500), { config: { url: 'https://x/y?key=SECRET' } })
        const error = upstreamErrorFrom(cause, 'Source')
        expect(error).toBeInstanceOf(UpstreamError)
        expect(error.cause).toBe(cause)
        expect(error.message).not.toContain('SECRET')
    })
    it('an UpstreamError that passes again stays the same', () => {
        const first = new UpstreamError('upstream_busy', 'busy')
        expect(upstreamErrorFrom(first, 'Source')).toBe(first)
    })
})

describe('every place that builds an error uses the one format', () => {
    const { errorResponder } = require('../../server/lib/asyncRoute.js')
    const { requireUser } = require('../../server/lib/auth/requireUser.js')
    const { AuthError } = require('../../server/lib/auth/verifyIdToken.js')
    const { createRateLimiter } = require('../../server/lib/rateLimit.js')

    it('the last error handler: internal for what broke, invalid_request for a request it could not read', () => {
        const broke = fakeResponse()
        errorResponder({ error: vi.fn() })(new Error('secret'), {}, broke, vi.fn())
        expect(answerOf(broke)).toMatchObject({ status: 500, body: { error: { code: 'internal', retryable: false } } })

        const unreadable = fakeResponse()
        errorResponder({ error: vi.fn() })(Object.assign(new Error('bad json'), { status: 400 }), {}, unreadable, vi.fn())
        expect(answerOf(unreadable)).toMatchObject({ status: 400, body: { error: { code: 'invalid_request', retryable: false } } })
    })

    it('the last error handler: a failure of an outside source that nobody caught leaves with its own code', () => {
        const res = fakeResponse()
        errorResponder({ error: vi.fn() })(new UpstreamError('upstream_timeout', 'slow'), {}, res, vi.fn())
        expect(answerOf(res)).toMatchObject({ status: 504, body: { error: { code: 'upstream_timeout', retryable: true } } })
    })

    it('the door: 401 and 403 are unauthorized; a login that could not be checked is upstream_busy with 503', async () => {
        const run = async (verifier, options = {}) => {
            const res = fakeResponse()
            await requireUser({ verifier, logger: { warn: vi.fn() }, ...options })({ headers: {} }, res, vi.fn())
            return answerOf(res)
        }
        const bad = { verify: async () => { throw new AuthError('invalid', 'bad signature') } }
        const down = { verify: async () => { throw new AuthError('unavailable', 'no keys') } }
        const guest = { verify: async () => ({ uid: 'g', anonymous: true }) }

        expect(await run(bad)).toMatchObject({ status: 401, body: { error: { code: 'unauthorized', retryable: false } } })
        expect(await run(guest)).toMatchObject({ status: 403, body: { error: { code: 'unauthorized', retryable: false } } })
        expect(await run(down)).toMatchObject({ status: 503, body: { error: { code: 'upstream_busy', retryable: true } } })
    })

    it('the limit per person: rate_limited with 429 and Retry-After; nobody in the request is unauthorized', () => {
        const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 0 })
        limiter({ user: { uid: 'u' } }, fakeResponse(), vi.fn())
        const over = fakeResponse()
        limiter({ user: { uid: 'u' } }, over, vi.fn())
        expect(answerOf(over)).toMatchObject({
            status: 429, headers: { 'Retry-After': '60' }, body: { error: { code: 'rate_limited', retryable: false } }
        })

        const nobody = fakeResponse()
        limiter({}, nobody, vi.fn())
        expect(answerOf(nobody)).toMatchObject({ status: 401, body: { error: { code: 'unauthorized' } } })
    })
})
