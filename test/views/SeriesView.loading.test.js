/**
 * F79 (P1-1) - the albums screen while the series are being read, in jsdom: the real screen, controller
 * and stores; the read of the series is a double that the test holds and then releases.
 * What is proved: while the first read is out and no series is known the list area says it is
 * loading (the words and the spinner of the Blend screen) instead of «No albums in library»;
 * when the read ends it shows the albums, the real empty state, or (read failed) the empty state.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
    load: { load: vi.fn(), refreshSource: vi.fn(), retryFailed: vi.fn(), adoptAlbum: vi.fn() },
    seriesService: { loadFromFirestore: vi.fn() },
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
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: () => mocks.seriesService }))
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
const SERIES = [{ id: 's1', name: 'One', albumQueries: ['Band - Album 1', 'Band - Album 2'] }]

const answerAtOnce = ({ series }) => {
    albumLoadStore.setSeriesOrder(series.map(item => item.id))
    series.forEach(item => albumLoadStore.setSeriesEntries(item.id, item.albumQueries.map((query, index) => ({
        ...createEntry(item.id, query),
        status: AlbumStatus.FOUND,
        album: { id: `${item.id}-a${index + 1}`, title: query.split(' - ')[1], artist: query.split(' - ')[0], seriesIds: [item.id], tracks: [], getTracks: () => [] }
    }))))
}

/** The read of the series, held: the test says when it ends, and how. */
const holdTheRead = () => {
    let release, fail
    mocks.seriesService.loadFromFirestore.mockImplementation(() => new Promise((resolve, reject) => {
        release = (series) => { albumSeriesStore.setSeries(series); albumSeriesStore.markRead(); resolve(series) }
        fail = (error) => { albumSeriesStore.setError(error.message); albumSeriesStore.markRead(); reject(error) }
    }))
    return { release: (series) => release(series), fail: (error) => fail(error) }
}

describe('the albums screen while the series are being read', () => {
    let controller, view
    const listArea = () => document.querySelector('#emptyStateContainer')
    const loading = () => listArea().querySelector('[data-testid="series-loading"]')
    const emptyCard = () => listArea().querySelector('.empty-state')
    const gridMount = () => document.querySelector('#series-grid-mount')

    const open = async () => {
        document.body.innerHTML = '<div id="app"></div>'
        view = new SeriesView(controller)
        document.getElementById('app').appendChild(await view.render({}))
        view.mount({})
        await settle()
    }
    const setWidth = (phone) => {
        window.matchMedia = (query) => ({ matches: phone && query.includes('max-width: 899px'), media: query, addEventListener() { }, removeEventListener() { }, addListener() { }, removeListener() { } })
    }

    beforeEach(async () => {
        vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { }, removeItem: () => { } })
        window.scrollTo = () => { }
        setWidth(false)
        history.replaceState({}, '', '/albums')
        albumSeriesStore.reset()
        albumSeriesStore.setDb({})
        albumLoadStore.startGeneration(albumLoadStore.getGeneration() + 1)
        ownRankingsStore.setRecords('u1', [])
        Object.values(mocks.load).forEach(mock => mock.mockReset())
        mocks.load.load.mockImplementation(answerAtOnce)
        mocks.seriesService.loadFromFirestore.mockReset()
        controller = new SeriesController()
    })

    afterEach(async () => {
        view?.destroy()
        await settle()
        albumSeriesStore.setDb(null)
        vi.unstubAllGlobals()
    })

    it('says it is loading, with the spinner, and not that the library is empty, until the read ends', async () => {
        holdTheRead()
        await open()

        expect(loading()).not.toBeNull()
        expect(loading().querySelector('.animate-spin')).not.toBeNull()
        expect(emptyCard()).toBeNull()
        expect(listArea().textContent).not.toContain('No albums in library')
        // the grid, with its own «No albums match» text, steps aside (hidden) for the wait
        expect(gridMount().hidden).toBe(true)
    })

    it('on the phone it says «Loading your series…» in words', async () => {
        setWidth(true)
        holdTheRead()
        await open()

        expect(loading().textContent).toContain('Loading your series…')
        expect(emptyCard()).toBeNull()
    })

    it('shows the albums when the read ends with series, and the loading state is gone', async () => {
        const read = holdTheRead()
        await open()
        read.release(SERIES.map(series => ({ ...series })))
        await settle()
        await settle()

        expect(loading()).toBeNull()
        expect(emptyCard()).toBeNull()
        expect(gridMount().hidden).toBe(false)
        expect(gridMount().querySelectorAll('.albums-grid > [data-id]').length).toBe(2)
    })

    it('shows the real empty state when the read ends with no series', async () => {
        const read = holdTheRead()
        await open()
        read.release([])
        await settle()
        await settle()

        expect(loading()).toBeNull()
        expect(emptyCard()).not.toBeNull()
        expect(emptyCard().textContent).toContain('No albums in library')
        expect(emptyCard().textContent).toContain('Go and create!')
    })

    it('shows what it showed before (the empty state) when the read fails', async () => {
        const read = holdTheRead()
        await open()
        read.fail(new Error('offline'))
        await settle()
        await settle()

        expect(loading()).toBeNull()
        expect(emptyCard()).not.toBeNull()
    })

    it('keeps the list on screen while a series already known is read again', async () => {
        albumSeriesStore.setSeries(SERIES.map(series => ({ ...series })))
        holdTheRead()
        await open()

        expect(loading()).toBeNull()
        expect(emptyCard()).toBeNull()
        expect(gridMount().hidden).toBe(false)
        expect(gridMount().querySelectorAll('.albums-grid > [data-id]').length).toBe(2)
    })

    it('with no database to read (signed out) it does not wait: the real empty state shows', async () => {
        albumSeriesStore.setDb(null)
        await open()

        expect(loading()).toBeNull()
        expect(emptyCard()).not.toBeNull()
    })
})
