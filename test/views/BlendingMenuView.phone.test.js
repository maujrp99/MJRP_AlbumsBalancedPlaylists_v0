/**
 * F76 (REQ-10) - the Blend on the phone: the series are reached without a box that scrolls inside
 * the page (one row, and a full sheet with a search), and «Blend it!» stays in an action bar, off
 * while a step is missing and the note saying which. On the computer the list and the button are
 * the ones of today, and no bar is drawn.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const SERIES = Array.from({ length: 50 }, (_, i) => ({ id: `s${i}`, name: i === 7 ? 'Rush &amp; Friends' : `Series ${i}`, albumQueries: ['A - B', 'C - D'] }))

vi.mock('../../public/js/controllers/BlendingController.js', () => ({ blendingController: { generateFromSeries: vi.fn() } }))
vi.mock('../../public/js/stores/albumSeries.js', () => ({
    albumSeriesStore: { getDb: () => null, getUserId: () => 'u1', getSeries: () => SERIES }
}))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { findAlbum: vi.fn().mockResolvedValue(null), getArtworkUrl: vi.fn() } }))

import { BlendingMenuView } from '../../public/js/views/BlendingMenuView.js'

function screenIs(phone) {
    window.matchMedia = (query) => ({
        matches: query.includes('max-width') ? phone : false,
        addEventListener: () => { },
        removeEventListener: () => { }
    })
}

describe('Blend on the phone (F76, REQ-10)', () => {
    let app, view
    const $ = (selector) => document.querySelector(selector)
    const rows = () => [...document.querySelectorAll('.blend-sheet__row')]
    const search = (text) => {
        const field = $('.blend-sheet__search')
        field.value = text
        field.dispatchEvent(new Event('input'))
    }

    const open = async (phone, query = {}) => {
        screenIs(phone)
        view = new BlendingMenuView()
        app.appendChild(await view.render({ query }))
        await view.mount({ query })
    }

    beforeEach(() => {
        window.scrollTo = () => { }
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'debug').mockImplementation(() => { })
    })

    afterEach(() => {
        view.destroy()
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    it('step 1 is one row, not a list in a box that scrolls', async () => {
        await open(true)

        expect($('#blend-series-pick')).not.toBeNull()
        expect($('#blend-series-pick').textContent).toContain('Choose a series')
        expect($('#blend-series-pick').textContent).toContain('50 series to choose from')
        expect(document.querySelectorAll('.blend-series-card')).toHaveLength(0)
        expect(document.querySelector('.max-h-64')).toBeNull()
    })

    it('the row opens a full sheet with a search and every series; the search narrows as one types', async () => {
        await open(true)

        $('#blend-series-pick').click()

        expect($('.sheet--full')).not.toBeNull()
        expect($('.blend-sheet__search').getAttribute('aria-label')).toBe('Search series')
        expect(rows()).toHaveLength(50)

        search('series 1')
        expect(rows().map(r => r.textContent)).toContain('Series 12 albums')
        expect(rows()).toHaveLength(11) // 1, 10..19
        expect($('.blend-sheet__status').textContent).toBe('11 of 50 series')

        search('rush & fr')
        expect(rows()).toHaveLength(1)
        expect(rows()[0].querySelector('.blend-sheet__name').textContent).toBe('Rush & Friends')
    })

    it('a tap on a series chooses it, closes the sheet and unlocks the recipe', async () => {
        await open(true)
        $('#blend-series-pick').click()
        search('series 42')

        rows()[0].click()
        await Promise.resolve()

        expect(view.selectedSeries.id).toBe('s42')
        expect($('#blend-recipe-cards')).not.toBeNull()
        expect($('#blend-series-pick').textContent).toContain('Series 42')
        expect($('#blend-series-pick').textContent).toContain('Change')
    })

    it('«Blend it!» is in the bar, off with the reason, until series and recipe are chosen', async () => {
        await open(true)

        expect($('#blend-phone-bar').classList.contains('md:hidden')).toBe(true)
        expect($('#blend-bar-btn').disabled).toBe(true)
        expect($('#blend-phone-bar').textContent).toContain('Step 1 of 4: choose a series')

        $('#blend-series-pick').click()
        rows()[3].click()
        await new Promise(resolve => setTimeout(resolve, 0))
        expect($('#blend-bar-btn').disabled).toBe(true)
        expect($('#blend-phone-bar').textContent).toContain('Step 2 of 4: choose a recipe')

        document.querySelector('.blend-recipe-card').click()
        await new Promise(resolve => setTimeout(resolve, 0))
        expect($('#blend-bar-btn').disabled).toBe(false)
        expect($('#blend-phone-bar').textContent).toContain('60 min')
    })

    it('the bar\'s button takes the same path as the computer\'s', async () => {
        await open(true, { seriesId: 's2' })
        document.querySelector('.blend-recipe-card').click()
        await new Promise(resolve => setTimeout(resolve, 0))
        const generate = vi.spyOn(view, 'handleGenerate').mockResolvedValue()

        $('#blend-bar-btn').click()

        expect(generate).toHaveBeenCalledTimes(1)
    })

    it('the step labels say which one is current', async () => {
        await open(true, { seriesId: 's2' })

        const current = $('.blend-stepper__step[aria-current="step"]')
        expect(current.textContent).toContain('Recipe')
    })

    it('on the computer: the list of cards as today, no row, no sheet, no bar', async () => {
        await open(false)

        expect(document.querySelectorAll('.blend-series-card')).toHaveLength(50)
        expect($('#blend-series-pick')).toBeNull()
        expect($('#blend-phone-bar')).toBeNull()
    })
})
