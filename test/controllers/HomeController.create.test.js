/**
 * F79 - «Create series» on the Home: never without a name (^home-name-missing), the wait said in
 * words (^home-creating), what comes next once saved (^home-created: «Blend it now», «Open the
 * series», a click on a cover starts another series), and a failed save that keeps the albums
 * (^home-create-failed). The series service is replaced: nothing is written anywhere.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))
const series = vi.hoisted(() => ({ createSeries: vi.fn() }))
const navigate = vi.hoisted(() => vi.fn())

vi.mock('../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn(() => series) }))
vi.mock('../../public/js/router.js', () => ({ router: { navigate } }))
vi.mock('../../public/js/components/Toast.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import { HomeView } from '../../public/js/views/HomeView.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'

const TITLES = ['The Endless River', 'The Division Bell', 'A Momentary Lapse of Reason', 'The Final Cut']
const albums = TITLES.map((title, i) => ({ id: `a${i}`, title, artist: 'Pink Floyd', type: 'Album', year: String(2014 - i), releaseDate: `${2014 - i}-01-01` }))
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('Home: create the series (F79)', () => {
    let app, view
    const $ = (selector) => app.querySelector(selector)
    const dockText = () => $('.home-dock').textContent.replace(/\s+/g, ' ')
    const card = (i) => $(`#discographyGrid [data-id="a${i}"]`)

    beforeEach(async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(albumSeriesStore, 'getDb').mockReturnValue({})
        vi.spyOn(albumSeriesStore, 'getUserId').mockReturnValue('u1')
        series.createSeries.mockReset()
        navigate.mockReset()
        view = new HomeView()
        app.appendChild(await view.render({}))
        await view.mount({})
        service.scanArtist.mockResolvedValue({ albums, reclassified: null })
        $('#artistScanInput').value = 'Pink Floyd'
        $('#btnScanArtist').click()
        await flush()
        ;[0, 1, 2, 3].forEach(i => card(i).click())
    })

    afterEach(() => {
        view.destroy()
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('with the name emptied nothing is created: it asks for the name and offers the suggested one (^home-name-missing)', async () => {
        const field = $('#seriesNameInput')
        field.value = ''
        field.dispatchEvent(new Event('input', { bubbles: true }))

        $('#btnCreateSeries').click()
        await flush()

        expect(series.createSeries).not.toHaveBeenCalled()
        expect($('#seriesNameInput').getAttribute('aria-invalid')).toBe('true')
        expect($('#seriesNameInputError').textContent).toBe('Give the series a name first. Use «Pink Floyd selection»')
        expect(document.activeElement).toBe($('#seriesNameInput'))
        expect(app.textContent).not.toContain('New Album Series')

        $('[data-dock="use-name"]').click()
        expect($('#seriesNameInput').value).toBe('Pink Floyd selection')
        expect($('#seriesNameInputError')).toBeNull()
    })

    it('while it is written: «Creating…», busy, and «Saving your series…» with the small equalizer moving (^home-creating)', async () => {
        series.createSeries.mockReturnValue(new Promise(() => {}))

        $('#btnCreateSeries').click()
        await flush()

        expect($('#btnCreateSeries').textContent).toBe('Creating…')
        expect($('#btnCreateSeries').disabled).toBe(true)
        expect($('#btnCreateSeries').getAttribute('aria-busy')).toBe('true')
        expect(dockText()).toContain('Saving your series…')
        expect($('.home-dock .home-eq').dataset.state).toBe('live')
    })

    it('writes the name and the albums in the order of the series, as plain text', async () => {
        series.createSeries.mockResolvedValue({ id: 's1' })
        $('#homeSeriesPanel') // closed
        $('#btnEditOrder').click()
        $('#homeSeriesPanel .home-rows li:nth-child(4) .home-rbtn__up').click()

        $('#btnCreateSeries').click()
        await flush()

        const asked = series.createSeries.mock.calls[0][0]
        expect(asked.name).toBe('Pink Floyd selection')
        expect(asked.status).toBe('pending')
        expect(asked.albumQueries.map(query => query.title || query.album)).toEqual(['The Endless River', 'The Division Bell', 'The Final Cut', 'A Momentary Lapse of Reason'])
    })

    it('saved: where it is, «Blend it now» and «Open the series»; the covers lose their numbers (^home-created)', async () => {
        series.createSeries.mockResolvedValue({ id: 's1' })

        $('#btnCreateSeries').click()
        await flush()

        expect(dockText()).toContain('«Pink Floyd selection» is saved')
        expect(dockText()).toContain('4 albums · find it any time in Music Series.')
        expect($('#btnBlendNow').classList.contains('is-flame')).toBe(true)
        expect($('#btnOpenSeries').textContent).toBe('Open the series')
        expect($('#homeAfter').hidden).toBe(false)
        expect($('#homeAfter').textContent).toBe("«Pink Floyd selection» is saved and won't change here. Click a cover to start another series.")
        expect(card(0).classList.contains('is-in')).toBe(false)
        expect($('#btnAddAll').hidden).toBe(true)

        $('#btnBlendNow').click()
        expect(navigate).toHaveBeenLastCalledWith('/blend?seriesId=s1')
        $('#btnOpenSeries').click()
        expect(navigate).toHaveBeenLastCalledWith('/albums/s1')
    })

    it('after saving, a click on a cover starts another series; the saved one is not touched', async () => {
        series.createSeries.mockResolvedValue({ id: 's1' })
        $('#btnCreateSeries').click()
        await flush()

        card(2).click()

        expect(view.controller.stagingController.getSelectedAlbums().map(a => a.id)).toEqual(['a2'])
        expect($('#homeAfter').hidden).toBe(true)
        expect(dockText()).toContain('1 album from 1 artist · the order counts')
        expect(series.createSeries).toHaveBeenCalledTimes(1)
    })

    it('«Start another series» empties the dock', async () => {
        series.createSeries.mockResolvedValue({ id: 's1' })
        $('#btnCreateSeries').click()
        await flush()

        $('[data-dock="restart"]').click()

        expect(view.controller.stagingController.getSelectedAlbums()).toEqual([])
        expect($('.home-dock')).toBeNull() // no albums, no bar (the computer's lean, F79)
    })

    it('not saved: the albums stay, the words say so, and the button becomes «Try again» (^home-create-failed)', async () => {
        series.createSeries.mockRejectedValueOnce(Object.assign(new Error('Failed to fetch'), { code: 'unavailable' }))

        $('#btnCreateSeries').click()
        await flush()

        expect(dockText()).toContain('The series was not saved: the connection dropped. Your albums are still here.')
        expect($('#btnCreateSeries').textContent).toBe('Try again')
        expect(view.controller.stagingController.getSelectedAlbums()).toHaveLength(4)

        series.createSeries.mockRejectedValueOnce(new Error('permission-denied'))
        $('#btnCreateSeries').click()
        await flush()
        expect(dockText()).toContain('The series was not saved. Your albums are still here.')
    })
})
