/**
 * staleBuild - what to do when the tab runs a version of the app that is no longer published.
 *
 * Every publication replaces the files of the screens that are loaded on demand (their names carry
 * a hash). A tab opened before the publication still runs the old script, asks for an old file and
 * gets the page itself back: the import fails. The remedy is to load the app again, once.
 *
 * Pure but for what it is handed: no screen, no store.
 */

/** How long after a reload another one is refused: a file that is really missing must not loop. */
export const RELOAD_GUARD_MS = 60000

const GUARD_KEY = 'mjrp_reloaded_for_new_build_at'

/** How each browser words "the file of a module loaded on demand could not be fetched". */
const MISSING_FILE = [
    /failed to fetch dynamically imported module/i, // Chromium
    /error loading dynamically imported module/i, // Firefox
    /importing a module script failed/i // Safari
]

/**
 * Is this the failure of a screen file that is gone?
 * @param {*} error
 * @returns {boolean}
 */
export function isMissingBuildFile(error) {
    const message = String(error?.message || '')
    return MISSING_FILE.some(pattern => pattern.test(message))
}

/**
 * Load the app again to get the published version, unless that was just tried.
 * @param {Object} [options]
 * @param {{ getItem: Function, setItem: Function }} [options.storage] - lasts as long as the tab
 * @param {Function} [options.reload]
 * @param {Function} [options.now] - () => ms
 * @returns {boolean} true when the page is being loaded again
 */
export function reloadOnceForNewBuild({
    storage = window.sessionStorage,
    reload = () => window.location.reload(),
    now = () => Date.now()
} = {}) {
    try {
        const last = Number(storage.getItem(GUARD_KEY)) || 0
        if (last && now() - last < RELOAD_GUARD_MS) return false
        storage.setItem(GUARD_KEY, String(now()))
    } catch {
        return false // with no way to remember the attempt, a reload could repeat for ever
    }
    reload()
    return true
}

/**
 * Watch the whole app for a file of an older publication (F73, UAT-213).
 *
 * The screens are not the only files loaded on demand: a button may ask for its window at the
 * click. In a tab opened before a publication that request fails, and with nobody listening the
 * button does nothing. Vite says so with `vite:preloadError`; a failure it does not announce
 * arrives as a promise nobody caught. Either way the app is loaded again, once.
 *
 * @param {EventTarget} [target] - the window
 * @param {Object} [options] - handed to reloadOnceForNewBuild (storage, reload, now)
 * @returns {Function} stops watching
 */
export function installStaleBuildGuard(target = window, options = {}) {
    const onPreloadError = (event) => {
        if (reloadOnceForNewBuild(options)) event.preventDefault()
    }
    const onUnhandled = (event) => {
        if (isMissingBuildFile(event.reason) && reloadOnceForNewBuild(options)) event.preventDefault()
    }
    target.addEventListener('vite:preloadError', onPreloadError)
    target.addEventListener('unhandledrejection', onUnhandled)
    return () => {
        target.removeEventListener('vite:preloadError', onPreloadError)
        target.removeEventListener('unhandledrejection', onUnhandled)
    }
}
