/**
 * F80 (REQ-02), changed by F85 (MJRP, 2026-11-21): the root no longer decides. The entry page is
 * shown to everyone, with or without an account; nothing redirects and nothing is hidden. What is
 * left is the pure reading of «is there an account in this browser» (IndexedDB, or localStorage),
 * without creating the database when it is not there; anything unclear answers no.
 */
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
    FIREBASE_DB, FIREBASE_STORE, USER_KEY_PREFIX, isAccount, accountInStorage, accountInIndexedDb, hasAccount
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
function fakeWindow({ pathname = '/', search = '', storage = storageWith({}), indexedDB = fakeIndexedDb() } = {}) {
    document.documentElement.className = ''
    return {
        document,
        location: { pathname, search, replace: vi.fn() },
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

describe('the root no longer decides (MJRP, 2026-11-21: «conta aberta sempre home»)', () => {
    it('hasAccount: an account in localStorage is found at once, with no wait', async () => {
        const win = fakeWindow({ storage: storageWith({ [KEY]: JSON.stringify(account) }) })
        await expect(hasAccount(win)).resolves.toBe(true)
    })

    it('hasAccount: an account in IndexedDB is found; a guest or an empty browser is not', async () => {
        await expect(hasAccount(fakeWindow({ indexedDB: fakeIndexedDb({ stores: { [FIREBASE_STORE]: [record(account)] } }) }))).resolves.toBe(true)
        await expect(hasAccount(fakeWindow({ indexedDB: fakeIndexedDb({ stores: { [FIREBASE_STORE]: [record(guest)] } }) }))).resolves.toBe(false)
        await expect(hasAccount(fakeWindow())).resolves.toBe(false)
    })

    it('hasAccount: no IndexedDB, one that throws, or one that stays silent answers false (fails open)', async () => {
        await expect(hasAccount(fakeWindow({ indexedDB: undefined }))).resolves.toBe(false)
        await expect(hasAccount(fakeWindow({ indexedDB: { open: () => { throw new Error('blocked') } } }))).resolves.toBe(false)
        await expect(hasAccount(fakeWindow({ indexedDB: { open: () => ({}) } }), { holdMs: 20 })).resolves.toBe(false)
    })

    it('reading it never hides the page nor moves the address', async () => {
        const win = fakeWindow({ storage: storageWith({ [KEY]: JSON.stringify(account) }), indexedDB: fakeIndexedDb({ stores: { [FIREBASE_STORE]: [record(account)] } }) })
        await hasAccount(win)
        expect(win.location.replace).not.toHaveBeenCalled()
        expect(document.documentElement.classList.contains('gate')).toBe(false)
    })

    it('the module redirects nowhere and hides nothing', () => {
        const source = readFileSync(resolve(process.cwd(), 'public/splash/gate.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
        expect(source).not.toMatch(/location\.replace|runGate|classList/)
    })
})
