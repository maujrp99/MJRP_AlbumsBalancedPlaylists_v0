/**
 * F63 (UAT-07, UAT-192) - coming from a series by "Blend your Albums" (/blend?seriesId=<id>), the
 * Blending Menu opens with that series already chosen and the recipe step unlocked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const SERIES = [
    { id: 's1', name: 'Floyd', albumQueries: [] },
    { id: 's2', name: 'Rush', albumQueries: [] }
]

vi.mock('../../public/js/controllers/BlendingController.js', () => ({ blendingController: { generateFromSeries: vi.fn() } }))
vi.mock('../../public/js/stores/albumSeries.js', () => ({
    albumSeriesStore: { getDb: () => null, getUserId: () => 'u1', getSeries: () => SERIES }
}))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { findAlbum: vi.fn(), getArtworkUrl: vi.fn() } }))
vi.mock('../../public/js/components/blend/BlendRecipeCard.js', () => ({
    BlendRecipeCard: class { render() { } }
}))
vi.mock('../../public/js/components/blend/BlendIngredientsPanel.js', () => ({
    BlendIngredientsPanel: class { render() { } setRecipe() { } getConfig() { return {} } }
}))

import { BlendingMenuView } from '../../public/js/views/BlendingMenuView.js'

describe('Blending Menu opened from a series (F63)', () => {
    let app

    const open = async (query) => {
        const view = new BlendingMenuView()
        const params = { query }
        app.appendChild(await view.render(params))
        await view.mount(params)
        return view
    }
    const chosenCard = () => app.querySelector('.blend-series-card.border-orange-400')

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        vi.spyOn(console, 'log').mockImplementation(() => { })
    })

    afterEach(() => {
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('comes with the series of the address chosen, and the recipe step unlocked', async () => {
        const view = await open({ seriesId: 's2' })

        expect(view.selectedSeries).toEqual(SERIES[1])
        expect(chosenCard().dataset.seriesId).toBe('s2')
        expect(chosenCard().getAttribute('aria-pressed')).toBe('true')
        expect(app.querySelector('#blend-recipe-cards')).not.toBeNull()
        expect(app.textContent).not.toContain('Complete Step 1 to unlock')
    })

    it('with no series in the address, none is chosen (as before)', async () => {
        const view = await open({})

        expect(view.selectedSeries).toBeNull()
        expect(chosenCard()).toBeNull()
        expect(app.textContent).toContain('Complete Step 1 to unlock')
    })

    it('a series that does not exist (removed, or of another account) chooses none and breaks nothing', async () => {
        const view = await open({ seriesId: 'gone' })

        expect(view.selectedSeries).toBeNull()
        expect(chosenCard()).toBeNull()
        expect(app.querySelectorAll('.blend-series-card')).toHaveLength(2)
    })

    it('the person can still choose another series afterwards', async () => {
        const view = await open({ seriesId: 's2' })

        app.querySelector('.blend-series-card[data-series-id="s1"]').click()
        await vi.waitFor(() => expect(view.selectedSeries).toEqual(SERIES[0]))

        expect(chosenCard().dataset.seriesId).toBe('s1')
    })
})
