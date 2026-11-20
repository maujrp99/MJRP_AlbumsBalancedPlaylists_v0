/**
 * F52, slice 5 - today's site against the server of slice 5. POST /api/generate now carries
 * `data.ratings` (what happened to each source of ratings). The app was not changed in this slice:
 * it reads the album field by field, so the new field is ignored and the album it builds is the
 * same with and without it. The answer is built by the server's own builder (lib/outcome.js).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRequire } from 'node:module'

vi.mock('../../public/js/services/MusicKitService.js', () => ({ musicKitService: {} }))
vi.mock('../../public/js/services/AlbumLoader.js', () => ({ albumLoader: {} }))
vi.mock('../../public/js/cache/albumCache.js', () => ({ albumCache: { get: vi.fn(), set: vi.fn() } }))

import { APIClient } from '../../public/js/api/client.js'

const require = createRequire(import.meta.url)
const { success, bodyOf } = require('../../server/lib/outcome.js')

const answeredAlbum = () => ({
    title: 'Album',
    artist: 'Artist',
    year: 1999,
    tracks: [{ id: 't1', title: 'One', rank: 2, rating: 70 }, { id: 't2', title: 'Two', rank: 1, rating: 90 }],
    tracksByAcclaim: [{ id: 't2', title: 'Two', rank: 1, rating: 90 }, { id: 't1', title: 'One', rank: 2, rating: 70 }],
    rankingSources: [{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: 'https://www.besteveralbums.com/thechart.php?a=1' }],
    bestEverUrl: 'https://www.besteveralbums.com/thechart.php?a=1'
})
const wire = (data) => ({ ok: true, status: 200, statusText: 'OK', json: async () => bodyOf(success(data)) })
/** The album the app builds, without the time it was fetched at. */
const plain = (album) => {
    const copy = JSON.parse(JSON.stringify(album))
    delete copy.metadata.fetchedAt
    return copy
}

describe('today\'s site reads an album of POST /api/generate that carries `ratings`', () => {
    let client
    let fetchMock

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        client = new APIClient()
        vi.spyOn(console, 'debug').mockImplementation(() => {})
    })
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it.each([
        ['every source failed', { acclaim: 'failed', popularity: 'failed', aiRanking: 'failed' }],
        ['the ratings were found', { acclaim: 'found', popularity: 'not_asked', aiRanking: 'not_asked' }]
    ])('%s: the album is the same as without the field', async (name, ratings) => {
        fetchMock.mockResolvedValueOnce(wire(answeredAlbum())).mockResolvedValueOnce(wire({ ...answeredAlbum(), ratings }))

        const without = await client._fetchAlbumFromAPI('Artist - Album')
        const withRatings = await client._fetchAlbumFromAPI('Artist - Album')

        expect(plain(withRatings)).toEqual(plain(without))
        expect(withRatings).toMatchObject({ title: 'Album', artist: 'Artist' })
        expect(withRatings.tracks.map(t => t.title)).toEqual(['Two', 'One'])
    })
})
