/**
 * F59 - the server's debug routes are off unless someone turns them on by name. They used to be
 * mounted always, in production too, answering anyone.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { debugRoutesEnabled } = require('../../server/lib/debugGate.js')
const { asyncRoute, errorResponder } = require('../../server/lib/asyncRoute.js')

describe('debugRoutesEnabled (F59)', () => {
    it('is off by default, whatever the environment', () => {
        expect(debugRoutesEnabled({})).toBe(false)
        expect(debugRoutesEnabled({ NODE_ENV: 'production' })).toBe(false)
        expect(debugRoutesEnabled({ NODE_ENV: 'development' })).toBe(false)
        expect(debugRoutesEnabled(undefined)).toBe(false)
    })

    it('is on only with the exact switch', () => {
        expect(debugRoutesEnabled({ ENABLE_DEBUG_ROUTES: 'true' })).toBe(true)
        for (const other of ['1', 'yes', 'TRUE', 'on', '', ' true ']) {
            expect(debugRoutesEnabled({ ENABLE_DEBUG_ROUTES: other })).toBe(false)
        }
    })
})

describe('asyncRoute (F59): a route that breaks answers, it does not take the server down', () => {
    const response = () => {
        const res = { headersSent: false }
        res.status = vi.fn(() => res)
        res.json = vi.fn(() => res)
        return res
    }

    it('hands a rejected handler to the error path instead of leaving it unhandled', async () => {
        const next = vi.fn()
        const boom = new Error('boom')
        await asyncRoute(async () => { throw boom })({}, response(), next)
        expect(next).toHaveBeenCalledWith(boom)
    })

    it('does nothing extra when the handler answers', async () => {
        const next = vi.fn()
        const res = response()
        await asyncRoute(async (req, r) => r.status(200).json({ ok: true }))({}, res, next)
        expect(res.json).toHaveBeenCalledWith({ ok: true })
        expect(next).not.toHaveBeenCalled()
    })

    it('the error path answers 500 without the message or the stack of the error', () => {
        const res = response()
        const logger = { error: vi.fn() }
        errorResponder(logger)(new Error('secret detail at /usr/src/app'), { method: 'POST', path: '/api/generate' }, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
        expect(JSON.stringify(res.json.mock.calls)).not.toContain('secret detail')
        expect(logger.error).toHaveBeenCalled()
    })

    it('a request the server could not read is answered as the caller\'s error, still with no detail', () => {
        const res = response()
        const bad = Object.assign(new Error('Unexpected token o in JSON at position 1'), { status: 400 })
        errorResponder({ error: vi.fn() })(bad, {}, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ error: 'Bad request' })
    })

    it('leaves an answer that already started alone', () => {
        const res = response(); res.headersSent = true
        const next = vi.fn()
        const error = new Error('late')
        errorResponder({ error: vi.fn() })(error, {}, res, next)
        expect(res.status).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(error)
    })
})
