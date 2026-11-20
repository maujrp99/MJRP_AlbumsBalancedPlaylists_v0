/**
 * F76, REQ-07 (audit finding 14): «my ranking» on the phone. The title of each track is read, a
 * track moves without dragging (WCAG 2.2, SC 2.5.7: up, down, «Move to…»), Save is always in view,
 * Reset can be undone, and only the handle drags. On the computer the window is the one of today.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sortable = vi.hoisted(() => ({ options: [] }))
vi.mock('sortablejs', () => ({
    default: { create: (el, options) => { sortable.options.push(options); return { destroy() { } } } }
}))

import { UserRankModal } from '../../../public/js/components/ranking/UserRankModal.js'

const album = () => ({
    id: 'ds_bia', title: 'Brothers In Arms', artist: 'Dire Straits',
    tracks: [
        { title: 'So Far Away', position: 1, rank: 4, spotifyRank: 3, duration: 312 },
        { title: 'Money for Nothing', position: 2, rank: 1, spotifyRank: 1, duration: 506 },
        { title: 'Walk of Life', position: 3, duration: 252 },
        { title: 'Your Latest Trick', position: 4, rank: 3 }
    ]
})

let phoneListener = null
const asScreen = (phone) => {
    window.matchMedia = (query) => ({
        matches: phone && query.includes('max-width'),
        addEventListener: (type, listener) => { if (query.includes('max-width')) phoneListener = listener },
        removeEventListener: () => { phoneListener = null }
    })
}

const titles = (modal) => modal.rankedOrder.map(t => t.title)
const rowTitles = () => [...document.querySelectorAll('.rank-row__title')].map(e => e.textContent)
const numbers = () => [...document.querySelectorAll('[data-role="rank-number"]')].map(e => e.textContent)
const mover = () => document.querySelector('.rank-phone__mover')
const moveButton = (label) => [...mover().querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.textContent === label)
const pick = (index) => document.querySelectorAll('.rank-row__pick')[index].click()

describe('UserRankModal on the phone (F76)', () => {
    let modal
    beforeEach(() => {
        vi.useFakeTimers()
        sortable.options = []
        asScreen(true)
        window.scrollTo = () => { } // the sheet gives the page its place back; jsdom has no scroll
        modal = new UserRankModal({ album: album(), onSubmit: vi.fn(async () => true) })
        modal.show()
        vi.runOnlyPendingTimers() // the drag starts after a frame
    })
    afterEach(() => {
        modal.close()
        vi.useRealTimers()
        delete window.matchMedia
        document.body.innerHTML = ''
    })

    it('draws a bar (Back, the title, Reset), the album, the tracks, and Save at the foot', () => {
        const panel = document.querySelector('.rank-window .rank-phone')
        expect(panel.getAttribute('role')).toBe('dialog')
        expect(panel.querySelector('.rank-phone__bar').textContent).toBe('BackMy rankingReset')
        expect(panel.querySelector('.rank-phone__album').textContent).toBe('Brothers In Arms')
        expect(panel.querySelector('.rank-phone__foot .rank-phone__save').textContent).toBe('Save ranking')
        expect(rowTitles()).toEqual(['So Far Away', 'Money for Nothing', 'Walk of Life', 'Your Latest Trick'])
        expect(numbers()).toEqual(['1', '2', '3', '4'])
    })

    it('puts the references and the duration below the title, never on its line', () => {
        const refs = [...document.querySelectorAll('.rank-row__refs')].map(e => e.textContent)
        expect(refs).toEqual(['BEA #4 · Spotify #3 · 5:12', 'BEA #1 · Spotify #1 · 8:26', '4:12', 'BEA #3 · --:--'])
    })

    it('drags only by the handle on the phone, so a finger elsewhere scrolls', () => {
        expect(sortable.options.at(-1).handle).toBe('.rank-row__handle')
        const handle = document.querySelector('.rank-row__handle')
        expect(handle.getAttribute('aria-hidden')).toBe('true')
    })

    it('moves a track without dragging: tap it, then Up and Down; Save hands the new order', async () => {
        expect(mover().hidden).toBe(true)
        pick(2) // Walk of Life
        expect(mover().hidden).toBe(false)
        expect(document.querySelectorAll('.rank-row__pick')[2].getAttribute('aria-pressed')).toBe('true')

        moveButton('Move up').click()
        moveButton('Move up').click()
        expect(titles(modal)).toEqual(['Walk of Life', 'So Far Away', 'Money for Nothing', 'Your Latest Trick'])
        expect(rowTitles()[0]).toBe('Walk of Life')
        expect(numbers()).toEqual(['1', '2', '3', '4'])
        expect(moveButton('Move up').disabled).toBe(true) // first: nowhere up to go
        expect(document.querySelector('[data-role="rank-live"]').textContent).toBe('Walk of Life is now number 1')

        moveButton('Move down').click()
        expect(titles(modal)[1]).toBe('Walk of Life')

        moveButton('Done').click()
        expect(mover().hidden).toBe(true)

        await modal.save()
        expect(modal.onSubmit.mock.calls[0][0].map(r => r.trackTitle)).toEqual(['So Far Away', 'Walk of Life', 'Money for Nothing', 'Your Latest Trick'])
    })

    it('«Move to…» opens the numbers in a sheet; one tap and the track goes there', () => {
        pick(3) // Your Latest Trick
        moveButton('Move to…').click()
        const sheet = document.querySelector('.sheet--bottom')
        const numbersInSheet = [...sheet.querySelectorAll('.rank-moveto__number')]
        expect(numbersInSheet.map(b => b.textContent)).toEqual(['1', '2', '3', '4'])
        expect(numbersInSheet[3].disabled).toBe(true) // where it is
        expect(sheet.querySelector('.sheet__title').textContent).toBe('Move "Your Latest Trick" to')

        numbersInSheet[0].click()
        expect(titles(modal)[0]).toBe('Your Latest Trick')
    })

    it('Reset goes back to the order of the album, and Undo in the notice brings the order back', () => {
        pick(1)
        moveButton('Move up').click() // Money for Nothing first
        document.querySelector('.rank-phone__reset').click()
        expect(titles(modal)).toEqual(['So Far Away', 'Money for Nothing', 'Walk of Life', 'Your Latest Trick'])

        const toast = document.querySelector('.rank-toast')
        expect(toast.getAttribute('role')).toBe('status')
        const undo = toast.querySelector('.rank-toast__action')
        expect(undo.textContent).toBe('Undo')
        undo.click()
        expect(titles(modal)).toEqual(['Money for Nothing', 'So Far Away', 'Walk of Life', 'Your Latest Trick'])
        expect(document.querySelector('.rank-toast')).toBe(null)
    })

    it('is drawn again, in the same order, when the screen stops being a phone', () => {
        pick(1)
        moveButton('Move up').click()
        asScreen(false)
        phoneListener({ matches: false })
        expect(document.querySelector('.rank-phone')).toBe(null)
        expect(document.querySelectorAll('.rank-window')).toHaveLength(1)
        const shown = [...document.querySelectorAll('[data-track-id]')].map(e => e.getAttribute('data-track-id'))
        expect(shown[0]).toBe('Money for Nothing')
    })
})

describe('UserRankModal on the computer (F76: unchanged)', () => {
    beforeEach(() => {
        sortable.options = []
        asScreen(false)
    })
    afterEach(() => {
        delete window.matchMedia
        document.body.innerHTML = ''
    })

    it('keeps the window of today: header with Back, Reset and Save; the whole item drags', () => {
        const modal = new UserRankModal({ album: album(), onSubmit: vi.fn() })
        const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((run) => { run(); return 0 })
        modal.show()
        frame.mockRestore()
        expect(document.querySelector('.rank-phone')).toBe(null)
        expect(document.querySelector('.rank-window').textContent).toContain('Rank Your Album')
        expect(document.querySelector('.rank-window').textContent).toContain('Drag tracks to set your personal ranking:')
        expect(sortable.options.at(-1).handle).toBe('.group')
        modal.close()
    })

    it('moveTrack changes the order and the numbers on screen', () => {
        const modal = new UserRankModal({ album: album(), onSubmit: vi.fn() })
        modal.show()
        expect(modal.moveTrack(3, 0)).toBe(true)
        expect(modal.moveTrack(0, 0)).toBe(false)
        expect(titles(modal)[0]).toBe('Your Latest Trick')
        expect([...document.querySelectorAll('[data-role="rank-number"]')].map(e => e.textContent)).toEqual(['1', '2', '3', '4'])
        modal.close()
    })
})
