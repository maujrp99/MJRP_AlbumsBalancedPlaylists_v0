/**
 * F49 (UAT-06) - the albums screen whole, in jsdom: the real screen, controller, grid and click
 * handler, with the real stores and a double of the load service that answers at once.
 * What is proved: the click on «Load N more albums» shows the rest of that series in place, the
 * choice outlives the redraws, the pages and the filters, and is forgotten with the scope and with
 * the screen. No network, no Firestore.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
    load: { load: vi.fn(), refreshSource: vi.fn(), retryFailed: vi.fn(), adoptAlbum: vi.fn() },
    ranking: { ensureLoaded: vi.fn(async () => true), save: vi.fn(async () => true) }
}))

vi.mock('../../public/js/firebase-init.js', () => ({ app: {}, auth: { currentUser: null }, db: {} }))
vi.mock('../../public/js/services/albums/albumLoading.js', () => ({
    albumLoadService: mocks.load,
    ALL_SERIES_CONTEXT: 'ALL_SERIES_VIEW',
    ALL_SCOPE: 'ALL',
    singleScope: (id) => `SINGLE:${id}`
}))
vi.mock('../../public/js/services/ranking/ownRanking.js', () => ({ ownRankingService: mocks.ranking }))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../public/js/stores/albums.js', () => ({
    albumsStore: { subscribe: () => () => { }, setActiveAlbumSeriesId: vi.fn(), getAlbums: () => [], removeAlbum: vi.fn() }
}))
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})
vi.mock('../../public/js/views/helpers/SeriesModalsManager.js', () => ({
    SeriesModalsManager: class { mount() { } unmount() { } openEdit() { } openDelete() { } }
}))
vi.mock('../../public/js/components/ViewAlbumModal.js', () => ({ showViewAlbumModal: vi.fn() }))
vi.mock('../../public/js/components/InventoryAddModal.js', () => ({ InventoryAddModal: { open: vi.fn() } }))
vi.mock('../../public/js/components/ranking/UserRankModal.js', () => ({ UserRankModal: class { show() { } } }))
vi.mock('../../public/js/services/DialogService.js', () => ({ dialogService: { confirm: vi.fn(), prompt: vi.fn() } }))

import SeriesView from '../../public/js/views/SeriesView.js'
import SeriesController from '../../public/js/controllers/SeriesController.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { albumLoadStore } from '../../public/js/stores/albumLoad.js'
import { ownRankingsStore } from '../../public/js/stores/ownRankings.js'
import { createEntry, AlbumStatus } from '../../public/js/models/albumLoadState.js'

const settle = () => new Promise(resolve => setTimeout(resolve, 0))
const queriesOf = (name, count) => Array.from({ length: count }, (_, index) => `${name} Band - ${name} Album ${index + 1}`)

// 12 series: «big» (15 albums) and «wide» (14) come first by size, ten small ones fill a second page
const SERIES = [
    { id: 'big', name: 'Big', albumQueries: queriesOf('Big', 15) },
    { id: 'wide', name: 'Wide', albumQueries: queriesOf('Wide', 14) },
    ...Array.from({ length: 10 }, (_, index) => ({ id: `small${index}`, name: `Small ${index}`, albumQueries: queriesOf(`Small${index}`, 2) }))
]

/** The double of the load service: every album asked for is found at once. */
const answerAtOnce = ({ series }) => {
    albumLoadStore.setSeriesOrder(series.map(item => item.id))
    series.forEach(item => albumLoadStore.setSeriesEntries(item.id, item.albumQueries.map((query, index) => ({
        ...createEntry(item.id, query),
        status: AlbumStatus.FOUND,
        album: { id: `${item.id}-a${index + 1}`, title: query.split(' - ')[1], artist: query.split(' - ')[0], seriesIds: [item.id], tracks: [], getTracks: () => [] }
    }))))
}

describe('the albums screen - a series with more than 12 albums', () => {
    let controller, view
    const group = (seriesId) => document.querySelector(`#series-grid-mount .series-group[data-series-id="${seriesId}"]`)
    const cards = (seriesId) => [...group(seriesId).querySelectorAll('.albums-grid > [data-id]')].map(card => card.dataset.id)
    const button = (seriesId) => group(seriesId)?.querySelector('[data-action="load-more-series"]') || null
    const label = (seriesId) => button(seriesId)?.textContent.replace(/\s+/g, ' ').trim()
    const allOf = (seriesId, count) => Array.from({ length: count }, (_, index) => `${seriesId}-a${index + 1}`)

    const open = async (params = {}) => {
        document.body.innerHTML = '<div id="app"></div>'
        view = new SeriesView(controller)
        document.getElementById('app').appendChild(await view.render(params))
        await view.mount(params)
        await settle()
        return view
    }

    beforeEach(async () => {
        vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { }, removeItem: () => { } })
        window.scrollTo = () => { }
        history.replaceState({}, '', '/albums')
        albumSeriesStore.setSeries(SERIES.map(series => ({ ...series })))
        albumSeriesStore.setActiveSeries(null)
        albumLoadStore.startGeneration(albumLoadStore.getGeneration() + 1)
        ownRankingsStore.setRecords('u1', [])
        Object.values(mocks.load).forEach(mock => mock.mockReset())
        mocks.load.load.mockImplementation(answerAtOnce)
        controller = new SeriesController()
        controller.state.seriesSortMode = 'count_desc'
        await settle()
        await open()
    })

    afterEach(async () => {
        view.destroy()
        await settle()
        vi.unstubAllGlobals()
    })

    it('opens with each series cut at 12 albums and a button with the right number', () => {
        expect(cards('big')).toEqual(allOf('big', 12))
        expect(label('big')).toBe('Load 3 more albums')
        expect(label('wide')).toBe('Load 2 more albums')
        expect(button('small0')).toBeNull()
    })

    it('the click shows the rest of that series in place, takes the button away and loads nothing again', async () => {
        const asked = mocks.load.load.mock.calls.length
        button('big').click()
        await settle()

        expect(cards('big')).toEqual(allOf('big', 15))
        expect(button('big')).toBeNull()
        expect(document.activeElement.dataset.id).toBe('big-a13')
        expect(mocks.load.load.mock.calls.length).toBe(asked)
        // the other series stays as it was
        expect(cards('wide')).toHaveLength(12)
        expect(label('wide')).toBe('Load 2 more albums')
    })

    it('the load asks for every album of a series on screen, whatever the cut', () => {
        const request = mocks.load.load.mock.calls.at(-1)[0]
        expect(request.series.find(series => series.id === 'big').albumQueries).toHaveLength(15)
    })

    it('the choice outlives the redraws that the load causes', async () => {
        button('big').click()
        await settle()

        const entry = albumLoadStore.getEntries('big')[0]
        albumLoadStore.patchEntry('big', entry.key, { enrichment: { acclaim: 'done' } })
        await settle()
        controller.renderFromStore()
        await settle()

        expect(cards('big')).toEqual(allOf('big', 15))
        expect(button('big')).toBeNull()
    })

    it('the choice outlives a change of page and of filter', async () => {
        button('big').click()
        await settle()

        controller.handlePage(2)
        await settle()
        expect(group('big')).toBeNull()
        controller.handlePage(1)
        await settle()
        expect(cards('big')).toEqual(allOf('big', 15))

        controller.handleSearch('Wide')
        await settle()
        expect(group('big')).toBeNull()
        controller.handleSearch('')
        await settle()
        expect(cards('big')).toEqual(allOf('big', 15))
        expect(button('big')).toBeNull()
    })

    it('the list has no cut, and going back to the grid keeps the choice', async () => {
        button('big').click()
        await settle()

        controller.handleViewModeChange('expanded')
        await settle()
        expect(button('big')).toBeNull()
        expect(button('wide')).toBeNull()
        allOf('wide', 14).forEach(id => expect(group('wide').innerHTML).toContain(id))

        controller.handleViewModeChange('compact')
        await settle()
        expect(cards('big')).toEqual(allOf('big', 15))
        expect(cards('wide')).toHaveLength(12)
    })

    it('the choice is forgotten when the scope changes', async () => {
        button('big').click()
        await settle()

        await controller.loadScope('SINGLE', 'big')
        await settle()
        expect(document.querySelectorAll('#series-grid-mount .albums-grid > [data-id]')).toHaveLength(15)
        expect(document.querySelector('[data-action="load-more-series"]')).toBeNull()

        await controller.loadScope('ALL', null)
        await settle()
        expect(cards('big')).toEqual(allOf('big', 12))
        expect(label('big')).toBe('Load 3 more albums')
    })

    it('the choice is forgotten when the screen is left', async () => {
        button('big').click()
        await settle()
        view.destroy()
        await settle()

        await open()
        expect(cards('big')).toEqual(allOf('big', 12))
        expect(label('big')).toBe('Load 3 more albums')
    })
})
