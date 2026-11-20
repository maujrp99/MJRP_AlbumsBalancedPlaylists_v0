/**
 * The in-memory store (F78): the store interface (./store.ts) over a Map of document paths, with the
 * behaviour of the modular Firestore API that the shared repositories rely on:
 *   - `collection(db, path)`, `doc(db, path, id)`, `doc(collectionRef)` (a new id, from the core's
 *     `newId()`: the platform wiring must have run, as in the app);
 *   - `getDoc` → `{ id, exists(), data() }`; `getDocs` → `{ docs, size, empty }` of the documents
 *     directly under the collection, after `where` (==, !=, <, <=, >, >=, in, array-contains),
 *     `orderBy` and `limit`;
 *   - `setDoc` (with `{ merge: true }` merging the top level), `updateDoc` (fails when the document
 *     does not exist, as Firestore's does), `deleteDoc`;
 *   - `writeBatch(db)` → `set`, `update`, `delete`, `commit`: checked first, then applied whole;
 *   - `serverTimestamp()` → resolved on write to a Timestamp-like `{ seconds, nanoseconds,
 *     toMillis(), toDate() }` from the clock given.
 *
 * Used by the tests and by the skeleton's demo mode. It is NOT Firestore: no rules, no offline
 * queue, no listeners, no transactions. What it proves is that the repositories of the core run in
 * the app with a store handed in from outside, and that the screens show what they read.
 */
import { newId } from '@album-blender/shared/platform/newId.js'
import type { AppStore } from './store'

type Data = Record<string, unknown>
type Ref = { kind: 'doc' | 'collection'; path: string; id: string }
type Constraint =
    | { kind: 'where'; field: string; op: string; value: unknown }
    | { kind: 'orderBy'; field: string; direction: 'asc' | 'desc' }
    | { kind: 'limit'; count: number }
type QueryRef = { kind: 'query'; collection: Ref; constraints: Constraint[] }

const SERVER_TIMESTAMP = Symbol('serverTimestamp')

export interface MemoryStoreOptions {
    /** milliseconds of the clock that stamps `serverTimestamp()`; Date.now by default */
    now?: () => number
    /** how long each read waits, to let a screen show its loading state (demo mode) */
    readDelayMs?: number
}

export interface MemoryStore extends AppStore {
    /** For tests and the demo seed: put a document as it would be stored, at its full path. */
    seed(path: string, data: Data): void
    /** For tests: the next read fails with this error (once). */
    failNextRead(error: Error): void
    /** For tests: what is stored at a path, or undefined. */
    peek(path: string): Data | undefined
}

export type Timestamp = { seconds: number; nanoseconds: number; toMillis(): number; toDate(): Date }

export function timestampOf(ms: number): Timestamp {
    return {
        seconds: Math.floor(ms / 1000),
        nanoseconds: (ms % 1000) * 1e6,
        toMillis: () => ms,
        toDate: () => new Date(ms)
    }
}

const joinPath = (...parts: string[]) => parts.join('/').split('/').filter(Boolean).join('/')
const lastSegment = (path: string) => path.split('/').pop() ?? ''
const parentOf = (path: string) => path.split('/').slice(0, -1).join('/')

function compare(a: unknown, b: unknown): number {
    const value = (x: unknown) => (x && typeof x === 'object' && 'toMillis' in x ? (x as Timestamp).toMillis() : x)
    const [left, right] = [value(a), value(b)] as [never, never]
    if (left === right) return 0
    if (left === undefined || left === null) return -1
    if (right === undefined || right === null) return 1
    return left < right ? -1 : 1
}

const MATCHES: Record<string, (field: unknown, value: unknown) => boolean> = {
    '==': (f, v) => compare(f, v) === 0,
    '!=': (f, v) => compare(f, v) !== 0,
    '<': (f, v) => compare(f, v) < 0,
    '<=': (f, v) => compare(f, v) <= 0,
    '>': (f, v) => compare(f, v) > 0,
    '>=': (f, v) => compare(f, v) >= 0,
    in: (f, v) => Array.isArray(v) && v.some(item => compare(f, item) === 0),
    'array-contains': (f, v) => Array.isArray(f) && f.some(item => compare(item, v) === 0)
}

export function createMemoryStore(options: MemoryStoreOptions = {}): MemoryStore {
    const now = options.now ?? (() => Date.now())
    const documents = new Map<string, Data>()
    let pendingReadError: Error | null = null
    const db = { name: 'memory' }

    const resolveWrite = (data: Data): Data => Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === SERVER_TIMESTAMP ? timestampOf(now()) : value])
    )

    const read = async <T>(work: () => T): Promise<T> => {
        if (options.readDelayMs) await new Promise(done => setTimeout(done, options.readDelayMs))
        if (pendingReadError) {
            const error = pendingReadError
            pendingReadError = null
            throw error
        }
        return work()
    }

    const snapshotOf = (path: string) => {
        const data = documents.get(path)
        return { id: lastSegment(path), ref: { kind: 'doc', path, id: lastSegment(path) }, exists: () => data !== undefined, data: () => (data ? { ...data } : undefined) }
    }

    const collection = (_db: unknown, path: string, ...segments: string[]): Ref => {
        const full = joinPath(path, ...segments)
        return { kind: 'collection', path: full, id: lastSegment(full) }
    }

    const doc = (base: unknown, path?: string, ...segments: string[]): Ref => {
        if (base && typeof base === 'object' && (base as Ref).kind === 'collection') {
            const id = path === undefined ? newId() : joinPath(path, ...segments)
            const full = joinPath((base as Ref).path, id)
            return { kind: 'doc', path: full, id: lastSegment(full) }
        }
        const full = joinPath(path ?? '', ...segments)
        return { kind: 'doc', path: full, id: lastSegment(full) }
    }

    const setNow = (ref: Ref, data: Data, opts?: { merge?: boolean }) => {
        const written = resolveWrite(data)
        documents.set(ref.path, opts?.merge ? { ...(documents.get(ref.path) ?? {}), ...written } : written)
    }
    const updateNow = (ref: Ref, data: Data) => {
        documents.set(ref.path, { ...(documents.get(ref.path) ?? {}), ...resolveWrite(data) })
    }
    const mustExist = (ref: Ref) => {
        if (!documents.has(ref.path)) throw new Error(`No document to update: ${ref.path}`)
    }

    const store: MemoryStore = {
        db,
        collection,
        doc,
        getDoc: (ref: Ref) => read(() => snapshotOf(ref.path)),
        getDocs: (source: Ref | QueryRef) => read(() => {
            const collectionRef = source.kind === 'query' ? source.collection : source
            const constraints = source.kind === 'query' ? source.constraints : []
            let paths = [...documents.keys()].filter(path => parentOf(path) === collectionRef.path)
            for (const c of constraints) {
                if (c.kind === 'where') paths = paths.filter(path => MATCHES[c.op]?.((documents.get(path) ?? {})[c.field], c.value) ?? false)
            }
            for (const c of constraints) {
                if (c.kind === 'orderBy') {
                    const sign = c.direction === 'desc' ? -1 : 1
                    paths = [...paths].sort((a, b) => sign * compare((documents.get(a) ?? {})[c.field], (documents.get(b) ?? {})[c.field]))
                }
            }
            for (const c of constraints) {
                if (c.kind === 'limit') paths = paths.slice(0, c.count)
            }
            const docs = paths.map(snapshotOf)
            return { docs, size: docs.length, empty: docs.length === 0 }
        }),
        setDoc: async (ref: Ref, data: Data, opts?: { merge?: boolean }) => { setNow(ref, data, opts) },
        updateDoc: async (ref: Ref, data: Data) => { mustExist(ref); updateNow(ref, data) },
        deleteDoc: async (ref: Ref) => { documents.delete(ref.path) },
        query: (collectionRef: Ref, ...constraints: Constraint[]): QueryRef => ({ kind: 'query', collection: collectionRef, constraints }),
        where: (field: string, op: string, value: unknown): Constraint => ({ kind: 'where', field, op, value }),
        orderBy: (field: string, direction: 'asc' | 'desc' = 'asc'): Constraint => ({ kind: 'orderBy', field, direction }),
        limit: (count: number): Constraint => ({ kind: 'limit', count }),
        writeBatch: () => {
            const writes: (() => void)[] = []
            const checks: (() => void)[] = []
            const batch = {
                set: (ref: Ref, data: Data, opts?: { merge?: boolean }) => { writes.push(() => setNow(ref, data, opts)); return batch },
                update: (ref: Ref, data: Data) => { checks.push(() => mustExist(ref)); writes.push(() => updateNow(ref, data)); return batch },
                delete: (ref: Ref) => { writes.push(() => { documents.delete(ref.path) }); return batch },
                commit: async () => { checks.forEach(check => check()); writes.forEach(write => write()) }
            }
            return batch
        },
        serverTimestamp: () => SERVER_TIMESTAMP,
        seed: (path: string, data: Data) => { documents.set(joinPath(path), { ...data }) },
        failNextRead: (error: Error) => { pendingReadError = error },
        peek: (path: string) => documents.get(joinPath(path))
    }
    return store
}
