/**
 * Carried from test/components/home/HomeSearchTap.test.js (main, UAT-282; F83 sync 4): the Start screen in React never had the defect
 * (it does not rewrite the button's label), and the test says so: the same cases against the screen in React.
 * UAT-282 (F79): on the Start screen, in WebKit, tapping «Search» after typing did not start the search. Pressing
 * the button blurs the field; the stage is drawn again between the press and the release; and the draw rewrote the
 * button's label (`textContent`) even when it was the same, replacing the text node under the pointer. WebKit drops
 * the click when the node it pressed is replaced. The mechanism, at the DOM: the press blurs the field, and the
 * button and its label node must be the very same ones at the release.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn(() => ({ createSeries: vi.fn() })) }))
vi.mock('../../../public/js/stores/toasts.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import { HomeView, flush } from '../../support/startHarness.js'
import { userStore } from '../../../public/js/stores/UserStore.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'

function screenIs(phone) {
    window.matchMedia = (query) => ({
        matches: query.includes('max-width') ? phone : false,
        addEventListener: () => { },
        removeEventListener: () => { }
    })
}

describe.each([['phone', true], ['computer', false]])('tapping «Search» after typing (UAT-282), %s', (_name, phone) => {
    let app, view
    const $ = (selector) => document.querySelector(selector)

    beforeEach(async () => {
        window.scrollTo = () => { }
        vi.spyOn(console, 'warn').mockImplementation(() => { })
        screenIs(phone)
        userStore.setUser({ uid: 'u', isAnonymous: false })
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = new HomeView()
        app.appendChild(await view.render({}))
        await view.mount({})
        await flush()
    })

    afterEach(() => {
        view?.destroy()
        app?.remove()
        document.body.innerHTML = ''
        albumSeriesStore.reset?.()
        vi.restoreAllMocks()
    })

    it('the press blurs the field, and the button and its label are the same nodes at the release', () => {
        const field = $('#artistScanInput')
        const button = $('#btnScanArtist')
        field.focus()
        field.value = 'Radiohead'
        field.dispatchEvent(new Event('input', { bubbles: true }))
        const label = button.firstChild

        // the press on the button: the field loses the focus, the stage is drawn again
        field.blur()

        expect($('#btnScanArtist')).toBe(button)
        expect(button.isConnected).toBe(true)
        expect(button.firstChild).toBe(label)
        expect(label.isConnected).toBe(true)
    })

    it('after the press and the release the click starts the search', async () => {
        service.scanArtist.mockResolvedValue({ albums: [], reclassified: null })
        const field = $('#artistScanInput')
        field.focus()
        field.value = 'Radiohead'
        field.dispatchEvent(new Event('input', { bubbles: true }))
        field.blur()
        $('#btnScanArtist').click()
        await flush()
        expect(service.scanArtist).toHaveBeenCalled()
    })
})
