/**
 * F79 on the phone (the layer of F76): the dock of the series IS the action bar (`.phone-action-bar`),
 * always in view above the tab bar, with one cover and the count, the name, «Tap to edit or reorder»
 * and «Create series»; a tap opens the series in a full sheet with the name on top, the order
 * sentence, the rows with ↑ ↓ ✕ and «Create series» at its foot; a removal there has its «Undo»
 * in the foot; the name missing opens the sheet on the name; the visitor's line sits under the field.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))
const series = vi.hoisted(() => ({ createSeries: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn(() => series) }))
vi.mock('../../../public/js/components/Toast.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import { HomeView } from '../../../public/js/views/HomeView.js'
import { userStore } from '../../../public/js/stores/UserStore.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'

const album = (title, year) => ({ id: `id-${title}`, title, artist: 'Pavement', type: 'Album', year, releaseDate: `${year}-01-01`, coverUrl: 'https://img/{w}x{h}.jpg' })
const ALBUMS = [album('Wowee Zowee', '1995'), album('Crooked Rain', '1994'), album('Slanted', '1992')]
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

function screenIs(phone) {
    window.matchMedia = (query) => ({
        matches: query.includes('max-width') ? phone : false,
        addEventListener: () => { },
        removeEventListener: () => { }
    })
}

describe('the Home on the phone (F79 over F76)', () => {
    let app, view
    const $ = (selector) => document.querySelector(selector)
    const bar = () => $('.home-dock.phone-action-bar')
    const card = (title) => app.querySelector(`[data-action="pick-album"][data-id="id-${title}"]`)
    const chosen = () => view.controller.stagingController.getSelectedAlbums().map(a => a.title)

    const open = async (phone, { guest = false } = {}) => {
        screenIs(phone)
        userStore.setUser({ uid: 'u', isAnonymous: guest })
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = new HomeView()
        app.appendChild(await view.render({}))
        await view.mount({})
        service.scanArtist.mockResolvedValue({ albums: ALBUMS, reclassified: null })
        $('#artistScanInput').value = 'Pavement'
        $('#btnScanArtist').click()
        await flush()
    }

    beforeEach(() => {
        window.scrollTo = () => { }
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    afterEach(() => {
        view.destroy()
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    it('no bar until the first cover is chosen (UAT-281); then the dock is the action bar', async () => {
        await open(true)

        expect(bar()).toBeNull()
        card('Slanted').click()
        expect(bar()).not.toBeNull()
        expect(bar().classList.contains('md:hidden')).toBe(true)
        expect($('#btnCreateSeriesPhone')).not.toBeNull()
        expect($('#homeStage .home-eq').children).toHaveLength(32)
    })

    it('a tap on a cover: the ring and the number on it; in the bar the name, the count, «Tap to edit or reorder»', async () => {
        await open(true)
        card('Crooked Rain').click()

        expect(card('Crooked Rain').querySelector('.home-card__mark').textContent).toBe('1')
        expect(card('Crooked Rain').getAttribute('aria-label')).toBe('Crooked Rain, 1994, number 1 in your series. Tap to take it out')
        expect(bar().textContent).toContain('Pavement selection')
        expect(bar().textContent).toContain('1 album from 1 artist · the order counts')
        expect(bar().textContent).toContain('Tap to edit or reorder')
        expect($('#btnCreateSeriesPhone').disabled).toBe(false)
        expect($('#btnCreateSeriesPhone').classList.contains('is-flame')).toBe(true)
        expect($('.home-dock .home-pile').dataset.n).toBe('1')
    })

    it('a tap on the bar opens the series in a full sheet: the name, the order, the rows, «Create series» at the foot', async () => {
        await open(true)
        ;['Wowee Zowee', 'Crooked Rain', 'Slanted'].forEach(title => card(title).click())

        $('.home-dock__open').click()

        const sheet = $('#homeSeriesSheet')
        expect(sheet.classList.contains('sheet--full')).toBe(true)
        expect(sheet.querySelector('.sheet__title').firstChild.textContent).toBe('Your series')
        expect(sheet.querySelector('.sheet__title .home-sheet__count').textContent).toBe('3 albums')
        expect(sheet.querySelector('#homeChosenName').value).toBe('Pavement selection')
        expect(sheet.textContent).toContain('The order counts: the Blend reads the albums in this order')
        expect(sheet.querySelectorAll('.home-rows li')).toHaveLength(3)
        expect(sheet.querySelector('.sheet__footer #btnCreateSeriesSheet').textContent).toBe('Create series')
        expect(sheet.querySelector('.sheet__close').getAttribute('aria-label')).toBe('Done')

        sheet.querySelector('.home-rows li:nth-child(1) .home-rbtn__down').click()
        expect(chosen()).toEqual(['Crooked Rain', 'Wowee Zowee', 'Slanted'])

        $('#homeSeriesSheet .home-rows li:nth-child(3) .home-rbtn__remove').click()
        expect(chosen()).toEqual(['Crooked Rain', 'Wowee Zowee'])
        expect($('#homeSeriesSheet .sheet__footer .home-undo').textContent).toContain('Removed «Slanted».')
        expect($('.home-dockwrap .home-undo')).toBeNull()

        $('#homeSeriesSheet .home-undo button').click()
        expect(chosen()).toEqual(['Crooked Rain', 'Wowee Zowee', 'Slanted'])
    })

    it('the name missing: «Create series» opens the sheet on the name, says so, and creates nothing', async () => {
        await open(true)
        card('Slanted').click()
        $('.home-dock__open').click()
        const name = $('#homeChosenName')
        name.value = ''
        name.dispatchEvent(new Event('input', { bubbles: true }))
        $('#homeSeriesSheet .sheet__close').click()
        await new Promise(resolve => setTimeout(resolve, 250)) // the sheet slides away (200 ms), then leaves

        $('#btnCreateSeriesPhone').click()
        await flush()

        expect(series.createSeries).not.toHaveBeenCalled()
        expect(document.querySelectorAll('#homeSeriesSheet')).toHaveLength(1)
        expect($('#homeChosenNameError').textContent).toContain('Give the series a name first.')
        expect(document.activeElement).toBe($('#homeChosenName'))
    })

    it('not saved: the bar says so in short, the albums stay, and the button becomes «Try again» (^home-create-failed)', async () => {
        await open(true)
        card('Slanted').click()
        vi.spyOn(albumSeriesStore, 'getDb').mockReturnValue({})
        series.createSeries.mockRejectedValueOnce(Object.assign(new Error('Failed to fetch'), { code: 'unavailable' }))

        $('#btnCreateSeriesPhone').click()
        await flush()

        expect(bar().textContent).toContain('Not saved: the connection dropped')
        expect($('#btnCreateSeriesPhone').textContent).toBe('Try again')
        expect(chosen()).toEqual(['Slanted'])
    })

    it('the visitor reads where the series is kept under the field, not in the bar', async () => {
        await open(true, { guest: true })

        expect($('#homeGuestStage').hidden).toBe(true) // UAT-281: only once the series has albums
        card('Slanted').click()
        expect($('#homeGuestStage').hidden).toBe(false)
        expect($('#homeGuestStage').textContent).toContain("You're not signed in: the series is saved to this browser only.")
        expect(bar().textContent).not.toContain('not signed in')
    })

    it('on the computer there is no action bar: the dock is the bar at the bottom', async () => {
        await open(false)

        expect($('.phone-action-bar')).toBeNull()
        expect($('.home-dock')).not.toBeNull()
    })
})
