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
})
