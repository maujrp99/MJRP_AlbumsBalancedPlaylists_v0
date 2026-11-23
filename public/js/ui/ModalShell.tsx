/**
 * ModalShell - the window of the app, written as React (F83 wave 5b; proposal § 4.4; it was components/ui/BaseModal.js until wave 8b).
 *
 * The window draws its whole self, body and footer, so a footer may read what the body edits (the window to edit a series: «Save Changes»
 * reads the name and the list): the panel, header, close button and classes the hand-made shell had, put on the page at the end of `body`.
 * `sheet` is the form the window takes on the phone (F76): the whole screen for something to read or edit (`full`, the default), a sheet from
 * the bottom for a short choice (`bottom`, the question windows); the `app-modal--*` classes carry it, with rules only inside the phone's media
 * query (css/mobile.css). test/ui/engines.sameAsBefore.test.tsx keeps the shell equal to the picture kept of the hand-made one, in every size.
 * The window gives nothing else the hand-made shell did not give: no Escape, no focus trap (issue candidates), and a click on the backdrop closes it
 * only when the window asks (`closeOnBackdrop`: the export window of F90 does, as the hand-made one did; the shell of wave 5b never did).
 */
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { t } from '../i18n/t.js'
import { Icon } from './Icon'

const WIDTHS = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

interface Props {
    /** The id of the backdrop element. */
    id: string
    title: string
    size?: keyof typeof WIDTHS
    /** The form on the phone: the whole screen (`full`) or a sheet from the bottom (`bottom`). */
    sheet?: 'full' | 'bottom'
    onClose: () => void
    /** A click on the backdrop (not on the panel) closes the window. */
    closeOnBackdrop?: boolean
    footer?: ReactNode
    children: ReactNode
}

export function ModalShell({ id, title, size = 'md', sheet = 'full', onClose, closeOnBackdrop = false, footer, children }: Props) {
    return createPortal(
        <div id={id} className={`app-modal app-modal--${sheet === 'bottom' ? 'bottom' : 'full'} fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200`} onClick={closeOnBackdrop ? (event) => { if (event.target === event.currentTarget) onClose() } : undefined}>
            <div role="dialog" aria-modal="true" className={`app-modal__panel glass-panel w-full ${WIDTHS[size] ?? WIDTHS.md} rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-white/10 dark-glow relative overflow-hidden flex flex-col max-h-[90vh]`}>
                <div className="app-modal__header px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                    <h3 className="app-modal__title text-xl font-bold flex items-center gap-2 text-white">{title}</h3>
                    <button type="button" className="app-modal__close text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg" aria-label={t('ui.window.close')} data-action="close-modal" onClick={onClose}>
                        <Icon name="X" className="w-5 h-5" />
                    </button>
                </div>
                <div className="app-modal__body px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">{children}</div>
                {footer ? <div className="app-modal__footer px-6 py-4 border-t border-white/5 bg-white/5 flex justify-end gap-3 shrink-0">{footer}</div> : null}
            </div>
        </div>,
        document.body
    )
}
