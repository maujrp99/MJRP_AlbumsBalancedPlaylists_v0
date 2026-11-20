/**
 * usageWiring - where the measurement of use is put together when the app starts (F77; like the
 * other *Wiring.js files, the one place that knows the real pieces). app.js calls
 * `startUsageMeasurement()` once, before the first screen.
 *
 * It decides the switch (usageSwitch.js), picks the adapter and hands it to the port (track.js):
 *   off    nothing: no adapter, no hook, the measurement library is never downloaded
 *   debug  the events go to window.__usageEvents (memoryAdapter.js) and nowhere else
 *   on     the PostHog adapter, loaded lazily: its file and the library are a chunk of their own,
 *          asked for only here, only now
 *
 * Two things are measured here because they have one place each in the whole app:
 *   - the screen: after the router shows a route, `screen_viewed` with the NAME of the screen
 *     (SCREEN_OF_ROUTE), never the address, which holds the ids of a series;
 *   - the buy links: one listener on the page for the links marked by models/buyLinks.js
 *     (`data-buy-store`, `data-buy-place`). It only reads: the navigation is never held.
 */
import { screen, startUsage, track, usageState } from './track.js'
import { UsageMode, readUsageFlag, usageMode } from './usageSwitch.js'
import { createMemoryAdapter } from './memoryAdapter.js'

/** The routes of app.js and the screen each one is. A route not here (a redirect) is no screen. */
const SCREEN_OF_ROUTE = Object.freeze({
    '/home': 'home',
    '/albums': 'albums',
    '/albums/:seriesId': 'series',
    '/playlists': 'playlists',
    '/playlists/edit': 'playlists_edit',
    '/saved-playlists': 'saved_playlists',
    '/playlist-series': 'saved_playlists',
    '/inventory': 'inventory',
    '/blend': 'blend',
    '/artists': 'coming_soon',
    '/genres': 'coming_soon',
    '/tracks': 'coming_soon'
})

/**
 * @param {string} route - the pattern the router matched ('/albums/:seriesId'), not the address
 * @returns {string|null}
 */
export const screenOfRoute = (route) => (Object.hasOwn(SCREEN_OF_ROUTE, route ?? '') ? SCREEN_OF_ROUTE[route] : null)

/**
 * The store and the place of a buy link that was clicked, or null when the click was elsewhere.
 * @param {EventTarget|null} target
 * @returns {{ store: string, place: string }|null}
 */
export function buyLinkClickOf(target) {
    const link = typeof target?.closest === 'function' ? target.closest('a[data-buy-store]') : null
    return link ? { store: link.dataset.buyStore, place: link.dataset.buyPlace } : null
}

let stopWatchingLinks = () => { }

function watchBuyLinks(doc) {
    stopWatchingLinks()
    const measure = (event) => {
        const click = buyLinkClickOf(event.target)
        if (click) track('buy_link_opened', click)
    }
    // Capture: measured before any handler of the page runs. Nothing is prevented or awaited.
    doc.addEventListener('click', measure, true)
    doc.addEventListener('auxclick', measure, true)
    stopWatchingLinks = () => {
        doc.removeEventListener('click', measure, true)
        doc.removeEventListener('auxclick', measure, true)
    }
}

function watchScreens(router) {
    router.afterNavigate((path, params, route) => {
        const name = screenOfRoute(route)
        if (name) screen(name)
    })
}

const loadPosthogAdapter = () => import('./posthogAdapter.js')

function adapterLoaderFor(mode, { env, win, loadPosthog }) {
    if (mode === UsageMode.DEBUG) return async () => createMemoryAdapter(win)
    return async () => {
        const { createPosthogAdapter } = await loadPosthog()
        return createPosthogAdapter({ key: env.VITE_POSTHOG_KEY, host: env.VITE_POSTHOG_HOST })
    }
}

/**
 * Turn the measurement on or leave it off, as the build and this browser say.
 * @param {Object} [given] - what the app has; tests give their own
 * @returns {Promise<'off'|'on'|'debug'>} the mode, once the adapter is in use (or failed: then off)
 */
export async function startUsageMeasurement({
    env = import.meta.env, storage = globalThis.localStorage, win = globalThis.window, doc = globalThis.document,
    router, loadPosthog = loadPosthogAdapter
} = {}) {
    const mode = usageMode({ key: env.VITE_POSTHOG_KEY, buildSwitch: env.VITE_USAGE_MEASUREMENT, flag: readUsageFlag(storage) })
    if (mode === UsageMode.OFF) return mode

    watchScreens(router)
    watchBuyLinks(doc)
    await startUsage({ loadAdapter: adapterLoaderFor(mode, { env, win, loadPosthog }) })
    return usageState() === UsageMode.OFF ? UsageMode.OFF : mode
}
