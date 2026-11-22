/**
 * The addresses F85 names: «Create» (the address stays /start) is where a series is built (it was «Home», then «Start»); /home is the entry
 * page, the site's home, for everyone (MJRP, 2026-11-21). Written in the code, nothing here comes
 * from outside.
 */

/** The screen where a series is built. */
export const START_PATH = '/start'

/** The entry page, the site's home: a static page outside the app (the logo leads to it by a full page load). */
export const HOME_PATH = '/home'

/** sessionStorage key holding when the app last left to /home (the loop guard). */
export const LEFT_KEY = 'mjrp:left-to-home'

/** A second ask for /home inside this window means the server answers /home with the app: stay. */
export const LEFT_WINDOW_MS = 10000

// Used when sessionStorage is not there: one window, one try
const leftWindows = new WeakSet()

/** The session's storage, or null when the browser refuses it. */
function sessionStore(win) {
    try { return win.sessionStorage || null } catch { return null }
}

/** When the app last left to /home, in ms; NaN when it never did or the storage cannot say. */
function lastLeft(store) {
    try { return Number(store && store.getItem(LEFT_KEY)) } catch { return NaN }
}

/** Whether the app left to /home a moment ago: by the stored time, or, without storage, by this window. */
function leftJustNow(win, store, now) {
    if (!store) return leftWindows.has(win)
    const last = lastLeft(store)
    return Number.isFinite(last) && last > 0 && now - last < LEFT_WINDOW_MS
}

/** Keeps that the app is leaving now. */
function rememberLeaving(win, store, now) {
    leftWindows.add(win)
    try { if (store) store.setItem(LEFT_KEY, String(now)) } catch { /* the page-level guard holds */ }
}

/**
 * The app was asked for /home, which is not a screen of the app: leave it to the browser, a full
 * load of /home, where the server answers with the entry page. The address is the one written
 * here, never one read from outside (the query of the old address is dropped: the entry page has
 * its own «Sign in»). If a server answers /home with the app (an old dev setup), the app is asked
 * again at once: that second ask inside the window stays (returns false, the caller goes to
 * /start) instead of looping.
 * @param {Window} win
 * @param {{ now?: number }} [options]
 * @returns {boolean} true: the browser is leaving; false: stay in the app
 */
export function leaveToHome(win, { now = Date.now() } = {}) {
    const store = sessionStore(win)
    if (leftJustNow(win, store, now)) return false
    rememberLeaving(win, store, now)
    win.location.replace(HOME_PATH)
    return true
}
