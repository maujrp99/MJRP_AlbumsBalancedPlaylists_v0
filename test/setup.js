import { beforeEach, vi } from 'vitest'
import { setIdSource } from '@shared/platform/newId.js'

// The id port of the core (F78, REQ-07): the tests wire it as the site does, with crypto.randomUUID
// (Node's, the same Web Crypto API the browser has). A test of the port itself takes it away and puts it back.
setIdSource(() => globalThis.crypto.randomUUID())

// Browser storage for the tests. Newer Node versions define their own `localStorage` global,
// which is undefined without a file to write to and hides the one jsdom would provide; so the
// tests get a small in-memory Storage, emptied before each test.
class MemoryStorage {
    constructor() { this._items = new Map() }
    get length() { return this._items.size }
    key(index) { return [...this._items.keys()][index] ?? null }
    getItem(key) { return this._items.has(String(key)) ? this._items.get(String(key)) : null }
    setItem(key, value) { this._items.set(String(key), String(value)) }
    removeItem(key) { this._items.delete(String(key)) }
    clear() { this._items.clear() }
}
const usable = (storage) => {
    try { return typeof storage?.getItem === 'function' } catch { return false }
}
for (const name of ['localStorage', 'sessionStorage']) {
    if (!usable(globalThis[name])) {
        // jsdom's own Storage when it is there (tests may spy on Storage.prototype), else the small one
        const fromJsdom = globalThis.jsdom?.window?.[name]
        const storage = usable(fromJsdom) ? fromJsdom : new MemoryStorage()
        Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true })
        if (typeof window !== 'undefined') {
            Object.defineProperty(window, name, { value: storage, configurable: true, writable: true })
        }
    }
}

// Mock Firebase globally
global.firebase = {
    initializeApp: vi.fn(),
    firestore: vi.fn(() => ({
        collection: vi.fn((name) => ({
            doc: vi.fn((id) => ({
                set: vi.fn(() => Promise.resolve()),
                get: vi.fn(() => Promise.resolve({
                    exists: true,
                    id,
                    data: () => ({})
                })),
                update: vi.fn(() => Promise.resolve())
            })),
            add: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
            where: vi.fn(() => ({
                get: vi.fn(() => Promise.resolve({
                    docs: []
                }))
            })),
            orderBy: vi.fn(() => ({
                limit: vi.fn(() => ({
                    get: vi.fn(() => Promise.resolve({ docs: [] }))
                }))
            })),
            get: vi.fn(() => Promise.resolve({ docs: [] }))
        }))
    })),
    FieldValue: {
        serverTimestamp: vi.fn(() => new Date())
    }
}

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks()
    globalThis.localStorage?.clear?.()
    globalThis.sessionStorage?.clear?.()
})
