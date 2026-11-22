/**
 * windowLayer - the windows a screen opens from code that is not a component (F83 wave 6b): the album window, the window to edit an item of the
 * inventory and the window to add an album to it. The hand-made ones put themselves at the end of `body`; these do the same (each draws through
 * a portal into `body`, so the box React keeps for it is never in the page), and are told to close when the screen is left (`closeAllWindows`):
 * the hand-made album window stayed over the next screen, a window that outlives its screen is not kept (on purpose, as wave 5b did for its own).
 */
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type { ReactNode } from 'react'

export interface WindowHandle {
    /** Takes the window off the page at once. */
    close: () => void
}

const open = new Set<WindowHandle>()

/**
 * Puts a window on the page. `render` is given the function that closes it. A window of a screen goes when the screen is left; the question
 * windows (ui/dialogs) stay, as the hand-made ones did: whoever asked is still waiting for the answer (`staysWhenTheScreenIsLeft`).
 */
export function showWindow(render: (close: () => void) => ReactNode, { staysWhenTheScreenIsLeft = false }: { staysWhenTheScreenIsLeft?: boolean } = {}): WindowHandle {
    const root = createRoot(document.createElement('div'))
    let closed = false
    const handle: WindowHandle = {
        close: () => {
            if (closed) return
            closed = true
            open.delete(handle)
            // after the update that asked for it is done: a window may be closed by one of its own buttons
            queueMicrotask(() => root.unmount())
        }
    }
    if (!staysWhenTheScreenIsLeft) open.add(handle)
    flushSync(() => root.render(render(handle.close)))
    return handle
}

/** The screen was left: every window it opened goes. */
export function closeAllWindows(): void {
    for (const handle of [...open]) handle.close()
}
