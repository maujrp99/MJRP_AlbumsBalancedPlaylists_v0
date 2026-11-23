/**
 * useModalWindow - the window of the app for a React screen (F83 wave 1; proposal § 4.4). The shell is ui/ModalShell (since wave 8b; until then it was the
 * hand-made components/ui/BaseModal.js, with the body and the footer drawn into two boxes through portals): the same panel, header, close button and classes,
 * with the body and the footer drawn inside it. Opened from a tap, never from an effect; closing it, or leaving the screen, takes it off the page.
 */
import { useCallback, useState, type ReactNode } from 'react'
import { ModalShell } from './ModalShell'

export interface ModalRequest {
    id: string
    title: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** The classes of the box that holds the footer's content (the footer of the shell wraps it). */
    footerClassName?: string
    body: (close: () => void) => ReactNode
    footer: (close: () => void) => ReactNode
}

export function useModalWindow(): { show: (request: ModalRequest) => void; layer: ReactNode } {
    const [shown, setShown] = useState<ModalRequest | null>(null)
    const show = useCallback((request: ModalRequest) => setShown(request), [])

    if (!shown) return { show, layer: null }
    const close = () => setShown(current => (current === shown ? null : current))
    const layer = (
        <ModalShell id={shown.id} title={shown.title} size={shown.size} onClose={close} footer={<div className={shown.footerClassName || undefined}>{shown.footer(close)}</div>}>
            <div>{shown.body(close)}</div>
        </ModalShell>
    )
    return { show, layer }
}
