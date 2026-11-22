/**
 * F79 (MJRP, 2026-11-22: «podemos aplicar na sessão create o mesmo conceito de lean da versao mobile?»; chose the
 * lean one): the Create screen on the computer follows the rules the phone already follows. The real HomeView and
 * HomeController; only the catalog is replaced. The sentence leaves the first screen and «What is a series?» opens it
 * IN PLACE; under the field one link; «Type an artist»; no three steps; the bar and the visitor's notice only with
 * the first cover.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn(() => ({ createSeries: vi.fn() })) }))
vi.mock('../../../public/js/components/Toast.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import { HomeView } from '../../../public/js/views/HomeView.js'
import { userStore } from '../../../public/js/stores/UserStore.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'

const album = (title) => ({ id: `id-${title}`, title, artist: 'Pavement', type: 'Album', year: '1994', releaseDate: '1994-01-01', coverUrl: 'https://img/{w}x{h}.jpg' })
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

function screenIs(phone) {
    window.matchMedia = (query) => ({
        matches: query.includes('max-width') ? phone : false,
        addEventListener: () => { },
        removeEventListener: () => { }
    })
}

describe('the lean Create screen on the computer (F79)', () => {
    let app, view
    const $ = (selector) => document.querySelector(selector)
    const hint = () => $('#homeHint')

    const open = async ({ guest = false } = {}) => {
        screenIs(false)
        userStore.setUser({ uid: 'u', isAnonymous: guest })
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = new HomeView()
        app.appendChild(await view.render({}))
        await view.mount({})
    }
    const search = async (query, albums) => {
        service.scanArtist.mockResolvedValue({ albums, reclassified: null })
        $('#artistScanInput').value = query
        $('#btnScanArtist').click()
        await flush()
    }

    beforeEach(() => {
        window.scrollTo = () => { }
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    afterEach(() => {
        view?.destroy()
        app?.remove()
        document.body.innerHTML = ''
        albumSeriesStore.reset?.()
        vi.restoreAllMocks()
    })

    it('the field says «Type an artist» and under it there is one link, «or paste a list»', async () => {
        await open()
        expect($('#artistScanInput').placeholder).toBe('Type an artist')
        expect(hint().textContent).toBe('or paste a list')
        expect(hint().querySelectorAll('button')).toHaveLength(1)
    })

    it('typing does not bring the «Press Enter…» line back', async () => {
        await open()
        const field = $('#artistScanInput')
        field.focus()
        field.value = 'Pink Fl'
        field.dispatchEvent(new Event('input', { bubbles: true }))
        expect(hint().textContent).toBe('or paste a list')
    })

    it('in the paste state the one link is «Search an artist instead»', async () => {
        await open()
        hint().querySelector('[data-home-mode="paste"]').click()
        expect(hint().textContent).toBe('Search an artist instead')
    })

    it('when the artist is not found the link under the field leaves', async () => {
        await open()
        await search('Nobody', [])
        expect($('#homeMessage').textContent).toContain('Paste a list')
        expect(hint().hidden).toBe(true)
        expect(hint().textContent).toBe('')
    })

    it('«What is a series?» opens the sentence in place, under the title; a second click closes it', async () => {
        await open()
        const link = $('.home-what')
        const sentence = $('#homeHero p')
        expect(link.textContent).toBe('What is a series?')
        expect(link.getAttribute('aria-expanded')).toBe('false')
        expect(sentence.hidden).toBe(true)
        link.click()
        expect($('.sheet')).toBeNull()
        expect(link.getAttribute('aria-expanded')).toBe('true')
        expect(sentence.hidden).toBe(false)
        expect(sentence.textContent).toContain('A series is the set of albums you want to hear together')
        link.click()
        expect(link.getAttribute('aria-expanded')).toBe('false')
        expect(sentence.hidden).toBe(true)
    })

    const escape = (target) => {
        const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
        target.dispatchEvent(event)
        return event
    }

    it('Escape closes the sentence when the focus is on its link', async () => {
        await open()
        $('.home-what').click()
        $('.home-what').focus()
        escape(document.activeElement)
        expect($('.home-what').getAttribute('aria-expanded')).toBe('false')
        expect($('#homeHero p').hidden).toBe(true)
    })

    it('Escape does not close the sentence when the focus is somewhere else (one Escape, one thing)', async () => {
        await open()
        $('.home-what').click()
        $('#artistScanInput').focus()
        escape(document.activeElement)
        expect($('.home-what').getAttribute('aria-expanded')).toBe('true')
        expect($('#homeHero p').hidden).toBe(false)
    })

    it('Escape does not close the sentence when another layer (a menu, a window, a sheet) handled the key', async () => {
        await open()
        $('.home-what').click()
        $('.home-what').focus()
        const handled = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
        document.addEventListener('keydown', function layer(event) { event.preventDefault(); document.removeEventListener('keydown', layer) }, { once: true, capture: true })
        $('.home-what').dispatchEvent(handled)
        expect(handled.defaultPrevented).toBe(true)
        expect($('.home-what').getAttribute('aria-expanded')).toBe('true')
        expect($('#homeHero p').hidden).toBe(false)
    })

    it('the three steps are not on the screen, in any state', async () => {
        await open()
        const steps = () => $('#homeHow')
        expect(steps()).toBeNull()
        await search('Pavement', [album('Slanted')])
        expect(steps()).toBeNull()
        await search('Nobody', [])
        expect(steps()).toBeNull()
    })

    it('no bar before the first cover; the bar comes with it, and goes when the last album is taken out', async () => {
        await open()
        expect($('.home-dock')).toBeNull()
        expect($('#home-page').classList.contains('is-barless')).toBe(true)
        await search('Pavement', [album('Slanted')])
        expect($('.home-dock')).toBeNull()
        app.querySelector('[data-action="pick-album"]').click()
        expect($('.home-dock')).not.toBeNull()
        expect($('#home-page').classList.contains('is-barless')).toBe(false)
        app.querySelector('[data-action="pick-album"]').click()
        expect($('.home-dock')).toBeNull()
        expect($('#home-page').classList.contains('is-barless')).toBe(true)
    })

    it('the visitor notice only when the series has albums, and with the bar', async () => {
        await open({ guest: true })
        expect($('#homeGuestStage').hidden).toBe(true)
        expect($('.home-dock')).toBeNull()
        await search('Pavement', [album('Slanted')])
        expect($('.home-guest')).toBeNull()
        app.querySelector('[data-action="pick-album"]').click()
        expect($('.home-dock .home-guest').textContent).toContain('not signed in')
    })

    it('before a search the stage is calm (sits lower); after it, not', async () => {
        await open()
        expect($('#homeStage').classList.contains('is-calm')).toBe(true)
        await search('Pavement', [album('Slanted')])
        expect($('#homeStage').classList.contains('is-calm')).toBe(false)
    })
})
