/**
 * F46 / F51 - the controller of the albums screen, with the real stores and doubles for the
 * services: what it asks the load for, what it tells the screen, and what it does when the ranking
 * modal reports a save. No network, no Firestore.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
    load: { load: vi.fn(), refreshSource: vi.fn(), retryFailed: vi.fn(), reloadAlbum: vi.fn(() => 1) },
    ranking: { ensureLoaded: vi.fn(async () => true), save: vi.fn(async () => true) }
}))

vi.mock('../../public/js/services/albums/albumLoading.js', () => ({
    albumLoadService: mocks.load,
    ALL_SERIES_CONTEXT: 'ALL_SERIES_VIEW',
    ALL_SCOPE: 'ALL',
    singleScope: (id) => `SINGLE:${id}`
}))
vi.mock('../../public/js/services/ranking/ownRanking.js', () => ({ ownRankingService: mocks.ranking }))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../public/js/stores/albums.js', () => ({
    albumsStore: { subscribe: () => () => { }, setActiveAlbumSeriesId: vi.fn(), getAlbums: () => [] }
}))
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import SeriesController from '../../public/js/controllers/SeriesController.js'
import { getSeriesService } from '../../public/js/services/SeriesService.js'
import toast from '../../public/js/components/Toast.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { albumLoadStore } from '../../public/js/stores/albumLoad.js'
import { ownRankingsStore } from '../../public/js/stores/ownRankings.js'
import { createEntry, AlbumStatus, queryKey } from '../../public/js/models/albumLoadState.js'

const facts = (acclaim, popularity = false) => ({ year: 1977, sources: { acclaim, popularity }, checkedAt: 1, v: 2 })
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

const SERIES = [
    { id: 's1', name: 'Floyd', albumQueries: [{ artist: 'Pink Floyd', title: 'Animals', facts: facts(true) }, 'Pink Floyd - Meddle'] },
    { id: 's2', name: 'Gilmour &amp; Plant', albumQueries: ['Jimmy Page &amp; Robert Plant - No Quarter'] },
    { id: 's3', name: 'Rush', albumQueries: [{ artist: 'Rush', title: 'Signals', facts: facts(false) }, 'Rush - Moving Pictures', 'Rush - 2112'] }
]

describe('SeriesController', () => {
    let controller, view

    afterEach(async () => {
        controller.detachView(controller.view)
        await settle()
    })

    beforeEach(async () => {
        vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { }, removeItem: () => { } })
        albumSeriesStore.setSeries(SERIES.map(series => ({ ...series })))
        albumLoadStore.startGeneration(albumLoadStore.getGeneration() + 1)
        ownRankingsStore.setRecords('u1', [])
        view = { setLoading: vi.fn(), updateAlbums: vi.fn(), updateHeader: vi.fn() }
        controller = new SeriesController()
        controller.state.seriesSortMode = 'alpha'
        await settle() // the stores tell their listeners in a later tick: let it pass before listening
        controller.init({}, view)
        Object.values(mocks.load).forEach(mock => mock.mockClear())
        Object.values(mocks.ranking).forEach(mock => mock.mockClear())
    })

    it('asks the load only for the series of the page on screen, in screen order', () => {
        controller.state.pageSize = 10
        controller.requestLoad(false)

        const request = mocks.load.load.mock.calls.at(-1)[0]
        expect(request.scopeKey).toBe('ALL')
        expect(request.series.map(series => series.id)).toEqual(['s1', 's2', 's3'])
        expect(request.fresh).toBe(false)
    })

    it('shows a series name stored with HTML entities plain (UAT-180), in the list and in the header', () => {
        expect(controller.getVisibleSeriesList().map(series => series.name)).toEqual(['Floyd', 'Gilmour & Plant', 'Rush'])

        controller.state.currentScope = 'SINGLE'
        controller.state.targetSeriesId = 's2'
        albumSeriesStore.setActiveSeries('s2')
        expect(controller.getHeaderData().title).toBe('Gilmour & Plant')
        albumSeriesStore.setActiveSeries(null)
    })

    describe('albums not checked against the sources yet', () => {
        it('counts nothing while no filter reads the facts', () => {
            expect(controller.getPageView().paging.unchecked).toBe(0)
            controller.state.filters.source = 'user'
            expect(controller.getPageView().paging.unchecked).toBe(0)
        })

        it('counts, over every series, the queries with no facts when the filter by source is on', () => {
            controller.state.filters.source = 'acclaim'
            const { groups, paging } = controller.getPageView()

            expect(groups.map(group => group.series.id)).toEqual(['s1'])
            expect(paging.unchecked).toBe(4) // Meddle, No Quarter, Moving Pictures, 2112
            expect(paging.single).toBe(false)
        })

        it('counts only the series on screen when one series is open', () => {
            controller.state.currentScope = 'SINGLE'
            controller.state.targetSeriesId = 's3'
            controller.state.filters.source = 'popularity'

            expect(controller.getPageView().paging).toMatchObject({ unchecked: 2, single: true })
        })
    })

    describe('the "My Ranking" filter', () => {
        it('asks for the list of ranked albums once it is chosen, and filters every series by it', () => {
            ownRankingsStore.setRecords('u1', [
                { albumId: 'rush_2112', artistName: 'Rush', albumTitle: '2112 (Remastered)' },
                { albumId: 'x', artistName: 'Jimmy Page & Robert Plant', albumTitle: 'No Quarter' }
            ])

            controller.handleFilterChange('source', 'user')

            expect(mocks.ranking.ensureLoaded).toHaveBeenCalledTimes(1)
            const { groups } = controller.getPageView()
            expect(groups.map(group => [group.series.id, group.queries.length])).toEqual([['s2', 1], ['s3', 1]])
            expect(mocks.load.load.mock.calls.at(-1)[0].series.map(series => series.id)).toEqual(['s2', 's3'])
        })

        it('does not read the list for any other filter', () => {
            controller.handleFilterChange('source', 'acclaim')
            controller.handleFilterChange('artist', 'Rush')
            expect(mocks.ranking.ensureLoaded).not.toHaveBeenCalled()
        })

        it('asks the load again when the list arrives while the filter is on, and not otherwise', () => {
            ownRankingsStore.setRecords('u1', [{ albumId: 'a', artistName: 'Rush', albumTitle: 'Signals' }])
            expect(mocks.load.load).not.toHaveBeenCalled()

            controller.handleFilterChange('source', 'user')
            mocks.load.load.mockClear()
            ownRankingsStore.setRecords('u1', [{ albumId: 'b', artistName: 'Pink Floyd', albumTitle: 'Meddle' }])

            expect(mocks.load.load.mock.calls.at(-1)[0].series.map(series => series.id)).toEqual(['s1'])
        })

        it('also keeps a loaded album that carries a ranking, whatever name the catalog gave it', () => {
            const query = SERIES[0].albumQueries[1]
            albumLoadStore.setSeriesOrder(['s1'])
            albumLoadStore.setSeriesEntries('s1', [{
                ...createEntry('s1', query), status: AlbumStatus.FOUND,
                album: { id: 'pf_m', title: 'Meddle (2011 mix, another name)', hasUserRanking: true }
            }])
            controller.state.filters.source = 'user'

            const { groups } = controller.getPageView()
            expect(groups.map(group => group.series.id)).toEqual(['s1'])
            expect([...groups[0].keys]).toEqual([queryKey(query)])
        })
    })

    describe('the ranking modal reports a save', () => {
        const album = { id: 'rush_signals', title: 'Signals', artist: 'Rush' }
        const rankings = [{ trackTitle: 'Subdivisions', userRank: 1 }]

        it('saves through the ranking service, then asks the load to read only that source of that album again', async () => {
            expect(await controller.saveRanking(album, rankings)).toBe(true)

            expect(mocks.ranking.save).toHaveBeenCalledWith(album, rankings)
            expect(mocks.load.refreshSource).toHaveBeenCalledWith('rush_signals', 'userRanking')
            expect(mocks.load.load).not.toHaveBeenCalled() // nothing else is loaded again
        })

        it('refreshes nothing when the save failed, and says so', async () => {
            mocks.ranking.save.mockResolvedValueOnce(false)

            expect(await controller.saveRanking(album, rankings)).toBe(false)
            expect(mocks.load.refreshSource).not.toHaveBeenCalled()
        })
    })

    describe('leaving the screen', () => {
        it('stops drawing into the view that was closed, and a new visit draws again', async () => {
            controller.detachView(view)
            albumLoadStore.setSeriesOrder(['s1'])
            albumSeriesStore.setSeries([...albumSeriesStore.getSeries()])
            ownRankingsStore.setRecords('u1', [])
            await settle()

            expect(view.updateAlbums).not.toHaveBeenCalled()
            expect(view.updateHeader).not.toHaveBeenCalled()
            expect(mocks.load.load).not.toHaveBeenCalled()
            expect(controller.view).toBeNull()

            const next = { setLoading: vi.fn(), updateAlbums: vi.fn(), updateHeader: vi.fn() }
            controller.init({}, next)
            albumLoadStore.setSeriesOrder(['s1', 's2'])
            await settle()
            expect(next.updateAlbums).toHaveBeenCalled()
        })

        it('a view that is not the attached one cannot detach it (the old view is destroyed after the new one mounted)', () => {
            controller.detachView({})
            expect(controller.view).toBe(view)
        })

        it('visiting again does not pile up subscriptions: one draw per change', async () => {
            const next = { setLoading: vi.fn(), updateAlbums: vi.fn(), updateHeader: vi.fn() }
            controller.init({}, next)
            controller.init({}, next)
            albumLoadStore.setSeriesOrder(['s1'])
            await settle()
            expect(next.updateAlbums).toHaveBeenCalledTimes(1)
        })
    })

    describe('"Refetch" of one album (F56)', () => {
        it('asks the load service to load that album again, and loads nothing by itself', () => {
            controller.handleRefetchMetadata({ id: 'alb-1', title: 'Animals', artist: 'Pink Floyd' })

            expect(mocks.load.reloadAlbum).toHaveBeenCalledWith('alb-1')
            expect(toast.info).toHaveBeenCalledWith('Loading "Animals" again...')
            expect(getSeriesService).not.toHaveBeenCalled()
        })

        it('says so when the album is not in the load', () => {
            mocks.load.reloadAlbum.mockReturnValueOnce(0)

            controller.handleRefetchMetadata({ id: 'gone', title: 'Animals' })

            expect(toast.error).toHaveBeenCalledWith('"Animals" is not loaded on this screen')
        })
    })

    // a series edited and saved (UAT-191): the screen asks the load again as it is - test/screens/albums/Albums.seriesEdited.test.tsx (F83 wave 5a)

    it('"Try again" of a series goes to the load service', () => {
        controller.retrySeries('s2')
        expect(mocks.load.retryFailed).toHaveBeenCalledWith('s2')
    })
})
