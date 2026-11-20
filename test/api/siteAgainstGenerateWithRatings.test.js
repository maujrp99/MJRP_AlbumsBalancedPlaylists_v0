/**
 * F52, slice 5 - the site against the server of slice 5. POST /api/generate carries `data.ratings`
 * (what happened to each source of ratings). The answer is built by the server's own builder
 * (lib/outcome.js).
 *
 * In slice 5 the app ignored the field. Since F70 (UAT-210) it reads it: the album it builds is
 * the same as without the field but for two things - what the server said stays on the album
 * (`metadata.ratingsOutcome`), and the page of the ratings source stays only when the server said
 * the ratings were found (test/api/generateRatingsOutcome.test.js has the cases one by one).
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

    const both = async (ratings) => {
        fetchMock.mockResolvedValueOnce(wire(answeredAlbum())).mockResolvedValueOnce(wire({ ...answeredAlbum(), ratings }))
        const without = plain(await client._fetchAlbumFromAPI('Artist - Album'))
        const withRatings = plain(await client._fetchAlbumFromAPI('Artist - Album'))
        return { without, withRatings }
    }

    it('the ratings were found: the same album, and what the server said stays on it', async () => {
        const ratings = { acclaim: 'found', popularity: 'not_asked', aiRanking: 'not_asked' }
        const { without, withRatings } = await both(ratings)

        expect(withRatings).toEqual({ ...without, metadata: { ...without.metadata, ratingsOutcome: ratings } })
        expect(withRatings.bestEverUrl).toBe('https://www.besteveralbums.com/thechart.php?a=1')
        expect(withRatings.tracks.map(t => t.title)).toEqual(['Two', 'One'])
    })

    it('every source failed: the same album without the page of the ratings source, and what the server said stays on it', async () => {
        const ratings = { acclaim: 'failed', popularity: 'failed', aiRanking: 'failed' }
        const { without, withRatings } = await both(ratings)
        const { bestEverUrl, ...withoutThePage } = without

        expect(bestEverUrl).toBe('https://www.besteveralbums.com/thechart.php?a=1')
        expect(withRatings).toEqual({ ...withoutThePage, metadata: { ...without.metadata, ratingsOutcome: ratings } })
        expect(withRatings.tracks.map(t => t.title)).toEqual(['Two', 'One'])
    })
})
