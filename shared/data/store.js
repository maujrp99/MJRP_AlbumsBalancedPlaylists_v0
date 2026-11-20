/**
 * store - the port through which the repositories of the core reach Firestore (F78, REQ-09, Ref-A).
 *
 * The repositories of shared/data/ know the paths and the shape of the documents; they import no
 * Firestore. Each side hands them a store: the database and the functions of ITS Firestore SDK, with
 * the names and the arguments of the modular Firebase JS SDK. The site builds it from `firebase/firestore`
 * (public/js/repositories/firestoreStore.js); the app will build it from React Native Firebase.
 *
 * Pure: no import, no global.
 */

/** The functions a store hands over, by the name the repositories call them. */
export const STORE_FUNCTIONS = Object.freeze([
    'collection', 'doc', 'getDoc', 'getDocs', 'setDoc', 'updateDoc', 'deleteDoc',
    'query', 'where', 'orderBy', 'limit', 'writeBatch', 'serverTimestamp'
])

/**
 * @typedef {Object} Store
 * @property {Object} db - the Firestore database the functions act on
 * @property {Function} collection
 * @property {Function} doc
 * @property {Function} getDoc
 * @property {Function} getDocs
 * @property {Function} setDoc
 * @property {Function} updateDoc
 * @property {Function} deleteDoc
 * @property {Function} query
 * @property {Function} where
 * @property {Function} orderBy
 * @property {Function} limit
 * @property {Function} writeBatch
 * @property {Function} serverTimestamp
 */

/**
 * The store as given, or an error that says what is missing: a repository built without its store
 * fails when it is made, not at its first write.
 * @param {Store} store
 * @returns {Store}
 */
export function requireStore(store) {
    const missing = store && typeof store === 'object'
        ? STORE_FUNCTIONS.filter(name => typeof store[name] !== 'function')
        : ['the store itself']
    if (missing.length > 0) {
        throw new Error(`A repository needs the Firestore store (shared/data/store.js); missing: ${missing.join(', ')}`)
    }
    return store
}
