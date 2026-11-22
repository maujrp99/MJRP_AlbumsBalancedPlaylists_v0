/**
 * What the albums screen gives its pieces for each state: the title of the header, the «Blend your Albums» button (UAT-217), the lists of
 * the filter bar (their label, options and value) and the layout of the grid. Carried over in F83 wave 5a from the test of the hand-made
 * factory of the pieces (views/helpers/SeriesComponentFactory.js), which read the props it handed them; the screen is now mounted whole
 * (through `albumsView()` with the stand-ins of test/support/albumsScenarios.js) and the same facts are read from what it draws.
 * One change of words: the list of series said «All Albums Series» on the first draw of the old factory and the old screen redrew it at
 * once to «All Series»; there is only the second now.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/firebase-init.js', () => ({ app: {}, auth: { currentUser: null }, db: {} }))
vi.mock('../../../public/js/services/albums/albumLoading.js', async () => (await import('../../support/albumsScenarios.js')).loadModule)
vi.mock('../../../public/js/services/ranking/ownRanking.js', async () => (await import('../../support/albumsScenarios.js')).rankingModule)
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/albumsScenarios.js')).seriesServiceModule)
vi.mock('../../../public/js/services/DialogService.js', async () => (await import('../../support/albumsScenarios.js')).dialogModule)
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/albumsScenarios.js')).toastModule)
vi.mock('../../../public/js/components/ViewAlbumModal.js', async () => (await import('../../support/albumsScenarios.js')).albumWindowModule)
vi.mock('../../../public/js/components/InventoryAddModal.js', async () => (await import('../../support/albumsScenarios.js')).inventoryModule)
vi.mock('../../../public/js/screens/albums/useAlbumWindows', async () => (await import('../../support/albumsScenarios.js')).windowsModule)

import { act } from 'react'
import SeriesController from '../../../public/js/controllers/SeriesController.js'
import { albumsView } from '../../../public/js/screens/albums/index'
import { asPhone, quiet, outside, prepare } from '../../support/albumsScenarios.js'

const tick = () => new Promise(resolve => setImmediate(resolve))
const DAY = (n: number) => new Date(2026, 0, n)
// The artists offered come from what the series ask for, not from the albums loaded
const ONE_SERIES = () => [{ id: 's1', name: 'My Series', createdAt: DAY(1), albumQueries: [{ artist: 'Artist A', title: 'Album One' }] }]

describe('the albums screen gives its pieces what the state says', () => {
    let controller: InstanceType<typeof SeriesController>
    let view: ReturnType<typeof albumsView>
    const options = (selector: string) => [...document.querySelectorAll<HTMLOptionElement>(`${selector} option`)].map(option => ({ value: option.value, label: option.textContent!.trim() }))
    const select = (id: string) => document.querySelector<HTMLSelectElement>(`#${id}`)!

    const open = async (state: { address?: string; params?: Record<string, string>; storage?: Record<string, string>; series?: () => unknown[] } = {}) => {
        asPhone(false)
        quiet()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'log').mockImplementation(() => {})
        prepare({ series: ONE_SERIES, ...state })
        controller = new SeriesController()
        const app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = albumsView(controller as never)
        const params = state.params ?? {}
        await act(async () => {
            await view.render(params)
            view.mount(params)
        })
        await act(async () => { for (let i = 0; i < 5; i++) await tick() })
    }
    const change = async (element: Element, value: string) => {
        await act(async () => {
            const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
            Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, value)
            element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
            for (let i = 0; i < 5; i++) await tick()
        })
    }

    afterEach(async () => {
        await act(async () => { view.destroy() })
        document.body.innerHTML = ''
        vi.useRealTimers()
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    describe('the header', () => {
        it('names the series on the page of one', async () => {
            await open({ address: '/albums/s1', params: { seriesId: 's1' } })
            expect(document.querySelector('.series-page-header--single h1')!.textContent).toContain('My Series')
        })

        it('uses the default title for all the series', async () => {
            await open()
            expect(document.querySelector('.series-page-header--all h1')!.textContent).toContain('All Albums Series')
        })

        // UAT-217: «Blend your Albums» opens the Blend with the series of the page chosen
        describe('«Blend your Albums»', () => {
            const blend = async () => {
                outside.length = 0
                await act(async () => { document.querySelector<HTMLElement>('#generatePlaylistsBtn')!.click() })
                return outside.find(entry => entry[0] === 'navigate')?.[1]
            }

            it('carries the series the page is at (its id written for an address)', async () => {
                const series = () => [{ id: 'abc 1', name: 'Odd id', createdAt: DAY(1), albumQueries: [{ artist: 'Artist A', title: 'Album One' }] }]
                await open({ series, address: '/albums/abc%201', params: { seriesId: 'abc 1' } })
                expect(await blend()).toBe('/blend?seriesId=abc%201')
            })

            it('carries the series of the page when the address names it', async () => {
                await open({ address: '/albums/s1', params: { seriesId: 's1' } })
                expect(await blend()).toBe('/blend?seriesId=s1')
            })

            it('on the page of every series, opens the Blend with none chosen', async () => {
                await open()
                expect(await blend()).toBe('/blend')
            })
        })
    })

    describe('the filter bar', () => {
        it('offers the artists the series ask for and the series of the library, with their labels', async () => {
            await open()

            expect(options('#filter-artist').slice(1)).toEqual([{ value: 'Artist A', label: 'Artist A' }])
            expect(options('#filter-artist')[0]).toEqual({ value: 'all', label: 'All Artists' })
            expect(options('#filter-series')[0]).toEqual({ value: 'all', label: 'All Series' })
            expect(options('#filter-series').slice(1)).toEqual([{ value: 's1', label: 'My Series' }])
            expect(select('filter-series').value).toBe('all')
            expect(select('filter-artist').value).toBe('all')
        })

        it('offers the decades, the sources and the orders, none chosen at first', async () => {
            await open()

            expect(options('#filter-year').map(option => option.label)).toContain('1970s')
            expect(options('#filter-year').map(option => option.label)).toContain('2000s+')
            expect(select('filter-year').value).toBe('all')
            expect(options('#filter-source').map(option => option.value)).toEqual(expect.arrayContaining(['all', 'user', 'pending', 'acclaim', 'popularity', 'ai']))
            expect(select('filter-source').value).toBe('all')
            expect(options('#genericSort').map(option => option.label)).toEqual(['# of Albums (↑)', '# of Albums (↓)', 'Name (A-Z)', 'Name (Z-A)', 'Newest', 'Oldest'])
        })

        it('on the page of one series, the list of series stands on that series', async () => {
            await open({ address: '/albums/s1', params: { seriesId: 's1' } })
            expect(select('filter-series').value).toBe('s1')
        })

        it('tells the controller what the person types, filters and sorts', async () => {
            await open()
            const search = vi.spyOn(controller, 'handleSearch')
            const filter = vi.spyOn(controller, 'handleFilterChange')
            const sort = vi.spyOn(controller, 'handleSort')

            await change(document.querySelector('#genericSearch')!, 'one')
            await change(select('filter-artist'), 'Artist A')
            await change(select('genericSort'), 'alpha')

            expect(search).toHaveBeenCalledWith('one')
            expect(filter).toHaveBeenCalledWith('artist', 'Artist A')
            expect(sort).toHaveBeenCalledWith('alpha')
        })

        it('choosing a series in the list moves the scope; choosing all goes back', async () => {
            await open()
            const scope = vi.spyOn(controller, 'loadScope')

            await change(select('filter-series'), 's1')
            expect(scope).toHaveBeenLastCalledWith('SINGLE', 's1', false)
            await change(select('filter-series'), 'all')
            expect(scope).toHaveBeenLastCalledWith('ALL', null, false)
        })
    })

    describe('the grid', () => {
        it('is the grid for the compact view of all the series, in a group each', async () => {
            await open()
            expect(document.querySelector('#series-grid-mount .all-series-container .series-group[data-series-id="s1"] .albums-grid')).not.toBeNull()
            expect(document.querySelector('.expanded-album-card')).toBeNull()
        })

        it('is the list for the expanded view', async () => {
            await open({ storage: { albumsViewMode: 'expanded' } })
            expect(document.querySelector('.expanded-album-card')).not.toBeNull()
            expect(document.querySelector('.albums-grid')).toBeNull()
        })
    })
})
