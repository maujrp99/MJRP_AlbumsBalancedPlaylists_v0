/**
 * F69 - the server's Spotify lookup (the popularity used as ranking when BestEverAlbums has few
 * ratings; reached by POST /api/generate through fetchRankingForAlbum) under the answer contract
 * of F52: "Spotify has no such album" is an outcome, "the server has no Spotify credentials" is
 * another, and a call that failed is thrown as an UpstreamError. Before, the three came back as
 * `{ error }`. No network: the HTTP client is injected.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { getSpotifyPopularityRanking, SPOTIFY_OUTCOMES } = require('../../server/lib/services/spotifyPopularity.js')
const { UpstreamError } = require('../../server/lib/outcome.js')

const STP = 'Stone Temple Pilots'
const album = { id: 's-core', name: 'Core', release_date: '1992-09-29', artists: [{ name: STP }], external_urls: { spotify: 'https://open.spotify.com/album/s-core' } }
const track = (n, popularity) => ({ id: `t${n}`, name: `Track ${n}`, popularity, track_number: n, duration_ms: 1000 })
const httpError = (status) => Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } })

/** An HTTP double: the search lists `albums`, the album lists its tracks, the tracks have popularity. */
const httpWith = ({ albums = [album], tracks = [track(1, 10), track(2, 90)], fail = null } = {}) => ({
    get: vi.fn(async (url) => {
        if (fail) throw fail(url)
        if (url.endsWith('/search')) return { data: { albums: { items: albums } } }
        if (url.includes('/albums/')) return { data: { tracks: { items: tracks.map(t => ({ id: t.id })) } } }
        return { data: { tracks } }
    })
})
const ask = (http, getToken = async () => 'token') => getSpotifyPopularityRanking('Core', STP, { http, getToken })

describe('getSpotifyPopularityRanking (server): the answer contract of F52', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => vi.restoreAllMocks())

    it('Spotify has the album: found, with the tracks ordered by popularity', async () => {
        const result = await ask(httpWith())

        expect(result).toMatchObject({ outcome: SPOTIFY_OUTCOMES.FOUND, provider: 'Spotify', providerType: 'popularity', referenceUrl: 'https://open.spotify.com/album/s-core' })
        expect(result.evidence.map(e => [e.trackTitle, e.rating])).toEqual([['Track 2', 90], ['Track 1', 10]])
    })

    it('Spotify answered and has no such album: not found, and no `error`', async () => {
        const result = await ask(httpWith({ albums: [] }))

        expect(result).toEqual({ outcome: SPOTIFY_OUTCOMES.NOT_FOUND })
    })

    it('the album lists no track: not found either (Spotify answered, there is nothing to rank)', async () => {
        expect(await ask(httpWith({ tracks: [] }))).toEqual({ outcome: SPOTIFY_OUTCOMES.NOT_FOUND })
    })

    it('the server has no Spotify credentials: its own outcome, and Spotify is not asked', async () => {
        const http = httpWith()

        expect(await ask(http, async () => null)).toEqual({ outcome: SPOTIFY_OUTCOMES.NOT_CONFIGURED })
        expect(http.get).not.toHaveBeenCalled()
    })

    it.each([
        [500, 'upstream_failed'],
        [429, 'upstream_busy']
    ])('Spotify answers %i: thrown as %s, never read as "not found"', async (status, code) => {
        const error = await ask(httpWith({ fail: () => httpError(status) })).catch(e => e)

        expect(error).toBeInstanceOf(UpstreamError)
        expect(error.code).toBe(code)
    })

    it('the token could not be had (Spotify refused or was down): thrown, not "no credentials"', async () => {
        const error = await ask(httpWith(), async () => { throw httpError(503) }).catch(e => e)

        expect(error).toBeInstanceOf(UpstreamError)
    })

    it('a slow Spotify is a timeout', async () => {
        const slow = Object.assign(new Error('timeout of 8000ms exceeded'), { code: 'ECONNABORTED' })
        const error = await ask(httpWith({ fail: () => slow })).catch(e => e)

        expect(error.code).toBe('upstream_timeout')
    })
})
