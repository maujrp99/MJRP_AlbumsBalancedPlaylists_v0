/**
 * ConfirmWindow - the app's confirmation window (F83 wave 8b; it was components/ui/modals/ConfirmModal.js): a title, a message and two buttons, in the
 * shell of the app's windows, as a sheet from the bottom on the phone (F76). It draws and tells: whoever opens it (ui/dialogs/dialogs.ts for the
 * questions, the ranking window for «Discard changes?») answers, and owns Escape. The close button is «cancel» too.
 */
import { t } from '../../i18n/t.js'
import { ModalShell } from '../ModalShell'

const VARIANTS: Record<string, string> = { primary: 'btn-primary', danger: 'btn-danger', warning: 'btn-warning' }

export interface ConfirmProps {
    title: string
    message: string
    /** The confirm button's words (default «Confirm»). */
    confirmText?: string
    /** The cancel button's words (default «Cancel»); `null` leaves the button empty, as the hand-made window's alert did. */
    cancelText?: string | null
    /** How the confirm button looks: `primary` (the default), `danger` or `warning`. */
    variant?: string
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmWindow({ title, message, confirmText = t('ui.dialog.confirm'), cancelText = t('ui.dialog.cancel'), variant = 'primary', onConfirm, onCancel }: ConfirmProps) {
    const footer = (
        <>
            <button type="button" className="btn btn-ghost" data-action="cancel" onClick={() => onCancel()}>{cancelText}</button>
            <button type="button" className={`btn ${VARIANTS[variant] ?? 'btn-primary'}`} data-action="confirm" onClick={() => onConfirm()}>{confirmText}</button>
        </>
    )
    return (
        <ModalShell id="confirm-modal" title={title} size="sm" sheet="bottom" onClose={onCancel} footer={footer}>
            <p className="text-gray-300 leading-relaxed">{message}</p>
        </ModalShell>
    )
}
