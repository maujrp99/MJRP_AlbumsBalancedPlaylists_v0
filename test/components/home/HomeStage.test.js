/**
 * F79 - the stage of the Home that explains itself (design/inception/home-transformar-v2.html):
 * what the app does and what a series is before any control, the one field, the hint that points to
 * the next gesture, the equalizer that means something, one fire at a time. The real HomeView and
 * HomeController; only the catalog is replaced.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../../public/js/components/Toast.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import { HomeView } from '../../../public/js/views/HomeView.js'

const album = (title, releaseDate = '1994-02-14') => ({ id: title, title, artist: 'Pavement', type: 'Album', releaseDate, year: releaseDate.slice(0, 4) })
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('the stage of the Home (F79)', () => {
    let app, view
    const $ = (selector) => app.querySelector(selector)
    const text = (selector) => $(selector)?.textContent.replace(/\s+/g, ' ').trim()
    const equalizer = () => $('#homeStage .home-eq')

    beforeEach(async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        service.scanArtist.mockReset()
        view = new HomeView()
        app.appendChild(await view.render({}))
        await view.mount({})
    })

    afterEach(() => {
        view.destroy()
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    const search = async (albums) => {
        service.scanArtist.mockResolvedValue({ albums, reclassified: null })
        $('#artistScanInput').value = 'pavement'
        $('#btnScanArtist').click()
        await flush()
    }

    it('first visit: says what the app does and what a series is, then the field, the steps, the empty dock (^home-empty)', () => {
        expect(text('#homeHero h1')).toBe('Pick the albums. We blend the playlists.')
        expect(text('#homeHero p')).toBe('A series is the set of albums you want to hear together, from one artist or many: the Blend turns it into balanced playlists.')
        expect($('#artistScanInput').getAttribute('placeholder')).toBe('An artist, or paste a list of albums')
        expect(text('#btnScanArtist')).toBe('Search')
        expect($('#btnScanArtist').classList.contains('is-flame')).toBe(true)
        expect(text('#homeHint')).toBe('Type an artist to see their albums, or paste a list of albums from many artists.')
        expect([...app.querySelectorAll('#homeHow li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()))
            .toEqual(['1Find an artist, or paste a list', '2Add the albums you want, in the order you want', '3Create the series, then blend it'])
        expect(text('.home-dock')).toContain('Your series is empty')
        expect(text('.home-dock')).toContain('Search an artist, then click a cover to add it. You name the series at the end.')
        expect(text('.home-dock')).toContain('Add one album to create the series')
        expect($('#btnCreateSeries').disabled).toBe(true)
        expect($('#btnCreateSeries').classList.contains('is-flame')).toBe(false)
        expect(equalizer().children).toHaveLength(48)
        expect(equalizer().dataset.state).toBe('still')
        expect(app.textContent).not.toMatch(/Initialize Load Sequence|Stack Empty|\/\/|Bulk Paste/)
    })

    it('typing an artist: the hint points to Enter or Search (^home-typing)', () => {
        const field = $('#artistScanInput')
        field.focus()
        field.value = 'Pink Fl'
        field.dispatchEvent(new Event('input', { bubbles: true }))

        expect(text('#homeHint')).toBe('Press Enter or Search to see their albums. A list with one album per line works too.')
    })

    it('searching: the button busy, the stage small, the equalizer moving, skeleton covers (^home-searching)', () => {
        service.scanArtist.mockReturnValue(new Promise(() => {}))
        $('#artistScanInput').value = 'Pink Floyd'
        $('#btnScanArtist').click()

        expect($('#homeStage').classList.contains('is-small')).toBe(true)
        expect($('#homeHero').hidden).toBe(true)
        expect(equalizer().dataset.state).toBe('live')
        expect(app.querySelectorAll('#discographyGrid .home-skel')).toHaveLength(12)
        expect($('#homeHow').hidden).toBe(true)
    })

    it('the discography: the artist, the line, the chips, «Add all», the covers with «+»; the fire leaves «Search» (^home-discography)', async () => {
        await search([album('Crooked'), album('Slanted', '1992-04-20')])

        expect(text('#homeArtistName')).toBe('Pavement')
        expect(text('#statusArtistName')).toBe('2 studio albums · newest first')
        expect([...app.querySelectorAll('#home-toolbar [data-filter]')].map(chip => chip.textContent))
            .toEqual(['Studio · 2', 'EPs', 'Singles', 'Live', 'Compendiums', 'Other'])
        expect($('#btnFilterAlbums').getAttribute('aria-pressed')).toBe('true')
        expect(text('#btnAddAll')).toBe('Add all 2 studio albums')
        expect(app.querySelectorAll('#discographyGrid .home-card')).toHaveLength(2)
        expect($('#discographyGrid .home-card').getAttribute('aria-label')).toBe('Crooked, 1994. Click to add it')
        expect($('#btnScanArtist').classList.contains('is-flame')).toBe(false)
        expect(equalizer().dataset.state).toBe('still')
        expect(text('.home-dock')).toContain('Click a cover to add it. You name the series at the end.')
    })

    it('the catalog did not answer: the equalizer falls flat, the words say what still holds (^home-catalog-error)', async () => {
        service.scanArtist.mockRejectedValue(new Error('down'))
        $('#artistScanInput').value = 'pavement'
        $('#btnScanArtist').click()
        await flush()

        expect(equalizer().dataset.state).toBe('flat')
        expect($('#btnScanRetry').textContent).toBe('Try again')
    })

    it('«paste a list» turns the field into the list, and «Search an artist instead» turns it back', () => {
        $('#homeHint [data-home-mode="paste"]').click()

        expect($('#homeField').hidden).toBe(true)
        expect($('#homePaste').hidden).toBe(false)
        expect(text('#homeHint')).toBe('Paste or type one album per line. Search an artist instead')
        expect($('#homeHow').hidden).toBe(true)

        $('#homeHint [data-home-mode="artist"]').click()
        expect($('#homeField').hidden).toBe(false)
        expect($('#homePaste').hidden).toBe(true)
    })

    it('a list pasted in the field of the artist becomes the list, one line each', () => {
        const event = new Event('paste', { bubbles: true, cancelable: true })
        event.clipboardData = { getData: () => 'Joni Mitchell - Hejira\nYes - Close to the Edge' }
        $('#artistScanInput').dispatchEvent(event)

        expect($('#homePaste').hidden).toBe(false)
        expect([...app.querySelectorAll('#homePaste .home-line__text')].map(input => input.value)).toEqual(['Joni Mitchell - Hejira', 'Yes - Close to the Edge'])
    })
})
