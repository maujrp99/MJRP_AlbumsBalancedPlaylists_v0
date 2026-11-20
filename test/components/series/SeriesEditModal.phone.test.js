/**
 * F76 (REQ-09) - «Edit Series» on the phone: each album of the series moves up and down by a tap
 * (no drag), every button has a name, and nothing is written until «Save Changes». On the
 * computer the rows are the ones of today (no move buttons).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const seriesService = vi.hoisted(() => ({ updateSeries: vi.fn() }))
const store = vi.hoisted(() => ({ series: [], db: {} }))
const toast = vi.hoisted(() => ({ warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: { scanArtist: vi.fn() } }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: () => seriesService }))
vi.mock('../../../public/js/stores/albumSeries.js', () => ({
    albumSeriesStore: { getSeries: () => store.series, getDb: () => store.db, getUserId: () => 'user-1' }
}))
vi.mock('../../../public/js/components/Toast.js', () => ({ default: toast, toast }))

import { SeriesEditModal } from '../../../public/js/components/series/SeriesEditModal.js'

function screenIs(phone) {
    window.matchMedia = (query) => ({
        matches: query.includes('max-width') ? phone : false,
        addEventListener: () => { },
        removeEventListener: () => { }
    })
}

describe('Edit Series on the phone (F76)', () => {
    const modal = () => document.getElementById('edit-series-modal')
    const $$ = (selector) => [...modal().querySelectorAll(selector)]
    const listed = () => $$('[data-album-row] > span').map(span => span.textContent)

    beforeEach(() => {
        store.series = [{ id: 's1', name: 'Rap', albumQueries: ['A - One', 'B - Two', 'C - Three'] }]
        seriesService.updateSeries.mockReset().mockResolvedValue()
        vi.spyOn(console, 'log').mockImplementation(() => { })
    })

    afterEach(() => {
        modal()?.remove()
        vi.restoreAllMocks()
    })

    it('moves an album up and down by a tap, and saves the new order', async () => {
        screenIs(true)
        SeriesEditModal.open('s1', vi.fn())

        $$('[data-action="move-down"]')[0].click()
        expect(listed()).toEqual(['B - Two', 'A - One', 'C - Three'])
        $$('[data-action="move-up"]')[2].click()
        expect(listed()).toEqual(['B - Two', 'C - Three', 'A - One'])
        expect(seriesService.updateSeries).not.toHaveBeenCalled()

        modal().querySelector('[data-action="save-series"]').click()
        await Promise.resolve()
        expect(seriesService.updateSeries.mock.calls[0][1].albumQueries).toEqual(['B - Two', 'C - Three', 'A - One'])
    })

    it('the ends cannot move further, and every button of a row has a name', () => {
        screenIs(true)
        SeriesEditModal.open('s1', vi.fn())

        expect($$('[data-action="move-up"]')[0].disabled).toBe(true)
        expect($$('[data-action="move-down"]')[2].disabled).toBe(true)
        expect($$('[data-album-row] button').filter(b => !b.getAttribute('aria-label'))).toEqual([])
    })

    it('on the computer the rows have no move buttons, as today', () => {
        screenIs(false)
        SeriesEditModal.open('s1', vi.fn())

        expect($$('[data-action="move-up"], [data-action="move-down"]')).toEqual([])
        expect($$('[data-action="remove-album"]')).toHaveLength(3)
    })
})
