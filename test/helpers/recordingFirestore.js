/**
 * The in-memory Firestore of test/helpers/fakeFirestore.js, with every call written down: which
 * function, with which arguments (a reference by its path, a payload as it would travel), in order.
 * Batches are written down operation by operation, and so is their commit.
 *
 * F78, REQ-09: the repositories moved to shared/data/ must make the SAME calls with the SAME
 * payloads as before the move. test/repositories/writeSequence.test.js runs the same scenarios
 * against this recorder and compares the log with the one recorded on the code before the move.
 *
 * `doc` and `collection` also take the path as several segments (`doc(db, 'users', uid, …)`), as
 * the real SDK does; the fake they wrap takes one path.
 *
 * Use:
 *   vi.mock('firebase/firestore', async () => (await import('../helpers/recordingFirestore.js')).firestoreModule)
 *   import { recorder } from '../helpers/recordingFirestore.js'
 */
import { firestoreModule as fakeModule, fake } from './fakeFirestore.js'

const log = []

/** What an argument looks like in the log: a reference is its path; a function is left out. */
const shown = (value) => {
    if (value === undefined) return '<undefined>'
    if (typeof value === 'function') return '<function>'
    if (value && typeof value === 'object' && (value.kind === 'doc' || value.kind === 'collection')) return `${value.kind}:${value.path}`
    return JSON.parse(JSON.stringify(value))
}
const write = (name, args) => log.push([name, ...args.map(shown)])

export const recorder = {
    reset() { log.length = 0; fake.reset() },
    /** Every call, in order: [name, ...arguments as shown]. */
    calls() { return log.map(entry => [...entry]) },
    /** Put a note in the log (the step of a scenario), so a difference says where it happened. */
    note(text) { log.push(['--', text]) },
    fake
}

const joined = (segments) => segments.filter(s => s !== undefined).join('/')

const collection = (db, ...segments) => ({ kind: 'collection', path: joined(segments) })
const doc = (parent, ...segments) => {
    if (parent?.kind === 'collection') return fakeModule.doc(parent, ...segments)
    const path = joined(segments)
    return { kind: 'doc', id: path.split('/').pop(), path }
}

const recorded = (name, fn) => (...args) => {
    write(name, args)
    return fn(...args)
}

export const firestoreModule = {
    ...fakeModule,
    serverTimestamp: recorded('serverTimestamp', fakeModule.serverTimestamp),
    collection: recorded('collection', collection),
    doc: recorded('doc', doc),
    query: recorded('query', fakeModule.query),
    where: recorded('where', (...args) => ({ where: args })),
    orderBy: recorded('orderBy', (...args) => ({ orderBy: args })),
    limit: recorded('limit', (...args) => ({ limit: args })),
    getDoc: recorded('getDoc', fakeModule.getDoc),
    getDocs: recorded('getDocs', fakeModule.getDocs),
    setDoc: recorded('setDoc', fakeModule.setDoc),
    updateDoc: recorded('updateDoc', fakeModule.updateDoc),
    deleteDoc: recorded('deleteDoc', fakeModule.deleteDoc),
    writeBatch: (...args) => {
        write('writeBatch', args)
        const batch = fakeModule.writeBatch(...args)
        return {
            set: recorded('batch.set', batch.set),
            update: recorded('batch.update', batch.update),
            delete: recorded('batch.delete', batch.delete),
            commit: recorded('batch.commit', batch.commit)
        }
    },
    runTransaction: recorded('runTransaction', fakeModule.runTransaction)
}
