/**
 * windowsHoldThePage - on the phone, the page behind a window of the app does not scroll (F76, REQ-04).
 *
 * The windows that existed before the Sheet (the album window, the ranking window, the edit and
 * confirmation windows, sign in, the Spotify export) are put on the page by many callers and none
 * of them held the page. Instead of changing each one, this watches the page: while one of them is
 * on it, the page is held; when the last one leaves, the page is given back where it was.
 * The Sheet holds the page by itself and is not watched here.
 */
import { lockPageScroll, unlockPageScroll } from '../../utils/pageScrollLock.js'

/** The windows of the app, as their outer element is written. All are put directly in the body. */
export const APP_WINDOWS = '.modal-overlay:not(.hidden), .app-modal, .rank-window, #spotify-export-modal'

/**
 * @param {Window} [win]
 * @returns {Function} stops watching, and gives the page back if it was held
 */
export function holdPageBehindWindows(win = window) {
    const body = win.document.body
    let held = false
    const check = () => {
        const open = [...body.children].some(child => child.matches(APP_WINDOWS))
        if (open === held) return
        held = open
        if (open) lockPageScroll(win)
        else unlockPageScroll(win)
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
