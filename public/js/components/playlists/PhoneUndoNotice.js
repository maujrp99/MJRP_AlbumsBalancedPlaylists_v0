/**
 * PhoneUndoNotice - «Track removed · Undo», at the foot of the phone, above the action bar
 * (F76, TASK-04). A removal on the phone is not asked about first: it happens, and this notice
 * offers to take it back for a few seconds (NN/g: for a repeated destructive action, an Undo in
 * view beats a confirmation every time). One notice at a time; a new one replaces the old.
 * Styles: public/css/mobile/playlists.css (phone only).
 */
import { SafeDOM } from '../../utils/SafeDOM.js'

/** How long the notice stays, in ms. */
export const UNDO_NOTICE_MS = 6000

let current = null

/** Take the notice away (no undo). */
export function dismissUndoNotice() {
    if (!current) return
    clearTimeout(current.timer)
    current.element.remove()
    current = null
}

/**
 * @param {Object} options
 * @param {string} options.text - what happened («Removed "Song"»), written as text
 * @param {Function} options.onUndo - takes it back
 * @param {number} [options.duration]
 * @param {Document} [options.doc]
 * @returns {HTMLElement} the notice
 */
export function showUndoNotice({ text, onUndo, duration = UNDO_NOTICE_MS, doc = document }) {
    dismissUndoNotice()
    const undo = SafeDOM.button({ type: 'button', className: 'phone-undo__btn' }, 'Undo')
    const element = SafeDOM.div({ className: 'phone-undo', role: 'status' }, [
        SafeDOM.span({ className: 'phone-undo__text' }, text),
        undo
    ])
    undo.addEventListener('click', () => {
        dismissUndoNotice()
        onUndo()
    })
    doc.body.appendChild(element)
    current = { element, timer: setTimeout(dismissUndoNotice, duration) }
    return element
}
