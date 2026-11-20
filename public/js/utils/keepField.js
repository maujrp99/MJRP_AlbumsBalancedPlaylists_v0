/**
 * keepField - a screen that is drawn again keeps the field the person is typing in (F73).
 *
 * Several screens draw themselves whole when a store changes: every element is replaced, the
 * field in use among them, and the keys that follow go nowhere. The remedy lives here, once:
 * remember the field in use, draw, and hand the field back with what was typed and the cursor
 * where it was. What the person typed wins over what the screen would draw.
 *
 * A field is recognised after the redraw by its `id`: a field with no id cannot be handed back.
 *
 * The place on the page is kept too (UAT-219): while the screen is empty, in the middle of the
 * redraw, the page is short and the browser takes the scroll to the top; it is put back after.
 */

const TEXT_TYPES = new Set(['', 'text', 'search', 'email', 'url', 'tel', 'number', 'password'])

const isTextField = (element) => {
    if (!element) return false
    if (element.tagName === 'TEXTAREA') return true
    return element.tagName === 'INPUT' && TEXT_TYPES.has((element.getAttribute('type') || '').toLowerCase())
}

/** The field in use inside the container, with what is needed to hand it back; null when none. */
function fieldInUse(container, doc) {
    const field = doc.activeElement
    if (!isTextField(field) || !field.id || !container.contains(field)) return null
    const kept = { id: field.id, value: field.value, start: null, end: null }
    try {
        kept.start = field.selectionStart
        kept.end = field.selectionEnd
    } catch {
        // some types of field have no cursor to read: the field is handed back without it
    }
    return kept
}

function handBack(container, doc, kept) {
    const field = doc.getElementById(kept.id)
    if (!isTextField(field) || !container.contains(field) || doc.activeElement === field) return
    field.value = kept.value
    field.focus({ preventScroll: true })
    if (kept.start === null) return
    try {
        field.setSelectionRange(kept.start, kept.end)
    } catch {
        // no cursor to set in this type of field
    }
}

/**
 * Draws the screen again, hands back the field that was in use and keeps the place on the page.
 * @param {HTMLElement} container - what is drawn again
 * @param {Function} redraw - replaces the content of the container
 * @param {Document} [doc]
 */
export function redrawKeepingField(container, redraw, doc = document) {
    const kept = container ? fieldInUse(container, doc) : null
    const view = doc.defaultView
    const place = view ? { x: view.scrollX, y: view.scrollY } : null
    redraw()
    if (kept) handBack(container, doc, kept)
    if (place && (view.scrollX !== place.x || view.scrollY !== place.y)) view.scrollTo(place.x, place.y)
}
