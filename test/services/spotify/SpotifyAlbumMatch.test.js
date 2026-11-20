/**
 * F55, slice 1 - the Spotify album used for popularity is the album asked for (UAT-184), by the
 * one identity rule: no "first result when nothing matches", no "one title contains the other".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { getAccessToken: vi.fn(async () => 'token') } }))

import { SpotifyService } from '../../../public/js/services/SpotifyService.js'

const STP = 'Stone Temple Pilots'
const item = (id, name, artists = [STP], release_date = '1992-09-29') => ({ id, name, release_date, artists: artists.map(n => ({ name: n })) })
const found = (...items) => ({ albums: { items } })
const isArtistOnly = (endpoint) => !decodeURIComponent(endpoint).includes('album:')

describe('SpotifyService.searchAlbum', () => {
    let fetchSpy

    beforeEach(() => {
        fetchSpy = vi.spyOn(SpotifyService, '_fetch')
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => vi.restoreAllMocks())

    it('«Core» asked for and only «Shangri-La Dee Da» found: no album, never the first result', async () => {
        fetchSpy.mockResolvedValue(found(item('s-shangri', 'Shangri-La Dee Da')))

        expect(await SpotifyService.searchAlbum(STP, 'Core')).toBeNull()
    })

    it('«Core» is not «Core Memories», and the same title by another artist is not it either', async () => {
        fetchSpy.mockResolvedValue(found(item('s-mem', 'Core Memories'), item('s-other', 'Core', ['Persefone'])))

        expect(await SpotifyService.searchAlbum(STP, 'Core')).toBeNull()
    })

    it('picks the album asked for among the results, the plain album before its edition', async () => {
        fetchSpy.mockResolvedValue(found(item('s-shangri', 'Shangri-La Dee Da'), item('s-deluxe', 'Core (Super Deluxe Edition)'), item('s-core', 'Core')))

        expect((await SpotifyService.searchAlbum(STP, 'Core')).id).toBe('s-core')
    })

    it('an edition asked for finds the plain album: «Core (Remastered)» is «Core»', async () => {
        fetchSpy.mockResolvedValue(found(item('s-core', 'Core')))

        expect((await SpotifyService.searchAlbum(STP, 'Core (Remastered)')).id).toBe('s-core')
    })

    it('an album by two artists is found by the name the catalog gives the pair', async () => {
        fetchSpy.mockResolvedValue(found(item('s-sand', 'Raising Sand', ['Robert Plant', 'Alison Krauss'])))

        expect((await SpotifyService.searchAlbum('Robert Plant & Alison Krauss', 'Raising Sand')).id).toBe('s-sand')
    })

    it('when the search by title finds nothing, the albums of the artist are listed and only the album asked for is taken', async () => {
        fetchSpy.mockImplementation(async (endpoint) => (isArtistOnly(endpoint)
            ? found(item('s-purple', 'Purple'), item('s-core', 'Core'))
            : found()))

        expect((await SpotifyService.searchAlbum(STP, 'Core')).id).toBe('s-core')
    })

    it('the albums of the artist without the album asked for: no album', async () => {
        fetchSpy.mockImplementation(async (endpoint) => (isArtistOnly(endpoint) ? found(item('s-purple', 'Purple'), item('s-mem', 'Core Memories')) : found()))

        expect(await SpotifyService.searchAlbum(STP, 'Core')).toBeNull()
    })

    it('the second tier of the rule: «No Quarter» finds the only «No Quarter: … Unledded»; never before «The Wall» itself, never between two', async () => {
        const pair = ['Jimmy Page', 'Robert Plant']
        fetchSpy.mockResolvedValueOnce(found(item('s-unledded', 'No Quarter: Jimmy Page & Robert Plant Unledded', pair)))
        expect((await SpotifyService.searchAlbum('Jimmy Page & Robert Plant', 'No Quarter')).id).toBe('s-unledded')

        fetchSpy.mockResolvedValueOnce(found(item('s-berlin', 'The Wall: Live in Berlin', ['Pink Floyd']), item('s-wall', 'The Wall', ['Pink Floyd'])))
        expect((await SpotifyService.searchAlbum('Pink Floyd', 'The Wall')).id).toBe('s-wall')

        fetchSpy.mockResolvedValue(found(item('s-70', 'Greatest Hits: 1970-2002', ['Elton John']), item('s-v2', 'Greatest Hits: Vol 2', ['Elton John'])))
        expect(await SpotifyService.searchAlbum('Elton John', 'Greatest Hits')).toBeNull()
    })

    it('albumPopularity says «not found» for an album Spotify does not have, and does not read tracks of another', async () => {
        fetchSpy.mockResolvedValue(found(item('s-shangri', 'Shangri-La Dee Da')))
        const tracks = vi.spyOn(SpotifyService, 'getAlbumTracksWithPopularity')

        expect(await SpotifyService.albumPopularity(STP, 'Core')).toEqual({ found: false, reason: 'not_found' })
        expect(tracks).not.toHaveBeenCalled()
    })
})
