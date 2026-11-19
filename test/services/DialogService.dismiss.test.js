/**
 * F63 (UAT-201) - a dialog closed with Escape answers as "Cancel". Before, Escape took the dialog
 * off the screen and whoever asked kept waiting for ever (the action hung, with its button busy).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { dialogService } from '../../public/js/services/DialogService.js'

const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
const settled = (promise) => Promise.race([promise, new Promise(resolve => setTimeout(() => resolve('STILL WAITING'), 20))])

describe('DialogService: closing without an answer (F63)', () => {
    afterEach(() => {
        dialogService.close()
    })

    it('Escape on a confirmation answers false', async () => {
        const answer = dialogService.confirm({ title: 'Delete?', message: 'Sure?' })

        escape()

        expect(await settled(answer)).toBe(false)
        expect(dialogService.activeModal).toBeNull()
    })

    it('Escape on a prompt answers null', async () => {
        const answer = dialogService.prompt({ title: 'Name', message: 'Which?' })

        escape()

        expect(await settled(answer)).toBeNull()
    })

    it('a dialog that takes the place of another answers the first one as cancelled', async () => {
        const first = dialogService.confirm({ title: 'First', message: '1' })
        const second = dialogService.confirm({ title: 'Second', message: '2' })

        expect(await settled(first)).toBe(false)
        expect(document.body.textContent).toContain('Second')
        expect(document.body.textContent).not.toContain('First')

        escape()
        expect(await settled(second)).toBe(false)
    })

    it('Escape with no dialog open does nothing', () => {
        expect(() => escape()).not.toThrow()
    })
})
