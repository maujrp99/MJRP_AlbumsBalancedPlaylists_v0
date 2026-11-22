/**
 * The scaffold of the tests of the inventory screen in React (F83 wave 6a). The tests of the hand-made screen opened `new InventoryView()` and read the
 * DOM by selector; the same tests of the same screen are taken over with this: the screen is opened the way the router opens it (`inventoryParts()`:
 * the view, the controller and the bridge), every change goes through `act`, and the test goes on reading the DOM with `querySelector`. What
 * changes is the scaffold, never the assertion.
 *
 *   openInventory(items, { phone, choice })   what the old `open()` of each test did: the phone or the computer, the view chosen, the store filled,
 *                                             the screen mounted and the values of the controller asked
 *   press(element)                            a click (or any change) and what React draws after it
 *   run(change)                               a call to the controller (a filter, an order, a view) and what React draws after it
 *   draw(element)                             a piece of the screen on its own, in a box on the page
 */
import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { inventoryParts } from '../../public/js/screens/inventory/index'
import { viewItem } from '../../public/js/screens/inventory/inventoryActions'
import { inventoryStore } from '../../public/js/stores/inventory.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const tick = () => new Promise(resolve => setImmediate(resolve))

/** The screen of the phone as the screen reads it. */
export function stubScreen(phone: boolean): void {
    window.matchMedia = ((query: string) => ({
        matches: query === '(max-width: 899px)' ? phone : query.includes('prefers-reduced-motion'),
        addEventListener() { },
        removeEventListener() { }
    })) as unknown as typeof window.matchMedia
}

export interface OpenOptions {
    phone?: boolean
    choice?: string | null
}

export interface OpenScreen {
    controller: ReturnType<typeof inventoryParts>['controller'] & Record<string, any>
    bridge: ReturnType<typeof inventoryParts>['bridge']
    destroy: () => Promise<void>
    /** The window of the album, opened as the screen opens it (a tap on a card, a row or «Open album»). */
    handleViewWithModal: (albumId: string) => Promise<void>
    /** What the controller says to the screen when the button «Add the albums of my series» changes. */
    showSeriesAdd: (seriesAdd: object) => Promise<void>
    showRatings: (ratings: object) => Promise<void>
}

/** Opens the inventory with `items` in the store, as the router would. */
export async function openInventory(items: object[], { phone = true, choice = null }: OpenOptions = {}): Promise<OpenScreen> {
    stubScreen(phone)
    if (choice) localStorage.setItem('mjrp_inventory_view_mode', choice)
    document.body.innerHTML = '<div id="app"></div>'
    inventoryStore.setAlbums(items)
    const parts = inventoryParts()
    await act(async () => {
        await parts.view.render({})
        parts.view.mount({})
    })
    await act(async () => { await (parts.controller as unknown as { valuesOpened: Promise<unknown> }).valuesOpened; for (let i = 0; i < 4; i++) await tick() })
    return {
        controller: parts.controller as OpenScreen['controller'],
        bridge: parts.bridge,
        destroy: async () => { await act(async () => { parts.view.destroy() }) },
        handleViewWithModal: (albumId) => viewItem(parts.controller, parts.bridge, albumId),
        showSeriesAdd: (seriesAdd) => run(() => (parts.controller as any)._showSeriesAdd(seriesAdd)),
        showRatings: (ratings) => run(() => (parts.controller as any)._showRatings(ratings))
    }
}

/** A click, or any change a test makes to the page, and what React draws after it. */
export async function press(change: HTMLElement | (() => void)): Promise<void> {
    await act(async () => {
        if (typeof change === 'function') change(); else change.click()
        for (let i = 0; i < 4; i++) await tick()
    })
}

/** A call to the controller (or to anything that may draw the screen again), and what React draws after it. */
export async function run(change: () => unknown): Promise<void> {
    await act(async () => { await change(); for (let i = 0; i < 4; i++) await tick() })
}

/** Waits for what is in flight to settle (a call that was started and not awaited). */
export async function settle(): Promise<void> {
    await act(async () => { for (let i = 0; i < 6; i++) await tick() })
}

/** The way a browser writes into a field React owns, and tells it. */
export function write(field: HTMLInputElement | HTMLSelectElement, value: string, event = 'input'): void {
    const proto = field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(field, value)
    field.dispatchEvent(new Event(event, { bubbles: true }))
}

const roots: Root[] = []

/** A piece of the screen on its own, in a box of the page (taken away by `undraw`). */
export async function draw(element: ReactElement): Promise<HTMLElement> {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    roots.push(root)
    await act(async () => { root.render(element) })
    return host
}

/** Takes away every piece `draw` put on the page. */
export async function undraw(): Promise<void> {
    await act(async () => { roots.splice(0).forEach(root => root.unmount()) })
}
