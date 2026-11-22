/**
 * F63 (UAT-201) - the albums screen and the back button.
 *
 * The Home opens a new series at /albums/<id>; the screen writes that address the canonical way
 * (/albums?seriesId=<id>). Before, it ADDED an entry for it: going back landed on /albums/<id>,
 * which added the entry again, and the person never left the screen. Now entering a scope rewrites
 * the entry, and only a change of scope made by the person adds one.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
    load: { load: vi.fn(), refreshSource: vi.fn(), retryFailed: vi.fn(), reloadAlbum: vi.fn() },
    ranking: { ensureLoaded: vi.fn(async () => true), save: vi.fn(async () => true) },
    seriesService: { loadFromFirestore: vi.fn(async () => []) }
}))

vi.mock('../../public/js/services/albums/albumLoading.js', () => ({
    albumLoadService: mocks.load,
    ALL_SERIES_CONTEXT: 'ALL_SERIES_VIEW',
    ALL_SCOPE: 'ALL',
    singleScope: (id) => `SINGLE:${id}`
}))
vi.mock('../../public/js/services/ranking/ownRanking.js', () => ({ ownRankingService: mocks.ranking }))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: () => mocks.seriesService }))
vi.mock('../../public/js/stores/albums.js', () => ({
    albumsStore: { subscribe: () => () => { }, setActiveAlbumSeriesId: vi.fn(), getAlbums: () => [] }
}))
vi.mock('../../public/js/stores/toasts.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import SeriesController from '../../public/js/controllers/SeriesController.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { router } from '../../public/js/router.js'

const address = () => window.location.pathname + window.location.search

describe('SeriesController: the address of the scope (F63)', () => {
    let controller, pushed

    beforeEach(() => {
        vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { }, removeItem: () => { } })
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'error').mockImplementation(() => { })
        albumSeriesStore.setSeries([{ id: 's1', name: 'Floyd', albumQueries: ['Pink Floyd - Animals'] }])
        controller = new SeriesController()
        controller.init({}, { setLoading: vi.fn(), updateAlbums: vi.fn(), updateHeader: vi.fn() })
        window.history.replaceState({}, '', '/albums/s1')
        pushed = vi.spyOn(window.history, 'pushState')
    })

    afterEach(() => {
        controller.detachView(controller.view)
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('entering a series opened at /albums/<id> rewrites the address and adds no history entry', async () => {
        await controller.loadScope('SINGLE', 's1', false, { entering: true })

        expect(address()).toBe('/albums?seriesId=s1')
        expect(pushed).not.toHaveBeenCalled()
        expect(router.currentUrl).toBe('/albums?seriesId=s1')
    })

    it('a change of scope made by the person adds exactly one entry, and the router knows the address', async () => {
        await controller.loadScope('SINGLE', 's1', false, { entering: true })

        await controller.loadScope('ALL', null)

        expect(address()).toBe('/albums')
        expect(pushed).toHaveBeenCalledTimes(1)
        expect(router.currentUrl).toBe('/albums')
    })

    it('loading the scope already in the address (Refresh) adds nothing', async () => {
        await controller.loadScope('SINGLE', 's1', false, { entering: true })

        await controller.loadScope('SINGLE', 's1', true)

        expect(pushed).not.toHaveBeenCalled()
    })
})
