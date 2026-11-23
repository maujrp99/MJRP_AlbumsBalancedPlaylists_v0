/**
 * batchTransaction - a save of several documents that goes all or nothing, without the database's transaction code
 * (F82, REQ-06 and REQ-08; the judge of 2026-11-23, P2-1).
 *
 * The transaction of the Firestore SDK is a piece of code every visitor of the site would download for a save only the
 * administrator makes. This does the same job with what the store already has: the documents are read, the body decides,
 * and what it writes goes in ONE batch (all the writes or none). The lock is in the rules of the database, not here: a
 * published document is only accepted with `rev` equal to the stored one plus one (firestore.rules, `revFollows`), so a
 * batch computed from a document that another device changed meanwhile is refused whole. Then the body runs again from a
 * fresh read, as a transaction would, and sees the other device's save (a conflict, or its change on top of it).
 *
 * It takes the place of `runTransaction` in the store the repository is given: `(db, body) => Promise<result>`, with a
 * `transaction` that has `get(ref)` and `set(ref, data)`. Use it only for documents whose rules check a sequence like `rev`:
 * without that rule a batch is no lock at all.
 *
 * Pure: no import, no global.
 */

/** How many times a refused batch is read again and tried again before the refusal is handed on. */
export const MAX_ATTEMPTS = 3

const refusedByTheRules = (error) => String(error?.code ?? '').includes('permission-denied')

/**
 * @param {{ getDoc: Function, writeBatch: Function }} store - the store of the side (shared/data/store.js)
 * @returns {(db: Object, body: (transaction: { get: Function, set: Function }) => Promise<*>) => Promise<*>}
 */
export function batchTransaction(store) {
    return async function run(db, body) {
        for (let attempt = 1; ; attempt++) {
            const batch = store.writeBatch(db)
            let writes = 0
            const transaction = {
                get: (ref) => store.getDoc(ref),
                set: (ref, data) => { writes++; batch.set(ref, data); return transaction }
            }
            const result = await body(transaction)
            if (writes === 0) return result
            try {
                await batch.commit()
                return result
            } catch (error) {
                if (!refusedByTheRules(error) || attempt >= MAX_ATTEMPTS) throw error
            }
        }
    }
}
