/**
 * F83 TASK-04: the bridge to the stores (proposal § 4.3). The number of versions lives in the bridge, one per store, with
 * one fixed listener; the screen reads the same getters as today while it draws. Tested in the three shapes of the stores
 * of the site: one that gives a new object from getState() each time (albums), one with no snapshot that tells «the store
 * itself» (saved playlists), and one that tells in a batch, later (album load). For each: the store changes between the
 * first draw and the moment the screen listens, and the screen shows the new value.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useStore } from '../../../public/js/react-bridge/useStore'
import { bridgeListenerCount, fixedStoreListenerCount } from '../../../public/js/react-bridge/listeners'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** The shape of albums.js, inventory.js and UserStore.js: getState() builds a new object each time; notify() tells it. */
class SnapshotStore {
    items: string[] = []
    listeners = new Set<(state: { items: string[] }) => void>()
    getState() { return { items: [...this.items] } }
    set(items: string[]) { this.items = items; this.listeners.forEach(listener => listener(this.getState())) }
    subscribe(listener: (state: { items: string[] }) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
}

/** The shape of savedPlaylists.js: no snapshot is given; the listener is told the store itself. */
class NoSnapshotStore {
    value = 'first'
    listeners = new Set<(store: NoSnapshotStore) => void>()
    set(value: string) { this.value = value; this.listeners.forEach(listener => listener(this)) }
    subscribe(listener: (store: NoSnapshotStore) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
}

/** The shape of albumLoad.js: the change is told once, in a batch, a moment later. */
class BatchStore {
    value = 'first'
    scheduled = false
    listeners = new Set<() => void>()
    set(value: string) {
        this.value = value
        if (this.scheduled) return
        this.scheduled = true
        queueMicrotask(() => { this.scheduled = false; this.listeners.forEach(listener => listener()) })
    }
    subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
}

/** Changes the store after the screen drew and before it listens: a layout effect of a child runs before the passive subscription. */
function ChangesTheStore({ change }: { change: () => void }) {
    useLayoutEffect(() => { change() }, [change])
    return null
}

let root: Root | null = null
let host: HTMLElement | null = null
const mount = async (node: React.ReactNode) => {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    await act(async () => { root!.render(node) })
}
afterEach(async () => {
    if (root) await act(async () => { root!.unmount() })
    host?.remove()
    root = null
    host = null
})

describe('useStore (F83 bridge)', () => {
    it('a store that gives a new object each time: the change between the first draw and the subscription shows', async () => {
        const store = new SnapshotStore()
        const change = () => store.set(['a', 'b'])
        function Screen() {
            const items = useStore(store, current => current.getState().items)
            return <><p id="count">{items.length}</p><ChangesTheStore change={change} /></>
        }
        await mount(<Screen />)
        expect(host!.querySelector('#count')!.textContent).toBe('2')
    })

    it('a store with no snapshot: the change between the first draw and the subscription shows', async () => {
        const store = new NoSnapshotStore()
        const change = () => store.set('second')
        function Screen() {
            const value = useStore(store, current => current.value)
            return <><p id="value">{value}</p><ChangesTheStore change={change} /></>
        }
        await mount(<Screen />)
        expect(host!.querySelector('#value')!.textContent).toBe('second')
    })

    it('a store that tells in a batch: the change shows, and the screen draws again once for the batch', async () => {
        const store = new BatchStore()
        let draws = 0
        function Screen() {
            const value = useStore(store, current => current.value)
            draws += 1
            return <p id="value">{value}</p>
        }
        await mount(<Screen />)
        const before = draws
        await act(async () => { store.set('a'); store.set('b'); store.set('c'); await Promise.resolve() })

        expect(host!.querySelector('#value')!.textContent).toBe('c')
        expect(draws - before).toBe(1)
    })

    it('a change after the screen is on the page draws it again', async () => {
        const store = new SnapshotStore()
        function Screen() {
            const items = useStore(store, current => current.getState().items)
            return <p id="count">{items.length}</p>
        }
        await mount(<Screen />)
        await act(async () => { store.set(['x']) })
        expect(host!.querySelector('#count')!.textContent).toBe('1')
    })

    it('leaving the screen leaves no listener of the screen: the fixed one of the store stays, and is not counted', async () => {
        const store = new SnapshotStore()
        function Screen() {
            useStore(store, current => current.getState())
            return null
        }
        const before = bridgeListenerCount()
        const fixedBefore = fixedStoreListenerCount()
        await mount(<Screen />)
        expect(bridgeListenerCount()).toBe(before + 1)
        expect(store.listeners.size).toBe(1) // the fixed one, subscribed once for every screen that will use the store
        await act(async () => { root!.unmount() })
        root = null
        expect(bridgeListenerCount()).toBe(before)
        expect(fixedStoreListenerCount()).toBe(fixedBefore + 1)
        expect(store.listeners.size).toBe(1)
    })

    it('two screens on the same store share the one fixed listener', async () => {
        const store = new NoSnapshotStore()
        function Screen() {
            useStore(store, current => current.value)
            return null
        }
        await mount(<><Screen /><Screen /></>)
        expect(store.listeners.size).toBe(1)
    })
})
