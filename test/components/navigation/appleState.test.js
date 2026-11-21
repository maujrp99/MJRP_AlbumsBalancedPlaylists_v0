/**
 * F88 (judge's P1-1) - the state of Apple Music is asked ONCE in the background, when the page is idle
 * after the first paint, and every place that shows it (the dots on the account button, the panel, the
 * phone's sheet) reads that one answer. Until it is known nothing says «not connected».
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { appleState, askApple, checkAppleWhenIdle, forgetApple, APPLE_STATE_EVENT } from '../../../public/js/components/navigation/appleState.js'

describe('appleState: one answer, asked once', () => {
    let authorized, service, win
    beforeEach(() => {
        forgetApple()
        authorized = false
        service = { isAuthorized: vi.fn(() => authorized), checkAuthorization: vi.fn(async () => authorized) }
        win = new EventTarget()
    })

    it('knows nothing before it is asked, and asking is not done by looking', () => {
        expect(appleState(service)).toBe('unknown')
        expect(service.checkAuthorization).not.toHaveBeenCalled()
    })

    it('pending: says «checking» while the answer is on its way, and asks only once however many ask', async () => {
        let answer
        service.checkAuthorization = vi.fn(() => new Promise(resolve => { answer = resolve }))
        const first = askApple(service, win)
        const second = askApple(service, win)
        expect(appleState(service)).toBe('checking')
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
        authorized = true
        answer(true)
        await Promise.all([first, second])
        expect(appleState(service)).toBe('connected')
    })

    it('authorized on an earlier visit: connected, and it is not asked again', async () => {
        service.checkAuthorization = vi.fn(async () => { authorized = true; return true }) // MusicKit says so once started
        await askApple(service, win)
        await askApple(service, win)
        expect(appleState(service)).toBe('connected')
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
    })

    it('not authorized: disconnected, and it is not asked again', async () => {
        await askApple(service, win)
        await askApple(service, win)
        expect(appleState(service)).toBe('disconnected')
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
    })

    it('failed: says «failed» (never «disconnected»), and the next ask tries again', async () => {
        service.checkAuthorization = vi.fn(async () => { throw new Error('token route down') })
        vi.spyOn(console, 'error').mockImplementation(() => { })
        await askApple(service, win)
        expect(appleState(service)).toBe('failed')
        service.checkAuthorization = vi.fn(async () => true)
        authorized = true
        await askApple(service, win)
        expect(appleState(service)).toBe('connected')
    })

    it('announces the answer, so who shows it can draw it', async () => {
        const heard = vi.fn()
        win.addEventListener(APPLE_STATE_EVENT, heard)
        await askApple(service, win)
        expect(heard).toHaveBeenCalledTimes(1)
    })

    it('a connect or a disconnect after the answer is followed, with no new ask', async () => {
        await askApple(service, win)
        authorized = true
        expect(appleState(service)).toBe('connected')
        authorized = false
        expect(appleState(service)).toBe('disconnected')
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
    })
})

describe('checkAppleWhenIdle: after the first paint, never before', () => {
    let service
    beforeEach(() => {
        forgetApple()
        service = { isAuthorized: () => false, checkAuthorization: vi.fn(async () => false) }
    })

    it('waits for the page to be idle, with a timeout so it does come', () => {
        const win = Object.assign(new EventTarget(), { document: { readyState: 'complete' }, requestIdleCallback: vi.fn() })
        checkAppleWhenIdle(win, service)
        expect(service.checkAuthorization).not.toHaveBeenCalled()
        expect(win.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: expect.any(Number) })
        win.requestIdleCallback.mock.calls[0][0]()
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
    })

    it('without requestIdleCallback (Safari), a short timer does the same', () => {
        vi.useFakeTimers()
        const win = Object.assign(new EventTarget(), { document: { readyState: 'complete' }, setTimeout: (fn, ms) => setTimeout(fn, ms) })
        checkAppleWhenIdle(win, service)
        expect(service.checkAuthorization).not.toHaveBeenCalled()
        vi.runAllTimers()
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
        vi.useRealTimers()
    })

    it('while the page is still loading, nothing is scheduled until it has loaded', () => {
        const win = Object.assign(new EventTarget(), { document: { readyState: 'loading' }, requestIdleCallback: vi.fn() })
        checkAppleWhenIdle(win, service)
        expect(win.requestIdleCallback).not.toHaveBeenCalled()
        win.dispatchEvent(new Event('load'))
        expect(win.requestIdleCallback).toHaveBeenCalledTimes(1)
    })
})
