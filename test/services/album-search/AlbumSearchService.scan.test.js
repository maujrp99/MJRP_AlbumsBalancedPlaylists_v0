/**
 * F67 - the scan of an artist: the catalog answers first and has a deadline; the paid AI list
 * comes after, and only then are the albums classified again.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../../public/js/services/MusicKitService.js', () => ({
    musicKitService: { getArtistAlbums: vi.fn(), getArtworkUrl: () => null }
}))
vi.mock('../../../public/js/api/serverFetch.js', () => ({ serverFetch: vi.fn() }))
// The classifier of the test: an album marked `needsAi` asks for the AI list and is an Album only when the list has it
vi.mock('../../../public/js/services/album-search/AlbumTypeClassifier.js', () => ({
    albumTypeClassifier: {
        classify: vi.fn(async (album, context) => {
            if (!album.needsAi) return 'Album'
            const list = await context.getAiList()
            return list.includes(album.title) ? 'Album' : 'Uncategorized'
        })
    }
}))

import { musicKitService } from '../../../public/js/services/MusicKitService.js'
import { serverFetch } from '../../../public/js/api/serverFetch.js'
import { AlbumSearchService } from '../../../public/js/services/album-search/AlbumSearchService.js'
import { CATALOG_DEADLINE_MS } from '../../../public/js/models/scanState.js'
import { isDeadlineError } from '../../../public/js/utils/deadline.js'

const answer = (status, body) => ({ ok: status < 300, status, headers: { get: () => null }, json: async () => body })
const raw = (title, needsAi = false) => ({ appleMusicId: title, title, artist: 'Orbital', year: '1993', needsAi })
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
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Plain'), raw('Brown Album', true)])
        const ai = deferred()
        serverFetch.mockReturnValue(ai.promise)

        const { albums, reclassified } = await service.scanArtist('Orbital')

        expect(albums.map(a => [a.title, a.type])).toEqual([['Plain', 'Album'], ['Brown Album', 'Uncategorized']])
        expect(reclassified).toBeInstanceOf(Promise)

        ai.resolve(answer(200, { data: { albums: ['Brown Album'] }, outcome: 'found' }))
        const again = await reclassified
        expect(again.map(a => [a.title, a.type])).toEqual([['Plain', 'Album'], ['Brown Album', 'Album']])
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

        expect(albums[0].type).toBe('Album')
        expect(reclassified).toBeNull()
        expect(serverFetch).toHaveBeenCalledTimes(1)
    })

    it('when the AI list does not come, the second pass gives nothing: the first albums stay', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Brown Album', true)])
        serverFetch.mockResolvedValue(answer(502, { error: { code: 'upstream_failed', retryable: true } }))

        const { albums, reclassified } = await service.scanArtist('Orbital')

        expect(albums[0].type).toBe('Uncategorized')
        expect(await reclassified).toBeNull()
    })

    it('when the AI list is empty, the second pass gives nothing', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([raw('Brown Album', true)])
        serverFetch.mockResolvedValue(answer(200, { data: { albums: [] }, outcome: 'not_found' }))

        expect(await (await service.scanArtist('Orbital')).reclassified).toBeNull()
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
