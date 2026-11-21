/**
 * useSheetWindow - the sheet of the phone (components/ui/Sheet.js) for a React screen (F83 wave 1; proposal § 4.4).
 *
 * The motor stays the hand-made one: it holds the page, keeps the focus inside, closes on Escape, on a tap outside and on a
 * drag down, and closes when the screen stops being a phone (173 lines of tested behaviour). This hook opens it and draws what
 * is inside as React, through a portal into its body: one logic, no visual change. The sheet is opened from a tap (an event),
 * never from an effect, so the strict mode does not open it twice; leaving the screen closes it.
 */
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { openSheet } from '../components/ui/Sheet.js'

interface SheetHandle {
    element: HTMLElement
    body: HTMLElement
    close: () => void
}

export interface SheetRequest {
    title: string
    /** The classes the sheet takes besides the ones of the motor. */
    className?: string
    closeLabel: string
    /** What is inside; `close` shuts the sheet. */
    render: (close: () => void) => ReactNode
}

interface Shown {
    sheet: SheetHandle
    render: SheetRequest['render']
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useSheetWindow(): { show: (request: SheetRequest) => void; layer: ReactNode } {
    const [shown, setShown] = useState<Shown | null>(null)
    const current = useRef<SheetHandle | null>(null)

    const show = useCallback((request: SheetRequest) => {
        const sheet: SheetHandle = openSheet({
            variant: 'bottom',
            title: request.title,
            closeLabel: request.closeLabel,
            onClose: () => {
                if (current.current === sheet) current.current = null
                setShown(previous => (previous?.sheet === sheet ? null : previous))
            }
        })
        if (request.className) sheet.element.classList.add(...request.className.split(' '))
        current.current = sheet
        setShown({ sheet, render: request.render })
    }, [])

    // What is drawn inside is in the body now: the first thing to act on gets the focus, as the motor does when it has content.
    useLayoutEffect(() => {
        const first = shown?.sheet.body.querySelector<HTMLElement>(FOCUSABLE)
        first?.focus({ preventScroll: true })
    }, [shown])

    useEffect(() => () => current.current?.close(), [])

    const layer = shown ? createPortal(shown.render(shown.sheet.close), shown.sheet.body) : null
    return { show, layer }
}
