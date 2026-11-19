/**
 * A small in-memory double of the modular `firebase/firestore` API, for tests that must look at
 * what is left in the database after a write fails.
 *
 * - documents live in one Map, keyed by their full path;
 * - `writeBatch` is atomic: either every operation of the batch lands or none does;
 * - every call that would go to the network takes a turn of the event loop, so two operations
 *   started together overlap as they do in the browser;
 * - `fake.failNext(kind)` makes the next call of that kind reject ('commit', 'set', 'delete', 'update', 'read');
 *   `fake.failNext('read', error, { path })` fails only the next read of that path;
 * - `fake.reads()` lists every read that reached the database, in order, and `fake.maxReadsAtOnce()`
 *   says how many were in the air together (to count round trips and prove a limit);
 * - `fake.holdNext('commit')` keeps the next batch in the air until the test releases it, to act
 *   while a write is on its way.
 *
 * Use:
 *   vi.mock('firebase/firestore', async () => (await import('../helpers/fakeFirestore.js')).firestoreModule)
 *   import { fake } from '../helpers/fakeFirestore.js'
 */

const docs = new Map()
const failures = []
const holds = []
const log = []
const readLog = []
let readsInFlight = 0
let maxReadsInFlight = 0
let autoId = 0

const network = () => new Promise(resolve => setTimeout(resolve, 0))
const clone = (value) => JSON.parse(JSON.stringify(value))
const notFound = (path) => Object.assign(new Error(`No document to update: ${path}`), { code: 'not-found' })

const takeFailure = (kind, path) => {
    const at = failures.findIndex(f => f.kind === kind && (!f.path || f.path === path))
    if (at === -1) return null
    const [failure] = failures.splice(at, 1)
    return failure.error
}

const passHold = async (kind) => {
    const at = holds.findIndex(h => h.kind === kind)
    if (at === -1) return
    const [hold] = holds.splice(at, 1)
    hold.markReached()
    await hold.released
}

const applySet = (path, data, options) => {
    const merged = options?.merge && docs.has(path) ? { ...docs.get(path), ...clone(data) } : clone(data)
    docs.set(path, merged)
}

export const fake = {
    reset() {
        docs.clear()
        failures.length = 0
        holds.length = 0
        log.length = 0
        readLog.length = 0
        readsInFlight = 0
        maxReadsInFlight = 0
        autoId = 0
    },
    /** Put a document in place, as if it had been written before the test. */
    seed(path, data) { docs.set(path, clone(data)) },
    get(path) { return docs.has(path) ? clone(docs.get(path)) : null },
    /** The documents directly under a collection path, as `{ id, ...data }`. */
    list(collectionPath) {
        const prefix = `${collectionPath}/`
        return [...docs.entries()]
            .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
            .map(([path, data]) => ({ id: path.slice(prefix.length), ...clone(data) }))
    },
    failNext(kind, error = new Error(`fake firestore: ${kind} failed`), { path = null } = {}) {
        failures.push({ kind, error, path })
    },
    /**
     * Keep the next write of that kind in the air. `reached` resolves when the write arrives;
     * `release()` lets it go on.
     */
    holdNext(kind) {
        let markReached, release
        const reached = new Promise(resolve => { markReached = resolve })
        const released = new Promise(resolve => { release = resolve })
        holds.push({ kind, markReached, released })
        return { reached, release }
    },
    /** Every write that reached the database, in order: 'set', 'delete', 'update' or 'commit'. */
    writes() { return [...log] },
    /** Every read that reached the database, in order: the path of the collection or document asked for. */
    reads() { return [...readLog] },
    /** The largest number of reads that were in the air at the same time. */
    maxReadsAtOnce() { return maxReadsInFlight }
}

/** One read: counted, in the air for a turn of the event loop (or until a hold is released), then answered or failed. */
const read = async (path) => {
    readLog.push(path)
    readsInFlight++
    maxReadsInFlight = Math.max(maxReadsInFlight, readsInFlight)
    try {
        await network()
        await passHold('read')
        const error = takeFailure('read', path)
        if (error) throw error
    } finally {
        readsInFlight--
    }
}

const snapshot = (path) => ({
    id: path.split('/').pop(),
    exists: () => docs.has(path),
    data: () => fake.get(path)
})

export const firestoreModule = {
    getFirestore: () => ({ fake: true }),
    serverTimestamp: () => 'server-time',
    collection: (db, path) => ({ kind: 'collection', path }),
    doc: (parent, path, id) => {
        if (parent?.kind === 'collection') {
            const docId = path || `auto-${++autoId}`
            return { kind: 'doc', id: docId, path: `${parent.path}/${docId}` }
        }
        return { kind: 'doc', id, path: `${path}/${id}` }
    },
    query: (collectionRef) => collectionRef,
    where: () => null,
    orderBy: () => null,
    limit: () => null,
    startAfter: () => null,
    getDoc: async (ref) => {
        await read(ref.path)
        return snapshot(ref.path)
    },
    getDocs: async (collectionRef) => {
        await read(collectionRef.path)
        return { docs: fake.list(collectionRef.path).map(({ id }) => snapshot(`${collectionRef.path}/${id}`)) }
    },
    setDoc: async (ref, data, options) => {
        await network()
        const error = takeFailure('set')
        if (error) throw error
        applySet(ref.path, data, options)
        log.push('set')
    },
    addDoc: async (collectionRef, data) => {
        const ref = firestoreModule.doc(collectionRef)
        await firestoreModule.setDoc(ref, data)
        return ref
    },
    updateDoc: async (ref, data) => {
        await network()
        const error = takeFailure('update')
        if (error) throw error
        if (!docs.has(ref.path)) throw notFound(ref.path)
        applySet(ref.path, data, { merge: true })
        log.push('update')
    },
    deleteDoc: async (ref) => {
        await network()
        const error = takeFailure('delete')
        if (error) throw error
        docs.delete(ref.path)
        log.push('delete')
    },
    writeBatch: () => {
        const operations = []
        return {
            set: (ref, data, options) => { operations.push({ type: 'set', ref, data, options }) },
            update: (ref, data) => { operations.push({ type: 'update', ref, data }) },
            delete: (ref) => { operations.push({ type: 'delete', ref }) },
            commit: async () => {
                await network()
                await passHold('commit')
                const error = takeFailure('commit')
                if (error) throw error
                // all or nothing: an update of a missing document refuses the whole batch
                const missing = operations.find(op => op.type === 'update' && !docs.has(op.ref.path))
                if (missing) throw notFound(missing.ref.path)
                for (const op of operations) {
                    if (op.type === 'delete') docs.delete(op.ref.path)
                    else applySet(op.ref.path, op.data, op.type === 'update' ? { merge: true } : op.options)
                }
                log.push('commit')
            }
        }
    },
    runTransaction: async () => { throw new Error('fake firestore: runTransaction is not implemented') },
    Timestamp: {}
}
