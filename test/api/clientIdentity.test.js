/**
 * F55, slice 1 - the API client accepts an album only when it is the album asked for (UAT-184):
 * the answer of the AI search (POST /api/generate) and the Apple Music search of the old path
 * (fetchAlbum, still used by the blend and the playlists screens).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const musicKit = vi.hoisted(() => ({ searchAlbums: vi.fn(), getAlbumDetails: vi.fn(), getArtworkUrl: vi.fn(() => 'https://cover/600') }))
vi.mock('../../public/js/services/MusicKitService.js', () => ({ musicKitService: musicKit }))
vi.mock('../../public/js/services/AlbumLoader.js', () => ({ albumLoader: {} }))
vi.mock('../../public/js/cache/albumCache.js', () => ({ albumCache: { get: vi.fn(async () => null), set: vi.fn() } }))
vi.mock('../../public/js/helpers/BEAEnrichmentHelper.js', () => ({ enrichAlbum: vi.fn() }))
vi.mock('../../public/js/helpers/SpotifyEnrichmentHelper.js', () => ({ applyEnrichmentToAlbum: vi.fn() }))

import { APIClient } from '../../public/js/api/client.js'

const STP = 'Stone Temple Pilots'
const answer = (data, outcome = 'found') => ({ ok: true, status: 200, statusText: 'OK', headers: { get: () => null }, json: async () => ({ data, outcome }) })
const aiAlbum = (title, artist = STP) => ({ title, artist, year: 1992, tracks: [{ title: 'One' }] })
const hit = (id, name) => ({ id, attributes: { name, artistName: STP } })

describe('APIClient: only the album asked for', () => {
    let client
    let fetchMock

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        client = new APIClient()
        vi.spyOn(client, 'delay').mockResolvedValue()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        musicKit.searchAlbums.mockReset()
        musicKit.getAlbumDetails.mockReset()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    describe('the answer of the AI search', () => {
        it('is the album asked for: accepted', async () => {
            fetchMock.mockResolvedValue(answer(aiAlbum('Core')))

            expect(await client._fetchAlbumFromAPI('Stone Temple Pilots - Core')).toMatchObject({ title: 'Core', artist: STP })
        })

        it('is an edition of the album asked for: accepted', async () => {
            fetchMock.mockResolvedValue(answer(aiAlbum('Core (Deluxe Edition)')))

            expect(await client._fetchAlbumFromAPI({ artist: STP, title: 'Core' })).toMatchObject({ title: 'Core (Deluxe Edition)' })
        })

        it('is another album of the artist: "the server has no such album" (null), and it is not asked again', async () => {
            fetchMock.mockResolvedValue(answer(aiAlbum('Shangri-La Dee Da')))

            expect(await client._fetchAlbumFromAPI('Stone Temple Pilots - Core')).toBeNull()
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })

        it('is the same title by another artist: null', async () => {
            fetchMock.mockResolvedValue(answer(aiAlbum('Core', 'Persefone')))

            expect(await client._fetchAlbumFromAPI('Stone Temple Pilots - Core')).toBeNull()
        })
    })

    describe('the Apple Music search of fetchAlbum', () => {
        const details = { id: 'apple-core', title: 'Core', artist: STP, year: '1992', artworkTemplate: 'tpl', tracks: [{ id: 't1', title: 'One', trackNumber: 1 }] }

        it('«Core» asked for, «Shangri-La Dee Da» first in the results: loads «Core»', async () => {
            musicKit.searchAlbums.mockResolvedValue([hit('apple-shangri', 'Shangri-La Dee Da'), hit('apple-core', 'Core')])
            musicKit.getAlbumDetails.mockResolvedValue(details)

            const album = await client.fetchAlbum('Stone Temple Pilots - Core')

            expect(musicKit.searchAlbums).toHaveBeenCalledWith(STP, 'Core', 5)
            expect(musicKit.getAlbumDetails).toHaveBeenCalledWith('apple-core')
            expect(album.title).toBe('Core')
        })

        it('only another album in the results: it is not loaded; the second source is asked, and its wrong album is refused too', async () => {
            musicKit.searchAlbums.mockResolvedValue([hit('apple-shangri', 'Shangri-La Dee Da')])
            fetchMock.mockResolvedValue(answer(aiAlbum('Shangri-La Dee Da')))

            expect(await client.fetchAlbum('Stone Temple Pilots - Core')).toBeNull()
            expect(musicKit.getAlbumDetails).not.toHaveBeenCalled()
        })
    })
})
