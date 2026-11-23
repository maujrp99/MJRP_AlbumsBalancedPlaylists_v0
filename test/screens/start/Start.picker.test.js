/**
 * F67 - a click on Search always has one visible answer, drawn by the Home view from one state:
 * searching (button busy), results, no results, or failed with "Try again". No alert().
 * F79 - the words of the Home that explains itself («Search», «Looking for…», the line under the artist).
 * F57 - the Home is a frame of the one album picker (AlbumPickerController): the real HomeView
 * and HomeController are mounted here, and only the search service is replaced.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../../public/js/stores/toasts.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import toast from '../../../public/js/stores/toasts.js'
import { HomeView, flush } from '../../support/startHarness.js'
import { ScanStatus } from '../../../public/js/models/scanState.js'
import { DeadlineError } from '../../../public/js/utils/deadline.js'

const album = (title, type = 'Album', releaseDate = '1994-02-14') => ({ id: title, title, artist: 'Pavement', type, releaseDate })
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}

describe('Home scan (F67)', () => {
    let app, view, controller
    const $ = (selector) => app.querySelector(selector)
    const type = (text) => { $('#artistScanInput').value = text }
    const clickScan = () => $('#btnScanArtist').click()
    const gridText = () => $('#discographyGrid').textContent
    const messageText = () => $('#homeMessage').textContent
    const titles = () => [...app.querySelectorAll('#discographyGrid .home-card__title')].map(t => t.textContent)

    beforeEach(async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = new HomeView()
        app.appendChild(await view.render({}))
        service.scanArtist.mockReset()
        await view.mount({})
        controller = view.controller.picker

        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        window.alert = vi.fn()
        toast.warning.mockClear()
    })

    afterEach(() => {
        view.destroy()
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('answers the click at once: button busy and disabled, a line of status, the wait in the panel', () => {
        service.scanArtist.mockReturnValue(new Promise(() => {}))
        type('pavement')

        clickScan()

        const button = $('#btnScanArtist')
        expect(button.disabled).toBe(true)
        expect(button.getAttribute('aria-busy')).toBe('true')
        expect(button.textContent).toBe('Searching…')
        expect($('#homeWait').textContent).toBe('Looking for «pavement» in the catalog… the covers appear as soon as it answers.')
        expect($('#homeWait').hidden).toBe(false)
        expect(controller.scan.status).toBe(ScanStatus.SCANNING)
    })

    it('a click while scanning does not start a second scan', () => {
        service.scanArtist.mockReturnValue(new Promise(() => {}))
        type('pavement')

        clickScan()
        $('#btnScanArtist').disabled = false // even if the button were free
        clickScan()
        controller.searchArtist('pavement')

        expect(service.scanArtist).toHaveBeenCalledTimes(1)
    })

    it('the Enter key takes the same path as the click', async () => {
        service.scanArtist.mockResolvedValue({ albums: [album('Slanted')], reclassified: null })
        type('pavement')

        $('#artistScanInput').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await flush()

        expect(service.scanArtist).toHaveBeenCalledWith('pavement')
        expect(gridText()).toContain('Slanted')
    })

    it('reads the text of the field as it is on screen when the button is pressed, not as it was last typed', async () => {
        // the field is the browser's (a value written by code, with no event, is read all the same); the hand-made screen was proved
        // by drawing the Home again under its handlers: a screen in React has no handlers on #app to survive that
        service.scanArtist.mockReturnValue(new Promise(() => {}))
        $('#artistScanInput').value = 'first'
        $('#artistScanInput').dispatchEvent(new Event('input', { bubbles: true }))
        type('pavement')

        clickScan()

        expect(service.scanArtist).toHaveBeenCalledWith('pavement')
        expect($('#btnScanArtist').disabled).toBe(true)
    })

    it('an empty field answers too: a notice, and no scan', () => {
        type('   ')

        clickScan()

        expect(service.scanArtist).not.toHaveBeenCalled()
        expect(toast.warning).toHaveBeenCalledWith('Type an artist name first.')
        expect(controller.scan.status).toBe(ScanStatus.IDLE)
    })

    it('results: the albums newest first, the artist in the status, the counts on the filters, the button free', async () => {
        service.scanArtist.mockResolvedValue({
            albums: [album('Slanted', 'Album', '1992-04-20'), album('Crooked', 'Album', '1994-02-14'), album('Watery', 'EP', '1992-01-01')],
            reclassified: null
        })
        type('pavement')

        clickScan()
        await flush()

        expect(titles()).toEqual(['Crooked', 'Slanted'])
        expect($('#homeArtistName').textContent).toBe('Pavement')
        expect($('#statusArtistName').textContent).toBe('2 studio albums · newest first')
        expect($('#btnFilterAlbumsCount').textContent).toBe(' · 2')
        expect($('#btnFilterEPsCount').textContent).toBe(' · 1')
        expect($('#btnScanArtist').disabled).toBe(false)
        expect($('#btnScanArtist').textContent).toBe('Search')
        expect($('#btnScanArtist').hasAttribute('aria-busy')).toBe(false)
    })

    it('shows the catalog albums before the AI list arrives, then classifies them again', async () => {
        const ai = deferred()
        service.scanArtist.mockResolvedValue({
            albums: [album('Brown Album', 'Uncategorized'), album('Snivilisation', 'Album')],
            reclassified: ai.promise
        })
        type('orbital')

        clickScan()
        await flush()

        expect(gridText()).toContain('Snivilisation')
        expect(gridText()).not.toContain('Brown Album')
        expect($('#btnFilterAlbumsCount').textContent).toBe(' · 1')
        expect($('#btnFilterUncategorizedCount').textContent).toBe(' · 1')
        expect($('#statusArtistName').textContent).toBe('1 studio album · newest first · confirming album types…')
        expect($('#btnScanArtist').disabled).toBe(false)

        ai.resolve([album('Brown Album', 'Album'), album('Snivilisation', 'Album')])
        await flush()

        expect(gridText()).toContain('Brown Album')
        expect($('#btnFilterAlbumsCount').textContent).toBe(' · 2')
        expect($('#btnFilterUncategorizedCount').textContent).toBe('')
        expect($('#statusArtistName').textContent).toBe('2 studio albums · newest first')
    })

    it('when the AI list fails, the albums shown stay and the wait ends', async () => {
        const ai = deferred()
        service.scanArtist.mockResolvedValue({ albums: [album('Snivilisation')], reclassified: ai.promise })
        type('orbital')
        clickScan()
        await flush()

        ai.reject(new Error('network'))
        await flush()

        expect(gridText()).toContain('Snivilisation')
        expect($('#statusArtistName').textContent).toBe('1 studio album · newest first')
    })

    it('no results: the way out in words, «Paste a list», counts cleared, no alert', async () => {
        service.scanArtist.mockResolvedValue({ albums: [], reclassified: null })
        type('pavemnt')

        clickScan()
        await flush()

        expect(messageText()).toContain('No albums found for «pavemnt».')
        expect(messageText()).toContain('Check the spelling, or paste the albums as a list: one per line, Artist - Album.')
        expect($('#homeMessage [data-home-mode="paste"]').textContent).toBe('Paste a list')
        expect($('#homeArtist').hidden).toBe(true)
        expect($('#btnScanRetry')).toBeNull()
        expect($('#btnScanArtist').disabled).toBe(false)
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('failed: a message in the panel with "Try again", no alert; "Try again" scans the same text', async () => {
        service.scanArtist.mockRejectedValueOnce(new Error('403'))
        type('pavement')

        clickScan()
        await flush()

        expect(messageText()).toContain('The search could not be completed.')
        expect(messageText()).toContain('Nothing was changed. Try again in a moment.')
        expect($('#homeMessage').getAttribute('role')).toBe('alert')
        expect($('#btnScanArtist').disabled).toBe(false)
        expect(window.alert).not.toHaveBeenCalled()

        service.scanArtist.mockResolvedValue({ albums: [album('Slanted')], reclassified: null })
        type('something else typed meanwhile')
        $('#btnScanRetry').click()
        await flush()

        expect(service.scanArtist).toHaveBeenLastCalledWith('pavement')
        expect(gridText()).toContain('Slanted')
        expect($('#btnScanRetry')).toBeNull()
    })

    it('failed by deadline: says the catalog did not answer', async () => {
        service.scanArtist.mockRejectedValue(new DeadlineError('the catalog', 15000))
        type('pavement')

        clickScan()
        await flush()

        expect(messageText()).toContain('The catalog did not answer in 15 seconds.')
        expect($('#btnScanRetry')).not.toBeNull()
    })

    it('a late answer of an older scan does not replace the newer one', async () => {
        const first = deferred()
        const firstAi = deferred()
        service.scanArtist.mockReturnValueOnce(first.promise)
        type('orbital')
        clickScan()
        first.resolve({ albums: [album('Old One')], reclassified: firstAi.promise })
        await flush()

        service.scanArtist.mockResolvedValueOnce({ albums: [album('New One')], reclassified: null })
        type('pavement')
        clickScan()
        await flush()

        firstAi.resolve([album('Old One'), album('Old Two')])
        await flush()

        expect(gridText()).toContain('New One')
        expect(gridText()).not.toContain('Old')
        expect($('#btnFilterAlbumsCount').textContent).toBe(' · 1')
    })

    it('a click on a filter button shows the albums of that type and marks the button', async () => {
        service.scanArtist.mockResolvedValue({ albums: [album('Slanted'), album('Watery', 'EP'), album('Odd', 'Uncategorized')], reclassified: null })
        type('pavement')
        clickScan()
        await flush()

        $('#btnFilterEPs').click()
        $('#btnFilterUncategorized').click()
        $('#btnFilterAlbums').click()

        expect(titles()).toEqual(['Watery', 'Odd'])
        expect($('#btnFilterEPs').getAttribute('aria-pressed')).toBe('true')
        expect($('#btnFilterAlbums').getAttribute('aria-pressed')).toBe('false')
        expect($('#btnFilterUncategorizedCount').textContent).toBe(' · 1')
    })

    it('a click on a card hands the album to the Home: it goes into the series', async () => {
        service.scanArtist.mockResolvedValue({ albums: [album('Slanted'), album('Crooked')], reclassified: null })
        type('pavement')
        clickScan()
        await flush()

        app.querySelector('#discographyGrid [data-id="Crooked"]').click()

        expect(view.controller.stagingController.getSelectedAlbums().map(a => a.title)).toEqual(['Crooked'])
    })

    it('a filter click outside the results does not wipe the message in the panel', async () => {
        service.scanArtist.mockRejectedValue(new Error('403'))
        type('pavement')
        clickScan()
        await flush()

        controller.toggleFilter('eps')

        expect(messageText()).toContain('The search could not be completed.')
    })

    it('after the screen is left, a late answer draws nothing', async () => {
        const late = deferred()
        service.scanArtist.mockReturnValue(late.promise)
        type('pavement')
        clickScan()

        controller.dispose()
        late.resolve({ albums: [album('Slanted')], reclassified: null })
        await flush()

        expect(gridText()).not.toContain('Slanted')
    })
})
