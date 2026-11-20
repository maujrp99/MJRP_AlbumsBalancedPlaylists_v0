/**
 * UAT-224 - on the computer, the ranking window no longer throws away an order changed and not
 * saved in silence: Back, Escape and a click outside the window ask «Discard changes?» first, as
 * the phone does (F76, recheck N6). With nothing changed they close at once.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('sortablejs', () => ({ default: { create: () => ({ destroy() { } }) } }))
vi.mock('../../../public/js/utils/isPhone.js', () => ({ isPhone: () => false, onPhoneChange: () => () => { } }))

import { UserRankModal } from '../../../public/js/components/ranking/UserRankModal.js'

const album = () => ({
    id: 'x', title: 'No Quarter', artist: 'Jimmy Page & Robert Plant',
    tracks: [{ title: 'Kashmir', position: 1 }, { title: 'Gallows Pole', position: 2 }, { title: 'Thank You', position: 3 }]
})

const open = (onClose = vi.fn()) => {
    const modal = new UserRankModal({ album: album(), onSubmit: vi.fn(async () => true), onClose })
    modal.show()
    return { modal, onClose }
}
const backButton = (modal) => [...modal.modalElement.querySelectorAll('button')].find(b => b.textContent.trim() === 'Back')
const dialog = () => [...document.querySelectorAll('.app-modal, .modal-overlay, [role="dialog"]')].find(d => /Discard changes\?/.test(d.textContent))
const dialogButton = (label) => [...dialog().querySelectorAll('button')].find(b => b.textContent.trim() === label)
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('the ranking window on the computer asks before discarding (UAT-224)', () => {
    beforeEach(() => { document.body.innerHTML = '' })
    afterEach(() => { document.body.innerHTML = '' })

    it('closes at once on Back when nothing changed', () => {
        const { modal, onClose } = open()
        backButton(modal).click()
        expect(dialog()).toBeUndefined()
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('asks on Back when the order changed; «Keep editing» keeps the window and the new order', async () => {
        const { modal, onClose } = open()
        modal.moveTrack(0, 2)
        backButton(modal).click()
        expect(dialog()).toBeDefined()
        expect(dialog().textContent).toContain('Your new order has not been saved.')
        dialogButton('Keep editing').click()
        await flush()
        expect(onClose).not.toHaveBeenCalled()
        expect(modal.modalElement).not.toBeNull()
        expect(modal.hasUnsavedChanges()).toBe(true)
    })

    it('«Discard» closes the window without saving', async () => {
        const { modal, onClose } = open()
        modal.moveTrack(0, 2)
        backButton(modal).click()
        dialogButton('Discard').click()
        await flush()
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(modal.modalElement).toBeNull()
    })

    it('Escape and a click outside the window ask too, and only one question is open at a time', async () => {
        const { modal, onClose } = open()
        modal.moveTrack(0, 2)
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await flush()
        expect(onClose).not.toHaveBeenCalled()
        expect(modal.modalElement).not.toBeNull()
        modal.modalElement.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        expect(document.querySelectorAll('button').length).toBeGreaterThan(0)
        const asked = [...document.body.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent === 'Discard changes?')
        expect(asked.length).toBe(1)
    })
})
