/**
 * F67 - a click on Scan always has one visible answer, drawn by the Home view from one state:
 * scanning (button busy), results, no results, or failed with "Try again". No alert().
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../../public/js/controllers/HomeController.js', () => ({ HomeController: class {} }))
vi.mock('../../../public/js/components/Toast.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import toast from '../../../public/js/components/Toast.js'
import { HomeView } from '../../../public/js/views/HomeView.js'
import { SearchController } from '../../../public/js/components/home/SearchController.js'
import { DiscographyRenderer } from '../../../public/js/views/renderers/DiscographyRenderer.js'
import { ScanStatus } from '../../../public/js/models/scanState.js'
import { DeadlineError } from '../../../public/js/utils/deadline.js'

const album = (title, type = 'Album', releaseDate = '1994-02-14') => ({ id: title, title, artist: 'Pavement', type, releaseDate })
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('Home scan (F67)', () => {
    let app, view, service, controller
    const $ = (selector) => app.querySelector(selector)
    const type = (text) => { $('#artistScanInput').value = text }
    const clickScan = () => $('#btnScanArtist').click()
    const gridText = () => $('#discographyGrid').textContent

    beforeEach(async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = new HomeView()
        app.appendChild(await view.render({}))

        service = { scanArtist: vi.fn() }
        const home = {
            view,
            albumSearchService: service,
            state: { isScanning: false, artist: null },
            discographyRenderer: new DiscographyRenderer($('#discographyGrid'))
        }
        controller = new SearchController(home)
        controller.initialize()

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
        expect(button.textContent).toContain('Scanning…')
        expect($('#statusArtistName').textContent).toBe('Scanning…')
        expect(gridText()).toContain('Searching the catalog for «pavement»…')
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

    it('reads the text of the field that is on screen, even after the Home was drawn again', async () => {
        // The Home DOM replaced without a new mount: the handlers on #app must still answer
        while (app.firstChild) app.removeChild(app.firstChild)
        app.appendChild(await view.render({}))
        service.scanArtist.mockReturnValue(new Promise(() => {}))
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

        const titles = [...app.querySelectorAll('#discographyGrid h3')].map(h => h.textContent)
        expect(titles).toEqual(['Crooked', 'Slanted'])
        expect($('#statusArtistName').textContent).toBe('→ Pavement')
        expect($('#btnFilterAlbumsCount').textContent).toBe(' (2)')
        expect($('#btnFilterEPsCount').textContent).toBe(' (1)')
        expect($('#btnScanArtist').disabled).toBe(false)
        expect($('#btnScanArtist').textContent).toContain('Scan')
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
        expect($('#btnFilterAlbumsCount').textContent).toBe(' (1)')
        expect($('#btnFilterUncategorizedCount').textContent).toBe(' (1)')
        expect($('#statusArtistName').textContent).toBe('→ Pavement · confirming album types…')
        expect($('#btnScanArtist').disabled).toBe(false)

        ai.resolve([album('Brown Album', 'Album'), album('Snivilisation', 'Album')])
        await flush()

        expect(gridText()).toContain('Brown Album')
        expect($('#btnFilterAlbumsCount').textContent).toBe(' (2)')
        expect($('#btnFilterUncategorizedCount').textContent).toBe('')
        expect($('#statusArtistName').textContent).toBe('→ Pavement')
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
        expect($('#statusArtistName').textContent).toBe('→ Pavement')
    })

    it('no results: a message in the panel, counts cleared, no alert', async () => {
        service.scanArtist.mockResolvedValue({ albums: [], reclassified: null })
        type('pavemnt')

        clickScan()
        await flush()

        expect(gridText()).toContain('No albums found for «pavemnt».')
        expect($('#statusArtistName').textContent).toBe('→ Not found')
        expect($('#btnScanRetry')).toBeNull()
        expect($('#btnScanArtist').disabled).toBe(false)
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('failed: a message in the panel with "Try again", no alert; "Try again" scans the same text', async () => {
        service.scanArtist.mockRejectedValueOnce(new Error('403'))
        type('pavement')

        clickScan()
        await flush()

        expect(gridText()).toContain('The search could not be completed.')
        expect($('#statusArtistName').textContent).toBe('→ Search failed')
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

        expect(gridText()).toContain('The catalog did not answer in 15 seconds.')
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
        expect($('#btnFilterAlbumsCount').textContent).toBe(' (1)')
    })

    it('a filter click outside the results does not wipe the message in the panel', async () => {
        service.scanArtist.mockRejectedValue(new Error('403'))
        type('pavement')
        clickScan()
        await flush()

        controller.toggleFilter('eps')

        expect(gridText()).toContain('The search could not be completed.')
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
