/**
 * F67 - the scan of an artist: the catalog answers first and has a deadline; the paid AI list
 * comes after, and only then are the albums classified again.
 * F57 - the albums are classified by the one classifier (models/albumType.js): an electronic album
 * wants the AI list; without it the album is a studio album, with it the album must be in it.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../../public/js/services/MusicKitService.js', () => ({
    musicKitService: { getArtistAlbums: vi.fn(), getArtworkUrl: () => null }
}))
vi.mock('../../../public/js/api/serverFetch.js', () => ({ serverFetch: vi.fn() }))
import { musicKitService } from '../../../public/js/services/MusicKitService.js'
import { serverFetch } from '../../../public/js/api/serverFetch.js'
import { AlbumSearchService } from '../../../public/js/services/album-search/AlbumSearchService.js'
import { CATALOG_DEADLINE_MS } from '../../../public/js/models/scanState.js'
import { isDeadlineError } from '../../../public/js/utils/deadline.js'

const answer = (status, body) => ({ ok: status < 300, status, headers: { get: () => null }, json: async () => body })
const raw = (title, electronic = false) => ({
    appleMusicId: title, title, artist: 'Orbital', year: '1993', trackCount: 10,
    raw: { attributes: { name: title, trackCount: 10, genreNames: electronic ? ['Electronic', 'Music'] : ['Rock', 'Music'] } }
})
const deferred = () => {
    let resolve
    const promise = new Promise(r => { resolve = r })
    return { promise, resolve }
}

describe('AlbumSearchService.scanArtist (F67)', () => {
    let service

    beforeEach(() => {
        musicKitService.getArtistAlbums.mockReset()
        serverFetch.mockReset()
        service = new AlbumSearchService()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('gives the albums as soon as the catalog answers, without waiting for the AI list', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Plain'), raw('Brown Album', true), raw('Odd One', true)])
        const ai = deferred()
        serverFetch.mockReturnValue(ai.promise)

        const { albums, reclassified } = await service.scanArtist('Orbital')

        expect(albums.map(a => [a.title, a.type, a.typeReason])).toEqual([
            ['Plain', 'Album', 'default-studio'], ['Brown Album', 'Album', 'electronic-no-ai-list'], ['Odd One', 'Album', 'electronic-no-ai-list']
        ])
        expect(reclassified).toBeInstanceOf(Promise)

        ai.resolve(answer(200, { data: { albums: ['Brown Album'] }, outcome: 'found' }))
        const again = await reclassified
        expect(again.map(a => [a.title, a.type, a.typeReason])).toEqual([
            ['Plain', 'Album', 'default-studio'], ['Brown Album', 'Album', 'ai-list'], ['Odd One', 'Uncategorized', 'electronic-not-in-ai-list']
        ])
        expect(serverFetch).toHaveBeenCalledTimes(1)
    })

    it('does not ask the AI at all when no album needs it', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Plain')])

        const { albums, reclassified } = await service.scanArtist('Orbital')

        expect(albums).toHaveLength(1)
        expect(reclassified).toBeNull()
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('uses a remembered AI list at once: one pass, no second ask', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Brown Album', true)])
        serverFetch.mockResolvedValue(answer(200, { data: { albums: ['Brown Album'] }, outcome: 'found' }))
        await (await service.scanArtist('Orbital')).reclassified

        const { albums, reclassified } = await service.scanArtist('Orbital')

        expect(albums[0]).toMatchObject({ type: 'Album', typeReason: 'ai-list' })
        expect(reclassified).toBeNull()
        expect(serverFetch).toHaveBeenCalledTimes(1)
    })

    it('when the AI list does not come, the second pass gives nothing: the first albums stay', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Brown Album', true)])
        serverFetch.mockResolvedValue(answer(502, { error: { code: 'upstream_failed', retryable: true } }))

        const { albums, reclassified } = await service.scanArtist('Orbital')

        expect(albums[0]).toMatchObject({ type: 'Album', typeReason: 'electronic-no-ai-list' })
        expect(await reclassified).toBeNull()
    })

    it('when the AI list is empty, the second pass gives nothing', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Brown Album', true)])
        serverFetch.mockResolvedValue(answer(200, { data: { albums: [] }, outcome: 'not_found' }))

        expect(await (await service.scanArtist('Orbital')).reclassified).toBeNull()
    })

    it('an AI list the AI answered as empty is remembered: the next scan does not ask again', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Brown Album', true)])
        serverFetch.mockResolvedValue(answer(200, { data: { albums: [] }, outcome: 'not_found' }))
        await (await service.scanArtist('Orbital')).reclassified

        const { albums, reclassified } = await service.scanArtist('Orbital')

        expect(albums[0].type).toBe('Album')
        expect(reclassified).toBeNull()
        expect(serverFetch).toHaveBeenCalledTimes(1)
    })

    it('UAT-185: a hip-hop discography with "Hardcore Rap" never asks the AI and has no unknown album', async () => {
        const kendrick = (title, genreNames, trackCount) => ({ appleMusicId: title, title, artist: 'Kendrick Lamar', trackCount, raw: { attributes: { name: title, genreNames, trackCount } } })
        musicKitService.getArtistAlbums.mockResolvedValue([
            kendrick('To Pimp a Butterfly', ['Hip-Hop/Rap', 'Music', 'Hardcore Rap', 'West Coast Rap', 'Gangsta Rap', 'Rap'], 16),
            kendrick('good kid, m.A.A.d city (Deluxe Version)', ['Hip-Hop/Rap', 'Music', 'Gangsta Rap', 'Rap', 'Hardcore Rap', 'West Coast Rap'], 18),
            kendrick('DAMN.', ['Hip-Hop/Rap', 'Music', 'Rap', 'West Coast Rap'], 14)
        ])

        const { albums, reclassified } = await service.scanArtist('Kendrick Lamar')

        expect(albums.map(a => a.type)).toEqual(['Album', 'Album', 'Album'])
        expect(reclassified).toBeNull()
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('titles in another alphabet are not grouped into one album', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('宇宙 日本 世田谷'), raw('空中キャンプ'), raw('空中キャンプ (Remastered)')])

        const { albums } = await service.scanArtist('Fishmans')

        expect(albums.map(a => a.title)).toEqual(['宇宙 日本 世田谷', '空中キャンプ'])
        expect(albums[1].variants).toHaveLength(2)
    })

    it('no album in the catalog: an empty list and nothing to wait for', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([])

        expect(await service.scanArtist('Nobody')).toEqual({ albums: [], reclassified: null })
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('tries the alternative name when the first gives nothing', async () => {
        musicKitService.getArtistAlbums.mockResolvedValueOnce([]).mockResolvedValueOnce([raw('Plain')])
        vi.spyOn(service.normalizer, 'getAlternatives').mockReturnValue(['Orbital', 'The Orbital'])

        const { albums } = await service.scanArtist('Orbital')

        expect(albums).toHaveLength(1)
        expect(musicKitService.getArtistAlbums).toHaveBeenLastCalledWith('The Orbital')
    })

    it('a catalog that does not answer fails by deadline, with a named constant', async () => {
        vi.useFakeTimers()
        musicKitService.getArtistAlbums.mockReturnValue(new Promise(() => {}))

        const seen = service.scanArtist('Orbital').catch(error => error)
        await vi.advanceTimersByTimeAsync(CATALOG_DEADLINE_MS - 1)
        let settled = false
        seen.then(() => { settled = true })
        await Promise.resolve()
        expect(settled).toBe(false)

        await vi.advanceTimersByTimeAsync(1)
        expect(isDeadlineError(await seen)).toBe(true)
        expect(CATALOG_DEADLINE_MS).toBe(15000)
    })

    it('a catalog that fails passes its failure on', async () => {
        musicKitService.getArtistAlbums.mockRejectedValue(new Error('403'))

        await expect(service.scanArtist('Orbital')).rejects.toThrow('403')
    })
})
