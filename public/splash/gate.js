/**
 * Is there an account in this browser? (F80 REQ-02, changed by F85)
 *
 * The root `/` no longer decides anything: the entry page is the site's home for everyone, with or
 * without an account (MJRP, 2026-11-21: «conta aberta sempre home qdo vc acessa o link principal do
 * site, aí vc teria o botao para start»). Nobody is redirected and nothing is hidden. What is left
 * is the pure reading of where Firebase Auth keeps the sign-in in this browser — IndexedDB
 * `firebaseLocalStorageDb` / `firebaseLocalStorage` (one record per Firebase app, `{ fbase_key,
 * value: <the user> }`), or the localStorage key `firebase:authUser:<api key>:[DEFAULT]`. A user
 * with `isAnonymous: false` is an account (Google, Apple); the guest session the app creates for
 * every visitor is not. The next design step uses it to swap the page's header.
 *
 * Rules: the database is never created when it is not there (Firebase would then find an empty
 * one); anything unclear — no answer in 600 ms, an error, no IndexedDB — answers no. Nothing here
 * may import anything, and nothing here touches the address or the page.
 */

export const FIREBASE_DB = 'firebaseLocalStorageDb'
export const FIREBASE_STORE = 'firebaseLocalStorage'
export const USER_KEY_PREFIX = 'firebase:authUser:'
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
 * Resolves true when this browser holds an account, false on any doubt. Never rejects, never
 * redirects, never touches the page.
 * @param {Window} win
 * @param {{ holdMs?: number }} [options]
 * @returns {Promise<boolean>}
 */
export function hasAccount(win, options) {
    const holdMs = (options && options.holdMs) || HOLD_MS
    let storage
    try { storage = win.localStorage } catch { storage = null }
    if (accountInStorage(storage)) return Promise.resolve(true)

    let idb
    try { idb = win.indexedDB } catch { idb = null }
    if (!idb) return Promise.resolve(false)

    return new Promise(function (resolve) {
        win.setTimeout(function () { resolve(false) }, holdMs)
        accountInIndexedDb(idb).then(resolve)
    })
}
