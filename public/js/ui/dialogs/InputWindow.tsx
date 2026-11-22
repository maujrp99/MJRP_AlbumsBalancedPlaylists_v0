/**
 * InputWindow - the app's question with a text field (F83 wave 8b; it was components/ui/modals/InputModal.js): a title, an optional message and label, a field
 * and two buttons. «Save» is off until the text is valid (by default: not empty); Enter in the field answers when it is valid. The field is not
 * controlled (the hand-made one was not): it starts with `initialValue`, and what it holds is read by the button and by Enter. Whoever opens it
 * (ui/dialogs/dialogs.ts) owns Escape and takes the focus to the field on the next frame (`field`).
 */
import { useState, type MutableRefObject } from 'react'
import { t } from '../../i18n/t.js'
import { ModalShell } from '../ModalShell'

export interface InputProps {
    title: string
    /** Helper text above the field. */
    message?: string
    label?: string
    initialValue?: string
    placeholder?: string
    /** The confirm button's words (default «Save»). */
    confirmText?: string
    cancelText?: string
    /** Whether the text is valid; the default is «not empty». */
    validate?: (value: string) => unknown
    onConfirm: (value: string) => void
    onCancel: () => void
    /** Where the window puts its field, for whoever focuses it. */
    field?: MutableRefObject<HTMLInputElement | null>
}

const notEmpty = (value: string): unknown => value && value.trim().length > 0

export function InputWindow({ title, message, label, initialValue = '', placeholder = '', confirmText = t('ui.dialog.save'), cancelText = t('ui.dialog.cancel'), validate = notEmpty, onConfirm, onCancel, field }: InputProps) {
    const [value, setValue] = useState(initialValue)
    const valid = Boolean(validate(value))

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <button type="button" className="btn btn-ghost" onClick={() => onCancel()}>{cancelText}</button>
            <button type="button" className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={!valid} onClick={() => onConfirm(value)}>{confirmText}</button>
        </div>
    )
    // the hand-made field carried the `autofocus` attribute, which React does not write; the focus itself comes a frame later, from whoever opened the window
    const made = (element: HTMLInputElement | null): void => {
        if (field) field.current = element
        element?.setAttribute('autofocus', '')
    }
    return (
        <ModalShell id="input-modal" title={title} size="sm" onClose={onCancel} footer={footer}>
            <div>
                {message ? <p className="text-gray-400 mb-4 text-sm">{message}</p> : null}
                <div className="flex flex-col gap-2">
                    {label ? <label className="text-sm font-medium text-gray-300">{label}</label> : null}
                    <input
                        ref={made}
                        type="text"
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none transition-colors"
                        defaultValue={initialValue}
                        placeholder={placeholder}
                        onChange={(event) => setValue(event.target.value)}
                        onKeyDown={(event) => { if (event.key === 'Enter' && valid) onConfirm(value) }}
                    />
                </div>
            </div>
        </ModalShell>
    )
}
