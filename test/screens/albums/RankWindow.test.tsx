/**
 * The window to rank the tracks of an album, on the computer (carried over in F83 wave 5b from test/components/ranking/UserRankModal.test.js,
 * UserRankModal.discardComputer.test.js and the computer part of UserRankModal.phone.test.js: the window is React now, so it is drawn by the host
 * of the windows and a track is moved by a drop of the drag library's stand-in; what the tests assert is what they asserted).
 * F46: the window only shows and reports: it saves through the callback it was given, so the screen that opened it decides who saves and what
 * is refreshed. UAT-187: it opens in the order of the ranking the album already has. UAT-224: Back, Escape and a click outside ask before an
 * order not saved is thrown away.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('sortablejs', async () => (await import('../../support/sortableStandIn')).sortableStandIn)

import { act } from 'react'
import { asScreen, drop, lists, liveList, openRank, type OpenedRank } from '../../support/rankWindowHarness'
import { press, settle } from '../../support/albumWindowsHost'

const album = () => ({
    id: 'page-plant_no-quarter', title: 'No Quarter', artist: 'Jimmy Page & Robert Plant',
    tracks: [{ title: 'Kashmir', position: 2 }, { title: 'Nobody’s Fault but Mine', position: 1 }]
})
const three = () => ({
    id: 'x', title: 'No Quarter', artist: 'Jimmy Page & Robert Plant',
    tracks: [{ title: 'Kashmir', position: 1 }, { title: 'Gallows Pole', position: 2 }, { title: 'Thank You', position: 3 }]
})

const windowEl = () => document.querySelector<HTMLElement>('.rank-window')
const shown = () => [...document.querySelectorAll('[data-track-id]')].map(e => e.getAttribute('data-track-id'))
const numbers = () => [...document.querySelectorAll('[data-role="rank-number"]')].map(e => e.textContent)
const back = () => [...windowEl()!.querySelectorAll('button')].find(b => b.textContent!.trim() === 'Back')!
const reset = () => [...windowEl()!.querySelectorAll('button')].find(b => b.textContent!.trim() === 'Reset')!
const save = () => [...windowEl()!.querySelectorAll('button')].find(b => b.textContent!.trim() === 'Save')!
const question = () => [...document.querySelectorAll('.app-modal')].find(d => /Discard changes\?/.test(d.textContent ?? ''))
const questionButton = (label: string) => [...question()!.querySelectorAll('button')].find(b => b.textContent!.trim() === label)!

describe('the ranking window on the computer', () => {
    let opened: OpenedRank | null = null
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] })
        lists.length = 0
        asScreen(false)
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })
    afterEach(async () => {
        await opened?.mounted.unmount()
        opened = null
        vi.useRealTimers()
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    const advance = (ms: number) => act(async () => { vi.advanceTimersByTime(ms) })

    describe('it only shows and reports (F46)', () => {
        it('hands the ranking, in the order on screen, to whoever opened it, and reports the save after closing', async () => {
            opened = await openRank(album())
            await drop(1, 0)

            await press(save())
            await settle()

            const expected = [{ trackTitle: 'Kashmir', userRank: 1 }, { trackTitle: 'Nobody’s Fault but Mine', userRank: 2 }]
            expect(opened.onSubmit).toHaveBeenCalledWith(expected)
            expect(opened.onSave).not.toHaveBeenCalled() // the window closes a little after the confirmation
            await advance(500)
            expect(opened.onSave).toHaveBeenCalledWith(expected)
            expect(opened.onClose).toHaveBeenCalledTimes(1)
            expect(windowEl()).toBeNull()
        })

        it('stays open and reports nothing when the save was refused or broke', async () => {
            for (const onSubmit of [vi.fn(async () => false), vi.fn(async () => { throw new Error('offline') })]) {
                opened = await openRank(album(), onSubmit)
                await press(save())
                await settle()
                await advance(1000)

                expect(opened.onSave).not.toHaveBeenCalled()
                expect(windowEl()).not.toBeNull()
                await opened.mounted.unmount()
                opened = null
            }
        })

        it('draws the names as they are: "&" is not shown as "&amp;"', async () => {
            opened = await openRank(album())
            expect(document.body.textContent).toContain('No Quarter - Jimmy Page & Robert Plant')
            expect(document.body.textContent).not.toContain('&amp;')
        })
    })

    it('opens in the order of the ranking the album already has; Reset goes back to the order of the record (UAT-187)', async () => {
        const ranked = {
            id: 'kc', title: 'In the Court', artist: 'King Crimson',
            tracks: [
                { title: 'Schizoid', position: 1, userRank: 1 },
                { title: 'I Talk', position: 2, userRank: 3 },
                { title: 'Epitaph', position: 3, userRank: 2 },
                { title: 'Bonus', position: 4 } // not in the saved ranking: after the ranked ones
            ]
        }
        opened = await openRank(ranked)

        expect(shown()).toEqual(['Schizoid', 'Epitaph', 'I Talk', 'Bonus'])

        await press(save())
        await settle()
        expect((opened.onSubmit.mock.calls[0][0] as unknown[]).slice(0, 3)).toEqual([
            { trackTitle: 'Schizoid', userRank: 1 }, { trackTitle: 'Epitaph', userRank: 2 }, { trackTitle: 'I Talk', userRank: 3 }
        ])

        await press(reset())
        expect(shown()).toEqual(['Schizoid', 'I Talk', 'Epitaph', 'Bonus'])
    })

    it('a partial ranking is saved as the order left on screen: the track ranked first, the rest after, every one numbered', async () => {
        opened = await openRank({
            id: 'p', title: 'Partial', artist: 'Someone',
            tracks: [{ title: 'A', position: 1 }, { title: 'B', position: 2 }, { title: 'C', position: 3 }, { title: 'D', position: 4, userRank: 1 }]
        })
        expect(shown()).toEqual(['D', 'A', 'B', 'C'])

        await press(save())
        await settle()

        expect(opened.onSubmit).toHaveBeenCalledWith([
            { trackTitle: 'D', userRank: 1 }, { trackTitle: 'A', userRank: 2 }, { trackTitle: 'B', userRank: 3 }, { trackTitle: 'C', userRank: 4 }
        ])
    })

    it('keeps the window of today: header with Back, Reset and Save; the whole item drags', async () => {
        opened = await openRank({ id: 'ds', title: 'Brothers In Arms', artist: 'Dire Straits', tracks: [{ title: 'So Far Away', position: 1 }, { title: 'Walk of Life', position: 2 }] })

        expect(document.querySelector('.rank-phone')).toBeNull()
        expect(windowEl()!.textContent).toContain('Rank Your Album')
        expect(windowEl()!.textContent).toContain('Drag tracks to set your personal ranking:')
        expect(liveList().options.handle).toBe('.group')
        expect(liveList().options.animation).toBe(150)
        expect(liveList().options.group).toBeUndefined() // one list: no other list to drop in
        expect(liveList().options.delay).toBeUndefined() // a touch does not wait
    })

    it('a drop changes the order and the numbers on screen, and the dragged row is the node React holds', async () => {
        opened = await openRank({ id: 'ds', title: 'B', artist: 'D', tracks: [{ title: 'one', position: 1 }, { title: 'two', position: 2 }, { title: 'three', position: 3 }, { title: 'four', position: 4 }] })
        const row = document.querySelector('[data-track-id="four"]')

        await drop(3, 0)

        expect(shown()).toEqual(['four', 'one', 'two', 'three'])
        expect(numbers()).toEqual(['1', '2', '3', '4'])
        expect(document.querySelector('[data-track-id="four"]')).toBe(row)
    })

    describe('it asks before discarding (UAT-224)', () => {
        beforeEach(async () => { opened = await openRank(three()) })

        it('closes at once on Back when nothing changed', async () => {
            await press(back())
            expect(question()).toBeUndefined()
            expect(opened!.onClose).toHaveBeenCalledTimes(1)
            expect(windowEl()).toBeNull()
        })

        it('asks on Back when the order changed; «Keep editing» keeps the window and the new order', async () => {
            await drop(0, 2)
            await press(back())
            expect(question()).toBeDefined()
            expect(question()!.textContent).toContain('Your new order has not been saved.')
            await press(questionButton('Keep editing'))
            expect(opened!.onClose).not.toHaveBeenCalled()
            expect(windowEl()).not.toBeNull()
            expect(shown()).toEqual(['Gallows Pole', 'Thank You', 'Kashmir'])
        })

        it('«Discard» closes the window without saving', async () => {
            await drop(0, 2)
            await press(back())
            await press(questionButton('Discard'))
            expect(opened!.onClose).toHaveBeenCalledTimes(1)
            expect(opened!.onSubmit).not.toHaveBeenCalled()
            expect(windowEl()).toBeNull()
        })

        it('Escape and a click outside the window ask too, and only one question is open at a time', async () => {
            await drop(0, 2)
            await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
            expect(question()).toBeDefined()
            await act(async () => { windowEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
            expect(document.querySelectorAll('#confirm-modal')).toHaveLength(1)
            expect(opened!.onClose).not.toHaveBeenCalled()
            // Escape inside the question is «Keep editing»
            await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
            expect(question()).toBeUndefined()
            expect(windowEl()).not.toBeNull()
        })

        it('with the order moved back to where it was there is nothing to discard', async () => {
            await drop(0, 2)
            await drop(2, 0)
            await press(back())
            expect(question()).toBeUndefined()
            expect(windowEl()).toBeNull()
        })

        it('after a save, Back leaves at once', async () => {
            await drop(0, 2)
            await press(save())
            await settle()
            await act(async () => { vi.advanceTimersByTime(100) }) // the window is still open: it closes 500 ms after the confirmation
            await press(back())
            expect(question()).toBeUndefined()
        })
    })

    it('the notice of the window outlives the window (2 s), and Escape with nothing changed closes it', async () => {
        opened = await openRank(three())
        await press(save())
        await settle()
        await advance(500)
        expect(windowEl()).toBeNull()
        expect(document.querySelector('.rank-toast')!.textContent).toBe('Ranking saved!')
        await advance(1500)
        expect(document.querySelector('.rank-toast')).toBeNull()
    })

    it('Escape with nothing changed closes the window', async () => {
        opened = await openRank(three())
        await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
        expect(windowEl()).toBeNull()
        expect(opened.onClose).toHaveBeenCalledTimes(1)
    })

    it('leaving the screen takes the window, its question and its listeners away', async () => {
        opened = await openRank(three())
        await drop(0, 2)
        await press(back())
        const before = lists.length

        await opened.mounted.unmount()
        opened = null

        expect(windowEl()).toBeNull()
        expect(document.querySelectorAll('.app-modal')).toHaveLength(0)
        expect(lists.filter(item => !item.dead)).toHaveLength(0)
        expect(lists.length).toBe(before)
    })
})
