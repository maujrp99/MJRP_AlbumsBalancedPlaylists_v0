/**
 * F70, UAT-208 - who may use the paid routes of the server (/api/ai/*, /api/generate) is said in
 * one place of the app (api/paidRoutes.js), and every caller of a paid route asks there before
 * calling: a visitor (the guest login the app opens by itself) makes no paid call.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../public/js/services/MusicKitService.js', () => ({
    musicKitService: { getArtistAlbums: vi.fn(), getArtworkUrl: () => null }
}))
vi.mock('../../public/js/services/AlbumLoader.js', () => ({ albumLoader: {} }))

import { createPaidRoutesGate, isVisitor } from '../../public/js/api/paidRoutes.js'
import { APIClient } from '../../public/js/api/client.js'
import { musicKitService } from '../../public/js/services/MusicKitService.js'
import { AlbumSearchService } from '../../public/js/services/album-search/AlbumSearchService.js'
import { CatalogAdapter } from '../../public/js/services/albums/adapters/CatalogAdapter.js'
import { AlbumNotFoundError } from '../../public/js/services/albums/AlbumLoadService.js'
import { scanFound, startScan, idleScan } from '../../public/js/models/scanState.js'
import { appFiles, importsOf, read } from '../architecture/support/sourceImports.js'

const electronic = (title) => ({
    appleMusicId: title, title, artist: 'Orbital', year: '1993', trackCount: 10,
    raw: { attributes: { name: title, trackCount: 10, genreNames: ['Electronic', 'Music'] } }
})

describe('who may use the paid routes (UAT-208)', () => {
    it('a visitor is the guest login', () => {
        expect(isVisitor({ uid: 'g', isAnonymous: true })).toBe(true)
        expect(isVisitor({ uid: 'p', isAnonymous: false })).toBe(false)
        expect(isVisitor(null)).toBe(false)
    })

    it('a person with an account may; a visitor may not', () => {
        expect(createPaidRoutesGate({ getUser: () => ({ uid: 'p', isAnonymous: false }) })()).toBe(true)
        expect(createPaidRoutesGate({ getUser: () => ({ uid: 'g', isAnonymous: true }) })()).toBe(false)
    })

    it('with no login known yet the call is not held back: the server answers and the load holds', () => {
        expect(createPaidRoutesGate({ getUser: () => null })()).toBe(true)
    })

    it('reads who is there on every ask: a visitor who signs in may, from then on', () => {
        let user = { uid: 'g', isAnonymous: true }
        const mayUse = createPaidRoutesGate({ getUser: () => user })
        expect(mayUse()).toBe(false)
        user = { uid: 'p', isAnonymous: false }
        expect(mayUse()).toBe(true)
    })
})

describe('a visitor makes no paid call', () => {
    let fetchMock

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        musicKitService.getArtistAlbums.mockReset()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'info').mockImplementation(() => {})
        vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('the scan of an electronic artist does not ask the AI list, and says that none is on its way', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([electronic('Brown Album')])
        const service = new AlbumSearchService({ mayUsePaidRoutes: () => false })

        const { albums, reclassified } = await service.scanArtist('Orbital')

        expect(reclassified).toBeNull()
        expect(albums.map(a => [a.title, a.type, a.typeReason])).toEqual([['Brown Album', 'Album', 'electronic-no-ai-list']])
        expect(fetchMock).not.toHaveBeenCalled()
        // The picker's status line is drawn from `classifying`, which is "reclassified is on its way": here nothing is on its way
        const scanning = startScan(idleScan(), 'Orbital')
        const state = scanFound(scanning, scanning.generation, { albums, classifying: Boolean(reclassified) })
        expect(state.classifying).toBe(false)
    })

    it('the scan of the same artist asks the list once the visitor has an account', async () => {
        musicKitService.getArtistAlbums.mockResolvedValue([electronic('Brown Album')])
        let visitor = true
        const service = new AlbumSearchService({ mayUsePaidRoutes: () => !visitor })
        await service.scanArtist('Orbital')
        visitor = false
        fetchMock.mockResolvedValue({ ok: true, status: 200, headers: { get: () => null }, json: async () => ({ data: { albums: ['Brown Album'] }, outcome: 'found' }) })

        const { reclassified } = await service.scanArtist('Orbital')

        expect((await reclassified).map(a => a.typeReason)).toEqual(['ai-list'])
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls[0][0]).toBe('/api/ai/studio-albums')
    })

    it('the AI list is not asked by any other door of the search either', async () => {
        const service = new AlbumSearchService({ mayUsePaidRoutes: () => false })

        expect(await service._fetchAIWithCache('Orbital')).toEqual([])
        expect(service.aiCache.has('Orbital')).toBe(false)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('the second source of the album load is not asked: the album ends as not found in the catalog', async () => {
        const client = new APIClient()
        client.mayUsePaidRoutes = () => false
        const catalog = new CatalogAdapter({
            musicKit: { searchAlbums: async () => [], getAlbumDetails: async () => null, getArtworkUrl: () => null },
            fetchFromServer: (query) => client._fetchAlbumFromAPI(query),
            generateAlbumId: (data) => client.generateAlbumId(data),
            retryWaitsMs: []
        })

        const error = await catalog.find({ artist: 'Artist', title: 'Album' }).catch(e => e)

        expect(error).toBeInstanceOf(AlbumNotFoundError)
        expect(error.hold).toBeUndefined()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('a person with an account still asks the second source', async () => {
        const client = new APIClient()
        client.mayUsePaidRoutes = () => true
        fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { title: 'Album', artist: 'Artist', tracks: [{ title: 'One' }] }, outcome: 'found' }) })

        expect(await client._fetchAlbumFromAPI('Artist - Album')).toMatchObject({ title: 'Album' })
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})

describe('every caller of a paid route asks the one place', () => {
    const PAID_ROUTE = /['"`](?:\/api)?\/(?:ai\/[\w-]+|generate)['"`]/

    it('a file that names a paid route imports api/paidRoutes.js', () => {
        const callers = appFiles().filter(file => PAID_ROUTE.test(read(file)))
        const withoutTheGate = callers.filter(file => !importsOf(file).some(specifier => /(^|\/)paidRoutes\.js$/.test(specifier)))

        expect(callers.sort()).toEqual(['api/client.js', 'services/album-search/AlbumSearchService.js'])
        expect(withoutTheGate).toEqual([])
    })

    it('the guest login is read for the paid routes nowhere else', () => {
        const readers = appFiles().filter(file => /isAnonymous/.test(read(file)))

        // utils/isSignedIn.js says whether somebody signed in with an account (the shell and the Start screen draw from it) and shell/context.ts
        // names the field in the type of the person the shell reads; neither decides anything about the server
        expect(readers.sort()).toEqual(['api/paidRoutes.js', 'shell/context.ts', 'utils/isSignedIn.js'])
    })
})
