/**
 * dialogs - the app's questions, asked from code that is not a component (F83 wave 8b; it was services/DialogService.js with the hand-made windows
 * components/ui/BaseModal.js, modals/ConfirmModal.js and InputModal.js). A screen or the shell asks `dialogService.confirm(options)` (answered `true`
 * or `false`), `prompt(options)` (the text, or `null`) or `alert(title, message)`, and waits for the answer; the window is ConfirmWindow or InputWindow,
 * put on the page by ui/windowLayer.
 *
 * What the hand-made service did and this does the same: one window at a time (a new question takes the place of the one on screen, and the one that
 * lost its place is answered as cancelled); Escape is «Cancel» and answers; the close button is «Cancel»; a click on the backdrop does nothing; no focus
 * is taken when a window opens (a text field gets it a frame later) and none is given back; and the window stays when the screen is left (whoever
 * asked is still waiting). Its defects are kept (an issue candidate each): no focus trap, no `aria-labelledby`, and `alert` shows an empty button where
 * «Cancel» would be.
 */
import { createElement, type MutableRefObject } from 'react'
import { t } from '../../i18n/t.js'
import { showWindow, type WindowHandle } from '../windowLayer'
import { ConfirmWindow, type ConfirmProps } from './ConfirmWindow'
import { InputWindow, type InputProps } from './InputWindow'

export type ConfirmOptions = Omit<ConfirmProps, 'onConfirm' | 'onCancel'>
/** `defaultValue` is accepted and ignored, as the hand-made window ignored it (it reads `initialValue`): the rename question of the albums screen asks with it and the field starts empty (an existing defect, an issue candidate). */
export type PromptOptions = Omit<InputProps, 'onConfirm' | 'onCancel' | 'field'> & { defaultValue?: string }

export class DialogService {
    /** The window on screen, or null. */
    activeModal: WindowHandle | null = null
    private onDismiss: (() => void) | null = null
    private keydown: ((event: KeyboardEvent) => void) | null = null

    /**
     * @param onDismiss - answers whoever asked when the window goes away with no answer (Escape, another window taking its place): the same as «Cancel»
     * @param field - a text field to focus on the next frame
     */
    private show(render: (close: () => void) => React.ReactNode, onDismiss: () => void, field?: MutableRefObject<HTMLInputElement | null>): void {
        // one window at a time: the one on screen is dismissed, and whoever asked gets its answer
        this.dismiss()
        this.onDismiss = onDismiss
        this.activeModal = showWindow(render, { staysWhenTheScreenIsLeft: true })
        // Escape is «Cancel»: the window goes away AND the question is answered (F63)
        this.keydown = (event) => { if (event.key === 'Escape') this.dismiss() }
        document.addEventListener('keydown', this.keydown)
        if (field) requestAnimationFrame(() => field.current?.focus())
    }

    /** The window goes away with no answer given: whoever asked is answered as cancelled. */
    dismiss(): void {
        if (!this.activeModal) return
        const onDismiss = this.onDismiss
        if (onDismiss) onDismiss()
        else this.close()
    }

    /** Takes the window on screen off the page. */
    close(): void {
        const handle = this.activeModal
        if (!handle) return
        this.onDismiss = null
        this.activeModal = null
        if (this.keydown) document.removeEventListener('keydown', this.keydown)
        this.keydown = null
        handle.close()
    }

    /** A question with two answers. @returns whether the person confirmed */
    confirm(options: ConfirmOptions): Promise<boolean> {
        return new Promise((resolve) => {
            // the window goes off the page before the caller is answered: what it does next finds the page as it was before the question
            const answer = (value: boolean) => () => { this.close(); resolve(value) }
            const cancel = answer(false)
            this.show(() => createElement(ConfirmWindow, { ...options, onConfirm: answer(true), onCancel: cancel }), cancel)
        })
    }

    /** A question with a text field. @returns the text, or null when the person cancelled */
    prompt(options: PromptOptions): Promise<string | null> {
        return new Promise((resolve) => {
            const cancel = () => { this.close(); resolve(null) }
            const field: MutableRefObject<HTMLInputElement | null> = { current: null }
            this.show(() => createElement(InputWindow, { ...options, field, onConfirm: (value: string) => { this.close(); resolve(value) }, onCancel: cancel }), cancel, field)
        })
    }

    /** A message with one button; it is answered when the window goes. */
    alert(title: string, message: string): Promise<void> {
        return this.confirm({ title, message, confirmText: t('ui.dialog.ok'), cancelText: null }).then(() => { })
    }
}

export const dialogService = new DialogService()
