/**
 * firestoreStore - the site's side of the data seam (F78, REQ-09, Ref-A): the store the repositories
 * of the core (shared/data/) are given, made of the Firebase JS SDK's modular functions and the
 * site's database. The repositories import no Firestore; this file and firebase-init.js are the only
 * ones of the site that import `firebase/firestore` (test/architecture/firestoreBehindRepositories.test.js).
 *
 * Each function is passed through as it is called (`(...args) => fn(...args)`), not taken when the
 * store is made: the SDK is reached only when a repository calls it, as before the move.
 */
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, writeBatch, serverTimestamp
} from 'firebase/firestore'

/**
 * @param {Object} db - the site's Firestore database (firebase-init.js), or what a test gives
 * @returns {import('@shared/data/store.js').Store}
 */
export function firestoreStore(db) {
    return {
        db,
        collection: (...args) => collection(...args),
        doc: (...args) => doc(...args),
        getDoc: (...args) => getDoc(...args),
        getDocs: (...args) => getDocs(...args),
        setDoc: (...args) => setDoc(...args),
        updateDoc: (...args) => updateDoc(...args),
        deleteDoc: (...args) => deleteDoc(...args),
        query: (...args) => query(...args),
        where: (...args) => where(...args),
        orderBy: (...args) => orderBy(...args),
        limit: (...args) => limit(...args),
        writeBatch: (...args) => writeBatch(...args),
        serverTimestamp: (...args) => serverTimestamp(...args)
    }
}
