/**
 * F76 (REQ-09) - the Home on the phone: a tap on an album answers on the album (a ring and its
 * number) and in the action bar («N albums chosen», «Create series» always in view); a tap on the
 * count opens the chosen set in a sheet, where an album is moved up or down without dragging and
 * removed with an «Undo». On the computer none of it is drawn: the chosen set stays in section 03.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../../public/js/components/Toast.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import { HomeView } from '../../../public/js/views/HomeView.js'

const album = (title, releaseDate) => ({ id: `id-${title}`, title, artist: 'Pavement', type: 'Album', releaseDate, coverUrl: 'https://img/{w}x{h}.jpg' })
const ALBUMS = [album('Slanted', '1992-04-20'), album('Crooked Rain', '1994-02-14'), album('Wowee Zowee', '1995-04-11')]
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

function screenIs(phone) {
    window.matchMedia = (query) => ({
        matches: query.includes('max-width') ? phone : false,
        addEventListener: () => { },
        removeEventListener: () => { }
    })
}

describe('Home on the phone (F76, REQ-09)', () => {
    let app, view
    const $ = (selector) => document.querySelector(selector)
    const card = (title) => app.querySelector(`[data-action="pick-album"][data-id="id-${title}"]`)
    const bar = () => $('.home-chosen-bar')
    const createButton = () => $('#btnCreateSeriesPhone')
    const sheetTitles = () => [...document.querySelectorAll('.home-chosen-row__title')].map(el => el.textContent)

    const open = async (phone) => {
        screenIs(phone)
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
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    afterEach(() => {
        view.destroy()
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    it('has the action bar from the start: no album chosen, the reason said, Create off', async () => {
        await open(true)

        expect(bar()).not.toBeNull()
        expect(bar().classList.contains('md:hidden')).toBe(true)
        expect(bar().textContent).toContain('No albums chosen')
        expect(createButton().disabled).toBe(true)
    })

    it('a tap on an album answers on the album and in the bar, at once', async () => {
        await open(true)

        card('Crooked Rain').click()

        expect(card('Crooked Rain').classList.contains('is-chosen')).toBe(true)
        expect(card('Crooked Rain').getAttribute('aria-pressed')).toBe('true')
        expect(card('Crooked Rain').querySelector('.home-chosen-mark').textContent).toBe('1')
        expect(bar().textContent).toContain('1 album chosen')
        expect(createButton().disabled).toBe(false)

        card('Slanted').click()
        expect(card('Slanted').querySelector('.home-chosen-mark').textContent).toBe('2')
        expect(bar().textContent).toContain('2 albums chosen')
    })

    it('a second tap on a chosen album takes it out', async () => {
        await open(true)

        card('Slanted').click()
        card('Slanted').click()

        expect(card('Slanted').classList.contains('is-chosen')).toBe(false)
        expect(card('Slanted').querySelector('.home-chosen-mark')).toBeNull()
        expect(bar().textContent).toContain('No albums chosen')
    })

    it('the marks survive the cards being drawn again (a filter turned off and on)', async () => {
        await open(true)
        card('Slanted').click()

        $('#btnFilterAlbums').click()
        $('#btnFilterAlbums').click()

        expect(card('Slanted').querySelector('.home-chosen-mark').textContent).toBe('1')
    })

    it('the sheet holds the chosen set: up and down without dragging, remove with Undo', async () => {
        await open(true)
        card('Wowee Zowee').click()
        card('Crooked Rain').click()
        card('Slanted').click()

        $('.home-chosen-count').click()
        expect(sheetTitles()).toEqual(['Wowee Zowee', 'Crooked Rain', 'Slanted'])
        expect(document.querySelector('.sheet__title').textContent).toBe('3 albums chosen')

        document.querySelector('[data-action="move-down"][data-id="id-Wowee Zowee"]').click()
        expect(sheetTitles()).toEqual(['Crooked Rain', 'Wowee Zowee', 'Slanted'])
        expect(view.controller.stagingController.getSelectedAlbums().map(a => a.title)).toEqual(['Crooked Rain', 'Wowee Zowee', 'Slanted'])
        expect(card('Wowee Zowee').querySelector('.home-chosen-mark').textContent).toBe('2')

        document.querySelector('[data-action="move-up"][data-id="id-Slanted"]').click()
        expect(sheetTitles()).toEqual(['Crooked Rain', 'Slanted', 'Wowee Zowee'])

        document.querySelector('[data-action="remove"][data-id="id-Slanted"]').click()
        expect(sheetTitles()).toEqual(['Crooked Rain', 'Wowee Zowee'])
        expect(document.querySelector('.home-chosen-undo').textContent).toContain('Slanted')

        document.querySelector('[data-action="undo-remove"]').click()
        expect(sheetTitles()).toEqual(['Crooked Rain', 'Slanted', 'Wowee Zowee'])
    })

    it('every control of the sheet has a name', async () => {
        await open(true)
        card('Slanted').click()
        $('.home-chosen-count').click()

        const unnamed = [...document.querySelectorAll('.home-chosen-row button')].filter(b => !b.getAttribute('aria-label'))
        expect(unnamed).toEqual([])
    })

    it('Create series takes the Home\'s own path', async () => {
        await open(true)
        const create = vi.spyOn(view.controller, 'handleInitializeLoad').mockResolvedValue()
        $('#seriesNameInput').value = 'Pavement years'
        card('Slanted').click()

        createButton().click()

        expect(create).toHaveBeenCalledTimes(1)
    })

    it('the sheet shows the name of the series, the same field value as the page, and typing there names it (recheck N10)', async () => {
        await open(true)
        $('#seriesNameInput').value = 'Pavement years'
        card('Slanted').click()
        $('.home-chosen-count').click()

        const field = document.querySelector('.sheet #homeChosenName')
        expect(document.querySelector('.sheet label[for="homeChosenName"]').textContent).toBe('Series name')
        expect(field.value).toBe('Pavement years')
        field.value = 'Pavement, the 90s'
        field.dispatchEvent(new Event('input', { bubbles: true }))
        expect($('#seriesNameInput').value).toBe('Pavement, the 90s')
    })

    it('with no name, Create series says so in the sheet instead of naming it silently (recheck N10)', async () => {
        await open(true)
        const create = vi.spyOn(view.controller, 'handleInitializeLoad').mockResolvedValue()
        $('#seriesNameInput').value = '   '
        card('Slanted').click()

        createButton().click()

        expect(create).not.toHaveBeenCalled()
        expect(document.querySelector('.sheet [role="alert"]').textContent).toBe('Give the series a name first.')
        const field = document.querySelector('.sheet #homeChosenName')
        expect(document.activeElement).toBe(field)
        expect(field.getAttribute('aria-invalid')).toBe('true')

        field.value = 'Pavement'
        field.dispatchEvent(new Event('input', { bubbles: true }))
        document.querySelector('.sheet .home-chosen-create-sheet').click()
        expect(create).toHaveBeenCalledTimes(1)
    })

    it('on the computer nothing of the phone is drawn: no bar, no marks, the chosen set in section 03', async () => {
        await open(false)

        card('Slanted').click()

        expect(bar()).toBeNull()
        expect(card('Slanted').classList.contains('is-chosen')).toBe(false)
        expect(card('Slanted').hasAttribute('aria-pressed')).toBe(false)
        expect($('#stagingCount').textContent).toBe('(1 Albums)')
        expect($('#stagingStackContainer').textContent).toContain('Slanted')

        // a second click on the computer does what it did: nothing (no duplicate, no removal)
        card('Slanted').click()
        expect(view.controller.stagingController.getSelectedAlbums()).toHaveLength(1)
    })
})
