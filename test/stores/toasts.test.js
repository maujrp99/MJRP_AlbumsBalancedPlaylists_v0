/**
 * The notices and the loading bar of the site (F83 wave 8b; stores/toasts.js and stores/progress.js, drawn by shell/Toasts.tsx and shell/GlobalProgress.tsx).
 * What they draw, to the millisecond, is kept against the hand-made engines in test/ui/engines.sameAsBefore.test.tsx; here is what the doors for code that is
 * not a component promise: the API the controllers and services call, and the clocks.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import siteToast, { toast as namedToast, showToast as siteShowToast, toasts as siteToasts, createToasts } from '../../public/js/stores/toasts.js'
import { globalProgress, createProgress } from '../../public/js/stores/progress.js'

beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] }) })
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers() })

describe('toasts: the door for controllers and services', () => {
    it('the site has one list, reached by the default export, `toast` and `showToast`', () => {
        expect(siteToast).toBe(namedToast)
        expect(Object.keys(namedToast).sort()).toEqual(['error', 'info', 'success', 'warning'])
        expect(typeof siteShowToast).toBe('function')
        expect(typeof siteToasts.subscribe).toBe('function')
    })

    it('each kind makes a notice of its own kind, with the text given, and hands back an id', () => {
        const store = createToasts()
        const ids = [store.toast.success('a'), store.toast.error('b'), store.toast.warning('c'), store.toast.info('d'), store.showToast('e')]

        expect(new Set(ids).size).toBe(5)
        expect(store.getState().notices.map(({ message, type }) => `${type}:${message}`)).toEqual(['success:a', 'error:b', 'warning:c', 'info:d', 'info:e'])
        expect(store.getState().everShown).toBe(true)
    })

    it('a notice is in on the next frame, out after 4 s, and gone 300 ms later; a duration of its own replaces the 4 s', () => {
        const store = createToasts()
        store.toast.info('default')
        store.toast.info('short', 1000)
        expect(store.getState().notices.map(n => n.shown)).toEqual([false, false])

        vi.advanceTimersByTime(16)
        expect(store.getState().notices.map(n => n.shown)).toEqual([true, true])
        vi.advanceTimersByTime(984)
        expect(store.getState().notices.map(n => n.shown)).toEqual([true, false])
        vi.advanceTimersByTime(300)
        expect(store.getState().notices.map(n => n.message)).toEqual(['default'])
        vi.advanceTimersByTime(2699)
        expect(store.getState().notices.map(n => n.shown)).toEqual([true])
        vi.advanceTimersByTime(1)
        expect(store.getState().notices.map(n => n.shown)).toEqual([false])
        vi.advanceTimersByTime(300)
        expect(store.getState().notices).toEqual([])
        expect(store.getState().everShown).toBe(true)
    })

    it('dismissing twice, or a notice that is gone, does nothing', () => {
        const store = createToasts()
        const id = store.toast.error('x')
        store.dismiss(id)
        store.dismiss(id)
        vi.advanceTimersByTime(300)
        expect(store.getState().notices).toEqual([])
        expect(() => store.dismiss(id)).not.toThrow()
    })

    it('whoever listens is told of each change, and stops when it lets go', () => {
        const store = createToasts()
        const heard = vi.fn()
        const stop = store.subscribe(heard)
        store.toast.info('x')
        const afterOne = heard.mock.calls.length
        expect(afterOne).toBeGreaterThan(0)

        stop()
        store.toast.info('y')
        expect(heard.mock.calls.length).toBe(afterOne)
    })
})

describe('progress: the bar of the site', () => {
    it('shows with the first loader and hides 200 ms after the last one, whatever the extra calls to finish', () => {
        const bar = createProgress()
        expect(bar.getState().visible).toBe(false)
        bar.start()
        bar.start()
        expect(bar.getState().visible).toBe(true)
        expect(bar.isActive()).toBe(true)

        bar.finish()
        vi.advanceTimersByTime(500)
        expect(bar.getState().visible).toBe(true)
        bar.finish()
        bar.finish()
        expect(bar.isActive()).toBe(false)
        vi.advanceTimersByTime(199)
        expect(bar.getState().visible).toBe(true)
        vi.advanceTimersByTime(1)
        expect(bar.getState().visible).toBe(false)
    })

    it('a loader that starts inside the 200 ms keeps the bar, and forceHide hides it at once', () => {
        const bar = createProgress()
        bar.start()
        bar.finish()
        vi.advanceTimersByTime(100)
        bar.start()
        vi.advanceTimersByTime(300)
        expect(bar.getState().visible).toBe(true)

        bar.forceHide()
        expect(bar.getState().visible).toBe(false)
        expect(bar.isActive()).toBe(false)
    })

    it('the site has one bar', () => {
        expect(typeof globalProgress.start).toBe('function')
        expect(globalProgress.isActive()).toBe(false)
    })
})
