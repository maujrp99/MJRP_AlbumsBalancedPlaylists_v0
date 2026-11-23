/**
 * SheetWindow - the sheet of the phone, written as React (F83 wave 8c; it was components/ui/Sheet.js, a hand-made motor, until then). Styles: public/css/mobile.css § Sheet.
 *
 *   const sheet = useSheetWindow()                       // in a screen
 *   sheet.show({ title, closeLabel, render: (close) => <Body/>, footer: (close) => <Save/> })
 *   return <>{...}{sheet.layer}</>
 *
 *   const door = openSheet({ title, closeLabel, render })  // from code that is not a component (a controller): the same sheet, its own React root
 *
 * Two forms:
 *   full    the whole screen, for something to read or edit: a header with the title (it wraps, it is never cut to nothing) and a close
 *           button always in view, a body that scrolls, and an optional footer that stays in view for the main action;
 *   bottom  a short choice: comes from the bottom with a drag handle, closes on a tap outside, on Escape and on a drag down.
 * Both hold the page behind (and give its place back: utils/pageScrollLock.js, kept as it was: a utility of the page that writes the style of the
 * `body`, which React has no equivalent for), keep the focus inside, are a `dialog` for a screen reader, respect the safe areas of the iPhone and slide
 * in 200 ms (no slide for who asked the system for less motion). The sheet is of the phone: its styles live inside the phone's media query, and a
 * sheet that is open when the screen stops being a phone closes.
 *
 * The sheet draws through a portal into the end of `body`, from the tree of the screen that opened it (so what is inside keeps the context of the
 * screen). Opening and closing are done in the event that asks (the page is held, the focus is given back, whoever opened it is told); the markup follows
 * in the same update. test/ui/SheetWindow.sameAsBefore.test.tsx keeps all of it equal to the pictures kept of the hand-made motor.
 *
 * Differences from the hand-made motor, on purpose: (1) a sheet still open when its screen is left goes with the screen, at once (the hand-made one
 * slid away, empty, over the next screen); (2) a sheet that is closing keeps what was drawn in it while it slides (the hand-made one lost it when another
 * sheet was opened by the same screen). Kept as they were: no `visualViewport` handling and no velocity in the drag (a distance of more than 80 px closes
 * it), and a question window opened from a sheet sits under it (z-index 1000 of the sheet against 50 of the window) and the sheet hears Escape first.
 */
import { createPortal, flushSync } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { t } from '../i18n/t.js'
import { Icon } from './Icon'
import { showWindow } from './windowLayer'
import { lockPageScroll, unlockPageScroll } from '../utils/pageScrollLock.js'
import { onPhoneChange } from '../utils/isPhone.js'

/** How long the slide takes; the stylesheet says the same. */
export const SHEET_SLIDE_MS = 200
/** How far down, in px, a bottom sheet is dragged before it closes. */
const DRAG_TO_CLOSE_PX = 80
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface SheetRequest {
    /** The id of the sheet's element. */
    id?: string
    /** `bottom` (a short choice, the default) or `full` (the whole screen, for something to read or edit). */
    variant?: 'bottom' | 'full'
    title: string
    /** Drawn inside the title, after its text (a count, say). */
    titleExtra?: () => ReactNode
    /** Called once, when the sheet closes by any way (after the page is given back and the focus too). */
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

/** What a screen gets back from opening a sheet. The elements are there once the sheet is drawn. */
export interface SheetHandle {
    readonly element: HTMLElement | null
    readonly body: HTMLElement | null
    readonly footer: HTMLElement | null
    close: () => void
    isOpen: () => boolean
    setTitle: (text: string) => void
}

/** One sheet: what the motor knows of it. The markup is drawn from it by `SheetShell`. */
interface Sheet {
    id: number
    titleId: string
    form: 'bottom' | 'full'
    request: SheetRequest
    open: boolean
    parts: { element: HTMLElement | null; panel: HTMLElement | null; body: HTMLElement | null; footer: HTMLElement | null }
    close: () => void
}

interface Shown {
    sheet: Sheet
    title: string
    closing: boolean
}

/** The list with the title of one sheet changed: the same list when the title is already that (a screen may say it at every draw; it must not draw again for it). */
const retitled = (list: Shown[], sheet: Sheet, text: string): Shown[] => (list.some(one => one.sheet === sheet && one.title !== text) ? list.map(one => (one.sheet === sheet ? { ...one, title: text } : one)) : list)

let sheetCount = 0

const lessMotion = (): boolean => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
const focusables = (root: Element | null | undefined): HTMLElement[] => (root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : [])

/** Tab and Shift+Tab go round inside the panel. */
function keepFocusInside(event: KeyboardEvent, panel: HTMLElement): void {
    const inside = focusables(panel)
    if (inside.length === 0) {
        event.preventDefault()
        panel.focus()
        return
    }
    const first = inside[0]
    const last = inside[inside.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault()
        first.focus()
    }
}

/** A bottom sheet follows the finger down from its handle or header, and closes past a line. */
function useDrag(sheet: Sheet, handle: React.RefObject<HTMLDivElement | null>, header: React.RefObject<HTMLDivElement | null>): void {
    useLayoutEffect(() => {
        const panel = sheet.parts.panel
        if (sheet.form !== 'bottom' || !panel || !handle.current || !header.current) return
        let from: number | null = null
        const start = (event: TouchEvent) => { from = event.touches[0].clientY }
        const move = (event: TouchEvent) => {
            if (from === null) return
            panel.style.transform = `translateY(${Math.max(0, event.touches[0].clientY - from)}px)`
        }
        const end = (event: TouchEvent) => {
            if (from === null) return
            const distance = Math.max(0, (event.changedTouches[0]?.clientY ?? from) - from)
            from = null
            panel.style.transform = ''
            if (distance > DRAG_TO_CLOSE_PX) sheet.close()
        }
        const grips = [handle.current, header.current]
        for (const grip of grips) {
            grip.addEventListener('touchstart', start, { passive: true })
            grip.addEventListener('touchmove', move, { passive: true })
            grip.addEventListener('touchend', end)
        }
        return () => {
            for (const grip of grips) {
                grip.removeEventListener('touchstart', start)
                grip.removeEventListener('touchmove', move)
                grip.removeEventListener('touchend', end)
            }
        }
    }, [sheet, handle, header])
}

/** The markup of one sheet: the same classes, attributes and order the hand-made motor wrote. */
function SheetShell({ sheet, title, closing }: { sheet: Sheet; title: string; closing: boolean }) {
    const { request, form } = sheet
    const handle = useRef<HTMLDivElement>(null)
    const header = useRef<HTMLDivElement>(null)
    const panel = useRef<HTMLDivElement | null>(null)

    // The first thing to act on inside gets the focus once what is inside is drawn; with none (or when the opener asks), the sheet itself. What
    // is inside may have taken the focus as it was drawn (a button of the footer): that stays.
    useLayoutEffect(() => {
        const element = sheet.parts.panel
        if (!element) return
        if (request.focusFirst ?? true) (focusables(sheet.parts.body)[0] ?? focusables(sheet.parts.footer)[0] ?? element).focus({ preventScroll: true })
        else if (!element.contains(document.activeElement)) element.focus({ preventScroll: true })
    }, [sheet, request.focusFirst])

    useDrag(sheet, handle, header)

    const classes = ['sheet', `sheet--${form}`, ...(request.className ? request.className.split(' ') : []), ...(closing ? ['sheet--closing'] : [])].join(' ')
    return (
        <div className={classes} id={request.id} ref={(element) => { sheet.parts.element = element }}>
            <div className="sheet__backdrop" onClick={form === 'bottom' ? () => sheet.close() : undefined} />
            <div className="sheet__panel" role="dialog" aria-modal="true" aria-labelledby={sheet.titleId} tabIndex={-1} ref={(element) => { panel.current = element; sheet.parts.panel = element }}>
                {form === 'bottom' ? <div className="sheet__handle" ref={handle} /> : null}
                <div className="sheet__header" ref={header}>
                    <h2 id={sheet.titleId} className="sheet__title">{title}{request.titleExtra?.()}</h2>
                    <button type="button" className="sheet__close" aria-label={request.closeLabel} onClick={() => sheet.close()}>
                        <Icon name="X" className="sheet__close-icon" />
                    </button>
                </div>
                <div className="sheet__body" ref={(element) => { sheet.parts.body = element }}>{request.render(sheet.close)}</div>
                {request.footer ? <div className="sheet__footer" ref={(element) => { sheet.parts.footer = element }}>{request.footer(sheet.close)}</div> : null}
            </div>
        </div>
    )
}

export function useSheetWindow(): { show: (request: SheetRequest) => SheetHandle; close: () => void; isOpen: () => boolean; setTitle: (text: string) => void; layer: ReactNode } {
    const [shown, setShown] = useState<Shown[]>([])
    const current = useRef<Sheet | null>(null)
    const alive = useRef(new Set<Sheet>())

    const show = useCallback((request: SheetRequest): SheetHandle => {
        sheetCount += 1
        const sheet: Sheet = {
            id: sheetCount,
            titleId: `sheetTitle${sheetCount}`, // an id, for aria-labelledby
            form: (request.variant ?? 'bottom') === 'bottom' ? 'bottom' : 'full',
            request,
            open: true,
            parts: { element: null, panel: null, body: null, footer: null },
            close: () => { }
        }
        const cameFrom = document.activeElement as HTMLElement | null

        const onKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                sheet.close()
            } else if (event.key === 'Tab' && sheet.parts.panel) {
                keepFocusInside(event, sheet.parts.panel)
            }
        }
        const stopHearingTheScreen = onPhoneChange((phone: boolean) => { if (!phone) sheet.close() })

        sheet.close = () => {
            if (!sheet.open) return
            sheet.open = false
            alive.current.delete(sheet)
            document.removeEventListener('keydown', onKeydown, true)
            stopHearingTheScreen()
            unlockPageScroll(window)
            if (cameFrom?.focus && document.contains(cameFrom)) cameFrom.focus({ preventScroll: true })
            if (current.current === sheet) current.current = null
            request.onClose?.()
            const goes = () => setShown(list => list.filter(one => one.sheet !== sheet))
            if (lessMotion()) {
                goes()
                return
            }
            // The sheet is marked as closing in this very call (what watches the page, as the page-hold of the shell does, must not count it as open for the
            // microtask React needs to draw the class: it writes the same classes). The screen draws again at once (it may show something because the sheet is
            // closed); the sheet slides away with what it held.
            sheet.parts.element?.classList.add('sheet--closing')
            setShown(list => list.map(one => (one.sheet === sheet ? { ...one, closing: true } : one)))
            window.setTimeout(goes, SHEET_SLIDE_MS)
        }

        lockPageScroll(window)
        document.addEventListener('keydown', onKeydown, true)
        current.current = sheet
        alive.current.add(sheet)
        setShown(list => [...list, { sheet, title: request.title, closing: false }])

        return {
            get element() { return sheet.parts.element },
            get body() { return sheet.parts.body },
            get footer() { return sheet.parts.footer },
            close: () => sheet.close(),
            isOpen: () => sheet.open,
            setTitle: (text: string) => { if (sheet.open) setShown(list => retitled(list, sheet, text)) }
        }
    }, [])

    const close = useCallback(() => current.current?.close(), [])
    const isOpen = useCallback(() => Boolean(current.current?.open), [])
    /** The title of the open sheet as a text (a count that changes while it is open). */
    const setTitle = useCallback((text: string) => {
        const sheet = current.current
        if (sheet) setShown(list => retitled(list, sheet, text))
    }, [])

    // The screen is left: what it opened goes with it, the page given back
    useEffect(() => () => { for (const sheet of [...alive.current]) sheet.close() }, [])

    const layer = shown.length > 0 ? <>{shown.map(one => createPortal(<SheetShell sheet={one.sheet} title={one.title} closing={one.closing} />, document.body, String(one.sheet.id)))}</> : null
    return { show, close, isOpen, setTitle, layer }
}

/** The host of a sheet opened from code that is not a component: a React root of its own that holds the one sheet and goes when the sheet has. */
function DoorHost({ expose, onEmpty }: { expose: { sheet?: ReturnType<typeof useSheetWindow> }; onEmpty: () => void }) {
    const sheet = useSheetWindow()
    expose.sheet = sheet
    const seen = useRef(false)
    useLayoutEffect(() => {
        if (sheet.layer) seen.current = true
        else if (seen.current) onEmpty()
    })
    return sheet.layer
}

/**
 * Opens a sheet from code that is not a component (a controller): the same sheet, drawn by a React root of its own. Who calls it asks isPhone() first.
 * The title and the footer are what the sheet shows; `render` draws the body.
 */
export function openSheet(request: Omit<SheetRequest, 'closeLabel' | 'variant' | 'render'> & { variant?: 'bottom' | 'full'; closeLabel?: string; render?: SheetRequest['render'] }): SheetHandle {
    const expose: { sheet?: ReturnType<typeof useSheetWindow> } = {}
    let host: { close: () => void } | null = null
    host = showWindow(() => <DoorHost expose={expose} onEmpty={() => host?.close()} />, { staysWhenTheScreenIsLeft: true })
    let handle: SheetHandle | null = null
    flushSync(() => { handle = expose.sheet!.show({ variant: 'full', closeLabel: t('ui.window.close'), render: () => null, ...request }) })
    return handle!
}
