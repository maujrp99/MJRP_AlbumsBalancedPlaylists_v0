/**
 * F59, slice C - the routes that cost money or work answer only to a signed-in person, and to
 * each person only so many times. No network here: the keys that check a login are injected.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { createRequire } from 'node:module'
import crypto from 'node:crypto'

const require = createRequire(import.meta.url)
const { createIdTokenVerifier, AuthError } = require('../../server/lib/auth/verifyIdToken.js')
const { requireUser } = require('../../server/lib/auth/requireUser.js')
const { createRateLimiter } = require('../../server/lib/rateLimit.js')

const PROJECT = 'test-project'
const NOW = 1_800_000_000 // seconds
let keys, otherKeys

const b64 = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')
const sign = (claims, { kid = 'key-1', alg = 'RS256', key = keys.privateKey } = {}) => {
    const head = b64({ alg, kid, typ: 'JWT' })
    const body = b64(claims)
    const signature = crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), key).toString('base64url')
    return `${head}.${body}.${signature}`
}
const claims = (extra = {}) => ({
    iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, sub: 'user-1',
    iat: NOW - 60, exp: NOW + 3600, auth_time: NOW - 60,
    firebase: { sign_in_provider: 'google.com' }, ...extra
})
const verifier = (overrides = {}) => createIdTokenVerifier({
    projectId: PROJECT,
    fetchKeys: vi.fn(async () => ({ keys: { 'key-1': keys.publicPem }, maxAgeSeconds: 3600 })),
    now: () => NOW * 1000,
    ...overrides
})

beforeAll(() => {
    const make = () => {
        const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
        return { privateKey: pair.privateKey, publicPem: pair.publicKey.export({ type: 'spki', format: 'pem' }) }
    }
    keys = make()
    otherKeys = make()
})

describe('createIdTokenVerifier', () => {
    it('accepts a login of this project, signed with a known key, and says who it is', async () => {
        const user = await verifier().verify(sign(claims()))
        expect(user).toEqual({ uid: 'user-1', anonymous: false })
    })

    it('tells an anonymous login apart', async () => {
        const user = await verifier().verify(sign(claims({ firebase: { sign_in_provider: 'anonymous' } })))
        expect(user).toEqual({ uid: 'user-1', anonymous: true })
    })

    const refused = [
        ['no token', () => undefined],
        ['text that is not a token', () => 'not-a-token'],
        ['a token signed with another key', () => sign(claims(), { key: otherKeys.privateKey })],
        ['a token whose key is unknown', () => sign(claims(), { kid: 'key-9' })],
        ['a token that says it is not signed', () => `${b64({ alg: 'none', kid: 'key-1' })}.${b64(claims())}.`],
        ['a token of another project', () => sign(claims({ aud: 'someone-else' }))],
        ['a token from another issuer', () => sign(claims({ iss: 'https://securetoken.google.com/someone-else' }))],
        ['an expired token', () => sign(claims({ exp: NOW - 1 }))],
        ['a token issued in the future', () => sign(claims({ iat: NOW + 600 }))],
        ['a token with nobody in it', () => sign(claims({ sub: '' }))],
        ['a token whose body was changed after signing', () => {
            const [head, , signature] = sign(claims()).split('.')
            return `${head}.${b64(claims({ sub: 'someone-else' }))}.${signature}`
        }]
    ]
    refused.forEach(([name, make]) => {
        it(`refuses ${name}`, async () => {
            await expect(verifier().verify(make())).rejects.toBeInstanceOf(AuthError)
        })
    })

    it('fetches the keys once and reuses them while they are valid', async () => {
        const fetchKeys = vi.fn(async () => ({ keys: { 'key-1': keys.publicPem }, maxAgeSeconds: 3600 }))
        const v = verifier({ fetchKeys })
        await v.verify(sign(claims()))
        await v.verify(sign(claims()))
        expect(fetchKeys).toHaveBeenCalledTimes(1)
    })

    it('asks for the keys again when a token names a key it does not have yet (Google rotates them)', async () => {
        const fetchKeys = vi.fn()
            .mockResolvedValueOnce({ keys: { 'old-key': otherKeys.publicPem }, maxAgeSeconds: 3600 })
            .mockResolvedValueOnce({ keys: { 'key-1': keys.publicPem }, maxAgeSeconds: 3600 })
        const user = await verifier({ fetchKeys }).verify(sign(claims()))
        expect(user.uid).toBe('user-1')
        expect(fetchKeys).toHaveBeenCalledTimes(2)
    })

    it('when the keys cannot be fetched, says the check is unavailable instead of letting anyone in', async () => {
        const v = verifier({ fetchKeys: vi.fn(async () => { throw new Error('offline') }) })
        await expect(v.verify(sign(claims()))).rejects.toMatchObject({ code: 'unavailable' })
    })
})

const response = () => {
    const res = {}
    res.status = vi.fn(() => res); res.json = vi.fn(() => res); res.set = vi.fn(() => res)
    return res
}

describe('requireUser', () => {
    const run = async (middleware, header) => {
        const req = { headers: header ? { authorization: header } : {} }
        const res = response(); const next = vi.fn()
        await middleware(req, res, next)
        return { req, res, next }
    }
    const ok = { verify: vi.fn(async () => ({ uid: 'u1', anonymous: false })) }
    const guest = { verify: vi.fn(async () => ({ uid: 'g1', anonymous: true })) }
    const bad = { verify: vi.fn(async () => { throw new AuthError('invalid', 'bad signature') }) }
    const down = { verify: vi.fn(async () => { throw new AuthError('unavailable', 'no keys') }) }

    it('lets a signed-in person through and says who it is', async () => {
        const { req, next } = await run(requireUser({ verifier: ok }), 'Bearer token-text')
        expect(ok.verify).toHaveBeenCalledWith('token-text')
        expect(req.user).toEqual({ uid: 'u1', anonymous: false })
        expect(next).toHaveBeenCalledWith()
    })

    it('answers 401 with no login, with a login it cannot read, and with a header in another shape', async () => {
        for (const header of [undefined, 'Bearer broken', 'Basic abc']) {
            const { res, next } = await run(requireUser({ verifier: bad }), header)
            expect(res.status).toHaveBeenCalledWith(401)
            expect(next).not.toHaveBeenCalled()
        }
    })

    it('answers 403 to a guest on a route that is not for guests, and lets the guest through where allowed', async () => {
        const closed = await run(requireUser({ verifier: guest }), 'Bearer t')
        expect(closed.res.status).toHaveBeenCalledWith(403)
        expect(closed.next).not.toHaveBeenCalled()

        const open = await run(requireUser({ verifier: guest, allowAnonymous: true }), 'Bearer t')
        expect(open.next).toHaveBeenCalledWith()
    })

    it('answers 503 when the login cannot be checked, never lets the request through', async () => {
        const { res, next } = await run(requireUser({ verifier: down }), 'Bearer t')
        expect(res.status).toHaveBeenCalledWith(503)
        expect(next).not.toHaveBeenCalled()
    })

    it('never puts the reason of the refusal in the answer', async () => {
        const { res } = await run(requireUser({ verifier: bad }), 'Bearer broken')
        expect(JSON.stringify(res.json.mock.calls)).not.toContain('bad signature')
    })
})

describe('createRateLimiter', () => {
    const call = (limiter, uid) => {
        const res = response(); const next = vi.fn()
        limiter({ user: { uid } }, res, next)
        return { res, next }
    }

    it('lets a person through up to the limit, then answers 429 and says when to come back', () => {
        let now = 0
        const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => now })
        expect(call(limiter, 'u1').next).toHaveBeenCalled()
        expect(call(limiter, 'u1').next).toHaveBeenCalled()
        const third = call(limiter, 'u1')
        expect(third.next).not.toHaveBeenCalled()
        expect(third.res.status).toHaveBeenCalledWith(429)
        expect(third.res.set).toHaveBeenCalledWith('Retry-After', '60')
    })

    it('counts each person apart', () => {
        const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 0 })
        expect(call(limiter, 'u1').next).toHaveBeenCalled()
        expect(call(limiter, 'u2').next).toHaveBeenCalled()
        expect(call(limiter, 'u1').next).not.toHaveBeenCalled()
    })

    it('lets the person back when the window has passed', () => {
        let now = 0
        const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => now })
        call(limiter, 'u1')
        expect(call(limiter, 'u1').next).not.toHaveBeenCalled()
        now = 60_001
        expect(call(limiter, 'u1').next).toHaveBeenCalled()
    })

    it('refuses a request with nobody in it: the limiter comes after the login check', () => {
        const limiter = createRateLimiter({ limit: 5, windowMs: 1000, now: () => 0 })
        const res = response(); const next = vi.fn()
        limiter({}, res, next)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('does not keep people who went away', () => {
        let now = 0
        const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now })
        for (let i = 0; i < 50; i++) call(limiter, `u${i}`)
        now = 5000
        call(limiter, 'fresh')
        expect(limiter.size()).toBe(1)
    })
})
