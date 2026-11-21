/**
 * The root decides before it paints (F80, REQ-02).
 *
 * The site's root is the entry page for whoever has not signed in with an account; a person who
 * did goes straight to the app (/home) and never sees a piece of the page. The page is static HTML,
 * so it cannot ask the app who is there: it reads where Firebase Auth keeps the sign-in in this
 * browser — IndexedDB `firebaseLocalStorageDb` / `firebaseLocalStorage` (one record per Firebase
 * app, `{ fbase_key, value: <the user> }`), or, in a browser without IndexedDB, the localStorage key
 * `firebase:authUser:<api key>:[DEFAULT]`. A user with `isAnonymous: false` is an account (Google,
 * Apple); the guest session the app creates for every visitor is not.
 *
 * Rules:
 *   - `?entry` in the address shows the page to anyone (the owner is signed in and must see it);
 *   - the database is never created when it is not there (Firebase would then find an empty one);
 *   - while IndexedDB is read the page is hidden (`html.gate`, the dark background stays);
 *   - anything unclear — no answer in 600 ms, an error, no IndexedDB — shows the page;
 *   - `location.replace` takes the root out of the history: the app's «back» never lands on it.
 *
 * The Vite plugin `entryPage` (vite.config.js) writes this file into the <head> of the page as a
 * classic inline script — the `export` words dropped, `runGate(window)` called — before any CSS,
 * so it runs before the first paint. Nothing here may import anything.
 */

export const FIREBASE_DB = 'firebaseLocalStorageDb'
export const FIREBASE_STORE = 'firebaseLocalStorage'
export const USER_KEY_PREFIX = 'firebase:authUser:'
export const APP_PATH = '/home'
export const HOLD_MS = 600

/** A stored Firebase user (object or JSON text) that is an account of its own, not a guest session. */
export function isAccount(user) {
    let value = user
    if (typeof value === 'string') {
        try { value = JSON.parse(value) } catch { return false }
    }
    return Boolean(value && typeof value === 'object' && value.uid && value.isAnonymous === false)
}

/** An account in localStorage (Firebase's fallback persistence). Never throws. */
export function accountInStorage(storage) {
    try {
        if (!storage) return false
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i)
            if (key && key.indexOf(USER_KEY_PREFIX) === 0 && isAccount(storage.getItem(key))) return true
        }
    } catch {
        return false
    }
    return false
}

/** An account in Firebase's IndexedDB. Resolves false on any doubt; never creates the database. */
export function accountInIndexedDb(idb) {
    return new Promise(function (resolve) {
        const no = function () { resolve(false) }
        const open = function () {
            let req
            try { req = idb.open(FIREBASE_DB) } catch { return no() }
            // the database does not exist: abort its creation, so Firebase never finds an empty one
            req.onupgradeneeded = function () { try { req.transaction.abort() } catch { /* the open fails: no */ } }
            req.onerror = no
            req.onblocked = no
            req.onsuccess = function () {
                const db = req.result
                try {
                    if (!db.objectStoreNames.contains(FIREBASE_STORE)) { db.close(); return no() }
                    const get = db.transaction(FIREBASE_STORE, 'readonly').objectStore(FIREBASE_STORE).getAll()
                    get.onsuccess = function () {
                        db.close()
                        resolve((get.result || []).some(function (row) { return isAccount(row && row.value) }))
                    }
                    get.onerror = function () { db.close(); no() }
                } catch {
                    try { db.close() } catch { /* already closed */ }
                    no()
                }
            }
        }
        try {
            if (typeof idb.databases === 'function') {
                idb.databases().then(function (list) {
                    if ((list || []).some(function (d) { return d && d.name === FIREBASE_DB })) open()
                    else no()
                }, open)
            } else {
                open()
            }
        } catch {
            no()
        }
    })
}

/**
 * Decide: 'app' (the person is sent to the app) or 'page' (the page is shown).
 * @param {Window} win
 * @param {{ appPath?: string, holdMs?: number }} [options]
 * @returns {Promise<'app'|'page'>}
 */
export function runGate(win, options) {
    const appPath = (options && options.appPath) || APP_PATH
    const holdMs = (options && options.holdMs) || HOLD_MS
    const html = win.document.documentElement
    try {
        if (/[?&]entry(=|&|$)/.test(win.location.search || '')) return Promise.resolve('page')
    } catch { /* no address: decide as usual */ }

    let storage
    try { storage = win.localStorage } catch { storage = null }
    if (accountInStorage(storage)) {
        win.location.replace(appPath)
        return Promise.resolve('app')
    }

    let idb
    try { idb = win.indexedDB } catch { idb = null }
    if (!idb) return Promise.resolve('page')

    html.classList.add('gate')
    return new Promise(function (resolve) {
        let settled = false
        const settle = function (where) { if (!settled) { settled = true; resolve(where) } }
        const show = function () { if (settled) return; html.classList.remove('gate'); settle('page') }
        win.setTimeout(show, holdMs)
        accountInIndexedDb(idb).then(function (found) {
            if (found) {
                // even when the wait ran out and the page is up: a signed-in person belongs in the app
                win.location.replace(appPath)
                settle('app')
            } else {
                show()
            }
        })
    })
}
