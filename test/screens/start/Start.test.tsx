/**
 * F83 wave 4 (REQ-01, REQ-04; TASK-21): the Start screen in React, under the router, and the handle the browser proof drives it by.
 *
 *  - the mold of every screen: enter and leave five times and nothing of the screen is still listening (the stores, the language, the
 *    phone, the window; the album picker's scan that is still on its way draws nothing);
 *  - the route: `startView()` makes the controller, starts it before the first draw, hands it to `window.controller` and lets it go when
 *    the screen is left;
 *  - the handle: the browser proof of the Home (F79) and the visual sensor of F84 (test/visual/visual.config.mjs) drive the page by
 *    `window.controller` and three seams; that is written here as the sensor writes it, so a change that breaks the sensor breaks a test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))
const series = vi.hoisted(() => ({ createSeries: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn(() => series) }))
vi.mock('../../../public/js/components/Toast.js', () => ({ default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

import { act } from 'react'
import { Start } from '../../../public/js/screens/start/Start'
import { StartController } from '../../../public/js/screens/start/StartController'
import { startView } from '../../../public/js/screens/start/index'
import { itLeavesNoListeners, renderScreen } from '../../support/renderScreen'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'
import { asPhone } from '../../support/startScenarios.js'

const album = (title: string, id = title) => ({ id, title, artist: 'Pink Floyd', year: '1977', releaseDate: '1977-01-01', type: 'Album', coverUrl: null })
const tick = () => new Promise(resolve => setImmediate(resolve))
const settle = () => act(async () => { for (let i = 0; i < 4; i++) await tick() })

afterEach(() => { document.body.innerHTML = ''; delete (window as { controller?: unknown }).controller; vi.restoreAllMocks() })

// a new controller for each visit, started before the screen is drawn and let go of when it is left, as the route does
let latest: StartController
const visits = {
    get controller() { return latest }
}
asPhone(false)
itLeavesNoListeners('Start', Start, visits, { screen: 'start', view: { prepare: async () => { latest = new StartController(); latest.initialize() }, dispose: () => latest.dispose() } })

describe('the route', () => {
    it('starts the controller before the first draw, exposes it as window.controller, and lets it go when the screen is left', async () => {
        asPhone(false)
        const view = startView()
        const app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        await act(async () => { await view.render({}); view.mount({}) })

        const controller = (window as { controller?: StartController }).controller!
        expect(controller).toBeInstanceOf(StartController)
        expect(app.querySelector('#homeStage')).not.toBeNull()
        expect(controller.disposed).toBe(false)

        await act(async () => { view.destroy() })
        expect(controller.disposed).toBe(true)
        expect(app.innerHTML).toBe('')
    })

    it('a scan that was still on its way when the screen was left draws nothing', async () => {
        asPhone(false)
        let answer: (value: unknown) => void = () => {}
        service.scanArtist.mockReturnValue(new Promise((resolve) => { answer = resolve }))
        const controller = new StartController()
        const screen = await renderScreen(Start, { controller }, { screen: 'start', view: { prepare: async () => { controller.initialize() }, dispose: () => controller.dispose() } })
        const draw = vi.spyOn(console, 'error')
        await act(async () => { void controller.search('pink floyd'); await tick() })
        await screen.leave()
        answer({ albums: [album('Animals')], reclassified: null })
        await settle()

        expect(draw).not.toHaveBeenCalled()
        expect(document.querySelector('#homeStage')).toBeNull()
    })
})

describe('the handle the visual sensor drives the page by (test/visual/visual.config.mjs)', () => {
    it('the seams and the methods it names are there and work: the catalog, the lookup, the writing of the series, the guest, the pasted list', async () => {
        asPhone(false)
        vi.spyOn(albumSeriesStore, 'getDb').mockReturnValue({})
        const controller = new StartController()
        const screen = await renderScreen(Start, { controller }, { screen: 'start', view: { prepare: async () => { controller.initialize() }, dispose: () => controller.dispose() } })
        const c = controller as unknown as Record<string, unknown> & StartController
        const list = ['Animals', 'Meddle', 'Atom Heart Mother', 'Wish You Were Here'].map(title => album(title))

        // what the sensor does to the page, as it writes it
        ;(c.picker as unknown as { service: unknown }).service = { scanArtist: async () => ({ albums: list, reclassified: null }) }
        c.albumSearchService = { search: async (artist: string, title: string) => (/Pinkk$/.test(title) ? [] : [{ id: `x-${title}`, title, artist, year: 1976, coverUrl: null }]) } as never
        const written: string[] = []
        c.writeSeries = async (name: string) => { written.push(name); return { id: 'proof-only-not-saved' } }
        const guest = async (on: boolean) => { await act(async () => { c.state.guest = on; c.redraw() }) }
        const search = async (q: string) => { await act(async () => { (document.querySelector('#artistScanInput') as HTMLInputElement).value = q; await c.search(q) }) }

        await guest(false)
        await search('Pink Floyd')
        expect(document.querySelectorAll('#discographyGrid .home-card')).toHaveLength(4)

        await act(async () => { list.forEach(a => c.clickCard(a.id)) })
        expect(document.querySelectorAll('.home-pile .home-dcv')).toHaveLength(4)
        await act(async () => { c.toggleOpen(); c.move(list[2].id, -1); c.removeWithUndo(list[1].id) })
        expect(document.querySelector('.home-undo')!.textContent).toContain('Removed «Meddle».')

        await act(async () => { c.setName('Pink Floyd, the studio years'); c.redraw() })
        expect((document.querySelector('#seriesNameInput') as HTMLInputElement).value).toBe('Pink Floyd, the studio years')
        await act(async () => { await c.createSeries() })
        expect(written).toEqual(['Pink Floyd, the studio years'])
        expect(document.querySelector('#btnBlendNow')).not.toBeNull()

        await guest(true)
        expect(document.querySelector('.home-guest')).not.toBeNull()

        await act(async () => { c.setMode('paste', 'Joni Mitchell - Hejira\nCaravan - In the Land of Grey and Pinkk') })
        expect(c.view.pasteList.value()).toBe('Joni Mitchell - Hejira\nCaravan - In the Land of Grey and Pinkk')
        await act(async () => { await c.addPastedList(c.view.pasteList.value()) })
        expect(document.querySelector('#homePasteSummary')!.textContent).toContain('Added 1 album.')
        await screen.leave()
    })
})
