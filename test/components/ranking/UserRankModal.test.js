/**
 * F46 - the ranking modal only shows and reports: it saves through the callback it was given,
 * so the screen that opened it decides who saves and what is refreshed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('sortablejs', () => ({ default: { create: () => ({ destroy() { } }) } }))

import { UserRankModal } from '../../../public/js/components/ranking/UserRankModal.js'

const album = () => ({
    id: 'page-plant_no-quarter', title: 'No Quarter', artist: 'Jimmy Page & Robert Plant',
    tracks: [{ title: 'Kashmir', position: 2 }, { title: 'Nobody’s Fault but Mine', position: 1 }]
})

describe('UserRankModal', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => {
        vi.useRealTimers()
        document.body.innerHTML = ''
    })

    it('hands the ranking, in the order on screen, to whoever opened it, and reports the save after closing', async () => {
        const onSubmit = vi.fn(async () => true)
        const onSave = vi.fn()
        const onClose = vi.fn()
        const modal = new UserRankModal({ album: album(), onSubmit, onSave, onClose })
        modal.show()

        await modal.save()

        const expected = [{ trackTitle: 'Nobody’s Fault but Mine', userRank: 1 }, { trackTitle: 'Kashmir', userRank: 2 }]
        expect(onSubmit).toHaveBeenCalledWith(expected)
        expect(onSave).not.toHaveBeenCalled() // the modal closes a little after the confirmation
        vi.advanceTimersByTime(500)
        expect(onSave).toHaveBeenCalledWith(expected)
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(modal.modalElement).toBeNull()
    })

    it('stays open and reports nothing when the save was refused or broke', async () => {
        const onSave = vi.fn()
        const quiet = vi.spyOn(console, 'error').mockImplementation(() => { })
        for (const onSubmit of [vi.fn(async () => false), vi.fn(async () => { throw new Error('offline') })]) {
            const modal = new UserRankModal({ album: album(), onSubmit, onSave })
            modal.show()
            await modal.save()
            vi.advanceTimersByTime(1000)

            expect(onSave).not.toHaveBeenCalled()
            expect(modal.modalElement).not.toBeNull()
            modal.close()
        }
        quiet.mockRestore()
    })

    it('draws the names as they are: "&" is not shown as "&amp;"', () => {
        const modal = new UserRankModal({ album: album(), onSubmit: vi.fn() })
        modal.show()
        expect(document.body.textContent).toContain('No Quarter - Jimmy Page & Robert Plant')
        expect(document.body.textContent).not.toContain('&amp;')
        modal.close()
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
        const onSubmit = vi.fn(async () => true)
        const modal = new UserRankModal({ album: ranked, onSubmit })
        modal.show()

        expect(modal.rankedOrder.map(t => t.title)).toEqual(['Schizoid', 'Epitaph', 'I Talk', 'Bonus'])
        const shown = [...document.querySelectorAll('[data-track-id]')].map(e => e.getAttribute('data-track-id'))
        expect(shown).toEqual(['Schizoid', 'Epitaph', 'I Talk', 'Bonus'])

        await modal.save()
        expect(onSubmit.mock.calls[0][0].slice(0, 3)).toEqual([
            { trackTitle: 'Schizoid', userRank: 1 }, { trackTitle: 'Epitaph', userRank: 2 }, { trackTitle: 'I Talk', userRank: 3 }
        ])

        modal.reset()
        expect(modal.rankedOrder.map(t => t.title)).toEqual(['Schizoid', 'I Talk', 'Epitaph', 'Bonus'])
        modal.close()
    })
})
