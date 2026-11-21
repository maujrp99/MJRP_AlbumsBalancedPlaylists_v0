/**
 * loadScreen - the import() of a screen: asks the network first, then imports, with a deadline (F83, REQ-10).
 *
 * A browser remembers, for the life of the page, that an import() failed: the file AND the files it imports statically (a
 * React screen imports React). Asking again, even for the same URL with a query, fails the same way when the network is
 * back, and the only way out is the repair of F64: load the whole app again, losing what is in memory. So the failure must
 * never be made. Before importing, `loadScreen` asks whether the network answers (a small request to the app's own page);
 * when it does not, nothing is imported, the router says «No connection», and «Try again» later imports the very file the
 * build made, with its one React, as if the first ask had never happened.
 *
 * What it does not cover: a network that answers the question and drops before the file comes. That failure is remembered by
 * the browser, and the repair of F64 (load the app again, once) is the way out. The file that arrives is kept: a later visit
 * does not ask again.
 *
 * The `import()` of the screen is still written where the route is (app.js, lazyOnlyAtTheRoute); this only receives it.
 */
import { loadWithDeadline, LOAD_DEADLINE_MS, ScreenOffline } from './staleBuild.js'

/** How long the question to the network may take before the answer is «no». */
export const NETWORK_QUESTION_MS = 5000

/**
 * Does the network answer? Any answer of the site counts, even an error page: a failure to answer is what says «no».
 * @param {Object} [options]
 * @param {Function} [options.fetchPage] - (url, init) => Promise
 * @param {number} [options.timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function networkAnswers({ fetchPage = (url, init) => window.fetch(url, init), timeoutMs = NETWORK_QUESTION_MS } = {}) {
    let timer
    try {
        await Promise.race([
            fetchPage('/app.html', { method: 'HEAD', cache: 'no-store' }),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('no answer')), timeoutMs) })
        ])
        return true
    } catch {
        return false
    } finally {
        clearTimeout(timer)
    }
}

/**
 * @param {() => Promise<*>} importer - the `() => import('./screens/x/index.ts')` the route wrote
 * @param {Object} [options]
 * @param {() => Promise<boolean>} [options.reachable] - whether the network answers (a test hands its own)
 * @param {number} [options.deadlineMs]
 * @returns {() => Promise<*>} the module of the screen
 */
export function loadScreen(importer, { reachable = networkAnswers, deadlineMs = LOAD_DEADLINE_MS } = {}) {
    let loaded = null
    return async function load() {
        if (loaded) return loaded
        if (!(await reachable())) throw new ScreenOffline()
        loaded = await loadWithDeadline(importer(), deadlineMs)
        return loaded
    }
}
