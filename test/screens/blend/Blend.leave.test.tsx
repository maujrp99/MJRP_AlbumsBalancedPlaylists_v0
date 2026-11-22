/**
 * F83 wave 7b (REQ-01, risk R2): the Blend screen, once left, hears nothing. The visit (one for each visit, made by the route) starts the read of the series in
 * `prepare` and lets go in `dispose`: the albums a generation waits for are dropped, and a cover that arrives afterwards draws nothing. The stores, the language and
 * the phone of the bridge, and the window, are counted by the mold. The screen listens to no store at all (the series are a photo), so the count is zero by design.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../public/js/controllers/BlendingController.js', async () => (await import('../../support/blendStandIns.js')).controller())
vi.mock('../../../public/js/stores/albumSeries.js', async () => (await import('../../support/blendStandIns.js')).seriesStore())
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/blendStandIns.js')).seriesService())
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/blendStandIns.js')).albumLoader())
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/blendStandIns.js')).toastStandIn())

import { act } from 'react'
import { Blend } from '../../../public/js/screens/blend/Blend'
import { BlendVisit } from '../../../public/js/screens/blend/blendVisit'
import { itLeavesNoListeners, renderScreen } from '../../support/renderScreen'
import { asPhone } from '../../support/playlistsScenarios.js'
import { reset, world } from '../../support/blendStandIns.js'

const SERIES = [{ id: 's1', name: 'Floyd', albumQueries: ['Pink Floyd - The Wall', 'Pink Floyd - Animals'] }, { id: 's2', name: 'Rush', albumQueries: ['Rush - 2112'] }]

beforeEach(() => { reset({ series: SERIES }); asPhone(false); vi.spyOn(console, 'log').mockImplementation(() => {}) })
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })

// a new visit for each entering, as the route makes one
let visit = new BlendVisit()
const visits = { get visit() { return visit } }
const view = {
    prepare: async () => { visit = new BlendVisit(); visit.start() },
    dispose: () => visit.dispose()
}

itLeavesNoListeners('Blend', Blend, visits, { screen: 'blend', view })

describe('the Blend screen once left', () => {
    it('a cover that arrives after the screen was left draws nothing (the visit tells no one)', async () => {
        reset({ series: SERIES, cover: 'wait' })
        const rendered = await renderScreen(Blend, visits, { screen: 'blend', view })
        const heard = vi.fn()
        visit.subscribe(heard)
        await rendered.leave()
        const before = visit.getVersion()
        await act(async () => { world.arrive(); await new Promise(resolve => setTimeout(resolve, 20)); world.arrive() })
        expect(visit.getVersion()).toBe(before)
        expect(heard).not.toHaveBeenCalled()
    })

    it('leaving drops the albums a generation waits for (the signal is aborted) and says nothing', async () => {
        reset({ series: SERIES, generate: 'cancel' })
        const rendered = await renderScreen(Blend, visits, { screen: 'blend', view })
        await rendered.act(async () => { document.querySelector<HTMLElement>('.blend-series-card')!.click() })
        await rendered.act(async () => { document.querySelector<HTMLElement>('[data-recipe-id="top-n-popular"]')!.click() })
        await rendered.act(async () => { document.querySelector<HTMLElement>('#blend-generate-btn')!.click() })
        expect(world.calls.some((call: string) => call.startsWith('generate '))).toBe(true)
        await rendered.leave()
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
        expect(world.calls).toContain('aborted')
        expect(world.calls.filter((call: string) => /^toast|^navigate/.test(call))).toEqual([])
    })
})
