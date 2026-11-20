/**
 * Sheet - the window of the phone (F76, REQ-04). Styles: public/css/mobile.css § Sheet.
 *
 *   const sheet = openSheet({ variant: 'bottom', title: 'Filters', content: node, footer: button })
 *   sheet.close()
 *
 * Two forms:
 *   full    the whole screen, for something to read or edit: a header with the title (it wraps,
 *           it is never cut to nothing) and a close button always in view, a body that scrolls,
 *           and an optional footer that stays in view for the main action;
 *   bottom  a short choice: comes from the bottom with a drag handle, closes on a tap outside,
 *           on Escape and on a drag down.
 * Both hold the page behind (and give its place back), keep the focus inside, are a `dialog` for
 * a screen reader, respect the safe areas of the iPhone and slide in 200 ms (no slide for who
 * asked the system for less motion).
 *
 * The sheet is of the phone: its styles live inside the phone's media query, and a sheet that is
 * open when the screen stops being a phone closes. Who opens one asks isPhone() first.
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { lockPageScroll, unlockPageScroll } from '../../utils/pageScrollLock.js'
import { onPhoneChange } from '../../utils/isPhone.js'

/** How long the slide takes; the stylesheet says the same. */
export const SHEET_SLIDE_MS = 200
/** How far down, in px, a bottom sheet is dragged before it closes. */
const DRAG_TO_CLOSE_PX = 80
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let sheetCount = 0

const lessMotion = (win) => Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
const asNodes = (content) => (content === null || content === undefined ? [] : [].concat(content))
const focusables = (panel) => [...panel.querySelectorAll(FOCUSABLE)]

/** The parts of a sheet, put together. Text given as a string is written as text, never as HTML. */
function build({ variant, title, content, footer, id, closeLabel }) {
    sheetCount += 1
    const titleId = `sheetTitle${sheetCount}` // an id, for aria-labelledby
    const closeButton = SafeDOM.create('button', { type: 'button', className: 'sheet__close', 'aria-label': closeLabel })
    closeButton.appendChild(SafeDOM.fromHTML(getIcon('X', 'sheet__close-icon')))

    const titleEl = SafeDOM.create('h2', { id: titleId, className: 'sheet__title' }, title)
    const body = SafeDOM.create('div', { className: 'sheet__body' }, asNodes(content))
    const footerEl = footer ? SafeDOM.create('div', { className: 'sheet__footer' }, asNodes(footer)) : null
    const handle = variant === 'bottom' ? SafeDOM.create('div', { className: 'sheet__handle' }) : null
    const header = SafeDOM.create('div', { className: 'sheet__header' }, [titleEl, closeButton])

    const panel = SafeDOM.create('div', { className: 'sheet__panel' }, [handle, header, body, footerEl].filter(Boolean))
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-modal', 'true')
    panel.setAttribute('aria-labelledby', titleId)
    panel.setAttribute('tabindex', '-1')

    const backdrop = SafeDOM.create('div', { className: 'sheet__backdrop' })
    const element = SafeDOM.create('div', { className: `sheet sheet--${variant}` }, [backdrop, panel])
    if (id) element.id = id
    return { element, backdrop, panel, header, handle, titleEl, body, footerEl, closeButton }
}

/** Tab and Shift+Tab go round inside the panel. */
function keepFocusInside(event, panel, doc) {
    const inside = focusables(panel)
    if (inside.length === 0) {
        event.preventDefault()
        panel.focus()
        return
    }
    const first = inside[0]
    const last = inside[inside.length - 1]
    const active = doc.activeElement
    if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault()
        first.focus()
    }
}

/** A bottom sheet follows the finger down from its handle or header, and closes past a line. */
function attachDrag(parts, close) {
    let from = null
    const moved = (event) => Math.max(0, event.touches[0].clientY - from)
    const start = (event) => { from = event.touches[0].clientY }
    const move = (event) => {
        if (from === null) return
        parts.panel.style.transform = `translateY(${moved(event)}px)`
    }
    const end = (event) => {
        if (from === null) return
        const distance = Math.max(0, (event.changedTouches[0]?.clientY ?? from) - from)
        from = null
        parts.panel.style.transform = ''
        if (distance > DRAG_TO_CLOSE_PX) close()
    }
    for (const grip of [parts.handle, parts.header]) {
        grip.addEventListener('touchstart', start, { passive: true })
        grip.addEventListener('touchmove', move, { passive: true })
        grip.addEventListener('touchend', end)
    }
}

/**
 * Opens a sheet over the page.
 * @param {Object} options
 * @param {'full'|'bottom'} [options.variant='full']
 * @param {string} options.title - what the sheet is; read by the screen reader as its name
 * @param {Node|string|Array<Node|string>} [options.content] - the body
 * @param {Node|Array<Node>} [options.footer] - the main action, kept in view at the bottom
 * @param {Function} [options.onClose] - called once, when the sheet closes by any way
 * @param {string} [options.id]
 * @param {string} [options.closeLabel='Close']
 * @param {Window} [options.win]
 * @returns {{ element: HTMLElement, body: HTMLElement, footer: HTMLElement|null, isOpen: () => boolean, setTitle: (text: string) => void, close: () => void }}
 */
export function openSheet({ variant = 'full', title, content, footer, onClose, id, closeLabel = 'Close', win = window } = {}) {
    const doc = win.document
    const form = variant === 'bottom' ? 'bottom' : 'full'
    const parts = build({ variant: form, title, content, footer, id, closeLabel })
    const cameFrom = doc.activeElement
    let open = true

    const onKeydown = (event) => {
        if (event.key === 'Escape') {
            event.stopPropagation()
            close()
        } else if (event.key === 'Tab') {
            keepFocusInside(event, parts.panel, doc)
        }
    }

    const stopHearingTheScreen = onPhoneChange((phone) => { if (!phone) close() }, win)

    function close() {
        if (!open) return
        open = false
        doc.removeEventListener('keydown', onKeydown, true)
        stopHearingTheScreen()
        unlockPageScroll(win)
        if (cameFrom?.focus && doc.contains(cameFrom)) cameFrom.focus({ preventScroll: true })
        if (onClose) onClose()
        if (lessMotion(win)) {
            parts.element.remove()
            return
        }
        parts.element.classList.add('sheet--closing')
        win.setTimeout(() => parts.element.remove(), SHEET_SLIDE_MS)
    }

    parts.closeButton.addEventListener('click', close)
    if (form === 'bottom') {
        parts.backdrop.addEventListener('click', close)
        attachDrag(parts, close)
    }

    lockPageScroll(win)
    doc.body.appendChild(parts.element)
    doc.addEventListener('keydown', onKeydown, true)
    // The first thing to act on inside the body gets the focus; with none, the sheet itself
    const first = focusables(parts.body)[0] || focusables(parts.footerEl || parts.body)[0] || parts.panel
    first.focus({ preventScroll: true })

    return {
        element: parts.element,
        body: parts.body,
        footer: parts.footerEl,
        isOpen: () => open,
        setTitle: (text) => { parts.titleEl.textContent = text },
        close
    }
}
