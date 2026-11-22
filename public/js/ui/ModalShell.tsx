/**
 * ModalShell - the window of the app (components/ui/BaseModal.js) written as React (F83 wave 5b; proposal § 4.4).
 *
 * The shell of `useModalWindow` (wave 1) is the hand-made one, with the body and the footer drawn through portals into two boxes: that is
 * right for a window whose body and footer do not share state. A window whose footer reads what the body edits (the window to edit a
 * series: «Save Changes» reads the name and the list) draws its whole self, and this is the shell: the same panel, header, close button and
 * classes as BaseModal.render, put on the page at the end of `body` the same way. test/ui/ModalShell.test.tsx keeps it equal to BaseModal.
 * The window gives nothing else the hand-made shell did not give: no Escape, no click on the backdrop, no focus trap (issue candidates).
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
    onClose: () => void
    footer?: ReactNode
    children: ReactNode
}

export function ModalShell({ id, title, size = 'md', onClose, footer, children }: Props) {
    return createPortal(
        <div id={id} className="app-modal app-modal--full fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div role="dialog" aria-modal="true" className={`app-modal__panel glass-panel w-full ${WIDTHS[size]} rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-white/10 dark-glow relative overflow-hidden flex flex-col max-h-[90vh]`}>
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
