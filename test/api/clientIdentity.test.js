/**
 * F55, slice 1 - the API client accepts an album only when it is the album asked for (UAT-184):
 * the answer of the AI search (POST /api/generate). The Apple Music search of the old path
 * (fetchAlbum) and its cache left with F56: the blend and the playlists ask the album load.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../public/js/services/AlbumLoader.js', () => ({ albumLoader: {} }))

import { APIClient } from '../../public/js/api/client.js'

const STP = 'Stone Temple Pilots'
const answer = (data, outcome = 'found') => ({ ok: true, status: 200, statusText: 'OK', headers: { get: () => null }, json: async () => ({ data, outcome }) })
const aiAlbum = (title, artist = STP) => ({ title, artist, year: 1992, tracks: [{ title: 'One' }] })

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

    describe('the answer of the AI search, one answer with nothing beside it', () => {
        it('is the title asked for with a subtitle: accepted as the only answer, and the album says how', async () => {
            fetchMock.mockResolvedValue(answer(aiAlbum('No Quarter: Jimmy Page & Robert Plant Unledded', 'Jimmy Page & Robert Plant')))

            const album = await client._fetchAlbumFromAPI('Jimmy Page & Robert Plant - No Quarter')

            expect(album.title).toBe('No Quarter: Jimmy Page & Robert Plant Unledded')
            expect(album.metadata.identityReason).toBe('title-before-subtitle')
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })

        it('is a longer title asked for, answered by the short one: not accepted', async () => {
            fetchMock.mockResolvedValue(answer(aiAlbum('The Wall', 'Pink Floyd')))

            expect(await client._fetchAlbumFromAPI('Pink Floyd - The Wall: Live in Berlin')).toBeNull()
        })

        it('is the album asked for: the album says it was the exact title', async () => {
            fetchMock.mockResolvedValue(answer(aiAlbum('The Wall', 'Pink Floyd')))

            const album = await client._fetchAlbumFromAPI('Pink Floyd - The Wall')

            expect(album.metadata.identityReason).toBe('exact-title')
        })
    })

    it('has no way of its own to find an album for a screen: the album load is the only loader (F56)', () => {
        expect(client.fetchAlbum).toBeUndefined()
        expect(client.fetchMultipleAlbums).toBeUndefined()
        expect(client.BEAenrichAlbum).toBeUndefined()
    })
})
