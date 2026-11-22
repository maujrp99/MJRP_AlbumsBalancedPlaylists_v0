/**
 * UAT-281 (F79): the Start screen on the phone, lean. The real HomeView and HomeController; only the catalog is
 * replaced. The title and the field first; «What is a series?» opens the sentence in the bottom sheet; under the
 * field one link; the bar and the visitor's notice only with the first cover; the computer is as it was.
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

describe('the lean Start on the phone (UAT-281)', () => {
    let app, view
    const $ = (selector) => document.querySelector(selector)
    const hint = () => $('#homeHint')

    const open = async (phone, { guest = false } = {}) => {
        screenIs(phone)
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

    it('the field says «An artist» and under it there is one link, «or paste a list»', async () => {
        await open(true)
        expect($('#artistScanInput').placeholder).toBe('An artist')
        expect(hint().textContent).toBe('or paste a list')
        expect(hint().querySelectorAll('button')).toHaveLength(1)
    })

    it('in the paste state the one link is «Search an artist instead»', async () => {
        await open(true)
        hint().querySelector('[data-home-mode="paste"]').click()
        expect(hint().textContent).toBe('Search an artist instead')
    })

    it('when the artist is not found the link under the field leaves: the message has «Paste a list»', async () => {
        await open(true)
        await search('Nobody', [])
        expect($('#homeMessage').textContent).toContain('Paste a list')
        expect(hint().hidden).toBe(true)
        expect(hint().textContent).toBe('')
    })

    it('«What is a series?» opens the same sentence in the bottom sheet', async () => {
        await open(true)
        const link = $('.home-what')
        expect(link.textContent).toBe('What is a series?')
        link.click()
        const sheet = $('#whatIsASeries')
        expect(sheet.classList.contains('sheet--bottom')).toBe(true)
        expect(sheet.textContent).toContain('A series is the set of albums you want to hear together')
        expect(sheet.querySelector('.sheet__title').textContent).toBe('What is a series?')
    })

    it('no bar before the first cover; the bar comes with it', async () => {
        await open(true)
        expect($('.home-dock.phone-action-bar')).toBeNull()
        expect($('#home-page').classList.contains('is-barless')).toBe(true)
        await search('Pavement', [album('Slanted')])
        expect($('.home-dock.phone-action-bar')).toBeNull()
        app.querySelector('[data-action="pick-album"]').click()
        expect($('.home-dock.phone-action-bar')).not.toBeNull()
        expect($('#home-page').classList.contains('is-barless')).toBe(false)
    })

    it('the visitor notice only when the series has albums', async () => {
        await open(true, { guest: true })
        expect($('#homeGuestStage').hidden).toBe(true)
        await search('Pavement', [album('Slanted')])
        expect($('#homeGuestStage').hidden).toBe(true)
        app.querySelector('[data-action="pick-album"]').click()
        expect($('#homeGuestStage').hidden).toBe(false)
        expect($('#homeGuestStage').textContent).toContain('not signed in')
    })

    it('the computer is as it was: the old hint, the old field text, the bar, the notice', async () => {
        await open(false, { guest: true })
        expect($('#artistScanInput').placeholder).toBe('An artist, or paste a list of albums')
        expect(hint().textContent).toBe('Type an artist to see their albums, or paste a list of albums from many artists.')
        expect($('.home-dock')).not.toBeNull()
        expect($('#home-page').classList.contains('is-barless')).toBe(false)
        expect($('.home-hero p').textContent).toContain('A series is the set of albums')
    })
})
