/**
 * The question windows (ui/dialogs; F83 wave 8b). What they draw and do, to the millisecond, is kept against the hand-made ones in
 * test/ui/engines.sameAsBefore.test.tsx; here are the two things only a real browser's field could get wrong, found by the proof on WebKit:
 * the starting text of the field is its `value` ATTRIBUTE (an unset value: WebKit selects it when the field is focused, as the hand-made one did),
 * and a field emptied from that starting text is heard (React's `onChange` would not hear it: it compares with the value it saw at the start).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { dialogService } from '../../public/js/ui/dialogs/dialogs'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const write = (field: HTMLInputElement, value: string) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => { set.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) })
}

describe('the question with a field', () => {
    afterEach(() => { act(() => { dialogService.close() }) })

    it('starts with its text as the value attribute, and the autofocus attribute is there', () => {
        void dialogService.prompt({ title: 'Rename', initialValue: 'Old name' })
        const field = document.querySelector('#input-modal input') as HTMLInputElement

        expect(field.getAttribute('value')).toBe('Old name')
        expect(field.value).toBe('Old name')
        expect(field.hasAttribute('autofocus')).toBe(true)
    })

    it('a field emptied from its starting text turns «Save» off, and written again turns it on', () => {
        void dialogService.prompt({ title: 'Rename', initialValue: 'Old name' })
        const field = document.querySelector('#input-modal input') as HTMLInputElement
        const save = () => document.querySelectorAll<HTMLButtonElement>('#input-modal .app-modal__footer button')[1]
        expect(save().disabled).toBe(false)

        write(field, '')
        expect(save().disabled).toBe(true)

        write(field, 'New name')
        expect(save().disabled).toBe(false)
    })

    it('answers with what the field holds', async () => {
        const answer = dialogService.prompt({ title: 'Rename', initialValue: 'Old name' })
        write(document.querySelector('#input-modal input') as HTMLInputElement, 'Typed')
        act(() => { document.querySelectorAll<HTMLButtonElement>('#input-modal .app-modal__footer button')[1].click() })

        expect(await answer).toBe('Typed')
    })
})
