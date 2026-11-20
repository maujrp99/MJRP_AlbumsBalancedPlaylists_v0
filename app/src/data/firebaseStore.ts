/**
 * UNPROVED — the React Native Firebase store (F78, ADR-0022: Firebase through the native SDK).
 *
 * The store interface (./store.ts) made of @react-native-firebase/firestore's modular functions and
 * the default app's database, written against the package's documented API
 * (https://rnfirebase.io/firestore/usage: `getFirestore`, `collection`, `doc`, `getDoc`, `getDocs`,
 * `query`, `where`, `orderBy`, `limit`, `setDoc`, `updateDoc`, `deleteDoc`, `serverTimestamp`,
 * `writeBatch`; offline persistence on by default on native platforms) and checked here only by the
 * TypeScript compiler and by Metro resolving it in `expo export`.
 *
 * NOT run anywhere yet. It is proved, or replaced, by spike S2 on a device (tasks.md, TASK-10): that
 * the shared repositories work with these functions handed in, auto-id `doc(collectionRef)`
 * included, and that a write made with no network survives closing the app. Until then the app runs
 * in demo mode (the in-memory store) unless built with EXPO_PUBLIC_DATA_MODE=firebase.
 *
 * This is the ONLY file of the app that imports @react-native-firebase/firestore
 * (src/data/__tests__/nativePackagesStayInTheirAdapters.test.ts). It is loaded lazily by the
 * composition root, so the demo build never runs it.
 */
import {
    getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, writeBatch, serverTimestamp
} from '@react-native-firebase/firestore'
import type { AppStore } from './store'

export function firebaseStore(): AppStore {
    return {
        db: getFirestore(),
        collection: (...args: Parameters<typeof collection>) => collection(...args),
        doc: (...args: Parameters<typeof doc>) => doc(...args),
        getDoc: (...args: Parameters<typeof getDoc>) => getDoc(...args),
        getDocs: (...args: Parameters<typeof getDocs>) => getDocs(...args),
        setDoc: (...args: Parameters<typeof setDoc>) => setDoc(...args),
        updateDoc: (...args: Parameters<typeof updateDoc>) => updateDoc(...args),
        deleteDoc: (...args: Parameters<typeof deleteDoc>) => deleteDoc(...args),
        query: (...args: Parameters<typeof query>) => query(...args),
        where: (...args: Parameters<typeof where>) => where(...args),
        orderBy: (...args: Parameters<typeof orderBy>) => orderBy(...args),
        limit: (...args: Parameters<typeof limit>) => limit(...args),
        writeBatch: (...args: Parameters<typeof writeBatch>) => writeBatch(...args),
        serverTimestamp: () => serverTimestamp()
    }
}
