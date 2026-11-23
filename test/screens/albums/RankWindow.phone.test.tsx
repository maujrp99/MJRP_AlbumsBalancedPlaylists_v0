/**
 * F76, REQ-07 (audit finding 14): «my ranking» on the phone (carried over in F83 wave 5b from test/components/ranking/UserRankModal.phone.test.js:
 * the window is React now, drawn by the host of the windows). The title of each track is read, a track moves without dragging (WCAG 2.2, SC 2.5.7: up,
 * down, «Move to…»), Save is always in view, Reset can be undone, and only the handle drags. Back with an order not saved asks first (F76, recheck N6).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('sortablejs', async () => (await import('../../support/sortableStandIn')).sortableStandIn)

import { act } from 'react'
import { asScreen, drop, lists, liveList, openRank, type OpenedRank } from '../../support/rankWindowHarness'
import { press, settle } from '../../support/albumWindowsHost'

const album = () => ({
    id: 'ds_bia', title: 'Brothers In Arms', artist: 'Dire Straits',
    tracks: [
        { title: 'So Far Away', position: 1, rank: 4, spotifyRank: 3, duration: 312 },
        { title: 'Money for Nothing', position: 2, rank: 1, spotifyRank: 1, duration: 506 },
        { title: 'Walk of Life', position: 3, duration: 252 },
        { title: 'Your Latest Trick', position: 4, rank: 3 }
    ]
})

const rowTitles = () => [...document.querySelectorAll('.rank-row__title')].map(e => e.textContent)
const numbers = () => [...document.querySelectorAll('[data-role="rank-number"]')].map(e => e.textContent)
const mover = () => document.querySelector<HTMLElement>('.rank-phone__mover')!
const moveButton = (label: string) => [...mover().querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.textContent === label)!
const pick = (index: number) => press(document.querySelectorAll('.rank-row__pick')[index])
const keyPress = (key: string) => act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key })) })

describe('the ranking window on the phone (F76)', () => {
    let opened: OpenedRank
    let screen: ReturnType<typeof asScreen>
    beforeEach(async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] })
        lists.length = 0
        screen = asScreen(true)
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'log').mockImplementation(() => {})
        opened = await openRank(album())
    })
    afterEach(async () => {
        await opened.mounted.unmount()
        vi.useRealTimers()
        delete (window as { matchMedia?: unknown }).matchMedia
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    it('draws a bar (Back, the title, Reset), the album, the tracks, and Save at the foot', () => {
        const panel = document.querySelector('.rank-window .rank-phone')!
        expect(panel.getAttribute('role')).toBe('dialog')
        expect(panel.querySelector('.rank-phone__bar')!.textContent).toBe('BackMy rankingReset')
        expect(panel.querySelector('.rank-phone__album')!.textContent).toBe('Brothers In Arms')
        expect(panel.querySelector('.rank-phone__foot .rank-phone__save')!.textContent).toBe('Save ranking')
        expect(rowTitles()).toEqual(['So Far Away', 'Money for Nothing', 'Walk of Life', 'Your Latest Trick'])
        expect(numbers()).toEqual(['1', '2', '3', '4'])
    })

    it('puts the references and the duration below the title, never on its line', () => {
        const refs = [...document.querySelectorAll('.rank-row__refs')].map(e => e.textContent)
        expect(refs).toEqual(['BEA #4 · Spotify #3 · 5:12', 'BEA #1 · Spotify #1 · 8:26', '4:12', 'BEA #3 · --:--'])
    })

    it('drags only by the handle on the phone, so a finger elsewhere scrolls', () => {
        expect(liveList().options.handle).toBe('.rank-row__handle')
        expect(document.querySelector('.rank-row__handle')!.getAttribute('aria-hidden')).toBe('true')
    })

    it('moves a track without dragging: tap it, then Up and Down; Save hands the new order', async () => {
        expect(mover().hidden).toBe(true)
        await pick(2) // Walk of Life
        expect(mover().hidden).toBe(false)
        expect(document.querySelectorAll('.rank-row__pick')[2].getAttribute('aria-pressed')).toBe('true')

        await press(moveButton('Move up'))
        await press(moveButton('Move up'))
        expect(rowTitles()).toEqual(['Walk of Life', 'So Far Away', 'Money for Nothing', 'Your Latest Trick'])
        expect(numbers()).toEqual(['1', '2', '3', '4'])
        expect((moveButton('Move up') as HTMLButtonElement).disabled).toBe(true) // first: nowhere up to go
        expect(document.querySelector('[data-role="rank-live"]')!.textContent).toBe('Walk of Life is now number 1')

        await press(moveButton('Move down'))
        expect(rowTitles()[1]).toBe('Walk of Life')

        await press(moveButton('Done'))
        expect(mover().hidden).toBe(true)

        await press(document.querySelector('.rank-phone__save'))
        await settle()
        expect((opened.onSubmit.mock.calls[0][0] as Array<{ trackTitle: string }>).map(r => r.trackTitle)).toEqual(['So Far Away', 'Walk of Life', 'Money for Nothing', 'Your Latest Trick'])
    })

    it('the track picked keeps the focus after it moves, and is kept in view', async () => {
        await pick(2)
        await press(moveButton('Move up'))
        expect(document.activeElement).toBe(document.querySelectorAll('.rank-row__pick')[1])
    })

    it('«Move to…» opens the numbers in a sheet; one tap and the track goes there', async () => {
        await pick(3) // Your Latest Trick
        await press(moveButton('Move to…'))
        const sheet = document.querySelector('.sheet--bottom')!
        const numbersInSheet = [...sheet.querySelectorAll<HTMLButtonElement>('.rank-moveto__number')]
        expect(numbersInSheet.map(b => b.textContent)).toEqual(['1', '2', '3', '4'])
        expect(numbersInSheet[3].disabled).toBe(true) // where it is
        expect(sheet.querySelector('.sheet__title')!.textContent).toBe('Move "Your Latest Trick" to')

        await press(numbersInSheet[0])
        expect(rowTitles()[0]).toBe('Your Latest Trick')
    })

    it('Reset goes back to the order of the album, and Undo in the notice brings the order back', async () => {
        await pick(1)
        await press(moveButton('Move up')) // Money for Nothing first
        await press(document.querySelector('.rank-phone__reset'))
        expect(rowTitles()).toEqual(['So Far Away', 'Money for Nothing', 'Walk of Life', 'Your Latest Trick'])

        const toast = document.querySelector('.rank-toast')!
        expect(toast.getAttribute('role')).toBe('status')
        const undo = toast.querySelector('.rank-toast__action')!
        expect(undo.textContent).toBe('Undo')
        await press(undo)
        expect(rowTitles()).toEqual(['Money for Nothing', 'So Far Away', 'Walk of Life', 'Your Latest Trick'])
        expect(document.querySelector('.rank-toast')).toBeNull()
    })

    it('Undo can be used for 5 seconds, then the notice is gone', async () => {
        await press(document.querySelector('.rank-phone__reset'))
        await act(async () => { vi.advanceTimersByTime(4999) })
        expect(document.querySelector('.rank-toast')).not.toBeNull()
        await act(async () => { vi.advanceTimersByTime(1) })
        expect(document.querySelector('.rank-toast')).toBeNull()
    })

    it('is drawn again, in the same order, when the screen stops being a phone', async () => {
        await pick(1)
        await press(moveButton('Move up'))
        await screen.turn(false)
        expect(document.querySelector('.rank-phone')).toBeNull()
        expect(document.querySelectorAll('.rank-window')).toHaveLength(1)
        const shown = [...document.querySelectorAll('[data-track-id]')].map(e => e.getAttribute('data-track-id'))
        expect(shown[0]).toBe('Money for Nothing')
    })

    it('a drop by the handle changes the order and the numbers', async () => {
        await drop(1, 3)
        expect(rowTitles()).toEqual(['So Far Away', 'Walk of Life', 'Your Latest Trick', 'Money for Nothing'])
        expect(numbers()).toEqual(['1', '2', '3', '4'])
    })

    describe('Back with an order not saved (F76, recheck N6)', () => {
        const backPress = () => press(document.querySelector('.rank-phone__back'))
        const sheet = () => document.getElementById('rankDiscardSheet')
        const sheetButton = (text: string) => [...sheet()!.querySelectorAll('button')].find(b => b.textContent === text)!

        it('leaves at once when nothing changed', async () => {
            await backPress()
            expect(sheet()).toBeNull()
            expect(document.querySelector('.rank-window')).toBeNull()
            expect(opened.onClose).toHaveBeenCalledTimes(1)
        })

        it('asks «Discard changes?» when the order changed; «Keep editing» keeps the window and the order', async () => {
            await pick(0)
            await press(moveButton('Move down'))
            await backPress()
            expect(sheet()!.querySelector('.sheet__title')!.textContent).toBe('Discard changes?')
            expect(document.querySelector('.rank-window')).not.toBeNull()
            expect(document.activeElement!.textContent).toBe('Keep editing')
            await press(sheetButton('Keep editing'))
            await act(async () => { vi.runAllTimers() })
            expect(document.querySelector('.rank-window')).not.toBeNull()
            expect(rowTitles()).toEqual(['Money for Nothing', 'So Far Away', 'Walk of Life', 'Your Latest Trick'])
            expect(opened.onClose).not.toHaveBeenCalled()
        })

        it('«Discard» closes the window without saving; Escape asks too', async () => {
            await pick(0)
            await press(moveButton('Move down'))
            await keyPress('Escape')
            expect(sheet()).not.toBeNull()
            await press(sheetButton('Discard'))
            expect(document.querySelector('.rank-window')).toBeNull()
            expect(opened.onSubmit).not.toHaveBeenCalled()
            expect(opened.onClose).toHaveBeenCalledTimes(1)
        })

        it('an order moved back to where it was is not a change', async () => {
            await pick(0)
            await press(moveButton('Move down'))
            await press(moveButton('Move up'))
            await backPress()
            expect(sheet()).toBeNull()
            expect(document.querySelector('.rank-window')).toBeNull()
        })

        it('after a save, Back leaves at once', async () => {
            await pick(0)
            await press(moveButton('Move down'))
            await press(document.querySelector('.rank-phone__save'))
            await settle()
            await backPress()
            expect(sheet()).toBeNull()
        })
    })
})
