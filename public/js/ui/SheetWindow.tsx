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
    footer: HTMLElement | null
    close: () => void
    isOpen: () => boolean
    setTitle: (text: string) => void
}

export interface SheetRequest {
    /** The id of the sheet's element. */
    id?: string
    /** `bottom` (a short choice, the default) or `full` (the whole screen, for something to read or edit). */
    variant?: 'bottom' | 'full'
    title: string
    /** Drawn inside the title, after its text (a count, say). */
    titleExtra?: () => ReactNode
    /** Called once, when the sheet closes by any way (after the sheet's own bookkeeping). */
    onClose?: () => void
    /** Give the focus to the first thing to act on once what is inside is drawn (the default); `false` leaves it where the motor put it (the sheet itself). */
    focusFirst?: boolean
    /** The classes the sheet takes besides the ones of the motor. */
    className?: string
    closeLabel: string
    /** What is inside; `close` shuts the sheet. */
    render: (close: () => void) => ReactNode
    /** What is in the footer that stays in view (the main action); no footer when it is left out. */
    footer?: (close: () => void) => ReactNode
}

interface Shown {
    sheet: SheetHandle
    render: SheetRequest['render']
    footer?: SheetRequest['footer']
    titleExtra?: SheetRequest['titleExtra']
    focusFirst: boolean
    title: HTMLElement | null
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useSheetWindow(): { show: (request: SheetRequest) => void; close: () => void; isOpen: () => boolean; setTitle: (text: string) => void; layer: ReactNode } {
    const [shown, setShown] = useState<Shown | null>(null)
    const current = useRef<SheetHandle | null>(null)

    const show = useCallback((request: SheetRequest) => {
        const sheet: SheetHandle = openSheet({
            variant: request.variant ?? 'bottom',
            id: request.id,
            footer: request.footer ? [] : undefined, // an empty footer: what is in it is drawn by React, through a portal
            title: request.title,
            closeLabel: request.closeLabel,
            onClose: () => {
                if (current.current === sheet) current.current = null
                request.onClose?.()
                // the hand-made sheet slides away with what it held still in it: what React draws in it goes when the sheet leaves the page
                // the screen draws again at once (it may show something because the sheet is closed); what is inside stays until the slide ends
                setShown(previous => (previous?.sheet === sheet ? { ...previous } : previous))
                const letGo = () => setShown(previous => (previous?.sheet === sheet ? null : previous))
                let looks = 0
                const waitForTheSlide = () => { if (sheet.element.isConnected && looks++ < 40) window.setTimeout(waitForTheSlide, 40); else letGo() }
                waitForTheSlide()
            }
        })
        if (request.className) sheet.element.classList.add(...request.className.split(' '))
        current.current = sheet
        setShown({ sheet, render: request.render, footer: request.footer, titleExtra: request.titleExtra, focusFirst: request.focusFirst ?? true, title: sheet.element.querySelector<HTMLElement>('.sheet__title') })
    }, [])

    const close = useCallback(() => current.current?.close(), [])
    const isOpen = useCallback(() => Boolean(current.current?.isOpen()), [])
    /** The title of the open sheet as a text (a count that changes while it is open). */
    const setTitle = useCallback((text: string) => { current.current?.setTitle(text) }, [])

    // What is drawn inside is in the body now: the first thing to act on gets the focus, as the motor does when it has content.
    useLayoutEffect(() => {
        if (!shown?.focusFirst || !shown.sheet.isOpen()) return
        const first = shown?.sheet.body.querySelector<HTMLElement>(FOCUSABLE) ?? shown?.sheet.footer?.querySelector<HTMLElement>(FOCUSABLE)
        first?.focus({ preventScroll: true })
    }, [shown])

    useEffect(() => () => current.current?.close(), [])

    const layer = shown ? (
        <>
            {createPortal(shown.render(shown.sheet.close), shown.sheet.body)}
            {shown.footer && shown.sheet.footer ? createPortal(shown.footer(shown.sheet.close), shown.sheet.footer) : null}
            {shown.titleExtra && shown.title ? createPortal(shown.titleExtra(), shown.title) : null}
        </>
    ) : null
    return { show, close, isOpen, setTitle, layer }
}
