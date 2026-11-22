/**
 * F76 (REQ-09) - «Edit Series» on the phone (carried over in F83 wave 5b from test/components/series/SeriesEditModal.phone.test.js): each album of
 * the series moves up and down by a tap (no drag), every button has a name, and nothing is written until «Save Changes». On the computer the rows
 * are the ones of today (no move buttons).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const seriesService = vi.hoisted(() => ({ updateSeries: vi.fn() }))
const store = vi.hoisted(() => ({ series: [] as unknown[], db: {} }))
const toast = vi.hoisted(() => ({ warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: { scanArtist: vi.fn() } }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: () => seriesService }))
vi.mock('../../../public/js/stores/albumSeries.js', () => ({
    albumSeriesStore: { getSeries: () => store.series, getDb: () => store.db, getUserId: () => 'user-1' }
}))
vi.mock('../../../public/js/components/Toast.js', () => ({ default: toast, toast }))

import { act } from 'react'
import { mountWindows, press, settle, type MountedWindows } from '../../support/albumWindowsHost'

function screenIs(phone: boolean) {
    window.matchMedia = ((query: string) => ({
        matches: query.includes('max-width') ? phone : false,
        addEventListener: () => { },
        removeEventListener: () => { }
    })) as unknown as typeof window.matchMedia
}

describe('Edit Series on the phone (F76)', () => {
    let mounted: MountedWindows
    const modal = () => document.getElementById('edit-series-modal')!
    const $$ = (selector: string) => [...modal().querySelectorAll<HTMLElement>(selector)]
    const listed = () => $$('[data-album-row] > span').map(span => span.textContent)

    beforeEach(async () => {
        store.series = [{ id: 's1', name: 'Rap', albumQueries: ['A - One', 'B - Two', 'C - Three'] }]
        seriesService.updateSeries.mockReset().mockResolvedValue(undefined)
        vi.spyOn(console, 'log').mockImplementation(() => { })
        mounted = await mountWindows()
    })

    afterEach(async () => {
        await mounted.unmount()
        delete (window as { matchMedia?: unknown }).matchMedia
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    it('moves an album up and down by a tap, and saves the new order', async () => {
        screenIs(true)
        await act(async () => { mounted.windows().openEdit('s1') })

        await press($$('[data-action="move-down"]')[0])
        expect(listed()).toEqual(['B - Two', 'A - One', 'C - Three'])
        await press($$('[data-action="move-up"]')[2])
        expect(listed()).toEqual(['B - Two', 'C - Three', 'A - One'])
        expect(seriesService.updateSeries).not.toHaveBeenCalled()

        await press(modal().querySelector('[data-action="save-series"]'))
        await settle()
        expect(seriesService.updateSeries.mock.calls[0][1].albumQueries).toEqual(['B - Two', 'C - Three', 'A - One'])
    })

    it('the ends cannot move further, and every button of a row has a name', async () => {
        screenIs(true)
        await act(async () => { mounted.windows().openEdit('s1') })

        expect(($$('[data-action="move-up"]')[0] as HTMLButtonElement).disabled).toBe(true)
        expect(($$('[data-action="move-down"]')[2] as HTMLButtonElement).disabled).toBe(true)
        expect($$('[data-album-row] button').filter(b => !b.getAttribute('aria-label'))).toEqual([])
    })

    it('on the computer the rows have no move buttons, as today', async () => {
        screenIs(false)
        await act(async () => { mounted.windows().openEdit('s1') })

        expect($$('[data-action="move-up"], [data-action="move-down"]')).toEqual([])
        expect($$('[data-action="remove-album"]')).toHaveLength(3)
    })

    it('a pressed button is gone when the list is drawn again, so the focus goes back to the page (as the hand-made list did)', async () => {
        screenIs(true)
        await act(async () => { mounted.windows().openEdit('s1') })
        const first = $$('[data-action="remove-album"]')[0]
        first.focus()

        await press(first)

        expect(document.activeElement).toBe(document.body)
    })
})
