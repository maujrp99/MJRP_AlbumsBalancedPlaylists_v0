/**
 * F76 (REQ-10) - the Blend on the phone: the series are reached without a box that scrolls inside
 * the page (one row, and a full sheet with a search), and «Blend it!» stays in an action bar, off
 * while a step is missing and the note saying which. On the computer the list and the button are
 * the ones of today, and no bar is drawn.
 *
 * Carried to the Blend screen in React (F83 wave 7b) from test/views/BlendingMenuView.phone.test.js: the same seven cases and the same assertions; the
 * scaffold is what changed (the screen is opened through its route; «the bar's button takes the same path» is read from what the generation is asked).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'

vi.mock('../../../public/js/controllers/BlendingController.js', async () => (await import('../../support/blendStandIns.js')).controller())
vi.mock('../../../public/js/stores/albumSeries.js', async () => (await import('../../support/blendStandIns.js')).seriesStore())
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/blendStandIns.js')).seriesService())
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/blendStandIns.js')).albumLoader())
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/blendStandIns.js')).toastStandIn())

import { blendView } from '../../../public/js/screens/blend/index'
import { reset, world } from '../../support/blendStandIns.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const SERIES = Array.from({ length: 50 }, (_, i) => ({ id: `s${i}`, name: i === 7 ? 'Rush &amp; Friends' : `Series ${i}`, albumQueries: ['A - B', 'C - D'] }))
const flush = () => new Promise(resolve => setTimeout(resolve, 30))

function screenIs(phone: boolean) {
    window.matchMedia = ((query: string) => ({
        matches: query.includes('max-width') ? phone : false,
        addEventListener: () => { },
        removeEventListener: () => { }
    })) as never
}

describe('Blend on the phone (F76, REQ-10)', () => {
    let app: HTMLElement
    let view: ReturnType<typeof blendView>
    const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)
    const rows = () => [...document.querySelectorAll<HTMLElement>('.blend-sheet__row')]
    const search = async (text: string) => {
        await act(async () => {
            const field = $<HTMLInputElement>('.blend-sheet__search')!
            field.value = text
            field.dispatchEvent(new Event('input', { bubbles: true }))
            await flush()
        })
    }
    const click = async (element: HTMLElement) => { await act(async () => { element.click(); await flush() }) }

    const open = async (phone: boolean, query: Record<string, string> = {}) => {
        screenIs(phone)
        view = blendView()
        await act(async () => {
            await view.render({ query })
            view.mount({ query })
            await flush()
        })
    }

    beforeEach(() => {
        reset({ series: SERIES, db: null, cover: 'none' })
        window.scrollTo = () => { }
        Element.prototype.scrollIntoView = vi.fn()
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'debug').mockImplementation(() => { })
    })

    afterEach(async () => {
        await act(async () => { view.destroy() })
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    it('step 1 is one row, not a list in a box that scrolls', async () => {
        await open(true)

        expect($('#blend-series-pick')).not.toBeNull()
        expect($('#blend-series-pick')!.textContent).toContain('Choose a series')
        expect($('#blend-series-pick')!.textContent).toContain('50 series to choose from')
        expect(document.querySelectorAll('.blend-series-card')).toHaveLength(0)
        expect(document.querySelector('.max-h-64')).toBeNull()
    })

    it('the row opens a full sheet with a search and every series; the search narrows as one types', async () => {
        await open(true)

        await click($('#blend-series-pick')!)

        expect($('.sheet--full')).not.toBeNull()
        expect($('.blend-sheet__search')!.getAttribute('aria-label')).toBe('Search series')
        expect(rows()).toHaveLength(50)

        await search('series 1')
        expect(rows().map(r => r.textContent)).toContain('Series 12 albums')
        expect(rows()).toHaveLength(11) // 1, 10..19
        expect($('.blend-sheet__status')!.textContent).toBe('11 of 50 series')

        await search('rush & fr')
        expect(rows()).toHaveLength(1)
        expect(rows()[0].querySelector('.blend-sheet__name')!.textContent).toBe('Rush & Friends')
    })

    it('a tap on a series chooses it, closes the sheet and unlocks the recipe', async () => {
        await open(true)
        await click($('#blend-series-pick')!)
        await search('series 42')

        await click(rows()[0])

        expect($('#blend-recipe-cards')).not.toBeNull()
        expect($('#blend-series-pick')!.textContent).toContain('Series 42')
        expect($('#blend-series-pick')!.textContent).toContain('Change')
    })

    it('«Blend it!» is in the bar, off with the reason, until series and recipe are chosen', async () => {
        await open(true)

        expect($('#blend-phone-bar')!.classList.contains('md:hidden')).toBe(true)
        expect($<HTMLButtonElement>('#blend-bar-btn')!.disabled).toBe(true)
        expect($('#blend-phone-bar')!.textContent).toContain('Step 1 of 4: choose a series')

        await click($('#blend-series-pick')!)
        await click(rows()[3])
        expect($<HTMLButtonElement>('#blend-bar-btn')!.disabled).toBe(true)
        expect($('#blend-phone-bar')!.textContent).toContain('Step 2 of 4: choose a recipe')

        await click(document.querySelector<HTMLElement>('.blend-recipe-card')!)
        expect($<HTMLButtonElement>('#blend-bar-btn')!.disabled).toBe(false)
        expect($('#blend-phone-bar')!.textContent).toContain('60 min')
    })

    it('the bar\'s button takes the same path as the computer\'s', async () => {
        await open(true, { seriesId: 's2' })
        await click(document.querySelector<HTMLElement>('.blend-recipe-card')!)

        await click($('#blend-bar-btn')!)
        await act(async () => { await flush() })

        expect(world.calls.filter((call: string) => call.startsWith('generate '))).toHaveLength(1)
        expect(world.calls.find((call: string) => call.startsWith('generate '))).toContain('"algorithmId":"mjrp-balanced-cascade"')
    })

    it('the step labels say which one is current', async () => {
        await open(true, { seriesId: 's2' })

        const current = $('.blend-stepper__step[aria-current="step"]')
        expect(current!.textContent).toContain('Recipe')
    })

    it('on the computer: the list of cards as today, no row, no sheet, no bar', async () => {
        await open(false)

        expect(document.querySelectorAll('.blend-series-card')).toHaveLength(50)
        expect($('#blend-series-pick')).toBeNull()
        expect($('#blend-phone-bar')).toBeNull()
    })
})
