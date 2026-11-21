/**
 * staleBuild - what to do when the tab runs a version of the app that is no longer published.
 *
 * Every publication replaces the files of the screens that are loaded on demand (their names carry
 * a hash). A tab opened before the publication still runs the old script, asks for an old file and
 * gets the page itself back: the import fails. The remedy is to load the app again, once.
 *
 * «No network» is not «new version» (F83, REQ-10, risk R19): a file that cannot be had may also be a network that does not
 * answer, and reloading the app then would throw away what is in memory and fail the same way. So a failed file is told
 * apart in three: it arrived; it is gone because the site was published again (the live /app.html names another main
 * script than the one this tab runs); or the network did not answer (at all, or in 10 s). Only the second reloads.
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

/** How long a screen file may take before the person is told «no network» (proposal § 7). */
export const LOAD_DEADLINE_MS = 10000

/** What asking the live site says about this tab. */
export const PUBLICATION = Object.freeze({
    NEWER: 'newer', // the site was published again: the files of this tab are gone
    SAME: 'same', // the live site is the one this tab runs (or there is nothing to compare): the file is missing for another reason
    UNREACHABLE: 'unreachable' // the network did not answer
})

/**
 * The main script a page names (what deploy-site.sh calls main_script_of).
 * @param {string} html
 * @returns {string|null} "/assets/main-XXXX.js"
 */
export function mainScriptOf(html) {
    const found = String(html || '').match(/<script[^>]*src="(\/assets\/[^"]+\.js)"/)
    return found ? found[1] : null
}

/** The main script this tab runs, read from its own page; null where the page has none under /assets/ (the dev server). */
export function runningScript(doc = document) {
    const script = doc.querySelector('script[type="module"][src^="/assets/"]')
    return script ? script.getAttribute('src') : null
}

/**
 * Has the site been published again since this tab loaded? Asks for /app.html without cache and compares the main script.
 * @param {Object} [options]
 * @param {Function} [options.fetchApp] - (url, init) => Promise<{ ok, text() }>
 * @param {string|null} [options.running] - the main script of this tab
 * @param {number} [options.timeoutMs]
 * @returns {Promise<'newer'|'same'|'unreachable'>}
 */
export async function publicationState({
    fetchApp = (url, init) => window.fetch(url, init),
    running = runningScript(),
    timeoutMs = LOAD_DEADLINE_MS
} = {}) {
    let timer
    try {
        const answer = await Promise.race([
            fetchApp('/app.html', { cache: 'no-store' }),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('no answer')), timeoutMs) })
        ])
        if (!running || !answer.ok) return PUBLICATION.SAME
        const live = mainScriptOf(await answer.text())
        return live && live !== running ? PUBLICATION.NEWER : PUBLICATION.SAME
    } catch {
        return PUBLICATION.UNREACHABLE
    } finally {
        clearTimeout(timer)
    }
}

/** A screen file that did not come in time. Not a failure of the screen, and not a new version: the network. */
export class ScreenLoadTimeout extends Error {
    constructor(ms) {
        super(`The screen did not download in ${ms} ms`)
        this.name = 'ScreenLoadTimeout'
        this.code = 'screen-load-timeout'
    }
}

/** The network did not answer before a screen file was asked for: nothing was imported (loadScreen). The same state as a timeout. */
export class ScreenOffline extends ScreenLoadTimeout {
    constructor() {
        super(0)
        this.name = 'ScreenOffline'
        this.message = 'The network did not answer: the screen was not asked for'
    }
}

/** @returns {boolean} true when the failure is a screen file that did not come in time */
export const isLoadTimeout = (error) => error?.code === 'screen-load-timeout'

/**
 * The file of a screen, with a deadline. What fails for another reason goes through as it is.
 * @param {Promise} loading - the import() of the screen
 * @param {number} [ms]
 */
export function loadWithDeadline(loading, ms = LOAD_DEADLINE_MS) {
    let timer
    const late = new Promise((_, reject) => { timer = setTimeout(() => reject(new ScreenLoadTimeout(ms)), ms) })
    return Promise.race([loading, late]).finally(() => clearTimeout(timer))
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
 * Load the app again, once, when a missing file is because the site was published again; leave it when the network is out.
 * @param {Object} [options] - handed to reloadOnceForNewBuild, plus `publicationState` (a replacement for the question)
 * @returns {Promise<boolean>} true when the page is being loaded again
 */
async function reloadIfPublishedAgain({ publicationState: ask = publicationState, ...options } = {}) {
    if (await ask() === PUBLICATION.UNREACHABLE) return false
    return reloadOnceForNewBuild(options)
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
    // The reload waits for the answer about the publication: a network that does not answer must not reload the app (F83)
    const onPreloadError = () => { reloadIfPublishedAgain(options) }
    const onUnhandled = (event) => {
        if (isMissingBuildFile(event.reason)) reloadIfPublishedAgain(options)
    }
    target.addEventListener('vite:preloadError', onPreloadError)
    target.addEventListener('unhandledrejection', onUnhandled)
    return () => {
        target.removeEventListener('vite:preloadError', onPreloadError)
        target.removeEventListener('unhandledrejection', onUnhandled)
    }
}
