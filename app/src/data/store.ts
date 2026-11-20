/**
 * The data seam of the app (F78, REQ-09; proposal § 4.7): the INTERFACE of the store the shared
 * repositories (shared/data/) are given. It is the same contract the site fulfils with the Firebase
 * JS SDK (public/js/repositories/firestoreStore.js): the database and the 13 functions the
 * repositories call, by the names and arguments of the modular Firestore API
 * (shared/data/store.js, STORE_FUNCTIONS).
 *
 * Two implementations in the app:
 *   memoryStore.ts    in memory: the tests, and the demo mode of the skeleton. PROVED here.
 *   firebaseStore.ts  React Native Firebase: the real one. UNPROVED until spike S2 runs on a device.
 *
 * The types are deliberately loose (`unknown` in, `unknown` out): the repositories are plain
 * JavaScript and treat what the store returns as opaque references and snapshots.
 */
import { STORE_FUNCTIONS, requireStore } from '@album-blender/shared/data/store.js'

type StoreFunction = (...args: any[]) => any  

export interface AppStore {
    db: object
    collection: StoreFunction
    doc: StoreFunction
    getDoc: StoreFunction
    getDocs: StoreFunction
    setDoc: StoreFunction
    updateDoc: StoreFunction
    deleteDoc: StoreFunction
    query: StoreFunction
    where: StoreFunction
    orderBy: StoreFunction
    limit: StoreFunction
    writeBatch: StoreFunction
    serverTimestamp: StoreFunction
}

/** The names the core expects, as the core lists them: a test keeps AppStore and this list equal. */
export const CORE_STORE_FUNCTIONS: readonly string[] = STORE_FUNCTIONS

/** The store as given, or the core's own error naming what is missing. */
export function checkedStore<T extends AppStore>(store: T): T {
    return requireStore(store) as unknown as T
}
