/**
 * progress - the thin bar at the top of the page that says something is loading (F83 wave 8b; it was components/GlobalProgress.js, which built the
 * bar by hand). The router and the series service call `start()` and `finish()`; the shell draws the bar (shell/GlobalProgress.tsx).
 *
 * Several callers can start: the bar stays until all of them finish, and it leaves 200 ms after the last one (a loader that starts inside those 200 ms
 * keeps it). `forceHide()` hides it at once and drops the count of loaders.
 */

const HIDE_DELAY = 200

/** One bar with its count of loaders. The site has one (`globalProgress` below); a test makes its own. */
export function createProgress() {
    let state = { visible: false }
    let activeLoaders = 0
    const listeners = new Set()

    const show = (visible) => {
        if (state.visible === visible) return
        state = { visible }
        listeners.forEach((listener) => listener())
    }

    return {
        /** Starts a loading operation: the bar shows. */
        start() {
            activeLoaders++
            show(true)
        },
        /** Finishes one: when no one is left the bar hides, after a short delay for smoothness. */
        finish() {
            activeLoaders = Math.max(0, activeLoaders - 1)
            if (activeLoaders === 0) {
                setTimeout(() => {
                    if (activeLoaders === 0) show(false)
                }, HIDE_DELAY)
            }
        },
        /** Hides the bar now and drops the count of loaders. */
        forceHide() {
            activeLoaders = 0
            show(false)
        },
        /** Whether a loading operation is going on. */
        isActive: () => activeLoaders > 0,
        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        getState: () => state
    }
}

/** The bar of the site. */
export const globalProgress = createProgress()
