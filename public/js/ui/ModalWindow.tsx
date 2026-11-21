/**
 * useModalWindow - the window of the app (components/ui/BaseModal.js) for a React screen (F83 wave 1; proposal § 4.4).
 *
 * The shell of the window stays the hand-made one (the same panel, header, close button and classes, put on the page the same
 * way); what goes in its body and in its footer is drawn as React, through portals into two boxes the hook gives the shell.
 * Opened from a tap, never from an effect; closing it, or leaving the screen, takes it off the page.
 */
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BaseModal } from '../components/ui/BaseModal.js'

export interface ModalRequest {
    id: string
    title: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** The classes of the box that holds the footer's content (the footer of the shell wraps it). */
    footerClassName?: string
    body: (close: () => void) => ReactNode
    footer: (close: () => void) => ReactNode
}

interface Shown {
    id: string
    body: HTMLElement
    footer: HTMLElement
    request: ModalRequest
}

const box = (className = ''): HTMLElement => {
    const element = document.createElement('div')
    if (className) element.className = className
    return element
}

export function useModalWindow(): { show: (request: ModalRequest) => void; layer: ReactNode } {
    const [shown, setShown] = useState<Shown | null>(null)
    const currentId = useRef<string | null>(null)

    const close = useCallback((id: string) => {
        BaseModal.unmount(id)
        if (currentId.current === id) currentId.current = null
        setShown(previous => (previous?.id === id ? null : previous))
    }, [])

    const show = useCallback((request: ModalRequest) => {
        const body = box()
        const footer = box(request.footerClassName)
        const shell = BaseModal.render({
            id: request.id,
            title: request.title,
            content: body,
            footer,
            size: request.size,
            onClose: () => close(request.id)
        })
        BaseModal.mount(shell)
        currentId.current = request.id
        setShown({ id: request.id, body, footer, request })
    }, [close])

    useEffect(() => () => { if (currentId.current) BaseModal.unmount(currentId.current) }, [])

    if (!shown) return { show, layer: null }
    const closeThis = () => close(shown.id)
    const layer = (
        <>
            {createPortal(shown.request.body(closeThis), shown.body)}
            {createPortal(shown.request.footer(closeThis), shown.footer)}
        </>
    )
    return { show, layer }
}
