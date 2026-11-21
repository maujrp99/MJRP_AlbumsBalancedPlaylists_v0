/**
 * F80 (REQ-02) - the root decides before it paints: whoever signed in with an account goes to the
 * app, never seeing the entry page; a new visitor or a guest (anonymous session) sees the page.
 * The sign-in is read where Firebase Auth keeps it in the browser (IndexedDB, or localStorage),
 * without creating the database when it is not there; anything unclear shows the page.
 */
import { describe, it, expect, vi } from 'vitest'
import {
    FIREBASE_DB, FIREBASE_STORE, USER_KEY_PREFIX, isAccount, accountInStorage, accountInIndexedDb, runGate
} from '../../public/splash/gate.js'

const KEY = `${USER_KEY_PREFIX}AIzaFake:[DEFAULT]`
const account = { uid: 'u1', isAnonymous: false, providerData: [{ providerId: 'google.com' }] }
const guest = { uid: 'g1', isAnonymous: true, providerData: [] }

/** A Storage with the given entries. */
const storageWith = (entries) => {
    const keys = Object.keys(entries)
    return { length: keys.length, key: (i) => keys[i] ?? null, getItem: (k) => (k in entries ? entries[k] : null) }
}

/** A minimal IndexedDB: `stores` is null when the database does not exist. */
function fakeIndexedDb({ stores = null, listDatabases = true, created = [] } = {}) {
    const later = (fn) => setTimeout(fn, 0)
    const idb = {
        open(name) {
            const req = {}
            later(() => {
                if (!stores) {
                    // the database does not exist: an upgrade is asked; the gate must abort it
                    req.transaction = { abort: () => { req.aborted = true } }
                    req.onupgradeneeded?.({})
                    if (req.aborted) return req.onerror?.({})
                    created.push(name)
                }
                const records = stores?.[FIREBASE_STORE]
                req.result = {
                    objectStoreNames: { contains: (s) => Boolean(stores && s in stores) },
                    close: () => {},
                    transaction: () => ({
                        objectStore: () => ({
                            getAll: () => {
                                const get = {}
                                later(() => { get.result = records; get.onsuccess?.({}) })
                                return get
                            }
                        })
                    })
                }
                req.onsuccess?.({})
            })
            return req
        }
    }
    if (listDatabases) idb.databases = () => Promise.resolve(stores ? [{ name: FIREBASE_DB, version: 1 }] : [])
    return idb
}

const record = (value) => ({ fbase_key: KEY, value })

/** A window with what the gate reads. */
function fakeWindow({ search = '', storage = storageWith({}), indexedDB = fakeIndexedDb() } = {}) {
    document.documentElement.className = ''
    return {
        document,
        location: { search, replace: vi.fn() },
        localStorage: storage,
        indexedDB,
        setTimeout: (fn, ms) => setTimeout(fn, ms)
    }
}

describe('what counts as signed in', () => {
    it('an account of its own (Google, Apple) is; a guest session is not', () => {
        expect(isAccount(account)).toBe(true)
        expect(isAccount(JSON.stringify(account))).toBe(true)
        expect(isAccount(guest)).toBe(false)
        expect(isAccount({ uid: 'x' })).toBe(false)
        expect(isAccount('indexedDB')).toBe(false)
        expect(isAccount(null)).toBe(false)
    })

    it('localStorage: the Firebase user key, read safely', () => {
        expect(accountInStorage(storageWith({ [KEY]: JSON.stringify(account) }))).toBe(true)
        expect(accountInStorage(storageWith({ [KEY]: JSON.stringify(guest) }))).toBe(false)
        expect(accountInStorage(storageWith({ other: JSON.stringify(account) }))).toBe(false)
        expect(accountInStorage(storageWith({ [KEY]: '{not json' }))).toBe(false)
        expect(accountInStorage(undefined)).toBe(false)
    })

    it('IndexedDB: the Firebase store, with an account', async () => {
        await expect(accountInIndexedDb(fakeIndexedDb({ stores: { [FIREBASE_STORE]: [record(account)] } }))).resolves.toBe(true)
        await expect(accountInIndexedDb(fakeIndexedDb({ stores: { [FIREBASE_STORE]: [record(guest)] } }))).resolves.toBe(false)
        await expect(accountInIndexedDb(fakeIndexedDb({ stores: { [FIREBASE_STORE]: [] } }))).resolves.toBe(false)
        await expect(accountInIndexedDb(fakeIndexedDb({ stores: {} }))).resolves.toBe(false)
    })

    it('IndexedDB: a database that is not there is never created', async () => {
        const created = []
        await expect(accountInIndexedDb(fakeIndexedDb({ created }))).resolves.toBe(false)
        await expect(accountInIndexedDb(fakeIndexedDb({ created, listDatabases: false }))).resolves.toBe(false)
        expect(created).toEqual([])
    })
})

describe('the root decides', () => {
    it('a new visitor sees the page, and the page is shown again after the check', async () => {
        const win = fakeWindow()
        const where = runGate(win)
        expect(document.documentElement.classList.contains('gate')).toBe(true) // hidden while the browser is read
        await expect(where).resolves.toBe('page')
        expect(document.documentElement.classList.contains('gate')).toBe(false)
        expect(win.location.replace).not.toHaveBeenCalled()
    })

    it('a guest sees the page', async () => {
        const win = fakeWindow({ indexedDB: fakeIndexedDb({ stores: { [FIREBASE_STORE]: [record(guest)] } }) })
        await expect(runGate(win)).resolves.toBe('page')
        expect(win.location.replace).not.toHaveBeenCalled()
    })

    it('an account in IndexedDB goes to the app without the page ever being shown', async () => {
        const win = fakeWindow({ indexedDB: fakeIndexedDb({ stores: { [FIREBASE_STORE]: [record(account)] } }) })
        await expect(runGate(win)).resolves.toBe('app')
        expect(win.location.replace).toHaveBeenCalledWith('/start')
        expect(document.documentElement.classList.contains('gate')).toBe(true)
    })

    it('an account in localStorage goes to the app at once', async () => {
        const win = fakeWindow({ storage: storageWith({ [KEY]: JSON.stringify(account) }) })
        await expect(runGate(win)).resolves.toBe('app')
        expect(win.location.replace).toHaveBeenCalledWith('/start')
        expect(document.documentElement.classList.contains('gate')).toBe(false)
    })

    it('?entry shows the page to anyone, signed in or not', async () => {
        const win = fakeWindow({ search: '?entry', storage: storageWith({ [KEY]: JSON.stringify(account) }) })
        await expect(runGate(win)).resolves.toBe('page')
        expect(win.location.replace).not.toHaveBeenCalled()
    })

    it('a browser with no IndexedDB, or one that throws, shows the page', async () => {
        const none = fakeWindow({ indexedDB: undefined })
        await expect(runGate(none)).resolves.toBe('page')
        const broken = fakeWindow({ indexedDB: { open: () => { throw new Error('blocked') } } })
        await expect(runGate(broken)).resolves.toBe('page')
        expect(document.documentElement.classList.contains('gate')).toBe(false)
    })

    it('when the browser does not answer in time, the page is shown (fails open)', async () => {
        const silent = { open: () => ({}) } // never calls back
        const win = fakeWindow({ indexedDB: silent })
        await expect(runGate(win, { holdMs: 20 })).resolves.toBe('page')
        expect(document.documentElement.classList.contains('gate')).toBe(false)
    })
})
