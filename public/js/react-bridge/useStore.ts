/**
 * useStore - a React screen reads a store of the site (F83, proposal § 4.3, risk R4).
 *
 * React wants a stable «snapshot» of what it reads; five stores give a new object at each getState() and three give none.
 * The bridge does not use the snapshot: it counts VERSIONS. For each store there is one number, kept here, and one fixed
 * listener subscribed the first time any screen uses the store and never dropped: each notice adds one to the number. A
 * change made between the first draw of a screen and the moment it starts to listen has therefore already moved the number,
 * and React, which compares it once it has subscribed, draws again. The screen reads the same getters as the hand-made ones
 * do, while it draws; no store changes.
 *
 * What this does not cover (the map of each wave audits it): a change with no notice stays invisible, as it is today for
 * the hand-made screens; a list the store changes inside must not be kept by `useMemo` or under `React.memo`; and React
 * draws AFTER the notice, not within it, so code that writes a store and reads the page at once uses `flushSync`.
 */
import { useSyncExternalStore } from 'react'
import { countFixedStoreListener, countListener } from './listeners'

/** What a store of the site has in common: one way to hear it change. The listener may receive the state, or nothing. */
export interface Subscribable {
    subscribe(listener: (...told: unknown[]) => void): unknown
}

interface Watch {
    version: number
    readers: Set<() => void>
    subscribe: (reader: () => void) => () => void
    getVersion: () => number
}

const watches = new WeakMap<object, Watch>()

function watch(store: Subscribable): Watch {
    const known = watches.get(store)
    if (known) return known
    const readers = new Set<() => void>()
    const made: Watch = {
        version: 0,
        readers,
        subscribe: (reader) => {
            readers.add(reader)
            const release = countListener()
            return () => {
                readers.delete(reader)
                release()
            }
        },
        getVersion: () => made.version
    }
    // The fixed listener: it stays for the life of the store, so no change goes unseen between a draw and a subscription.
    store.subscribe(() => {
        made.version += 1
        readers.forEach(reader => reader())
    })
    countFixedStoreListener()
    watches.set(store, made)
    return made
}

/**
 * Reads a store while the screen draws, and draws the screen again when the store tells it changed.
 * @param store - a store of public/js/stores
 * @param read - what the screen reads from it, with the getters of today
 */
export function useStore<S extends Subscribable, R>(store: S, read: (store: S) => R): R {
    const watched = watch(store)
    useSyncExternalStore(watched.subscribe, watched.getVersion)
    return read(store)
}

/**
 * How many notices of the store the bridge has heard. The number goes up at each one, even when what a screen reads is the same. A part
 * of the page that the hand-made code drew anew at each notice (the focus it held gone, what it had open closed) takes this number as its
 * `key`: React makes it again, as the hand-made code did (F83 wave 3, the shell).
 */
export function useNotices(store: Subscribable): number {
    const watched = watch(store)
    return useSyncExternalStore(watched.subscribe, watched.getVersion)
}
