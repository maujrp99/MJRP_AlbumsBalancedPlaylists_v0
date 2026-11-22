/**
 * F79 (P1-1) - the albums screen while the series are being read, in jsdom: the real screen, controller and stores; the read of the series is a
 * stand-in that the test holds and then releases. Carried from `main`'s test/views/SeriesView.loading.test.js (same assertions; the scaffold is the
 * one of test/support/albumsScenarios.js). What is proved: while the first read is out and no series is known the list area says it is loading (the
 * words and the spinner of the Blend screen, one piece for both) instead of «No albums in library»; when the read ends it shows the albums, the real
 * empty state, or (the read failed) the empty state.
 *
 * What changed on purpose from `main`: the content is drawn in the grid's own slot and the height of the empty card is reserved BELOW it by an empty
 * block (see screens/albums/SeriesLoading.tsx), so nothing is measured; the tests of `main` that asserted the measured lift (`loadingPlacement`,
 * `translateY`) are replaced by the ones of the layout.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/firebase-init.js', () => ({ app: {}, auth: { currentUser: null }, db: {} }))
vi.mock('../../../public/js/services/albums/albumLoading.js', async () => (await import('../../support/albumsScenarios.js')).loadModule)
vi.mock('../../../public/js/services/ranking/ownRanking.js', async () => (await import('../../support/albumsScenarios.js')).rankingModule)
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/albumsScenarios.js')).seriesServiceModule)
vi.mock('../../../public/js/ui/dialogs/dialogs', async () => (await import('../../support/albumsScenarios.js')).dialogModule)
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/albumsScenarios.js')).toastModule)
vi.mock('../../../public/js/ui/albumWindow/openAlbumWindow', async () => (await import('../../support/albumsScenarios.js')).albumWindowModule)
vi.mock('../../../public/js/ui/inventoryItem/AddWindow', async () => (await import('../../support/albumsScenarios.js')).inventoryModule)
vi.mock('../../../public/js/screens/albums/useAlbumWindows', async () => (await import('../../support/albumsScenarios.js')).windowsModule)

import { act } from 'react'
import SeriesController from '../../../public/js/controllers/SeriesController.js'
import { albumsView } from '../../../public/js/screens/albums/index'
import { LOADING_MIN_HEIGHT } from '../../../public/js/screens/albums/SeriesLoading'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'
import { asPhone, quiet, prepare, readOfSeries, DEFAULT_SERIES } from '../../support/albumsScenarios.js'

const tick = () => new Promise(resolve => setImmediate(resolve))
const settle = () => act(async () => { for (let i = 0; i < 5; i++) await tick() })

describe('the albums screen while the series are being read', () => {
    let view: ReturnType<typeof albumsView>
    const listArea = () => document.querySelector('#emptyStateContainer')!
    const loading = () => document.querySelector('#series-grid-mount [data-testid="series-loading"]')
    const reserve = () => listArea().querySelector<HTMLElement>('[data-testid="series-loading-reserve"]')
    const emptyCard = () => listArea().querySelector('.empty-state')
    const gridMount = () => document.querySelector<HTMLElement>('#series-grid-mount')!
    const gridInner = () => document.querySelector<HTMLElement>('#series-grid-inner')!

    const open = async (scenario: Parameters<typeof prepare>[0], phone = false) => {
        asPhone(phone)
        quiet()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'log').mockImplementation(() => {})
        prepare(scenario)
        const app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = albumsView(new SeriesController() as never)
        await act(async () => {
            await view.render({})
            view.mount({})
        })
        await settle()
    }
    const held = { series: () => [], read: 'held' } as never
    const end = async (work: () => void) => { await act(async () => { work(); for (let i = 0; i < 5; i++) await tick() }) }

    afterEach(async () => {
        await act(async () => { view?.destroy() })
        document.body.innerHTML = ''
        vi.useRealTimers()
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('draws at once, while the read is out: it says it is loading, with the spinner, and not that the library is empty', async () => {
        await open(held)

        expect(loading()).not.toBeNull()
        expect(loading()!.querySelector('.animate-spin')).not.toBeNull()
        expect(emptyCard()).toBeNull()
        expect(listArea().textContent).not.toContain('No albums in library')
        expect(document.body.textContent).not.toContain('No albums in library')
        // the grid, with its own «No albums match» text, goes invisible, keeping its space for the wait
        expect(gridInner().style.visibility).toBe('hidden')
    })

    it('the content is in the grid\'s own slot, pinned to its top by layout (no measured number), so it sits right under the filters', async () => {
        await open(held)

        const slot = loading()!
        expect(slot.parentElement).toBe(gridMount())
        expect(gridMount().classList.contains('relative')).toBe(true)
        for (const name of ['absolute', 'inset-x-0', 'top-0']) expect(slot.classList.contains(name), name).toBe(true)
        expect(slot.classList.contains('items-start')).toBe(true) // the spinner sits at the top, under the filters
        expect(slot.classList.contains('items-center')).toBe(false)
        expect(slot.getAttribute('role')).toBe('status')
        // nothing is lifted by a number: no transform, no margin, no inline position
        expect(document.querySelector('[style*="translateY"]')).toBeNull()
        expect(slot.getAttribute('style')).toBeNull()
    })

    it('the height of the empty card is reserved below, empty, so the footer does not move when the card or the list arrives', async () => {
        await open(held)

        expect(reserve()!.style.minHeight).toBe(`${LOADING_MIN_HEIGHT.computer}px`)
        expect(reserve()!.textContent).toBe('')
        expect(reserve()!.getAttribute('aria-hidden')).toBe('true')
    })

    it('on the phone the reserve takes the phone empty card height', async () => {
        await open(held, true)

        expect(reserve()!.style.minHeight).toBe(`${LOADING_MIN_HEIGHT.phone}px`)
    })

    it('on the phone it says «Loading your series…» in words', async () => {
        await open(held, true)

        expect(loading()!.textContent).toContain('Loading your series…')
        expect(emptyCard()).toBeNull()
    })

    it('shows the albums when the read ends with series, and the loading state is gone', async () => {
        await open(held)
        await end(() => readOfSeries.release([{ id: 's1', name: 'One', createdAt: new Date(2026, 0, 1), albumQueries: [{ artist: 'Band', title: 'Album 1' }, { artist: 'Band', title: 'Album 2' }] }]))

        expect(loading()).toBeNull()
        expect(reserve()).toBeNull()
        expect(emptyCard()).toBeNull()
        expect(gridMount().classList.contains('relative')).toBe(false)
        expect(gridInner().style.visibility).toBe('')
        expect(gridMount().querySelectorAll('.albums-grid > [data-id]').length).toBe(2)
    })

    it('shows the real empty state when the read ends with no series', async () => {
        await open(held)
        await end(() => readOfSeries.release([]))

        expect(loading()).toBeNull()
        expect(reserve()).toBeNull()
        expect(emptyCard()).not.toBeNull()
        expect(emptyCard()!.textContent).toContain('No albums in library')
        expect(emptyCard()!.textContent).toContain('Go and create!')
    })

    it('shows what it showed before (the empty state) when the read fails', async () => {
        await open(held)
        await end(() => readOfSeries.fail('offline'))

        expect(loading()).toBeNull()
        expect(emptyCard()).not.toBeNull()
    })

    it('keeps the list on screen while a series already known is read again', async () => {
        await open({ read: 'held' } as never)

        expect(loading()).toBeNull()
        expect(emptyCard()).toBeNull()
        expect(gridInner().style.visibility).toBe('')
        expect(gridMount().querySelectorAll('.albums-grid > [data-id]').length).toBe(DEFAULT_SERIES().reduce((count, series) => count + series.albumQueries.length, 0))
    })

    it('with no database to read (signed out) it does not wait: the real empty state shows at once', async () => {
        await open({ series: () => [] } as never)

        expect(albumSeriesStore.getDb()).toBeNull()
        expect(loading()).toBeNull()
        expect(emptyCard()).not.toBeNull()
    })
})

describe('the albums screen is drawn while the read goes on (the router does not wait for the read)', () => {
    it('`render` of the route returns before the read of the series ends', async () => {
        asPhone(false)
        quiet()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'log').mockImplementation(() => {})
        prepare({ series: () => [], read: 'held' } as never)
        const view = albumsView(new SeriesController() as never)
        let rendered = false
        await act(async () => { await view.render({}); rendered = true })
        expect(rendered).toBe(true)
        await act(async () => { view.destroy() })
        document.body.innerHTML = ''
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })
})
