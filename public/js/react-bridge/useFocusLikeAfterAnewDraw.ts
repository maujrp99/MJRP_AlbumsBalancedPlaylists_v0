import { useEffect } from 'react'

export interface FocusAfterDrawOptions {
    /**
     * A control the hand-made screen did NOT draw anew on each notice (a bar that was kept and written in place) keeps the focus it holds:
     * say which. Anything else that holds the focus lets it go.
     */
    keep?: (held: HTMLElement) => boolean
}

/**
 * The focus after a draw, in one place (shared by the screens whose hand-made version drew anew on each notice: playlists, albums). The
 * hand-made screen drew everything anew on each notice, so a pressed button was gone: the focus went back to the page and the next Tab
 * began at the top of the screen. Here the buttons stay (and rows are keyed by place), so the focus would stay on a control that now
 * belongs to another track, and the sheet of a track hands it back to its opener. After every draw a control (not a field being typed in,
 * not what is in a sheet or a window, not what the screen says it kept) that holds the focus lets it go, and the next Tab starts at the
 * top of the screen again.
 */
export function useFocusLikeAfterAnewDraw({ keep }: FocusAfterDrawOptions = {}): void {
    useEffect(() => {
        const held = document.activeElement
        const app = document.getElementById('app')
        if (!(held instanceof HTMLElement) || !app || held === app || !app.contains(held)) return
        if (held.closest('input, textarea, select, [contenteditable], dialog, .sheet, .modal-overlay, .app-modal')) return
        if (keep?.(held)) return
        // the screen takes the focus for a moment and lets it go: that is where the next Tab starts (a plain blur leaves it at the control)
        app.setAttribute('tabindex', '-1')
        app.focus({ preventScroll: true })
        app.blur()
        app.removeAttribute('tabindex')
        document.getSelection()?.collapse(app, 0)
    })
}
