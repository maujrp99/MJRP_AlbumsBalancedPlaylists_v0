/**
 * F69 (UAT-206) - what SpotifyService answers about the popularity of an album.
 * "Spotify has no such album" is an answer; a call that failed is thrown, typed, and never
 * read as "no album".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../../public/js/services/SpotifyAuthService.js', () => ({
    SpotifyAuthService: { getAccessToken: vi.fn(async () => 'token'), renewAccess: vi.fn(async () => null) }
}))

import { SpotifyService } from '../../../public/js/services/SpotifyService.js'
import { SpotifyAuthService } from '../../../public/js/services/SpotifyAuthService.js'
import { SpotifyRateLimitError, SpotifyReconnectError } from '../../../public/js/services/spotify/spotifyErrors.js'

const STP = 'Stone Temple Pilots'
const item = (id, name) => ({ id, name, release_date: '1992-09-29', artists: [{ name: STP }], external_urls: { spotify: `https://open.spotify.com/album/${id}` }, images: [{ url: 'cover.jpg' }] })
const found = (...items) => ({ albums: { items } })
const isArtistOnly = (endpoint) => !decodeURIComponent(endpoint).includes('album:')
const track = (n) => ({ id: `t${n}`, name: `Track ${n}`, uri: `spotify:track:t${n}`, popularity: n })
const response = (status, body = {}, headers = {}) => ({
    status, ok: status >= 200 && status < 300, json: async () => body, headers: { get: (name) => headers[name] ?? null }
})

describe('SpotifyService.albumPopularity (F69)', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

    it('Spotify has the album: its id, address, average popularity and the popularity of each track', async () => {
        vi.spyOn(SpotifyService, '_fetch').mockImplementation(async (endpoint) => {
            if (endpoint.startsWith('/search')) return found(item('s-core', 'Core'))
            if (endpoint.startsWith('/albums/')) return { tracks: { items: [{ id: 't10' }, { id: 't30' }] } }
            return { tracks: [track(10), track(30)] }
        })

        expect(await SpotifyService.albumPopularity(STP, 'Core')).toEqual({
            found: true,
            data: {
                spotifyId: 's-core',
                spotifyUrl: 'https://open.spotify.com/album/s-core',
                spotifyPopularity: 20,
                spotifyArtwork: 'cover.jpg',
                trackPopularity: [
                    { name: 'Track 10', popularity: 10, spotifyId: 't10', spotifyUri: 'spotify:track:t10' },
                    { name: 'Track 30', popularity: 30, spotifyId: 't30', spotifyUri: 'spotify:track:t30' }
                ]
            }
        })
    })

    it('Spotify answered and no album of it is the album asked for: not found, said as an answer', async () => {
        vi.spyOn(SpotifyService, '_fetch').mockResolvedValue(found(item('s-shangri', 'Shangri-La Dee Da')))

        expect(await SpotifyService.albumPopularity(STP, 'Core')).toEqual({ found: false, reason: 'not_found' })
    })

    it('the album is there and Spotify lists no track for it: an answer too, with its own reason', async () => {
        vi.spyOn(SpotifyService, '_fetch').mockImplementation(async (endpoint) =>
            (endpoint.startsWith('/search') ? found(item('s-core', 'Core')) : { tracks: { items: [] } }))

        expect(await SpotifyService.albumPopularity(STP, 'Core')).toEqual({ found: false, reason: 'no_tracks' })
    })

    it('the last, widest search failing is a failure: it is not "no candidates" any more', async () => {
        vi.spyOn(SpotifyService, '_fetch').mockImplementation(async (endpoint) => {
            if (isArtistOnly(endpoint)) throw new Error('Spotify API Error: 500')
            return found()
        })

        await expect(SpotifyService.albumPopularity(STP, 'Core')).rejects.toThrow('Spotify API Error: 500')
        await expect(SpotifyService.searchAlbum(STP, 'Core')).rejects.toThrow('Spotify API Error: 500')
    })

    it('reading the tracks failing is a failure, never "not found"', async () => {
        vi.spyOn(SpotifyService, '_fetch').mockImplementation(async (endpoint) => {
            if (endpoint.startsWith('/search')) return found(item('s-core', 'Core'))
            throw new TypeError('Failed to fetch')
        })

        await expect(SpotifyService.albumPopularity(STP, 'Core')).rejects.toThrow('Failed to fetch')
    })

    it('an album of more than 50 tracks is read in requests of 50', async () => {
        const ids = Array.from({ length: 120 }, (_, i) => ({ id: `t${i}` }))
        const fetchSpy = vi.spyOn(SpotifyService, '_fetch').mockImplementation(async (endpoint) => {
            if (endpoint.startsWith('/albums/')) return { tracks: { items: ids } }
            const asked = new URLSearchParams(endpoint.split('?')[1]).get('ids').split(',')
            return { tracks: asked.map(id => ({ id, name: id, uri: id, popularity: 1 })) }
        })

        expect(await SpotifyService.getAlbumTracksWithPopularity('s-box')).toHaveLength(120)
        expect(fetchSpy.mock.calls.filter(([endpoint]) => endpoint.startsWith('/tracks')).map(([endpoint]) =>
            new URLSearchParams(endpoint.split('?')[1]).get('ids').split(',').length)).toEqual([50, 50, 20])
    })

    it('Spotify says "wait" (429): the typed error, with the seconds it asked for; the load does not wait here', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => response(429, {}, { 'Retry-After': '7' })))
        const sleep = vi.spyOn(SpotifyService, '_sleep')

        const error = await SpotifyService.albumPopularity(STP, 'Core').catch(e => e)

        expect(error).toBeInstanceOf(SpotifyRateLimitError)
        expect(error.retryAfterSeconds).toBe(7)
        expect(sleep).not.toHaveBeenCalled()
    })

    it('the access is refused and cannot be renewed: the typed "connect again"', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => response(401)))

        await expect(SpotifyService.albumPopularity(STP, 'Core')).rejects.toBeInstanceOf(SpotifyReconnectError)
        expect(SpotifyAuthService.renewAccess).toHaveBeenCalled()
    })

    it('the old door that answered null for everything is gone', () => {
        expect(SpotifyService.enrichAlbumData).toBeUndefined()
    })
})
