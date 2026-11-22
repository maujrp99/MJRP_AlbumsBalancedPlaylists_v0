/**
 * F63 (UAT-07, UAT-192) - coming from a series by "Blend your Albums" (/blend?seriesId=<id>), the
 * Blending Menu opens with that series already chosen and the recipe step unlocked.
 *
 * Carried to the Blend screen in React (F83 wave 7b) from test/views/BlendingMenuView.fromSeries.test.js: the same four cases and the same assertions;
 * the scaffold is what changed (the screen is opened through its route, and the series chosen is read from the page, not from a field of the old view).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'

vi.mock('../../../public/js/controllers/BlendingController.js', async () => (await import('../../support/blendStandIns.js')).controller())
vi.mock('../../../public/js/stores/albumSeries.js', async () => (await import('../../support/blendStandIns.js')).seriesStore())
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/blendStandIns.js')).seriesService())
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/blendStandIns.js')).albumLoader())
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/blendStandIns.js')).toastStandIn())

import { blendView } from '../../../public/js/screens/blend/index'
import { reset } from '../../support/blendStandIns.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const SERIES = [
    { id: 's1', name: 'Floyd', albumQueries: [] },
    { id: 's2', name: 'Rush', albumQueries: [] }
]
const flush = () => new Promise(resolve => setTimeout(resolve, 30))

describe('Blending Menu opened from a series (F63)', () => {
    let app: HTMLElement
    let view: ReturnType<typeof blendView>

    const open = async (query: Record<string, string>) => {
        view = blendView()
        await act(async () => {
            await view.render({ query })
            view.mount({ query })
            await flush()
        })
    }
    const chosenCard = () => app.querySelector<HTMLElement>('.blend-series-card.border-orange-400')

    beforeEach(() => {
        reset({ series: SERIES, db: null })
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        Element.prototype.scrollIntoView = vi.fn()
        window.matchMedia = vi.fn(() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })) as never
        vi.spyOn(console, 'log').mockImplementation(() => { })
    })

    afterEach(async () => {
        await act(async () => { view.destroy() })
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('comes with the series of the address chosen, and the recipe step unlocked', async () => {
        await open({ seriesId: 's2' })

        expect(chosenCard()!.dataset.seriesId).toBe('s2')
        expect(chosenCard()!.getAttribute('aria-pressed')).toBe('true')
        expect(app.querySelector('#blend-recipe-cards')).not.toBeNull()
        expect(app.textContent).not.toContain('Complete Step 1 to unlock')
    })

    it('with no series in the address, none is chosen (as before)', async () => {
        await open({})

        expect(chosenCard()).toBeNull()
        expect(app.textContent).toContain('Complete Step 1 to unlock')
    })

    it('a series that does not exist (removed, or of another account) chooses none and breaks nothing', async () => {
        await open({ seriesId: 'gone' })

        expect(chosenCard()).toBeNull()
        expect(app.querySelectorAll('.blend-series-card')).toHaveLength(2)
    })

    it('the person can still choose another series afterwards', async () => {
        await open({ seriesId: 's2' })

        await act(async () => { app.querySelector<HTMLElement>('.blend-series-card[data-series-id="s1"]')!.click(); await flush() })

        expect(chosenCard()!.dataset.seriesId).toBe('s1')
    })
})
