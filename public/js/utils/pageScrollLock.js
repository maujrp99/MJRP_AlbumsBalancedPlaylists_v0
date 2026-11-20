/**
 * pageScrollLock - the page behind a sheet does not scroll, and is found where it was (F76, REQ-04).
 *
 * On the iPhone `overflow: hidden` on the body does not hold the page in every version of Safari,
 * so the body is pinned (`position: fixed`, moved up by the scroll) while something is open, and
 * the scroll is put back when the last one closes. Locks are counted: a confirmation opened over
 * a sheet does not free the page when it closes.
 */

let locks = 0
let place = 0

/** How many sheets or windows hold the page now. */
export const pageScrollLocks = () => locks

/** @param {Window} [win] */
export function lockPageScroll(win = window) {
    locks += 1
    if (locks > 1) return
    const body = win.document.body
    place = win.scrollY || 0
    body.style.position = 'fixed'
    body.style.top = `-${place}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.dataset.scrollLocked = 'true'
}

/** @param {Window} [win] */
export function unlockPageScroll(win = window) {
    if (locks === 0) return
    locks -= 1
    if (locks > 0) return
    const body = win.document.body
    for (const property of ['position', 'top', 'left', 'right', 'width']) body.style[property] = ''
    delete body.dataset.scrollLocked
    win.scrollTo(0, place)
}

/**
 * Frees the page whatever the count says (F76, recheck N22). Only for a hold left behind with
 * nothing open on the page (see components/ui/windowsHoldThePage.js `giveBackAStrayHold`): a sheet
 * taken off the page without its close, or this module loaded again while the page was held (the
 * count starts at 0, the body stays pinned). The place comes from the body itself when it can.
 * @param {Window} [win]
 */
export function releasePageScroll(win = window) {
    locks = 0
    const body = win.document.body
    if (body.dataset.scrollLocked !== 'true') return
    const at = Math.abs(parseFloat(body.style.top)) || place
    for (const property of ['position', 'top', 'left', 'right', 'width']) body.style[property] = ''
    delete body.dataset.scrollLocked
    win.scrollTo(0, at)
}
