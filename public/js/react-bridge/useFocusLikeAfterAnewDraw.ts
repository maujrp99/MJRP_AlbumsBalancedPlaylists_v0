import { useEffect } from 'react'

export interface FocusAfterDrawOptions {
    /**
     * A control the hand-made screen did NOT draw anew on each notice (a bar that was kept and written in place) keeps the focus it holds:
     * say which. Anything else that holds the focus lets it go.
     */
    keep?: (held: HTMLElement) => boolean
    /**
     * A field or a list that the hand-made screen DID draw anew (so the focus on it was lost) but that this screen keeps as the same element:
     * say which, and the focus is let go of like any other control's (the check that leaves a field alone comes after this one).
     */
    letGo?: (held: HTMLElement) => boolean
    /**
     * By default every draw lets the focus go. A screen that the hand-made version drew anew only when its controller gave a notice says
     * which: the focus is let go only when this value changes (a sheet that closes and hands the focus back to its opener is not a notice).
     */
    after?: unknown
}

/**
 * The focus after a draw, in one place (shared by the screens whose hand-made version drew anew on each notice: playlists, albums). The
 * hand-made screen drew everything anew on each notice, so a pressed button was gone: the focus went back to the page and the next Tab
 * began at the top of the screen. Here the buttons stay (and rows are keyed by place), so the focus would stay on a control that now
 * belongs to another track, and the sheet of a track hands it back to its opener. After every draw a control (not a field being typed in,
 * not what is in a sheet or a window, not what the screen says it kept) that holds the focus lets it go, and the next Tab starts at the
 * top of the screen again.
 */
/** Does the draw leave the focus where it is? (a window or a sheet, a field being typed in, what the screen says it kept) */
function holdsTheFocus(held: Element | null, app: HTMLElement | null, { keep, letGo }: FocusAfterDrawOptions): boolean {
    if (!(held instanceof HTMLElement) || !app || held === app || !app.contains(held)) return true
    if (held.closest('dialog, .sheet, .modal-overlay, .app-modal')) return true
    if (keep?.(held)) return true
    return !letGo?.(held) && held.closest('input, textarea, select, [contenteditable]') !== null
}

export function useFocusLikeAfterAnewDraw({ keep, letGo, after }: FocusAfterDrawOptions = {}): void {
    useEffect(() => {
        const held = document.activeElement
        const app = document.getElementById('app')
        if (holdsTheFocus(held, app, { keep, letGo }) || !app) return
        // the screen takes the focus for a moment and lets it go: that is where the next Tab starts (a plain blur leaves it at the control)
        app.setAttribute('tabindex', '-1')
        app.focus({ preventScroll: true })
        app.blur()
        app.removeAttribute('tabindex')
        document.getSelection()?.collapse(app, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the draw is the dependency, unless the screen names what counts as one
    }, after === undefined ? undefined : [after])
}
