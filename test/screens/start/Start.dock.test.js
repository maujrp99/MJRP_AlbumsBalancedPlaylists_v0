/**
 * F79 - the series being built, always in view on the computer: the dock (^home-dock-one,
 * ^home-albums-chosen, ^home-dock-many), the series panel with ↑ ↓ ✕ (^home-dock-reorder), «Undo»
 * after a removal or «Add all» (^home-dock-removed-undo), the chosen cover with its ring and place,
 * a second click that takes it out, the line of the visitor (^home-guest).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../../public/js/stores/toasts.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))

import { HomeView, flush } from '../../support/startHarness.js'
import { UNDO_MS } from '../../../public/js/screens/start/StartController'
import { userStore } from '../../../public/js/stores/UserStore.js'

const TITLES = ['The Endless River', 'The Division Bell', 'A Momentary Lapse of Reason', 'The Final Cut', 'The Wall', 'Animals', 'Wish You Were Here', 'The Dark Side of the Moon', 'Obscured by Clouds']
const albums = TITLES.map((title, i) => ({ id: `a${i}`, title, artist: 'Pink Floyd', type: 'Album', year: String(2014 - i * 3), releaseDate: `${2014 - i * 3}-01-01`, coverUrl: `https://img/${i}/{w}x{h}.jpg` }))

describe('the dock of the series, on the computer (F79)', () => {
    let app, view
    const $ = (selector) => app.querySelector(selector)
    const dockText = () => $('.home-dock').textContent.replace(/\s+/g, ' ')
    const card = (i) => $(`#discographyGrid [data-id="a${i}"]`)
    const chosen = () => view.controller.stagingController.getSelectedAlbums().map(a => a.id)

    beforeEach(async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        userStore.setUser?.({ uid: 'u1', isAnonymous: false })
        view = new HomeView()
        app.appendChild(await view.render({}))
        await view.mount({})
        service.scanArtist.mockResolvedValue({ albums, reclassified: null })
        $('#artistScanInput').value = 'Pink Floyd'
        $('#btnScanArtist').click()
        await flush()
    })

    afterEach(() => {
        view.destroy()
        document.body.removeChild(app)
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('one album: the cover gets the ring and «1»; the dock the cover, the suggested name, the count, «Create series» on (^home-dock-one)', () => {
        card(0).click()

        expect(card(0).classList.contains('is-in')).toBe(true)
        expect(card(0).getAttribute('aria-pressed')).toBe('true')
        expect(card(0).querySelector('.home-card__mark').textContent).toBe('1')
        expect(card(0).getAttribute('aria-label')).toBe('The Endless River, 2014, number 1 in your series. Click to take it out')
        expect($('#seriesNameInput').value).toBe('Pink Floyd selection')
        expect(dockText()).toContain('suggested · edit it')
        expect(dockText()).toContain('1 album from 1 artist · the order counts')
        expect($('#btnCreateSeries').disabled).toBe(false)
        expect($('#btnCreateSeries').classList.contains('is-flame')).toBe(true)
        expect(app.querySelectorAll('.home-dock .home-dcv')).toHaveLength(1)
    })

    it('several albums: numbered covers, «Edit order», «Next: …» (^home-albums-chosen)', () => {
        ;[0, 2, 3, 5].forEach(i => card(i).click())

        expect([...app.querySelectorAll('.home-dock .home-dn')].map(n => n.textContent)).toEqual(['1', '2', '3', '4'])
        expect(card(3).querySelector('.home-card__mark').textContent).toBe('3')
        expect($('#btnEditOrder').textContent).toBe('Edit order')
        expect(dockText()).toContain('4 albums from 1 artist · the order counts')
        expect(dockText()).toContain('Next: the Blend turns the series into playlists.')
    })

    it('a click on a chosen cover takes it out, with «Undo» for 8 seconds; «Undo» puts it back at its place (^home-dock-removed-undo)', () => {
        vi.useFakeTimers()
        ;[0, 2, 3].forEach(i => card(i).click())

        card(2).click()
        expect(chosen()).toEqual(['a0', 'a3'])
        expect($('.home-undo').textContent).toContain('Removed «A Momentary Lapse of Reason».')

        $('.home-undo button').click()
        expect(chosen()).toEqual(['a0', 'a2', 'a3'])
        expect($('.home-undo')).toBeNull()

        card(3).click()
        expect($('.home-undo')).not.toBeNull()
        act(() => { vi.advanceTimersByTime(UNDO_MS) }) // the timer draws the screen again: inside React's act
        expect($('.home-undo')).toBeNull()
    })

    it('«Edit order» opens the panel: the order sentence, ↑ ↓ ✕ of each row, the first ↑ and the last ↓ off (^home-dock-reorder)', () => {
        ;[0, 2, 3, 5].forEach(i => card(i).click())
        $('#btnEditOrder').click()

        const panel = $('#homeSeriesPanel')
        expect(panel.textContent).toContain('Your series 4 albums')
        expect(panel.textContent).toContain('The order counts: the Blend reads the albums in this order when it spreads their tracks over the playlists. Use ↑ ↓ to change it.')
        const rows = [...panel.querySelectorAll('.home-rows li')]
        expect(rows).toHaveLength(4)
        expect(rows[0].querySelector('.home-rbtn__up').disabled).toBe(true)
        expect(rows[3].querySelector('.home-rbtn__down').disabled).toBe(true)
        expect(rows.every(row => row.querySelectorAll('.home-rbtn svg').length === 3)).toBe(true)
        expect(rows[1].querySelector('.home-rbtn__up').getAttribute('aria-label')).toBe('Move «A Momentary Lapse of Reason» up')
        expect(rows[1].querySelector('.home-rbtn__remove').getAttribute('aria-label')).toBe('Remove «A Momentary Lapse of Reason» from the series')
        expect($('#btnEditOrder').textContent).toBe('Done')

        rows[2].querySelector('.home-rbtn__up').click()
        expect(chosen()).toEqual(['a0', 'a3', 'a2', 'a5'])
        const moved = $('#homeSeriesPanel .home-rows li.is-moved')
        expect(moved.textContent).toContain('The Final Cut')
        expect(moved.textContent).toContain('moved up')
        expect(card(3).querySelector('.home-card__mark').textContent).toBe('2')

        $('#homeSeriesPanel .home-rows li:last-child .home-rbtn__remove').click()
        expect(chosen()).toEqual(['a0', 'a3', 'a2'])
        expect($('.home-undo').textContent).toContain('Removed «Animals».')

        $('#homeSeriesPanel [data-dock="close"]').click()
        expect($('#homeSeriesPanel')).toBeNull()
    })

    it('«Add all» puts what the filter shows, says how many, and «Undo» gives the series back (^home-dock-many)', () => {
        card(0).click()
        expect($('#btnAddAll').textContent.trim()).toBe('Add the other 8')

        $('#btnAddAll').click()
        expect(chosen()).toHaveLength(9)
        expect($('.home-undo').textContent).toContain('Added 8 albums.')
        expect(app.querySelectorAll('.home-dock .home-dcv')).toHaveLength(7)
        expect($('.home-dock .home-more').textContent).toBe('+2')
        expect($('#btnAddAll').hidden).toBe(true)

        $('.home-undo button').click()
        expect(chosen()).toEqual(['a0'])
    })

    it('a name typed by the person stays, and the field keeps its focus while the series changes', () => {
        card(0).click()
        const field = $('#seriesNameInput')
        field.focus()
        field.value = 'Floyd, the long ones'
        field.dispatchEvent(new Event('input', { bubbles: true }))
        card(1).click()

        expect($('#seriesNameInput').value).toBe('Floyd, the long ones')
        expect(document.activeElement).toBe($('#seriesNameInput'))
        expect(dockText()).not.toContain('suggested · edit it')
    })

    it('the visitor without an account reads where the series is kept, with «Sign in» (^home-guest)', () => {
        userStore.setUser?.({ uid: 'anon', isAnonymous: true })
        act(() => {
            view.controller.state.guest = true
            view.controller.redraw()
        })

        expect(dockText()).toContain("You're not signed in: the series is saved to this browser only. Sign in to keep it on every device.")
        expect($('.home-dock [data-dock="sign-in"]').textContent).toBe('Sign in')
    })
})
