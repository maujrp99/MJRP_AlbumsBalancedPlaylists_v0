/**
 * F59, slice C - every call from the app to its own server carries the login of the person,
 * from one place (the server answers only to a signed-in person).
 */
import { describe, it, expect, vi } from 'vitest'
import { createServerFetch } from '../../public/js/api/serverFetch.js'

const okFetch = () => vi.fn(async () => ({ ok: true, status: 200 }))

describe('createServerFetch', () => {
    it('adds the login of the person to the call, keeping what the call already had', async () => {
        const fetchImpl = okFetch()
        const serverFetch = createServerFetch({ getIdToken: async () => 'login-text', fetchImpl })

        await serverFetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })

        const [url, init] = fetchImpl.mock.calls[0]
        expect(url).toBe('/api/generate')
        expect(init.method).toBe('POST')
        expect(init.body).toBe('{}')
        expect(init.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer login-text' })
    })

    it('does not change the object it was given', async () => {
        const init = { method: 'POST', headers: { 'Content-Type': 'application/json' } }
        await createServerFetch({ getIdToken: async () => 't', fetchImpl: okFetch() })('/api/x', init)
        expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    })

    it('with nobody signed in, makes the call without a login (the server will say 401)', async () => {
        const fetchImpl = okFetch()
        await createServerFetch({ getIdToken: async () => null, fetchImpl })('/api/x')
        expect(fetchImpl.mock.calls[0][1].headers).toEqual({})
    })

    it('when the login cannot be read, still makes the call without it', async () => {
        const fetchImpl = okFetch()
        const serverFetch = createServerFetch({ getIdToken: async () => { throw new Error('offline') }, fetchImpl })
        await serverFetch('/api/x', { method: 'POST' })
        expect(fetchImpl).toHaveBeenCalledTimes(1)
        expect(fetchImpl.mock.calls[0][1].headers).toEqual({})
    })

    it('asks for the login again on every call, so a renewed one is used', async () => {
        const getIdToken = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')
        const fetchImpl = okFetch()
        const serverFetch = createServerFetch({ getIdToken, fetchImpl })
        await serverFetch('/api/x'); await serverFetch('/api/x')
        expect(fetchImpl.mock.calls.map(call => call[1].headers.Authorization)).toEqual(['Bearer first', 'Bearer second'])
    })
})
