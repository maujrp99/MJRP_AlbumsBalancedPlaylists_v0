/**
 * renderScreen - the scaffold for the tests of the screens in React (F83, TASK-07; proposal § 9.2).
 *
 * A test of a screen that was hand-made reads the DOM by selector and says what it holds. The same test of the same screen
 * in React is taken over with this: the screen is mounted the way production mounts it (through ReactView, which opens a
 * root in #app, with the strict mode and the error barrier), every change goes through `act`, and the test goes on reading
 * the DOM with `querySelector`. What changes is the scaffold, never the assertion. It is about 30 lines of logic, on
 * purpose: no testing library, whose queries (by role, by text) would change what the old tests assert.
 *
 * `itLeavesNoListeners` is the mold of the test every screen has (test/architecture/everyScreenHasTheLeaveTest.test.js
 * asks for it in each folder of screens/): enter and leave five times, and nothing of the screen is still listening: not the
 * stores, the language or the phone (the count of the bridge), and not the window.
 */
import { act, type ComponentType } from 'react'
import { it, expect } from 'vitest'
import { ReactView, type RouteParams, type ScreenProps } from '../../public/js/react-bridge/ReactView'
import { bridgeListenerCount } from '../../public/js/react-bridge/listeners'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

export interface RenderOptions {
    /** The name of the screen in the measurement of use (shared/usageEvents.js SCREENS). */
    screen?: string
    /** What the router would hand the screen (the params of the route and `query`). */
    params?: RouteParams
}

export interface RenderedScreen {
    /** The #app the screen is drawn in; read it with querySelector, as the old tests did. */
    app: HTMLElement
    /** Runs a change that may draw the screen again (a click, a store set, a typed letter) and lets React finish. */
    act: (change: () => void | Promise<void>) => Promise<void>
    /** Leaves the screen the way the router does (destroy) and takes #app away. */
    leave: () => Promise<void>
}

/** Mounts a screen in a fresh #app, as the router does: render(), then mount(params). */
export async function renderScreen<P extends object>(Screen: ComponentType<P & ScreenProps>, props: P, options: RenderOptions = {}): Promise<RenderedScreen> {
    const app = document.createElement('div')
    app.id = 'app'
    document.body.appendChild(app)
    const view = new ReactView(Screen, props, { screen: options.screen ?? 'coming_soon' })
    await act(async () => {
        view.render()
        view.mount(options.params ?? {})
    })
    return {
        app,
        act: (change) => act(async () => { await change() }),
        leave: async () => {
            await act(async () => { view.destroy() })
            app.remove()
        }
    }
}

/** Counts the listeners added to and removed from `window` while `work` runs; what is left is what leaked. */
async function windowListenersLeftBy(work: () => Promise<void>): Promise<number> {
    const live = new Set<string>()
    const ids = new WeakMap<object, number>()
    let next = 0
    const key = (type: string, listener: unknown, capture: unknown) => {
        const target = listener as object
        if (!ids.has(target)) ids.set(target, next++)
        return `${type}:${ids.get(target)}:${Boolean(typeof capture === 'object' ? (capture as { capture?: boolean })?.capture : capture)}`
    }
    const add = window.addEventListener
    const remove = window.removeEventListener
    window.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        live.add(key(type, listener, options))
        return add.call(window, type, listener, options)
    } as typeof window.addEventListener
    window.removeEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
        live.delete(key(type, listener, options))
        return remove.call(window, type, listener, options)
    } as typeof window.removeEventListener
    try {
        await work()
    } finally {
        window.addEventListener = add
        window.removeEventListener = remove
    }
    return live.size
}

export interface LeaveReport {
    /** Listeners of the bridge (stores, language, phone) still live after the last leave. */
    bridge: number
    /** Listeners on `window` added by the screen and not removed. */
    window: number
    /** Screens still in the page after the last leave. */
    screens: number
}

/** Enters and leaves `times` times and says what is left behind. */
export async function leaveReport<P extends object>(Screen: ComponentType<P & ScreenProps>, props: P, options: RenderOptions = {}, times = 5): Promise<LeaveReport> {
    const before = bridgeListenerCount()
    const left = await windowListenersLeftBy(async () => {
        for (let visit = 0; visit < times; visit++) {
            const rendered = await renderScreen(Screen, props, options)
            await rendered.leave()
        }
    })
    return { bridge: bridgeListenerCount() - before, window: left, screens: document.querySelectorAll('#app').length }
}

/** The test every screen in React has: enter and leave five times and leave zero listeners of the screen. */
export function itLeavesNoListeners<P extends object>(name: string, Screen: ComponentType<P & ScreenProps>, props: P, options: RenderOptions = {}): void {
    it(`${name}: entering and leaving five times leaves zero listeners of the screen`, async () => {
        const report = await leaveReport(Screen, props, options, 5)
        expect(report).toEqual({ bridge: 0, window: 0, screens: 0 })
    })
}
