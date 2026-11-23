/**
 * prefetchScreens - the screens of the menu come down in the background after the first screen is on the page (F83,
 * proposal § 5.1, REQ-10).
 *
 * Every screen change is a fetch of a file once the screens load on demand. Fetching the screens of the menu right after
 * the first one means that changing screens still works without a network after the initial load, as it did when everything
 * was in the main script. It never holds the first screen, never throws, and a file that does not come is simply tried
 * again when the person asks for that screen. (They count in the weight budget as downloaded «after» the first screen.)
 *
 * The importers are written where the routes are (app.js): a screen is loaded late only there (lazyOnlyAtTheRoute).
 */

/** Wait for the browser to be idle, else a little. */
const whenIdle = (work) => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') window.requestIdleCallback(work, { timeout: 4000 })
    else setTimeout(work, 1500)
}

/**
 * @param {{ afterNavigate: (hook: Function) => Function }} router
 * @param {Array<() => Promise<unknown>>} importers - one `() => import('…')` per screen of the menu
 * @param {Object} [options]
 * @param {(work: Function) => void} [options.schedule] - when to start (a test hands its own)
 * @returns {Function} stops waiting for the first screen
 */
export function prefetchScreensAfterTheFirstScreen(router, importers, { schedule = whenIdle } = {}) {
    let stopWaiting = () => {}
    stopWaiting = router.afterNavigate(() => {
        stopWaiting()
        schedule(() => importers.reduce(
            (chain, load) => chain.then(load).catch(() => {}), // one at a time; a failure is the person's retry later
            Promise.resolve()
        ))
    })
    return () => stopWaiting()
}
