/**
 * F49 (UAT-06) - the albums screen whole, in jsdom: the real screen, controller, grid and buttons, with the real stores and a stand-in of
 * the load service that answers at once. What is proved: the press on «Load N more albums» shows the rest of that series in place, the
 * choice outlives the redraws, the pages and the filters, and is forgotten with the scope and with the screen. No network, no Firestore.
 * Carried over to React in F83 wave 5a: the screen is mounted through `albumsView()` with the stand-ins of test/support/albumsScenarios.js
 * (the same ones the proof «draws what the hand-made one drew» uses); the assertions are the old ones.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
import { albumLoadStore } from '../../../public/js/stores/albumLoad.js'
import { asPhone, quiet, outside, prepare } from '../../support/albumsScenarios.js'

const tick = () => new Promise(resolve => setImmediate(resolve))
const settle = () => act(async () => { for (let i = 0; i < 5; i++) await tick() })
const queriesOf = (name: string, count: number) => Array.from({ length: count }, (_, index) => ({ artist: `${name} Band`, title: `${name} Album ${index + 1}` }))

// 12 series: «big» (15 albums) and «wide» (14) come first by size, ten small ones fill a second page
const SERIES = () => [
    { id: 'big', name: 'Big', createdAt: new Date(2026, 0, 1), albumQueries: queriesOf('Big', 15) },
    { id: 'wide', name: 'Wide', createdAt: new Date(2026, 0, 2), albumQueries: queriesOf('Wide', 14) },
    ...Array.from({ length: 10 }, (_, index) => ({ id: `small${index}`, name: `Small ${index}`, createdAt: new Date(2026, 0, 3 + index), albumQueries: queriesOf(`Small${index}`, 2) }))
]

describe('the albums screen - a series with more than 12 albums', () => {
    let controller: InstanceType<typeof SeriesController>
    let view: ReturnType<typeof albumsView>
    const group = (seriesId: string) => document.querySelector(`#series-grid-mount .series-group[data-series-id="${seriesId}"]`)
    const cards = (seriesId: string) => [...group(seriesId)!.querySelectorAll<HTMLElement>('.albums-grid > [data-id]')].map(card => card.dataset.id)
    const button = (seriesId: string) => group(seriesId)?.querySelector<HTMLElement>('[data-action="load-more-series"]') || null
    const label = (seriesId: string) => button(seriesId)?.textContent!.replace(/\s+/g, ' ').trim()
    const allOf = (seriesId: string, count: number) => Array.from({ length: count }, (_, index) => `${seriesId}-a${index + 1}`)
    const press = async (element: HTMLElement | null) => { await act(async () => { element!.click(); for (let i = 0; i < 5; i++) await tick() }) }
    const change = async (work: () => unknown) => { await act(async () => { await work(); for (let i = 0; i < 5; i++) await tick() }) }

    const open = async (params = {}) => {
        const app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = albumsView(controller as never)
        await act(async () => {
            await view.render(params)
            view.mount(params)
        })
        await settle()
    }

    beforeEach(async () => {
        asPhone(false)
        quiet()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'log').mockImplementation(() => {})
        prepare({ series: SERIES })
        controller = new SeriesController()
        controller.state.seriesSortMode = 'count_desc'
        await open()
    })

    afterEach(async () => {
        await act(async () => { view.destroy() })
        document.body.innerHTML = ''
        vi.useRealTimers()
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('opens with each series cut at 12 albums and a button with the right number', () => {
        expect(cards('big')).toEqual(allOf('big', 12))
        expect(label('big')).toBe('Load 3 more albums')
        expect(label('wide')).toBe('Load 2 more albums')
        expect(button('small0')).toBeNull()
    })

    it('the press shows the rest of that series in place, takes the button away and loads nothing again', async () => {
        const asked = outside.filter(entry => entry[0] === 'load').length
        await press(button('big'))

        expect(cards('big')).toEqual(allOf('big', 15))
        expect(button('big')).toBeNull()
        expect((document.activeElement as HTMLElement).dataset.id).toBe('big-a13')
        expect(outside.filter(entry => entry[0] === 'load').length).toBe(asked)
        // the other series stays as it was
        expect(cards('wide')).toHaveLength(12)
        expect(label('wide')).toBe('Load 2 more albums')
    })

    it('the load asks for every album of a series on screen, whatever the cut', () => {
        const asked = outside.filter(entry => entry[0] === 'load').at(-1)!
        expect(String(asked[2]).split(',')).toContain('big')
        // every album of «big» is in the store, though 12 are drawn
        expect(albumLoadStore.getEntries('big')).toHaveLength(15)
    })

    it('the choice outlives the redraws that the load causes', async () => {
        await press(button('big'))

        const entry = albumLoadStore.getEntries('big')[0]
        await change(() => albumLoadStore.patchEntry('big', entry.key, { enrichment: { acclaim: 'done' } }))
        await change(() => controller.renderFromStore())

        expect(cards('big')).toEqual(allOf('big', 15))
        expect(button('big')).toBeNull()
    })

    it('the choice outlives a change of page and of filter', async () => {
        await press(button('big'))

        await change(() => controller.handlePage(2))
        expect(group('big')).toBeNull()
        await change(() => controller.handlePage(1))
        expect(cards('big')).toEqual(allOf('big', 15))

        await change(() => controller.handleSearch('Wide'))
        expect(group('big')).toBeNull()
        await change(() => controller.handleSearch(''))
        expect(cards('big')).toEqual(allOf('big', 15))
        expect(button('big')).toBeNull()
    })

    it('the list has no cut, and going back to the grid keeps the choice', async () => {
        await press(button('big'))

        await change(() => controller.handleViewModeChange('expanded'))
        expect(button('big')).toBeNull()
        expect(button('wide')).toBeNull()
        allOf('wide', 14).forEach(id => expect(group('wide')!.innerHTML).toContain(id))

        await change(() => controller.handleViewModeChange('compact'))
        expect(cards('big')).toEqual(allOf('big', 15))
        expect(cards('wide')).toHaveLength(12)
    })

    it('the choice is forgotten when the scope changes', async () => {
        await press(button('big'))

        await change(() => controller.loadScope('SINGLE', 'big'))
        expect(document.querySelectorAll('#series-grid-mount .albums-grid > [data-id]')).toHaveLength(15)
        expect(document.querySelector('[data-action="load-more-series"]')).toBeNull()

        await change(() => controller.loadScope('ALL', null))
        expect(cards('big')).toEqual(allOf('big', 12))
        expect(label('big')).toBe('Load 3 more albums')
    })

    it('the choice is forgotten when the screen is left', async () => {
        await press(button('big'))
        await act(async () => { view.destroy() })
        document.body.innerHTML = ''

        await open()
        expect(cards('big')).toEqual(allOf('big', 12))
        expect(label('big')).toBe('Load 3 more albums')
    })
})
