/**
 * The second source of albums (POST /api/generate, paid AI): when it is asked again and when it is not.
 * F48, UAT-175: the retry used to throw a ReferenceError before running, hiding the real error.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../public/js/services/MusicKitService.js', () => ({ musicKitService: {} }))
vi.mock('../../public/js/services/AlbumLoader.js', () => ({ albumLoader: {} }))
vi.mock('../../public/js/cache/albumCache.js', () => ({ albumCache: { get: vi.fn(), set: vi.fn() } }))

import { APIClient, ApiError } from '../../public/js/api/client.js'

const okResponse = (body) => ({ ok: true, status: 200, statusText: 'OK', json: async () => body })
const failResponse = (status, statusText = '') => ({ ok: false, status, statusText, json: async () => ({}) })
const serverAlbum = { data: { title: 'Album', artist: 'Artist', tracks: [{ title: 'One' }] } }

describe('APIClient._fetchAlbumFromAPI (F48, UAT-175)', () => {
    let client
    let fetchMock

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        client = new APIClient()
        client.random = () => 1
        vi.spyOn(client, 'delay').mockResolvedValue()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('tries again after a 5xx answer and returns the album when the server recovers', async () => {
        fetchMock.mockResolvedValueOnce(failResponse(503, 'Service Unavailable')).mockResolvedValueOnce(okResponse(serverAlbum))

        const album = await client._fetchAlbumFromAPI('Artist - Album')

        expect(album).toMatchObject({ title: 'Album', artist: 'Artist' })
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(client.delay).toHaveBeenCalledTimes(1)
    })

    it('tries again after a network failure, with a longer wait each time, and then throws the real error', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

        const error = await client._fetchAlbumFromAPI('Artist - Album').catch(e => e)

        expect(fetchMock).toHaveBeenCalledTimes(3)
        expect(client.delay.mock.calls.map(call => call[0])).toEqual([1000, 2000])
        expect(error).toBeInstanceOf(ApiError)
        expect(error.kind).toBe('network')
        expect(error.message).toContain('Failed to fetch')
    })

    it('gives up after two new attempts on a 5xx and the error carries the status', async () => {
        fetchMock.mockResolvedValue(failResponse(500, 'Internal Server Error'))

        const error = await client._fetchAlbumFromAPI('Artist - Album').catch(e => e)

        expect(fetchMock).toHaveBeenCalledTimes(3)
        expect(error).toBeInstanceOf(ApiError)
        expect(error.status).toBe(500)
        expect(error.message).toContain('500')
    })

    it.each([400, 402, 404, 429])('never tries again on a %i: one request, and the error carries the status', async (status) => {
        fetchMock.mockResolvedValue(failResponse(status, 'Nope'))

        const error = await client._fetchAlbumFromAPI('Artist - Album').catch(e => e)

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(client.delay).not.toHaveBeenCalled()
        expect(error).toBeInstanceOf(ApiError)
        expect(error.status).toBe(status)
    })

    it('sends the same text query on every attempt when the query is an object', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

        await client._fetchAlbumFromAPI({ artist: 'Artist', title: 'Album' }).catch(() => {})

        const sent = fetchMock.mock.calls.map(call => JSON.parse(call[1].body).albumQuery)
        expect(sent).toEqual(['Artist - Album', 'Artist - Album', 'Artist - Album'])
    })

    it('does not ask again when the server took too long: the paid call may still be running', async () => {
        fetchMock.mockImplementation((url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
        }))
        client.serverTimeoutMs = 5

        const error = await client._fetchAlbumFromAPI('Artist - Album').catch(e => e)

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(error).toBeInstanceOf(ApiError)
        expect(error.kind).toBe('timeout')
    })
})

/**
 * F52, slice 1 - the same calls against the NEW server ({ data, outcome } / { error: { code, retryable } }).
 * The tests above stay as they were: they are the server before F52 (errors with no readable code).
 */
const newOk = (data, outcome = 'found') => okResponse({ data, outcome })
const newFail = (status, code, retryable, headers = {}) => ({
    ok: false, status, statusText: '', headers: { get: (name) => headers[name] ?? null }, json: async () => ({ error: { code, retryable } })
})

describe('APIClient against the new server (F52)', () => {
    let client
    let fetchMock

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        client = new APIClient()
        client.random = () => 1
        vi.spyOn(client, 'delay').mockResolvedValue()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    describe('POST /generate: asked again by `retryable`, never by the status alone', () => {
        it('reads the album of { data, outcome: "found" }', async () => {
            fetchMock.mockResolvedValue(newOk(serverAlbum.data))
            expect(await client._fetchAlbumFromAPI('Artist - Album')).toMatchObject({ title: 'Album', artist: 'Artist' })
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })

        it('"the server has no such album" is null, not a broken album', async () => {
            fetchMock.mockResolvedValue(newOk(null, 'not_found'))
            expect(await client._fetchAlbumFromAPI('Artist - Album')).toBeNull()
        })

        it('a passing failure of the provider (retryable: true) is asked again', async () => {
            fetchMock.mockResolvedValueOnce(newFail(502, 'upstream_failed', true)).mockResolvedValueOnce(newOk(serverAlbum.data))
            expect(await client._fetchAlbumFromAPI('Artist - Album')).toMatchObject({ title: 'Album' })
            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        it.each([
            [424, 'upstream_failed'], // billing, a refused request, an unusable answer
            [424, 'upstream_busy'], // quota
            [500, 'internal'], // a 5xx that says "do not ask again": the status alone would have asked
            [503, 'internal'],
            [429, 'rate_limited'],
            [401, 'unauthorized']
        ])('%i %s with retryable: false is one paid call, never three', async (status, code) => {
            fetchMock.mockResolvedValue(newFail(status, code, false))

            const error = await client._fetchAlbumFromAPI('Artist - Album').catch(e => e)

            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(client.delay).not.toHaveBeenCalled()
            expect(error).toBeInstanceOf(ApiError)
            expect(error).toMatchObject({ status, code, retryable: false })
        })

        it('a 4xx that says retryable: true IS asked again: the field decides', async () => {
            fetchMock.mockResolvedValue(newFail(424, 'upstream_failed', true))
            await client._fetchAlbumFromAPI('Artist - Album').catch(() => {})
            expect(fetchMock).toHaveBeenCalledTimes(3)
        })

        it('the error of our own limit and of our own door carries the hold for the album load', async () => {
            fetchMock.mockResolvedValue(newFail(429, 'rate_limited', false, { 'Retry-After': '30' }))
            const limited = await client._fetchAlbumFromAPI('Artist - Album').catch(e => e)
            expect(limited.hold).toEqual({ reason: 'rate_limited', retryAfterMs: 30000 })

            fetchMock.mockResolvedValue(newFail(401, 'unauthorized', false))
            const refused = await client._fetchAlbumFromAPI('Artist - Album').catch(e => e)
            expect(refused.hold).toEqual({ reason: 'unauthorized' })
        })
    })

    describe('POST /generate against the server before F52', () => {
        it('the provider\'s 402, 429 and 401 passed on raw: one call, and nothing for the load to hold', async () => {
            for (const status of [402, 429, 401]) {
                fetchMock.mockReset()
                fetchMock.mockResolvedValue({ ok: false, status, json: async () => ({ error: { code: status, message: 'provider text' } }) })
                const error = await client._fetchAlbumFromAPI('Artist - Album').catch(e => e)
                expect(fetchMock).toHaveBeenCalledTimes(1)
                expect(error).toMatchObject({ status, retryable: false, hold: null })
            }
        })

        it('the album answered bare, with no { data }, is still read', async () => {
            fetchMock.mockResolvedValue(okResponse(serverAlbum.data))
            expect(await client._fetchAlbumFromAPI('Artist - Album')).toMatchObject({ title: 'Album' })
        })
    })

    describe('POST /enrich-album', () => {
        const ratings = { bestEverInfo: { url: 'https://bea/1' }, trackRatings: [{ title: 'One', rating: 90 }] }
        const albumData = { title: 'Album', artist: 'Artist', tracks: [] }

        it.each(['found', 'not_found', 'no_ratings'])('says what the server said: %s', async (outcome) => {
            fetchMock.mockResolvedValue(newOk(ratings, outcome))
            expect(await client.requestRatings(albumData)).toEqual({ kind: outcome, data: ratings })
        })

        it('a 200 without outcome (the server before F52) is "legacy": the data, and no word on whether the source has none', async () => {
            fetchMock.mockResolvedValue(okResponse({ data: ratings }))
            expect(await client.requestRatings(albumData)).toEqual({ kind: 'legacy', data: ratings })
            fetchMock.mockResolvedValue(okResponse({}))
            expect(await client.requestRatings(albumData)).toEqual({ kind: 'legacy', data: {} })
        })

        it('a failure is thrown with its code, from the new server and from the old one', async () => {
            fetchMock.mockResolvedValue(newFail(504, 'upstream_timeout', true))
            await expect(client.requestRatings(albumData)).rejects.toMatchObject({ name: 'ApiError', code: 'upstream_timeout', status: 504 })

            fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'Internal server error' }) })
            await expect(client.requestRatings(albumData)).rejects.toMatchObject({ name: 'ApiError', status: 500 })

            fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
            await expect(client.requestRatings(albumData)).rejects.toMatchObject({ name: 'ApiError', kind: 'network' })
        })

        it('is asked once: the album load decides when to ask again', async () => {
            fetchMock.mockResolvedValue(newFail(502, 'upstream_failed', true))
            await client.requestRatings(albumData).catch(() => {})
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })
    })
})
