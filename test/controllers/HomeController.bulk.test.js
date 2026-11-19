/**
 * F63 (UAT-201, UAT-26) - "Bulk Paste" on the Home, through the real view and controller.
 * A name with a hyphen is searched whole; a line that cannot go in is skipped and listed in the
 * screen (number, text, why) while the other lines go on; an empty box says what is missing.
 * No alert().
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const catalog = vi.hoisted(() => ({ search: vi.fn() }))

vi.mock('../../public/js/services/album-search/AlbumSearchService.js', () => ({
    albumSearchService: { search: (...args) => catalog.search(...args), scanArtist: vi.fn() }
}))
vi.mock('../../public/js/components/Toast.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))

import toast from '../../public/js/components/Toast.js'
import { HomeView } from '../../public/js/views/HomeView.js'

const found = (artist, title) => ({ id: `${artist}|${title}`, artist, title, year: 2001, coverUrl: 'https://img/{w}x{h}.jpg' })
const findAll = async (artist, title) => [found(artist, title)]

describe('Home: Bulk Paste (F63)', () => {
    let app, view
    const $ = (selector) => app.querySelector(selector)
    const paste = (text) => {
        $('#bulkPasteInput').value = text
        $('#bulkPasteInput').dispatchEvent(new Event('input', { bubbles: true }))
    }
    const process = async () => {
        $('#btnProcessBulk').click()
        await vi.waitFor(() => expect($('#btnProcessBulk').disabled).toBe(false))
    }
    const selected = () => view.controller.stagingController.getSelectedAlbums().map(album => `${album.artist} / ${album.title}`)
    const reportLines = () => [...app.querySelectorAll('#bulkPasteReport li')].map(item => item.textContent)

    beforeEach(async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        window.alert = vi.fn()
        Object.values(toast).forEach(mock => mock.mockClear())
        catalog.search.mockReset()
        catalog.search.mockImplementation(findAll)

        view = new HomeView()
        app.appendChild(await view.render({}))
        await view.mount({})
        $('#btnModeBulk').click()
    })

    afterEach(() => {
        view.destroy()
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('searches a name with a hyphen whole: "Jay-Z - The Blueprint" is Jay-Z, not "Jay"', async () => {
        paste('Jay-Z - The Blueprint\nAlt-J - An Awesome Wave\nBlink-182 - Enema of the State\nAC/DC - Back in Black\nArtist - Album - Deluxe')

        await process()

        expect(catalog.search.mock.calls.map(([artist, title]) => [artist, title])).toEqual([
            ['Jay-Z', 'The Blueprint'],
            ['Alt-J', 'An Awesome Wave'],
            ['Blink-182', 'Enema of the State'],
            ['AC/DC', 'Back in Black'],
            ['Artist', 'Album - Deluxe']
        ])
        expect(selected()).toHaveLength(5)
        expect(toast.success).toHaveBeenCalledWith('Added 5 albums.')
        expect($('#bulkPasteInput').value).toBe('')
        expect($('#bulkPasteReport').classList.contains('hidden')).toBe(true)
    })

    it('skips the bad line, says which and why in the screen, and the good lines go on', async () => {
        paste('Pink Floyd - Animals\nJay-Z-The Blueprint\n\nCan - Tago Mago')

        await process()

        expect(selected()).toEqual(['Pink Floyd / Animals', 'Can / Tago Mago'])
        expect(reportLines()).toEqual(['Line 2: «Jay-Z-The Blueprint» — no " - " between the artist and the album'])
        expect($('#bulkPasteReport').classList.contains('hidden')).toBe(false)
        expect($('#bulkPasteReport').getAttribute('role')).toBe('status')
        expect(toast.warning).toHaveBeenCalledWith('Added 2 albums. 1 line was skipped: see the list under the box.')
        expect($('#bulkPasteInput').value).toBe('Jay-Z-The Blueprint')
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('a line the catalog does not have, and a search that breaks, are reported; the rest goes on', async () => {
        catalog.search.mockImplementation(async (artist, title) => {
            if (artist === 'Nobody') return []
            if (artist === 'Broken') throw new Error('network down')
            return [found(artist, title)]
        })
        paste('Nobody - Nothing\nBroken - Line\nNeu! - Neu! 75')

        await process()

        expect(selected()).toEqual(['Neu! / Neu! 75'])
        expect(reportLines()).toEqual([
            'Line 1: «Nobody - Nothing» — not found in the catalog',
            'Line 2: «Broken - Line» — the catalog search failed: try this line again'
        ])
        expect($('#bulkPasteInput').value).toBe('Nobody - Nothing\nBroken - Line')
    })

    it('no line went in: an error, with the lines listed', async () => {
        paste('Animals\nMeddle')

        await process()

        expect(catalog.search).not.toHaveBeenCalled()
        expect(toast.error).toHaveBeenCalledWith('No album was added. 2 lines were skipped: see the list under the box.')
        expect(reportLines()).toHaveLength(2)
    })

    it('an album already selected is said so and does not stay in the box', async () => {
        paste('Can - Tago Mago')
        await process()

        paste('Can - Tago Mago\nNeu! - Neu! 75')
        await process()

        expect(selected()).toEqual(['Can / Tago Mago', 'Neu! / Neu! 75'])
        expect(reportLines()).toEqual(['Line 1: «Can - Tago Mago» — already in the selection'])
        expect($('#bulkPasteInput').value).toBe('')
    })

    it('an empty box says what is missing and searches nothing (UAT-26)', async () => {
        paste('   \n ')

        $('#btnProcessBulk').click()
        await Promise.resolve()

        expect(toast.warning).toHaveBeenCalledWith('Please paste some "Artist - Album" lines first.')
        expect(catalog.search).not.toHaveBeenCalled()
        expect($('#btnProcessBulk').disabled).toBe(false)
    })

    it('while it searches, the button is busy and cannot be clicked twice', async () => {
        let release
        catalog.search.mockImplementation(() => new Promise(resolve => { release = () => resolve([found('Can', 'Tago Mago')]) }))
        paste('Can - Tago Mago')

        $('#btnProcessBulk').click()
        await vi.waitFor(() => expect(catalog.search).toHaveBeenCalledTimes(1))

        expect($('#btnProcessBulk').disabled).toBe(true)
        expect($('#btnProcessBulk').getAttribute('aria-busy')).toBe('true')
        expect($('#btnProcessBulk').textContent).toContain('Processing…')

        release()
        await vi.waitFor(() => expect($('#btnProcessBulk').disabled).toBe(false))
        expect($('#btnProcessBulk').textContent).toContain('Process List')
        expect($('#btnProcessBulk').hasAttribute('aria-busy')).toBe(false)
    })

    it('the box shows, as the person types, whether every line is an album', () => {
        const box = $('#bulkPasteInput')

        paste('Jay-Z - The Blueprint')
        expect(box.classList.contains('border-green-500')).toBe(true)

        paste('Jay-Z - The Blueprint\nAnimals')
        expect(box.classList.contains('border-orange-500')).toBe(true)
        expect(box.classList.contains('border-green-500')).toBe(false)

        paste('')
        expect(box.classList.contains('border-orange-500')).toBe(false)
        expect(box.classList.contains('border-green-500')).toBe(false)
        expect(box.classList.contains('border-white/10')).toBe(true)
    })
})
