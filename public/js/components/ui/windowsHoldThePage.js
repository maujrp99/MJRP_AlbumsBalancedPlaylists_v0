/**
 * windowsHoldThePage - on the phone, the page behind a window of the app does not scroll (F76, REQ-04).
 *
 * The windows that existed before the Sheet (the album window, the ranking window, the edit and
 * confirmation windows, sign in, the Spotify export) are put on the page by many callers and none
 * of them held the page. Instead of changing each one, this watches the page: while one of them is
 * on it, the page is held; when the last one leaves, the page is given back where it was.
 * The Sheet holds the page by itself and is not watched here.
 */
import { lockPageScroll, pageScrollLocks, releasePageScroll, unlockPageScroll } from '../../utils/pageScrollLock.js'

/** The windows of the app, as their outer element is written. All are put directly in the body. */
export const APP_WINDOWS = '.modal-overlay:not(.hidden), .app-modal, .rank-window, #spotify-export-modal'

/** A sheet that is open (one closing has already given the page back). */
const OPEN_SHEET = '.sheet:not(.sheet--closing)'

/** Whether anything on the page holds it: a window of the app, or a sheet that is open. */
export function somethingHoldsThePage(win = window) {
    return [...win.document.body.children].some(child => child.matches(APP_WINDOWS) || child.matches(OPEN_SHEET))
}

/**
 * The page held with nothing open on it is given back (F76, recheck N22: the page once stayed
 * frozen, the body pinned and no sheet in sight). Run when the body's children change and when
 * the screen changes.
 * @param {Window} [win]
 */
export function giveBackAStrayHold(win = window) {
    const pinned = win.document.body.dataset.scrollLocked === 'true'
    if ((pinned || pageScrollLocks() > 0) && !somethingHoldsThePage(win)) releasePageScroll(win)
}

/**
 * @param {Window} [win]
 * @returns {Function} stops watching, and gives the page back if it was held
 */
export function holdPageBehindWindows(win = window) {
    const body = win.document.body
    let held = false
    const check = () => {
        const open = [...body.children].some(child => child.matches(APP_WINDOWS))
        if (open !== held) {
            held = open
            if (open) lockPageScroll(win)
            else unlockPageScroll(win)
        }
        if (!open) giveBackAStrayHold(win)
    }
    const observer = new win.MutationObserver(check)
    observer.observe(body, { childList: true })
    check()
    return () => {
        observer.disconnect()
        if (held) unlockPageScroll(win)
        held = false
    }
}
