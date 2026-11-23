/**
 * F83 wave 7b, the judge's fixes (P1-1, P2-1, P2-2): what the browser could see and jsdom can say as structure.
 *
 *  - P1-1: a button of the ingredients draws the page anew, but the section of step 4 is the SAME element before and after (the hand-made screen
 *    rebuilt its contents, not the section). A section removed and inserted again in the same update makes Chromium clamp the scroll of the page.
 *  - P2-1: the marks of the stepper and the cards of the series are made anew when their state changes (as the hand-made screen did), so the
 *    transition of their classes never runs: no fade where the old screen changed at once. The covers that arrive remount nothing (the card keeps).
 *  - P2-2: a series chosen keeps the scroll of the list (the hand-made screen sent it back to the top): on purpose, the second difference of the wave.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'

vi.mock('../../../public/js/controllers/BlendingController.js', async () => (await import('../../support/blendStandIns.js')).controller())
vi.mock('../../../public/js/stores/albumSeries.js', async () => (await import('../../support/blendStandIns.js')).seriesStore())
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/blendStandIns.js')).seriesService())
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/blendStandIns.js')).albumLoader())
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/blendStandIns.js')).toastStandIn())

import { blendView } from '../../../public/js/screens/blend/index'
import { reset } from '../../support/blendStandIns.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const SERIES = [
    { id: 's1', name: 'Floyd', albumQueries: ['Pink Floyd - The Wall'] },
    { id: 's2', name: 'Rush', albumQueries: ['Rush - 2112'] }
]
const flush = () => new Promise(resolve => setTimeout(resolve, 30))

describe('Blend: what stays mounted and what is made anew', () => {
    let app: HTMLElement
    let view: ReturnType<typeof blendView>

    const open = async () => {
        view = blendView()
        await act(async () => { await view.render({ query: {} }); view.mount({ query: {} }); await flush() })
    }
    const click = async (selector: string) => { await act(async () => { (app.querySelector(selector) as HTMLElement).click(); await flush() }) }
    const card = (id: string) => `.blend-series-card[data-series-id="${id}"]`
    const marks = () => Array.from(app.querySelectorAll('.blend-stepper__mark > div:first-child'))
    const ready = async () => { await click(card('s1')); await click('[data-recipe-id="top-n-popular"]') }
    const stepFour = () => app.querySelector('#blend-generate-section')!.closest('section')!

    beforeEach(() => {
        reset({ series: SERIES, db: null })
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        Element.prototype.scrollIntoView = vi.fn()
        window.matchMedia = vi.fn(() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })) as never
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'debug').mockImplementation(() => { })
    })

    afterEach(async () => {
        await act(async () => { view.destroy() })
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('P1-1: the section of step 4 survives a button of the ingredients (and the contents are made anew)', async () => {
        await open()
        await ready()
        const section = stepFour()
        const contents = app.querySelector('#blend-generate-section')
        await click('[data-grouping="shuffle"]')
        expect(stepFour()).toBe(section)
        expect(app.querySelector('#blend-generate-section')).not.toBe(contents)
        await click('[data-output="multiple"]')
        expect(stepFour()).toBe(section)
    })

    it('P1-1: the section of step 4 survives a choice of recipe', async () => {
        await open()
        await ready()
        const section = stepFour()
        await click('[data-recipe-id="top-n-acclaimed"]')
        expect(stepFour()).toBe(section)
    })

    it('P2-1: a mark of the stepper is made anew when its state changes, and only that one', async () => {
        await open()
        const before = marks()
        await click(card('s1'))
        const after = marks()
        // step 1 went from current to done, step 2 from waiting to current: new elements; steps 3 and 4 did not change state: the same
        expect(after[0]).not.toBe(before[0])
        expect(after[1]).not.toBe(before[1])
        expect(after[2]).toBe(before[2])
        expect(after[3]).toBe(before[3])
    })

    it('P2-1: a card of the series is made anew when it is chosen or let go, and the others stay', async () => {
        await open()
        const s1 = app.querySelector(card('s1'))
        const s2 = app.querySelector(card('s2'))
        await click(card('s1'))
        expect(app.querySelector(card('s1'))).not.toBe(s1)
        expect(app.querySelector(card('s2'))).toBe(s2)
        const chosen = app.querySelector(card('s1'))
        await click(card('s2'))
        expect(app.querySelector(card('s1'))).not.toBe(chosen)
        expect(app.querySelector(card('s2'))).not.toBe(s2)
    })

    it('P2-2 (on purpose): choosing a series keeps the scroll of the list where it was', async () => {
        await open()
        const list = app.querySelector(card('s1'))!.parentElement as HTMLElement
        list.scrollTop = 120
        await click(card('s2'))
        expect((app.querySelector(card('s2'))!.parentElement as HTMLElement)).toBe(list)
        expect(list.scrollTop).toBe(120)
    })
})
