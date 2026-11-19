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
